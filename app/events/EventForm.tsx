"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { EventBannerUpload } from "../../components/EventBannerUpload";
import { eventStatusLabels, eventStatuses } from "./actions";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import { normalizeSlug } from "../../lib/tokens";
import type { EventRecord, EventStatus, PublicEventStatus } from "../../types/database";

type EventFormProps = {
  event?: EventRecord;
  mode: "create" | "edit";
};

const publicStatusLabels: Record<PublicEventStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  closed: "Cerrado",
};

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function EventForm({ event, mode }: EventFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [name, setName] = useState(event?.name ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [locationName, setLocationName] = useState(event?.location_name ?? "");
  const [locationAddress, setLocationAddress] = useState(event?.location_address ?? "");
  const [locationMapsUrl, setLocationMapsUrl] = useState(event?.location_maps_url ?? "");
  const [eventBannerUrl, setEventBannerUrl] = useState(event?.event_banner_url ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(event?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(event?.ends_at ?? null));
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "draft");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [isPublic, setIsPublic] = useState(event?.is_public ?? false);
  const [publicTitle, setPublicTitle] = useState(event?.public_title ?? "");
  const [publicDescription, setPublicDescription] = useState(event?.public_description ?? "");
  const [ticketPrice, setTicketPrice] = useState(
    event?.ticket_price ? String(event.ticket_price) : ""
  );
  const [publicStatus, setPublicStatus] = useState<PublicEventStatus>(
    event?.public_status ?? "draft"
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre del evento es obligatorio.");
      return;
    }

    const normalizedSlug = normalizeSlug(slug || name);

    if (isPublic && !normalizedSlug) {
      setError("El slug publico es obligatorio para publicar el evento.");
      return;
    }

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      location_name: locationName.trim() || location.trim() || null,
      location_address: locationAddress.trim() || null,
      location_maps_url: locationMapsUrl.trim() || null,
      event_banner_url: eventBannerUrl || null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      status,
      slug: normalizedSlug || null,
      is_public: isPublic,
      public_title: publicTitle.trim() || null,
      public_description: publicDescription.trim() || null,
      ticket_price: ticketPrice ? Number(ticketPrice) : null,
      public_status: publicStatus,
    };

    const request =
      mode === "edit" && event
        ? supabase.from("events").update(payload).eq("id", event.id).select("id").single()
        : supabase.from("events").insert(payload).select("id").single();

    const { data, error: requestError } = await request;
    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(`/events/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-[#18251A]">
              Nombre
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Nombre del evento"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-[#18251A]">
                Lugar
              </label>
              <input
                id="location"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  if (!locationName) {
                    setLocationName(event.target.value);
                  }
                }}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="Salon o nombre del lugar"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-[#18251A]">
                Estado interno
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as EventStatus)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              >
                {eventStatuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {eventStatusLabels[statusOption]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="location_name" className="text-sm font-medium text-[#18251A]">
                Nombre en mapa
              </label>
              <input
                id="location_name"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="Ej: Casa Tribu"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location_address" className="text-sm font-medium text-[#18251A]">
                Direccion
              </label>
              <input
                id="location_address"
                value={locationAddress}
                onChange={(event) => setLocationAddress(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="Calle, numero, ciudad"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location_maps_url" className="text-sm font-medium text-[#18251A]">
              Link de Google Maps
            </label>
            <input
              id="location_maps_url"
              value={locationMapsUrl}
              onChange={(event) => setLocationMapsUrl(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="https://maps.app.goo.gl/..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="starts_at" className="text-sm font-medium text-[#18251A]">
                Inicio
              </label>
              <input
                id="starts_at"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ends_at" className="text-sm font-medium text-[#18251A]">
                Fin
              </label>
              <input
                id="ends_at"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-[#18251A]">
              Descripcion interna
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 py-3 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Notas internas del evento"
            />
          </div>
        </div>
      </div>

      <EventBannerUpload eventId={event?.id} value={eventBannerUrl} onChange={setEventBannerUrl} />

      <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Publicacion</h2>
            <p className="mt-1 text-sm text-[#6F7668]">Link para compartir por WhatsApp o Instagram.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#18251A]">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-5 w-5 accent-[#315C38]"
            />
            Publico
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium text-[#18251A]">
                Slug
              </label>
              <input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(normalizeSlug(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="mi-evento"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="public_status" className="text-sm font-medium text-[#18251A]">
                Estado publico
              </label>
              <select
                id="public_status"
                value={publicStatus}
                onChange={(event) => setPublicStatus(event.target.value as PublicEventStatus)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              >
                {(["draft", "published", "closed"] as PublicEventStatus[]).map((option) => (
                  <option key={option} value={option}>
                    {publicStatusLabels[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="public_title" className="text-sm font-medium text-[#18251A]">
              Titulo publico
            </label>
            <input
              id="public_title"
              value={publicTitle}
              onChange={(event) => setPublicTitle(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Nombre visible para invitados"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="public_description" className="text-sm font-medium text-[#18251A]">
              Descripcion publica
            </label>
            <textarea
              id="public_description"
              value={publicDescription}
              onChange={(event) => setPublicDescription(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 py-3 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Texto corto para la pagina publica"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ticket_price" className="text-sm font-medium text-[#18251A]">
              Precio / aporte sugerido
            </label>
            <input
              id="ticket_price"
              type="number"
              min={0}
              value={ticketPrice}
              onChange={(event) => setTicketPrice(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-12 rounded-lg bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear evento"}
        </button>
        <Link
          href={event ? `/events/${event.id}` : "/events"}
          className="flex min-h-12 items-center justify-center rounded-lg border border-[#18251A]/10 px-5 text-base font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
