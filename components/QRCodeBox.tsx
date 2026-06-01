"use client";

type QRCodeBoxProps = {
  value: string;
  label?: string;
  size?: number;
};

export function QRCodeBox({ value, label = "QR entrada", size = 220 }: QRCodeBoxProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}`;

  return (
    <div className="rounded-2xl border border-[#18251A]/10 bg-white p-4 text-center text-[#FFFDF8] shadow-2xl shadow-[#294F2F]/15">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt={label}
        width={size}
        height={size}
        className="mx-auto aspect-square w-full max-w-[260px] rounded-lg"
      />
      <p className="mt-3 break-all text-xs font-medium text-[#7F836F]">{value}</p>
    </div>
  );
}
