"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../../../../../components/AppShell";
import { createSupabaseBrowserClient } from "../../../../../../lib/supabase";
import type { GuestRecord } from "../../../../../../types/database";
import { GuestForm } from "../../GuestForm";

export default function EditGuestPage() {
  const params = useParams<{ id: string; guestId: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guest, setGuest] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGuest() {
      const { data, error: requestError } = await supabase
        .from("guests")
        .select("id, event_id, name, contact, food_preferences, status, ticket_quantity, notes, created_at")
        .eq("id", params.guestId)
        .eq("event_id", params.id)
        .single();

      if (requestError) {
        setError(requestError.message);
      } else {
        setGuest(data as GuestRecord);
      }

      setIsLoading(false);
    }

    loadGuest();
  }, [params.guestId, params.id, supabase]);

  return (
    <AppShell title="Editar invitado">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <Link
            href={`/events/${params.id}/guests/${params.guestId}`}
            className="text-sm font-semibold text-[#315C38]"
          >
            Volver al invitado
          </Link>
          <div>
            <p className="text-sm font-medium text-[#6F7668]">Editar invitado</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Datos del invitado
            </h1>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando invitado...
          </div>
        ) : guest ? (
          <GuestForm mode="edit" eventId={params.id} guest={guest} />
        ) : null}
      </div>
    </AppShell>
  );
}
