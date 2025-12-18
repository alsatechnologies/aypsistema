# 🔄 Explicación: Soft Delete (Eliminación Suave)

## ¿Qué es Soft Delete?

El **Soft Delete** es una técnica donde en lugar de **eliminar físicamente** un registro de la base de datos, se marca como "inactivo" o "eliminado" mediante un campo booleano (`activo: false`). El registro permanece en la base de datos pero se oculta de las consultas normales.

## ¿Por qué usar Soft Delete?

### ✅ Ventajas:
1. **Recuperación de datos**: Los registros eliminados pueden restaurarse fácilmente
2. **Auditoría**: Mantiene el historial completo de todos los registros
3. **Integridad referencial**: No rompe relaciones con otras tablas
4. **Trazabilidad**: Permite rastrear qué se eliminó y cuándo
5. **Seguridad**: Evita pérdida accidental de datos críticos

### ⚠️ Desventajas:
1. **Espacio**: Los registros ocupan espacio aunque estén "eliminados"
2. **Consultas**: Necesitas filtrar por `activo = true` en todas las consultas
3. **Índices**: Puede afectar el rendimiento si hay muchos registros eliminados

---

## 🔧 Implementación en el Sistema AYP

### 1. Estructura de la Base de Datos

Todas las tablas principales tienen un campo `activo` de tipo `boolean`:

```sql
-- Ejemplo de estructura de tabla
CREATE TABLE recepciones (
  id SERIAL PRIMARY KEY,
  boleta VARCHAR(50),
  producto_id INTEGER,
  proveedor_id INTEGER,
  peso_bruto DECIMAL,
  -- ... otros campos ...
  activo BOOLEAN DEFAULT true,  -- ← Campo para soft delete
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Función de Eliminación (Soft Delete)

Cuando el usuario hace clic en "Eliminar", en lugar de hacer `DELETE FROM`, se hace un `UPDATE`:

```typescript
// ❌ Eliminación física (NO se usa)
export async function deleteRecepcion(id: number) {
  await supabase
    .from('recepciones')
    .delete()  // ← Esto eliminaría el registro permanentemente
    .eq('id', id);
}

