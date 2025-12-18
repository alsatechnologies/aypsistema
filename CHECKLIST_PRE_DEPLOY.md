# ✅ CHECKLIST PRE-DEPLOY

**Fecha:** _______________  
**Versión:** _______________  
**Desarrollador:** _______________

## 📋 ANTES DE CADA DEPLOY IMPORTANTE

### 🔴 CRÍTICO - Debe funcionar siempre

#### Módulo Reciba
- [ ] Crear nueva recepción desde Oficina
- [ ] Abrir recepción en módulo Reciba
- [ ] Seleccionar producto y proveedor
- [ ] Capturar peso bruto (botón automático)
- [ ] Capturar peso tara (botón automático)
- [ ] Verificar que peso neto se calcula correctamente
- [ ] Ingresar análisis de calidad (al menos 1 parámetro)
- [ ] Verificar cálculo de descuentos por análisis
- [ ] Pre-guardar datos
- [ ] Guardar boleta → verificar que se genera código de lote
- [ ] Verificar que boleta aparece en historial
- [ ] Generar PDF de boleta
- [ ] Verificar que se crea movimiento de ENTRADA
- [ ] Verificar que el movimiento tiene peso correcto

#### Módulo Embarque
- [ ] Crear nueva orden de embarque desde Oficina
- [ ] Abrir embarque en módulo Embarque
- [ ] Seleccionar producto y cliente
- [ ] Seleccionar almacén de origen
- [ ] Capturar peso tara (botón automático)
- [ ] Capturar peso bruto (botón automático)
- [ ] Verificar que peso neto se calcula correctamente
- [ ] Pre-guardar datos
- [ ] Guardar boleta → verificar que se genera código de lote
- [ ] Verificar que boleta aparece en historial
- [ ] Generar PDF de boleta
- [ ] Verificar que se crea movimiento de SALIDA
- [ ] Verificar que el movimiento tiene peso correcto

#### Módulo Oficina
- [ ] Crear nueva orden (tipo Reciba)
- [ ] Crear nueva orden (tipo Embarque Nacional)
- [ ] Crear nueva orden (tipo Embarque Exportación)
- [ ] Completar orden → verificar que genera boleta
- [ ] Marcar orden "En Proceso" como "Completado"
- [ ] Ver/Imprimir ticket de orden
- [ ] Verificar que órdenes aparecen en historial

#### Módulo Ingreso
- [ ] Registrar nuevo ingreso (Reciba)
- [ ] Registrar nuevo ingreso (Embarque)
- [ ] Registrar nuevo ingreso (Otro motivo)
- [ ] Registrar salida de vehículo
- [ ] Verificar que aparece en historial
- [ ] Verificar filtros de fecha funcionan

#### Datos Maestros
- [ ] Crear nuevo cliente → verificar que aparece en lista
- [ ] Editar cliente existente → verificar cambios guardados
- [ ] Crear nuevo proveedor → verificar que aparece en lista
- [ ] Editar proveedor existente → verificar cambios guardados
- [ ] Crear nuevo producto → verificar que aparece en lista
- [ ] Editar producto existente → verificar cambios guardados
- [ ] Crear nuevo almacén → verificar que aparece en lista

#### Autenticación y Permisos
- [ ] Login con usuario válido funciona
- [ ] Login con usuario inválido muestra error
- [ ] Logout funciona correctamente
- [ ] Usuario con rol "Portero" solo ve módulo Ingreso
- [ ] Usuario con rol "Báscula" ve Reciba y Embarque
- [ ] Usuario con rol "Administrador" ve todos los módulos

#### Filtros y Búsqueda
- [ ] Filtro de fecha funciona en Oficina
- [ ] Filtro de fecha funciona en Reciba
- [ ] Filtro de fecha funciona en Embarque
- [ ] Filtro de fecha funciona en Ingreso
- [ ] Filtro de fecha funciona en Laboratorio
- [ ] Búsqueda por texto funciona en todas las tablas
- [ ] Botón "Limpiar filtros" funciona

#### Código de Lote
- [ ] Código de lote se genera correctamente en Reciba
- [ ] Código de lote se genera correctamente en Embarque
- [ ] Consecutivo incrementa correctamente por combinación
- [ ] Código de lote aparece en título de boleta

### 🟡 IMPORTANTE - Verificar si aplica

#### Integraciones Externas
- [ ] Lectura de báscula funciona (si está disponible)
- [ ] Impresión de ticket funciona (si está disponible)
- [ ] Generación de PDF funciona

#### Paginación
- [ ] Botón "Cargar más" funciona en todas las tablas
- [ ] No se duplican registros al cargar más
- [ ] Se muestra correctamente cuando no hay más datos

---

## 🚨 VERIFICACIONES DE SEGURIDAD

- [ ] No hay datos de prueba en producción
- [ ] Variables de entorno están configuradas correctamente
- [ ] Service Role Key no está expuesta en frontend
- [ ] RLS está activado en todas las tablas
- [ ] Usuarios de prueba fueron eliminados

---

## 📝 NOTAS DEL DEPLOY

**Cambios realizados:**
- 

**Problemas encontrados:**
- 

**Solución aplicada:**
- 

---

## ✅ APROBACIÓN

- [ ] Checklist completado
- [ ] Pruebas exitosas
- [ ] Listo para deploy

**Aprobado por:** _______________  
**Fecha:** _______________

