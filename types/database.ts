export type EventStatus = "draft" | "active" | "archived";

export type GuestStatus = "active" | "cancelled" | "deleted";

export type InternalRole = "admin" | "production" | "door" | "cash" | "comms";

export type TicketStatus = "active" | "cancelled" | "used";

export type PaymentStatus = "pending" | "paid" | "cancelled" | "refunded";

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
  created_at: string;
};

export type EventFormValues = {
  name: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
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
