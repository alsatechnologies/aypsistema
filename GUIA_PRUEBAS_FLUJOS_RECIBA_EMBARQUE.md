# Guía de Pruebas - Flujos de Reciba y Embarque

Esta guía documenta todas las combinaciones posibles para crear órdenes de Reciba y Embarque, y cómo probarlas sistemáticamente.

## 📋 Flujos Identificados

### **FLUJO 1: Ingreso → Reciba (Directo)**
**Descripción:** Se registra un ingreso con motivo "Reciba" y luego se crea la recepción manualmente en Reciba.

**Pasos:**
1. Ir a módulo **Ingreso**
2. Click en "Nuevo Ingreso"
3. Completar:
   - Nombre del chofer
   - Motivo: **Reciba**
   - Placas, vehículo, etc.
4. Guardar → Se crea solo el registro de ingreso
5. Ir a módulo **Reciba**
6. Click en "Nueva Operación"
7. Completar:
   - Producto
   - Proveedor
   - Chofer (puede ser diferente al del ingreso)
   - Placas
   - Tipo de transporte
8. Guardar → Se crea la recepción con boleta generada

**✅ Verificar:**
- [ ] El ingreso se crea correctamente
- [ ] La recepción se crea con boleta válida (formato: 1XX####)
- [ ] No hay duplicación de datos
- [ ] El movimiento se crea al completar la recepción

---

### **FLUJO 2: Ingreso → Oficina → Embarque**
**Descripción:** Se registra un ingreso con motivo "Embarque", se crea orden temporal en Oficina, se completa y luego se procesa en Embarque.

**Pasos:**
1. Ir a módulo **Ingreso**
2. Click en "Nuevo Ingreso"
3. Completar:
   - Nombre del chofer
   - Motivo: **Embarque**
   - Placas, vehículo, destino, etc.
4. Guardar → Se crea ingreso + orden temporal en Oficina (boleta TEMP-*)
5. Ir a módulo **Oficina**
6. Buscar la orden con boleta TEMP-*
7. Click en "Completar" o editar la orden
8. Completar:
   - Producto
   - Cliente
   - Destino (si no estaba)
   - Verificar chofer, placas, vehículo
9. Guardar → Se genera boleta final (formato: 2XX#### o 3XX####)
10. La orden queda en estatus "Completado"
11. Ir a módulo **Embarque**
12. Buscar el embarque por boleta (debe existir automáticamente)
13. Completar el proceso de pesaje

**✅ Verificar:**
- [ ] El ingreso se crea correctamente
- [ ] La orden temporal se crea en Oficina con boleta TEMP-*
- [ ] Al completar la orden, se genera boleta final válida
- [ ] El embarque se crea automáticamente en la tabla embarques
- [ ] Los datos se sincronizan correctamente entre orden y embarque
- [ ] El movimiento se crea al completar el embarque

---

### **FLUJO 3: Oficina → Embarque (Directo)**
**Descripción:** Se crea una orden de Embarque directamente desde Oficina sin pasar por Ingreso.

**Pasos:**
1. Ir a módulo **Oficina**
2. Click en "Nueva Orden"
3. Seleccionar tipo: **Embarque Nacional** o **Embarque Exportación**
4. Completar:
   - Producto
   - Cliente
   - Destino
   - Chofer
   - Placas
   - Vehículo
   - Tipo de transporte
5. Guardar → Se crea orden con boleta temporal TEMP-*
6. Click en "Completar" o editar la orden
7. Verificar datos y guardar → Se genera boleta final
8. Ir a módulo **Embarque**
9. Buscar el embarque por boleta
10. Completar el proceso de pesaje

**✅ Verificar:**
- [ ] La orden se crea correctamente con boleta temporal
- [ ] Al completar, se genera boleta final válida
- [ ] El embarque se crea automáticamente en la tabla embarques
- [ ] Los datos se sincronizan correctamente
- [ ] El movimiento se crea al completar el embarque

---

### **FLUJO 4: Oficina → Reciba (Directo)**
**Descripción:** Se crea una orden de Reciba directamente desde Oficina sin pasar por Ingreso.

**Pasos:**
1. Ir a módulo **Oficina**
2. Click en "Nueva Orden"
3. Seleccionar tipo: **Reciba**
4. Completar:
   - Producto
   - Proveedor
   - Chofer
   - Placas
   - Vehículo
   - Tipo de transporte
5. Guardar → Se crea orden con boleta temporal TEMP-*
6. Click en "Completar" o editar la orden
7. Verificar datos y guardar → Se genera boleta final (formato: 1XX####)
8. Ir a módulo **Reciba**
9. Buscar la recepción por boleta (debe existir automáticamente)
10. Completar el proceso de pesaje

**✅ Verificar:**
- [ ] La orden se crea correctamente con boleta temporal
- [ ] Al completar, se genera boleta final válida
- [ ] La recepción se crea automáticamente en la tabla recepciones
- [ ] Los datos se sincronizan correctamente entre orden y recepción
- [ ] El movimiento se crea al completar la recepción

---

### **FLUJO 5: Reciba → Directo (Sin Ingreso ni Oficina)**
**Descripción:** Se crea una recepción directamente desde Reciba sin pasar por Ingreso u Oficina.

**Pasos:**
1. Ir a módulo **Reciba**
2. Click en "Nueva Operación"
3. Completar:
   - Producto
   - Proveedor
   - Chofer
   - Placas
   - Tipo de transporte (Camión o Ferroviaria)
4. Guardar → Se crea recepción con boleta generada automáticamente
5. Completar el proceso de pesaje:
   - Peso bruto
   - Peso tara
   - Análisis
   - Descuentos
   - Almacén
6. Guardar y generar boleta PDF

**✅ Verificar:**
- [ ] La recepción se crea con boleta válida (formato: 1XX####)
- [ ] Todos los campos se guardan correctamente
- [ ] El movimiento se crea al completar la recepción
- [ ] La boleta PDF se genera correctamente
- [ ] El código de lote se genera correctamente

---

### **FLUJO 6: Embarque → Directo (Sin Ingreso ni Oficina)**
**Descripción:** Se crea un embarque directamente desde Embarque sin pasar por Ingreso u Oficina.

**Pasos:**
1. Ir a módulo **Embarque**
2. Click en "Nuevo Embarque"
3. Completar:
   - Tipo de embarque: Nacional o Exportación
   - Producto
   - Cliente
   - Destino
   - Chofer
   - Tipo de transporte (Camión o Ferroviaria)
4. Guardar → Se crea embarque con boleta generada automáticamente
5. Completar el proceso de pesaje:
   - Peso tara
   - Peso bruto
   - Análisis informativos
   - Sellos (si aplica)
   - Almacén
6. Guardar y generar boleta PDF

**✅ Verificar:**
- [ ] El embarque se crea con boleta válida (formato: 2XX#### o 3XX####)
- [ ] Todos los campos se guardan correctamente
- [ ] El movimiento se crea al completar el embarque
- [ ] La boleta PDF se genera correctamente
- [ ] El código de lote se genera correctamente

---

## 🔍 Casos Especiales a Probar

### **Caso A: Orden de Reciba desde Oficina → Verificar Recepción**
**Verificar:** Cuando se completa una orden de Reciba desde Oficina:
- La recepción se crea automáticamente en la tabla `recepciones`
- Los datos se sincronizan correctamente

**Prueba:**
1. Crear orden de Reciba en Oficina
2. Completar la orden (generar boleta final)
3. Ir a Reciba y buscar por boleta
4. Verificar que existe automáticamente y tiene todos los datos correctos

---

### **Caso B: Orden de Embarque desde Oficina → Verificar Embarque**
**Verificar:** Cuando se completa una orden de Embarque desde Oficina:
- El embarque se crea automáticamente en la tabla `embarques`
- Los datos se sincronizan correctamente

**Prueba:**
1. Crear orden de Embarque en Oficina
2. Completar la orden (generar boleta final)
3. Ir a Embarque y buscar por boleta
4. Verificar que existe y tiene todos los datos correctos

---

### **Caso C: Múltiples Órdenes del Mismo Tipo en el Mismo Día**
**Verificar:** El consecutivo anual se incrementa correctamente

**Prueba:**
1. Crear múltiples órdenes/recepciones/embarques del mismo tipo
2. Verificar que las boletas tienen consecutivos incrementales
3. Verificar que el formato es correcto (1XX####, 2XX####, 3XX####)

---

### **Caso D: Validaciones de Campos Requeridos**
**Verificar:** Todos los campos requeridos están validados

**Pruebas:**
- [ ] Crear orden sin producto → Debe mostrar error
- [ ] Crear orden Reciba sin proveedor → Debe mostrar error
- [ ] Crear orden Embarque sin cliente → Debe mostrar error
- [ ] Crear recepción sin campos requeridos → Debe mostrar error
- [ ] Crear embarque sin campos requeridos → Debe mostrar error

---

### **Caso E: Edición y Eliminación**
**Verificar:** Las operaciones pueden editarse/eliminarse según permisos

**Pruebas:**
- [ ] Editar orden en Oficina antes de completar
- [ ] Eliminar orden en Oficina (si no tiene recepciones/embarques asociados)
- [ ] Editar recepción antes de completar
- [ ] Eliminar recepción antes de completar
- [ ] Editar embarque antes de completar
- [ ] Eliminar embarque antes de completar
- [ ] Intentar eliminar operación completada → Debe bloquear

---

## 📊 Checklist de Pruebas por Flujo

### Flujo 1: Ingreso → Reciba
- [ ] Ingreso se crea correctamente
- [ ] Recepción se puede crear manualmente
- [ ] Boleta se genera correctamente
- [ ] Movimiento se crea al completar

### Flujo 2: Ingreso → Oficina → Embarque
- [ ] Ingreso se crea correctamente
- [ ] Orden temporal se crea en Oficina
- [ ] Orden se completa correctamente
- [ ] Boleta final se genera
- [ ] Embarque se crea automáticamente
- [ ] Datos se sincronizan
- [ ] Movimiento se crea al completar

### Flujo 3: Oficina → Embarque
- [ ] Orden se crea correctamente
- [ ] Orden se completa correctamente
- [ ] Boleta final se genera
- [ ] Embarque se crea automáticamente
- [ ] Movimiento se crea al completar

### Flujo 4: Oficina → Reciba
- [ ] Orden se crea correctamente
- [ ] Orden se completa correctamente
- [ ] Boleta final se genera
- [ ] Recepción se crea automáticamente
- [ ] Datos se sincronizan correctamente
- [ ] Movimiento se crea al completar

### Flujo 5: Reciba Directo
- [ ] Recepción se crea correctamente
- [ ] Boleta se genera correctamente
- [ ] Proceso de pesaje funciona
- [ ] Movimiento se crea al completar
- [ ] PDF se genera correctamente

### Flujo 6: Embarque Directo
- [ ] Embarque se crea correctamente
- [ ] Boleta se genera correctamente
- [ ] Proceso de pesaje funciona
- [ ] Movimiento se crea al completar
- [ ] PDF se genera correctamente

---

## 🐛 Problemas Potenciales a Verificar

1. **Duplicación de boletas:** Verificar que no se generen boletas duplicadas
2. **Sincronización de datos:** Verificar que los datos se sincronizan entre órdenes, recepciones y embarques
3. **Consecutivos anuales:** Verificar que los consecutivos se reinician correctamente cada año
4. **Movimientos:** Verificar que los movimientos se crean correctamente al completar operaciones
5. **Permisos:** Verificar que los permisos de edición/eliminación funcionan correctamente
6. **Validaciones:** Verificar que todas las validaciones funcionan correctamente

---

## 📝 Notas de Implementación

- Las órdenes temporales tienen boleta con formato `TEMP-YYYYMMDDHHMMSS`
- Las boletas finales tienen formato:
  - Reciba: `1XX####` (1 = Entradas, XX = código producto, #### = consecutivo)
  - Embarque Nacional: `2XX####` (2 = Embarque Nacional)
  - Embarque Exportación: `3XX####` (3 = Exportación)
- Los consecutivos son anuales y se reinician cada año
- Los movimientos se crean automáticamente al completar recepciones/embarques
- Las recepciones/embarques se crean automáticamente desde órdenes completadas en Oficina

---

## ✅ Resultado Esperado

Después de probar todos los flujos, deberías poder:
- Crear operaciones desde cualquier punto de entrada
- Verificar que los datos se sincronizan correctamente
- Generar boletas válidas en todos los casos
- Completar el proceso completo sin errores
- Generar PDFs correctamente
- Crear movimientos automáticamente

