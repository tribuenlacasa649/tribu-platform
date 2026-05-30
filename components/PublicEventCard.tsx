import Link from "next/link";
import type { EventRecord } from "../types/database";
import { getPublicEventRoute } from "../lib/public-routes";

type PublicEventCardProps = {
  event: Pick<
    EventRecord,
    | "slug"
    | "name"
    | "public_title"
    | "public_description"
    | "location"
    | "starts_at"
    | "ticket_price"
  >;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Fecha a confirmar";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(value: number | null) {
  if (!value || value <= 0) {
    return "Aporte a confirmar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PublicEventCard({ event }: PublicEventCardProps) {
  if (!event.slug) {
    return null;
  }

  return (
    <Link
      href={getPublicEventRoute(event.slug)}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
    >
      <p className="text-sm font-semibold text-emerald-300">{formatDate(event.starts_at)}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {event.public_title || event.name}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
        {event.public_description || "Evento privado Tribu."}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-zinc-950/70 p-3">
          <p className="text-zinc-500">Lugar</p>
          <p className="mt-1 font-semibold text-zinc-100">{event.location || "A confirmar"}</p>
        </div>
        <div className="rounded-xl bg-zinc-950/70 p-3">
          <p className="text-zinc-500">Entrada</p>
          <p className="mt-1 font-semibold text-zinc-100">{formatPrice(event.ticket_price)}</p>
        </div>
      </div>
    </Link>
  );
}
