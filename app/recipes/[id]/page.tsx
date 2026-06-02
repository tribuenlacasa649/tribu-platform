"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { RecipeCalculator } from "../../../components/RecipeCalculator";
import { formatCurrency } from "../../../lib/cash";
import { getRecipeTotalCost } from "../../../lib/recipes";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { RecipeIngredientRecord, RecipeRecord } from "../../../types/database";

const ingredientInitial = {
  name: "",
  quantity: "",
  unit: "kg",
  unit_cost: "",
};

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredientRecord[]>([]);
  const [ingredientForm, setIngredientForm] = useState(ingredientInitial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecipe = useCallback(async () => {
    const [recipeResult, ingredientsResult] = await Promise.all([
        supabase
          .from("recipes")
        .select("id, name, category, photo_url, description, servings_base, prep_time_minutes, instructions, mise_en_place, production_notes, notes, created_at")
        .eq("id", params.id)
        .single(),
      supabase
        .from("recipe_ingredients")
        .select("id, recipe_id, name, quantity, unit, unit_cost, total_cost, created_at")
        .eq("recipe_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

    if (recipeResult.error || ingredientsResult.error) {
      setError(recipeResult.error?.message || ingredientsResult.error?.message || "");
    } else {
      setRecipe(recipeResult.data as RecipeRecord);
      setIngredients((ingredientsResult.data ?? []) as RecipeIngredientRecord[]);
    }

    setIsLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    loadRecipe();
  }, [loadRecipe]);

  async function addIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const quantity = Number(ingredientForm.quantity) || 0;
    const unitCost = Number(ingredientForm.unit_cost) || 0;
    const { error: requestError } = await supabase.from("recipe_ingredients").insert({
      recipe_id: params.id,
      name: ingredientForm.name.trim(),
      quantity,
      unit: ingredientForm.unit.trim() || null,
      unit_cost: unitCost,
      total_cost: quantity * unitCost,
    });

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setIngredientForm(ingredientInitial);
    await loadRecipe();
  }

  async function deleteIngredient(id: string) {
    const { error: requestError } = await supabase.from("recipe_ingredients").delete().eq("id", id).eq("recipe_id", params.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadRecipe();
  }

  if (isLoading) {
    return <AppShell title="Receta"><div className="rounded-2xl bg-[#FFFDF8] p-4">Cargando receta...</div></AppShell>;
  }

  if (!recipe) {
    return <AppShell title="Receta"><div className="rounded-2xl bg-[#FFFDF8] p-4">{error || "Receta no encontrada."}</div></AppShell>;
  }

  const totalCost = getRecipeTotalCost(ingredients);
  const costPerServing = recipe.servings_base > 0 ? totalCost / recipe.servings_base : 0;

  return (
    <AppShell title={recipe.name}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="overflow-hidden rounded-[2rem] border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10">
          {recipe.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.photo_url} alt={recipe.name} className="h-64 w-full object-cover" />
          ) : (
            <div className="h-56 bg-gradient-to-br from-[#315C38] via-[#7F936A] to-[#F2C66D]" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">{recipe.category || "receta"}</p>
                <h1 className="mt-1 text-3xl font-black">{recipe.name}</h1>
                <p className="mt-2 text-sm font-semibold text-[#6F7668]">{recipe.description || "Sin descripción"}</p>
              </div>
              <Link href={`/recipes/${recipe.id}/edit`} className="rounded-xl border border-[#18251A]/10 px-4 py-3 text-sm font-black">Editar</Link>
            </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#F6F1E8] p-3"><p className="text-xs font-black uppercase text-[#7F836F]">Base</p><p className="font-black">{recipe.servings_base}</p></div>
            <div className="rounded-xl bg-[#F6F1E8] p-3"><p className="text-xs font-black uppercase text-[#7F836F]">Costo</p><p className="font-black">{formatCurrency(totalCost)}</p></div>
            <div className="rounded-xl bg-[#F6F1E8] p-3"><p className="text-xs font-black uppercase text-[#7F836F]">Porción</p><p className="font-black">{formatCurrency(costPerServing)}</p></div>
          </div>
          <div className="mt-2 rounded-xl bg-[#DCE5D2] p-3 text-sm font-black text-[#315C38]">
            Tiempo: {recipe.prep_time_minutes ? `${recipe.prep_time_minutes} minutos` : "sin definir"}
          </div>
          </div>
        </header>

        {error ? <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <RecipeCalculator recipe={recipe} ingredients={ingredients} />

        <form onSubmit={addIngredient} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <h2 className="text-lg font-black">Ingredientes</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <input value={ingredientForm.name} onChange={(event) => setIngredientForm({ ...ingredientForm, name: event.target.value })} placeholder="Ingrediente" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required />
            <input value={ingredientForm.quantity} onChange={(event) => setIngredientForm({ ...ingredientForm, quantity: event.target.value })} type="number" step="0.01" placeholder="Cantidad" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={ingredientForm.unit} onChange={(event) => setIngredientForm({ ...ingredientForm, unit: event.target.value })} placeholder="Unidad" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={ingredientForm.unit_cost} onChange={(event) => setIngredientForm({ ...ingredientForm, unit_cost: event.target.value })} type="number" step="0.01" placeholder="Costo unitario" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <button className="mt-3 min-h-11 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">Agregar ingrediente</button>
        </form>

        <section className="grid gap-2">
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFFDF8] p-4">
              <div>
                <p className="font-black">{ingredient.name}</p>
                <p className="text-sm text-[#6F7668]">{ingredient.quantity} {ingredient.unit || ""} · {formatCurrency(ingredient.total_cost)}</p>
              </div>
              <button onClick={() => deleteIngredient(ingredient.id)} className="rounded-xl bg-[#F36F4A] px-3 py-2 text-xs font-black text-[#FFFDF8]">Eliminar</button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-[#FFFDF8] p-4">
          <h2 className="text-lg font-black">Pasos</h2>
          <div className="mt-3 grid gap-2">
            {(recipe.instructions || "Sin pasos cargados.")
              .split("\n")
              .filter(Boolean)
              .map((step, index) => (
                <label key={`${step}-${index}`} className="flex gap-3 rounded-xl bg-[#F6F1E8] p-3 text-sm font-semibold text-[#42503E]">
                  <input type="checkbox" className="mt-1" />
                  <span><strong>Paso {index + 1}.</strong> {step}</span>
                </label>
              ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#FFFDF8] p-4">
            <h2 className="text-lg font-black">Mise en place</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#42503E]">{recipe.mise_en_place || "Sin mise en place."}</p>
          </div>
          <div className="rounded-2xl bg-[#FFFDF8] p-4">
            <h2 className="text-lg font-black">Producción</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#42503E]">{recipe.production_notes || recipe.notes || "Sin notas internas."}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
