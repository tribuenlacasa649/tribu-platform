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
    | "event_banner_url"
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
      className="overflow-hidden rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10 transition hover:border-[#315C38]/30 hover:bg-[#FFFDF8]"
    >
      {event.event_banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.event_banner_url} alt={event.public_title || event.name} className="h-40 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <p className="text-sm font-semibold text-[#315C38]">{formatDate(event.starts_at)}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          {event.public_title || event.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F7668]">
          {event.public_description || "Evento privado Tribu."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-[#F6F1E8]/70 p-3">
          <p className="text-[#7F836F]">Lugar</p>
          <p className="mt-1 font-semibold text-[#18251A]">{event.location || "A confirmar"}</p>
        </div>
        <div className="rounded-xl bg-[#F6F1E8]/70 p-3">
          <p className="text-[#7F836F]">Entrada</p>
          <p className="mt-1 font-semibold text-[#18251A]">{formatPrice(event.ticket_price)}</p>
        </div>
      </div>
      </div>
    </Link>
  );
}
