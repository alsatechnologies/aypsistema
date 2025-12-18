# 🔧 Configurar Variables de Entorno en Vercel

## Problema Actual
El health check muestra que las APIs externas están en "error". Esto se debe a que las variables de entorno no están configuradas en Vercel.

## Variables Requeridas

### 1. Variables de Supabase (Ya configuradas ✅)
- `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (para operaciones admin)

### 2. Variables de APIs Externas (Faltantes ⚠️)

#### API de Impresión (Printer)
```
PRINTER_API_URL=https://apiticket.alsatechnologies.com
```

#### API de Básculas (Scales)
```
SCALES_API_URL=http://apiscales.alsatechnologies.com
```

#### API de Certificados - Entrada (Reciba)
```
CERTIFICATE_ENTRADA_API_URL=https://pdf-entrada.alsatechnologies.com
```

#### API de Certificados - Salida (Embarque)
```
CERTIFICATE_SALIDA_API_URL=https://pdf-salida.alsatechnologies.com
```

## Pasos para Configurar en Vercel

1. **Ve al Dashboard de Vercel:**
   - https://vercel.com/dashboard
   - Selecciona tu proyecto `aypsistema`

2. **Ve a Settings:**
   - Click en "Settings" en el menú superior
   - Click en "Environment Variables" en el menú lateral

3. **Agrega cada variable:**
   Para cada variable de arriba:
   - Click en "Add New"
   - **Name**: El nombre de la variable (ej: `PRINTER_API_URL`)
   - **Value**: El valor de la variable (ej: `https://apiticket.alsatechnologies.com`)
   - **Environment**: Selecciona "Production", "Preview", y "Development" (o solo "Production" si prefieres)
   - Click en "Save"

4. **Variables a Agregar:**
   ```
   PRINTER_API_URL=https://apiticket.alsatechnologies.com
   SCALES_API_URL=http://apiscales.alsatechnologies.com
   CERTIFICATE_ENTRADA_API_URL=https://pdf-entrada.alsatechnologies.com
   CERTIFICATE_SALIDA_API_URL=https://pdf-salida.alsatechnologies.com
   ```

5. **Redeploy:**
   - Después de agregar todas las variables, ve a "Deployments"
   - Click en los "..." del último deployment
   - Selecciona "Redeploy"
   - Espera 2-3 minutos

## Verificación

Después del redeploy, prueba el health check:
```
https://aypsistema.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "apis": {
      "printer": "ok",
      "scales": "ok",
      "certificates": "ok"
    }
  }
}
```

## Nota Importante

- Las variables que empiezan con `VITE_` son accesibles desde el frontend
- Las variables sin `VITE_` solo son accesibles desde funciones serverless (backend)
- Las URLs de las APIs externas deben ser exactas (con http/https según corresponda)

