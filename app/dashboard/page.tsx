"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, eventStatusTone } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { EventRecord } from "../../types/database";
import { eventStatusLabels } from "../events/actions";

type MainEventStats = {
  guests: number;
  confirmedPayments: number;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [mainStats, setMainStats] = useState<MainEventStats>({ guests: 0, confirmedPayments: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data, error: eventsError } = await supabase
        .from("events")
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, created_at")
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(6);

      if (eventsError) {
        setError(eventsError.message);
        setIsLoading(false);
        return;
      }

      const loadedEvents = (data ?? []) as EventRecord[];
      setEvents(loadedEvents);

      const mainEvent = loadedEvents[0];
      if (mainEvent) {
        const [guestsResult, paymentsResult] = await Promise.all([
          supabase
            .from("guests")
            .select("id", { count: "exact", head: true })
            .eq("event_id", mainEvent.id)
            .neq("status", "deleted"),
          supabase
            .from("payments")
            .select("id", { count: "exact", head: true })
            .eq("event_id", mainEvent.id)
            .eq("status", "confirmed"),
        ]);

        setMainStats({
          guests: guestsResult.count ?? 0,
          confirmedPayments: paymentsResult.count ?? 0,
        });
      }

      setIsLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  const mainEvent = events[0] ?? null;
  const recentEvents = events.slice(0, 5);

  return (
    <AppShell title="Inicio">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="space-y-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#7F936A]">
              Centro del Evento
            </p>
            <h1 className="text-2xl font-black tracking-tight text-[#18251A]">
              Operación principal
            </h1>
          </div>

          {isLoading ? (
            <div className="tribu-card rounded-[1.75rem] p-5 text-sm font-semibold text-[#6F7668]">
              Cargando evento...
            </div>
          ) : mainEvent ? (
            <Link
              href={`/events/${mainEvent.id}`}
              className="tribu-card block overflow-hidden rounded-[2rem]"
            >
              {mainEvent.event_banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mainEvent.event_banner_url} alt={mainEvent.name} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-24 bg-[#315C38]" />
              )}
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black text-[#18251A]">{mainEvent.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#6F7668]">
                      {formatDate(mainEvent.starts_at)} · {mainEvent.location_name || mainEvent.location || "Ubicación a confirmar"}
                    </p>
                  </div>
                  <Badge tone={eventStatusTone(mainEvent.status)}>
                    {eventStatusLabels[mainEvent.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#DCE5D2] p-3">
                    <p className="text-xs font-black uppercase text-[#315C38]">Invitados</p>
                    <p className="mt-1 text-2xl font-black">{mainStats.guests}</p>
                  </div>
                  <div className="rounded-2xl bg-[#F8E8BF] p-3">
                    <p className="text-xs font-black uppercase text-[#8A5B00]">Pagos OK</p>
                    <p className="mt-1 text-2xl font-black">{mainStats.confirmedPayments}</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <EmptyState
              title="Sin eventos"
              description="Creá un evento para iniciar la operación."
              actionHref="/events/new"
              actionLabel="Crear evento"
            />
          )}
        </section>

        <Link
          href="/events/new"
          className="flex min-h-14 items-center justify-center rounded-[1.4rem] bg-[#315C38] px-5 text-base font-black text-[#FFFDF8] shadow-lg shadow-[#315C38]/20 transition hover:bg-[#294F2F]"
        >
          Crear evento
        </Link>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#18251A]">Eventos recientes</h2>

          {isLoading ? (
            <div className="tribu-card rounded-[1.5rem] p-4 text-sm text-[#6F7668]">
              Cargando...
            </div>
          ) : recentEvents.length === 0 ? null : (
            <div className="grid gap-3">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="tribu-card flex items-center gap-3 rounded-[1.5rem] p-3"
                >
                  {event.event_banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.event_banner_url} alt={event.name} className="h-16 w-20 rounded-2xl object-cover" />
                  ) : (
                    <div className="h-16 w-20 rounded-2xl bg-[#DCE5D2]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-black">{event.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-[#6F7668]">{formatDate(event.starts_at)}</p>
                  </div>
                  <span className="rounded-full bg-[#315C38] px-4 py-2 text-xs font-black text-[#FFFDF8]">
                    Abrir
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
