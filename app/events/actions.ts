import type { EventStatus, GuestStatus } from "../../types/database";

export const eventStatuses: EventStatus[] = ["draft", "active", "archived"];

export const guestStatuses: GuestStatus[] = ["active", "cancelled", "deleted"];

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export const guestStatusLabels: Record<GuestStatus, string> = {
  active: "Activo",
  cancelled: "Cancelado",
  deleted: "Eliminado",
};
