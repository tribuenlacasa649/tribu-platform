# Payments flow

## Flujo actual

1. Invitado abre `/p/events/[slug]`.
2. Completa registro publico.
3. Entra a `/p/guest/[accessToken]`.
4. Ve alias, titular y monto sugerido.
5. Avisa pago con:
   - referencia,
   - texto/link de comprobante,
   - o imagen del comprobante.
6. El estado pasa a `payment_status = notified`.
7. Produccion revisa `/events/[id]/payments`.
8. Admin confirma pago.
9. La app:
   - marca `payment_status = confirmed`,
   - marca `status = approved`,
   - crea guest interno si falta,
   - genera tickets segun `ticket_quantity`,
   - registra/actualiza payment.
10. Invitado ve QR en su portal publico.

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

Columnas usadas:

- `public_guests.payment_reference`
- `public_guests.payment_proof`
- `public_guests.payment_proof_file_url`
- `payments.reference`
- `payments.proof`
- `payments.proof_file_url`

## Nota de seguridad

Para una prueba real esta bien usar bucket publico con links no listables. Para produccion mas fuerte, migrar a bucket privado y signed URLs.
