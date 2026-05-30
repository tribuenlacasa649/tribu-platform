import { EventForm } from "../EventForm";
import { createEvent } from "../actions";

export default function NewEventPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Nuevo evento
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Completa los datos principales para publicar el evento.
        </p>
      </div>

      <EventForm action={createEvent} submitLabel="Crear evento" />
    </main>
  );
}
