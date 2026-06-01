import type { EventStatus, GuestStatus } from "../types/database";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "soon";

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-[#18251A]/10 bg-[#FFFDF8] text-[#42503E]",
  success: "border-[#315C38]/15 bg-[#DCE5D2] text-[#294F2F]",
  warning: "border-[#F2C66D]/30 bg-[#F8E8BF] text-[#8A5B00]",
  danger: "border-[#F36F4A]/25 bg-[#FFE0D6] text-[#B33F22]",
  soon: "border-[#18251A]/10 bg-[#F0EADF] text-[#6F7668]",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function eventStatusTone(status: EventStatus): BadgeTone {
  if (status === "active") {
    return "success";
  }

  if (status === "archived") {
    return "warning";
  }

  return "neutral";
}

export function guestStatusTone(status: GuestStatus): BadgeTone {
  if (status === "active") {
    return "success";
  }

  if (status === "cancelled") {
    return "warning";
  }

  return "danger";
}
