import { formatCurrency } from "../lib/cash";

type CashSummaryProps = {
  income: number;
  expense: number;
  balance: number;
};

export function CashSummary({ income, expense, balance }: CashSummaryProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl bg-[#DCE5D2] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#315C38]">Ingresos</p>
        <p className="mt-1 text-lg font-black">{formatCurrency(income)}</p>
      </div>
      <div className="rounded-2xl bg-[#FFE0D6] p-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#B33F22]">Gastos</p>
        <p className="mt-1 text-lg font-black">{formatCurrency(expense)}</p>
      </div>
      <div className="rounded-2xl bg-[#FFFDF8] p-3 ring-1 ring-[#18251A]/10">
        <p className="text-[10px] font-black uppercase tracking-wide text-[#7F836F]">Balance</p>
        <p className="mt-1 text-lg font-black">{formatCurrency(balance)}</p>
      </div>
    </section>
  );
}
