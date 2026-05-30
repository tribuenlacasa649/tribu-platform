type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-zinc-500">{helper}</p> : null}
    </div>
  );
}
