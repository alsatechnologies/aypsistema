# Configurar Variables de Entorno en Vercel

## Problema Actual

Solo tienes estas variables:
- ✅ `VITE_SUPABASE_URL` (para frontend)
- ✅ `VITE_SUPABASE_ANON_KEY` (para frontend)

## Variables Faltantes (CRÍTICAS)

Necesitas agregar estas variables SIN el prefijo `VITE_` para que las funciones serverless funcionen:

1. **SUPABASE_URL** (sin VITE_)
   - Valor: El mismo que `VITE_SUPABASE_URL`
   - Ambiente: Production, Preview, Development

2. **SUPABASE_SERVICE_ROLE_KEY** (sin VITE_)
   - Valor: Tu Service Role Key de Supabase
   - Ambiente: Production, Preview, Development

## Cómo Agregarlas en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Haz clic en "Add New"
4. Agrega cada variable:

### Variable 1: SUPABASE_URL
- **Key**: `SUPABASE_URL`
- **Value**: Copia el valor de `VITE_SUPABASE_URL`
- **Environment**: Marca Production, Preview, Development

### Variable 2: SUPABASE_SERVICE_ROLE_KEY
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Tu Service Role Key (obtenerla de Supabase Dashboard → Settings → API → service_role key)
- **Environment**: Marca Production, Preview, Development

## Dónde Obtener el Service Role Key

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Settings → API
4. Busca "service_role" key (es secreta, no la compartas)
5. Cópiala y úsala como valor de `SUPABASE_SERVICE_ROLE_KEY`

## Después de Agregar

1. Haz un redeploy manual en Vercel
2. Espera 1-2 minutos
3. Prueba crear/eliminar usuarios nuevamente

