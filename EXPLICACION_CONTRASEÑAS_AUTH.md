# 🔐 Explicación: Por qué no puedes ver las contraseñas en auth.users

## ✅ Es Correcto - Es por Seguridad

La tabla `auth.users` **SÍ tiene una columna de contraseña**, pero se llama `encrypted_password` y está **encriptada/hasheada** por seguridad.

### ¿Por qué no puedes verla?

1. **Seguridad**: Las contraseñas están hasheadas usando algoritmos seguros (bcrypt)
2. **No se pueden leer**: Incluso con acceso a la base de datos, no puedes ver la contraseña original
3. **Solo se puede verificar**: Supabase Auth compara el hash cuando intentas iniciar sesión

### Estructura de auth.users

```
- id (UUID)
- email
- encrypted_password ← Aquí está, pero encriptada
- email_confirmed_at
- created_at
- last_sign_in_at
- ... (otros campos)
```

## 🔍 Estado Actual de tu Usuario Admin

Según la verificación:
- ✅ Usuario existe en `auth.users`
- ✅ Tiene contraseña configurada (`encrypted_password` no es null)
- ✅ Email confirmado
- ⚠️ **Problema**: La contraseña puede ser diferente a la que tienes en la tabla `usuarios`

## 💡 Solución: Resetear la Contraseña

Como no puedes leer la contraseña (y es correcto que sea así), necesitas **resetearla**:

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca `admin@test.com`
3. Haz clic en los **3 puntos** (⋮)
4. Selecciona **"Reset Password"** o **"Change Password"**
5. Establece una nueva contraseña (ej: `Admin2024!`)
6. Guarda

### Opción 2: Usar la API de Supabase

Puedo crear un script que use la API de administración para resetear la contraseña, pero necesitarías tu **Service Role Key**.

## 🔄 Diferencia entre las Dos Tablas

### Tabla `usuarios` (tu tabla personalizada)
- Almacena: Datos del usuario (nombre, rol, etc.)
- Contraseña: `contrasena_hash` (puede ser texto plano o hash simple)
- Propósito: Datos de negocio

### Tabla `auth.users` (Supabase Auth)
- Almacena: Información de autenticación
- Contraseña: `encrypted_password` (hash seguro, no legible)
- Propósito: Autenticación segura

## ✅ Cómo Funciona Ahora

1. **Login**: El usuario ingresa email y contraseña
2. **Supabase Auth**: Verifica contra `auth.users.encrypted_password`
3. **Si es correcta**: Crea una sesión y obtiene el email
4. **Tu código**: Busca el usuario en la tabla `usuarios` usando el email
5. **Carga**: Datos del usuario (rol, nombre, etc.) desde `usuarios`

## 🎯 Próximo Paso

**Resetea la contraseña del admin desde Supabase Dashboard** y luego prueba iniciar sesión.

¿Necesitas ayuda paso a paso para resetearla desde el Dashboard?

