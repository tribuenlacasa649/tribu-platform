"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase";

type PaymentNoticeFormProps = {
  accessToken: string;
  amount: number;
  defaultReference?: string | null;
  defaultProof?: string | null;
  defaultProofFileUrl?: string | null;
  onNotified: () => void;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;

export function PaymentNoticeForm({
  accessToken,
  amount: _amount,
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

  const hasValidReference = reference.trim().length >= 4;
  const hasProofFile = Boolean(selectedFile || proofFileUrl);
  const canSubmit = hasValidReference || hasProofFile;
  const showValidationWarning = !canSubmit && (reference.length > 0 || proof.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="payment_reference" className="text-sm font-semibold text-[#18251A]">
          Numero de operacion / referencia
        </label>
        <input
          id="payment_reference"
          value={reference}
          onChange={(event) => {
            setReference(event.target.value);
            setError("");
          }}
          className={`min-h-12 w-full rounded-xl border bg-[#F6F1E8] px-4 text-[#18251A] outline-none focus:ring-2 ${
            showValidationWarning
              ? "border-red-400 focus:border-red-300 focus:ring-red-400/20"
              : "border-[#18251A]/10 focus:border-[#315C38] focus:ring-[#315C38]/20"
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
        <label htmlFor="payment_proof" className="text-sm font-semibold text-[#18251A]">
          Link o texto del comprobante
        </label>
        <textarea
          id="payment_proof"
          value={proof}
          onChange={(event) => {
            setProof(event.target.value);
            setError("");
          }}
          rows={2}
          className="w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 py-3 text-[#18251A] outline-none focus:border-[#315C38] focus:ring-2 focus:ring-[#315C38]/20"
          placeholder="Pegá el texto, link o detalle del comprobante"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="payment_file" className="text-sm font-semibold text-[#18251A]">
          Foto del comprobante
        </label>
        <input
          id="payment_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="block w-full rounded-xl border border-[#18251A]/10 bg-[#F6F1E8] px-4 py-3 text-sm text-[#18251A] file:mr-4 file:rounded-lg file:border-0 file:bg-[#315C38] file:px-3 file:py-2 file:font-semibold file:text-[#FFFDF8]"
        />
        <p className="text-xs text-[#7F836F]">JPG, PNG o WEBP. Máximo 5 MB.</p>
        {proofFileUrl ? (
          <a
            href={proofFileUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-semibold text-[#315C38]"
          >
            Ver comprobante cargado
          </a>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving || !canSubmit}
        className="min-h-14 w-full rounded-xl bg-[#315C38] px-5 text-lg font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Enviando..." : "Ya pagué"}
      </button>
    </form>
  );
}
