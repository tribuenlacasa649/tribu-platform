# Release Candidate SQL

Aplicar este bloque completo en Supabase SQL Editor antes de probar el flujo publico. No usa `create policy if not exists`, porque Postgres no lo soporta.

```sql
create extension if not exists pgcrypto;

alter table public.events
add column if not exists slug text,
add column if not exists is_public boolean default false,
add column if not exists public_title text,
add column if not exists public_description text,
add column if not exists ticket_price numeric default 0,
add column if not exists public_status text default 'draft';

alter table public.guests
add column if not exists ticket_quantity integer default 1,
add column if not exists notes text;

alter table public.public_guests
add column if not exists instagram text,
add column if not exists ticket_quantity integer default 1,
add column if not exists food_preferences text,
add column if not exists notes text,
add column if not exists status text default 'pending',
add column if not exists payment_status text default 'pending',
add column if not exists access_token text,
add column if not exists payment_reference text,
add column if not exists payment_proof text,
add column if not exists payment_proof_file_url text,
add column if not exists payment_notified_at timestamptz,
add column if not exists payment_confirmed_at timestamptz,
add column if not exists internal_guest_id uuid references public.guests(id) on delete set null;

alter table public.tickets
add column if not exists public_guest_id uuid references public.public_guests(id) on delete set null;

alter table public.payments
add column if not exists public_guest_id uuid references public.public_guests(id) on delete set null,
add column if not exists proof text,
add column if not exists proof_file_url text,
add column if not exists confirmed_at timestamptz,
add column if not exists rejected_at timestamptz;

create unique index if not exists events_slug_unique
on public.events(slug)
where slug is not null and slug <> '';

create unique index if not exists public_guests_access_token_unique
on public.public_guests(access_token)
where access_token is not null;

create unique index if not exists tickets_token_unique
on public.tickets(token);

create unique index if not exists payments_public_guest_id_unique
on public.payments(public_guest_id)
where public_guest_id is not null;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;

drop policy if exists "anon upload payment proofs" on storage.objects;
drop policy if exists "authenticated read payment proofs" on storage.objects;
drop policy if exists "authenticated manage payment proofs" on storage.objects;

create policy "anon upload payment proofs"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] is not null
);

create policy "authenticated read payment proofs"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-proofs');

create policy "authenticated manage payment proofs"
on storage.objects
for all
to authenticated
using (bucket_id = 'payment-proofs')
with check (bucket_id = 'payment-proofs');

drop function if exists public.create_public_guest_registration(
  uuid, text, text, text, integer, text, text, text
);

create or replace function public.create_public_guest_registration(
  new_event_id uuid,
  new_full_name text,
  new_phone text,
  new_instagram text,
  new_ticket_quantity integer,
  new_food_preferences text,
  new_notes text,
  new_access_token text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  created_guest_id uuid;
  created_public_guest_id uuid;
  safe_quantity integer := greatest(1, coalesce(new_ticket_quantity, 1));
begin
  if nullif(trim(new_full_name), '') is null or nullif(trim(new_phone), '') is null then
    raise exception 'Nombre y WhatsApp son obligatorios.';
  end if;

  insert into public.guests (
    event_id,
    name,
    contact,
    food_preferences,
    ticket_quantity,
    notes,
    status
  )
  values (
    new_event_id,
    trim(new_full_name),
    trim(new_phone),
    nullif(trim(coalesce(new_food_preferences, '')), ''),
    safe_quantity,
    nullif(trim(coalesce(new_notes, '')), ''),
    'active'
  )
  returning id into created_guest_id;

  insert into public.public_guests (
    event_id,
    full_name,
    phone,
    instagram,
    ticket_quantity,
    food_preferences,
    notes,
    status,
    payment_status,
    access_token,
    internal_guest_id
  )
  values (
    new_event_id,
    trim(new_full_name),
    trim(new_phone),
    nullif(trim(coalesce(new_instagram, '')), ''),
    safe_quantity,
    nullif(trim(coalesce(new_food_preferences, '')), ''),
    nullif(trim(coalesce(new_notes, '')), ''),
    'pending',
    'pending',
    new_access_token,
    created_guest_id
  )
  returning id into created_public_guest_id;

  return new_access_token;
end;
$$;

grant execute on function public.create_public_guest_registration(
  uuid, text, text, text, integer, text, text, text
) to anon, authenticated;

drop function if exists public.notify_public_guest_payment(text, text, text);
drop function if exists public.notify_public_guest_payment(text, text, text, text);

create or replace function public.notify_public_guest_payment(
  lookup_token text,
  new_reference text,
  new_proof text,
  new_proof_file_url text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.public_guests
  set
    payment_status = 'notified',
    payment_reference = nullif(new_reference, ''),
    payment_proof = nullif(new_proof, ''),
    payment_proof_file_url = coalesce(nullif(new_proof_file_url, ''), payment_proof_file_url),
    payment_notified_at = now()
  where access_token = lookup_token
    and (
      length(coalesce(new_reference, '')) >= 4
      or nullif(new_proof_file_url, '') is not null
    );
$$;

grant execute on function public.notify_public_guest_payment(text, text, text, text) to anon, authenticated;

drop function if exists public.get_public_guest_by_token(text);

create or replace function public.get_public_guest_by_token(lookup_token text)
returns table (
  id uuid,
  event_id uuid,
  full_name text,
  phone text,
  instagram text,
  ticket_quantity integer,
  food_preferences text,
  notes text,
  status text,
  payment_status text,
  access_token text,
  payment_reference text,
  payment_proof text,
  payment_proof_file_url text,
  payment_notified_at timestamptz,
  payment_confirmed_at timestamptz,
  internal_guest_id uuid,
  created_at timestamptz,
  event_name text,
  event_public_title text,
  event_location text,
  event_starts_at timestamptz,
  event_ticket_price numeric
)
language sql
security definer
set search_path = public
as $$
  select
    pg.id, pg.event_id, pg.full_name, pg.phone, pg.instagram,
    pg.ticket_quantity, pg.food_preferences, pg.notes,
    pg.status, pg.payment_status, pg.access_token,
    pg.payment_reference, pg.payment_proof, pg.payment_proof_file_url,
    pg.payment_notified_at, pg.payment_confirmed_at,
    pg.internal_guest_id, pg.created_at,
    e.name, e.public_title, e.location, e.starts_at, e.ticket_price
  from public.public_guests pg
  join public.events e on e.id = pg.event_id
  where pg.access_token = lookup_token
  limit 1;
$$;

grant execute on function public.get_public_guest_by_token(text) to anon, authenticated;

drop function if exists public.get_public_tickets_by_guest_token(text);

create or replace function public.get_public_tickets_by_guest_token(lookup_token text)
returns table (
  id uuid,
  token text,
  status text,
  used_count integer,
  max_uses integer
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.token, t.status, t.used_count, t.max_uses
  from public.tickets t
  join public.public_guests pg on pg.id = t.public_guest_id
  where pg.access_token = lookup_token
  order by t.created_at asc;
$$;

grant execute on function public.get_public_tickets_by_guest_token(text) to anon, authenticated;
```

Notas:
- El error de `ON CONFLICT` se corrige con el índice `payments_public_guest_id_unique`. El código además dejó de depender de `upsert`, para evitar que ese error vuelva a bloquear producción.
- El bucket `payment-proofs` queda publico para que el admin pueda abrir links de imagen. Las rutas son difíciles de adivinar porque usan el `access_token`; anon puede subir, pero no tiene policy para listar objetos por API.
- Para producción real con datos sensibles, conviene pasar comprobantes a bucket privado y servirlos con signed URLs desde backend.
