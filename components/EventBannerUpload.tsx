"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase";

type EventBannerUploadProps = {
  eventId?: string;
  value: string;
  onChange: (url: string) => void;
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;

export function EventBannerUpload({ eventId, value, onChange }: EventBannerUploadProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Usá JPG, PNG o WEBP.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("La imagen no puede superar 5 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const folder = eventId || "draft";
      const path = `${folder}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("event-banners")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el banner.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#18251A]">Banner</p>
          <p className="mt-1 text-xs text-[#7F836F]">Recomendado: 1600 x 900 px, 16:9, JPG o PNG, menos de 2 MB.</p>
        </div>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-xl border border-[#18251A]/10 px-3 py-2 text-xs font-semibold text-[#18251A]"
          >
            Quitar
          </button>
        ) : null}
      </div>

      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Banner del evento" className="h-36 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-[#18251A]/10 bg-[#F6F1E8]/60 text-sm text-[#7F836F]">
          Sin banner
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      ) : null}

      <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-[#315C38] px-4 text-sm font-semibold text-[#FFFDF8] transition hover:bg-[#294F2F]">
        {isUploading ? "Subiendo..." : value ? "Reemplazar imagen" : "Subir imagen"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
