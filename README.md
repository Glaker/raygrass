# RayGrass

App web instalable (PWA) para gestionar cortes de pasto: clientes y sus lugares, cortes, cobros y gastos.

## Correr en local

```bash
npm install
npm run dev
```

Necesita en `.env` (no se commitea) `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. Son las únicas dos variables que llegan al navegador (ver `vite.config.ts`).

## Publicar

`npm run build` genera `dist/`, que es un sitio estático. En Vercel o Netlify:
- comando de build `npm run build`, carpeta `dist`
- variables `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`
- redirigir todas las rutas a `/index.html` (SPA)

En el celular: abrir la URL y elegir "Agregar a pantalla de inicio" (Android/Chrome) o Compartir → "Agregar a inicio" (iPhone/Safari).

## Modelo de datos

`supabase/migrations/` tiene el esquema:

- **clientes** → **parques** (los lugares de cada cliente, con precio, m² y tiempo) → **trabajos**
- **trabajos.tipo**: `corte` (cuenta para la frecuencia) o `particular` (poda, fumigación, etc., no cuenta)
- **pagos**: con `trabajo_id` es el pago de ese trabajo; sin él es un pago a cuenta que se aplica a los trabajos impagos más viejos. La vista `trabajos_estado` calcula lo pagado y el saldo de cada trabajo.
- **gastos**: por categoría, sin vincular a nada.

Todas las tablas tienen RLS por `user_id`. El registro público está desactivado en Supabase Auth.

La frecuencia de corte de cada lugar es la mediana de sus últimos 4 intervalos entre cortes, porque cambia con la estación.

## Íconos

`npm run icons` regenera los PNG del PWA a partir de `public/favicon.svg` (requiere `rsvg-convert`).
