import type { StaffAttendanceStatus, StaffPaymentStatus } from "../types/database";

export const staffRoles = [
  "producción",
  "puerta",
  "scanner QR",
  "barra",
  "cocina",
  "sonido",
  "seguridad",
  "limpieza",
  "comunicación",
  "fotografía",
  "otros",
];

export const staffPaymentLabels: Record<StaffPaymentStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
};

export const staffAttendanceLabels: Record<StaffAttendanceStatus, string> = {
  scheduled: "Programado",
  present: "Presente",
  absent: "Ausente",
};
