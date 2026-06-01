"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../components/Badge";
import { CopyButton } from "../../../components/CopyButton";
import { LocationCard } from "../../../components/LocationCard";
import { QRCodeBox } from "../../../components/QRCodeBox";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import { getPublicTicketUrl } from "../../../lib/tickets";
import { createTicketWhatsAppMessage, createWhatsAppUrl } from "../../../lib/whatsapp";
import type { PublicTicket, TicketStatus } from "../../../types/database";

const ticketStatusLabels: Record<TicketStatus, string> = {
  available: "Entrada disponible",
  used: "Entrada usada",
  cancelled: "Entrada cancelada",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin definir";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Sin definir";
  }

  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PublicTicketPage() {
  const params = useParams<{ token: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const ticketUrl = ticket ? getPublicTicketUrl(ticket.token) : "";
  const whatsappUrl =
    ticket?.guests?.contact && ticketUrl
      ? createWhatsAppUrl(
          ticket.guests.contact,
          createTicketWhatsAppMessage(ticket.guests.name, [ticketUrl], {
            title: ticket.events?.name,
            dateLabel: `${formatDate(ticket.events?.starts_at)} - ${formatTime(ticket.events?.starts_at)}`,
            location: ticket.events?.location,
          })
        )
      : "";

  useEffect(() => {
    async function loadTicket() {
      const { data, error: requestError } = await supabase
        .from("tickets")
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, events(id, name, location, location_name, location_address, location_maps_url, event_banner_url, starts_at), guests(id, name, contact)")
        .eq("token", params.token)
        .maybeSingle();

      if (requestError || !data) {
        setError(requestError?.message || "Entrada no encontrada.");
      } else {
        setTicket(data as unknown as PublicTicket);
      }

      setIsLoading(false);
    }

    loadTicket();
  }, [params.token, supabase]);

  return (
    <main className="min-h-screen bg-[#F6F1E8] px-4 py-6 text-[#18251A]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 text-center shadow-2xl shadow-[#294F2F]/15">
          <p className="text-sm font-semibold text-[#315C38]">Tribu Platform</p>
          <h1 className="mt-1 text-2xl font-semibold">Entrada</h1>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-center text-[#42503E]">
            Cargando entrada...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-100">
            {error}
          </div>
        ) : ticket ? (
          <>
            <section className="overflow-hidden rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] text-center shadow-2xl shadow-[#294F2F]/15">
              {ticket.events?.event_banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ticket.events.event_banner_url} alt={ticket.events.name || "Evento"} className="h-36 w-full object-cover" />
              ) : null}
              <div className="p-4">
              <Badge
                tone={
                  ticket.status === "available"
                    ? "success"
                    : ticket.status === "used"
                      ? "warning"
                      : "danger"
                }
              >
                {ticketStatusLabels[ticket.status]}
              </Badge>
              <h2 className="mt-4 text-2xl font-semibold">
                {ticket.events?.name || "Evento"}
              </h2>
              <p className="mt-2 text-[#42503E]">{ticket.guests?.name || "Invitado"}</p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-3">
                <p className="text-[#7F836F]">Fecha</p>
                <p className="mt-1 font-semibold">{formatDate(ticket.events?.starts_at)}</p>
              </div>
              <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-3">
                <p className="text-[#7F836F]">Hora</p>
                <p className="mt-1 font-semibold">{formatTime(ticket.events?.starts_at)}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-3">
                <p className="text-[#7F836F]">Ubicación</p>
                <p className="mt-1 font-semibold">{ticket.events?.location || "A confirmar"}</p>
              </div>
            </section>

            <QRCodeBox value={ticketUrl} size={280} />

            <LocationCard
              name={ticket.events?.location_name || ticket.events?.location}
              address={ticket.events?.location_address}
              mapsUrl={ticket.events?.location_maps_url}
              compact
            />

            <div className="grid gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-[#315C38] px-5 font-semibold text-[#FFFDF8]"
                >
                  Enviar por WhatsApp
                </a>
              ) : null}
              <CopyButton value={ticketUrl} label="Copiar entrada" />
            </div>

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
              <h3 className="text-lg font-semibold">Instrucciones</h3>
              <p className="mt-2 text-sm leading-6 text-[#42503E]">
                Mostra este QR en la puerta. La entrada es personal y se valida una sola vez.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
