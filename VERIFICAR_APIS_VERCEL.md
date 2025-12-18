# 🔍 Verificación: APIs en Vercel

## Prueba estas URLs para diagnosticar:

### 1. Health Check (nueva)
```
https://aypsistema.vercel.app/api/health
```
**Esperado**: JSON con estado del sistema  
**Si da 404**: Vercel no detectó la nueva función

### 2. Print Ticket (existente)
```
https://aypsistema.vercel.app/api/print-ticket
```
**Esperado**: Error 405 (Method Not Allowed) o error de validación  
**Si da 404**: Problema general con funciones serverless

### 3. Scales Weight (existente)
```
https://aypsistema.vercel.app/api/scales-weight?scale_id=bascula_01&get_type=weight
```
**Esperado**: JSON con peso o error de validación  
**Si da 404**: Problema general con funciones serverless

## Diagnóstico

- ✅ Si **todas** dan 404 → Problema general (necesita rebuild en Vercel)
- ✅ Si **solo health** da 404 → Problema específico del archivo
- ✅ Si **ninguna** da 404 → Todo funciona correctamente

## Solución Recomendada

**Hacer un rebuild manual en Vercel:**

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto `aypsistema`
3. Ve a "Deployments"
4. Click en "..." del último deployment
5. Selecciona "Redeploy"
6. Espera 2-3 minutos

## Alternativa: Verificar en Logs

1. Ve a: https://vercel.com/dashboard
2. Selecciona proyecto `aypsistema`
3. Ve a "Functions"
4. Busca `api/health`
5. Revisa logs para ver errores

