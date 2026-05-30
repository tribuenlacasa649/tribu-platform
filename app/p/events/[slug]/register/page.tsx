"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PublicGuestForm } from "../../../../../components/PublicGuestForm";
import { createSupabaseBrowserClient } from "../../../../../lib/supabase";
import { getPublicEventRoute } from "../../../../../lib/public-routes";
import type { EventRecord } from "../../../../../types/database";

export default function PublicRegisterPage() {
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
        <Link
          href={getPublicEventRoute(params.slug)}
          className="text-sm font-semibold text-emerald-300"
        >
          Volver al evento
        </Link>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        ) : event ? (
          <>
            <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold text-emerald-300">Reserva</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {event.public_title || event.name}
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Te guardamos el link personal al finalizar.
              </p>
            </header>

            <PublicGuestForm eventId={event.id} />
          </>
        ) : null}
      </div>
    </main>
  );
}
