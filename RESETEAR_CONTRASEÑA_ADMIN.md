# 🔐 Resetear Contraseña del Administrador

## Problema Identificado

El usuario existe y está bien configurado, pero la contraseña puede no estar correcta en `auth.users`.

## Solución: Resetear Contraseña desde Supabase Dashboard

### Paso 1: Ir al Usuario
1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca el usuario `administrador@apsistema.com`
3. Haz clic en el usuario (en la fila)

### Paso 2: Resetear Contraseña
1. En el panel lateral que se abre, busca la sección **"Password"** o **"Contraseña"**
2. Haz clic en **"Reset Password"** o **"Change Password"**
3. Ingresa la nueva contraseña: `Admin123`
4. Guarda los cambios

### Paso 3: Probar Login
1. Ve a tu aplicación
2. Usuario: `administrador` (sin @apsistema.com)
3. Contraseña: `Admin123`
4. Debería funcionar ahora

## Alternativa: Si No Encuentras la Opción de Resetear

Puedes eliminar y recrear el usuario:

1. **Eliminar usuario actual:**
   - Haz clic en `administrador@apsistema.com`
   - Busca "Delete user" o "Remove user"
   - Confirma la eliminación

2. **Crear nuevo usuario:**
   - Haz clic en "Add user" (botón verde)
   - Email: `administrador@apsistema.com`
   - Password: `Admin123`
   - ✅ **Marca "Auto Confirm User"**
   - Haz clic en "Create user"

3. **Probar login:**
   - Usuario: `administrador`
   - Contraseña: `Admin123`

---

**¿Puedes resetear la contraseña desde el Dashboard y probar de nuevo?**

