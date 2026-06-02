export type EventModuleKey =
  | "summary"
  | "guests"
  | "tickets"
  | "checkin"
  | "payments"
  | "reports"
  | "cash"
  | "suppliers"
  | "staff"
  | "recipes";

export type EventModuleLink = {
  key: EventModuleKey;
  label: string;
  href: string;
  description: string;
};

const moduleSegments: Record<EventModuleKey, string> = {
  summary: "",
  guests: "guests",
  tickets: "tickets",
  checkin: "checkin",
  payments: "payments",
  reports: "reports",
  cash: "cash",
  suppliers: "suppliers",
  staff: "staff",
  recipes: "recipes",
};

const moduleLabels: Record<EventModuleKey, string> = {
  summary: "Resumen",
  guests: "Participantes",
  tickets: "Entradas",
  checkin: "Scanner QR",
  payments: "Pagos",
  reports: "Reportes",
  cash: "Caja",
  suppliers: "Proveedores",
  staff: "Staff",
  recipes: "Recetas",
};

const moduleDescriptions: Record<EventModuleKey, string> = {
  summary: "Estado general del evento.",
  guests: "Invitados, pagos, entradas, QR y WhatsApp.",
  tickets: "Centralizado en Participantes.",
  checkin: "Validar QR en puerta.",
  payments: "Centralizado en Participantes.",
  reports: "Asistencia y pagos.",
  cash: "Ingresos, gastos y balance.",
  suppliers: "Contactos, acuerdos y pagos.",
  staff: "Roles, horarios y asistencia.",
  recipes: "Cocina y cantidades.",
};

export function getEventRoute(eventId: string, module: EventModuleKey) {
  const segment = moduleSegments[module];
  return segment ? `/events/${eventId}/${segment}` : `/events/${eventId}`;
}

export function getEventModuleLinks(eventId: string): EventModuleLink[] {
  return (["summary", "guests", "checkin", "reports", "cash", "suppliers", "staff", "recipes"] as const).map((key) => ({
    key,
    label: moduleLabels[key],
    href: getEventRoute(eventId, key),
    description: moduleDescriptions[key],
  }));
}

export function getEventIdFromPathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "events" || !parts[1] || parts[1] === "new") {
    return null;
  }

  return parts[1];
}

export function getActiveEventModule(pathname: string): EventModuleKey | null {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "events" || !parts[1] || parts[1] === "new") {
    return null;
  }

  const segment = parts[2];

  if (!segment || segment === "edit") {
    return "summary";
  }

  if (segment === "guests" || segment === "tickets" || segment === "payments") {
    return "guests";
  }

  if (segment === "checkin") return "checkin";
  if (segment === "reports") return "reports";
  if (segment === "cash") return "cash";
  if (segment === "suppliers") return "suppliers";
  if (segment === "staff") return "staff";
  if (segment === "recipes") return "recipes";

  return null;
}
