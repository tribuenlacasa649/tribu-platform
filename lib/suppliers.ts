import type { SupplierStatus } from "../types/database";

export const supplierCategories = [
  "comida",
  "bebida",
  "sonido",
  "luces",
  "DJ",
  "fotografía",
  "video",
  "seguridad",
  "limpieza",
  "decoración",
  "alquiler",
  "otros",
];

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pagado",
  cancelled: "Cancelado",
};
