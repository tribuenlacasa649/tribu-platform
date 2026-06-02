import Link from "next/link";
import { Badge } from "./Badge";
import type { CommunityMemberRecord } from "../types/database";

type CommunityMemberCardProps = {
  member: CommunityMemberRecord;
  attendanceCount?: number;
};

export function CommunityMemberCard({ member, attendanceCount = 0 }: CommunityMemberCardProps) {
  return (
    <Link href={`/community/${member.id}`} className="block rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black">{member.full_name}</h3>
          <p className="mt-1 truncate text-sm font-semibold text-[#6F7668]">{member.phone || member.instagram || "Sin contacto"}</p>
        </div>
        <Badge tone={attendanceCount >= 3 ? "success" : "neutral"}>{attendanceCount} asist.</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(member.tags ?? []).slice(0, 4).map((tag) => (
          <Badge key={tag} tone="neutral">{tag}</Badge>
        ))}
      </div>
    </Link>
  );
}
