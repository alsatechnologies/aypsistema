# 🧪 GUÍA: Ambiente Staging

## 📋 Descripción
Un ambiente de staging (pruebas) es una copia del ambiente de producción donde puedes probar cambios antes de desplegarlos a producción.

## 🎯 Objetivo
Permitir pruebas seguras de nuevas funcionalidades y cambios sin afectar el ambiente de producción.

## 🏗️ Configuración

### Opción 1: Branch de Supabase (Recomendado)

Supabase permite crear branches (ramas) de tu base de datos para desarrollo y staging.

#### Crear Branch de Staging

1. **Desde Supabase Dashboard:**
   - Ir a: https://supabase.com/dashboard
   - Seleccionar tu proyecto
   - Ir a "Branches" en el menú lateral
   - Click en "Create branch"
   - Nombre: `staging`
   - Click en "Create"

2. **Desde Supabase CLI:**
   ```bash
   supabase branches create staging
   ```

#### Configurar Variables de Entorno para Staging

En Vercel, crear un nuevo proyecto o ambiente para staging:

1. Ir a: https://vercel.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "Settings" → "Environments"
4. Crear un nuevo ambiente "Preview" o "Staging"
5. Configurar las mismas variables de entorno que producción, pero apuntando al branch de staging:
   ```
   VITE_SUPABASE_URL=https://[staging-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=[staging-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]
   ```

### Opción 2: Proyecto Separado de Supabase

Crear un proyecto completamente separado en Supabase para staging:

1. Ir a: https://supabase.com/dashboard
2. Click en "New Project"
3. Nombre: `ayp-sistema-staging`
4. Configurar igual que producción
5. Aplicar todas las migraciones
6. Configurar variables de entorno en Vercel apuntando a este proyecto

## 🔄 Flujo de Trabajo

### 1. Desarrollo en Staging

```bash
# Trabajar en una rama de desarrollo
git checkout -b feature/nueva-funcionalidad

# Hacer cambios
# ...

# Commit y push
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 2. Deploy a Staging

Vercel automáticamente crea preview deployments para cada pull request. Para un ambiente de staging permanente:

1. Crear una rama `staging` en GitHub
2. Configurar Vercel para hacer deploy automático de esta rama
3. O usar un dominio específico: `staging.aypsistema.com`

### 3. Pruebas en Staging

Antes de hacer merge a `main`:

- [ ] Ejecutar checklist pre-deploy en staging
- [ ] Probar todas las funcionalidades críticas
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que los datos se guardan correctamente
- [ ] Probar con diferentes roles de usuario

### 4. Deploy a Producción

Solo después de que todo funcione en staging:

```bash
# Merge a main
git checkout main
git merge staging
git push origin main

# Vercel automáticamente despliega a producción
```

## 📊 Comparación: Staging vs Producción

| Aspecto | Staging | Producción |
|---------|---------|------------|
| Base de datos | Branch o proyecto separado | Proyecto principal |
| URL | `staging.aypsistema.com` | `aypsistema.com` |
| Datos | Datos de prueba | Datos reales |
| Usuarios | Usuarios de prueba | Usuarios reales |
| Propósito | Pruebas | Operación real |

## 🔐 Seguridad

### Datos de Prueba

- **NO** usar datos reales de clientes/proveedores en staging
- **NO** usar contraseñas reales
- Crear datos de prueba anónimos
- Limpiar datos de prueba periódicamente

### Acceso

- Limitar acceso a staging solo a desarrolladores
- No compartir credenciales de staging públicamente
- Usar autenticación básica si es necesario

## 🧹 Mantenimiento

### Limpiar Datos de Prueba

Ejecutar periódicamente (semanal o mensual):

```sql
-- Limpiar recepciones de prueba
DELETE FROM recepciones WHERE boleta LIKE 'TEST-%';

-- Limpiar embarques de prueba
DELETE FROM embarques WHERE boleta LIKE 'TEST-%';

-- Limpiar movimientos de prueba
DELETE FROM movimientos WHERE boleta LIKE 'TEST-%';
```

### Sincronizar Schema

Cuando se aplican migraciones a producción, también aplicarlas a staging:

```bash
# Aplicar migraciones a staging
supabase db push --project-ref [staging-project-ref]
```

## 📝 Checklist de Staging

Antes de cada deploy a staging:

- [ ] Código revisado y sin errores de linting
- [ ] Migraciones aplicadas a staging
- [ ] Variables de entorno configuradas
- [ ] Datos de prueba disponibles
- [ ] Documentación actualizada

Después de cada deploy a staging:

- [ ] Verificar que el sitio carga correctamente
- [ ] Probar login/logout
- [ ] Probar funcionalidades críticas
- [ ] Verificar que no hay errores en consola
- [ ] Documentar cualquier problema encontrado

## 🚀 Ventajas de Tener Staging

1. **Pruebas Seguras**: Probar cambios sin riesgo
2. **Detección Temprana**: Encontrar bugs antes de producción
3. **Confianza**: Mayor confianza al desplegar a producción
4. **Colaboración**: Permite que otros prueben antes de aprobar
5. **Rollback Fácil**: Si algo falla, no afecta producción

---

**Última actualización**: _______________  
**Responsable de Staging**: _______________

