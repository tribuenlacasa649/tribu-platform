"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { eventStatusLabels } from "../actions";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { EventRecord, EventStatus } from "../../../types/database";

const statusClasses: Record<EventStatus, string> = {
  draft: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  archived: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

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

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

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
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
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
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[event.status]}`}
                    >
                      {eventStatusLabels[event.status]}
                    </span>
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

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Link
                href={`/events/${event.id}/guests`}
                className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5 transition hover:bg-emerald-400/15"
              >
                <p className="text-sm font-semibold text-emerald-200">Activo</p>
                <h2 className="mt-2 text-xl font-semibold">Invitados</h2>
                <p className="mt-2 text-sm text-zinc-300">Gestionar lista y preferencias.</p>
              </Link>
              {["Entradas QR", "Check-in", "Pagos", "Produccion", "Stock"].map((module) => (
                <div
                  key={module}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-5 opacity-75"
                >
                  <p className="text-sm font-semibold text-zinc-500">Proximamente</p>
                  <h2 className="mt-2 text-xl font-semibold">{module}</h2>
                  <p className="mt-2 text-sm text-zinc-400">Modulo preparado.</p>
                </div>
              ))}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
