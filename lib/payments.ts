import type { SupabaseClient } from "@supabase/supabase-js";
import { createTicketToken } from "./tickets";
import type { EventRecord, PublicGuestRecord } from "../types/database";

export function getSuggestedPaymentAmount(
  guest: Pick<PublicGuestRecord, "ticket_quantity">,
  event: Pick<EventRecord, "ticket_price"> | null
) {
  return (event?.ticket_price ?? 0) * guest.ticket_quantity;
}

export function formatMoney(value: number | null) {
  if (!value || value <= 0) {
    return "A confirmar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function confirmPublicGuestPayment(
  supabase: SupabaseClient,
  publicGuest: PublicGuestRecord,
  event: Pick<EventRecord, "id" | "ticket_price"> | null
) {
  let internalGuestId = publicGuest.internal_guest_id;

  if (!internalGuestId) {
    const { data: guestData, error: guestError } = await supabase
      .from("guests")
      .insert({
        event_id: publicGuest.event_id,
        name: publicGuest.full_name,
        contact: publicGuest.phone,
        food_preferences: publicGuest.food_preferences,
        ticket_quantity: publicGuest.ticket_quantity,
        notes: publicGuest.notes,
        status: "active",
      })
      .select("id")
      .single();

    if (guestError) {
      throw new Error(guestError.message);
    }

    internalGuestId = guestData.id;
  }

  const { data: existingTickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("id")
    .eq("event_id", publicGuest.event_id)
    .eq("public_guest_id", publicGuest.id)
    .neq("status", "cancelled");

  if (ticketsError) {
    throw new Error(ticketsError.message);
  }

  const existingCount = existingTickets?.length ?? 0;
  const missingTickets = Math.max(0, publicGuest.ticket_quantity - existingCount);

  if (missingTickets > 0) {
    const rows = Array.from({ length: missingTickets }, () => ({
      event_id: publicGuest.event_id,
      guest_id: internalGuestId,
      public_guest_id: publicGuest.id,
      token: createTicketToken(),
      status: "available",
      max_uses: 1,
      used_count: 0,
    }));

    const { error: insertTicketsError } = await supabase.from("tickets").insert(rows);

    if (insertTicketsError) {
      throw new Error(insertTicketsError.message);
    }
  }

  const amount = getSuggestedPaymentAmount(publicGuest, event);

  const { error: paymentError } = await supabase.from("payments").upsert(
    {
      event_id: publicGuest.event_id,
      public_guest_id: publicGuest.id,
      guest_id: internalGuestId,
      amount,
      status: "confirmed",
      method: "manual_transfer",
      reference: publicGuest.payment_reference,
      proof: publicGuest.payment_proof,
      confirmed_at: new Date().toISOString(),
      rejected_at: null,
    },
    { onConflict: "public_guest_id" }
  );

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const { error: updateError } = await supabase
    .from("public_guests")
    .update({
      status: "approved",
      payment_status: "confirmed",
      payment_confirmed_at: new Date().toISOString(),
      internal_guest_id: internalGuestId,
    })
    .eq("id", publicGuest.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
