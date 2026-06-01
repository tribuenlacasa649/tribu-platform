# Tribu Platform - estado del proyecto

## Funciona

- Login interno admin con Supabase Auth.
- Dashboard interno.
- Gestion de eventos.
- Gestion de invitados internos.
- Entradas QR por evento.
- Ticket publico por token.
- Scanner QR manual y con camara usando `html5-qrcode`.
- Pagos manuales por transferencia.
- Registro publico sin password.
- Portal publico del invitado por access token.
- Solicitudes publicas por evento.
- Registro publico crea `public_guest` y `guest` interno inmediatamente.
- Confirmacion manual de pago con generacion automatica de tickets.
- Fallback gratuito de WhatsApp con `wa.me`.
- Banner visual por evento desde Supabase Storage `event-banners`.
- Ubicacion enriquecida con nombre, direccion y link de Google Maps.
- Selector de pais para WhatsApp en registro publico.

## Rutas principales

- Admin: `/login`, `/dashboard`, `/events`.
- Evento: `/events/[id]`.
- Invitados: `/events/[id]/guests`.
- Entradas: `/events/[id]/tickets`.
- Scanner QR: `/events/[id]/checkin`.
- Pagos: `/events/[id]/payments`.
- Reportes: `/events/[id]/reports`.
- Solicitudes publicas: `/events/[id]/public-guests`.
- Publico: `/p`, `/p/events/[slug]`, `/p/events/[slug]/register`.
- Portal invitado: `/p/guest/[accessToken]`.
- Ticket publico: `/ticket/[token]`.

## Local

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

## Variables necesarias

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Checklist evento real

- Crear evento.
- Configurar slug y publicarlo.
- Cargar direccion, link Google Maps y banner.
- Probar `/p/events/[slug]`.
- Registrar una solicitud publica.
- Avisar pago con referencia y/o imagen.
- Confirmar pago desde admin.
- Ver QR en portal publico.
- Probar Scanner QR manual con token.
- Probar scanner en celular con HTTPS.
- Probar que cada compra de 2+ entradas genere QR individuales.

## Pendientes recomendados

- Endurecer RLS despues de la prueba real.
- Pasar confirmacion de pago a API route/server action con permisos de admin.
- Integrar WhatsApp Cloud API si se decide automatizar de verdad.
- Agregar storage privado con signed URLs si se necesita mayor privacidad para comprobantes.
- Migrar banners a imagenes optimizadas si el trafico publico crece.
