# 🔄 Actualizar Usuarios en auth.users a @apsistema.com

## ✅ Cambios Realizados en la Base de Datos

1. ✅ **Tabla usuarios actualizada**: Todos los correos ahora son `@apsistema.com`
2. ✅ **Nombres de usuario creados**: 
   - `administrador` → `administrador@apsistema.com`
   - `oficina` → `oficina@apsistema.com`
   - `bascula` → `bascula@apsistema.com`
3. ✅ **Función automática creada**: Los nuevos usuarios tendrán email `@apsistema.com` automáticamente

## ⚠️ Pendiente: Actualizar auth.users

Los usuarios en `auth.users` todavía tienen los emails antiguos (`@test.com`). Necesitamos actualizarlos.

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Para cada usuario:
   - Haz clic en los **3 puntos** (⋮)
   - Selecciona **"Change Email"** o edita manualmente
   - Cambia el email:
     - `admin@test.com` → `administrador@apsistema.com`
     - `oficina@test.com` → `oficina@apsistema.com`
     - `bascula@test.com` → `bascula@apsistema.com`

### Opción 2: Usar Script TypeScript

Si me proporcionas tu **Service Role Key**, puedo ejecutar el script automáticamente:

```bash
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
npx ts-node scripts/update_auth_users_emails.ts
```

## 📋 Credenciales Actualizadas

Después de actualizar auth.users, los usuarios podrán iniciar sesión con:

| Nombre de Usuario | Email Interno | Contraseña |
|-------------------|---------------|------------|
| `administrador` | `administrador@apsistema.com` | `Admin123` (o la que configures) |
| `oficina` | `oficina@apsistema.com` | (la que tengas configurada) |
| `bascula` | `bascula@apsistema.com` | (la que tengas configurada) |

## ✅ Lo que el Usuario Ve

- ✅ Ingresa: **Nombre de usuario** (ej: `administrador`)
- ✅ Contraseña: Su contraseña
- ❌ **NUNCA ve el email** `administrador@apsistema.com`

## 🔒 Seguridad

- ✅ Emails internos (`@apsistema.com`) no son públicos
- ✅ No se enviarán emails a estos dominios
- ✅ Solo son identificadores únicos para Supabase Auth
- ✅ El usuario solo usa su nombre de usuario

---

**¿Quieres que actualice los usuarios en auth.users ahora? Necesito tu Service Role Key o puedes hacerlo manualmente desde el Dashboard.**

