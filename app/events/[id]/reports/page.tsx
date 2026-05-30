"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { EventContextNav } from "../../../../components/EventContextNav";
import { StatCard } from "../../../../components/StatCard";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";

type ReportStats = {
  guests: number;
  tickets: number;
  available: number;
  used: number;
  cancelled: number;
  pendingPayments: number;
  confirmedPayments: number;
};

export default function ReportsPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [stats, setStats] = useState<ReportStats>({
    guests: 0,
    tickets: 0,
    available: 0,
    used: 0,
    cancelled: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      const [guests, tickets, available, used, cancelled, pendingPayments, confirmedPayments] =
        await Promise.all([
          supabase
            .from("guests")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .neq("status", "deleted"),
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id),
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .eq("status", "available"),
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .eq("status", "used"),
          supabase
            .from("tickets")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .eq("status", "cancelled"),
          supabase
            .from("payments")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .in("status", ["pending", "notified"]),
          supabase
            .from("payments")
            .select("id", { count: "exact", head: true })
            .eq("event_id", params.id)
            .eq("status", "confirmed"),
        ]);

      const firstError =
        guests.error ||
        tickets.error ||
        available.error ||
        used.error ||
        cancelled.error ||
        pendingPayments.error ||
        confirmedPayments.error;

      if (firstError) {
        setError(firstError.message);
      }

      setStats({
        guests: guests.count ?? 0,
        tickets: tickets.count ?? 0,
        available: available.count ?? 0,
        used: used.count ?? 0,
        cancelled: cancelled.count ?? 0,
        pendingPayments: pendingPayments.count ?? 0,
        confirmedPayments: confirmedPayments.count ?? 0,
      });
      setIsLoading(false);
    }

    loadReports();
  }, [params.id, supabase]);

  const attendance =
    stats.tickets > 0 ? Math.round((stats.used / stats.tickets) * 100) : 0;

  return (
    <AppShell title="Reportes">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Reportes</h1>
          <p className="mt-2 text-sm text-zinc-400">Resumen operativo simple.</p>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-zinc-300">
            Cargando reportes...
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Invitados" value={stats.guests} />
            <StatCard label="Tickets" value={stats.tickets} />
            <StatCard label="Disponibles" value={stats.available} />
            <StatCard label="Usados" value={stats.used} />
            <StatCard label="Cancelados" value={stats.cancelled} />
            <StatCard label="Asistencia" value={`${attendance}%`} />
            <StatCard label="Pagos pendientes" value={stats.pendingPayments} />
            <StatCard label="Pagos confirmados" value={stats.confirmedPayments} />
          </section>
        )}
      </div>
    </AppShell>
  );
}
