# 🔐 Establecer Contraseña Admin123 para Administrador

## Opción 1: Desde Supabase Dashboard (Más Fácil) ⭐

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Busca `admin@test.com`
5. Haz clic en los **3 puntos** (⋮) junto al usuario
6. Selecciona **"Reset Password"** o **"Change Password"**
7. Ingresa la contraseña: `Admin123`
8. Guarda los cambios

**Luego prueba iniciar sesión con:**
- Email: `admin@test.com`
- Contraseña: `Admin123`

---

## Opción 2: Usar Script TypeScript (Requiere Service Role Key)

Si prefieres usar el script automático:

### Paso 1: Obtener Service Role Key

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Busca la sección **"Project API keys"**
3. Copia la **"service_role" key** (⚠️ NUNCA la expongas públicamente)
   - Es diferente a la "anon" key
   - Tiene permisos de administrador

### Paso 2: Configurar Variables y Ejecutar

```bash
# Configurar variables de entorno
export SUPABASE_URL="https://tu-proyecto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"

# Ejecutar el script
npx ts-node scripts/reset_admin_password.ts
```

El script establecerá automáticamente la contraseña `Admin123` para `admin@test.com`.

---

## Opción 3: Si me proporcionas la Service Role Key

Si me proporcionas tu Service Role Key, puedo ejecutar el script por ti.

**⚠️ IMPORTANTE:** La Service Role Key tiene acceso completo a tu base de datos. Solo compártela si confías en mí o ejecuta el script tú mismo.

---

## ✅ Verificación

Después de establecer la contraseña:

1. ✅ Intenta iniciar sesión con:
   - Email: `admin@test.com`
   - Contraseña: `Admin123`

2. ✅ Verifica que puedas acceder a todos los módulos

3. ✅ Confirma que puedes gestionar usuarios

---

**¿Cuál opción prefieres?**

