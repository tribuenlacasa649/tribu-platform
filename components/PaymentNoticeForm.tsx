"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { createSupabaseBrowserClient } from "../lib/supabase";

type PaymentNoticeFormProps = {
  accessToken: string;
  amount: number;
  defaultReference?: string | null;
  defaultProof?: string | null;
  defaultProofFileUrl?: string | null;
  onNotified: () => void;
};

const paymentAlias = "An.enfotos";
const paymentHolder = "Ana Laura Harboure";
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;

export function PaymentNoticeForm({
  accessToken,
  amount,
  defaultReference,
  defaultProof,
  defaultProofFileUrl,
  onNotified,
}: PaymentNoticeFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [reference, setReference] = useState(defaultReference ?? "");
  const [proof, setProof] = useState(defaultProof ?? "");
  const [proofFileUrl, setProofFileUrl] = useState(defaultProofFileUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      setError("El comprobante debe ser JPG, PNG o WEBP.");
      return;
    }

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      setError("El comprobante no puede superar 5 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function uploadProofFile() {
    if (!selectedFile) {
      return proofFileUrl || null;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${accessToken}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(path, selectedFile, {
        cacheControl: "3600",
        contentType: selectedFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Agregá una referencia de al menos 4 caracteres o una foto del comprobante.");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedProofFileUrl = await uploadProofFile();

      const { error: updateError } = await supabase.rpc("notify_public_guest_payment", {
        lookup_token: accessToken,
        new_reference: reference.trim() || null,
        new_proof: proof.trim() || null,
        new_proof_file_url: uploadedProofFileUrl,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setProofFileUrl(uploadedProofFileUrl ?? "");
      onNotified();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo avisar el pago.");
    } finally {
      setIsSaving(false);
    }
  }

  const amountLabel = amount > 0 ? `$${Math.round(amount).toLocaleString("es-AR")}` : "A confirmar";
  const hasValidReference = reference.trim().length >= 4;
  const hasProofFile = Boolean(selectedFile || proofFileUrl);
  const canSubmit = hasValidReference || hasProofFile;
  const showValidationWarning = !canSubmit && (reference.length > 0 || proof.length > 0);
  const suggestedReference = `TRIBU-${accessToken.slice(0, 8).toUpperCase()}`;

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
        <div className="rounded-xl bg-zinc-950/70 p-4">
          <p className="text-sm text-zinc-500">Referencia sugerida</p>
          <p className="mt-1 break-all text-lg font-semibold">{suggestedReference}</p>
          <div className="mt-3">
            <CopyButton value={suggestedReference} label="Copiar referencia" />
          </div>
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
          onChange={(event) => {
            setReference(event.target.value);
            setError("");
          }}
          className={`min-h-12 w-full rounded-xl border bg-zinc-950 px-4 text-white outline-none focus:ring-2 ${
            showValidationWarning
              ? "border-red-400 focus:border-red-300 focus:ring-red-400/20"
              : "border-white/10 focus:border-emerald-400 focus:ring-emerald-400/20"
          }`}
          placeholder="Ej: 123456789"
        />
        {showValidationWarning ? (
          <p className="text-xs font-semibold text-red-200">
            La referencia debe tener al menos 4 caracteres, salvo que subas una foto.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="payment_proof" className="text-sm font-semibold text-zinc-200">
          Link o texto del comprobante
        </label>
        <textarea
          id="payment_proof"
          value={proof}
          onChange={(event) => {
            setProof(event.target.value);
            setError("");
          }}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          placeholder="Pegá el texto, link o detalle del comprobante"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="payment_file" className="text-sm font-semibold text-zinc-200">
          Foto del comprobante
        </label>
        <input
          id="payment_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="block w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:font-semibold file:text-zinc-950"
        />
        <p className="text-xs text-zinc-500">JPG, PNG o WEBP. Máximo 5 MB.</p>
        {proofFileUrl ? (
          <a
            href={proofFileUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-semibold text-emerald-300"
          >
            Ver comprobante cargado
          </a>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving || !canSubmit}
        className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 text-lg font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Enviando..." : "Ya pagué"}
      </button>
    </form>
  );
}
