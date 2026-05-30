"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { getPublicEventRegisterRoute } from "../../../../lib/public-routes";
import type { EventRecord } from "../../../../types/database";

function formatDate(value: string | null) {
  if (!value) {
    return "Fecha a confirmar";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number | null) {
  if (!value || value <= 0) {
    return "Aporte a confirmar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PublicEventPage() {
  const params = useParams<{ slug: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const { data, error: requestError } = await supabase
        .from("events")
        .select("id, name, description, location, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
        .eq("slug", params.slug)
        .eq("is_public", true)
        .eq("public_status", "published")
        .maybeSingle();

      if (requestError || !data) {
        setError(requestError?.message || "Evento no disponible.");
      } else {
        setEvent(data as EventRecord);
      }

      setIsLoading(false);
    }

    loadEvent();
  }, [params.slug, supabase]);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <Link href="/p" className="text-sm font-semibold text-emerald-300">
          Ver eventos
        </Link>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando evento...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        ) : event ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <p className="text-sm font-semibold text-emerald-300">
                {formatDate(event.starts_at)}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                {event.public_title || event.name}
              </h1>
              <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-zinc-300">
                {event.public_description || event.description || "Evento privado Tribu."}
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Ubicacion</p>
                <p className="mt-2 font-semibold">{event.location || "A confirmar"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Entrada</p>
                <p className="mt-2 font-semibold">{formatPrice(event.ticket_price)}</p>
              </div>
            </section>

            <Link
              href={getPublicEventRegisterRoute(event.slug || params.slug)}
              className="flex min-h-14 items-center justify-center rounded-xl bg-emerald-400 px-5 text-lg font-semibold text-zinc-950 transition hover:bg-emerald-300"
            >
              Quiero mi entrada
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
