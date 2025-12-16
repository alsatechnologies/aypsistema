# 🔐 Instrucciones para Iniciar Sesión

## ⚠️ IMPORTANTE: Usa SOLO el Nombre de Usuario

El sistema ahora usa **nombres de usuario**, NO emails completos.

### ✅ CORRECTO:
- **Usuario:** `administrador`
- **Contraseña:** `Admin123`

### ❌ INCORRECTO:
- ~~Usuario: `administrador@apsistema.com`~~ (NO uses el email completo)
- ~~Usuario: `admin@test.com`~~ (NO uses el email antiguo)

## 📋 Credenciales Correctas

| Nombre de Usuario | Contraseña | Para Login |
|-------------------|------------|------------|
| `administrador` | `Admin123` | ✅ Usuario: `administrador` |
| `oficina` | (la que configuraste) | ✅ Usuario: `oficina` |
| `bascula` | (la que configuraste) | ✅ Usuario: `bascula` |

## 🔍 Cómo Funciona

1. **Tú ingresas:** Solo el nombre de usuario (ej: `administrador`)
2. **El sistema busca:** En la tabla `usuarios` por `nombre_usuario`
3. **Encuentra:** El correo asociado (`administrador@apsistema.com`)
4. **Autentica:** Con Supabase Auth usando ese correo interno
5. **Resultado:** Inicias sesión exitosamente

## ⚠️ Si Aún No Funciona

Si después de usar solo el nombre de usuario sigue sin funcionar:

1. **Verifica la contraseña:** Asegúrate de que sea `Admin123` en auth.users
2. **Verifica que el email esté confirmado:** En auth.users debe tener `email_confirmed_at` con una fecha
3. **Verifica que el usuario esté activo:** En la tabla `usuarios` debe tener `activo = true`

---

**Prueba ahora con:**
- Usuario: `administrador` (sin @apsistema.com)
- Contraseña: `Admin123`

