"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge, guestStatusTone } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { QRCodeBox } from "../../../../components/QRCodeBox";
import {
  confirmPublicGuestPayment,
  formatMoney,
  getSuggestedPaymentAmount,
  rejectPublicGuestPayment,
  resetPublicGuestPayment,
} from "../../../../lib/payments";
import { formatPhone } from "../../../../lib/phone";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { createTicketToken, getPublicTicketUrl } from "../../../../lib/tickets";
import { createTicketWhatsAppMessage, createWhatsAppUrl } from "../../../../lib/whatsapp";
import type { EventRecord, GuestRecord, PaymentStatus, PublicGuestRecord, TicketRecord } from "../../../../types/database";
import { guestStatusLabels } from "../../actions";
import { DeleteGuestButton } from "./GuestActions";

type ParticipantSource = "guest" | "public_guest";

type Participant = {
  id: string;
  source: ParticipantSource;
  guest: GuestRecord | null;
  publicGuest: PublicGuestRecord | null;
  name: string;
  phone: string;
  instagram: string | null;
  ticketQuantity: number;
  foodPreferences: string | null;
  createdAt: string;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paymentProof: string | null;
  paymentProofFileUrl: string | null;
  tickets: TicketRecord[];
};

type FilterKey =
  | "all"
  | "payment_pending"
  | "payment_notified"
  | "payment_confirmed"
  | "qr_generated"
  | "qr_used";

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

