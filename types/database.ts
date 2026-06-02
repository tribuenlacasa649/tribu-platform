export type EventStatus = "draft" | "active" | "archived";

export type GuestStatus = "active" | "cancelled" | "deleted";

export type InternalRole = "admin" | "production" | "door" | "cash" | "comms";

export type TicketStatus = "available" | "used" | "cancelled";

export type PaymentStatus = "pending" | "notified" | "confirmed" | "rejected";

export type PublicEventStatus = "draft" | "published" | "closed";

export type PublicGuestStatus = "pending" | "approved" | "cancelled";

export type CashMovementType = "income" | "expense";

export type SupplierStatus = "pending" | "confirmed" | "paid" | "cancelled";

export type StaffPaymentStatus = "pending" | "paid";

export type StaffAttendanceStatus = "scheduled" | "present" | "absent";

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
  location_name: string | null;
  location_address: string | null;
  location_maps_url: string | null;
  event_banner_url: string | null;
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
  location_name: string;
  location_address: string;
  location_maps_url: string;
  event_banner_url: string;
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
  public_guest_id: string | null;
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
  public_guest_id: string | null;
  guest_id: string | null;
  amount: number;
  status: PaymentStatus;
  method: string | null;
  reference: string | null;
  proof: string | null;
  proof_file_url: string | null;
  notes: string | null;
  confirmed_at: string | null;
  rejected_at: string | null;
  created_at: string;
};

export type TicketWithGuest = TicketRecord & {
  guests: Pick<GuestRecord, "id" | "name" | "contact"> | null;
};

export type PublicTicket = TicketRecord & {
  events:
    | Pick<
        EventRecord,
        | "id"
        | "name"
        | "location"
        | "location_name"
        | "location_address"
        | "location_maps_url"
        | "event_banner_url"
        | "starts_at"
      >
    | null;
  guests: Pick<GuestRecord, "id" | "name" | "contact"> | null;
};

export type PublicGuestRecord = {
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
};

export type PublicGuestWithEvent = PublicGuestRecord & {
  events:
    | Pick<
        EventRecord,
        | "id"
        | "name"
        | "public_title"
        | "location"
        | "location_name"
        | "location_address"
        | "location_maps_url"
        | "event_banner_url"
        | "starts_at"
        | "ticket_price"
      >
    | null;
};

export type CashMovementRecord = {
  id: string;
  event_id: string;
  type: CashMovementType;
  category: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  date: string;
  notes: string | null;
  created_at: string;
};

export type SupplierRecord = {
  id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  phone: string | null;
  instagram: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type EventSupplierRecord = {
  id: string;
  event_id: string;
  supplier_id: string;
  agreed_amount: number;
  paid_amount: number;
  status: SupplierStatus;
  notes: string | null;
  created_at: string;
};

export type StaffMemberRecord = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string | null;
  notes: string | null;
  created_at: string;
};

export type EventStaffRecord = {
  id: string;
  event_id: string;
  staff_member_id: string;
  role: string;
  start_time: string | null;
  end_time: string | null;
  payment_amount: number;
  payment_status: StaffPaymentStatus;
  attendance_status: StaffAttendanceStatus;
  notes: string | null;
  created_at: string;
};

export type CommunityMemberRecord = {
  id: string;
  full_name: string;
  phone: string | null;
  instagram: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export type AttendanceHistoryRecord = {
  id: string;
  community_member_id: string;
  event_id: string | null;
  guest_id: string | null;
  public_guest_id: string | null;
  ticket_id: string | null;
  attended: boolean;
  payment_status: PaymentStatus | null;
  created_at: string;
};

export type RecipeRecord = {
  id: string;
  name: string;
  category: string | null;
  photo_url: string | null;
  description: string | null;
  servings_base: number;
  prep_time_minutes: number | null;
  instructions: string | null;
  mise_en_place: string | null;
  production_notes: string | null;
  notes: string | null;
  created_at: string;
};

export type RecipeIngredientRecord = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  unit_cost: number;
  total_cost: number;
  created_at: string;
};

export type EventRecipeRecord = {
  id: string;
  event_id: string;
  recipe_id: string;
  planned_servings: number;
  notes: string | null;
  created_at: string;
};
