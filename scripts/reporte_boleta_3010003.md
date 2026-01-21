# 🔍 REPORTE: Investigación Boleta 3010003 - Consecutivo de Lote

**Fecha:** 2026-01-21  
**Boleta:** 3010003  
**Código de Lote:** `EX-01011926-004`

---

## 📊 ESTADO ACTUAL

### Información de la Boleta
- **Boleta:** 3010003
- **Código de Lote:** `EX-01011926-004`
- **Consecutivo Extraído:** `004`
- **Estatus:** Completado
- **Tipo:** Exportación
- **Producto:** Aceite de Cártamo Orgánico (código: `01`)
- **Almacén:** TQ 211 (código: `19`)
- **Año:** 2026
- **Fecha de Creación:** 2026-01-20 17:55:05

### Análisis del Código de Lote
El código `EX-01011926-004` se descompone así:
- `EX-` = Exportación ✅
- `01` = Origen (ACEITE Y PROTEINAS SA DE CV) ✅
- `01` = Producto (Aceite de Cártamo Orgánico) ✅
- `19` = Almacén (TQ 211) ✅
- `26` = Año 2026 ✅
- `004` = Consecutivo ⚠️

---

## ⚠️ PROBLEMA IDENTIFICADO

### Secuencia de Consecutivos para esta Combinación

| Orden | Boleta | Código de Lote | Consecutivo | Fecha de Creación |
|-------|--------|----------------|------------|------------------|
| 1 | 3010001 | `EX-01011926-001` | 001 | 2026-01-07 |
| 2 | 3010002 | `EX-01011926-002` | 002 | 2026-01-08 |
| **3** | **3010003** | **`EX-01011926-004`** | **004** | **2026-01-20** |
| ❌ | ❌ | ❌ | **003** | **FALTA** |

### Estado en Base de Datos
- **Consecutivo en `consecutivos_lotes`:** `4` ✅
- **Máximo consecutivo usado en boletas:** `4` ✅
- **Consecutivos existentes:** `001`, `002`, `004` ⚠️

---

## 🔎 CAUSA PROBABLE

**El consecutivo `003` falta en la secuencia.** Esto puede haber ocurrido por:

1. **Operación Eliminada:** Una boleta con consecutivo `003` fue creada y luego eliminada físicamente de la base de datos (no hay soft delete implementado).

2. **Error en Generación:** Durante la creación de la boleta 3010003, el consecutivo se incrementó incorrectamente, saltándose el 003.

3. **Corrección Manual:** Una operación previa con consecutivo 003 fue corregida/eliminada manualmente, pero el consecutivo en `consecutivos_lotes` ya había sido incrementado.

---

## ✅ VERIFICACIÓN DE CONSISTENCIA

### Estado del Consecutivo en BD
```sql
tipo_operacion_codigo: EX-
producto_codigo: 01
almacen_codigo: 19
anio: 2026
consecutivo: 4
```

### Comparación con Boletas Existentes
- ✅ El consecutivo en BD (4) coincide con el máximo usado en boletas (004)
- ⚠️ **PERO** falta el consecutivo 003 en la secuencia

---

## 📝 CONCLUSIÓN

La boleta **3010003 tiene el consecutivo `004`** porque:

1. **El consecutivo en la tabla `consecutivos_lotes` está en 4**, lo cual es correcto según el número de operaciones completadas.

2. **Sin embargo, falta el consecutivo `003`** en la secuencia de boletas existentes, lo que indica que:
   - Hubo una operación intermedia que fue eliminada, O
   - Hubo un error durante la generación que causó que se saltara el 003

3. **El sistema está funcionando correctamente** en términos de incremento atómico (el consecutivo en BD coincide con el máximo usado), pero hay una **brecha en la secuencia histórica**.

---

## 🔧 RECOMENDACIONES

### Opción 1: Dejar como está (Recomendado)
- El consecutivo en BD es correcto (4)
- No afecta la funcionalidad del sistema
- Es solo una brecha histórica

### Opción 2: Corregir la secuencia
Si se desea mantener una secuencia continua sin brechas:
1. Cambiar el consecutivo de la boleta 3010003 de `004` a `003`
2. Decrementar el consecutivo en `consecutivos_lotes` de 4 a 3
3. **⚠️ ADVERTENCIA:** Esto podría causar conflictos si hay más operaciones después de esta

### Opción 3: Implementar Auditoría
Agregar una tabla de auditoría para rastrear:
- Creación de boletas
- Eliminación de boletas
- Cambios en consecutivos
- Esto ayudaría a identificar futuras brechas

---

## 📋 QUERIES DE VERIFICACIÓN

```sql
-- Ver todas las boletas de esta combinación
SELECT 
  e.boleta,
  e.codigo_lote,
  e.created_at,
  SUBSTRING(e.codigo_lote FROM '([0-9]{3})$')::INTEGER as consecutivo_numero
FROM embarques e
JOIN productos p ON e.producto_id = p.id
WHERE e.tipo_embarque = 'Exportación'
AND p.codigo_lote = '01'
AND e.almacen_id = 20
AND EXTRACT(YEAR FROM COALESCE(e.created_at, CURRENT_DATE)) = 2026
AND e.codigo_lote IS NOT NULL
ORDER BY e.created_at;

-- Verificar consecutivo en BD
SELECT 
  cl.consecutivo,
  cl.producto_codigo,
  cl.almacen_codigo
FROM consecutivos_lotes cl
WHERE cl.tipo_operacion_codigo = 'EX-'
  AND cl.producto_codigo = '01'
  AND cl.almacen_codigo = '19'
  AND cl.anio = 2026;
```

---

**Generado:** 2026-01-21  
**Investigado por:** Sistema de Auditoría Automática
