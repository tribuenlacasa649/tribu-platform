import type { RecipeIngredientRecord } from "../types/database";

export const recipeCategories = [
  "principal",
  "entrada",
  "postre",
  "bebida",
  "salsa",
  "guarnición",
  "panificado",
  "cocktail",
  "otro",
];

export function getRecipeTotalCost(ingredients: RecipeIngredientRecord[]) {
  return ingredients.reduce((sum, ingredient) => sum + Number(ingredient.total_cost || 0), 0);
}

export function getRecipeMultiplier(servingsBase: number, plannedServings: number) {
  if (!servingsBase || servingsBase <= 0) {
    return 1;
  }

  return plannedServings / servingsBase;
}
