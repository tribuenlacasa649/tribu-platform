"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { LocationCard } from "../../../../components/LocationCard";
import { PaymentNoticeForm } from "../../../../components/PaymentNoticeForm";
import { QRCodeBox } from "../../../../components/QRCodeBox";
import { formatMoney } from "../../../../lib/payments";
import { createSupabaseBrowserClient } from "../../../../lib/supabase";
import { getPublicTicketUrl } from "../../../../lib/tickets";
import { createTicketWhatsAppMessage, createWhatsAppUrl } from "../../../../lib/whatsapp";
import type { PaymentStatus, PublicGuestStatus, TicketStatus } from "../../../../types/database";

type PublicGuestPortalRecord = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  country_code: string | null;
  instagram: string | null;
  ticket_quantity: number;
  food_preferences: string | null;
  notes: string | null;
  status: PublicGuestStatus;
  payment_status: PaymentStatus;
  access_token: string;
  payment_reference: string | null;
  payment_proof: string | null;
  payment_proof_file_url: string | null;
  payment_notified_at: string | null;
  payment_confirmed_at: string | null;
  internal_guest_id: string | null;
  created_at: string;
  event_name: string | null;
  event_public_title: string | null;
  event_location: string | null;
  event_location_name: string | null;
  event_location_address: string | null;
  event_location_maps_url: string | null;
  event_banner_url: string | null;
  event_starts_at: string | null;
  event_ticket_price: number | null;
};

type PublicGuestTicket = {
  id: string;
  token: string;
  status: TicketStatus;
  used_count: number;
  max_uses: number;
};

const paymentAlias = "An.enfotos";
const paymentHolder = "Ana Laura Harboure";

const paymentLabels: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  notified: "Avisado",
  confirmed: "Confirmado",
  rejected: "Rechazado",
};

const paymentTone: Record<PaymentStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  notified: "warning",
  confirmed: "success",
  rejected: "danger",
};

function getTicketSummary(tickets: PublicGuestTicket[], paymentStatus: PaymentStatus) {
  if (paymentStatus !== "confirmed") {
    return "QR pendiente";
  }

  if (tickets.length === 0) {
    return "Activando QR";
  }

  if (tickets.every((ticket) => ticket.status === "used")) {
    return "Usadas";
  }

  return "QR activo";
}

