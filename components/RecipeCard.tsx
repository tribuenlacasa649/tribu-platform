import Link from "next/link";
import { formatCurrency } from "../lib/cash";
import type { RecipeRecord } from "../types/database";

type RecipeCardProps = {
  recipe: RecipeRecord;
  totalCost?: number;
};

const fallbackByCategory: Record<string, string> = {
  entrada: "from-[#7F936A] to-[#DCE5D2]",
  principal: "from-[#315C38] to-[#F2C66D]",
  postre: "from-[#F36F4A] to-[#F8E8BF]",
  panificado: "from-[#8A6A3A] to-[#F8E8BF]",
  bebida: "from-[#155FB8] to-[#DDE9F7]",
  cocktail: "from-[#294F2F] to-[#F36F4A]",
  salsa: "from-[#B33F22] to-[#F2C66D]",
  producción: "from-[#18251A] to-[#7F936A]",
};

export function RecipeCard({ recipe, totalCost = 0 }: RecipeCardProps) {
  const costPerServing = recipe.servings_base > 0 ? totalCost / recipe.servings_base : 0;
  const category = (recipe.category || "principal").toLowerCase();

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block overflow-hidden rounded-[1.8rem] border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10 transition hover:-translate-y-0.5"
    >
      {recipe.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photo_url} alt={recipe.name} className="h-40 w-full object-cover" />
      ) : (
        <div className={`h-40 bg-gradient-to-br ${fallbackByCategory[category] || fallbackByCategory.principal}`} />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#315C38]">{recipe.category || "receta"}</p>
            <h3 className="mt-1 truncate text-xl font-black">{recipe.name}</h3>
          </div>
          <span className="rounded-full bg-[#DCE5D2] px-3 py-1 text-xs font-black text-[#315C38]">
            {recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : "sin tiempo"}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#6F7668]">
          {recipe.description || "Receta interna Tribu."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#F6F1E8] p-3">
            <p className="text-[10px] font-black uppercase text-[#7F836F]">Porción</p>
            <p className="mt-1 font-black">{formatCurrency(costPerServing)}</p>
          </div>
          <div className="rounded-2xl bg-[#F6F1E8] p-3">
            <p className="text-[10px] font-black uppercase text-[#7F836F]">Base</p>
            <p className="mt-1 font-black">{recipe.servings_base} pers.</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
