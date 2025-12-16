-- =====================================================
-- SCRIPT DE MIGRACIÓN DE USUARIOS A SUPABASE AUTH
-- Proyecto: Aceites y Proteínas
-- Fecha: 12 de Diciembre, 2024
-- =====================================================
-- 
-- IMPORTANTE: Este script migra usuarios de la tabla
-- usuarios a auth.users de Supabase Auth
-- 
-- Ejecutar este script DESPUÉS de actualizar el código
-- para usar Supabase Auth
-- =====================================================

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- 
-- Este script debe ejecutarse manualmente desde Supabase Dashboard
-- porque requiere permisos especiales para crear usuarios en auth.users
-- 
-- Pasos:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que los usuarios se crearon correctamente
-- 3. Los usuarios podrán iniciar sesión con su correo y contraseña
-- 
-- =====================================================

-- Función para migrar un usuario a auth.users
CREATE OR REPLACE FUNCTION migrate_user_to_auth(
  p_correo TEXT,
  p_contrasena TEXT,
  p_nombre_completo TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Intentar crear usuario en auth.users
  -- Nota: Esto requiere permisos especiales y puede necesitar ejecutarse
  -- desde el dashboard de Supabase o usando la API de administración
  
  -- Por ahora, retornamos null y el usuario debe crearse manualmente
  -- o mediante la API de administración de Supabase
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUCCIONES PARA MIGRAR USUARIOS MANUALMENTE
-- =====================================================
-- 
-- Opción 1: Usar Supabase Dashboard
-- 1. Ve a Authentication → Users
-- 2. Haz clic en "Add User"
-- 3. Ingresa el correo y contraseña del usuario
-- 4. Repite para cada usuario
-- 
-- Opción 2: Usar Supabase Management API
-- Puedes usar la API de administración para crear usuarios:
-- 
-- POST https://{project_ref}.supabase.co/auth/v1/admin/users
-- Headers:
--   Authorization: Bearer {service_role_key}
--   apikey: {service_role_key}
-- Body:
--   {
--     "email": "usuario@ejemplo.com",
--     "password": "contraseña",
--     "email_confirm": true
--   }
-- 
-- Opción 3: Usar el código de migración en Node.js/TypeScript
-- Ver: scripts/migrate_users_to_auth.ts
-- 
-- =====================================================

-- Verificar usuarios que necesitan migración
SELECT 
  id,
  correo,
  nombre_completo,
  rol,
  activo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = usuarios.correo
    ) THEN 'Ya migrado'
    ELSE 'Pendiente de migración'
  END as estado_migracion
FROM usuarios
WHERE activo = true
ORDER BY id;

