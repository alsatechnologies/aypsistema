# 📋 Próximos Pasos Después del Deploy

## ✅ Lo que Ya Está Listo

1. ✅ Código corregido y subido a GitHub
2. ✅ Service Role Key configurada en Vercel
3. ✅ Funciones serverless creadas:
   - `/api/create-auth-user` - Crear usuarios en auth.users
   - `/api/update-auth-user` - Actualizar usuarios en auth.users
4. ✅ Integración en módulo Configuración

## 🔄 Proceso Actual

**Vercel está haciendo el deploy automáticamente:**
- Detecta el push a GitHub
- Compila el código
- Despliega la nueva versión
- ⏳ Esperando que termine...

## 📝 Pasos Siguientes (Después del Deploy)

### 1. Verificar que el Deploy fue Exitoso ✅

**En el Dashboard de Vercel:**
- Ve a tu proyecto
- Revisa que el último deploy tenga estado "Ready" (verde)
- Verifica que no haya errores de compilación

### 2. Probar Creación de Usuario 🧪

**Desde el módulo Configuración:**

1. **Inicia sesión** como Administrador
2. Ve a **Configuración** → **Usuarios**
3. Haz clic en **"+ Nuevo Usuario"**
4. Completa el formulario:
   - Nombre Completo: `Test Usuario`
   - Nombre de Usuario: `testusuario` (opcional)
   - Correo: `testusuario@apsistema.com` (opcional, se genera automático)
   - Contraseña: `Test123`
   - Rol: `Báscula` (o cualquier otro)
5. Haz clic en **"Guardar"**

**Resultado Esperado:**
- ✅ Toast de éxito: "Usuario creado correctamente en Supabase Auth"
- ✅ Toast de éxito: "Usuario creado correctamente en la base de datos"
- ✅ El usuario aparece en la lista
- ✅ El usuario puede iniciar sesión inmediatamente

### 3. Probar Actualización de Usuario 🔄

1. En la lista de usuarios, haz clic en el botón **Editar** (ícono de lápiz)
2. Cambia algún campo (ej: nombre completo)
3. Opcionalmente cambia la contraseña
4. Haz clic en **"Guardar"**

**Resultado Esperado:**
- ✅ Toast de éxito: "Usuario actualizado correctamente"
- ✅ Los cambios se reflejan en la lista
- ✅ El usuario puede seguir iniciando sesión

### 4. Probar Login con Nuevo Usuario 🔐

1. Cierra sesión
2. Inicia sesión con:
   - **Usuario o correo:** `testusuario` (o `testusuario@apsistema.com`)
   - **Contraseña:** `Test123`
3. Debería iniciar sesión correctamente

### 5. Verificar en Supabase Dashboard 🔍

**Opcional - Para confirmar que todo está bien:**

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Users**
4. Deberías ver el nuevo usuario creado con el email `testusuario@apsistema.com`
5. Verifica que el email esté confirmado (columna "Email Confirmed")

## 🐛 Si Algo No Funciona

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"

**Solución:**
1. Ve a Vercel → Tu Proyecto → Settings → Environment Variables
2. Verifica que exista `SUPABASE_SERVICE_ROLE_KEY`
3. Si no existe, agrégalo con el valor correcto
4. Haz un nuevo deploy (o espera a que Vercel lo detecte)

### Error: "Usuario creado en DB pero no en auth.users"

**Solución:**
- Verifica los logs de Vercel (Functions → Logs)
- Revisa que la Service Role Key sea correcta
- Verifica que el email no esté duplicado en auth.users

### Error: "Usuario no puede iniciar sesión"

**Posibles causas:**
- El usuario no se creó en auth.users (revisa logs)
- La contraseña es incorrecta
- El email no está confirmado (debería confirmarse automáticamente)

## 📊 Checklist Final

- [ ] Deploy completado exitosamente en Vercel
- [ ] Crear usuario desde Configuración funciona
- [ ] Usuario aparece en la lista
- [ ] Usuario puede iniciar sesión
- [ ] Actualizar usuario funciona
- [ ] Usuario actualizado puede seguir iniciando sesión

## 🎯 Siguiente Funcionalidad (Opcional)

Una vez que todo funcione, podrías considerar:

1. **Eliminar usuarios de auth.users** cuando se eliminan de la tabla usuarios
2. **Sincronizar usuarios existentes** que ya están en la tabla usuarios pero no en auth.users
3. **Validaciones adicionales** (ej: verificar que el nombre de usuario no esté duplicado)

---

**¿Listo para probar?** 🚀

