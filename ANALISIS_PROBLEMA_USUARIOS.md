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

## Acción Requerida

1. En Vercel → Settings → Environment Variables
2. Verificar que existan AMBAS versiones:
   - `SUPABASE_URL` (para serverless)
   - `VITE_SUPABASE_URL` (para frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (para serverless)
   - `VITE_SUPABASE_ANON_KEY` (para frontend)

3. Si solo existen con prefijo `VITE_`, agregar las versiones sin prefijo

