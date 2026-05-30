export function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("54")) {
    return digits;
  }

  if (digits.startsWith("9") && digits.length >= 10) {
    return `54${digits}`;
  }

  if (digits.length >= 10) {
    return `54${digits}`;
  }

  return digits;
}

export function createWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

type TicketWhatsAppEvent = {
  title?: string | null;
  dateLabel?: string;
  location?: string | null;
};

export function createTicketWhatsAppMessage(
  name: string,
  ticketUrls: string[],
  event?: TicketWhatsAppEvent
) {
  const ticketText = ticketUrls.map((url, index) => `Entrada ${index + 1}: ${url}`).join("\n");
  const eventLines = [
    event?.title ? `Evento: ${event.title}` : null,
    event?.dateLabel ? `Fecha: ${event.dateLabel}` : null,
    event?.location ? `Ubicación: ${event.location}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Hola ${name}.\n\nTu pago fue confirmado.\n\n${eventLines ? `${eventLines}\n\n` : ""}Tu entrada:\n${ticketText}\n\nNos vemos.`;
}
