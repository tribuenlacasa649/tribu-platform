"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { CommunityMemberCard } from "../../../components/CommunityMemberCard";
import { communitySegments } from "../../../lib/community";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { AttendanceHistoryRecord, CommunityMemberRecord } from "../../../types/database";

export default function CommunitySegmentsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [members, setMembers] = useState<CommunityMemberRecord[]>([]);
  const [history, setHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [activeSegment, setActiveSegment] = useState("nuevos");

  useEffect(() => {
    async function loadSegments() {
      const [membersResult, historyResult] = await Promise.all([
        supabase.from("community_members").select("id, full_name, phone, instagram, email, tags, notes, first_seen_at, last_seen_at, created_at"),
        supabase.from("attendance_history").select("id, community_member_id, event_id, guest_id, public_guest_id, ticket_id, attended, payment_status, created_at"),
      ]);
      setMembers((membersResult.data ?? []) as CommunityMemberRecord[]);
      setHistory((historyResult.data ?? []) as AttendanceHistoryRecord[]);
    }

    loadSegments();
  }, [supabase]);

  function memberHistory(memberId: string) {
    return history.filter((item) => item.community_member_id === memberId);
  }

  function matchesSegment(member: CommunityMemberRecord) {
    const items = memberHistory(member.id);
    const attended = items.filter((item) => item.attended).length;
    const pending = items.some((item) => item.payment_status === "pending" || item.payment_status === "notified");

    if (activeSegment === "nuevos") return items.length <= 1;
    if (activeSegment === "frecuentes") return attended >= 3;
    if (activeSegment === "VIP") return (member.tags ?? []).includes("VIP");
    if (activeSegment === "pendientes de pago") return pending;
    if (activeSegment === "asistieron al último evento") return items[0]?.attended === true;
    if (activeSegment === "no asistieron") return items.some((item) => !item.attended);
    if (activeSegment === "más de 1 entrada") return items.length > 1;
    return true;
  }

  const filteredMembers = members.filter(matchesSegment);

  return (
    <AppShell title="Segmentos">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Comunidad</p>
          <h1 className="mt-1 text-2xl font-black">Segmentación</h1>
        </header>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {communitySegments.map((segment) => (
            <button key={segment} type="button" onClick={() => setActiveSegment(segment)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${activeSegment === segment ? "bg-[#315C38] text-[#FFFDF8]" : "bg-[#FFFDF8]"}`}>
              {segment}
            </button>
          ))}
        </div>
        <p className="text-sm font-black text-[#6F7668]">{filteredMembers.length} miembros</p>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <CommunityMemberCard key={member.id} member={member} attendanceCount={memberHistory(member.id).filter((item) => item.attended).length} />
          ))}
        </section>
      </div>
    </AppShell>
  );
}
