"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const location = String(formData.get("location") || "").trim();

    if (!name) {
      setError("El nombre del evento es obligatorio.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("events").insert({
      name,
      description,
      location,
      status: "draft",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/events");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-2xl">
        <a href="/events" className="text-sm text-emerald-400">← Volver a eventos</a>
        <h1 className="mt-6 text-4xl font-bold">Nuevo evento</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input name="name" placeholder="Nombre del evento" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
          <input name="location" placeholder="Ubicación" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
          <textarea name="description" placeholder="Descripción" rows={5} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />

          {error && <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-semibold text-black disabled:opacity-50">
            {loading ? "Creando..." : "Crear evento"}
          </button>
        </form>
      </section>
    </main>
  );
}
