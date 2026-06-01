"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicEventCard } from "../../components/PublicEventCard";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { EventRecord } from "../../types/database";

export default function PublicHomePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      const { data, error: requestError } = await supabase
        .from("events")
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
        .eq("is_public", true)
        .eq("public_status", "published")
        .order("starts_at", { ascending: true });

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
    <main className="min-h-screen bg-[#F6F1E8] px-4 py-6 text-[#18251A]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 shadow-2xl shadow-[#294F2F]/10">
          <Link href="/p" className="text-sm font-semibold text-[#315C38]">
            Tribu Platform
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Eventos</h1>
          <p className="mt-2 text-sm leading-6 text-[#6F7668]">
            Elegi el evento y reservá tu entrada.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#18251A]/15 bg-[#FFFDF8] p-8 text-center">
            <h2 className="text-xl font-semibold">No hay eventos publicados</h2>
            <p className="mt-2 text-sm text-[#6F7668]">Volvé a revisar más tarde.</p>
          </div>
        ) : (
          <section className="grid gap-4">
            {events.map((event) => (
              <PublicEventCard key={event.id} event={event} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
