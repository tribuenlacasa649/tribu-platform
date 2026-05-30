import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
        <a href="/events" className="text-sm text-emerald-400">← Volver</a>
        <h1 className="mt-6 text-3xl font-bold">Evento no encontrado</h1>
        <p className="mt-3 text-neutral-400">{error?.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <a href="/events" className="text-sm text-emerald-400">← Volver a eventos</a>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Evento</p>
          <h1 className="mt-3 text-5xl font-bold">{event.name}</h1>
          <p className="mt-4 max-w-2xl text-neutral-300">{event.description || "Sin descripción"}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-neutral-400">Ubicación</p>
              <p className="mt-2 text-lg font-semibold">{event.location || "Sin ubicación"}</p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-neutral-400">Estado</p>
              <p className="mt-2 text-lg font-semibold">{event.status}</p>
            </div>

            <div className="rounded-2xl bg-black/30 p-5">
              <p className="text-sm text-neutral-400">Creado</p>
              <p className="mt-2 text-lg font-semibold">
                {new Date(event.created_at).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
            <h2 className="text-xl font-semibold">Invitados</h2>
            <p className="mt-2 text-sm text-neutral-400">Próximo paso.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
            <h2 className="text-xl font-semibold">Entradas QR</h2>
            <p className="mt-2 text-sm text-neutral-400">Próximamente.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
            <h2 className="text-xl font-semibold">Check-in</h2>
            <p className="mt-2 text-sm text-neutral-400">Próximamente.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-60">
            <h2 className="text-xl font-semibold">Pagos</h2>
            <p className="mt-2 text-sm text-neutral-400">Próximamente.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
