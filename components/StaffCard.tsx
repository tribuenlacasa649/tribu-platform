import { Badge } from "./Badge";
import { formatCurrency } from "../lib/cash";
import { staffAttendanceLabels, staffPaymentLabels } from "../lib/staff";
import { createWhatsAppUrl } from "../lib/whatsapp";
import type { StaffAttendanceStatus, StaffPaymentStatus } from "../types/database";

type StaffCardProps = {
  name: string;
  phone?: string | null;
  role: string;
  startTime?: string | null;
  endTime?: string | null;
  paymentAmount: number;
  paymentStatus: StaffPaymentStatus;
  attendanceStatus: StaffAttendanceStatus;
  onMarkPaid: () => void;
  onMarkPresent: () => void;
  onDelete: () => void;
};

export function StaffCard({
  name,
  phone,
  role,
  startTime,
  endTime,
  paymentAmount,
  paymentStatus,
  attendanceStatus,
  onMarkPaid,
  onMarkPresent,
  onDelete,
}: StaffCardProps) {
  const whatsappUrl = phone ? createWhatsAppUrl(phone, `Hola ${name}, te escribo por tu rol en el evento.`) : "";

  return (
    <details className="group rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black">{name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">{role} · {startTime || "?"} a {endTime || "?"}</p>
          <p className="mt-1 text-xs font-black text-[#315C38]">{formatCurrency(paymentAmount)} · {staffPaymentLabels[paymentStatus]}</p>
        </div>
        <Badge tone={attendanceStatus === "present" ? "success" : attendanceStatus === "absent" ? "danger" : "warning"}>
          {staffAttendanceLabels[attendanceStatus]}
        </Badge>
      </summary>
      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone={paymentStatus === "paid" ? "success" : "warning"}>{staffPaymentLabels[paymentStatus]}</Badge>
          <Badge tone="neutral">{phone || "Sin teléfono"}</Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-10 items-center justify-center rounded-xl bg-[#315C38] text-xs font-black text-[#FFFDF8]">
              WhatsApp
            </a>
          ) : null}
          <button type="button" onClick={onMarkPaid} className="min-h-10 rounded-xl border border-[#18251A]/10 text-xs font-black">
            Pagado
          </button>
          <button type="button" onClick={onMarkPresent} className="min-h-10 rounded-xl border border-[#18251A]/10 text-xs font-black">
            Presente
          </button>
          <button type="button" onClick={onDelete} className="min-h-10 rounded-xl bg-[#F36F4A] text-xs font-black text-[#FFFDF8]">
            Quitar
          </button>
        </div>
      </div>
    </details>
  );
}
