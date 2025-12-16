# ⚡ Solución Rápida: Establecer Contraseña Admin123

## Problema

El Dashboard de Supabase solo permite enviar emails de recuperación, no cambiar la contraseña directamente.

## Solución: Usar Script Automático

### Opción 1: Si me das tu Service Role Key (Más Rápido) ⭐

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Copia la **"service_role" key** (no la anon key)
3. Pásamela aquí y ejecuto el script automáticamente

### Opción 2: Ejecutar Script Tú Mismo

1. **Obtén tu Service Role Key:**
   - Ve a Supabase Dashboard → Settings → API
   - Copia la "service_role" key

2. **Configura variables de entorno:**
   ```bash
   export SUPABASE_URL="https://tu-proyecto.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
   ```

3. **Ejecuta el script:**
   ```bash
   npx ts-node scripts/set_password_direct.ts
   ```

El script establecerá automáticamente la contraseña `Admin123` para `administrador@apsistema.com`.

## Opción 3: Eliminar y Recrear Usuario

Si prefieres hacerlo manualmente:

1. **Eliminar usuario actual:**
   - En el panel que tienes abierto, busca "Delete user" o "Remove user"
   - Confirma la eliminación

2. **Crear nuevo usuario:**
   - Ve a Authentication → Users
   - Haz clic en "Add user"
   - Email: `administrador@apsistema.com`
   - Password: `Admin123`
   - ✅ **Marca "Auto Confirm User"**
   - Haz clic en "Create user"

3. **Probar login:**
   - Usuario: `administrador`
   - Contraseña: `Admin123`

---

**¿Cuál opción prefieres? La más rápida es darme tu Service Role Key y lo hago automáticamente.**

