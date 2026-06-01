import { Badge } from "./Badge";
import { formatMoney } from "../lib/payments";
import type { PaymentStatus, PublicGuestStatus } from "../types/database";

type PaymentStatusCardProps = {
  reservationStatus: PublicGuestStatus;
  paymentStatus: PaymentStatus;
  ticketQuantity: number;
  amount: number;
};

const reservationLabels: Record<PublicGuestStatus, string> = {
  pending: "Reserva recibida",
  approved: "Reserva aprobada",
  cancelled: "Reserva cancelada",
};

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pago pendiente",
  notified: "Pago informado",
  confirmed: "Pago confirmado",
  rejected: "Pago rechazado",
};

function paymentTone(status: PaymentStatus) {
  if (status === "confirmed") {
    return "success";
  }

  if (status === "notified") {
    return "warning";
  }

  if (status === "rejected") {
    return "danger";
  }

  return "neutral";
}

export function PaymentStatusCard({
  reservationStatus,
  paymentStatus,
  ticketQuantity,
  amount,
}: PaymentStatusCardProps) {
  return (
    <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 shadow-2xl shadow-[#294F2F]/10">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={paymentTone(paymentStatus)}>{paymentLabels[paymentStatus]}</Badge>
        <Badge tone={reservationStatus === "approved" ? "success" : reservationStatus === "cancelled" ? "danger" : "warning"}>
          {reservationLabels[reservationStatus]}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F6F1E8]/70 p-4">
          <p className="text-sm text-[#7F836F]">Entradas</p>
          <p className="mt-2 text-2xl font-semibold">{ticketQuantity}</p>
        </div>
        <div className="rounded-xl bg-[#F6F1E8]/70 p-4">
          <p className="text-sm text-[#7F836F]">Total sugerido</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(amount)}</p>
        </div>
      </div>
    </section>
  );
}
