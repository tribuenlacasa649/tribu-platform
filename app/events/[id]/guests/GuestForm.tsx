"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { guestStatusLabels, guestStatuses } from "../../actions";
import type { GuestRecord, GuestStatus } from "../../../../types/database";

type GuestFormProps = {
  eventId: string;
  guest?: GuestRecord;
  mode: "create" | "edit";
};

export function GuestForm({ eventId, guest, mode }: GuestFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [name, setName] = useState(guest?.name ?? "");
  const [contact, setContact] = useState(guest?.contact ?? "");
  const [foodPreferences, setFoodPreferences] = useState(guest?.food_preferences ?? "");
  const [ticketQuantity, setTicketQuantity] = useState(guest?.ticket_quantity ?? 1);
  const [status, setStatus] = useState<GuestStatus>(guest?.status ?? "active");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre del invitado es obligatorio.");
      return;
    }

    setIsSaving(true);

    const payload = {
      event_id: eventId,
      name: name.trim(),
      contact: contact.trim() || null,
      food_preferences: foodPreferences.trim() || null,
      ticket_quantity: Math.max(1, Number(ticketQuantity) || 1),
      status,
    };

    const request =
      mode === "edit" && guest
        ? supabase.from("guests").update(payload).eq("id", guest.id).select("id").single()
        : supabase.from("guests").insert(payload).select("id").single();

    const { data, error: requestError } = await request;
    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(`/events/${eventId}/guests/${data.id}`);
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
              placeholder="Nombre del invitado"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="contact" className="text-sm font-medium text-[#18251A]">
                Contacto
              </label>
              <input
                id="contact"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="Telefono, email o Instagram"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-[#18251A]">
                Estado
              </label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as GuestStatus)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              >
                {guestStatuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {guestStatusLabels[statusOption]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="food" className="text-sm font-medium text-[#18251A]">
                Preferencia gastronomica
              </label>
              <input
                id="food"
                value={foodPreferences}
                onChange={(event) => setFoodPreferences(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="Vegetariano, celiaco, sin preferencia"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tickets" className="text-sm font-medium text-[#18251A]">
                Entradas
              </label>
              <input
                id="tickets"
                type="number"
                min={1}
                value={ticketQuantity}
                onChange={(event) => setTicketQuantity(Number(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-12 rounded-lg bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear invitado"}
        </button>
        <Link
          href={guest ? `/events/${eventId}/guests/${guest.id}` : `/events/${eventId}/guests`}
          className="flex min-h-12 items-center justify-center rounded-lg border border-[#18251A]/10 px-5 text-base font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
