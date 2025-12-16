# 🚀 Guía de Implementación de Políticas RLS

## 📋 Pasos para Aplicar las Políticas de Seguridad

### Paso 1: Revisar el Reporte

Lee el archivo `REPORTE_SEGURIDAD_RLS.md` para entender los problemas encontrados.

### Paso 2: Backup de la Base de Datos

**⚠️ IMPORTANTE:** Haz un backup antes de aplicar cambios.

```sql
-- En Supabase Dashboard:
-- 1. Ve a Database → Backups
-- 2. Crea un backup manual
-- O usa pg_dump si tienes acceso CLI
```

### Paso 3: Verificar Autenticación

Asegúrate de que tu sistema de autenticación funciona correctamente:

```sql
-- Verificar que auth.email() funciona
SELECT auth.email();

-- Verificar que puedes obtener el usuario actual
SELECT id, correo, rol 
FROM usuarios 
WHERE correo = auth.email();
```

**Nota:** Si usas un sistema de autenticación diferente a Supabase Auth, necesitarás ajustar las políticas.

### Paso 4: Aplicar Políticas

#### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a **Supabase Dashboard** → Tu Proyecto
2. Ve a **SQL Editor**
3. Abre el archivo `scripts/rls_security_policies.sql`
4. Copia y pega el contenido completo
5. Haz clic en **Run** o presiona `Ctrl+Enter`

#### Opción B: Desde CLI

```bash
# Si tienes Supabase CLI instalado
supabase db execute -f scripts/rls_security_policies.sql
```

### Paso 5: Verificar Políticas Aplicadas

```sql
-- Ver todas las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Paso 6: Probar Permisos

#### Prueba 1: Usuario Administrador
```sql
-- Debe poder ver todo
SELECT * FROM usuarios;
SELECT * FROM recepciones;
SELECT * FROM embarques;
```

#### Prueba 2: Usuario Báscula
```sql
-- Debe poder ver recepciones y embarques
SELECT * FROM recepciones; -- ✅ Debe funcionar
SELECT * FROM embarques;   -- ✅ Debe funcionar

-- NO debe poder ver usuarios
SELECT * FROM usuarios; -- ❌ Debe fallar

-- NO debe poder crear órdenes
INSERT INTO ordenes (...) VALUES (...); -- ❌ Debe fallar
```

#### Prueba 3: Usuario Portero
```sql
-- Debe poder crear ingresos
INSERT INTO ingresos (...) VALUES (...); -- ✅ Debe funcionar

-- NO debe poder modificar embarques
UPDATE embarques SET ...; -- ❌ Debe fallar
```

### Paso 7: Ajustar si es Necesario

Si tu sistema de autenticación es diferente, necesitarás ajustar las políticas:

#### Si usas UUIDs en lugar de emails:

```sql
-- Cambiar de:
WHERE correo = auth.email()

-- A:
WHERE id = auth.uid()::integer
```

#### Si no usas Supabase Auth:

Necesitarás crear una función helper:

```sql
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INTEGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obtener email del usuario actual (ajustar según tu sistema)
  user_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Retornar ID del usuario
  RETURN (SELECT id FROM usuarios WHERE correo = user_email LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Luego usar en políticas:
WHERE id = get_current_user_id()
```

## 🔧 Troubleshooting

### Error: "function auth.email() does not exist"

**Causa:** No estás usando Supabase Auth o no está configurado.

**Solución:** 
1. Verifica que Supabase Auth esté habilitado
2. O ajusta las políticas para usar tu método de autenticación

### Error: "policy already exists"

**Causa:** Las políticas ya fueron creadas anteriormente.

**Solución:** 
```sql
-- Eliminar políticas existentes primero
DROP POLICY IF EXISTS "nombre_politica" ON nombre_tabla;
```

### Las políticas no funcionan

**Verificaciones:**
1. ¿RLS está habilitado en la tabla?
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'tu_tabla';
   ```

2. ¿El usuario está autenticado?
   ```sql
   SELECT auth.email();
   ```

3. ¿El usuario existe en la tabla usuarios?
   ```sql
   SELECT * FROM usuarios WHERE correo = auth.email();
   ```

## 📝 Notas Importantes

1. **Las políticas se aplican inmediatamente** después de ejecutar el script
2. **Los usuarios existentes mantendrán sus sesiones** hasta que se vuelvan a autenticar
3. **Prueba cada módulo** después de aplicar las políticas
4. **Mantén un usuario Administrador** para poder hacer cambios si algo falla

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs en Supabase Dashboard → Logs
2. Verifica que las políticas están aplicadas correctamente
3. Prueba con diferentes usuarios y roles

---

**Archivos relacionados:**
- `REPORTE_SEGURIDAD_RLS.md` - Reporte completo
- `RESUMEN_SEGURIDAD_RLS.md` - Resumen ejecutivo
- `scripts/rls_security_policies.sql` - Script SQL

