"use client";

import { FormEvent, useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { createSupabaseBrowserClient } from "../lib/supabase";

type PaymentNoticeFormProps = {
  accessToken: string;
  amount: number;
  defaultReference?: string | null;
  defaultProof?: string | null;
  onNotified: () => void;
};

const paymentAlias = "TRIBU.EVENTOS";
const paymentHolder = "Tribu Platform";

export function PaymentNoticeForm({
  accessToken,
  amount,
  defaultReference,
  defaultProof,
  onNotified,
}: PaymentNoticeFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [reference, setReference] = useState(defaultReference ?? "");
  const [proof, setProof] = useState(defaultProof ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!reference.trim() && !proof.trim()) {
      setError("Pegá una referencia o comprobante para avisar el pago.");
      return;
    }

    setIsSaving(true);

    const { error: updateError } = await supabase.rpc("notify_public_guest_payment", {
      lookup_token: accessToken,
      new_reference: reference.trim() || null,
      new_proof: proof.trim() || null,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onNotified();
  }

  const amountLabel = amount > 0 ? `$${Math.round(amount).toLocaleString("es-AR")}` : "A confirmar";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div>
        <h3 className="text-xl font-semibold">Pagar / avisar pago</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Transferí y avisá el comprobante. Producción revisa y activa tu QR.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="rounded-xl bg-zinc-950/70 p-4">
          <p className="text-sm text-zinc-500">Alias</p>
          <p className="mt-1 text-lg font-semibold">{paymentAlias}</p>
          <div className="mt-3">
            <CopyButton value={paymentAlias} label="Copiar alias" />
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950/70 p-4">
          <p className="text-sm text-zinc-500">Titular</p>
          <p className="mt-1 font-semibold">{paymentHolder}</p>
        </div>
        <div className="rounded-xl bg-zinc-950/70 p-4">
          <p className="text-sm text-zinc-500">Monto</p>
          <p className="mt-1 text-lg font-semibold">{amountLabel}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="payment_reference" className="text-sm font-semibold text-zinc-200">
          Numero de operacion / referencia
        </label>
        <input
          id="payment_reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          placeholder="Ej: 123456789"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="payment_proof" className="text-sm font-semibold text-zinc-200">
          Link o texto del comprobante
        </label>
        <textarea
          id="payment_proof"
          value={proof}
          onChange={(event) => setProof(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          placeholder="Pegá el texto, link o detalle del comprobante"
        />
      </div>

      <button
        type="submit"
        disabled={isSaving || (!reference.trim() && !proof.trim())}
        className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 text-lg font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Enviando..." : "Ya pagué"}
      </button>
    </form>
  );
}
