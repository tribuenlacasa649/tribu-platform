# Tribu Platform - Operations Modules SQL

Ejecutar en Supabase SQL Editor. No borra datos existentes.

```sql
create extension if not exists pgcrypto;

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text,
  amount numeric not null default 0,
  payment_method text,
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  phone text,
  instagram text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists event_suppliers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  agreed_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  role text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists event_staff (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  staff_member_id uuid not null references staff_members(id) on delete cascade,
  role text not null,
  start_time time,
  end_time time,
  payment_amount numeric not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  attendance_status text not null default 'scheduled' check (attendance_status in ('scheduled', 'present', 'absent')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists community_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  instagram text,
  email text,
  tags text[] not null default '{}',
  notes text,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists attendance_history (
  id uuid primary key default gen_random_uuid(),
  community_member_id uuid not null references community_members(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  guest_id uuid references guests(id) on delete set null,
  public_guest_id uuid references public_guests(id) on delete set null,
  ticket_id uuid references tickets(id) on delete set null,
  attended boolean not null default false,
  payment_status text,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  photo_url text,
  description text,
  servings_base integer not null default 1,
  prep_time_minutes integer,
  instructions text,
  mise_en_place text,
  production_notes text,
  notes text,
  created_at timestamptz not null default now()
);

alter table recipes add column if not exists photo_url text;
alter table recipes add column if not exists prep_time_minutes integer;
alter table recipes add column if not exists mise_en_place text;
alter table recipes add column if not exists production_notes text;

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,
  quantity numeric not null default 0,
  unit text,
  unit_cost numeric not null default 0,
  total_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists event_recipes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  planned_servings integer not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cash_movements_event_id_idx on cash_movements(event_id);
create index if not exists event_suppliers_event_id_idx on event_suppliers(event_id);
create index if not exists event_suppliers_supplier_id_idx on event_suppliers(supplier_id);
create index if not exists event_staff_event_id_idx on event_staff(event_id);
create index if not exists event_staff_staff_member_id_idx on event_staff(staff_member_id);
create index if not exists community_members_phone_idx on community_members(phone);
create index if not exists community_members_tags_idx on community_members using gin(tags);
create index if not exists attendance_history_member_id_idx on attendance_history(community_member_id);
create index if not exists attendance_history_event_id_idx on attendance_history(event_id);
create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients(recipe_id);
create index if not exists event_recipes_event_id_idx on event_recipes(event_id);
create index if not exists event_recipes_recipe_id_idx on event_recipes(recipe_id);

alter table cash_movements enable row level security;
alter table suppliers enable row level security;
alter table event_suppliers enable row level security;
alter table staff_members enable row level security;
alter table event_staff enable row level security;
alter table community_members enable row level security;
alter table attendance_history enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table event_recipes enable row level security;

drop policy if exists "authenticated manage cash movements" on cash_movements;
create policy "authenticated manage cash movements"
on cash_movements for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage suppliers" on suppliers;
create policy "authenticated manage suppliers"
on suppliers for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage event suppliers" on event_suppliers;
create policy "authenticated manage event suppliers"
on event_suppliers for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage staff members" on staff_members;
create policy "authenticated manage staff members"
on staff_members for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage event staff" on event_staff;
create policy "authenticated manage event staff"
on event_staff for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage community members" on community_members;
create policy "authenticated manage community members"
on community_members for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage attendance history" on attendance_history;
create policy "authenticated manage attendance history"
on attendance_history for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage recipes" on recipes;
create policy "authenticated manage recipes"
on recipes for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage recipe ingredients" on recipe_ingredients;
create policy "authenticated manage recipe ingredients"
on recipe_ingredients for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage event recipes" on event_recipes;
create policy "authenticated manage event recipes"
on event_recipes for all
to authenticated
using (true)
with check (true);

create or replace function sync_public_guest_to_community()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text;
  member_id uuid;
begin
  normalized_phone := nullif(regexp_replace(coalesce(new.country_code, '') || coalesce(new.phone, ''), '\D', '', 'g'), '');

  if normalized_phone is null then
    return new;
  end if;

  select id into member_id
  from community_members
  where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = normalized_phone
  limit 1;

  if member_id is null then
    insert into community_members (full_name, phone, instagram, tags, first_seen_at, last_seen_at)
    values (new.full_name, normalized_phone, new.instagram, '{}', now(), now())
    returning id into member_id;
  else
    update community_members
    set
      full_name = coalesce(nullif(new.full_name, ''), full_name),
      instagram = coalesce(new.instagram, instagram),
      last_seen_at = now()
    where id = member_id;
  end if;

  insert into attendance_history (
    community_member_id,
    event_id,
    public_guest_id,
    attended,
    payment_status
  )
  values (
    member_id,
    new.event_id,
    new.id,
    false,
    new.payment_status
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists public_guest_to_community on public_guests;
create trigger public_guest_to_community
after insert on public_guests
for each row
execute function sync_public_guest_to_community();

create or replace function sync_guest_to_community()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_phone text;
  member_id uuid;
begin
  normalized_phone := nullif(regexp_replace(coalesce(new.contact, ''), '\D', '', 'g'), '');

  if normalized_phone is null then
    return new;
  end if;

  select id into member_id
  from community_members
  where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = normalized_phone
  limit 1;

  if member_id is null then
    insert into community_members (full_name, phone, tags, first_seen_at, last_seen_at)
    values (new.name, normalized_phone, '{}', now(), now())
    returning id into member_id;
  else
    update community_members
    set
      full_name = coalesce(nullif(new.name, ''), full_name),
      last_seen_at = now()
    where id = member_id;
  end if;

  insert into attendance_history (
    community_member_id,
    event_id,
    guest_id,
    attended,
    payment_status
  )
  values (
    member_id,
    new.event_id,
    new.id,
    false,
    'confirmed'
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists guest_to_community on guests;
create trigger guest_to_community
after insert on guests
for each row
execute function sync_guest_to_community();
```

## Nota de comunidad

La sincronización automática se hace con triggers `public_guest_to_community` y `guest_to_community`.
No reemplaza los flujos actuales: solo crea o actualiza `community_members` por teléfono y agrega una fila inicial en `attendance_history`.
