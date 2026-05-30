export function getPublicEventRoute(slug: string) {
  return `/p/events/${slug}`;
}

export function getPublicEventRegisterRoute(slug: string) {
  return `/p/events/${slug}/register`;
}

export function getPublicGuestRoute(accessToken: string) {
  return `/p/guest/${accessToken}`;
}

export function getAbsolutePublicEventUrl(slug: string) {
  if (typeof window === "undefined") {
    return getPublicEventRoute(slug);
  }

  return `${window.location.origin}${getPublicEventRoute(slug)}`;
}
