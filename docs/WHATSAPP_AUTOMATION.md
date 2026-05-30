# WhatsApp Automation

## Release Candidate

El envio automatico real de WhatsApp requiere Meta WhatsApp Cloud API, Twilio u otro proveedor. Esas opciones pueden requerir aprobacion, plantillas, credenciales privadas y/o costo. Para no bloquear el evento, la app usa hoy el fallback gratuito y estable:

1. Produccion confirma el pago en `/events/[id]/payments`.
2. La app crea los tickets faltantes.
3. Se arma un mensaje con evento, fecha, ubicacion y link de entrada.
4. El boton `Enviar QR por WhatsApp` abre `wa.me` con el mensaje listo.
5. Produccion solo toca enviar.

Tambien quedan botones para copiar mensaje y copiar ticket.

## Mensaje actual

```text
Hola {nombre}.

Tu pago fue confirmado.

Evento: {evento}
Fecha: {fecha}
Ubicacion: {ubicacion}

Tu entrada:
Entrada 1: {ticketUrl}

Nos vemos.
```

## Automatizacion real futura

Para enviar sin intervencion humana:

- Crear una cuenta/app en Meta Developers.
- Configurar WhatsApp Cloud API.
- Validar numero emisor.
- Crear plantilla aprobada si se envia fuera de la ventana de 24 horas.
- Implementar un endpoint backend seguro que llame a Meta.

Variables futuras:

```env
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=
```

No poner estas claves en frontend ni en archivos versionados.
