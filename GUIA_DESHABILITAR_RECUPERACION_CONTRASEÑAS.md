# 🔐 Guía: Deshabilitar Recuperación de Contraseñas

## Objetivo
Deshabilitar la funcionalidad de recuperación automática de contraseñas en Supabase Auth, para que solo el Administrador pueda gestionar contraseñas.

## Pasos

### 1. Acceder a Supabase Dashboard

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Settings** (o **Configuración**)

### 2. Deshabilitar Recuperación de Contraseñas

En la sección **Email Auth**, busca las siguientes opciones y desactívalas:

#### Opción A: Deshabilitar completamente el enlace de recuperación

1. Busca la opción **"Enable email confirmations"** o **"Confirmar email"**
2. Puedes mantenerla activa si quieres confirmar emails al crear usuarios
3. Busca **"Enable password reset"** o **"Habilitar recuperación de contraseña"**
4. **DESACTÍVALA** o configúrala para que no muestre el enlace

#### Opción B: Ocultar el enlace en el frontend

Si no puedes deshabilitarlo completamente desde el dashboard:

1. Asegúrate de que tu página de login NO tenga un enlace a "¿Olvidaste tu contraseña?"
2. Si usas componentes de Supabase UI, no incluyas el componente de recuperación

### 3. Configurar Email Templates (Opcional)

Si quieres personalizar los emails:

1. Ve a **Authentication** → **Email Templates**
2. Edita el template **"Reset Password"** o **"Recuperar Contraseña"**
3. Puedes dejarlo vacío o poner un mensaje indicando que contacten al administrador

### 4. Verificar Configuración

Después de hacer los cambios:

1. Intenta acceder a la página de recuperación de contraseña (si existe)
2. Verifica que el enlace no esté disponible en tu aplicación
3. Confirma que solo el Administrador puede gestionar contraseñas desde el módulo de configuración

## Configuración Actual en el Código

Tu aplicación ya está configurada para:
- ✅ No mostrar enlace de recuperación en `Login.tsx`
- ✅ Solo Administrador puede gestionar usuarios (políticas RLS)
- ✅ Validación de roles en el código frontend

## Nota Importante

**Solo el Administrador puede:**
- Crear nuevos usuarios
- Modificar contraseñas de usuarios existentes
- Eliminar usuarios

Esto se controla mediante:
1. Políticas RLS en la base de datos
2. Validación de roles en `AuthContext.tsx`
3. Componentes protegidos con `ProtectedRoute`

## Verificación

Para verificar que todo funciona:

1. Intenta iniciar sesión con un usuario normal
2. Verifica que no haya opción de recuperar contraseña
3. Como Administrador, verifica que puedes gestionar usuarios desde Configuración

---

**Última actualización:** 12 de Diciembre, 2024

