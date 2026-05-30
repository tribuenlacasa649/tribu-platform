"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../../components/AppShell";
import { Badge, guestStatusTone } from "../../../../../components/Badge";
import { createSupabaseBrowserClient } from "../../../../../lib/supabase";
import type { GuestRecord } from "../../../../../types/database";
import { guestStatusLabels } from "../../../actions";
import { DeleteGuestButton } from "../GuestActions";

export default function GuestDetailPage() {
  const params = useParams<{ id: string; guestId: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuest() {
      const { data, error: requestError } = await supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("id", params.guestId)
        .eq("event_id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
      } else {
        setGuest(data as GuestRecord);
      }

      setIsLoading(false);
    }

    loadGuest();
  }, [params.guestId, params.id, supabase]);

  return (
    <AppShell title="Detalle invitado">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-4">
          <Link
            href={`/events/${params.id}/guests`}
            className="text-sm font-semibold text-emerald-300"
          >
            Volver a invitados
          </Link>

          {isLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
              Cargando invitado...
            </div>
          ) : guest ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone={guestStatusTone(guest.status)}>
                    {guestStatusLabels[guest.status]}
                  </Badge>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    {guest.name}
                  </h1>
                  <p className="mt-2 text-zinc-400">{guest.contact || "Sin contacto"}</p>
                </div>
                <div className="grid gap-3 sm:min-w-48">
                  <Link
                    href={`/events/${params.id}/guests/${guest.id}/edit`}
                    className="flex min-h-12 items-center justify-center rounded-lg border border-white/10 px-5 text-base font-semibold text-zinc-100 transition hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <DeleteGuestButton
                    guestId={guest.id}
                    eventId={params.id}
                    redirectToList
                  />
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

        {guest ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-zinc-500">Preferencia gastronomica</p>
              <p className="mt-2 font-semibold text-zinc-100">
                {guest.food_preferences || "Sin preferencia"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-zinc-500">Entradas</p>
              <p className="mt-2 font-semibold text-zinc-100">{guest.ticket_quantity}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
              <p className="text-sm text-zinc-500">Notas</p>
              <p className="mt-2 whitespace-pre-wrap text-zinc-100">
                {guest.notes || "Sin notas"}
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
