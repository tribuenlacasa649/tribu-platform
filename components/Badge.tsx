import type { EventStatus, GuestStatus } from "../types/database";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "soon";

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-zinc-500/30 bg-zinc-500/10 text-zinc-200",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  danger: "border-red-400/30 bg-red-400/10 text-red-200",
  soon: "border-white/10 bg-white/5 text-zinc-400",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
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
