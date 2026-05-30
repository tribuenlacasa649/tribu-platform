"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { confirmPublicGuestPayment, formatMoney, getSuggestedPaymentAmount } from "../../../../lib/payments";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { getPublicTicketUrl } from "../../../../lib/tickets";
import { createTicketWhatsAppMessage, createWhatsAppUrl } from "../../../../lib/whatsapp";
import type { EventRecord, PaymentStatus, PublicGuestRecord, TicketRecord } from "../../../../types/database";

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  notified: "Avisado",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

const paymentTone: Record<PaymentStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  notified: "warning",
  confirmed: "success",
  rejected: "danger",
};

function getAbsoluteTicketUrl(token: string) {
  if (typeof window === "undefined") {
    return getPublicTicketUrl(token);
  }

  return `${window.location.origin}/ticket/${token}`;
}

export default function PaymentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [requests, setRequests] = useState<PublicGuestRecord[]>([]);
  const [ticketsByPublicGuest, setTicketsByPublicGuest] = useState<Record<string, TicketRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState("");
  const [error, setError] = useState("");

  async function loadTicketsForRequests(publicGuests: PublicGuestRecord[]) {
    const ids = publicGuests.map((request) => request.id);

    if (!ids.length) {
      setTicketsByPublicGuest({});
      return;
    }

    const { data } = await supabase
      .from("tickets")
      .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at")
      .in("public_guest_id", ids)
      .order("created_at", { ascending: true });

    const grouped = ((data ?? []) as TicketRecord[]).reduce<Record<string, TicketRecord[]>>(
      (acc, ticket) => {
        if (!ticket.public_guest_id) {
          return acc;
        }

        acc[ticket.public_guest_id] = [...(acc[ticket.public_guest_id] ?? []), ticket];
        return acc;
      },
      {}
    );

    setTicketsByPublicGuest(grouped);
  }

  async function loadPayments() {
    const [eventResult, requestsResult] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, description, location, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
        .eq("id", params.id)
        .single(),
      supabase
        .from("public_guests")
        .select("id, event_id, full_name, phone, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, payment_reference, payment_proof, payment_proof_file_url, payment_notified_at, payment_confirmed_at, internal_guest_id, created_at")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

    if (eventResult.error) {
      setError(eventResult.error.message);
    } else {
      setEvent(eventResult.data as EventRecord);
    }

    if (requestsResult.error) {
      setError(requestsResult.error.message);
    } else {
      const publicGuests = (requestsResult.data ?? []) as PublicGuestRecord[];
      setRequests(publicGuests);
      await loadTicketsForRequests(publicGuests);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialPayments() {
      const [eventResult, requestsResult] = await Promise.all([
        supabase
          .from("events")
          .select("id, name, description, location, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
          .eq("id", params.id)
          .single(),
        supabase
          .from("public_guests")
          .select("id, event_id, full_name, phone, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, payment_reference, payment_proof, payment_proof_file_url, payment_notified_at, payment_confirmed_at, internal_guest_id, created_at")
          .eq("event_id", params.id)
          .order("created_at", { ascending: false }),
      ]);

      if (eventResult.error) {
        setError(eventResult.error.message);
      } else {
        setEvent(eventResult.data as EventRecord);
      }

      if (requestsResult.error) {
        setError(requestsResult.error.message);
      } else {
        const publicGuests = (requestsResult.data ?? []) as PublicGuestRecord[];
        setRequests(publicGuests);

        const ids = publicGuests.map((request) => request.id);

        if (ids.length) {
          const { data } = await supabase
            .from("tickets")
            .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at")
            .in("public_guest_id", ids)
            .order("created_at", { ascending: true });

          const grouped = ((data ?? []) as TicketRecord[]).reduce<Record<string, TicketRecord[]>>(
            (acc, ticket) => {
              if (!ticket.public_guest_id) {
                return acc;
              }

              acc[ticket.public_guest_id] = [...(acc[ticket.public_guest_id] ?? []), ticket];
              return acc;
            },
            {}
          );
          setTicketsByPublicGuest(grouped);
        }
      }

      setIsLoading(false);
    }

    loadInitialPayments();
  }, [params.id, supabase]);

  async function confirmPayment(request: PublicGuestRecord) {
    setError("");
    setActiveId(request.id);

    try {
      await confirmPublicGuestPayment(supabase, request, event);
      await loadPayments();
      router.refresh();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "No se pudo confirmar.");
    } finally {
      setActiveId("");
    }
  }

  async function setPaymentStatus(request: PublicGuestRecord, status: PaymentStatus) {
    setError("");
    setActiveId(request.id);

    const { error: requestError } = await supabase
      .from("public_guests")
      .update({
        payment_status: status,
        payment_confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
        status: status === "confirmed" ? "approved" : request.status,
      })
      .eq("id", request.id);

    if (requestError) {
      setError(requestError.message);
      setActiveId("");
      return;
    }

    await loadPayments();
    setActiveId("");
    router.refresh();
  }

  const counts = {
    pending: requests.filter((request) => request.payment_status === "pending").length,
    notified: requests.filter((request) => request.payment_status === "notified").length,
    confirmed: requests.filter((request) => request.payment_status === "confirmed").length,
    rejected: requests.filter((request) => request.payment_status === "rejected").length,
  };

  return (
    <AppShell title="Pagos">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pagos</h1>
          <p className="mt-2 text-sm text-zinc-400">Validación manual, QR y WhatsApp.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {(["pending", "notified", "confirmed", "rejected"] as PaymentStatus[]).map((status) => (
            <div key={status} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-zinc-500">{paymentLabels[status]}</p>
              <p className="mt-2 text-3xl font-semibold">{counts[status]}</p>
            </div>
          ))}
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando pagos...
          </div>
        ) : requests.length === 0 ? (
          <EmptyState title="Sin solicitudes" description="Todavia no hay reservas publicas." />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {requests.map((request) => {
              const amount = getSuggestedPaymentAmount(request, event);
              const tickets = ticketsByPublicGuest[request.id] ?? [];
              const ticketUrls = tickets.map((ticket) => getAbsoluteTicketUrl(ticket.token));
              const whatsappMessage = createTicketWhatsAppMessage(request.full_name, ticketUrls);
              const whatsappUrl = ticketUrls.length
                ? createWhatsAppUrl(request.phone, whatsappMessage)
                : "";

              return (
                <article
                  key={request.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{request.full_name}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{request.phone}</p>
                    </div>
                    <Badge tone={paymentTone[request.payment_status]}>
                      {paymentLabels[request.payment_status]}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-zinc-500">Entradas / monto</p>
                      <p className="mt-1 font-semibold">
                        {request.ticket_quantity} · {formatMoney(amount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-zinc-500">Referencia</p>
                      <p className="mt-1 break-words font-semibold">
                        {request.payment_reference || "Sin referencia"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-zinc-500">Comprobante</p>
                      <p className="mt-1 break-words font-semibold">
                        {request.payment_proof || "Sin texto"}
                      </p>
                      {request.payment_proof_file_url ? (
                        <a
                          href={request.payment_proof_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block font-semibold text-emerald-300"
                        >
                          Ver imagen
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => confirmPayment(request)}
                      disabled={activeId === request.id}
                      className="min-h-11 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition disabled:opacity-60"
                    >
                      {activeId === request.id ? "Procesando..." : "Confirmar y generar QR"}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentStatus(request, "pending")}
                        disabled={activeId === request.id}
                        className="min-h-11 rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-100"
                      >
                        Pendiente
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentStatus(request, "rejected")}
                        disabled={activeId === request.id}
                        className="min-h-11 rounded-lg bg-red-500 px-3 text-sm font-semibold text-white"
                      >
                        Rechazar
                      </button>
                    </div>

                    {ticketUrls.length ? (
                      <div className="grid gap-2 rounded-lg border border-white/10 p-3">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-zinc-950"
                        >
                          Enviar QR por WhatsApp
                        </a>
                        <CopyButton value={whatsappMessage} label="Copiar mensaje" />
                        <CopyButton value={ticketUrls[0]} label="Copiar link ticket" />
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
