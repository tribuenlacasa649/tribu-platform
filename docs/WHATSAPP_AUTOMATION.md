# WhatsApp automation

## Estado actual

La app usa fallback gratuito con links `wa.me`.

Cuando el pago esta confirmado y hay tickets generados, admin ve:

- Enviar QR por WhatsApp.
- Copiar mensaje.
- Copiar link del ticket.

El mensaje incluye el nombre del invitado y los links `/ticket/[token]`.

## Por que no es automatico real todavia

WhatsApp automatico real requiere una API externa y credenciales privadas. No se deben poner tokens en frontend.

Opciones reales:

- Meta WhatsApp Cloud API.
- Twilio WhatsApp.
- WATI.
- Z-API u otro proveedor.

Estas opciones pueden requerir aprobacion, costos, numero emisor y plantillas.

## Variables futuras

```bash
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
```

## Proximo paso tecnico

Crear una API route segura, por ejemplo:

```text
app/api/whatsapp/send-ticket/route.ts
```

Esa ruta debe:

- Validar sesion admin.
- Leer tickets confirmados.
- Construir mensaje.
- Llamar a la API de WhatsApp desde backend.
- Nunca exponer credenciales al navegador.
