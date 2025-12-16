# 📋 Migración a Supabase Auth - Paso a Paso

## ✅ Paso 1: Verificación de Usuarios - COMPLETADO

**Estado actual:**
- ✅ `admin@test.com` - Existe en ambas tablas (Administrador)
- ✅ `oficina@test.com` - Creado en tabla usuarios (Oficina)
- ✅ `bascula@test.com` - Creado en tabla usuarios (Báscula)

**Resultado:** Todos los usuarios están sincronizados entre `auth.users` y `usuarios`.

---

## 🔐 Paso 2: Probar Login

Ahora vamos a probar que el login funciona correctamente con Supabase Auth.

### Instrucciones:

1. **Abre tu aplicación** (si está corriendo localmente o en Vercel)

2. **Intenta iniciar sesión** con cada usuario:
   - `admin@test.com` (Administrador)
   - `oficina@test.com` (Oficina)
   - `bascula@test.com` (Báscula)

3. **Verifica que:**
   - ✅ El login funciona correctamente
   - ✅ El usuario se carga con su rol correcto
   - ✅ Puede acceder a sus módulos permitidos

### ¿Qué contraseñas usar?

Las contraseñas están en `auth.users`. Si no las recuerdas:
- Puedes cambiarlas desde Supabase Dashboard → Authentication → Users
- O puedes usar las contraseñas que configuraste cuando creaste los usuarios

**¿Puedes probar el login ahora y decirme si funciona?**

---

## 🔒 Paso 3: Deshabilitar Recuperación de Contraseñas

Una vez que confirmes que el login funciona, procederemos a deshabilitar la recuperación de contraseñas.

### Instrucciones:

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **URL Configuration** (o **Configuración de URL**)
4. Busca la sección **"Redirect URLs"** o **"URLs de redirección"**
5. En **"Site URL"**, asegúrate de que esté configurada tu URL de producción

Luego:
1. Ve a **Authentication** → **Email Templates**
2. Edita el template **"Reset Password"**
3. Puedes dejarlo vacío o poner un mensaje como:
   ```
   Para recuperar tu contraseña, contacta al administrador del sistema.
   ```

**Nota:** La recuperación de contraseñas se puede deshabilitar completamente desde el código del frontend (ya está hecho - no hay enlace en Login.tsx).

---

## ✅ Paso 4: Verificar Políticas RLS

Después de probar el login, verificaremos que las políticas RLS funcionan correctamente.

### Pruebas a realizar:

1. **Como Portero:**
   - ✅ Debe poder crear/modificar ingresos
   - ❌ NO debe poder crear órdenes
   - ❌ NO debe poder ver usuarios

2. **Como Oficina:**
   - ✅ Debe poder crear/modificar órdenes
   - ✅ Debe poder gestionar clientes y proveedores
   - ❌ NO debe poder crear recepciones
   - ❌ NO debe poder ver usuarios

3. **Como Báscula:**
   - ✅ Debe poder crear/modificar recepciones y embarques
   - ❌ NO debe poder crear órdenes
   - ❌ NO debe poder ver usuarios

4. **Como Administrador:**
   - ✅ Debe poder acceder a TODO
   - ✅ Debe poder gestionar usuarios

---

## 📝 Siguiente Paso

**Por favor, prueba el login con los usuarios y dime:**
1. ¿Funciona el login correctamente?
2. ¿Qué contraseñas estás usando? (si las recuerdas)
3. ¿Hay algún error al iniciar sesión?

Después de confirmar que el login funciona, continuamos con los siguientes pasos.

