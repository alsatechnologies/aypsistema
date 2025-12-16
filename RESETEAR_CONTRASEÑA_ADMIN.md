# 🔧 Reseteo de Contraseña del Administrador

## ✅ Estado Actual

He verificado y el usuario **administrador** ya existe en:
- ✅ Tabla `usuarios` (id: 1, email: administrador@apsistema.com)
- ✅ Tabla `auth.users` (id: ba3b6719-9b60-439d-b042-2832d715a9da)

## 🔑 Opciones para Resetear la Contraseña

### Opción 1: Desde Supabase Dashboard (Más Rápido) ⚡

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Busca `administrador@apsistema.com`
5. Haz clic en los **3 puntos** → **Reset Password**
6. Ingresa la nueva contraseña: `Admin123`
7. Guarda

**Luego intenta iniciar sesión con:**
- Usuario: `administrador`
- Contraseña: `Admin123`

### Opción 2: Usar el Script Local (Si tienes las variables de entorno)

Si tienes `VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas localmente:

```bash
# Instalar tsx si no lo tienes
npm install -g tsx

# Ejecutar el script
npx tsx scripts/fix_admin_password.ts
```

### Opción 3: Configurar Service Role Key en Vercel y Usar la Función

1. Ve a [Vercel Dashboard](https://vercel.com)
2. Selecciona tu proyecto `aypsistema`
3. Ve a **Settings** → **Environment Variables**
4. Agrega:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Tu Service Role Key de Supabase
   - **Environment:** Production, Preview, Development (todas)
5. Haz clic en **Save**
6. Espera a que se despliegue (o haz un nuevo deploy)
7. Luego ejecuta:

```bash
curl -X POST https://aypsistema.vercel.app/api/reset-admin-password \
  -H "Content-Type: application/json" \
  -d '{"secret": "reset-admin-2024", "new_password": "Admin123"}'
```

## 🔍 Verificar que Funciona

Después de resetear la contraseña:

1. Ve a la página de login
2. Ingresa:
   - **Usuario:** `administrador`
   - **Contraseña:** `Admin123`
3. Debería iniciar sesión correctamente

## 🐛 Si Aún No Funciona

1. Abre la consola del navegador (F12)
2. Intenta iniciar sesión
3. Revisa los logs en la consola
4. Comparte los mensajes que aparezcan

---

**Recomendación:** Usa la **Opción 1** (Supabase Dashboard) ya que es la más rápida y directa.
