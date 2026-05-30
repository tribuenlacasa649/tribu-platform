"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { EventRecord } from "../../../../types/database";
import { EventForm } from "../../EventForm";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <AppShell title="Editar evento">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <div>
            <p className="text-sm font-medium text-zinc-400">Editar evento</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Datos del evento
            </h1>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando evento...
          </div>
        ) : event ? (
          <EventForm mode="edit" event={event} />
        ) : null}
      </div>
    </AppShell>
  );
}
