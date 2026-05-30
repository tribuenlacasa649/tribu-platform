export type EventRecord = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  created_at: string;
};

export type EventFormValues = {
  name: string;
  description: string;
  location: string;
};
