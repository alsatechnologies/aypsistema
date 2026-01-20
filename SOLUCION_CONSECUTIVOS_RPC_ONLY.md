# Solución: Sistema de Consecutivos - Solo RPC

## Fecha: 2026-01-20

## Cambios Implementados

### 1. Eliminación del Método Legacy ✅

**Archivo:** `src/services/supabase/lotes.ts`

**Cambios:**
- ❌ **Eliminado:** Todo el método legacy (líneas 87-190)
- ✅ **Implementado:** Solo uso de función RPC con manejo de errores específico
- ✅ **Agregado:** Sistema de reintentos (3 intentos) solo para errores temporales
- ✅ **Agregado:** Errores claros y específicos para diferentes tipos de fallos

**Beneficios:**
- Garantiza atomicidad (no más condiciones de carrera)
- Previene duplicados
- Errores claros para identificar problemas reales

### 2. Manejo de Errores Mejorado ✅

**Archivos:** 
- `src/services/supabase/embarques.ts`
- `src/services/supabase/recepciones.ts`

**Cambios:**
- ❌ **Eliminado:** Manejo silencioso de errores que permitía guardar sin lote
- ✅ **Implementado:** Lanzar error si no se puede generar lote
- ✅ **Resultado:** NO se permite guardar embarques/recepciones sin lote

**Beneficios:**
- Fuerza a resolver problemas en lugar de ocultarlos
- Previene inconsistencias en la base de datos
- Mejora la trazabilidad

### 3. Validación de Duplicados ✅

**Archivos:**
- `src/services/supabase/embarques.ts`
- `src/services/supabase/recepciones.ts`

**Cambios:**
- ✅ **Agregado:** Validación antes de guardar para detectar códigos de lote duplicados
- ✅ **Resultado:** Si se detecta un duplicado, se lanza error antes de guardar

**Beneficios:**
- Detecta problemas inmediatamente
- Previene guardar datos inconsistentes
- Facilita la identificación de problemas

## Tipos de Errores Manejados

### Errores Críticos (No Reintentan)
- Función RPC no existe → Error claro con instrucciones
- Permisos insuficientes → Error con solución
- Problemas de RLS → Error con solución

### Errores Temporales (Reintentan 3 veces)
- Timeout de conexión → Reintenta con exponential backoff
- Problemas de red → Reintenta con exponential backoff
- Timeout de base de datos → Reintenta con exponential backoff

### Errores Desconocidos
- Cualquier otro error → Error detallado para reportar

## Flujo Actual

```
1. Intentar llamar función RPC
   ↓
2. ¿Éxito?
   ├─ SÍ → Validar duplicados → Guardar
   └─ NO → Analizar tipo de error
       ├─ Crítico → Lanzar error (no reintentar)
       ├─ Temporal → Reintentar (hasta 3 veces)
       └─ Desconocido → Lanzar error detallado
```

## Ventajas de Esta Solución

1. **Atomicidad Garantizada:** Solo usa RPC, que es atómico
2. **Sin Duplicados:** Imposible crear duplicados con RPC
3. **Errores Claros:** Identifica exactamente qué está mal
4. **Fuerza Solución:** No permite continuar con problemas
5. **Validación Preventiva:** Detecta duplicados antes de guardar

## Próximos Pasos Recomendados

1. **Monitorear Logs:** Revisar si hay errores de RPC en producción
2. **Verificar Migraciones:** Asegurar que todas las migraciones estén aplicadas
3. **Revisar Permisos RLS:** Verificar que los usuarios tengan permisos correctos
4. **Script de Sincronización:** (Opcional) Crear script para sincronizar consecutivos periódicamente

## Rollback

Si necesitas revertir estos cambios:
```bash
git revert <commit-hash>
```

Pero se recomienda **NO hacer rollback** ya que el método legacy causaba problemas de duplicados.
