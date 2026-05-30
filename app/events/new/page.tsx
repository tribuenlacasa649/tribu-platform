import Link from "next/link";
import { EventForm } from "../EventForm";

export default function NewEventPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <Link href="/events" className="text-sm font-semibold text-emerald-300">
            Volver a eventos
          </Link>
          <div>
            <p className="text-sm font-medium text-zinc-400">Nuevo evento</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Crear evento
            </h1>
          </div>
        </header>

        <EventForm mode="create" />
      </div>
    </main>
  );
}
