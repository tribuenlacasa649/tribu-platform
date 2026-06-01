"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { Badge, eventStatusTone } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { EventRecord } from "../../types/database";
import { eventStatusLabels } from "./actions";

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function EventsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      const { data, error: requestError } = await supabase
        .from("events")
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, created_at")
        .order("created_at", { ascending: false });

      if (requestError) {
        setError(requestError.message);
      } else {
        setEvents((data ?? []) as EventRecord[]);
      }

      setIsLoading(false);
    }

    loadEvents();
  }, [supabase]);

  return (
    <AppShell title="Eventos">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-medium text-[#315C38]">Gestion</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Eventos</h1>
          </div>
          <Link
            href="/events/new"
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] sm:w-auto"
          >
            Nuevo evento
          </Link>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="Sin eventos"
            description="Crea el primero para empezar."
            actionHref="/events/new"
            actionLabel="Crear evento"
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group overflow-hidden rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10 transition hover:border-[#315C38]/30 hover:bg-[#FFFDF8]"
              >
                {event.event_banner_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.event_banner_url} alt={event.name} className="h-32 w-full object-cover" />
                ) : null}
                <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold leading-tight text-[#18251A]">
                      {event.name}
                    </h2>
                    <p className="mt-2 text-sm text-[#6F7668]">
                      {event.location || "Sin ubicacion"}
                    </p>
                  </div>
                  <Badge tone={eventStatusTone(event.status)}>
                    {eventStatusLabels[event.status]}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-[#F6F1E8]/70 p-3">
                    <p className="text-[#7F836F]">Creado</p>
                    <p className="mt-1 font-medium text-[#18251A]">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#F6F1E8]/70 p-3">
                    <p className="text-[#7F836F]">Inicio</p>
                    <p className="mt-1 font-medium text-[#18251A]">
                      {formatDate(event.starts_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[#6F7668]">
                  <span className="rounded-full bg-[#F0EADF] px-3 py-1">Invitados</span>
                  <span className="rounded-full bg-[#F0EADF] px-3 py-1">QR</span>
                  <span className="rounded-full bg-[#F0EADF] px-3 py-1">Scanner QR</span>
                </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
