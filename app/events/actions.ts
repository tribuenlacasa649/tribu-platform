"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { EventFormValues } from "../../types/event";

function getEventFormValues(formData: FormData): EventFormValues {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name) {
    throw new Error("El nombre del evento es obligatorio.");
  }

  return { name, description, location };
}

export async function createEvent(formData: FormData) {
  const values = getEventFormValues(formData);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: values.name,
      description: values.description || null,
      location: values.location || null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`No se pudo crear el evento: ${error.message}`);
  }

  revalidatePath("/events");
  redirect(`/events/${data.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  const values = getEventFormValues(formData);
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("events")
    .update({
      name: values.name,
      description: values.description || null,
      location: values.location || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el evento: ${error.message}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function deleteEvent(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el evento: ${error.message}`);
  }

  revalidatePath("/events");
  redirect("/events");
}
