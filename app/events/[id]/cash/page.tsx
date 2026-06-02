"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../components/AppShell";
import { CashMovementCard } from "../../../../components/CashMovementCard";
import { CashSummary } from "../../../../components/CashSummary";
import { EmptyState } from "../../../../components/EmptyState";
import { EventContextNav } from "../../../../components/EventContextNav";
import { cashTypeLabels, expenseCategories, getCashSummary, incomeCategories } from "../../../../lib/cash";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import type { CashMovementRecord, CashMovementType } from "../../../../types/database";

type CashFormState = {
  type: CashMovementType;
  category: string;
  description: string;
  amount: string;
  payment_method: string;
  date: string;
  notes: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

const initialForm: CashFormState = {
  type: "income",
  category: "entradas",
  description: "",
  amount: "",
  payment_method: "transferencia",
  date: today(),
  notes: "",
};

export default function EventCashPage({ params }: { params: { id: string } }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [movements, setMovements] = useState<CashMovementRecord[]>([]);
  const [form, setForm] = useState<CashFormState>(initialForm);
  const [editingId, setEditingId] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CashMovementType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadMovements = useCallback(async () => {
    const { data, error: requestError } = await supabase
      .from("cash_movements")
      .select("id, event_id, type, category, description, amount, payment_method, date, notes, created_at")
      .eq("event_id", params.id)
      .order("date", { ascending: false });

    if (requestError) {
      setError(requestError.message);
    } else {
      setMovements((data ?? []) as CashMovementRecord[]);
    }

    setIsLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      event_id: params.id,
      type: form.type,
      category: form.category,
      description: form.description.trim() || null,
      amount: Number(form.amount) || 0,
      payment_method: form.payment_method.trim() || null,
      date: form.date,
      notes: form.notes.trim() || null,
    };

    const request = editingId
      ? supabase.from("cash_movements").update(payload).eq("id", editingId).eq("event_id", params.id)
      : supabase.from("cash_movements").insert(payload);

    const { error: requestError } = await request;
    setIsSaving(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setForm(initialForm);
    setEditingId("");
    await loadMovements();
  }

  async function deleteMovement(id: string) {
    if (!confirm("Eliminar movimiento?")) {
      return;
    }

    const { error: requestError } = await supabase
      .from("cash_movements")
      .delete()
      .eq("id", id)
      .eq("event_id", params.id);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    await loadMovements();
  }

  function editMovement(movement: CashMovementRecord) {
    setEditingId(movement.id);
    setForm({
      type: movement.type,
      category: movement.category,
      description: movement.description ?? "",
      amount: String(movement.amount),
      payment_method: movement.payment_method ?? "",
      date: movement.date,
      notes: movement.notes ?? "",
    });
  }

  const summary = getCashSummary(movements);
  const categories = form.type === "income" ? incomeCategories : expenseCategories;
  const filteredMovements = movements.filter((movement) => {
    const typeMatches = typeFilter === "all" || movement.type === typeFilter;
    const categoryMatches = categoryFilter === "all" || movement.category === categoryFilter;
    return typeMatches && categoryMatches;
  });

  return (
    <AppShell title="Caja">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <EventContextNav eventId={params.id} />

        <header className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Evento</p>
          <h1 className="mt-1 text-2xl font-black">Caja del Evento</h1>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">Ingresos, gastos y balance operativo.</p>
        </header>

        <CashSummary income={summary.income} expense={summary.expense} balance={summary.balance} />

        {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">{error}</div> : null}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
          <div className="grid gap-3 md:grid-cols-4">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CashMovementType, category: event.target.value === "income" ? "entradas" : "comida" })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold">
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} type="number" min={0} step="0.01" placeholder="Monto" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" required />
            <input value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} type="date" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descripción" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold md:col-span-2" />
            <input value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })} placeholder="Método" className="min-h-11 rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 font-semibold" />
          </div>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} placeholder="Notas" className="mt-3 w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-3 py-3 font-semibold" />
          <button disabled={isSaving} className="mt-3 min-h-12 w-full rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8] disabled:opacity-50">
            {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "+ Movimiento"}
          </button>
        </form>

        <section className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "income", "expense"] as const).map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${typeFilter === type ? "bg-[#315C38] text-[#FFFDF8]" : "bg-[#FFFDF8] text-[#18251A]"}`}>
              {type === "all" ? "Todos" : cashTypeLabels[type]}
            </button>
          ))}
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="min-h-10 shrink-0 rounded-full border border-[#18251A]/10 bg-[#FFFDF8] px-4 text-sm font-black">
            <option value="all">Todas las categorías</option>
            {[...incomeCategories, ...expenseCategories].map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </section>

        {isLoading ? (
          <div className="rounded-2xl bg-[#FFFDF8] p-4 text-sm font-semibold text-[#6F7668]">Cargando caja...</div>
        ) : filteredMovements.length === 0 ? (
          <EmptyState title="Sin movimientos" description="Registrá el primer ingreso o gasto." />
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {filteredMovements.map((movement) => (
              <CashMovementCard key={movement.id} movement={movement} onEdit={() => editMovement(movement)} onDelete={() => deleteMovement(movement.id)} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
