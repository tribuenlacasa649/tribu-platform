"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { createAccessToken } from "../lib/tokens";
import { getPublicGuestRoute } from "../lib/public-routes";

type PublicGuestFormProps = {
  eventId: string;
};

export function PublicGuestForm({ eventId }: PublicGuestFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [foodPreferences, setFoodPreferences] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim()) {
      setError("Completa nombre y WhatsApp.");
      return;
    }

    setIsSaving(true);
    const accessToken = createAccessToken();

    const { error: requestError } = await supabase.from("public_guests").insert({
      event_id: eventId,
      full_name: fullName.trim(),
      phone: phone.trim(),
      instagram: instagram.trim() || null,
      ticket_quantity: Math.max(1, Number(ticketQuantity) || 1),
      food_preferences: foodPreferences.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
      payment_status: "pending",
      access_token: accessToken,
    });

    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(getPublicGuestRoute(accessToken));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-semibold text-zinc-200">
              Nombre completo
            </label>
            <input
              id="full_name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-13 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold text-zinc-200">
              WhatsApp
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="min-h-13 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="+54..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="instagram" className="text-sm font-semibold text-zinc-200">
                Instagram
              </label>
              <input
                id="instagram"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                className="min-h-13 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="@usuario"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-semibold text-zinc-200">
                Entradas
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={10}
                value={ticketQuantity}
                onChange={(event) => setTicketQuantity(Number(event.target.value))}
                className="min-h-13 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="food" className="text-sm font-semibold text-zinc-200">
              Preferencias gastronomicas
            </label>
            <input
              id="food"
              value={foodPreferences}
              onChange={(event) => setFoodPreferences(event.target.value)}
              className="min-h-13 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-semibold text-zinc-200">
              Notas
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 text-lg font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-60"
      >
        {isSaving ? "Reservando..." : "Reservar entrada"}
      </button>
    </form>
  );
}
