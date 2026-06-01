type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "green" | "blue" | "orange" | "red" | "purple";
};

const toneClasses = {
  green: "bg-[#DCE5D2] text-[#315C38]",
  blue: "bg-[#DDE9F7] text-[#155FB8]",
  orange: "bg-[#F8E8BF] text-[#9A6500]",
  red: "bg-[#FFE0D6] text-[#B33F22]",
  purple: "bg-[#E9DDF8] text-[#5B2DB4]",
};

export function StatCard({ label, value, helper, tone = "green" }: StatCardProps) {
  return (
    <div className="tribu-card rounded-[1.5rem] p-4">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${toneClasses[tone]}`}>
        <span className="text-xl font-black">{String(label).slice(0, 1)}</span>
      </div>
      <p className="text-3xl font-black tracking-tight text-[#18251A]">{value}</p>
      <p className="mt-1 text-sm font-bold text-[#42503E]">{label}</p>
      {helper ? (
        <p className="mt-3 inline-flex rounded-full bg-[#F0EADF] px-3 py-1 text-xs font-black text-[#6F7668]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
