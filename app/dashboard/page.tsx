"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, eventStatusTone } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { EventOverview } from "../../components/EventOverview";
import { StatCard } from "../../components/StatCard";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { EventRecord } from "../../types/database";
import { eventStatusLabels } from "../events/actions";

type DashboardStats = {
  activeEvents: number;
  totalGuests: number;
  tickets: number;
  checkins: number;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [stats, setStats] = useState<DashboardStats>({
    activeEvents: 0,
    totalGuests: 0,
    tickets: 0,
    checkins: 0,
  });
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const [activeEventsResult, guestsResult, ticketsResult, scansResult, eventsResult] =
        await Promise.all([
          supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase.from("guests").select("id", { count: "exact", head: true }),
          supabase.from("tickets").select("id", { count: "exact", head: true }),
          supabase.from("ticket_scans").select("id", { count: "exact", head: true }),
          supabase
            .from("events")
            .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (eventsResult.error) {
        setError(eventsResult.error.message);
      } else {
        setEvents((eventsResult.data ?? []) as EventRecord[]);
      }

      setStats({
        activeEvents: activeEventsResult.count ?? 0,
        totalGuests: guestsResult.count ?? 0,
        tickets: ticketsResult.error ? 0 : ticketsResult.count ?? 0,
        checkins: scansResult.error ? 0 : scansResult.count ?? 0,
      });

      setIsLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-sm font-medium text-[#315C38]">Operacion interna</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6F7668]">Vista compacta para operar desde celular.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Eventos activos" value={stats.activeEvents} />
          <StatCard label="Invitados totales" value={stats.totalGuests} />
          <StatCard label="Entradas emitidas" value={stats.tickets} helper="Preparado" />
          <StatCard label="Scanner OK" value={stats.checkins} helper="Preparado" />
        </section>

        {events[0] ? (
          <EventOverview
            eventId={events[0].id}
            stats={{
              guests: stats.totalGuests,
              tickets: stats.tickets,
              usedTickets: stats.checkins,
              confirmedPayments: 0,
            }}
          />
        ) : null}

        <section className="grid gap-3 md:grid-cols-2">
          <Link
            href="/events/new"
            className="flex min-h-14 items-center justify-center rounded-xl bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F]"
          >
            Crear evento
          </Link>
          <Link
            href="/events"
            className="flex min-h-14 items-center justify-center rounded-xl border border-[#18251A]/10 px-5 text-base font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
          >
            Ver eventos
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Eventos recientes</h2>
            <Link href="/events" className="text-sm font-semibold text-[#315C38]">
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
              Cargando dashboard...
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="Sin eventos"
              description="Crea un evento para activar la operacion."
              actionHref="/events/new"
              actionLabel="Crear evento"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="overflow-hidden rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] transition hover:border-[#315C38]/30 hover:bg-[#FFFDF8]"
                >
                  {event.event_banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.event_banner_url} alt={event.name} className="h-28 w-full object-cover" />
                  ) : null}
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="mt-2 text-sm text-[#6F7668]">
                        {event.location || "Sin ubicacion"}
                      </p>
                    </div>
                    <Badge tone={eventStatusTone(event.status)}>
                      {eventStatusLabels[event.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