export default function PublicGuestPortalPage() {
  const params = useParams<{ accessToken: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [guest, setGuest] = useState<PublicGuestPortalRecord | null>(null);
  const [tickets, setTickets] = useState<PublicGuestTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPortal() {
    const { data, error: requestError } = await supabase.rpc(
      "get_public_guest_by_token",
      { lookup_token: params.accessToken }
    );

    const firstRow = Array.isArray(data) ? data[0] : null;

    if (requestError || !firstRow) {
      setError(requestError?.message || "No encontramos esta solicitud.");
      setIsLoading(false);
      return;
    }

    setGuest(firstRow as PublicGuestPortalRecord);

    const { data: ticketData } = await supabase.rpc("get_public_tickets_by_guest_token", {
      lookup_token: params.accessToken,
    });
    setTickets((ticketData ?? []) as PublicGuestTicket[]);
    setIsLoading(false);
  }

  useEffect(() => {
    async function loadInitialPortal() {
      await loadPortal();
    }

    loadInitialPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.accessToken]);

  const currentUrl =
    typeof window === "undefined" ? `/p/guest/${params.accessToken}` : window.location.href;
  const amount = (guest?.event_ticket_price ?? 0) * (guest?.ticket_quantity ?? 0);
  const ticketUrls = tickets.map((ticket) => getPublicTicketUrl(ticket.token));
  const referenceToCopy = guest?.payment_reference || guest?.access_token.slice(0, 8).toUpperCase() || "";
  const whatsappUrl =
    guest && ticketUrls.length
      ? createWhatsAppUrl(
          `${guest.country_code || "+54"}${guest.phone}`,
          createTicketWhatsAppMessage(guest.full_name, ticketUrls, {
            title: guest.event_public_title || guest.event_name,
            location: guest.event_location_address || guest.event_location,
          })
        )
      : "";

  return (
    <main className="min-h-screen bg-[#F6F1E8] px-4 py-4 text-[#18251A]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 text-[#42503E]">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            {error}
          </div>
        ) : guest ? (
          <>
            <header className="overflow-hidden rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#294F2F]/10">
              {guest.event_banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={guest.event_banner_url} alt={guest.event_public_title || guest.event_name || "Evento"} className="h-28 w-full object-cover" />
              ) : null}
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#315C38]">Tu reserva</p>
                <h1 className="mt-1 text-2xl font-semibold">{guest.full_name}</h1>
                <p className="mt-1 truncate text-sm text-[#6F7668]">
                  {guest.event_public_title || guest.event_name || "Evento"}
                </p>
              </div>
            </header>

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Estado pago</p>
                  <h2 className="mt-1 text-xl font-semibold">{paymentLabels[guest.payment_status]}</h2>
                </div>
                <Badge tone={paymentTone[guest.payment_status]}>{paymentLabels[guest.payment_status]}</Badge>
              </div>
              {guest.payment_status === "notified" ? (
                <p className="mt-2 text-sm text-[#6F7668]">Pago avisado. Producción lo revisa y activa el QR.</p>
              ) : null}
              {guest.payment_status === "rejected" ? (
                <p className="mt-2 text-sm text-[#F36F4A]">No pudimos confirmar el pago. Volvé a cargar comprobante.</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Pago</p>
                  <p className="mt-2 text-lg font-semibold">{formatMoney(amount)}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{paymentAlias}</p>
                  <p className="text-[#6F7668]">{paymentHolder}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CopyButton value={paymentAlias} label="Copiar alias" />
                <CopyButton value={referenceToCopy} label="Copiar referencia" />
              </div>
            </section>

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Comprobante</p>
                <h2 className="mt-1 text-lg font-semibold">Avisar pago</h2>
              </div>
              {guest.payment_status === "pending" || guest.payment_status === "rejected" ? (
                <PaymentNoticeForm
                  accessToken={guest.access_token}
                  amount={amount}
                  defaultReference={guest.payment_reference}
                  defaultProof={guest.payment_proof}
                  defaultProofFileUrl={guest.payment_proof_file_url}
                  onNotified={loadPortal}
                />
              ) : (
                <div className="grid gap-2 text-sm">
                  <p className="text-[#6F7668]">
                    {guest.payment_status === "confirmed" ? "Pago confirmado." : "Comprobante recibido."}
                  </p>
                  {guest.payment_proof_file_url ? (
                    <a
                      href={guest.payment_proof_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 px-3 font-semibold text-[#315C38]"
                    >
                      Ver comprobante
                    </a>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7F836F]">Entradas</p>
                  <h2 className="mt-1 text-xl font-semibold">{guest.ticket_quantity}</h2>
                </div>
                <Badge tone={guest.payment_status === "confirmed" && tickets.length ? "success" : "neutral"}>
                  {getTicketSummary(tickets, guest.payment_status)}
                </Badge>
              </div>

              {guest.payment_status === "confirmed" ? (
                <div className="mt-4 grid gap-3">
                  {tickets.length === 0 ? (
                    <p className="text-sm text-[#6F7668]">Producción está terminando de activar tus entradas.</p>
                  ) : (
                    tickets.map((ticket, index) => (
                      <details key={ticket.id} className="rounded-2xl bg-[#F6F1E8] p-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                          <span className="font-semibold">Entrada {index + 1}</span>
                          <Badge tone={ticket.status === "available" ? "success" : ticket.status === "used" ? "warning" : "danger"}>
                            {ticket.status}
                          </Badge>
                        </summary>
                        <div className="mt-3 grid gap-3">
                          <QRCodeBox value={getPublicTicketUrl(ticket.token)} size={230} />
                          <Link
                            href={`/ticket/${ticket.token}`}
                            className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-4 font-semibold text-[#FFFDF8]"
                          >
                            Ver entrada
                          </Link>
                          <CopyButton value={getPublicTicketUrl(ticket.token)} label="Copiar entrada" />
                        </div>
                      </details>
                    ))
                  )}
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center justify-center rounded-xl bg-[#315C38] px-4 font-semibold text-[#FFFDF8]"
                    >
                      Enviar a WhatsApp
                    </a>
                  ) : null}
                </div>
              ) : null}
            </section>

            {guest.payment_status === "confirmed" ? (
              <LocationCard
                name={guest.event_location_name || guest.event_location}
                address={guest.event_location_address}
                mapsUrl={guest.event_location_maps_url}
                compact
              />
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <CopyButton value={currentUrl} label="Copiar mi link" />
              <Link
                href="/p"
                className="flex min-h-11 items-center justify-center rounded-xl border border-[#18251A]/10 bg-[#FFFDF8] px-3 text-sm font-semibold text-[#315C38]"
              >
                Más eventos
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
