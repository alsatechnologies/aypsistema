# 🔧 Resolver Problema de Login

## Problema Identificado

El error "contraseña o usuario incorrecto" ocurre porque:
1. El sistema ahora usa **Supabase Auth** para autenticación
2. La contraseña debe estar en `auth.users`, no solo en la tabla `usuarios`
3. La contraseña en `auth.users` puede ser diferente a la que tienes en la tabla `usuarios`

## Solución Rápida

### Opción 1: Resetear Contraseña desde Supabase Dashboard (Más Fácil) ⭐

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Busca `admin@test.com`
5. Haz clic en los **3 puntos** (⋮) → **"Reset Password"**
6. Ingresa una nueva contraseña (ej: `Admin2024!`)
7. Guarda

**Luego prueba iniciar sesión con:**
- Email: `admin@test.com`
- Contraseña: La que acabas de establecer

### Opción 2: Usar Script TypeScript

Si prefieres usar código:

1. **Obtén tu Service Role Key:**
   - Ve a Supabase Dashboard → Settings → API
   - Copia la **"service_role" key** (⚠️ NUNCA la expongas públicamente)

2. **Configura variables de entorno:**
   ```bash
   export SUPABASE_URL="https://tu-proyecto.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
   export NEW_PASSWORD="Admin2024!"
   ```

3. **Ejecuta el script:**
   ```bash
   npx ts-node scripts/reset_admin_password.ts
   ```

## Verificación

Después de resetear la contraseña:

1. ✅ Intenta iniciar sesión con `admin@test.com` y la nueva contraseña
2. ✅ Verifica que puedas acceder a todos los módulos
3. ✅ Confirma que puedes gestionar usuarios

## Nota Importante

**Las contraseñas ahora se gestionan en `auth.users`:**
- ✅ Para cambiar contraseñas: Usa Supabase Dashboard o el script
- ✅ Solo el Administrador puede gestionar usuarios desde la aplicación
- ✅ La recuperación automática de contraseñas está deshabilitada (como solicitaste)

## Si el Problema Persiste

Si después de resetear la contraseña aún no funciona:

1. Verifica que el email sea exactamente `admin@test.com` (sin espacios)
2. Verifica que la contraseña tenga al menos 8 caracteres
3. Revisa la consola del navegador para ver errores específicos
4. Verifica que el usuario esté activo en la tabla `usuarios` (`activo = true`)

---

**¿Necesitas ayuda con algún paso específico?**

