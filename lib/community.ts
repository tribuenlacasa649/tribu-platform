import type { AttendanceHistoryRecord, CommunityMemberRecord } from "../types/database";

export const communitySegments = [
  "nuevos",
  "frecuentes",
  "VIP",
  "pendientes de pago",
  "asistieron al último evento",
  "no asistieron",
  "más de 1 entrada",
];

export function getCommunityBadges(member: CommunityMemberRecord, history: AttendanceHistoryRecord[]) {
  const attendedCount = history.filter((item) => item.attended).length;
  const tags = new Set(member.tags ?? []);

  if (attendedCount >= 3) {
    tags.add("frecuente");
  }

  if (attendedCount === 0) {
    tags.add("nuevo");
  }

  return Array.from(tags);
}
