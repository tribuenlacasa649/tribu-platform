import type { User } from "@supabase/supabase-js";

export type InternalRole = "admin" | "production" | "door" | "cash" | "comms";

export const internalRoleLabels: Record<InternalRole, string> = {
  admin: "Admin",
  production: "Produccion",
  door: "Puerta",
  cash: "Caja",
  comms: "Comunicacion",
};

export function getUserDisplayName(user: User | null) {
  if (!user) {
    return "Usuario";
  }

  return (
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Usuario"
  );
}
