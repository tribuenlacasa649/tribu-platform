import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { EventRecord } from "../../types/event";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<EventRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, description, location, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  }

  return data ?? [];
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Eventos
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestiona los eventos cargados en Supabase.
          </p>
        </div>
        <Link
          href="/events/new"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Nuevo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-600">Todavia no hay eventos.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-200">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-slate-950">
                        {event.name}
                      </h2>
                      {event.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                          {event.description}
                        </p>
                      ) : null}
                    </div>
                    {event.location ? (
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {event.location}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
