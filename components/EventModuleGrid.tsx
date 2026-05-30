import Link from "next/link";
import { Badge } from "./Badge";
import { getEventModuleLinks } from "../lib/routes";

type EventModuleGridProps = {
  eventId: string;
};

const activeModules = ["guests", "tickets", "checkin", "payments", "reports"];

export function EventModuleGrid({ eventId }: EventModuleGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {getEventModuleLinks(eventId)
        .filter((module) => activeModules.includes(module.key))
        .map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5 transition hover:bg-emerald-400/15"
          >
            <Badge tone="success">Activo</Badge>
            <h2 className="mt-3 text-xl font-semibold">{module.label}</h2>
            <p className="mt-2 text-sm text-zinc-300">{module.description}</p>
          </Link>
        ))}

      {["Produccion", "Stock"].map((module) => (
        <div
          key={module}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-5 opacity-75"
        >
          <Badge tone="soon">Proximamente</Badge>
          <h2 className="mt-3 text-xl font-semibold">{module}</h2>
          <p className="mt-2 text-sm text-zinc-400">Modulo preparado.</p>
        </div>
      ))}
    </section>
  );
}
