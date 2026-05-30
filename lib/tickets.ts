export function createTicketToken() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "")
      : Math.random().toString(36).slice(2);

  return `tribu_${Date.now().toString(36)}_${randomPart}`;
}

export function getPublicTicketUrl(token: string) {
  if (typeof window === "undefined") {
    return `/ticket/${token}`;
  }

  return `${window.location.origin}/ticket/${token}`;
}

export function extractTicketToken(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const ticketIndex = parts.indexOf("ticket");

    if (ticketIndex >= 0 && parts[ticketIndex + 1]) {
      return parts[ticketIndex + 1];
    }
  } catch {
    return value.split("/").filter(Boolean).pop() ?? value;
  }

  return value;
}
