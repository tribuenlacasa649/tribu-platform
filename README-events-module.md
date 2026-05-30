# Modulo de gestion de eventos

Este modulo esta pensado para una app Next.js con App Router, TypeScript,
Tailwind y Supabase.

## Archivos incluidos

- `app/events/page.tsx`: listado de eventos.
- `app/events/[id]/page.tsx`: detalle, editar y eliminar.
- `app/events/new/page.tsx`: alta de evento.
- `app/events/[id]/edit/page.tsx`: edicion de evento.
- `app/events/EventForm.tsx`: formulario compartido.
- `app/events/actions.ts`: server actions para crear, editar y eliminar.
- `lib/supabase/server.ts`: cliente Supabase para server components/actions.
- `types/event.ts`: tipos TypeScript del modulo.

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
```

## Tabla esperada en Supabase

```sql
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  created_at timestamptz not null default now()
);
```

Para crear, editar o eliminar con la anon key, revisa que tus politicas RLS lo
permitan para el rol y flujo de autenticacion de tu app.
