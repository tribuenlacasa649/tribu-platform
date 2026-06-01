# Payments flow

## Flujo actual

1. Invitado abre `/p/events/[slug]`.
2. Completa registro publico.
3. La app crea inmediatamente `public_guest` y `guest` interno.
4. Entra a `/p/guest/[accessToken]`.
5. Ve alias, titular y monto sugerido.
6. Avisa pago con:
   - referencia,
   - o imagen del comprobante.
7. El estado pasa a `payment_status = notified`.
8. Produccion revisa `/events/[id]/payments`.
9. Admin confirma pago.
10. La app:
   - marca `payment_status = confirmed`,
   - marca `status = approved`,
   - reutiliza el guest interno creado al reservar,
   - genera tickets segun `ticket_quantity`,
   - registra/actualiza payment.
11. Invitado ve QR en su portal publico.

## Estados

Reserva:

- `pending`
- `approved`
- `cancelled`

Pago:

- `pending`
- `notified`
- `confirmed`
- `rejected`

Ticket:

- `available`
- `used`
- `cancelled`

## Comprobante

La imagen se sube a Supabase Storage bucket `payment-proofs`.

El boton `Ya pague` solo se habilita si:

- `payment_reference` tiene 4 caracteres o mas,
- o hay foto cargada.

Columnas usadas:

- `public_guests.payment_reference`
- `public_guests.payment_proof`
- `public_guests.payment_proof_file_url`
- `payments.reference`
- `payments.proof`
- `payments.proof_file_url`

## Nota de seguridad

Para una prueba real esta bien usar bucket publico con links no listables. Para produccion mas fuerte, migrar a bucket privado y signed URLs.
