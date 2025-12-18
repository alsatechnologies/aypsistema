# 🔍 Diagnóstico del Problema de Login

## Problema Actual

El login se está colgando con timeout después de 5 segundos al intentar buscar el usuario en Supabase.

## Posibles Causas

### 1. Variables de Entorno No Configuradas en Vercel ⚠️

**Verificar:**
1. Ve a [Vercel Dashboard](https://vercel.com)
2. Selecciona tu proyecto `aypsistema`
3. Ve a **Settings** → **Environment Variables**
4. Verifica que existan:
   - `VITE_SUPABASE_URL` = `
   `
   - `VITE_SUPABASE_ANON_KEY` = (tu clave anónima)

**Si no existen, agrégalas:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://higgudeoopxwcvdrhudl.supabase.co`
- Environment: Production, Preview, Development (todas)

- Name: `VITE_SUPABASE_ANON_KEY`
- Value: (tu clave anónima de Supabase)
- Environment: Production, Preview, Development (todas)

### 2. Problema de CORS o Conexión 🌐

**Verificar en la consola del navegador:**
1. Abre DevTools (F12)
2. Ve a la pestaña **Network** (Red)
3. Intenta iniciar sesión
4. Busca llamadas a `supabase.co`
5. Verifica si hay errores:
   - `CORS policy`
   - `Failed to fetch`
   - `Network error`

### 3. Políticas RLS Bloqueando la Consulta 🔒

Las políticas RLS están configuradas correctamente, pero verifica:
- La política permite SELECT para usuarios `anon`
- El usuario tiene `activo = true`

## Solución Temporal: Verificar Configuración

### Paso 1: Verificar Variables en Vercel

```bash
# Las variables deben estar configuradas en Vercel
# VITE_SUPABASE_URL=https://higgudeoopxwcvdrhudl.supabase.co
# VITE_SUPABASE_ANON_KEY=tu_clave_aqui
```

### Paso 2: Verificar en la Consola del Navegador

Abre la consola y ejecuta:

```javascript
// Verificar que Supabase esté configurado
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'NO CONFIGURADA');
```

### Paso 3: Probar Conexión Directa

En la consola del navegador:

```javascript
// Probar conexión directa
const testSupabase = window.supabase || null;
if (testSupabase) {
  testSupabase.from('usuarios')
    .select('*')
    .eq('activo', true)
    .eq('nombre_usuario', 'administrador')
    .maybeSingle()
    .then(result => {
      console.log('Resultado:', result);
    })
    .catch(error => {
      console.error('Error:', error);
    });
} else {
  console.error('Supabase no está disponible');
}
```

## Próximos Pasos

1. ✅ Verifica que las variables de entorno estén en Vercel
2. ✅ Haz un nuevo deploy si agregaste variables
3. ✅ Limpia la caché del navegador (Ctrl+Shift+R)
4. ✅ Intenta iniciar sesión de nuevo
5. ✅ Revisa los logs en la consola

---

**Si el problema persiste después de verificar las variables de entorno, comparte:**
- Los mensajes exactos de la consola
- Errores en la pestaña Network
- Si las variables de entorno están configuradas en Vercel

