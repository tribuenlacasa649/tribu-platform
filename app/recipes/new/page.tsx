"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { recipeCategories } from "../../../lib/recipes";
import { createSupabaseBrowserClient } from "../../../lib/supabase";

export default function NewRecipePage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    name: "",
    category: "principal",
    description: "",
    servings_base: "10",
    instructions: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const { data, error: requestError } = await supabase
      .from("recipes")
      .insert({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        servings_base: Number(form.servings_base) || 1,
        instructions: form.instructions.trim() || null,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(`/recipes/${data.id}`);
    router.refresh();
  }

  return (
    <AppShell title="Nueva receta">
      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-2xl gap-3 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
        <h1 className="text-2xl font-black">Crear receta</h1>
        {error ? <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
            {recipeCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input value={form.servings_base} onChange={(event) => setForm({ ...form, servings_base: event.target.value })} type="number" min={1} placeholder="Porciones base" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
        </div>
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} placeholder="Descripción" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} rows={5} placeholder="Pasos" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <button disabled={isSaving} className="min-h-12 rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8] disabled:opacity-50">
          {isSaving ? "Creando..." : "Crear receta"}
        </button>
      </form>
    </AppShell>
  );
}
