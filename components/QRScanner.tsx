"use client";

import { useEffect, useRef, useState } from "react";

type QRScannerProps = {
  onScan: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

export function QRScanner({ onScan, disabled = false }: QRScannerProps) {
  const scannerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastScanAtRef = useRef(0);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("Listo para abrir camara.");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // Scanner cleanup can fail if the camera was already closed by the browser.
      }
    }

    setIsScanning(false);
    setStatus("Camara cerrada.");
  }

  async function handleSuccessfulScan(decodedText: string) {
    const now = Date.now();

    if (disabled || now - lastScanAtRef.current < 2000) {
      return;
    }

    lastScanAtRef.current = now;
    setStatus("QR detectado. Validando...");
    await stopScanner();
    await onScan(decodedText);
  }

  async function startScanner() {
    setError("");
    setStatus("Solicitando permiso de camara...");

    if (!window.isSecureContext) {
      setError("La camara requiere HTTPS. En Vercel funciona; en local usa validacion manual.");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerId.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setStatus("Apunta la camara al QR.");
    } catch {
      scannerRef.current = null;
      setIsScanning(false);
      setError("No se pudo abrir la camara. Permití acceso o pegá el código manualmente.");
      setStatus("Fallback manual disponible.");
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={startScanner}
          disabled={isScanning || disabled}
          className="min-h-12 rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Abrir camara
        </button>
        <button
          type="button"
          onClick={stopScanner}
          disabled={!isScanning}
          className="min-h-12 rounded-lg border border-white/10 px-5 text-base font-semibold text-zinc-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cerrar camara
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
        {status} Permití el acceso a la cámara. Si tu navegador falla, pegá el link o token abajo.
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div
        id={scannerId.current}
        className={isScanning ? "overflow-hidden rounded-xl border border-white/10 bg-black" : "hidden"}
      />
    </section>
  );
}
