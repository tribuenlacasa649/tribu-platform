"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { PaymentStatus, PublicGuestStatus } from "../../../../types/database";

type PublicGuestPortalRecord = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
  ticket_quantity: number;
  food_preferences: string | null;
  notes: string | null;
  status: PublicGuestStatus;
  payment_status: PaymentStatus;
  access_token: string;
  created_at: string;
  event_name: string | null;
  event_public_title: string | null;
  event_location: string | null;
  event_starts_at: string | null;
  event_ticket_price: number | null;
};

const statusLabels: Record<PublicGuestStatus, string> = {
  pending: "Solicitud recibida",
  approved: "Solicitud aprobada",
  cancelled: "Solicitud cancelada",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pago pendiente",
  notified: "Pago avisado",
  confirmed: "Pago confirmado",
  rejected: "Pago rechazado",
};

function getTone(status: PublicGuestStatus) {
  if (status === "approved") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "warning";
}

export default function PublicGuestPortalPage() {
  const params = useParams<{ accessToken: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guest, setGuest] = useState<PublicGuestPortalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuest() {
      const { data, error: requestError } = await supabase.rpc(
        "get_public_guest_by_token",
        { lookup_token: params.accessToken }
      );

      const firstRow = Array.isArray(data) ? data[0] : null;

      if (requestError || !firstRow) {
        setError(requestError?.message || "No encontramos esta solicitud.");
      } else {
        setGuest(firstRow as PublicGuestPortalRecord);
      }

      setIsLoading(false);
    }

    loadGuest();
  }, [params.accessToken, supabase]);

  const currentUrl =
    typeof window === "undefined" ? `/p/guest/${params.accessToken}` : window.location.href;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center shadow-2xl shadow-black/20">
          <p className="text-sm font-semibold text-emerald-300">Tribu Platform</p>
          <h1 className="mt-2 text-3xl font-semibold">Tu reserva</h1>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        ) : guest ? (
          <>
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
              <Badge tone={getTone(guest.status)}>{statusLabels[guest.status]}</Badge>
              <h2 className="mt-4 text-2xl font-semibold">{guest.full_name}</h2>
              <p className="mt-2 text-zinc-400">
                {guest.event_public_title || guest.event_name || "Evento"}
              </p>
            </section>

            <section className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Entradas solicitadas</p>
                <p className="mt-2 text-2xl font-semibold">{guest.ticket_quantity}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-500">Estado de pago</p>
                <p className="mt-2 text-lg font-semibold">{paymentLabels[guest.payment_status]}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-lg font-semibold">Instrucciones</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Recibimos tu solicitud. Guardá este link para consultar el estado. El pago online se
                va a activar en el próximo paso.
              </p>
              <button
                type="button"
                className="mt-4 min-h-12 w-full rounded-xl border border-white/10 px-5 font-semibold text-zinc-400"
              >
                Pago online proximamente
              </button>
            </section>

            <CopyButton value={currentUrl} label="Copiar mi link" />
            <Link href="/p" className="text-center text-sm font-semibold text-emerald-300">
              Ver otros eventos
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
