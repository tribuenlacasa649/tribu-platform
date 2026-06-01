"use client";

import { useMemo, useState } from "react";

type LocationCardProps = {
  name?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
  compact?: boolean;
};

function getMapsSearchUrl(name?: string | null, address?: string | null) {
  const query = [name, address].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function getEmbedUrl(mapsUrl?: string | null, name?: string | null, address?: string | null) {
  const source = mapsUrl || getMapsSearchUrl(name, address);

  if (!source) {
    return "";
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(source)}&output=embed`;
}

export function LocationCard({ name, address, mapsUrl, compact = false }: LocationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const finalMapsUrl = mapsUrl || getMapsSearchUrl(name, address);
  const embedUrl = useMemo(() => getEmbedUrl(mapsUrl, name, address), [mapsUrl, name, address]);

  if (!name && !address && !mapsUrl) {
    return (
      <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
        <p className="text-xs font-semibold uppercase text-[#7F836F]">Ubicacion</p>
        <p className="mt-2 font-semibold text-[#18251A]">A confirmar</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#315C38]">Ubicacion</p>
          <h3 className="mt-1 text-lg font-semibold">{name || "Lugar del evento"}</h3>
          <p className="mt-1 text-sm leading-5 text-[#6F7668]">{address || "Direccion a confirmar"}</p>
        </div>
        {finalMapsUrl ? (
          <a
            href={finalMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-xl bg-[#315C38] px-3 py-2 text-xs font-semibold text-[#FFFDF8]"
          >
            Maps
          </a>
        ) : null}
      </div>

      {embedUrl && !compact ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="min-h-10 w-full rounded-xl border border-[#18251A]/10 px-4 text-sm font-semibold text-[#18251A] transition hover:bg-[#F0EADF]"
          >
            {isOpen ? "Ocultar mapa" : "Ver mapa"}
          </button>

          {isOpen ? (
            <iframe
              src={embedUrl}
              className="mt-3 h-56 w-full rounded-xl border border-[#18251A]/10"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa del evento"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
