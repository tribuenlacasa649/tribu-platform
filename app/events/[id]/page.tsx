import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEvent } from "../actions";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { EventRecord } from "../../../types/event";

export const dynamic = "force-dynamic";

async function getEvent(id: string): Promise<EventRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, description, location, created_at")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const deleteAction = deleteEvent.bind(null, event.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/events" className="text-sm font-medium text-slate-600">
          Volver a eventos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/events/${event.id}/edit`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Editar
          </Link>
          <form action={deleteAction}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Eliminar
            </button>
          </form>
        </div>
      </div>

      <article className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {event.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Creado el {new Date(event.created_at).toLocaleDateString("es-AR")}
          </p>
        </div>

        {event.location ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ubicacion
            </h2>
            <p className="mt-2 text-slate-900">{event.location}</p>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Descripcion
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-900">
            {event.description || "Sin descripcion."}
          </p>
        </section>
      </article>
    </main>
  );
}
