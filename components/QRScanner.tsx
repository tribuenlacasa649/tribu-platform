"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

type QRScannerProps = {
  onScan: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

type ScannerStatus = "idle" | "opening" | "scanning" | "validating" | "error";

export function QRScanner({ onScan, disabled = false }: QRScannerProps) {
  const scannerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanAtRef = useRef(0);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState("Listo para abrir camara.");
  const [error, setError] = useState("");
  const isScannerVisible = status === "opening" || status === "scanning" || status === "validating";

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // The browser can close the camera before html5-qrcode finishes cleanup.
      }
    }

    setStatus("idle");
    setMessage("Camara cerrada. Podés abrirla otra vez o validar manualmente.");
  }

  async function handleSuccessfulScan(decodedText: string) {
    const now = Date.now();

    if (disabled || status === "validating" || now - lastScanAtRef.current < 2000) {
      return;
    }

    lastScanAtRef.current = now;
    setStatus("validating");
    setMessage("QR detectado. Validando entrada...");
    await stopScanner();
    await onScan(decodedText);
  }

  async function startScanner() {
    setError("");
    setStatus("opening");
    setMessage("Solicitando permiso de camara...");

    if (!window.isSecureContext) {
      setStatus("error");
      setError("La camara requiere HTTPS. Probalo desde Vercel o pegá el código manualmente.");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        setStatus("error");
        setError("No encontramos camaras disponibles. Pegá el código manualmente.");
        return;
      }

      const backCamera =
        cameras.find((camera) => /back|rear|environment|trasera/i.test(camera.label)) ??
        cameras[cameras.length - 1];

      const scanner = new Html5Qrcode(scannerId.current, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
        },
        (decodedText) => {
          void handleSuccessfulScan(decodedText);
        },
        () => {}
      );

      setStatus("scanning");
      setMessage("Apuntá la cámara al QR. Mantené el celular quieto un segundo.");
    } catch (scannerError) {
      scannerRef.current = null;
      setStatus("error");
      setMessage("Fallback manual disponible.");
      setError(
        scannerError instanceof Error
          ? `No se pudo abrir la camara: ${scannerError.message}`
          : "No se pudo abrir la camara. Permití acceso o pegá el código manualmente."
      );
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={startScanner}
          disabled={status === "opening" || status === "scanning" || status === "validating" || disabled}
          className="min-h-12 rounded-lg bg-[#315C38] px-5 text-base font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "opening" ? "Abriendo..." : "Abrir camara"}
        </button>
        <button
          type="button"
          onClick={() => void stopScanner()}
          disabled={!isScannerVisible}
          className="min-h-12 rounded-lg border border-[#18251A]/10 px-5 text-base font-semibold text-[#18251A] transition hover:bg-[#F0EADF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cerrar camara
        </button>
      </div>

      <div className="rounded-lg border border-[#18251A]/10 bg-[#F6F1E8]/70 px-4 py-3 text-sm text-[#42503E]">
        {message} Si tu navegador no permite cámara, pegá el link o token abajo.
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div
        id={scannerId.current}
        className={
          isScannerVisible
            ? "min-h-[320px] overflow-hidden rounded-xl border border-[#18251A]/10 bg-black"
            : "hidden"
        }
      />
    </section>
  );
}
