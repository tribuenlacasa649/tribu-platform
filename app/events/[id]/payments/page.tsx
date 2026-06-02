"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { EventContextNav } from "../../../../components/EventContextNav";

export default function PaymentsPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppShell title="Pagos">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315C38]">
            Información centralizada
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Pagos ahora está en Participantes</h1>
          <p className="mt-2 text-sm leading-6 text-[#6F7668]">
            Confirmación de pago, comprobantes, generación de QR y WhatsApp se gestionan desde una sola vista.
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
