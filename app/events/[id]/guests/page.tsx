"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { guestStatusLabels } from "../../actions";
import type { GuestRecord, GuestStatus } from "../../../../types/database";

const statusClasses: Record<GuestStatus, string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  deleted: "border-red-400/30 bg-red-400/10 text-red-200",
};

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGuests() {
    const { data, error: requestError } = await supabase
      .from("guests")
      .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
      .eq("event_id", params.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false });

    if (requestError) {
      setError(requestError.message);
    } else {
      setGuests((data ?? []) as GuestRecord[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialGuests() {
      const { data, error: requestError } = await supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("event_id", params.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (requestError) {
        setError(requestError.message);
      } else {
        setGuests((data ?? []) as GuestRecord[]);
      }

      setIsLoading(false);
    }

    loadInitialGuests();
  }, [params.id, supabase]);

  async function handleDelete(guestId: string) {
    if (!confirm("Eliminar este invitado?")) {
      return;
    }

    const { error: requestError } = await supabase
      .from("guests")
      .update({ status: "deleted" })
      .eq("id", guestId);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadGuests();
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
              Volver al evento
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Invitados</h1>
          </div>
          <Link
            href={`/events/${params.id}/guests/new`}
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
          >
            Nuevo invitado
          </Link>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando invitados...
          </div>
        ) : guests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
            <h2 className="text-xl font-semibold">Sin invitados</h2>
            <p className="mt-2 text-sm text-zinc-400">Agrega invitados para este evento.</p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guests.map((guest) => (
              <article
                key={guest.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold leading-tight">{guest.name}</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      {guest.contact || "Sin contacto"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[guest.status]}`}
                  >
                    {guestStatusLabels[guest.status]}
                  </span>
                </div>

                <div className="mt-4 rounded-lg bg-zinc-950/70 p-3">
                  <p className="text-xs text-zinc-500">Preferencia</p>
                  <p className="mt-1 text-sm font-medium text-zinc-100">
                    {guest.food_preferences || "Sin preferencia"}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Link
                    href={`/events/${params.id}/guests/${guest.id}`}
                    className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/events/${params.id}/guests/${guest.id}/edit`}
                    className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(guest.id)}
                    className="min-h-11 rounded-lg bg-red-500 px-3 text-sm font-semibold text-white transition hover:bg-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
