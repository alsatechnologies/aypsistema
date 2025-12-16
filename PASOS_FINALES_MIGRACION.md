# ✅ Migración Completada - Pasos Finales

## ✅ Lo que Ya Está Funcionando

1. ✅ **Login con nombre de usuario** - Funciona correctamente
2. ✅ **Autenticación con Supabase Auth** - Configurada
3. ✅ **Políticas RLS granulares** - Aplicadas por rol
4. ✅ **Usuario administrador** - Funciona con `administrador` / `Admin123`
5. ✅ **Emails internos** - Usando `@apsistema.com`

## ⏳ Pasos Pendientes

### 1. Actualizar Usuarios Restantes en auth.users

Tienes 2 usuarios más que necesitan actualizarse:

| Usuario Actual (auth.users) | Nuevo Email | Nombre de Usuario |
|-----------------------------|-------------|-------------------|
| `oficina@test.com` | `oficina@apsistema.com` | `oficina` |
| `bascula@test.com` | `bascula@apsistema.com` | `bascula` |

**Cómo hacerlo:**
1. Ve a Supabase Dashboard → Authentication → Users
2. Para cada usuario:
   - Haz clic en el usuario
   - Busca "Delete user" y elimínalo
   - Haz clic en "Add user"
   - Email: `oficina@apsistema.com` (o `bascula@apsistema.com`)
   - Password: (la que quieras usar)
   - ✅ Marca "Auto Confirm User"
   - Haz clic en "Create user"

### 2. Establecer Contraseñas

Después de crear los usuarios, establece contraseñas para cada uno:
- `oficina` - (tu contraseña preferida)
- `bascula` - (tu contraseña preferida)

### 3. Revocar Service Role Key (IMPORTANTE) 🔒

Por seguridad, revoca la Service Role Key que me diste:

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Busca la sección **"Project API keys"**
3. Encuentra la **"service_role" key**
4. Haz clic en **"Revoke"** o **"Rotate"**
5. Genera una nueva si la necesitas después

**⚠️ Esto es importante para mantener la seguridad de tu proyecto.**

### 4. Probar Cada Rol

Después de crear los usuarios, prueba iniciar sesión con cada uno:

- ✅ `administrador` - Ya funciona
- ⏳ `oficina` - Probar después de crear
- ⏳ `bascula` - Probar después de crear

Verifica que cada rol solo puede acceder a sus módulos permitidos.

### 5. Deshabilitar Recuperación de Contraseñas (Opcional)

Si quieres asegurarte de que no se puedan recuperar contraseñas automáticamente:

1. Ve a **Supabase Dashboard** → **Authentication** → **Settings**
2. Busca **"Enable password reset"**
3. **DESACTÍVALA** si está activa

## 📋 Resumen de Credenciales

| Nombre de Usuario | Email Interno | Contraseña | Estado |
|-------------------|---------------|------------|--------|
| `administrador` | `administrador@apsistema.com` | `Admin123` | ✅ Funciona |
| `oficina` | `oficina@apsistema.com` | (pendiente) | ⏳ Por crear |
| `bascula` | `bascula@apsistema.com` | (pendiente) | ⏳ Por crear |

## 🎯 Próximo Paso Inmediato

**Revoca la Service Role Key ahora** para mantener la seguridad. Luego puedes crear los otros usuarios cuando tengas tiempo.

---

**¿Necesitas ayuda con alguno de estos pasos?**

