"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge } from "../../../../components/Badge";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { createTicketToken } from "../../../../lib/tickets";
import type { GuestRecord, TicketStatus, TicketWithGuest } from "../../../../types/database";

const ticketStatusLabels: Record<TicketStatus, string> = {
  available: "Disponible",
  used: "Usada",
  cancelled: "Cancelada",
};

const ticketTone: Record<TicketStatus, "success" | "warning" | "danger"> = {
  available: "success",
  used: "warning",
  cancelled: "danger",
};

export default function EventTicketsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [tickets, setTickets] = useState<TicketWithGuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [guestsResult, ticketsResult] = await Promise.all([
      supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("event_id", params.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: true }),
      supabase
        .from("tickets")
        .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, guests(id, name, contact)")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

    if (guestsResult.error) {
      setError(guestsResult.error.message);
    } else {
      setGuests((guestsResult.data ?? []) as GuestRecord[]);
    }

    if (ticketsResult.error) {
      setError(ticketsResult.error.message);
    } else {
      setTickets((ticketsResult.data ?? []) as unknown as TicketWithGuest[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialData() {
      const [guestsResult, ticketsResult] = await Promise.all([
        supabase
          .from("guests")
          .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
          .eq("event_id", params.id)
          .neq("status", "deleted")
          .order("created_at", { ascending: true }),
        supabase
          .from("tickets")
          .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, guests(id, name, contact)")
          .eq("event_id", params.id)
          .order("created_at", { ascending: false }),
      ]);

      if (guestsResult.error) {
        setError(guestsResult.error.message);
      } else {
        setGuests((guestsResult.data ?? []) as GuestRecord[]);
      }

      if (ticketsResult.error) {
        setError(ticketsResult.error.message);
      } else {
        setTickets((ticketsResult.data ?? []) as unknown as TicketWithGuest[]);
      }

      setIsLoading(false);
    }

    loadInitialData();
  }, [params.id, supabase]);

  async function generateTickets() {
    setError("");
    setIsGenerating(true);

    const activeTicketsByGuest = tickets.reduce<Record<string, number>>((acc, ticket) => {
      if (ticket.guest_id && ticket.status !== "cancelled") {
        acc[ticket.guest_id] = (acc[ticket.guest_id] ?? 0) + 1;
      }

      return acc;
    }, {});

    const rows = guests.flatMap((guest) => {
      const existing = activeTicketsByGuest[guest.id] ?? 0;
      const missing = Math.max(0, guest.ticket_quantity - existing);

      return Array.from({ length: missing }, () => ({
        event_id: params.id,
        guest_id: guest.id,
        token: createTicketToken(),
        status: "available",
        max_uses: 1,
        used_count: 0,
      }));
    });

    if (rows.length === 0) {
      setIsGenerating(false);
      return;
    }

    const { error: requestError } = await supabase.from("tickets").insert(rows);
    setIsGenerating(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadData();
    router.refresh();
  }

  return (
    <AppShell title="Entradas QR">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="flex flex-col gap-4 rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Link href={`/events/${params.id}`} className="text-sm font-semibold text-[#315C38]">
              Volver al evento
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Entradas QR</h1>
            <p className="mt-2 text-sm text-[#6F7668]">Un QR por entrada individual.</p>
          </div>
          <button
            type="button"
            onClick={generateTickets}
            disabled={isGenerating || guests.length === 0}
            className="min-h-12 w-full rounded-lg bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isGenerating ? "Generando..." : "Generar faltantes"}
          </button>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
            <p className="text-sm text-[#7F836F]">Invitados</p>
            <p className="mt-2 text-3xl font-semibold">{guests.length}</p>
          </div>
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
            <p className="text-sm text-[#7F836F]">Entradas requeridas</p>
            <p className="mt-2 text-3xl font-semibold">
              {guests.reduce((sum, guest) => sum + guest.ticket_quantity, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
            <p className="text-sm text-[#7F836F]">Tickets creados</p>
            <p className="mt-2 text-3xl font-semibold">{tickets.length}</p>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando entradas...
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Sin tickets"
            description="Genera entradas desde los invitados cargados."
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/events/${params.id}/tickets/${ticket.id}`}
                className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 transition hover:border-[#315C38]/30 hover:bg-[#FFFDF8]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {ticket.guests?.name || "Sin invitado"}
                    </h2>
                    <p className="mt-2 break-all text-xs text-[#7F836F]">{ticket.token}</p>
                  </div>
                  <Badge tone={ticketTone[ticket.status]}>
                    {ticketStatusLabels[ticket.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
