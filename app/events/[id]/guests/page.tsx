"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge, guestStatusTone } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { QRCodeBox } from "../../../../components/QRCodeBox";
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

function getQrStatus(tickets: TicketRecord[]) {
  if (tickets.length === 0) {
    return "No generado";
  }

  if (tickets.every((ticket) => ticket.status === "used")) {
    return "Utilizado";
  }

  return "Generado";
}

function getQrTone(tickets: TicketRecord[]) {
  if (tickets.length === 0) {
    return "neutral" as const;
  }

  if (tickets.every((ticket) => ticket.status === "used")) {
    return "warning" as const;
  }

  return "success" as const;
}

function getWhatsAppStatus(tickets: TicketRecord[]) {
  return tickets.length ? "Listo" : "No enviado";
}

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [publicGuests, setPublicGuests] = useState<PublicGuestRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
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
        .select("id, event_id, full_name, phone, country_code, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, payment_reference, payment_proof, payment_proof_file_url, payment_notified_at, payment_confirmed_at, internal_guest_id, created_at")
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
    <AppShell title="Participantes">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <EventContextNav eventId={params.id} />

        <header className="flex flex-col gap-3 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/events/${params.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315C38]">
              Evento
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Participantes</h1>
            <p className="mt-1 text-sm text-[#6F7668]">Invitados, pagos, QR y WhatsApp en una sola lista.</p>
          </div>
          <Link
            href={`/events/${params.id}/guests/new`}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#315C38] px-4 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] sm:w-auto"
          >
            Nuevo participante
          </Link>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 text-[#42503E]">
            Cargando participantes...
          </div>
        ) : guests.length === 0 ? (
          <EmptyState
            title="Sin participantes"
            description="Agrega el primer participante para este evento."
            actionHref={`/events/${params.id}/guests/new`}
            actionLabel="Nuevo participante"
          />
        ) : (
          <section className="grid gap-3">
            {guests.map((guest) => {
              const publicGuest = getPublicGuestForGuest(guest.id);
              const guestTickets = getTicketsForGuest(guest.id, publicGuest?.id);
              const ticketUrls = guestTickets.map((ticket) => getPublicTicketUrl(ticket.token));
              const whatsappMessage = createTicketWhatsAppMessage(guest.name, ticketUrls);
              const whatsappUrl =
                guest.contact && ticketUrls.length
                  ? createWhatsAppUrl(guest.contact, whatsappMessage)
                  : "";
              const isExpanded = expandedGuestId === guest.id;
              const paymentStatus = publicGuest?.payment_status ?? "pending";

              return (
                <article
                  key={guest.id}
                  className="overflow-hidden rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold leading-tight">{guest.name}</h2>
                        <p className="mt-1 truncate text-sm text-[#6F7668]">{guest.contact || "Sin telefono"}</p>
                      </div>
                      <Badge tone={paymentTone[paymentStatus]}>
                        Pago {paymentLabels[paymentStatus]}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Entradas</p>
                        <p className="mt-1 text-lg font-semibold">{guest.ticket_quantity}</p>
                      </div>
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">QR</p>
                        <p className="mt-1 text-sm font-semibold">{getQrStatus(guestTickets)}</p>
                      </div>
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">WhatsApp</p>
                        <p className="mt-1 text-sm font-semibold">{getWhatsAppStatus(guestTickets)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={guestStatusTone(guest.status)}>
                        {guestStatusLabels[guest.status]}
                      </Badge>
                      <Badge tone={getQrTone(guestTickets)}>{getQrStatus(guestTickets)}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedGuestId(isExpanded ? null : guest.id)}
                        className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-3 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F]"
                      >
                        {isExpanded ? "Cerrar" : "Ver"}
                      </button>
                      <Link
                        href={`/events/${params.id}/guests/${guest.id}/edit`}
                        className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
                      >
                        Editar
                      </Link>
                      <DeleteGuestButton
                        guestId={guest.id}
                        eventId={params.id}
                        onDeleted={loadGuests}
                        className="min-h-11 rounded-xl bg-[#F36F4A] px-3 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#d95d3d] disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-[#18251A]/10 bg-[#F6F1E8]/70 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-[#FFFDF8] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Datos</p>
                          <div className="mt-3 grid gap-2 text-sm">
                            <p><span className="text-[#7F836F]">Preferencias:</span> {guest.food_preferences || "Sin preferencia"}</p>
                            <p><span className="text-[#7F836F]">Pago:</span> {paymentLabels[paymentStatus]}</p>
                            <p><span className="text-[#7F836F]">Referencia:</span> {publicGuest?.payment_reference || "Sin referencia"}</p>
                          </div>
                          {publicGuest?.payment_proof_file_url ? (
                            <a
                              href={publicGuest.payment_proof_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 flex min-h-10 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#315C38]"
                            >
                              Ver comprobante
                            </a>
                          ) : null}
                        </div>

                        <div className="rounded-2xl bg-[#FFFDF8] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Acciones</p>
                          {ticketUrls.length ? (
                            <div className="mt-3 grid gap-2">
                              {whatsappUrl ? (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-3 text-sm font-semibold text-[#FFFDF8]"
                                >
                                  Enviar QR por WhatsApp
                                </a>
                              ) : null}
                              <CopyButton value={whatsappMessage} label="Copiar mensaje" />
                              <CopyButton value={ticketUrls[0]} label="Copiar link ticket" />
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-[#6F7668]">Todavia no hay QR generado para este participante.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3">
                        {guestTickets.length ? (
                          guestTickets.map((ticket, index) => {
                            const ticketUrl = getPublicTicketUrl(ticket.token);
                            const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(ticketUrl)}`;

                            return (
                              <details key={ticket.id} className="rounded-2xl bg-[#FFFDF8] p-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold">Entrada {index + 1}</p>
                                    <p className="mt-1 text-xs text-[#6F7668]">{ticket.token.slice(0, 12)}...</p>
                                  </div>
                                  <Badge tone={ticket.status === "available" ? "success" : ticket.status === "used" ? "warning" : "danger"}>
                                    {ticket.status}
                                  </Badge>
                                </summary>
                                <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
                                  <QRCodeBox value={ticketUrl} size={180} />
                                  <div className="grid content-start gap-2">
                                    <Link
                                      href={`/ticket/${ticket.token}`}
                                      target="_blank"
                                      className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-3 text-sm font-semibold text-[#FFFDF8]"
                                    >
                                      Ver QR
                                    </Link>
                                    <a
                                      href={qrDownloadUrl}
                                      download={`tribu-qr-${ticket.token}.png`}
                                      className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#18251A]"
                                    >
                                      Descargar QR
                                    </a>
                                    <CopyButton value={ticketUrl} label="Copiar link ticket" />
                                  </div>
                                </div>
                              </details>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm text-[#6F7668]">
                            Sin entradas generadas.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
