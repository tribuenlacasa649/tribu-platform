"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../components/Badge";
import { CopyButton } from "../../../components/CopyButton";
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
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, events(id, name, location, starts_at), guests(id, name, contact)")
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
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold text-emerald-300">Tribu Platform</p>
          <h1 className="mt-1 text-2xl font-semibold">Entrada</h1>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-center text-zinc-300">
            Cargando entrada...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-100">
            {error}
          </div>
        ) : ticket ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center shadow-2xl shadow-black/30">
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
              <p className="mt-2 text-zinc-300">{ticket.guests?.name || "Invitado"}</p>
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-zinc-500">Fecha</p>
                <p className="mt-1 font-semibold">{formatDate(ticket.events?.starts_at)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-zinc-500">Hora</p>
                <p className="mt-1 font-semibold">{formatTime(ticket.events?.starts_at)}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-zinc-500">Ubicación</p>
                <p className="mt-1 font-semibold">{ticket.events?.location || "A confirmar"}</p>
              </div>
            </section>

            <QRCodeBox value={ticketUrl} size={280} />

            <div className="grid gap-2">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-5 font-semibold text-zinc-950"
                >
                  Enviar por WhatsApp
                </a>
              ) : null}
              <CopyButton value={ticketUrl} label="Copiar entrada" />
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h3 className="text-lg font-semibold">Instrucciones</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Mostra este QR en la puerta. La entrada es personal y se valida una sola vez.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
