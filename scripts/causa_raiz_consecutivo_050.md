# 🔍 CAUSA RAÍZ: Consecutivo 050 de Pasta de Cártamo

**Fecha del problema:** 2026-01-21 15:17:05 (creación de boleta 2250048)  
**Producto:** Pasta Convencional de Cártamo (código: 25)  
**Almacén:** 36 (BODEGA DE PASTA)

---

## 📊 PROBLEMA IDENTIFICADO

### Secuencia Real vs Esperada

| Boleta | Consecutivo Real | Consecutivo Esperado | Estado |
|--------|------------------|---------------------|--------|
| 2250046 | 048 | 048 | ✅ Correcto |
| 2250048 | **051** | **050** | ❌ Incorrecto |
| 2250049 | **052** | **051** | ❌ Incorrecto |
| 2250050 | **053** | **052** | ❌ Incorrecto |

**Diferencia:** Se saltaron los consecutivos 049 y 050

---

## 🔎 CAUSA RAÍZ IDENTIFICADA

### Flujo del Código Actual

1. **Se genera el consecutivo ANTES de guardar la boleta** (línea 207-213 de `embarques.ts`)
2. **Se valida que no esté duplicado** (línea 216-245)
3. **Se guarda la boleta** (línea 282-293)

### Problema: Orden de Operaciones

```
1. generarCodigoLote() → Incrementa consecutivo en BD (049)
2. Validar duplicado
3. Guardar boleta → Si falla aquí, el consecutivo ya se incrementó
```

**Si el paso 3 falla, el consecutivo ya está incrementado en la BD, pero la boleta no se guardó.**

---

## 🎯 ESCENARIO PROBABLE

### Lo que probablemente pasó:

1. **Intento 1:** Se generó consecutivo 049 → Error al guardar boleta → Consecutivo ya en 049
2. **Intento 2:** Se generó consecutivo 050 → Error al guardar boleta → Consecutivo ya en 050
3. **Intento 3:** Se generó consecutivo 051 → ✅ Boleta guardada exitosamente

**Resultado:** El consecutivo en BD quedó en 051 (o más), pero solo la boleta con consecutivo 051 se guardó.

---

## 🔧 POSIBLES CAUSAS DEL ERROR AL GUARDAR

1. **Error de validación:** Algún campo requerido faltaba o era inválido
2. **Error de red/timeout:** Problema de conexión con Supabase
3. **Error de RLS:** Problema de permisos al guardar
4. **Error de constraint:** Violación de alguna constraint de la BD
5. **Error de transacción:** La transacción se revirtió pero el consecutivo ya se había incrementado

---

## ⚠️ PROBLEMA ARQUITECTÓNICO

**El consecutivo se incrementa en una transacción separada del guardado de la boleta.**

Esto significa que:
- Si falla el guardado, el consecutivo ya se incrementó
- No hay rollback del consecutivo si falla el guardado
- Esto causa brechas en la secuencia

---

## 💡 SOLUCIONES POSIBLES

### Opción 1: Transacción Atómica (Recomendado)
- Generar el consecutivo y guardar la boleta en la misma transacción
- Si falla el guardado, hacer rollback del consecutivo también
- Requiere usar transacciones explícitas en Supabase

### Opción 2: Generar Consecutivo Después de Guardar
- Guardar la boleta primero
- Si se guarda exitosamente, generar el consecutivo
- Si falla, no se incrementa el consecutivo

### Opción 3: Validar y Reservar Consecutivo
- Reservar el consecutivo antes de guardar
- Si falla el guardado, liberar la reserva
- Más complejo de implementar

---

## 📋 CONCLUSIÓN

**La causa raíz es un problema de diseño arquitectónico:**

El consecutivo se incrementa **ANTES** de guardar la boleta, en una transacción separada. Si el guardado falla, el consecutivo ya se incrementó y no se puede revertir, causando brechas en la secuencia.

**Esto es un problema conocido de diseño que requiere una solución arquitectónica más robusta.**

---

**Generado:** 2026-01-22  
**Investigado por:** Sistema de Auditoría Automática
