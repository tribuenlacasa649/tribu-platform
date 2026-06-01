import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { EventForm } from "../EventForm";

export default function NewEventPage() {
  return (
    <AppShell title="Nuevo evento">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <Link href="/events" className="text-sm font-semibold text-[#315C38]">
            Volver a eventos
          </Link>
          <div>
            <p className="text-sm font-medium text-[#6F7668]">Nuevo evento</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Crear evento
            </h1>
          </div>
        </header>

        <EventForm mode="create" />
      </div>
    </AppShell>
  );
}
