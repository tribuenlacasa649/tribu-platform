"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { Badge, eventStatusTone } from "../../../components/Badge";
import { EventContextNav } from "../../../components/EventContextNav";
import { EventModuleGrid } from "../../../components/EventModuleGrid";
import { StatCard } from "../../../components/StatCard";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { EventRecord } from "../../../types/database";
import { eventStatusLabels } from "../actions";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin definir";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type EventStats = {
  guests: number;
  tickets: number;
  usedTickets: number;
  confirmedPayments: number;
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<EventStats>({
    guests: 0,
    tickets: 0,
    usedTickets: 0,
    confirmedPayments: 0,
  });

  useEffect(() => {
    async function loadEvent() {
      const { data, error: requestError } = await supabase
        .from("events")
        .select("id, name, description, location, starts_at, ends_at, status, created_at")
        .eq("id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
      } else {
        setEvent(data as EventRecord);
      }

      const [guests, tickets, usedTickets, confirmedPayments] = await Promise.all([
        supabase
          .from("guests")
          .select("id", { count: "exact", head: true })
          .eq("event_id", params.id)
          .neq("status", "deleted"),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("event_id", params.id),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("event_id", params.id)
          .eq("status", "used"),
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("event_id", params.id)
          .eq("status", "confirmed"),
      ]);

      setStats({
        guests: guests.count ?? 0,
        tickets: tickets.count ?? 0,
        usedTickets: usedTickets.count ?? 0,
        confirmedPayments: confirmedPayments.count ?? 0,
      });

      setIsLoading(false);
    }

    loadEvent();
  }, [params.id, supabase]);

  async function handleDelete() {
    if (!event || !confirm("Eliminar este evento?")) {
      return;
    }

    setIsDeleting(true);
    const { error: requestError } = await supabase.from("events").delete().eq("id", event.id);
    setIsDeleting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <AppShell title="Detalle evento">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="space-y-4">
          <Link href="/events" className="text-sm font-semibold text-emerald-300">
            Volver a eventos
          </Link>

          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
              Cargando evento...
            </div>
          ) : event ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={eventStatusTone(event.status)}>
                      {eventStatusLabels[event.status]}
                    </Badge>
                    <span className="text-sm text-zinc-500">
                      Creado {formatDateTime(event.created_at)}
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    {event.name}
                  </h1>
                  <p className="mt-2 text-zinc-400">{event.location || "Sin ubicacion"}</p>
                </div>
                <div className="grid gap-3 sm:min-w-48">
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="flex min-h-12 items-center justify-center rounded-lg border border-white/10 px-5 text-base font-semibold text-zinc-100 transition hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="min-h-12 rounded-lg bg-red-500 px-5 text-base font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {event ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Invitados" value={stats.guests} />
              <StatCard label="Tickets" value={stats.tickets} />
              <StatCard label="Check-ins" value={stats.usedTickets} />
              <StatCard label="Pagos OK" value={stats.confirmedPayments} />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Inicio</p>
                <p className="mt-2 font-semibold text-zinc-100">
                  {formatDateTime(event.starts_at)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Fin</p>
                <p className="mt-2 font-semibold text-zinc-100">
                  {formatDateTime(event.ends_at)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Descripcion</p>
                <p className="mt-2 line-clamp-3 text-zinc-100">
                  {event.description || "Sin descripcion"}
                </p>
              </div>
            </section>

            <EventModuleGrid eventId={event.id} />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
