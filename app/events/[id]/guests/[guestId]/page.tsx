"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../../lib/supabase";
import { guestStatusLabels } from "../../../actions";
import type { GuestRecord, GuestStatus } from "../../../../../types/database";

const statusClasses: Record<GuestStatus, string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  deleted: "border-red-400/30 bg-red-400/10 text-red-200",
};

export default function GuestDetailPage() {
  const params = useParams<{ id: string; guestId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function handleDelete() {
    if (!guest || !confirm("Eliminar este invitado?")) {
      return;
    }

    setIsDeleting(true);
    const { error: requestError } = await supabase
      .from("guests")
      .update({ status: "deleted" })
      .eq("id", guest.id);
    setIsDeleting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(`/events/${params.id}/guests`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
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
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[guest.status]}`}
                  >
                    {guestStatusLabels[guest.status]}
                  </span>
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
    </main>
  );
}
