export type EventStatus = "draft" | "active" | "archived";

export type GuestStatus = "active" | "cancelled" | "deleted";

export type InternalRole = "admin" | "production" | "door" | "cash" | "comms";

export type TicketStatus = "available" | "used" | "cancelled";

export type PaymentStatus = "pending" | "notified" | "confirmed" | "rejected";

export type PublicEventStatus = "draft" | "published" | "closed";

export type PublicGuestStatus = "pending" | "approved" | "cancelled";

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  role: InternalRole;
  created_at: string;
};

export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: EventStatus;
  slug: string | null;
  is_public: boolean;
  public_title: string | null;
  public_description: string | null;
  ticket_price: number | null;
  public_status: PublicEventStatus;
  created_at: string;
};

export type EventFormValues = {
  name: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  slug: string;
  is_public: boolean;
  public_title: string;
  public_description: string;
  ticket_price: string;
  public_status: PublicEventStatus;
};

export type GuestRecord = {
  id: string;
  event_id: string;
  name: string;
  contact: string | null;
  food_preferences: string | null;
  status: GuestStatus;
  ticket_quantity: number;
  notes: string | null;
  created_at: string;
};

export type GuestFormValues = {
  name: string;
  contact: string;
  food_preferences: string;
  status: GuestStatus;
  ticket_quantity: number;
  notes: string;
};

export type TicketRecord = {
  id: string;
  event_id: string;
  guest_id: string | null;
  token: string;
  status: TicketStatus;
  max_uses: number;
  used_count: number;
  created_at: string;
};

export type TicketScanRecord = {
  id: string;
  ticket_id: string;
  event_id: string;
  scanned_at: string;
  result: string;
  note: string | null;
};

export type PaymentRecord = {
  id: string;
  event_id: string;
  guest_id: string | null;
  amount: number;
  status: PaymentStatus;
  method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

export type TicketWithGuest = TicketRecord & {
  guests: Pick<GuestRecord, "id" | "name" | "contact"> | null;
};

export type PublicTicket = TicketRecord & {
  events: Pick<EventRecord, "id" | "name" | "location" | "starts_at"> | null;
  guests: Pick<GuestRecord, "id" | "name" | "contact"> | null;
};

export type PublicGuestRecord = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
  ticket_quantity: number;
  food_preferences: string | null;
  notes: string | null;
  status: PublicGuestStatus;
  payment_status: PaymentStatus;
  access_token: string;
  created_at: string;
};

export type PublicGuestWithEvent = PublicGuestRecord & {
  events:
    | Pick<
        EventRecord,
        | "id"
        | "name"
        | "public_title"
        | "location"
        | "starts_at"
        | "ticket_price"
      >
    | null;
};
