"use client";

import { useEffect, useRef, useState } from "react";

type QRScannerProps = {
  onScan: (value: string) => void;
};

type DetectedBarcode = {
  rawValue: string;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};

export function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  function stopScanner() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
  }

  async function startScanner() {
    setError("");

    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      setError("Este navegador no permite abrir la camara. Usa validacion manual.");
      return;
    }

    const BarcodeDetectorClass = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!BarcodeDetectorClass) {
      setError("Scanner QR no soportado en este navegador. Usa validacion manual.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });

      async function scanFrame() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) {
          animationRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");

        if (!context) {
          animationRef.current = requestAnimationFrame(scanFrame);
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const codes = await detector.detect(canvas);

        if (codes[0]?.rawValue) {
          stopScanner();
          onScan(codes[0].rawValue);
          return;
        }

        animationRef.current = requestAnimationFrame(scanFrame);
      }

      animationRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError("No se pudo abrir la camara. Revisa permisos o usa validacion manual.");
      stopScanner();
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={isScanning ? stopScanner : startScanner}
          className="min-h-12 rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300"
        >
          {isScanning ? "Detener scanner" : "Escanear QR"}
        </button>
        <p className="flex min-h-12 items-center rounded-lg border border-white/10 px-4 text-sm text-zinc-400">
          Si falla, usa el campo manual.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <div className={isScanning ? "block" : "hidden"}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="aspect-[3/4] w-full rounded-xl border border-white/10 bg-black object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </section>
  );
}
