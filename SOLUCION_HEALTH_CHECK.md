# 🔧 Solución: Health Check 404 en Vercel

## Problema
El endpoint `/api/health` devuelve 404 en producción (Vercel).

## Posibles Causas

### 1. Vercel no está detectando las funciones serverless
Las funciones serverless en `api/` deberían funcionar automáticamente, pero a veces Vercel necesita un rebuild completo.

### 2. El rewrite está interceptando las rutas
Aunque hemos ajustado el `vercel.json`, puede que necesite un rebuild.

## Soluciones a Probar

### Opción 1: Rebuild Manual en Vercel (RECOMENDADO)

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto `aypsistema`
3. Ve a la pestaña "Deployments"
4. Encuentra el último deployment
5. Click en los "..." (tres puntos)
6. Selecciona "Redeploy"
7. Espera a que termine el deploy

### Opción 2: Verificar Logs de Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Functions" en el menú lateral
4. Busca `api/health`
5. Revisa los logs para ver errores

### Opción 3: Probar Otra API Existente

Prueba si otras APIs funcionan:
- `https://aypsistema.vercel.app/api/print-ticket` (debería dar error de método, no 404)
- `https://aypsistema.vercel.app/api/scales-weight` (debería dar error de parámetros, no 404)

Si estas también dan 404, el problema es general con las funciones serverless.

### Opción 4: Verificar Estructura del Proyecto

Asegúrate de que:
- ✅ La carpeta `api/` está en la raíz del proyecto
- ✅ Los archivos `.ts` están directamente en `api/` (no en subcarpetas, excepto `utils/`)
- ✅ Los archivos exportan `export default async function handler`

### Opción 5: Configuración Alternativa de vercel.json

Si nada funciona, prueba esta configuración mínima:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

(Sin rewrites, dejar que Vercel maneje todo automáticamente)

## Verificación Local

Para probar localmente que la función funciona:

```bash
# Instalar vercel CLI
npm i -g vercel

# Probar localmente
vercel dev
```

Luego prueba: `http://localhost:3000/api/health`

## Estado Actual

- ✅ Archivo `api/health.ts` existe y está correctamente estructurado
- ✅ Exporta `export default async function handler`
- ✅ `vercel.json` configurado para excluir `/api/*` del rewrite
- ⏳ Esperando rebuild de Vercel

## Próximo Paso

**Hacer un rebuild manual en Vercel** y esperar 2-3 minutos para que se complete.

