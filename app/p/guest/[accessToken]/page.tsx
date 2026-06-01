"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../../../components/Badge";
import { CopyButton } from "../../../../components/CopyButton";
import { PaymentNoticeForm } from "../../../../components/PaymentNoticeForm";
import { PaymentStatusCard } from "../../../../components/PaymentStatusCard";
import { QRCodeBox } from "../../../../components/QRCodeBox";
import { LocationCard } from "../../../../components/LocationCard";
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

const statusLabels: Record<PublicGuestStatus, string> = {
  pending: "Solicitud recibida",
  approved: "Solicitud aprobada",
  cancelled: "Solicitud cancelada",
};

function getTone(status: PublicGuestStatus) {
  if (status === "approved") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "warning";
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

    loadInitialPortal();
  }, [params.accessToken, supabase]);

  const currentUrl =
    typeof window === "undefined" ? `/p/guest/${params.accessToken}` : window.location.href;
  const amount = (guest?.event_ticket_price ?? 0) * (guest?.ticket_quantity ?? 0);
  const ticketUrls = tickets.map((ticket) => getPublicTicketUrl(ticket.token));
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
    <main className="min-h-screen bg-[#F6F1E8] px-4 py-6 text-[#18251A]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="overflow-hidden rounded-[1.5rem] border border-[#18251A]/10 bg-[#FFFDF8] text-center shadow-2xl shadow-[#294F2F]/10">
          {guest?.event_banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={guest.event_banner_url} alt={guest.event_public_title || guest.event_name || "Evento"} className="h-36 w-full object-cover" />
          ) : null}
          <div className="p-4">
          <p className="text-sm font-semibold text-[#315C38]">Tribu Platform</p>
          <h1 className="mt-1 text-2xl font-semibold">Tu reserva</h1>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-[#42503E]">
            Cargando...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            {error}
          </div>
        ) : guest ? (
          <>
            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4 shadow-2xl shadow-[#294F2F]/10">
              <Badge tone={getTone(guest.status)}>{statusLabels[guest.status]}</Badge>
              <h2 className="mt-3 text-2xl font-semibold">{guest.full_name}</h2>
              <p className="mt-2 text-[#6F7668]">
                {guest.event_public_title || guest.event_name || "Evento"}
              </p>
            </section>

            <PaymentStatusCard
              reservationStatus={guest.status}
              paymentStatus={guest.payment_status}
              ticketQuantity={guest.ticket_quantity}
              amount={amount}
            />

            {guest.payment_status === "pending" || guest.payment_status === "rejected" ? (
              <>
                {guest.payment_status === "rejected" ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
                    No pudimos confirmar el pago anterior. Revisá los datos y volvé a avisar.
                  </div>
                ) : null}
                <PaymentNoticeForm
                  accessToken={guest.access_token}
                  amount={amount}
                  defaultReference={guest.payment_reference}
                  defaultProof={guest.payment_proof}
                  defaultProofFileUrl={guest.payment_proof_file_url}
                  onNotified={loadPortal}
                />
              </>
            ) : null}

            {guest.payment_status === "notified" ? (
              <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
                <h3 className="text-xl font-semibold">Pago informado</h3>
                <p className="mt-2 text-sm leading-6 text-amber-100">
                  Recibimos tu aviso. Producción va a revisar el pago y activar tu QR.
                </p>
              </section>
            ) : null}

            {guest.payment_status === "confirmed" ? (
              <section className="space-y-4">
                <div className="rounded-2xl border border-[#315C38]/20 bg-[#315C38]/10 p-5">
                  <h3 className="text-xl font-semibold">Pago confirmado</h3>
                  <p className="mt-2 text-sm text-[#294F2F]">
                    Tus entradas están activas. Mostrá el QR en la puerta.
                  </p>
                </div>

                {tickets.length === 0 ? (
                  <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-5 text-sm text-[#42503E]">
                    El pago está confirmado. Si aún no ves QR, producción está terminando de activarlo.
                  </div>
                ) : (
                  tickets.map((ticket, index) => (
                    <div key={ticket.id} className="space-y-3">
                      <div className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
                        <p className="text-sm text-[#7F836F]">Entrada {index + 1}</p>
                        <p className="mt-1 font-semibold">{ticket.status}</p>
                      </div>
                      <QRCodeBox value={getPublicTicketUrl(ticket.token)} size={260} />
                      <Link
                        href={`/ticket/${ticket.token}`}
                        className="flex min-h-12 items-center justify-center rounded-xl bg-[#315C38] px-5 font-semibold text-[#FFFDF8]"
                      >
                        Ver entrada
                      </Link>
                    </div>
                  ))
                )}
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-xl bg-[#315C38] px-5 font-semibold text-[#FFFDF8]"
                  >
                    Enviar a WhatsApp
                  </a>
                ) : null}
              </section>
            ) : null}

            <LocationCard
              name={guest.event_location_name || guest.event_location}
              address={guest.event_location_address}
              mapsUrl={guest.event_location_maps_url}
              compact={guest.payment_status !== "confirmed"}
            />

            <section className="rounded-2xl border border-[#18251A]/10 bg-[#FFFDF8] p-4">
              <h3 className="text-lg font-semibold">Evento</h3>
              <p className="mt-2 text-sm leading-6 text-[#42503E]">
                Total: {formatMoney(amount)}. Guardá este link para consultar tu estado.
              </p>
            </section>

            <CopyButton value={currentUrl} label="Copiar mi link" />
            <Link href="/p" className="text-center text-sm font-semibold text-[#315C38]">
              Ver otros eventos
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}
