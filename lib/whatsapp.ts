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

export function createTicketWhatsAppMessage(name: string, ticketUrls: string[]) {
  const ticketText = ticketUrls.map((url, index) => `Entrada ${index + 1}: ${url}`).join("\n");

  return `Hola ${name}, tu pago fue confirmado. Acá está tu entrada:\n${ticketText}`;
}
