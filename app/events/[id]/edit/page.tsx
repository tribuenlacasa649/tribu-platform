import { notFound } from "next/navigation";
import { EventForm } from "../../EventForm";
import { updateEvent } from "../../actions";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import type { EventRecord } from "../../../../types/event";

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

type EditEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const updateAction = updateEvent.bind(null, event.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Editar evento
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Actualiza los datos del evento seleccionado.
        </p>
      </div>

      <EventForm
        action={updateAction}
        event={event}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
