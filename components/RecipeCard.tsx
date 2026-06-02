import Link from "next/link";
import { formatCurrency } from "../lib/cash";
import type { RecipeRecord } from "../types/database";

type RecipeCardProps = {
  recipe: RecipeRecord;
  totalCost?: number;
};

export function RecipeCard({ recipe, totalCost = 0 }: RecipeCardProps) {
  const costPerServing = recipe.servings_base > 0 ? totalCost / recipe.servings_base : 0;

  return (
    <Link href={`/recipes/${recipe.id}`} className="block rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">{recipe.category || "receta"}</p>
      <h3 className="mt-1 text-lg font-black">{recipe.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-[#6F7668]">{recipe.description || "Sin descripción"}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F6F1E8] p-3">
          <p className="text-xs font-black uppercase text-[#7F836F]">Base</p>
          <p className="font-black">{recipe.servings_base} porciones</p>
        </div>
        <div className="rounded-xl bg-[#F6F1E8] p-3">
          <p className="text-xs font-black uppercase text-[#7F836F]">Costo/porción</p>
          <p className="font-black">{formatCurrency(costPerServing)}</p>
        </div>
      </div>
    </Link>
  );
}
