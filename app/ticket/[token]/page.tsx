"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../components/Badge";
import { QRCodeBox } from "../../../components/QRCodeBox";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import { getPublicTicketUrl } from "../../../lib/tickets";
import type { PublicTicket, TicketStatus } from "../../../types/database";

const ticketStatusLabels: Record<TicketStatus, string> = {
  available: "Entrada disponible",
  used: "Entrada usada",
  cancelled: "Entrada cancelada",
};

export default function PublicTicketPage() {
  const params = useParams<{ token: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      const { data, error: requestError } = await supabase
        .from("tickets")
        .select("id, event_id, guest_id, token, status, max_uses, used_count, created_at, events(id, name, location, starts_at), guests(id, name, contact)")
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
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold text-emerald-300">Tribu Platform</p>
          <h1 className="mt-2 text-3xl font-semibold">Entrada</h1>
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
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center shadow-2xl shadow-black/30">
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
              <p className="mt-2 text-zinc-400">{ticket.guests?.name || "Invitado"}</p>
              {ticket.events?.location ? (
                <p className="mt-1 text-sm text-zinc-500">{ticket.events.location}</p>
              ) : null}
            </section>

            <QRCodeBox value={getPublicTicketUrl(ticket.token)} size={280} />

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
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
