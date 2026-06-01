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
      .select("id, event_id, guest_id, public_guest_id, token, status, max_uses, used_count, created_at, events(id, name, location, location_name, location_address, location_maps_url, event_banner_url, starts_at), guests(id, name, contact)")
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

        <header className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:p-6">
          <Link href={`/events/${params.id}`} className="text-sm font-semibold text-[#315C38]">
            Volver al evento
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Scanner QR</h1>
          <p className="mt-2 text-sm text-[#6F7668]">Escanea QR o pegá token/link.</p>
        </header>

        <QRScanner onScan={validateTicket} disabled={isChecking} />

        <form onSubmit={handleManualCheckin} className="space-y-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-14 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-lg text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
            placeholder="Token o link /ticket/..."
            required
          />
          <button
            type="submit"
            disabled={isChecking}
            className="min-h-14 w-full rounded-xl bg-[#315C38] px-5 text-lg font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:opacity-60"
          >
            {isChecking ? "Validando..." : "Validar entrada"}
          </button>
        </form>

        {result ? (
          <section
            className={`rounded-2xl border p-5 shadow-2xl shadow-[#294F2F]/10 ${
              result.tone === "success"
                ? "border-[#315C38]/20 bg-[#315C38]/10"
                : result.tone === "warning"
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-red-400/30 bg-red-400/10"
            }`}
          >
            <Badge tone={result.tone}>{result.title}</Badge>
            <h2 className="mt-4 text-3xl font-semibold">{result.message}</h2>
            {result.ticket ? (
              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-xl bg-[#F6F1E8]/60 p-4">
                  <p className="text-[#7F836F]">Invitado</p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.ticket.guests?.name || "Sin invitado"}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F6F1E8]/60 p-4">
                  <p className="text-[#7F836F]">Evento</p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.ticket.events?.name || "Evento"}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F6F1E8]/60 p-4">
                  <p className="text-[#7F836F]">Hora</p>
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
              className="mt-5 min-h-12 w-full rounded-xl border border-[#18251A]/10 px-5 font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
            >
              Escanear siguiente
            </button>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
