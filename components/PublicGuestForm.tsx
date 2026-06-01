"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { createAccessToken } from "../lib/tokens";
import { getPublicGuestRoute } from "../lib/public-routes";
import { cleanPhoneNumber, phoneCountries } from "../lib/phone";

type PublicGuestFormProps = {
  eventId: string;
};

export function PublicGuestForm({ eventId }: PublicGuestFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+54");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [foodPreferences, setFoodPreferences] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateTicketQuantity(nextValue: number) {
    setTicketQuantity(Math.min(10, Math.max(1, nextValue)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanPhone = cleanPhoneNumber(phone);

    if (!fullName.trim() || !cleanPhone) {
      setError("Completa nombre y WhatsApp.");
      return;
    }

    setIsSaving(true);
    const accessToken = createAccessToken();

    const payload = {
      new_event_id: eventId,
      new_full_name: fullName.trim(),
      new_country_code: countryCode,
      new_phone: cleanPhone,
      new_instagram: instagram.trim() || null,
      new_ticket_quantity: Math.max(1, Number(ticketQuantity) || 1),
      new_food_preferences: foodPreferences.trim() || null,
      new_access_token: accessToken,
    };

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_public_guest_registration",
      payload
    );

    if (rpcError) {
      setIsSaving(false);
      setError(rpcError.message);
      return;
    }

    setIsSaving(false);
    router.push(getPublicGuestRoute((rpcData as string | null) ?? accessToken));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 shadow-2xl shadow-[#294F2F]/10">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-semibold text-[#18251A]">
              Nombre completo
            </label>
            <input
              id="full_name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-13 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold text-[#18251A]">
              WhatsApp
            </label>
            <div className="grid grid-cols-[118px_1fr] gap-2">
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="min-h-13 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 text-base text-[#18251A] outline-none transition focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              >
                {phoneCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="min-h-13 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="11 5555 5555"
                inputMode="tel"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="instagram" className="text-sm font-semibold text-[#18251A]">
                Instagram
              </label>
              <input
                id="instagram"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                className="min-h-13 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
                placeholder="@usuario"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#18251A]">
                Entradas
              </label>
              <div className="grid min-h-13 grid-cols-[56px_1fr_56px] overflow-hidden rounded-xl border border-[#18251A]/10 bg-[#F6F1E8]">
                <button
                  type="button"
                  onClick={() => updateTicketQuantity(ticketQuantity - 1)}
                  disabled={ticketQuantity <= 1}
                  className="text-2xl font-semibold text-[#315C38] transition hover:bg-[#DCE5D2] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Restar entrada"
                >
                  -
                </button>
                <div className="flex flex-col items-center justify-center border-x border-[#18251A]/10">
                  <span className="text-2xl font-semibold leading-none">{ticketQuantity}</span>
                  <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7F836F]">
                    máximo 10
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateTicketQuantity(ticketQuantity + 1)}
                  disabled={ticketQuantity >= 10}
                  className="text-2xl font-semibold text-[#315C38] transition hover:bg-[#DCE5D2] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Sumar entrada"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="food" className="text-sm font-semibold text-[#18251A]">
              Preferencias gastronomicas
            </label>
            <input
              id="food"
              value={foodPreferences}
              onChange={(event) => setFoodPreferences(event.target.value)}
              className="min-h-13 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 text-base text-[#18251A] outline-none transition placeholder:text-[#7F836F] focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="min-h-14 w-full rounded-xl bg-[#315C38] px-5 text-lg font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:opacity-60"
      >
        {isSaving ? "Reservando..." : "Reservar entrada"}
      </button>
    </form>
  );
}
