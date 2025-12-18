# Eliminación Permanente de Registros

## Resumen

El sistema implementa **Soft Delete** por defecto para mantener la seguridad y trazabilidad. Sin embargo, para casos donde realmente necesites liberar espacio en la base de datos, se ha implementado una opción de **Eliminación Permanente** disponible solo para administradores.

## Estrategia Implementada

### 1. Soft Delete (Default) ✅
- **Comportamiento**: Marca registros como `activo = false`
- **Ventajas**:
  - Recuperable si se necesita
  - Mantiene trazabilidad completa
  - No rompe referencias
  - Registrado en auditoría
- **Uso**: Todos los usuarios con permisos de eliminación

### 2. Eliminación Permanente (Solo Administradores) ⚠️
- **Comportamiento**: Elimina físicamente el registro de la base de datos
- **Ventajas**:
  - Libera espacio inmediatamente
  - Limpia tablas de datos antiguos
- **Restricciones**:
  - Solo disponible para rol "Administrador"
  - Verifica referencias antes de eliminar
  - Requiere confirmación múltiple
  - Registrado en auditoría como `DELETE_PERMANENT`
- **Uso**: Administradores que necesitan limpiar datos antiguos

## Funciones Disponibles

### Órdenes
```typescript
// Soft delete (default)
await deleteOrden(id);

// Eliminación permanente (solo administradores)
await deleteOrdenPermanente(id);
```

### Embarques
```typescript
// Soft delete (default)
await deleteEmbarque(id);

// Eliminación permanente (solo administradores)
await deleteEmbarquePermanente(id);
```

### Recepciones
```typescript
// Soft delete (default)
await deleteRecepcion(id);

// Eliminación permanente (solo administradores)
await deleteRecepcionPermanente(id);
```

## Verificaciones de Seguridad

Antes de eliminar permanentemente, el sistema verifica:

1. **Referencias en otras tablas**:
   - Órdenes: Verifica embarques, recepciones y movimientos asociados
   - Embarques: Verifica movimientos asociados
   - Recepciones: Verifica movimientos asociados

2. **Si hay referencias**: Lanza un error y no permite la eliminación

3. **Auditoría**: Registra la eliminación permanente antes de ejecutarla

## Recomendaciones de Uso

### ✅ Usa Soft Delete cuando:
- Eliminación accidental es posible
- Necesitas mantener trazabilidad
- Los datos pueden ser útiles en el futuro
- Cumplimiento normativo requiere retención

### ⚠️ Usa Eliminación Permanente cuando:
- Datos de prueba o desarrollo
- Datos muy antiguos (ej: > 2 años) que ya no son relevantes
- Necesitas liberar espacio crítico
- Estás seguro de que no hay referencias importantes

## Limpieza Automática (Futuro)

Para casos donde necesites limpiar datos antiguos automáticamente, se puede implementar:

1. **Función de limpieza programada**:
   - Eliminar registros con `activo = false` mayores a X años
   - Ejecutar mensualmente o trimestralmente
   - Solo para administradores

2. **Archivado antes de eliminar**:
   - Exportar a CSV/Excel antes de eliminar
   - Guardar en almacenamiento externo
   - Mantener solo en auditoría

## Implementación en UI (Pendiente)

Para usar la eliminación permanente desde la interfaz:

1. Agregar botón "Eliminar Permanentemente" solo visible para administradores
2. Mostrar diálogo de confirmación con advertencia clara
3. Solicitar confirmación adicional (escribir "ELIMINAR" o similar)
4. Mostrar referencias si existen antes de intentar eliminar

## Notas Importantes

⚠️ **ADVERTENCIA**: La eliminación permanente es **IRREVERSIBLE**. Una vez eliminado, el registro no se puede recuperar excepto desde backups.

✅ **RECOMENDACIÓN**: Siempre realiza un backup antes de ejecutar eliminaciones permanentes masivas.

