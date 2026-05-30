# Cloudflare Pages deploy

Vercel puede seguir siendo el deploy principal. Esta guia deja Cloudflare como alternativa sin cambiar codigo ni romper Vercel.

## Opcion recomendada por ahora

Usar Vercel para produccion y Cloudflare Pages solo cuando quieras probar una segunda URL publica.

## Variables de entorno

Configurar en Cloudflare Pages:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build basico

En Cloudflare Pages:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `.next`

Si Cloudflare pide adaptador para rutas dinamicas, usar OpenNext en una rama separada para no arriesgar Vercel.

## OpenNext preparado como proximo paso

Cuando quieras activar Cloudflare con soporte completo para Next dinamico:

```bash
npm install -D @opennextjs/cloudflare wrangler
```

Agregar scripts a `package.json` en una rama aparte:

```json
{
  "scripts": {
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare deploy"
  }
}
```

Luego crear `wrangler.jsonc` siguiendo la version actual de la documentacion de OpenNext para Cloudflare.

## Checklist

- Hacer commit y push.
- Crear proyecto en Cloudflare Pages conectado a GitHub.
- Configurar variables de entorno.
- Deploy.
- Abrir URL publica desde celular.
- Probar `/p`, `/p/events/[slug]`, registro publico y portal del invitado.
