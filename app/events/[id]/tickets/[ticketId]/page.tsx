"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../../components/AppShell";
import { Badge } from "../../../../../components/Badge";
import { QRCodeBox } from "../../../../../components/QRCodeBox";
import { createSupabaseBrowserClient } from "../../../../../lib/supabase";
import { getPublicTicketUrl } from "../../../../../lib/tickets";
import type { TicketStatus, TicketWithGuest } from "../../../../../types/database";

const ticketStatusLabels: Record<TicketStatus, string> = {
  available: "Disponible",
  used: "Usada",
  cancelled: "Cancelada",
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string; ticketId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [ticket, setTicket] = useState<TicketWithGuest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTicket() {
    const { data, error: requestError } = await supabase
      .from("tickets")
      .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, guests(id, name, contact)")
      .eq("id", params.ticketId)
      .eq("event_id", params.id)
      .single();

    if (requestError) {
      setError(requestError.message);
    } else {
      setTicket(data as unknown as TicketWithGuest);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialTicket() {
      const { data, error: requestError } = await supabase
        .from("tickets")
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, guests(id, name, contact)")
        .eq("id", params.ticketId)
        .eq("event_id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
      } else {
        setTicket(data as unknown as TicketWithGuest);
      }

      setIsLoading(false);
    }

    loadInitialTicket();
  }, [params.ticketId, params.id, supabase]);

  async function setStatus(status: TicketStatus) {
    if (!ticket) {
      return;
    }

    const { error: requestError } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticket.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadTicket();
    router.refresh();
  }

  return (
    <AppShell title="Ticket">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link href={`/events/${params.id}/tickets`} className="text-sm font-semibold text-emerald-300">
          Volver a entradas
        </Link>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando ticket...
          </div>
        ) : ticket ? (
          <>
            <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone={ticket.status === "available" ? "success" : ticket.status === "used" ? "warning" : "danger"}>
                    {ticketStatusLabels[ticket.status]}
                  </Badge>
                  <h1 className="mt-3 text-3xl font-semibold">{ticket.guests?.name || "Ticket"}</h1>
                  <p className="mt-2 break-all text-sm text-zinc-400">{ticket.token}</p>
                </div>
              </div>
            </section>

            <QRCodeBox value={getPublicTicketUrl(ticket.token)} />

            <section className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setStatus("available")}
                className="min-h-12 rounded-lg bg-emerald-400 px-4 font-semibold text-zinc-950"
              >
                Disponible
              </button>
              <button
                type="button"
                onClick={() => setStatus("used")}
                className="min-h-12 rounded-lg bg-amber-400 px-4 font-semibold text-zinc-950"
              >
                Usada
              </button>
              <button
                type="button"
                onClick={() => setStatus("cancelled")}
                className="min-h-12 rounded-lg bg-red-500 px-4 font-semibold text-white"
              >
                Cancelar
              </button>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
