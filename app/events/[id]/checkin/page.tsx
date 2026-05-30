"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { Badge } from "../../../../components/Badge";
import { EventContextNav } from "../../../../components/EventContextNav";
import { QRScanner } from "../../../../components/QRScanner";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { extractTicketToken } from "../../../../lib/tickets";
import type { PublicTicket } from "../../../../types/database";

type CheckinResult = {
  tone: "success" | "warning" | "danger";
  title: string;
  message: string;
  ticket?: PublicTicket;
  scannedAt?: string;
};

export default function CheckinPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [input, setInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);

  async function validateTicket(rawValue: string) {
    if (isChecking) {
      return;
    }

    const token = extractTicketToken(rawValue);
    setIsChecking(true);
    setResult(null);

    const { data, error } = await supabase
      .from("tickets")
      .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, events(id, name, location, starts_at), guests(id, name, contact)")
      .eq("token", token)
      .eq("event_id", params.id)
      .maybeSingle();

    if (error || !data) {
      setIsChecking(false);
      setResult({
        tone: "danger",
        title: "Entrada invalida",
        message: error?.message || "No encontramos una entrada para este evento.",
      });
      return;
    }

    const ticket = data as unknown as PublicTicket;

    if (ticket.status === "cancelled") {
      await supabase.from("ticket_scans").insert({
        ticket_id: ticket.id,
        event_id: params.id,
        result: "cancelled",
        note: "Ticket cancelado",
      });
      setIsChecking(false);
      setResult({
        tone: "danger",
        title: "Entrada cancelada",
        message: "No permitir ingreso.",
        ticket,
        scannedAt: new Date().toISOString(),
      });
      return;
    }

    if (ticket.status === "used" || ticket.used_count >= ticket.max_uses) {
      await supabase.from("ticket_scans").insert({
        ticket_id: ticket.id,
        event_id: params.id,
        result: "already_used",
        note: "Intento de reingreso o ticket ya usado",
      });
      setIsChecking(false);
      setResult({
        tone: "warning",
        title: "Entrada ya usada",
        message: "Revisar con responsable antes de permitir ingreso.",
        ticket,
        scannedAt: new Date().toISOString(),
      });
      return;
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "used",
        used_count: ticket.used_count + 1,
      })
      .eq("id", ticket.id);

    await supabase.from("ticket_scans").insert({
      ticket_id: ticket.id,
      event_id: params.id,
      result: updateError ? "error" : "ok",
      note: updateError?.message ?? null,
    });

    setIsChecking(false);

    if (updateError) {
      setResult({
        tone: "danger",
        title: "No se pudo validar",
        message: updateError.message,
        ticket,
        scannedAt: new Date().toISOString(),
      });
      return;
    }

    setResult({
      tone: "success",
      title: "Entrada valida",
      message: "Permitir ingreso.",
      ticket: { ...ticket, status: "used", used_count: ticket.used_count + 1 },
      scannedAt: new Date().toISOString(),
    });
    setInput("");
  }

  async function handleManualCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await validateTicket(input);
  }

  return (
    <AppShell title="Scanner QR">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <EventContextNav eventId={params.id} />

        <header className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-emerald-300">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Scanner QR</h1>
          <p className="mt-2 text-sm text-zinc-400">Escanea QR o pegá token/link.</p>
        </header>

        <QRScanner onScan={validateTicket} disabled={isChecking} />

        <form onSubmit={handleManualCheckin} className="space-y-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-14 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-lg text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
            placeholder="Token o link /ticket/..."
            required
          />
          <button
            type="submit"
            disabled={isChecking}
            className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 text-lg font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60"
          >
            {isChecking ? "Validando..." : "Validar entrada"}
          </button>
        </form>

        {result ? (
          <section
            className={`rounded-2xl border p-5 shadow-2xl shadow-black/20 ${
              result.tone === "success"
                ? "border-emerald-400/30 bg-emerald-400/10"
                : result.tone === "warning"
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-red-400/30 bg-red-400/10"
            }`}
          >
            <Badge tone={result.tone}>{result.title}</Badge>
            <h2 className="mt-4 text-3xl font-semibold">{result.message}</h2>
            {result.ticket ? (
              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl bg-zinc-950/60 p-4">
                  <p className="text-zinc-500">Invitado</p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.ticket.guests?.name || "Sin invitado"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-4">
                  <p className="text-zinc-500">Evento</p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.ticket.events?.name || "Evento"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-4">
                  <p className="text-zinc-500">Hora</p>
                  <p className="mt-1 font-semibold">
                    {result.scannedAt
                      ? new Intl.DateTimeFormat("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }).format(new Date(result.scannedAt))
                      : "Ahora"}
                  </p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-5 min-h-12 w-full rounded-xl border border-white/10 px-5 font-semibold text-zinc-100 transition hover:bg-white/5"
            >
              Escanear siguiente
            </button>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
