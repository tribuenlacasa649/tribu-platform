"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../components/AppShell";
import { Badge } from "../../../components/Badge";
import { getCommunityBadges } from "../../../lib/community";
import { createSupabaseBrowserClient } from "../../../lib/supabase";
import type { AttendanceHistoryRecord, CommunityMemberRecord, EventRecord } from "../../../types/database";

type HistoryWithEvent = AttendanceHistoryRecord & {
  events: Pick<EventRecord, "id" | "name" | "starts_at"> | null;
};

export default function CommunityMemberPage() {
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [member, setMember] = useState<CommunityMemberRecord | null>(null);
  const [history, setHistory] = useState<HistoryWithEvent[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const loadMember = useCallback(async () => {
    const [memberResult, historyResult] = await Promise.all([
      supabase
        .from("community_members")
        .select("id, full_name, phone, instagram, email, tags, notes, first_seen_at, last_seen_at, created_at")
        .eq("id", params.id)
        .single(),
      supabase
        .from("attendance_history")
        .select("id, community_member_id, event_id, guest_id, public_guest_id, ticket_id, attended, payment_status, created_at, events(id, name, starts_at)")
        .eq("community_member_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

    if (memberResult.error || historyResult.error) {
      setError(memberResult.error?.message || historyResult.error?.message || "");
    } else {
      setMember(memberResult.data as CommunityMemberRecord);
      setHistory((historyResult.data ?? []) as unknown as HistoryWithEvent[]);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  async function saveTags(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!member || !tagInput.trim()) {
      return;
    }

    const tags = Array.from(new Set([...(member.tags ?? []), tagInput.trim()]));
    const { error: requestError } = await supabase.from("community_members").update({ tags }).eq("id", member.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setTagInput("");
    await loadMember();
  }

  async function removeTag(tag: string) {
    if (!member) {
      return;
    }

    const tags = (member.tags ?? []).filter((item) => item !== tag);
    const { error: requestError } = await supabase.from("community_members").update({ tags }).eq("id", member.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadMember();
  }

  if (!member) {
    return <AppShell title="Comunidad"><div className="rounded-2xl bg-[#FFFDF8] p-4">{error || "Cargando perfil..."}</div></AppShell>;
  }

  const badges = getCommunityBadges(member, history);

  return (
    <AppShell title={member.full_name}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Perfil</p>
          <h1 className="mt-1 text-2xl font-black">{member.full_name}</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">{member.phone || member.instagram || "Sin contacto"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => <Badge key={badge} tone={badge === "VIP" || badge === "frecuente" ? "success" : "neutral"}>{badge}</Badge>)}
          </div>
        </header>

        <form onSubmit={saveTags} className="rounded-2xl bg-[#FFFDF8] p-4">
          <p className="text-sm font-black">Etiquetas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(member.tags ?? []).map((tag) => (
              <button key={tag} type="button" onClick={() => removeTag(tag)} className="rounded-full bg-[#DCE5D2] px-3 py-2 text-xs font-black text-[#315C38]">
                {tag} ×
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px]">
            <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="Nueva etiqueta" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <button className="min-h-11 rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">Agregar</button>
          </div>
        </form>

        <section className="rounded-2xl bg-[#FFFDF8] p-4">
          <h2 className="text-lg font-black">Historial</h2>
          <div className="mt-3 grid gap-2">
            {history.length === 0 ? (
              <p className="text-sm text-[#6F7668]">Sin historial todavía.</p>
            ) : history.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#18251A]/10 p-3">
                <p className="font-black">{item.events?.name || "Evento"}</p>
                <p className="mt-1 text-sm text-[#6F7668]">
                  {item.attended ? "Asistió" : "No asistió"} · Pago {item.payment_status || "sin dato"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
