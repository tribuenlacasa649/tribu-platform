"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { eventStatusLabels } from "./actions";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { EventRecord, EventStatus } from "../../types/database";

const statusClasses: Record<EventStatus, string> = {
  draft: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  archived: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

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
        .select("id, name, description, location, starts_at, ends_at, status, created_at")
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
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-medium text-emerald-300">Tribu Platform</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Eventos</h1>
          </div>
          <Link
            href="/events/new"
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
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
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-semibold">Sin eventos</h2>
            <p className="mt-2 text-sm text-zinc-400">Crea el primero para empezar.</p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold leading-tight text-white">
                      {event.name}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      {event.location || "Sin ubicacion"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[event.status]}`}
                  >
                    {eventStatusLabels[event.status]}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-zinc-500">Creado</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-zinc-500">Inicio</p>
                    <p className="mt-1 font-medium text-zinc-100">
                      {formatDate(event.starts_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
                  <span className="rounded-full bg-zinc-900 px-3 py-1">Invitados</span>
                  <span className="rounded-full bg-zinc-900 px-3 py-1">QR</span>
                  <span className="rounded-full bg-zinc-900 px-3 py-1">Check-in</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
