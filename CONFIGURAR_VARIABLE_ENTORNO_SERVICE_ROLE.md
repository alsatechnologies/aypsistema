# ⚙️ Configurar SUPABASE_SERVICE_ROLE_KEY en Vercel

## ⚠️ IMPORTANTE

Para que puedas crear usuarios desde el módulo de Configuración, necesitas configurar la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` en Vercel.

## 📋 Pasos

### 1. Obtener Service Role Key

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Busca la sección **"Project API keys"**
3. Copia la **"service_role" key** (no la anon key)

### 2. Configurar en Vercel

1. Ve a **Vercel Dashboard** → Tu Proyecto
2. Ve a **Settings** → **Environment Variables**
3. Haz clic en **"Add New"**
4. Configura:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Pega tu service_role key
   - **Environment:** Marca todas (Production, Preview, Development)
5. Haz clic en **"Save"**

### 3. Redesplegar

Después de agregar la variable:
1. Ve a **Deployments**
2. Haz clic en los **3 puntos** (⋮) del último deployment
3. Selecciona **"Redeploy"**
4. Espera a que termine el despliegue

## ✅ Después de Configurar

Una vez configurada la variable y redesplegado:

1. Ve a tu aplicación → **Configuración** → **Usuarios**
2. Haz clic en **"+ Nuevo Usuario"**
3. Completa el formulario:
   - Nombre completo
   - Nombre de usuario (se usará para generar el email)
   - Correo (se generará automáticamente como `nombre_usuario@apsistema.com` si no lo ingresas)
   - Contraseña
   - Rol
4. Haz clic en **"Guardar"**

El sistema automáticamente:
- ✅ Creará el usuario en la tabla `usuarios`
- ✅ Creará el usuario en `auth.users` de Supabase Auth
- ✅ Generará el email automáticamente si no lo proporcionas
- ✅ Confirmará el email automáticamente

## 🔒 Seguridad

- ✅ La Service Role Key está almacenada como variable de entorno en Vercel
- ✅ No se expone en el código del frontend
- ✅ Solo se usa en las funciones serverless del backend
- ✅ Solo Administradores pueden crear usuarios (políticas RLS)

---

**¿Necesitas ayuda configurando la variable de entorno?**

