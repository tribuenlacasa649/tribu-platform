"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "../lib/cash";
import { getRecipeMultiplier, getRecipeTotalCost } from "../lib/recipes";
import type { RecipeIngredientRecord, RecipeRecord } from "../types/database";

type RecipeCalculatorProps = {
  recipe: RecipeRecord;
  ingredients: RecipeIngredientRecord[];
};

export function RecipeCalculator({ recipe, ingredients }: RecipeCalculatorProps) {
  const [plannedServings, setPlannedServings] = useState(recipe.servings_base || 1);
  const multiplier = getRecipeMultiplier(recipe.servings_base, plannedServings);
  const totalCost = useMemo(() => getRecipeTotalCost(ingredients), [ingredients]);

  return (
    <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Calculadora</p>
          <h3 className="text-lg font-black">Cantidades</h3>
        </div>
        <input
          type="number"
          min={1}
          value={plannedServings}
          onChange={(event) => setPlannedServings(Math.max(1, Number(event.target.value) || 1))}
          className="min-h-11 w-28 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 text-center font-black outline-none"
        />
      </div>
      <div className="mt-3 rounded-xl bg-[#F6F1E8] p-3 text-sm font-semibold text-[#6F7668]">
        Multiplicador x{multiplier.toFixed(2)} · Costo estimado {formatCurrency(totalCost * multiplier)}
      </div>
      <div className="mt-3 grid gap-2">
        {ingredients.map((ingredient) => (
          <div key={ingredient.id} className="rounded-xl border border-[#18251A]/10 p-3 text-sm">
            <p className="font-black">{ingredient.name}</p>
            <p className="mt-1 text-[#6F7668]">
              Base: {ingredient.quantity} {ingredient.unit || ""} · Ajustada: {(ingredient.quantity * multiplier).toFixed(2)} {ingredient.unit || ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
