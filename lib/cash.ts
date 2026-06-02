import type { CashMovementRecord, CashMovementType } from "../types/database";

export const incomeCategories = ["entradas", "barra", "merchandising", "otros"];

export const expenseCategories = [
  "comida",
  "bebida",
  "staff",
  "proveedores",
  "sonido",
  "decoración",
  "publicidad",
  "transporte",
  "otros",
];

export const cashTypeLabels: Record<CashMovementType, string> = {
  income: "Ingreso",
  expense: "Gasto",
};

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function getCashSummary(movements: CashMovementRecord[]) {
  const income = movements
    .filter((movement) => movement.type === "income")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
  const expense = movements
    .filter((movement) => movement.type === "expense")
    .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}
