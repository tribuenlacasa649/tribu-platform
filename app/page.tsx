export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">
          Tribu Platform
        </p>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
          Gestión interna de eventos, invitados y producción.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-neutral-300">
          Plataforma para crear eventos, administrar invitados, generar entradas
          QR, controlar accesos y preparar módulos de pagos, ventas y stock.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <p className="mt-2 text-neutral-400">
              Creá y gestioná eventos desde un solo panel.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Entradas QR</h2>
            <p className="mt-2 text-neutral-400">
              Invitados, tickets, check-in y validación en puerta.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Producción</h2>
            <p className="mt-2 text-neutral-400">
              Base para pagos, stock, ventas y reportes.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}