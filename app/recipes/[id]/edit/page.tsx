"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { recipeCategories } from "../../../../lib/recipes";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { RecipeRecord } from "../../../../types/database";

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [form, setForm] = useState({
    name: "",
    category: "principal",
    photo_url: "",
    description: "",
    servings_base: "10",
    prep_time_minutes: "0",
    instructions: "",
    mise_en_place: "",
    production_notes: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      const { data, error: requestError } = await supabase
        .from("recipes")
        .select("id, name, category, photo_url, description, servings_base, prep_time_minutes, instructions, mise_en_place, production_notes, notes, created_at")
        .eq("id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
        return;
      }

      const recipe = data as RecipeRecord;
      setForm({
        name: recipe.name,
        category: recipe.category || "principal",
        photo_url: recipe.photo_url || "",
        description: recipe.description || "",
        servings_base: String(recipe.servings_base),
        prep_time_minutes: String(recipe.prep_time_minutes || 0),
        instructions: recipe.instructions || "",
        mise_en_place: recipe.mise_en_place || "",
        production_notes: recipe.production_notes || "",
        notes: recipe.notes || "",
      });
    }

    loadRecipe();
  }, [params.id, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const { error: requestError } = await supabase
      .from("recipes")
      .update({
        name: form.name.trim(),
        category: form.category,
        photo_url: form.photo_url.trim() || null,
        description: form.description.trim() || null,
        servings_base: Number(form.servings_base) || 1,
        prep_time_minutes: Number(form.prep_time_minutes) || null,
        instructions: form.instructions.trim() || null,
        mise_en_place: form.mise_en_place.trim() || null,
        production_notes: form.production_notes.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", params.id);

    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push(`/recipes/${params.id}`);
    router.refresh();
  }

  return (
    <AppShell title="Editar receta">
      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-2xl gap-3 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
        <h1 className="text-2xl font-black">Editar receta</h1>
        {error ? <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required />
        <input value={form.photo_url} onChange={(event) => setForm({ ...form, photo_url: event.target.value })} placeholder="URL de foto" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
            {recipeCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input value={form.servings_base} onChange={(event) => setForm({ ...form, servings_base: event.target.value })} type="number" min={1} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          <input value={form.prep_time_minutes} onChange={(event) => setForm({ ...form, prep_time_minutes: event.target.value })} type="number" min={0} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
        </div>
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} placeholder="Descripción" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <textarea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} rows={5} placeholder="Pasos" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <textarea value={form.mise_en_place} onChange={(event) => setForm({ ...form, mise_en_place: event.target.value })} rows={3} placeholder="Mise en place" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <textarea value={form.production_notes} onChange={(event) => setForm({ ...form, production_notes: event.target.value })} rows={3} placeholder="Notas de producción" className="rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
        <button disabled={isSaving} className="min-h-12 rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8] disabled:opacity-50">
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </AppShell>
  );
}
