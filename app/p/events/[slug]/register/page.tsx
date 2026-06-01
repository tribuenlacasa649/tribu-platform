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
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
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
    <main className="min-h-screen bg-[#F6F1E8] px-4 py-6 text-[#18251A]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <Link
          href={getPublicEventRoute(params.slug)}
          className="text-sm font-semibold text-[#315C38]"
        >
          Volver al evento
        </Link>

        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        ) : event ? (
          <>
            <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5">
              <p className="text-sm font-semibold text-[#315C38]">Reserva</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {event.public_title || event.name}
              </h1>
              <p className="mt-2 text-sm text-[#6F7668]">
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
