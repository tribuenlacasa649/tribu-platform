"use client";

import { useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Copiar link" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
    >
      {copied ? "Copiado" : label}
    </button>
  );
}
