# 🔍 GUÍA: Queries de Detección de Anomalías

## 📋 Descripción
Este documento contiene queries SQL para detectar posibles anomalías y problemas en el sistema. Se recomienda ejecutarlas periódicamente.

## ⏰ Frecuencia Recomendada
- **Diaria**: Queries 1, 2, 3, 4, 5, 6, 7, 12
- **Semanal**: Queries 8, 9, 11, 15
- **Mensual**: Queries 10, 13, 14

## 📊 Cómo Usar

### Opción 1: Desde Supabase Dashboard
1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el query deseado
5. Click en "Run"

### Opción 2: Desde Supabase CLI
```bash
supabase db execute -f scripts/queries_anomalias.sql
```

## 🔍 Queries Disponibles

### 1. Recepciones con Pesos Anómalos
**Propósito**: Identifica recepciones con pesos negativos o inconsistentes.

**Acción si hay resultados**: Revisar manualmente y corregir los datos.

---

### 2. Embarques con Pesos Anómalos
**Propósito**: Identifica embarques con pesos negativos o inconsistentes.

**Acción si hay resultados**: Revisar manualmente y corregir los datos.

---

### 3. Recepciones Completadas sin Código de Lote
**Propósito**: Identifica recepciones completadas que no tienen código de lote asignado.

**Acción si hay resultados**: 
- Verificar que el proceso de generación de código de lote esté funcionando
- Asignar códigos de lote manualmente si es necesario

---

### 4. Embarques Completados sin Código de Lote
**Propósito**: Identifica embarques completados que no tienen código de lote asignado.

**Acción si hay resultados**: 
- Verificar que el proceso de generación de código de lote esté funcionando
- Asignar códigos de lote manualmente si es necesario

---

### 5. Recepciones sin Producto o Proveedor
**Propósito**: Identifica recepciones completadas sin producto o proveedor asignado.

**Acción si hay resultados**: Asignar producto y/o proveedor manualmente.

---

### 6. Embarques sin Producto o Cliente
**Propósito**: Identifica embarques completados sin producto o cliente asignado.

**Acción si hay resultados**: Asignar producto y/o cliente manualmente.

---

### 7. Movimientos sin Peso Neto
**Propósito**: Identifica movimientos que no tienen peso neto registrado.

**Acción si hay resultados**: Revisar y corregir los movimientos afectados.

---

### 8. Recepciones con Fechas Futuras
**Propósito**: Identifica recepciones con fechas o horas en el futuro (posible error de configuración de fecha/hora).

**Acción si hay resultados**: Verificar configuración de fecha/hora del sistema.

---

### 9. Embarques con Fechas Futuras
**Propósito**: Identifica embarques con fechas o horas en el futuro.

**Acción si hay resultados**: Verificar configuración de fecha/hora del sistema.

---

### 10. Registros Modificados Después de Completarse
**Propósito**: Identifica registros que fueron modificados después de marcarse como completados (posible problema de seguridad).

**Acción si hay resultados**: 
- Revisar quién hizo las modificaciones
- Verificar si las modificaciones fueron autorizadas
- Revisar permisos de usuarios

---

### 11. Usuarios Inactivos con Actividad Reciente
**Propósito**: Identifica usuarios marcados como inactivos que tienen actividad reciente (posible inconsistencia).

**Acción si hay resultados**: 
- Verificar si el usuario debería estar activo
- Actualizar estado del usuario si es necesario

---

### 12. Registros Eliminados Recientemente
**Propósito**: Identifica registros eliminados en las últimas 24 horas (soft delete).

**Acción si hay resultados**: 
- Revisar si las eliminaciones fueron autorizadas
- Restaurar registros si fueron eliminados por error

---

### 13. Recepciones con Peso Neto Muy Alto
**Propósito**: Identifica recepciones con peso neto mayor a 100 toneladas (posible error de captura).

**Acción si hay resultados**: Verificar manualmente si el peso es correcto.

---

### 14. Embarques con Peso Neto Muy Alto
**Propósito**: Identifica embarques con peso neto mayor a 100 toneladas.

**Acción si hay resultados**: Verificar manualmente si el peso es correcto.

---

### 15. Registros Sin Actualizar en Más de 30 Días
**Propósito**: Identifica recepciones pendientes que no se han actualizado en más de 30 días.

**Acción si hay resultados**: 
- Revisar si estos registros están realmente pendientes
- Completar o cancelar según corresponda

---

## 📝 Checklist de Revisión Semanal

- [ ] Ejecutar queries 1-7 (anomalías diarias)
- [ ] Ejecutar queries 8, 9, 11, 15 (anomalías semanales)
- [ ] Revisar resultados y tomar acciones correctivas
- [ ] Documentar cualquier problema encontrado
- [ ] Reportar problemas críticos al administrador

---

## 🚨 Alertas Críticas

Si encuentras resultados en las siguientes queries, **contacta al administrador inmediatamente**:

- Query 10: Registros modificados después de completarse
- Query 12: Múltiples eliminaciones recientes no autorizadas
- Query 11: Usuarios inactivos con actividad (posible brecha de seguridad)

---

**Última revisión**: _______________  
**Próxima revisión programada**: _______________

