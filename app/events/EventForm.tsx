import Link from "next/link";
import type { EventRecord } from "../../types/event";

type EventFormProps = {
  action: (formData: FormData) => Promise<void>;
  event?: Pick<EventRecord, "name" | "description" | "location">;
  submitLabel: string;
};

export function EventForm({ action, event, submitLabel }: EventFormProps) {
  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-800"
        >
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={event?.name ?? ""}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-800"
        >
          Descripcion
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={event?.description ?? ""}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="block text-sm font-medium text-slate-800"
        >
          Ubicacion
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={event?.location ?? ""}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {submitLabel}
        </button>
        <Link
          href="/events"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
