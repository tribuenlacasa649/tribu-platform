"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";

type DeleteGuestButtonProps = {
  guestId: string;
  eventId: string;
  className?: string;
  redirectToList?: boolean;
  onDeleted?: () => void | Promise<void>;
};

export function DeleteGuestButton({
  guestId,
  eventId,
  className,
  redirectToList = false,
  onDeleted,
}: DeleteGuestButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Eliminar este invitado?")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    const { error: requestError } = await supabase
      .from("guests")
      .update({ status: "deleted" })
      .eq("id", guestId)
      .eq("event_id", eventId);

    setIsDeleting(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    if (onDeleted) {
      await onDeleted();
    }

    if (redirectToList) {
      router.push(`/events/${eventId}/guests`);
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={
          className ||
          "min-h-12 rounded-lg bg-red-500 px-5 text-base font-semibold text-[#18251A] transition hover:bg-red-400 disabled:opacity-60"
        }
      >
        {isDeleting ? "Eliminando..." : "Eliminar"}
      </button>
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}
