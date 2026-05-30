"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge } from "../../../../components/Badge";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { GuestRecord, PaymentRecord, PaymentStatus } from "../../../../types/database";

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  notified: "Avisado",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

const paymentTone: Record<PaymentStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  notified: "warning",
  confirmed: "success",
  rejected: "danger",
};

export default function PaymentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPayments() {
    const [guestsResult, paymentsResult] = await Promise.all([
      supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("event_id", params.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: true }),
      supabase
        .from("payments")
        .select("id, event_id, guest_id, amount, status, method, reference, notes, created_at")
        .eq("event_id", params.id),
    ]);

    if (guestsResult.error) {
      setError(guestsResult.error.message);
    } else {
      setGuests((guestsResult.data ?? []) as GuestRecord[]);
    }

    if (paymentsResult.error) {
      setError(paymentsResult.error.message);
    } else {
      setPayments((paymentsResult.data ?? []) as PaymentRecord[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialPayments() {
      const [guestsResult, paymentsResult] = await Promise.all([
        supabase
          .from("guests")
          .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
          .eq("event_id", params.id)
          .neq("status", "deleted")
          .order("created_at", { ascending: true }),
        supabase
          .from("payments")
          .select("id, event_id, guest_id, amount, status, method, reference, notes, created_at")
          .eq("event_id", params.id),
      ]);

      if (guestsResult.error) {
        setError(guestsResult.error.message);
      } else {
        setGuests((guestsResult.data ?? []) as GuestRecord[]);
      }

      if (paymentsResult.error) {
        setError(paymentsResult.error.message);
      } else {
        setPayments((paymentsResult.data ?? []) as PaymentRecord[]);
      }

      setIsLoading(false);
    }

    loadInitialPayments();
  }, [params.id, supabase]);

  async function setPaymentStatus(guest: GuestRecord, status: PaymentStatus) {
    setError("");
    const existingPayment = payments.find((payment) => payment.guest_id === guest.id);

    const payload = {
      event_id: params.id,
      guest_id: guest.id,
      status,
      amount: existingPayment?.amount ?? 0,
      method: existingPayment?.method ?? "manual",
      reference: existingPayment?.reference ?? null,
      notes: existingPayment?.notes ?? null,
    };

    const request = existingPayment
      ? supabase.from("payments").update(payload).eq("id", existingPayment.id)
      : supabase.from("payments").insert(payload);

    const { error: requestError } = await request;

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadPayments();
    router.refresh();
  }

  return (
    <AppShell title="Pagos">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pagos manuales</h1>
          <p className="mt-2 text-sm text-zinc-400">Control simple sin Mercado Pago.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando pagos...
          </div>
        ) : guests.length === 0 ? (
          <EmptyState title="Sin invitados" description="Agrega invitados para controlar pagos." />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {guests.map((guest) => {
              const payment = payments.find((item) => item.guest_id === guest.id);
              const status = payment?.status ?? "pending";

              return (
                <article
                  key={guest.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{guest.name}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{guest.contact || "Sin contacto"}</p>
                    </div>
                    <Badge tone={paymentTone[status]}>{paymentLabels[status]}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(["pending", "notified", "confirmed", "rejected"] as PaymentStatus[]).map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => setPaymentStatus(guest, nextStatus)}
                          className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                            status === nextStatus
                              ? "bg-emerald-400 text-zinc-950"
                              : "border border-white/10 text-zinc-100 hover:bg-white/5"
                          }`}
                        >
                          {paymentLabels[nextStatus]}
                        </button>
                      )
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
