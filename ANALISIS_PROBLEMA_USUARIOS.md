# Análisis del Problema: Creación y Eliminación de Usuarios

## Problema Identificado

El error "Configuración de Supabase incompleta" indica que las variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` no están disponibles en los endpoints serverless de Vercel.

## Causa Raíz

En Vercel, las funciones serverless tienen acceso a TODAS las variables de entorno, PERO:

1. **Variables con prefijo `VITE_`**: Están diseñadas para el frontend y se exponen al cliente
2. **Variables sin prefijo**: Están disponibles para funciones serverless
3. **Problema**: Si las variables están configuradas como `VITE_SUPABASE_URL` en Vercel, las funciones serverless pueden no tener acceso directo

## Comparación con Funciones que Funcionan

- `print-ticket.ts`: Usa `process.env.PRINTER_API_URL` (sin prefijo VITE_) ✅
- `scales-weight.ts`: Usa `process.env.SCALES_API_URL` (sin prefijo VITE_) ✅
- `create-usuario.ts`: Intenta leer `VITE_SUPABASE_URL` primero ❌
- `delete-usuario.ts`: Intenta leer `VITE_SUPABASE_URL` primero ❌

## Solución

Las variables de entorno en Vercel deben estar configuradas SIN el prefijo `VITE_` para las funciones serverless:

- `SUPABASE_URL` (no `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_SUPABASE_SERVICE_ROLE_KEY`)
- `SUPABASE_ANON_KEY` (no `VITE_SUPABASE_ANON_KEY`)

Y también con el prefijo `VITE_` para el frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Acción Requerida (URGENTE)

**Problema identificado**: Solo tienes variables con prefijo `VITE_`, pero las funciones serverless necesitan variables SIN prefijo.

### Variables que TIENES:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

### Variables que FALTAN (CRÍTICAS):
- ❌ `SUPABASE_URL` (sin VITE_)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (sin VITE_)

### Solución:

1. Ve a Vercel → Settings → Environment Variables
2. Agrega estas dos variables nuevas:

   **Variable 1:**
   - Key: `SUPABASE_URL`
   - Value: El mismo valor que `VITE_SUPABASE_URL`
   - Environments: Production, Preview, Development

   **Variable 2:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Tu Service Role Key de Supabase
     - Obtenerla en: Supabase Dashboard → Settings → API → service_role key
   - Environments: Production, Preview, Development

3. Haz un redeploy manual después de agregar las variables

**Ver archivo `CONFIGURAR_VARIABLES_VERCEL.md` para instrucciones detalladas**

