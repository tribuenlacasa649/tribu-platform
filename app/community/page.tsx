"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { CommunityMemberCard } from "../../components/CommunityMemberCard";
import { EmptyState } from "../../components/EmptyState";
import { createSupabaseBrowserClient } from "../../lib/supabase";
import type { AttendanceHistoryRecord, CommunityMemberRecord } from "../../types/database";

export default function CommunityPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [members, setMembers] = useState<CommunityMemberRecord[]>([]);
  const [history, setHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", instagram: "", tags: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCommunity() {
    const [membersResult, historyResult] = await Promise.all([
      supabase
        .from("community_members")
        .select("id, full_name, phone, instagram, email, tags, notes, first_seen_at, last_seen_at, created_at")
        .order("last_seen_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("attendance_history")
        .select("id, community_member_id, event_id, guest_id, public_guest_id, ticket_id, attended, payment_status, created_at"),
    ]);

    if (membersResult.error || historyResult.error) {
      setError(membersResult.error?.message || historyResult.error?.message || "");
    } else {
      setMembers((membersResult.data ?? []) as CommunityMemberRecord[]);
      setHistory((historyResult.data ?? []) as AttendanceHistoryRecord[]);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const { error: requestError } = await supabase.from("community_members").insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      instagram: form.instagram.trim() || null,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setForm({ full_name: "", phone: "", instagram: "", tags: "" });
    await loadCommunity();
  }

  const filteredMembers = members.filter((member) =>
    [member.full_name, member.phone, member.instagram, member.email, ...(member.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function attendanceCount(memberId: string) {
    return history.filter((item) => item.community_member_id === memberId && item.attended).length;
  }

  return (
    <AppShell title="Comunidad">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">CRM</p>
          <h1 className="mt-1 text-2xl font-black">Comunidad Tribu</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Personas, historial, etiquetas y segmentos.</p>
          <Link href="/community/segments" className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 text-sm font-black">Ver segmentos</Link>
        </header>

        {error ? <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={createMember} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="grid gap-3 md:grid-cols-4">
            <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Nombre" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required />
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Teléfono" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} placeholder="Instagram" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="Tags separadas por coma" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <button className="mt-3 min-h-11 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">Agregar persona</button>
        </form>

        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, teléfono, instagram o etiqueta..." className="min-h-12 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] px-4 font-semibold outline-none" />

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando comunidad...</div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState title="Sin miembros" description="Agrega o sincroniza personas desde eventos." />
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <CommunityMemberCard key={member.id} member={member} attendanceCount={attendanceCount(member.id)} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
