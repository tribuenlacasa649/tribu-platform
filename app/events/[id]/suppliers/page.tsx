"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "../../../../components/AppShell";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { SupplierCard } from "../../../../components/SupplierCard";
import { supplierCategories } from "../../../../lib/suppliers";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { EventSupplierRecord, SupplierRecord, SupplierStatus } from "../../../../types/database";

type EventSupplierWithSupplier = EventSupplierRecord & {
  suppliers: SupplierRecord | null;
};

const initialForm = {
  name: "",
  category: "comida",
  contact_name: "",
  phone: "",
  instagram: "",
  email: "",
  agreed_amount: "",
  paid_amount: "",
  status: "pending" as SupplierStatus,
  notes: "",
};

export default function EventSuppliersPage() {
  const params = useParams<{ id?: string }>();
  const eventId = params.id ?? "";
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<EventSupplierWithSupplier[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSuppliers = useCallback(async () => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("event_suppliers")
      .select("id, event_id, supplier_id, agreed_amount, paid_amount, status, notes, created_at, suppliers(id, name, category, contact_name, phone, instagram, email, notes, created_at)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (requestError) {
      setError(requestError.message);
    } else {
      setItems((data ?? []) as unknown as EventSupplierWithSupplier[]);
    }

    setIsLoading(false);
  }, [eventId, supabase]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!eventId) {
      setError("No se encontró el evento.");
      return;
    }

    setIsSaving(true);

    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .insert({
        name: form.name.trim(),
        category: form.category,
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    if (supplierError) {
      setIsSaving(false);
      setError(supplierError.message);
      return;
    }

    const { error: linkError } = await supabase.from("event_suppliers").insert({
      event_id: eventId,
      supplier_id: supplier.id,
      agreed_amount: Number(form.agreed_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0,
      status: form.status,
      notes: form.notes.trim() || null,
    });

    setIsSaving(false);

    if (linkError) {
      setError(linkError.message);
      return;
    }

    setForm(initialForm);
    await loadSuppliers();
  }

  async function updateItem(id: string, payload: Partial<EventSupplierRecord>) {
    const { error: requestError } = await supabase
      .from("event_suppliers")
      .update(payload)
      .eq("id", id)
      .eq("event_id", eventId);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadSuppliers();
  }

  async function deleteItem(id: string) {
    if (!confirm("Quitar proveedor del evento?")) {
      return;
    }

    const { error: requestError } = await supabase
      .from("event_suppliers")
      .delete()
      .eq("id", id)
      .eq("event_id", eventId);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadSuppliers();
  }

  return (
    <AppShell title="Proveedores">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {eventId ? <EventContextNav eventId={eventId} /> : null}

        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Evento</p>
          <h1 className="mt-1 text-2xl font-black">Proveedores</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Contactos, acuerdos y pagos por evento.</p>
        </header>

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="grid gap-3 md:grid-cols-4">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Proveedor" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold md:col-span-2" required />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              {supplierCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SupplierStatus })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="paid">Pagado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="WhatsApp" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} placeholder="Instagram" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.agreed_amount} onChange={(event) => setForm({ ...form, agreed_amount: event.target.value })} type="number" placeholder="Monto acordado" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
            <input value={form.paid_amount} onChange={(event) => setForm({ ...form, paid_amount: event.target.value })} type="number" placeholder="Monto pagado" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <button disabled={isSaving} className="mt-3 min-h-12 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8] disabled:opacity-50">
            {isSaving ? "Guardando..." : "Agregar proveedor"}
          </button>
        </form>

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando proveedores...</div>
        ) : items.length === 0 ? (
          <EmptyState title="Sin proveedores" description="Agrega proveedores para este evento." />
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <SupplierCard
                key={item.id}
                name={item.suppliers?.name || "Sin proveedor"}
                category={item.suppliers?.category}
                phone={item.suppliers?.phone}
                status={item.status}
                agreedAmount={item.agreed_amount}
                paidAmount={item.paid_amount}
                notes={item.notes || item.suppliers?.notes}
                onMarkPaid={() => updateItem(item.id, { status: "paid", paid_amount: item.agreed_amount })}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
