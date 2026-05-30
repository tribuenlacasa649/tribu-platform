"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge } from "../../../../components/Badge";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { PaymentStatus, PublicGuestRecord, PublicGuestStatus } from "../../../../types/database";

const statusLabels: Record<PublicGuestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  cancelled: "Cancelada",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pago pendiente",
  notified: "Avisado",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

function statusTone(status: PublicGuestStatus) {
  if (status === "approved") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "warning";
}

export default function PublicGuestsAdminPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [requests, setRequests] = useState<PublicGuestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    const { data, error: requestError } = await supabase
      .from("public_guests")
      .select("id, event_id, full_name, phone, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, created_at")
      .eq("event_id", params.id)
      .order("created_at", { ascending: false });

    if (requestError) {
      setError(requestError.message);
    } else {
      setRequests((data ?? []) as PublicGuestRecord[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialRequests() {
      const { data, error: requestError } = await supabase
        .from("public_guests")
        .select("id, event_id, full_name, phone, instagram, ticket_quantity, food_preferences, notes, status, payment_status, access_token, created_at")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false });

      if (requestError) {
        setError(requestError.message);
      } else {
        setRequests((data ?? []) as PublicGuestRecord[]);
      }

      setIsLoading(false);
    }

    loadInitialRequests();
  }, [params.id, supabase]);

  async function updateStatus(request: PublicGuestRecord, status: PublicGuestStatus) {
    setError("");
    const { error: requestError } = await supabase
      .from("public_guests")
      .update({ status })
      .eq("id", request.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadRequests();
    router.refresh();
  }

  async function approveAndCreateGuest(request: PublicGuestRecord) {
    setError("");

    const { error: guestError } = await supabase.from("guests").insert({
      event_id: params.id,
      name: request.full_name,
      contact: request.phone,
      food_preferences: request.food_preferences,
      ticket_quantity: request.ticket_quantity,
      notes: request.notes,
      status: "active",
    });

    if (guestError) {
      setError(guestError.message);
      return;
    }

    await updateStatus(request, "approved");
  }

  return (
    <AppShell title="Solicitudes publicas">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Solicitudes publicas</h1>
          <p className="mt-2 text-sm text-zinc-400">Reservas recibidas desde el link publico.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando solicitudes...
          </div>
        ) : requests.length === 0 ? (
          <EmptyState title="Sin solicitudes" description="Todavia no llegaron reservas publicas." />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{request.full_name}</h2>
                    <p className="mt-1 text-sm text-zinc-400">{request.phone}</p>
                  </div>
                  <Badge tone={statusTone(request.status)}>{statusLabels[request.status]}</Badge>
                </div>

                <div className="mt-4 grid gap-2 text-sm">
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-zinc-500">Entradas</p>
                    <p className="mt-1 font-semibold">{request.ticket_quantity}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-950/70 p-3">
                    <p className="text-zinc-500">Pago</p>
                    <p className="mt-1 font-semibold">{paymentLabels[request.payment_status]}</p>
                  </div>
                  {request.instagram ? (
                    <div className="rounded-lg bg-zinc-950/70 p-3">
                      <p className="text-zinc-500">Instagram</p>
                      <p className="mt-1 font-semibold">{request.instagram}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => approveAndCreateGuest(request)}
                    className="min-h-11 rounded-lg bg-emerald-400 px-4 text-sm font-semibold text-zinc-950"
                  >
                    Aprobar y crear invitado
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(request, "approved")}
                      className="min-h-11 rounded-lg border border-white/10 px-3 text-sm font-semibold text-zinc-100"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(request, "cancelled")}
                      className="min-h-11 rounded-lg bg-red-500 px-3 text-sm font-semibold text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
