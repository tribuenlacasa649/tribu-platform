import Link from "next/link";
import { getEventRoute } from "../lib/routes";

type EventOverviewProps = {
  eventId: string;
  stats: {
    guests: number;
    tickets: number;
    usedTickets: number;
    confirmedPayments: number;
  };
};

const modules = [
  { key: "guests", label: "Invitados", helper: "Lista central", tone: "green" },
  { key: "payments", label: "Pagos", helper: "Validacion", tone: "amber" },
  { key: "tickets", label: "Entradas", helper: "QR únicos", tone: "blue" },
  { key: "checkin", label: "Scanner QR", helper: "Puerta", tone: "purple" },
] as const;

const toneClasses = {
  green: "bg-[#DCE5D2] text-[#294F2F] border-[#315C38]/15",
  amber: "bg-[#F8E8BF] text-[#8A5B00] border-[#F2C66D]/30",
  blue: "bg-[#DDE9F7] text-[#155FB8] border-[#155FB8]/15",
  purple: "bg-[#E9DDF8] text-[#5B2DB4] border-[#5B2DB4]/15",
};

export function EventOverview({ eventId, stats }: EventOverviewProps) {
  const values = {
    guests: stats.guests,
    payments: stats.confirmedPayments,
    tickets: stats.tickets,
    checkin: stats.usedTickets,
  };

  return (
    <section className="rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#315C38]">Operacion</p>
          <h2 className="text-xl font-semibold">Centro del evento</h2>
        </div>
        <Link href={getEventRoute(eventId, "reports")} className="text-sm font-semibold text-[#315C38]">
          Reportes
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {modules.map((module) => (
          <Link
            key={module.key}
            href={getEventRoute(eventId, module.key)}
            className={`rounded-2xl border p-4 transition hover:scale-[1.01] ${toneClasses[module.tone]}`}
          >
            <p className="text-3xl font-black text-[#18251A]">{values[module.key]}</p>
            <p className="mt-1 font-black">{module.label}</p>
            <p className="mt-1 text-xs opacity-80">{module.helper}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