// ✅ Eliminación suave (Soft Delete) - LO QUE SE USA
export async function deleteRecepcion(id: number) {
  // Obtener el registro antes de "eliminarlo" para auditoría
  const { data: recepcionAnterior } = await supabase
    .from('recepciones')
    .select('*')
    .eq('id', id)
    .single();

  // Marcar como inactivo en lugar de eliminar
  const { error } = await supabase
    .from('recepciones')
    .update({ 
      activo: false,  // ← Marcar como eliminado
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw error;

  // Registrar en auditoría
  await registrarAuditoria({
    tabla: 'recepciones',
    registro_id: id,
    accion: 'DELETE',
    datos_anteriores: recepcionAnterior || null,
  });
}
```

### 3. Consultas que Filtran Registros Activos

**Todas las consultas** que obtienen datos filtran automáticamente los registros eliminados:

```typescript
// ✅ Consulta que solo trae registros activos
export async function getRecepciones(filters?: RecepcionFilters) {
  let query = supabase
    .from('recepciones')
    .select('*')
    .eq('activo', true)  // ← Solo traer registros activos
    .order('created_at', { ascending: false });

  // ... aplicar filtros adicionales ...
  
  const { data, error } = await query;
  return { data, error };
}
```

### 4. Ejemplo Completo: Cliente

```typescript
// src/services/supabase/clientes.ts

// Obtener clientes (solo activos)
export async function getClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('activo', true)  // ← Solo activos
    .order('empresa', { ascending: true });

  if (error) throw error;
  return data;
}

// Eliminar cliente (soft delete)
export async function deleteCliente(id: number) {
  // 1. Obtener datos antes de eliminar (para auditoría)
  const { data: clienteAnterior } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  // 2. Marcar como inactivo (NO eliminar físicamente)
  const { error } = await supabase
    .from('clientes')
    .update({ 
      activo: false,  // ← Soft delete
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw error;

  // 3. Registrar en auditoría
  await registrarAuditoria({
    tabla: 'clientes',
    registro_id: id,
    accion: 'DELETE',
    datos_anteriores: clienteAnterior || null,
  });
}
```

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────┐
│  Usuario hace clic en "Eliminar"        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. Obtener registro actual            │
│     (para auditoría)                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. UPDATE activo = false              │
│     (NO DELETE)                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Registrar en tabla auditoría       │
│     (quién, cuándo, qué eliminó)      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Registro "oculto" en consultas    │
│     (activo = false no aparece)        │
└─────────────────────────────────────────┘
```

---

## 🔍 Tablas que Usan Soft Delete

Las siguientes tablas implementan soft delete:

1. ✅ `recepciones` - Recepciones de productos
2. ✅ `embarques` - Embarques de productos
3. ✅ `ordenes` - Órdenes de trabajo
4. ✅ `ingresos` - Ingresos de vehículos
5. ✅ `clientes` - Clientes
6. ✅ `proveedores` - Proveedores
7. ✅ `productos` - Productos
8. ✅ `almacenes` - Almacenes
9. ✅ `usuarios` - Usuarios del sistema
10. ✅ `laboratorio` - Reportes de laboratorio
11. ✅ `movimientos` - Movimientos de inventario
12. ✅ `lotes` - Códigos de lote

---

## 🔄 Restaurar Registros Eliminados

Para restaurar un registro eliminado, simplemente se actualiza `activo` a `true`:

```typescript
// Restaurar recepción eliminada
export async function restaurarRecepcion(id: number) {
  const { error } = await supabase
    .from('recepciones')
    .update({ 
      activo: true,  // ← Restaurar
      updated_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) throw error;
}
```

**Nota:** Actualmente esta funcionalidad no está expuesta en la UI, pero puede implementarse fácilmente si se necesita.

---

## 📝 Auditoría

Cada eliminación se registra en la tabla `auditoria`:

```typescript
// Ejemplo de registro en auditoría
{
  id: 123,
  tabla: 'recepciones',
  registro_id: 456,
  accion: 'DELETE',
  usuario_id: 1,
  datos_anteriores: { /* datos completos del registro */ },
  created_at: '2024-12-18T15:30:00Z'
}
```

Esto permite:
- Saber **quién** eliminó el registro
- Saber **cuándo** se eliminó
- Ver **qué datos** tenía antes de eliminarse
- Restaurar el registro si es necesario

---

## ⚙️ Configuración en Supabase

### Migración SQL para agregar campo `activo`:

```sql
-- Agregar columna activo a una tabla existente
ALTER TABLE recepciones 
ADD COLUMN activo BOOLEAN DEFAULT true;

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_recepciones_activo ON recepciones(activo);

-- Actualizar registros existentes a activo = true
UPDATE recepciones SET activo = true WHERE activo IS NULL;
```

---

## 🎯 Resumen

| Aspecto | Eliminación Física | Soft Delete |
|---------|-------------------|-------------|
| **Comando SQL** | `DELETE FROM` | `UPDATE SET activo = false` |
| **Registro en BD** | ❌ Eliminado permanentemente | ✅ Permanece en BD |
| **Recuperación** | ❌ Imposible | ✅ Fácil (UPDATE activo = true) |
| **Auditoría** | ⚠️ Limitada | ✅ Completa |
| **Consultas** | No necesita filtro | Necesita `.eq('activo', true)` |
| **Espacio** | ✅ Libera espacio | ⚠️ Ocupa espacio |

---

## 💡 Mejores Prácticas

1. ✅ **Siempre filtrar por `activo = true`** en consultas de lectura
2. ✅ **Registrar en auditoría** antes de marcar como eliminado
3. ✅ **Actualizar `updated_at`** al hacer soft delete
4. ✅ **Considerar limpieza periódica** de registros muy antiguos (ej: > 2 años)
5. ✅ **Documentar** qué tablas usan soft delete

---

**Última actualización:** Diciembre 2024

