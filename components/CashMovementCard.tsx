import { cashTypeLabels, formatCurrency } from "../lib/cash";
import type { CashMovementRecord } from "../types/database";

type CashMovementCardProps = {
  movement: CashMovementRecord;
  onEdit: () => void;
  onDelete: () => void;
};

export function CashMovementCard({ movement, onEdit, onDelete }: CashMovementCardProps) {
  const isIncome = movement.type === "income";

  return (
    <article className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-black uppercase tracking-wide ${isIncome ? "text-[#315C38]" : "text-[#B33F22]"}`}>
            {cashTypeLabels[movement.type]} · {movement.category}
          </p>
          <h3 className="mt-1 text-lg font-black">{movement.description || "Sin descripción"}</h3>
          <p className="mt-1 text-xs font-semibold text-[#6F7668]">{movement.payment_method || "Sin método"} · {movement.date}</p>
        </div>
        <p className={`text-lg font-black ${isIncome ? "text-[#315C38]" : "text-[#B33F22]"}`}>
          {formatCurrency(movement.amount)}
        </p>
      </div>
      {movement.notes ? <p className="mt-3 text-sm text-[#6F7668]">{movement.notes}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onEdit} className="min-h-10 rounded-xl border border-[#18251A]/10 text-sm font-black">
          Editar
        </button>
        <button type="button" onClick={onDelete} className="min-h-10 rounded-xl bg-[#F36F4A] text-sm font-black text-[#FFFDF8]">
          Eliminar
        </button>
      </div>
    </article>
  );
}
