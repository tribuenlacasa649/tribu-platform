import Link from "next/link";
import { Badge } from "./Badge";
import { getEventModuleLinks } from "../lib/routes";

type EventModuleGridProps = {
  eventId: string;
};

export function EventModuleGrid({ eventId }: EventModuleGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {getEventModuleLinks(eventId)
        .filter((module) => module.key !== "summary")
        .map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className="rounded-xl border border-[#315C38]/20 bg-[#315C38]/10 p-4 transition hover:bg-[#315C38]/15"
          >
            <Badge tone="success">Activo</Badge>
            <h2 className="mt-2 text-lg font-semibold">{module.label}</h2>
            <p className="mt-2 text-sm text-[#42503E]">{module.description}</p>
          </Link>
        ))}

      {["Produccion", "Stock"].map((module) => (
        <div
          key={module}
          className="rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 opacity-75"
        >
          <Badge tone="soon">Proximamente</Badge>
          <h2 className="mt-2 text-lg font-semibold">{module}</h2>
          <p className="mt-2 text-sm text-[#6F7668]">Modulo preparado.</p>
        </div>
      ))}
    </section>
  );
}
