"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { RecipeCalculator } from "../../../../components/RecipeCalculator";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { EventRecipeRecord, RecipeIngredientRecord, RecipeRecord } from "../../../../types/database";

type EventRecipeWithRecipe = EventRecipeRecord & {
  recipes: RecipeRecord | null;
};

export default function EventRecipesPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [eventRecipes, setEventRecipes] = useState<EventRecipeWithRecipe[]>([]);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredientRecord[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [plannedServings, setPlannedServings] = useState("70");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [eventRecipesResult, recipesResult, ingredientsResult] = await Promise.all([
      supabase
        .from("event_recipes")
        .select("id, event_id, recipe_id, planned_servings, notes, created_at, recipes(id, name, category, description, servings_base, instructions, notes, created_at)")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("recipes")
        .select("id, name, category, description, servings_base, instructions, notes, created_at")
        .order("name", { ascending: true }),
      supabase
        .from("recipe_ingredients")
        .select("id, recipe_id, name, quantity, unit, unit_cost, total_cost, created_at"),
    ]);

    if (eventRecipesResult.error || recipesResult.error || ingredientsResult.error) {
      setError(eventRecipesResult.error?.message || recipesResult.error?.message || ingredientsResult.error?.message || "");
    } else {
      setEventRecipes((eventRecipesResult.data ?? []) as unknown as EventRecipeWithRecipe[]);
      const loadedRecipes = (recipesResult.data ?? []) as RecipeRecord[];
      setRecipes(loadedRecipes);
      setIngredients((ingredientsResult.data ?? []) as RecipeIngredientRecord[]);
      setRecipeId((current) => current || loadedRecipes[0]?.id || "");
    }

    setIsLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const { error: requestError } = await supabase.from("event_recipes").insert({
      event_id: params.id,
      recipe_id: recipeId,
      planned_servings: Number(plannedServings) || 1,
      notes: notes.trim() || null,
    });

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setNotes("");
    await loadData();
  }

  async function deleteEventRecipe(id: string) {
    const { error: requestError } = await supabase
      .from("event_recipes")
      .delete()
      .eq("id", id)
      .eq("event_id", params.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadData();
  }

  function getIngredients(recipeIdValue: string) {
    return ingredients.filter((ingredient) => ingredient.recipe_id === recipeIdValue);
  }

  return (
    <AppShell title="Recetas">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Evento</p>
          <h1 className="mt-1 text-2xl font-black">Recetas del evento</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Planificación de cocina y cantidades.</p>
          <Link href="/recipes/new" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 text-sm font-black">
            Crear receta base
          </Link>
        </header>

        {error ? <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <select value={recipeId} onChange={(event) => setRecipeId(event.target.value)} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required>
              {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
            </select>
            <input value={plannedServings} onChange={(event) => setPlannedServings(event.target.value)} type="number" min={1} placeholder="Porciones" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas" className="mt-3 min-h-11 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          <button className="mt-3 min-h-12 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">Asociar receta</button>
        </form>

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando recetas...</div>
        ) : eventRecipes.length === 0 ? (
          <EmptyState title="Sin recetas asignadas" description="Asocia recetas del recetario a este evento." />
        ) : (
          <section className="grid gap-4">
            {eventRecipes.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">{item.recipes?.category || "receta"}</p>
                    <h2 className="mt-1 text-xl font-black">{item.recipes?.name || "Receta"}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#6F7668]">{item.planned_servings} porciones planificadas</p>
                  </div>
                  <button onClick={() => deleteEventRecipe(item.id)} className="rounded-xl bg-[#F36F4A] px-3 py-2 text-xs font-black text-[#FFFDF8]">Quitar</button>
                </div>
                {item.recipes ? (
                  <div className="mt-4">
                    <RecipeCalculator recipe={{ ...item.recipes, servings_base: item.recipes.servings_base }} ingredients={getIngredients(item.recipe_id)} />
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
