import { formatCurrency } from "../lib/cash";

type CashSummaryProps = {
  income: number;
  expense: number;
  balance: number;
};

export function CashSummary({ income, expense, balance }: CashSummaryProps) {
  return (
    <section className="rounded-[1.6rem] border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#315C38]">Caja</p>
          <h2 className="text-lg font-black">Resumen</h2>
        </div>
        <p className={`rounded-full px-3 py-1 text-sm font-black ${balance >= 0 ? "bg-[#DCE5D2] text-[#315C38]" : "bg-[#FFE0D6] text-[#B33F22]"}`}>
          {formatCurrency(balance)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[#DCE5D2] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#315C38]">Ingresos</p>
          <p className="mt-1 text-lg font-black">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl bg-[#FFE0D6] p-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-[#B33F22]">Gastos</p>
          <p className="mt-1 text-lg font-black">{formatCurrency(expense)}</p>
        </div>
      </div>
    </section>
  );
}
