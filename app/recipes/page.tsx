"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { EmptyState } from "../../components/EmptyState";
import { RecipeCard } from "../../components/RecipeCard";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { RecipeIngredientRecord, RecipeRecord } from "../../types/database";

export default function RecipesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [ingredients, setIngredients] = useState<RecipeIngredientRecord[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecipes() {
      const [recipesResult, ingredientsResult] = await Promise.all([
        supabase
          .from("recipes")
          .select("id, name, category, description, servings_base, instructions, notes, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("recipe_ingredients")
          .select("id, recipe_id, name, quantity, unit, unit_cost, total_cost, created_at"),
      ]);

      if (recipesResult.error || ingredientsResult.error) {
        setError(recipesResult.error?.message || ingredientsResult.error?.message || "");
      } else {
        setRecipes((recipesResult.data ?? []) as RecipeRecord[]);
        setIngredients((ingredientsResult.data ?? []) as RecipeIngredientRecord[]);
      }

      setIsLoading(false);
    }

    loadRecipes();
  }, [supabase]);

  const filteredRecipes = recipes.filter((recipe) =>
    [recipe.name, recipe.category, recipe.description].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase())
  );

  function getTotalCost(recipeId: string) {
    return ingredients
      .filter((ingredient) => ingredient.recipe_id === recipeId)
      .reduce((sum, ingredient) => sum + Number(ingredient.total_cost || 0), 0);
  }

  return (
    <AppShell title="Recetario">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Tribu</p>
          <h1 className="mt-1 text-2xl font-black">Recetario</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Recetas, costos y cantidades para eventos.</p>
          <Link href="/recipes/new" className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">
            Crear receta
          </Link>
        </header>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar receta..." className="min-h-12 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] px-4 font-semibold outline-none" />

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando recetas...</div>
        ) : filteredRecipes.length === 0 ? (
          <EmptyState title="Sin recetas" description="Crea la primera receta para cocina." actionHref="/recipes/new" actionLabel="Crear receta" />
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} totalCost={getTotalCost(recipe.id)} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
