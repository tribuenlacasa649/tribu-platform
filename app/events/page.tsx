import { supabase } from "@/lib/supabase";
import type { Event } from "@/types/database";

export default async function EventsPage() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const events = (data || []) as Event[];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <a href="/" className="text-sm text-emerald-400">← Volver</a>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">
              Tribu Platform
            </p>
            <h1 className="mt-3 text-4xl font-bold">Eventos</h1>
          </div>

          <a href="/events/new" className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black">
            Nuevo evento
          </a>
        </div>

        {error && <div className="mt-8 rounded-xl border border-red-500 p-4">{error.message}</div>}

        <div className="mt-8 space-y-4">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              Todavía no hay eventos creados.
            </div>
          ) : (
            events.map((event) => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10"
              >
                <h2 className="text-2xl font-semibold hover:text-emerald-400">{event.name}</h2>
                <p className="mt-2 text-neutral-400">{event.description || "Sin descripción"}</p>
                <p className="mt-2 text-sm text-neutral-500">{event.location || "Sin ubicación"}</p>
              </a>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
