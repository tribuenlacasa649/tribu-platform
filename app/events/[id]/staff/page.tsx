"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { StaffCard } from "../../../../components/StaffCard";
import { staffRoles } from "../../../../lib/staff";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { EventStaffRecord, StaffAttendanceStatus, StaffMemberRecord, StaffPaymentStatus } from "../../../../types/database";

type EventStaffWithMember = EventStaffRecord & {
  staff_members: StaffMemberRecord | null;
};

const initialForm = {
  full_name: "",
  phone: "",
  role: "producción",
  start_time: "",
  end_time: "",
  payment_amount: "",
  payment_status: "pending" as StaffPaymentStatus,
  attendance_status: "scheduled" as StaffAttendanceStatus,
  notes: "",
};

export default function EventStaffPage() {
  const params = useParams<{ id?: string }>();
  const eventId = params.id ?? "";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<EventStaffWithMember[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("event_staff")
      .select("id, event_id, staff_member_id, role, start_time, end_time, payment_amount, payment_status, attendance_status, notes, created_at, staff_members(id, full_name, phone, role, notes, created_at)")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true });

    if (requestError) {
      setError(requestError.message);
    } else {
      setItems((data ?? []) as unknown as EventStaffWithMember[]);
    }

    setIsLoading(false);
  }, [eventId, supabase]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!eventId) {
      setError("No se encontró el evento.");
      return;
    }

    setIsSaving(true);

    const { data: staffMember, error: memberError } = await supabase
      .from("staff_members")
      .insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    if (memberError) {
      setIsSaving(false);
      setError(memberError.message);
      return;
    }

    const { error: linkError } = await supabase.from("event_staff").insert({
      event_id: eventId,
      staff_member_id: staffMember.id,
      role: form.role,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      payment_amount: Number(form.payment_amount) || 0,
      payment_status: form.payment_status,
      attendance_status: form.attendance_status,
      notes: form.notes.trim() || null,
    });

    setIsSaving(false);

    if (linkError) {
      setError(linkError.message);
      return;
    }

    setForm(initialForm);
    await loadStaff();
  }

  async function updateItem(id: string, payload: Partial<EventStaffRecord>) {
    const { error: requestError } = await supabase
      .from("event_staff")
      .update(payload)
      .eq("id", id)
      .eq("event_id", eventId);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadStaff();
  }

  async function deleteItem(id: string) {
    if (!confirm("Quitar staff del evento?")) {
      return;
    }

    const { error: requestError } = await supabase
      .from("event_staff")
      .delete()
      .eq("id", id)
      .eq("event_id", eventId);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadStaff();
  }

  return (
    <AppShell title="Staff">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {eventId ? <EventContextNav eventId={eventId} /> : null}

        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Evento</p>
          <h1 className="mt-1 text-2xl font-black">Staff</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Roles, horarios, pagos y asistencia.</p>
        </header>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="grid gap-3 md:grid-cols-4">
            <input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Nombre" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold md:col-span-2" required />
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="WhatsApp" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              {staffRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <input value={form.start_time} onChange={(event) => setForm({ ...form, start_time: event.target.value })} type="time" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.end_time} onChange={(event) => setForm({ ...form, end_time: event.target.value })} type="time" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.payment_amount} onChange={(event) => setForm({ ...form, payment_amount: event.target.value })} type="number" placeholder="Pago" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <select value={form.attendance_status} onChange={(event) => setForm({ ...form, attendance_status: event.target.value as StaffAttendanceStatus })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              <option value="scheduled">Programado</option>
              <option value="present">Presente</option>
              <option value="absent">Ausente</option>
            </select>
          </div>
          <button disabled={isSaving} className="mt-3 min-h-12 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8] disabled:opacity-50">
            {isSaving ? "Guardando..." : "Agregar staff"}
          </button>
        </form>

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando staff...</div>
        ) : items.length === 0 ? (
          <EmptyState title="Sin staff" description="Agrega el equipo operativo del evento." />
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <StaffCard
                key={item.id}
                name={item.staff_members?.full_name || "Sin nombre"}
                phone={item.staff_members?.phone}
                role={item.role}
                startTime={item.start_time}
                endTime={item.end_time}
                paymentAmount={item.payment_amount}
                paymentStatus={item.payment_status}
                attendanceStatus={item.attendance_status}
                onMarkPaid={() => updateItem(item.id, { payment_status: "paid" })}
                onMarkPresent={() => updateItem(item.id, { attendance_status: "present" })}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
