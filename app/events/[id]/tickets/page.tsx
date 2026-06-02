"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { EventContextNav } from "../../../../components/EventContextNav";

export default function EventTicketsPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppShell title="Entradas">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315C38]">
            Información centralizada
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Entradas ahora está en Participantes</h1>
          <p className="mt-2 text-sm leading-6 text-[#6F7668]">
            Los tickets, QR, links individuales y envío por WhatsApp se ven dentro de cada participante.
          </p>
          <Link
            href={`/events/${params.id}/guests`}
            className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-[#315C38] px-5 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F]"
          >
            Ir a Participantes
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
