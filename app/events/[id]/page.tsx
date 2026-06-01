"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { Badge, eventStatusTone } from "../../../components/Badge";
import { CopyButton } from "../../../components/CopyButton";
import { EventContextNav } from "../../../components/EventContextNav";
import { EventOverview } from "../../../components/EventOverview";
import { EventModuleGrid } from "../../../components/EventModuleGrid";
import { LocationCard } from "../../../components/LocationCard";
import { getAbsolutePublicEventUrl } from "../../../lib/public-routes";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { EventRecord } from "../../../types/database";
import { eventStatusLabels } from "../actions";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin definir";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

type EventStats = {
  guests: number;
  tickets: number;
  usedTickets: number;
  confirmedPayments: number;
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<EventStats>({
    guests: 0,
    tickets: 0,
    usedTickets: 0,
    confirmedPayments: 0,
  });

  useEffect(() => {
    async function loadEvent() {
      const { data, error: requestError } = await supabase
        .from("events")
        .select("id, name, description, location, location_name, location_address, location_maps_url, event_banner_url, starts_at, ends_at, status, slug, is_public, public_title, public_description, ticket_price, public_status, created_at")
        .eq("id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
      } else {
        setEvent(data as EventRecord);
      }

      const [guests, tickets, usedTickets, confirmedPayments] = await Promise.all([
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
          .eq("status", "used"),
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("event_id", params.id)
          .eq("status", "confirmed"),
      ]);

      setStats({
        guests: guests.count ?? 0,
        tickets: tickets.count ?? 0,
        usedTickets: usedTickets.count ?? 0,
        confirmedPayments: confirmedPayments.count ?? 0,
      });

      setIsLoading(false);
    }

    loadEvent();
  }, [params.id, supabase]);

  async function handleDelete() {
    if (!event || !confirm("Eliminar este evento?")) {
      return;
    }

    setIsDeleting(true);
    const { error: requestError } = await supabase.from("events").delete().eq("id", event.id);
    setIsDeleting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <AppShell title="Detalle evento">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <header className="space-y-3">
          <Link href="/events" className="text-sm font-semibold text-[#315C38]">
            Volver a eventos
          </Link>

          {isLoading ? (
            <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
              Cargando evento...
            </div>
          ) : event ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10">
              {event.event_banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.event_banner_url} alt={event.name} className="h-44 w-full object-cover" />
              ) : null}
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={eventStatusTone(event.status)}>
                      {eventStatusLabels[event.status]}
                    </Badge>
                    <span className="text-sm text-[#7F836F]">
                      Creado {formatDateTime(event.created_at)}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                    {event.name}
                  </h1>
                  <p className="mt-2 text-[#6F7668]">{event.location || "Sin ubicacion"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:min-w-48">
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="flex min-h-10 items-center justify-center rounded-lg border border-[#18251A]/10 px-4 text-sm font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="min-h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-[#18251A] transition hover:bg-red-400 disabled:opacity-60"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {event ? (
          <>
            <EventOverview eventId={event.id} stats={stats} />

            <section className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={event.is_public && event.public_status === "published" ? "success" : "neutral"}>
                      {event.is_public ? event.public_status : "privado"}
                    </Badge>
                    <Badge tone="soon">Publico</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">Link publico</h2>
                  <p className="mt-2 break-all text-sm text-[#6F7668]">
                    {event.slug ? getAbsolutePublicEventUrl(event.slug) : "Configura un slug para compartir."}
                  </p>
                </div>
                <div className="grid gap-3 sm:min-w-52">
                  {event.slug ? (
                    <CopyButton value={getAbsolutePublicEventUrl(event.slug)} />
                  ) : null}
                  <Link
                    href={`/events/${event.id}/public-guests`}
                    className="flex min-h-11 items-center justify-center rounded-lg border border-[#18251A]/10 px-4 text-sm font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
                  >
                    Solicitudes publicas
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
                <p className="text-sm text-[#7F836F]">Inicio</p>
                <p className="mt-2 font-semibold text-[#18251A]">
                  {formatDateTime(event.starts_at)}
                </p>
              </div>
              <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
                <p className="text-sm text-[#7F836F]">Fin</p>
                <p className="mt-2 font-semibold text-[#18251A]">
                  {formatDateTime(event.ends_at)}
                </p>
              </div>
              <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
                <p className="text-sm text-[#7F836F]">Descripcion</p>
                <p className="mt-2 line-clamp-3 text-[#18251A]">
                  {event.description || "Sin descripcion"}
                </p>
              </div>
            </section>

            <LocationCard
              name={event.location_name || event.location}
              address={event.location_address}
              mapsUrl={event.location_maps_url}
            />

            <EventModuleGrid eventId={event.id} />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
