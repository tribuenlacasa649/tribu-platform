"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GuestForm } from "../../../GuestForm";

export default function NewGuestPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <Link
            href={`/events/${params.id}/guests`}
            className="text-sm font-semibold text-emerald-300"
          >
            Volver a invitados
          </Link>
          <div>
            <p className="text-sm font-medium text-zinc-400">Nuevo invitado</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Crear invitado
            </h1>
          </div>
        </header>

        <GuestForm mode="create" eventId={params.id} />
      </div>
    </main>
  );
}
