# 💡 SOLUCIONES: Hacer Generación de Consecutivos Atómica

## 🎯 OBJETIVO
Evitar que se incrementen consecutivos si falla el guardado de la boleta.

---

## 🔧 SOLUCIÓN 1: Función RPC que Genera Consecutivo y Guarda Boleta (RECOMENDADA)

### Concepto
Crear una función RPC en PostgreSQL que:
1. Genere el consecutivo
2. Guarde la boleta
3. Todo en UNA transacción atómica

### Ventajas
- ✅ Totalmente atómico (todo o nada)
- ✅ Si falla el guardado, se revierte el consecutivo automáticamente
- ✅ No hay brechas en la secuencia
- ✅ Mejor rendimiento (una sola llamada a BD)

### Desventajas
- ⚠️ Requiere migración SQL
- ⚠️ Más complejo de mantener

### Implementación
```sql
CREATE OR REPLACE FUNCTION guardar_embarque_con_lote(
  p_id INTEGER,
  p_embarque_data JSONB,
  p_cliente_id INTEGER,
  p_producto_id INTEGER,
  p_almacen_id INTEGER,
  p_tipo_embarque VARCHAR
) RETURNS TABLE(...) AS $$
DECLARE
  v_codigo_lote VARCHAR;
  v_consecutivo INTEGER;
BEGIN
  -- Generar consecutivo
  SELECT codigo, consecutivo INTO v_codigo_lote, v_consecutivo
  FROM incrementar_o_crear_consecutivo_lote(...);
  
  -- Guardar boleta con el lote
  UPDATE embarques
  SET ... = p_embarque_data->>'...',
      codigo_lote = v_codigo_lote
  WHERE id = p_id;
  
  RETURN QUERY SELECT * FROM embarques WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 SOLUCIÓN 2: Generar Consecutivo DESPUÉS de Guardar (MÁS SIMPLE)

### Concepto
1. Guardar la boleta primero (sin lote)
2. Si se guarda exitosamente, generar el consecutivo
3. Actualizar la boleta con el lote

### Ventajas
- ✅ Más simple de implementar
- ✅ Si falla el guardado, no se incrementa el consecutivo
- ✅ No requiere cambios en BD

### Desventajas
- ⚠️ La boleta existe temporalmente sin lote
- ⚠️ Dos llamadas a BD (menos eficiente)

### Implementación
```typescript
// 1. Guardar boleta sin lote
await supabase.from('embarques').update({...}).eq('id', id);

// 2. Si se guardó exitosamente, generar lote
const { codigo } = await generarCodigoLoteParaOperacion(...);

// 3. Actualizar con el lote
await supabase.from('embarques').update({ codigo_lote: codigo }).eq('id', id);
```

---

## 🔧 SOLUCIÓN 3: Sistema de Reserva de Consecutivos

### Concepto
1. "Reservar" un consecutivo (marcarlo como pendiente)
2. Guardar la boleta
3. Si se guarda exitosamente, "confirmar" la reserva
4. Si falla, "liberar" la reserva

### Ventajas
- ✅ Previene brechas
- ✅ Permite reintentos

### Desventajas
- ⚠️ Más complejo
- ⚠️ Requiere tabla adicional de reservas
- ⚠️ Necesita limpieza de reservas expiradas

---

## 🎯 RECOMENDACIÓN: SOLUCIÓN 2 (Más Simple y Rápida)

### Razones
1. **No requiere cambios en BD** - Solo cambios en código
2. **Más fácil de implementar** - Cambios mínimos
3. **Resuelve el problema** - Si falla el guardado, no se incrementa
4. **Menos riesgo** - No requiere migraciones complejas

### Cambios Necesarios

1. **Modificar `updateEmbarque` en `embarques.ts`:**
   - Guardar primero sin lote
   - Si se guarda exitosamente, generar lote
   - Actualizar con el lote

2. **Mismo cambio en `updateRecepcion` en `recepciones.ts`**

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Paso 1: Modificar updateEmbarque
- Guardar boleta primero (sin lote)
- Generar lote después
- Actualizar con lote

### Paso 2: Modificar updateRecepcion
- Mismo patrón

### Paso 3: Testing
- Probar con errores simulados
- Verificar que no se incrementan consecutivos si falla

---

## ⚠️ CONSIDERACIONES

### Estado Temporal sin Lote
- La boleta existirá temporalmente sin `codigo_lote`
- Esto es aceptable ya que solo se genera cuando está "Completado"
- El lote se genera inmediatamente después

### Validaciones
- Mantener la validación de duplicados
- Mantener el error si no se puede generar lote

---

**¿Quieres que implemente la Solución 2 (más simple) o prefieres la Solución 1 (más robusta)?**