const filterLabels: Record<FilterKey, string> = {
  all: "Todos",
  payment_pending: "Pago pendiente",
  payment_notified: "Pago avisado",
  payment_confirmed: "Pago confirmado",
  qr_generated: "QR generado",
  qr_used: "QR usado",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEventDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAbsoluteTicketUrl(token: string) {
  if (typeof window === "undefined") {
    return getPublicTicketUrl(token);
  }

  return `${window.location.origin}/ticket/${token}`;
}

function getQrStatus(tickets: TicketRecord[]) {
  if (tickets.length === 0) {
    return "Sin QR";
  }

  const used = tickets.filter((ticket) => ticket.status === "used").length;

  if (used === 0) {
    return "QR generado";
  }

  if (used === tickets.length) {
    return "Usado";
  }

  return "Usado parcialmente";
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

function participantMatchesFilter(participant: Participant, filter: FilterKey) {
  if (filter === "all") {
    return true;
  }

  if (filter === "payment_pending") {
    return participant.paymentStatus === "pending";
  }

  if (filter === "payment_notified") {
    return participant.paymentStatus === "notified";
  }

  if (filter === "payment_confirmed") {
    return participant.paymentStatus === "confirmed";
  }

  if (filter === "qr_generated") {
    return participant.tickets.length > 0;
  }

  if (filter === "qr_used") {
    return participant.tickets.some((ticket) => ticket.status === "used");
  }

  return true;
}

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [publicGuests, setPublicGuests] = useState<PublicGuestRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState("");
  const [error, setError] = useState("");

  const loadParticipants = useCallback(async () => {
    const [eventResult, guestsResult, publicGuestsResult, ticketsResult] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
        .eq("id", params.id)
        .single(),
      supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("event_id", params.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false }),
      supabase
        .from("public_guests")
        .select("id, event_id, full_name, phone, country_code, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, payment_reference, payment_proof, payment_proof_file_url, payment_notified_at, payment_confirmed_at, internal_guest_id, created_at")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at")
        .eq("event_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (eventResult.error || guestsResult.error || publicGuestsResult.error || ticketsResult.error) {
      setError(
        eventResult.error?.message ||
          guestsResult.error?.message ||
          publicGuestsResult.error?.message ||
          ticketsResult.error?.message ||
          ""
      );
    } else {
      setEvent(eventResult.data as EventRecord);
      setGuests((guestsResult.data ?? []) as GuestRecord[]);
      setPublicGuests((publicGuestsResult.data ?? []) as PublicGuestRecord[]);
      setTickets((ticketsResult.data ?? []) as TicketRecord[]);
    }

    setIsLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    async function loadInitialParticipants() {
      await loadParticipants();
    }

    loadInitialParticipants();
  }, [loadParticipants]);

  const participants = useMemo<Participant[]>(() => {
    const publicByGuestId = new Map(
      publicGuests
        .filter((publicGuest) => publicGuest.internal_guest_id)
        .map((publicGuest) => [publicGuest.internal_guest_id as string, publicGuest])
    );
    const guestById = new Map(guests.map((guest) => [guest.id, guest]));

    const internalParticipants = guests.map((guest) => {
      const publicGuest = publicByGuestId.get(guest.id) ?? null;
      const participantTickets = tickets.filter(
        (ticket) =>
          ticket.guest_id === guest.id || (publicGuest ? ticket.public_guest_id === publicGuest.id : false)
      );

      return {
        id: `guest-${guest.id}`,
        source: "guest" as const,
        guest,
        publicGuest,
        name: guest.name,
        phone: guest.contact || publicGuest?.phone || "",
        instagram: publicGuest?.instagram ?? null,
        ticketQuantity: guest.ticket_quantity,
        foodPreferences: guest.food_preferences || publicGuest?.food_preferences || null,
        createdAt: guest.created_at,
        paymentStatus: publicGuest?.payment_status ?? "confirmed",
        paymentReference: publicGuest?.payment_reference ?? null,
        paymentProof: publicGuest?.payment_proof ?? null,
        paymentProofFileUrl: publicGuest?.payment_proof_file_url ?? null,
        tickets: participantTickets,
      };
    });

    const publicOnlyParticipants = publicGuests
      .filter((publicGuest) => !publicGuest.internal_guest_id || !guestById.has(publicGuest.internal_guest_id))
      .map((publicGuest) => {
        const participantTickets = tickets.filter((ticket) => ticket.public_guest_id === publicGuest.id);

        return {
          id: `public-${publicGuest.id}`,
          source: "public_guest" as const,
          guest: null,
          publicGuest,
          name: publicGuest.full_name,
          phone: formatPhone(publicGuest.country_code, publicGuest.phone),
          instagram: publicGuest.instagram,
          ticketQuantity: publicGuest.ticket_quantity,
          foodPreferences: publicGuest.food_preferences,
          createdAt: publicGuest.created_at,
          paymentStatus: publicGuest.payment_status,
          paymentReference: publicGuest.payment_reference,
          paymentProof: publicGuest.payment_proof,
          paymentProofFileUrl: publicGuest.payment_proof_file_url,
          tickets: participantTickets,
        };
      });

    return [...publicOnlyParticipants, ...internalParticipants].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [guests, publicGuests, tickets]);

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return participants.filter((participant) => {
      const tokenText = participant.tickets.map((ticket) => ticket.token).join(" ").toLowerCase();
      const searchable = [
        participant.name,
        participant.phone,
        participant.paymentStatus,
        participant.paymentReference,
        tokenText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        participantMatchesFilter(participant, activeFilter)
      );
    });
  }, [activeFilter, participants, query]);

  const summary = {
    participants: participants.length,
    confirmedPayments: participants.filter((participant) => participant.paymentStatus === "confirmed").length,
    qrGenerated: participants.reduce((sum, participant) => sum + participant.tickets.length, 0),
    qrUsed: participants.reduce(
      (sum, participant) => sum + participant.tickets.filter((ticket) => ticket.status === "used").length,
      0
    ),
  };

  async function generateMissingGuestTickets(participant: Participant) {
    if (!participant.guest) {
      return;
    }

    setError("");
    setActiveId(participant.id);

    try {
      const activeTickets = participant.tickets.filter((ticket) => ticket.status !== "cancelled").length;
      const missingTickets = Math.max(0, participant.ticketQuantity - activeTickets);

      if (missingTickets > 0) {
        const rows = Array.from({ length: missingTickets }, () => ({
          event_id: params.id,
          guest_id: participant.guest?.id,
          public_guest_id: participant.publicGuest?.id ?? null,
          token: createTicketToken(),
          status: "available",
          max_uses: 1,
          used_count: 0,
        }));

        const { error: insertError } = await supabase.from("tickets").insert(rows);

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      await loadParticipants();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo generar QR.");
    } finally {
      setActiveId("");
    }
  }

  async function confirmPayment(participant: Participant) {
    if (!participant.publicGuest) {
      await generateMissingGuestTickets(participant);
      return;
    }

    setError("");
    setActiveId(participant.id);

    try {
      await confirmPublicGuestPayment(supabase, participant.publicGuest, event);
      await loadParticipants();
      router.refresh();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "No se pudo confirmar.");
    } finally {
      setActiveId("");
    }
  }

  async function setPaymentStatus(participant: Participant, status: PaymentStatus) {
    if (!participant.publicGuest) {
      return;
    }

    setError("");
    setActiveId(participant.id);

    try {
      if (status === "rejected") {
        await rejectPublicGuestPayment(supabase, participant.publicGuest, event);
      } else if (status === "pending") {
        await resetPublicGuestPayment(supabase, participant.publicGuest);
      } else if (status === "confirmed") {
        await confirmPublicGuestPayment(supabase, participant.publicGuest, event);
      }

      await loadParticipants();
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "No se pudo actualizar.");
    } finally {
      setActiveId("");
    }
  }

  async function cancelPublicParticipant(participant: Participant) {
    if (!participant.publicGuest) {
      return;
    }

    if (!confirm("Cancelar esta solicitud publica?")) {
      return;
    }

    setError("");
    setActiveId(participant.id);

    const { error: requestError } = await supabase
      .from("public_guests")
      .update({ status: "cancelled" })
      .eq("id", participant.publicGuest.id)
      .eq("event_id", params.id);

    setActiveId("");

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadParticipants();
    router.refresh();
  }

  return (
    <AppShell title="Participantes">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <EventContextNav eventId={params.id} />

        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/events/${params.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315C38]">
                Evento
              </Link>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Participantes</h1>
              <p className="mt-1 text-sm text-[#6F7668]">Lista, pagos, comprobantes, entradas, QR y WhatsApp.</p>
            </div>
            <Link
              href={`/events/${params.id}/guests/new`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#315C38] px-4 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] sm:w-auto"
            >
              Nuevo participante
            </Link>
          </div>

          <section className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-[#F6F1E8] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Personas</p>
              <p className="mt-1 text-xl font-semibold">{summary.participants}</p>
            </div>
            <div className="rounded-xl bg-[#F6F1E8] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Pagos OK</p>
              <p className="mt-1 text-xl font-semibold">{summary.confirmedPayments}</p>
            </div>
            <div className="rounded-xl bg-[#F6F1E8] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">QR</p>
              <p className="mt-1 text-xl font-semibold">{summary.qrGenerated}</p>
            </div>
            <div className="rounded-xl bg-[#F6F1E8] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Usados</p>
              <p className="mt-1 text-xl font-semibold">{summary.qrUsed}</p>
            </div>
          </section>
        </header>

        <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-sm text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
            placeholder="Buscar por nombre, telefono, estado o token..."
          />
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {(Object.keys(filterLabels) as FilterKey[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-[#315C38] text-[#FFFDF8]"
                    : "border border-[#18251A]/10 bg-[#F6F1E8] text-[#18251A]"
                }`}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 text-[#42503E]">
            Cargando participantes...
          </div>
        ) : participants.length === 0 ? (
          <EmptyState
            title="Sin participantes"
            description="Agrega el primer participante para este evento."
            actionHref={`/events/${params.id}/guests/new`}
            actionLabel="Nuevo participante"
          />
        ) : filteredParticipants.length === 0 ? (
          <EmptyState title="Sin resultados" description="Probá con otra búsqueda o filtro." />
        ) : (
          <section className="grid gap-3">
            {filteredParticipants.map((participant) => {
              const ticketUrls = participant.tickets.map((ticket) => getAbsoluteTicketUrl(ticket.token));
              const amount = participant.publicGuest
                ? getSuggestedPaymentAmount(participant.publicGuest, event)
                : event?.ticket_price
                  ? event.ticket_price * participant.ticketQuantity
                  : 0;
              const whatsappMessage = createTicketWhatsAppMessage(participant.name, ticketUrls, {
                title: event?.public_title || event?.name,
                dateLabel: formatEventDate(event?.starts_at),
                location: event?.location_address || event?.location,
              });
              const whatsappUrl =
                participant.phone && ticketUrls.length
                  ? createWhatsAppUrl(participant.phone, whatsappMessage)
                  : "";
              const isExpanded = expandedParticipantId === participant.id;
              const canConfirmAndGenerate =
                participant.publicGuest
                  ? participant.paymentStatus !== "confirmed"
                  : participant.tickets.filter((ticket) => ticket.status !== "cancelled").length < participant.ticketQuantity;
              const canSendWhatsApp = participant.paymentStatus === "confirmed" && participant.tickets.length > 0;

              return (
                <article
                  key={participant.id}
                  className="overflow-hidden rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold leading-tight">{participant.name}</h2>
                        <p className="mt-1 truncate text-sm text-[#6F7668]">{participant.phone || "Sin telefono"}</p>
                      </div>
                      <Badge tone={paymentTone[participant.paymentStatus]}>
                        {paymentLabels[participant.paymentStatus]}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Entradas</p>
                        <p className="mt-1 text-lg font-semibold">{participant.ticketQuantity}</p>
                      </div>
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">QR</p>
                        <p className="mt-1 text-xs font-semibold">{getQrStatus(participant.tickets)}</p>
                      </div>
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">WhatsApp</p>
                        <p className="mt-1 text-xs font-semibold">{getWhatsAppStatus(participant.tickets)}</p>
                      </div>
                      <div className="rounded-xl bg-[#F6F1E8] px-2 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">Tickets</p>
                        <p className="mt-1 text-lg font-semibold">{participant.tickets.length}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {participant.guest ? (
                        <Badge tone={guestStatusTone(participant.guest.status)}>
                          {guestStatusLabels[participant.guest.status]}
                        </Badge>
                      ) : (
                        <Badge tone={participant.publicGuest?.status === "cancelled" ? "danger" : "warning"}>
                          Solicitud publica
                        </Badge>
                      )}
                      <Badge tone={getQrTone(participant.tickets)}>{getQrStatus(participant.tickets)}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedParticipantId(isExpanded ? null : participant.id)}
                        className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-3 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F]"
                      >
                        {isExpanded ? "Cerrar" : "Ver"}
                      </button>
                      {participant.guest ? (
                        <Link
                          href={`/events/${params.id}/guests/${participant.guest.id}/edit`}
                          className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
                        >
                          Editar
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#7F836F] opacity-60"
                        >
                          Editar
                        </button>
                      )}
                      {participant.guest ? (
                        <DeleteGuestButton
                          guestId={participant.guest.id}
                          eventId={params.id}
                          onDeleted={loadParticipants}
                          className="min-h-11 rounded-xl bg-[#F36F4A] px-3 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#d95d3d] disabled:opacity-60"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => cancelPublicParticipant(participant)}
                          disabled={activeId === participant.id}
                          className="min-h-11 rounded-xl bg-[#F36F4A] px-3 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#d95d3d] disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="mt-2 grid gap-2">
                      {canConfirmAndGenerate ? (
                        <button
                          type="button"
                          onClick={() => confirmPayment(participant)}
                          disabled={activeId === participant.id}
                          className="min-h-11 rounded-xl bg-[#315C38] px-4 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:opacity-60"
                        >
                          {activeId === participant.id ? "Procesando..." : "Confirmar y generar QR"}
                        </button>
                      ) : null}
                      {canSendWhatsApp && whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-4 text-sm font-semibold text-[#FFFDF8]"
                        >
                          Enviar QR por WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-[#18251A]/10 bg-[#F6F1E8]/70 p-4">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <section className="rounded-2xl bg-[#FFFDF8] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Datos</p>
                          <div className="mt-3 grid gap-2 text-sm">
                            <p><span className="text-[#7F836F]">Nombre:</span> {participant.name}</p>
                            <p><span className="text-[#7F836F]">Telefono:</span> {participant.phone || "Sin telefono"}</p>
                            <p><span className="text-[#7F836F]">Instagram:</span> {participant.instagram || "Sin Instagram"}</p>
                            <p><span className="text-[#7F836F]">Preferencias:</span> {participant.foodPreferences || "Sin preferencia"}</p>
                            <p><span className="text-[#7F836F]">Registro:</span> {formatDate(participant.createdAt)}</p>
                          </div>
                        </section>

                        <section className="rounded-2xl bg-[#FFFDF8] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Pago</p>
                          <div className="mt-3 grid gap-2 text-sm">
                            <p><span className="text-[#7F836F]">Estado:</span> {paymentLabels[participant.paymentStatus]}</p>
                            <p><span className="text-[#7F836F]">Monto:</span> {formatMoney(amount)}</p>
                            <p><span className="text-[#7F836F]">Referencia:</span> {participant.paymentReference || "Sin referencia"}</p>
                            <p><span className="text-[#7F836F]">Comprobante:</span> {participant.paymentProof || "Sin texto"}</p>
                          </div>
                          {participant.paymentProofFileUrl ? (
                            <a
                              href={participant.paymentProofFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 flex min-h-10 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#315C38]"
                            >
                              Ver foto comprobante
                            </a>
                          ) : null}
                          {participant.publicGuest ? (
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                onClick={() => confirmPayment(participant)}
                                disabled={activeId === participant.id || participant.paymentStatus === "confirmed"}
                                className="min-h-10 rounded-xl bg-[#315C38] px-3 text-xs font-semibold text-[#FFFDF8] disabled:opacity-50"
                              >
                                Confirmar pago
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentStatus(participant, "rejected")}
                                disabled={activeId === participant.id}
                                className="min-h-10 rounded-xl bg-[#F36F4A] px-3 text-xs font-semibold text-[#FFFDF8] disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentStatus(participant, "pending")}
                                disabled={activeId === participant.id}
                                className="min-h-10 rounded-xl border border-[#18251A]/10 px-3 text-xs font-semibold text-[#18251A] disabled:opacity-50"
                              >
                                Pendiente
                              </button>
                            </div>
                          ) : null}
                        </section>
                      </div>

                      <section className="mt-3 rounded-2xl bg-[#FFFDF8] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Entradas / QR</p>
                            <h3 className="mt-1 text-lg font-semibold">
                              {participant.tickets.length} de {participant.ticketQuantity} generadas
                            </h3>
                          </div>
                          <Badge tone={getQrTone(participant.tickets)}>{getQrStatus(participant.tickets)}</Badge>
                        </div>

                        <div className="mt-3 grid gap-3">
                          {participant.tickets.length ? (
                            participant.tickets.map((ticket, index) => {
                              const ticketUrl = getAbsoluteTicketUrl(ticket.token);
                              const singleMessage = createTicketWhatsAppMessage(participant.name, [ticketUrl], {
                                title: event?.public_title || event?.name,
                                dateLabel: formatEventDate(event?.starts_at),
                                location: event?.location_address || event?.location,
                              });
                              const singleWhatsappUrl = participant.phone
                                ? createWhatsAppUrl(participant.phone, singleMessage)
                                : "";

                              return (
                                <details key={ticket.id} className="rounded-xl bg-[#F6F1E8] p-3">
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold">Entrada {index + 1}</p>
                                      <p className="mt-1 text-xs text-[#6F7668]">{ticket.token.slice(0, 14)}...</p>
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
                                      <CopyButton value={ticketUrl} label="Copiar link" />
                                      {singleWhatsappUrl ? (
                                        <a
                                          href={singleWhatsappUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#18251A]"
                                        >
                                          WhatsApp
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                </details>
                              );
                            })
                          ) : (
                            <div className="rounded-xl bg-[#F6F1E8] p-3 text-sm text-[#6F7668]">
                              Sin QR generado.
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="mt-3 rounded-2xl bg-[#FFFDF8] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Acciones rápidas</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {participant.guest ? (
                            <Link
                              href={`/events/${params.id}/guests/${participant.guest.id}/edit`}
                              className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 text-sm font-semibold text-[#18251A]"
                            >
                              Editar
                            </Link>
                          ) : null}
                          {whatsappUrl ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-3 text-sm font-semibold text-[#FFFDF8]"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                          {ticketUrls.length ? (
                            <>
                              <CopyButton value={whatsappMessage} label="Copiar mensaje" />
                              <CopyButton value={ticketUrls[0]} label="Copiar link ticket" />
                            </>
                          ) : null}
                          <CopyButton
                            value={`${participant.name}\n${participant.phone}\nEntradas: ${participant.ticketQuantity}\nPago: ${paymentLabels[participant.paymentStatus]}`}
                            label="Copiar datos"
                          />
                        </div>
                      </section>
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
