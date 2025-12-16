# 🔧 Solución: Login se Congela (Timeout)

## 🔍 Diagnóstico del Problema

Según los logs de la consola, el problema es que:
1. ✅ El usuario "administrador" existe en la tabla `usuarios`
2. ❌ El usuario NO existe en `auth.users` de Supabase Auth
3. ⏳ Por eso `signInWithPassword` se cuelga o falla

## ✅ Solución Rápida

### Opción 1: Crear el usuario desde Configuración (Recomendado)

1. **Necesitas iniciar sesión como otro administrador** (si existe)
2. Ve a **Configuración** → **Usuarios**
3. Busca "administrador" en la lista
4. Haz clic en **Editar**
5. **Cambia la contraseña** (esto creará/actualizará el usuario en auth.users)
6. Guarda
7. Intenta iniciar sesión de nuevo

### Opción 2: Crear el usuario manualmente en Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Haz clic en **"Add user"** → **"Create new user"**
5. Completa:
   - **Email:** `administrador@apsistema.com`
   - **Password:** Tu contraseña (ej: `Admin123`)
   - **Auto Confirm User:** ✅ (marcar)
6. Haz clic en **"Create user"**
7. Intenta iniciar sesión de nuevo

### Opción 3: Usar la API de creación (Si tienes acceso)

Si tienes acceso a la terminal y las variables de entorno configuradas:

```bash
# Crear usuario usando la función serverless
curl -X POST https://aypsistema.vercel.app/api/create-auth-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "administrador@apsistema.com",
    "password": "Admin123",
    "nombre_completo": "Administrador",
    "nombre_usuario": "administrador",
    "rol": "Administrador"
  }'
```

## 🔍 Verificación

### Verificar que el usuario existe en auth.users:

1. Ve a Supabase Dashboard → Authentication → Users
2. Busca `administrador@apsistema.com`
3. Si NO existe, créalo usando una de las opciones arriba

### Verificar que el usuario existe en tabla usuarios:

1. Ve a Supabase Dashboard → Table Editor → `usuarios`
2. Busca el usuario con `nombre_usuario = 'administrador'` o `correo = 'administrador@apsistema.com'`
3. Verifica que:
   - `activo = true`
   - `correo` coincide con el email en auth.users
   - `rol` es válido

## 🐛 Si el Problema Persiste

### Verifica los logs en la consola:

Después de intentar iniciar sesión, deberías ver:

```
🔐 Iniciando login para: administrador
🔍 Buscando por nombre_usuario...
🔍 Buscando por correo...
✅ Usuario encontrado por correo: {...}
🔑 Intentando autenticar con Supabase Auth...
   Llamando a signInWithPassword...
```

**Si ves:**
- `❌ Error de autenticación:` → El usuario no existe en auth.users o la contraseña es incorrecta
- `❌ Timeout en autenticación:` → Problema de conexión o el usuario no existe
- `✅ Autenticación exitosa` → El problema está en otro lugar

### Verifica la conexión a Supabase:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network** (Red)
3. Intenta iniciar sesión
4. Busca llamadas a `supabase.co`
5. Verifica que no haya errores 401, 403, o 500

## 📝 Notas Importantes

- **El email en `usuarios` debe coincidir EXACTAMENTE con el email en `auth.users`**
- **La contraseña se guarda en `auth.users`, NO en la tabla `usuarios`**
- **Solo Administradores pueden crear usuarios desde Configuración**

---

**¿Necesitas ayuda?** Comparte los logs de la consola después de intentar iniciar sesión.

