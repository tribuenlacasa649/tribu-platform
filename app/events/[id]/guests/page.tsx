"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge, guestStatusTone } from "../../../../components/Badge";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { getPublicTicketUrl } from "../../../../lib/tickets";
import { createTicketWhatsAppMessage, createWhatsAppUrl } from "../../../../lib/whatsapp";
import type { GuestRecord, PaymentStatus, PublicGuestRecord, TicketRecord } from "../../../../types/database";
import { guestStatusLabels } from "../../actions";
import { DeleteGuestButton } from "./GuestActions";

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

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [publicGuests, setPublicGuests] = useState<PublicGuestRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGuests = useCallback(async () => {
    const [guestsResult, publicGuestsResult, ticketsResult] = await Promise.all([
      supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("event_id", params.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false }),
      supabase
        .from("public_guests")
        .select("id, event_id, full_name, phone, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, payment_reference, payment_proof, payment_proof_file_url, payment_notified_at, payment_confirmed_at, internal_guest_id, created_at")
        .eq("event_id", params.id),
      supabase
        .from("tickets")
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at")
        .eq("event_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (guestsResult.error || publicGuestsResult.error || ticketsResult.error) {
      setError(guestsResult.error?.message || publicGuestsResult.error?.message || ticketsResult.error?.message || "");
    } else {
      setGuests((guestsResult.data ?? []) as GuestRecord[]);
      setPublicGuests((publicGuestsResult.data ?? []) as PublicGuestRecord[]);
      setTickets((ticketsResult.data ?? []) as TicketRecord[]);
    }

    setIsLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    async function loadInitialGuests() {
      await loadGuests();
    }

    loadInitialGuests();
  }, [loadGuests]);

  function getPublicGuestForGuest(guestId: string) {
    return publicGuests.find((publicGuest) => publicGuest.internal_guest_id === guestId) ?? null;
  }

  function getTicketsForGuest(guestId: string, publicGuestId?: string | null) {
    return tickets.filter(
      (ticket) =>
        ticket.guest_id === guestId || (publicGuestId ? ticket.public_guest_id === publicGuestId : false)
    );
  }

  return (
    <AppShell title="Invitados">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <header className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
              Evento / Invitados
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Invitados</h1>
          </div>
          <Link
            href={`/events/${params.id}/guests/new`}
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
          >
            Nuevo invitado
          </Link>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando invitados...
          </div>
        ) : guests.length === 0 ? (
          <EmptyState
            title="Sin invitados"
            description="Agrega invitados para este evento."
            actionHref={`/events/${params.id}/guests/new`}
            actionLabel="Nuevo invitado"
          />
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {guests.map((guest) => {
              const publicGuest = getPublicGuestForGuest(guest.id);
              const guestTickets = getTicketsForGuest(guest.id, publicGuest?.id);
              const ticketUrls = guestTickets.map((ticket) => getPublicTicketUrl(ticket.token));
              const whatsappMessage = createTicketWhatsAppMessage(guest.name, ticketUrls);
              const whatsappUrl = guest.contact && ticketUrls.length
                ? createWhatsAppUrl(guest.contact, whatsappMessage)
                : "";

              return (
              <details
                key={guest.id}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{guest.name}</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {guest.contact || "Sin contacto"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={guestStatusTone(guest.status)}>
                        {guestStatusLabels[guest.status]}
                      </Badge>
                      {publicGuest ? (
                        <Badge tone={paymentTone[publicGuest.payment_status]}>
                          Pago {paymentLabels[publicGuest.payment_status]}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <span className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 group-open:bg-white/10">
                    Detalle
                  </span>
                </summary>

                <div className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-xs text-zinc-500">Preferencia</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {guest.food_preferences || "Sin preferencia"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-xs text-zinc-500">Entradas</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {guest.ticket_quantity} solicitadas · {guestTickets.length} QR
                    </p>
                  </div>
                  {guest.notes ? (
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-xs text-zinc-500">Notas</p>
                      <p className="mt-1 font-medium text-zinc-100">{guest.notes}</p>
                    </div>
                  ) : null}
                  {publicGuest ? (
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-xs text-zinc-500">Pago</p>
                      <p className="mt-1 font-medium text-zinc-100">
                        {paymentLabels[publicGuest.payment_status]} · {publicGuest.payment_reference || "Sin referencia"}
                      </p>
                      {publicGuest.payment_proof_file_url ? (
                        <a
                          href={publicGuest.payment_proof_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block font-semibold text-emerald-300"
                        >
                          Ver comprobante
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {guestTickets.length ? (
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-xs text-zinc-500">Tickets</p>
                      <div className="mt-2 grid gap-2">
                        {guestTickets.map((ticket, index) => (
                          <Link
                            key={ticket.id}
                            href={`/events/${params.id}/tickets/${ticket.id}`}
                            className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-emerald-300"
                          >
                            Entrada {index + 1} · {ticket.status}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Link
                    href={`/events/${params.id}/guests/${guest.id}`}
                    className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/events/${params.id}/guests/${guest.id}/edit`}
                    className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <DeleteGuestButton
                    guestId={guest.id}
                    eventId={params.id}
                    onDeleted={loadGuests}
                    className="min-h-11 rounded-lg bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
                  />
                </div>
                {ticketUrls.length ? (
                  <div className="mt-2 grid gap-2 rounded-lg border border-white/10 p-3">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-10 items-center justify-center rounded-lg bg-emerald-400 px-3 text-sm font-semibold text-zinc-950"
                      >
                        Enviar QR por WhatsApp
                      </a>
                    ) : null}
                    <p className="break-all text-xs text-zinc-500">{ticketUrls[0]}</p>
                  </div>
                ) : null}
              </details>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
