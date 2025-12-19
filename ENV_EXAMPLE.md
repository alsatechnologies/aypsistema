# Variables de Entorno - AYP Sistema

Copia este contenido a un archivo `.env` en la raíz del proyecto.

```env
# ============================================
# VARIABLES DE ENTORNO - AYP Sistema
# ============================================

# ============================================
# SUPABASE - Configuración Principal
# ============================================
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# ============================================
# APIs EXTERNAS - Integraciones
# ============================================
PRINTER_API_URL=https://apiticket.alsatechnologies.com
PRINTER_API_URL_2=https://apiticket2.alsatechnologies.com
SCALES_API_URL=http://apiscales.alsatechnologies.com
CERTIFICATE_ENTRADA_API_URL=https://pdf-entrada.alsatechnologies.com
CERTIFICATE_SALIDA_API_URL=https://pdf-salida.alsatechnologies.com

# ============================================
# SEGURIDAD - Opcional
# ============================================
RESET_ADMIN_SECRET=reset-admin-2024
```

## Configuración en Vercel

1. Ir a: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables
2. Agregar TODAS las variables de arriba
3. Marcar "Production", "Preview" y "Development" según corresponda

