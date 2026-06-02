import { Badge } from "./Badge";
import { formatCurrency } from "../lib/cash";
import { supplierStatusLabels } from "../lib/suppliers";
import { createWhatsAppUrl } from "../lib/whatsapp";
import type { SupplierStatus } from "../types/database";

type SupplierCardProps = {
  name: string;
  category?: string | null;
  phone?: string | null;
  status: SupplierStatus;
  agreedAmount: number;
  paidAmount: number;
  notes?: string | null;
  onMarkPaid: () => void;
  onDelete: () => void;
};

export function SupplierCard({
  name,
  category,
  phone,
  status,
  agreedAmount,
  paidAmount,
  notes,
  onMarkPaid,
  onDelete,
}: SupplierCardProps) {
  const whatsappUrl = phone ? createWhatsAppUrl(phone, `Hola, te escribo por la producción del evento.`) : "";

  return (
    <article className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#6F7668]">{category || "Sin categoría"}</p>
        </div>
        <Badge tone={status === "paid" ? "success" : status === "cancelled" ? "danger" : "warning"}>
          {supplierStatusLabels[status]}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-[#F6F1E8] p-3">
          <p className="text-xs font-black uppercase text-[#7F836F]">Acordado</p>
          <p className="mt-1 font-black">{formatCurrency(agreedAmount)}</p>
        </div>
        <div className="rounded-xl bg-[#F6F1E8] p-3">
          <p className="text-xs font-black uppercase text-[#7F836F]">Pagado</p>
          <p className="mt-1 font-black">{formatCurrency(paidAmount)}</p>
        </div>
      </div>
      {notes ? <p className="mt-3 text-sm text-[#6F7668]">{notes}</p> : null}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-10 items-center justify-center rounded-xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">
            WhatsApp
          </a>
        ) : null}
        <button type="button" onClick={onMarkPaid} className="min-h-10 rounded-xl border border-[#18251A]/10 text-sm font-black">
          Pagado
        </button>
        <button type="button" onClick={onDelete} className="min-h-10 rounded-xl bg-[#F36F4A] text-sm font-black text-[#FFFDF8]">
          Quitar
        </button>
      </div>
    </article>
  );
}
