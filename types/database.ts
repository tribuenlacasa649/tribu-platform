export type EventStatus = "draft" | "active" | "archived";

export type GuestStatus = "active" | "cancelled" | "deleted";

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
