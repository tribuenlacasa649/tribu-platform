"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, eventStatusTone } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
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
            .select("id, name, description, location, starts_at, ends_at, status, created_at")
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <p className="text-sm font-medium text-emerald-300">Operacion interna</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Vista rapida para eventos, invitados y modulos proximos.
          </p>
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
          <StatCard label="Check-ins" value={stats.checkins} helper="Preparado" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/events/new"
            className="flex min-h-14 items-center justify-center rounded-xl bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            Crear evento
          </Link>
          <Link
            href="/events"
            className="flex min-h-14 items-center justify-center rounded-xl border border-white/10 px-5 text-base font-semibold text-zinc-100 transition hover:bg-white/5"
          >
            Ver eventos
          </Link>
          <Link
            href="/events"
            className="flex min-h-14 items-center justify-center rounded-xl border border-white/10 px-5 text-base font-semibold text-zinc-100 transition hover:bg-white/5"
          >
            Crear invitado
          </Link>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Eventos recientes</h2>
            <Link href="/events" className="text-sm font-semibold text-emerald-300">
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
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
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="mt-2 text-sm text-zinc-400">
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
