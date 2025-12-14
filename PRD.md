Product Requirements Document (PRD)

VISIÓN DEL PRODUCTO
El sistema Aceites y Proteínas es una aplicación web diseñada para digitalizar y controlar los procesos de entrada y salida de mercancía, pesaje, análisis de calidad, lotificación y trazabilidad interna de productos orgánicos. El objetivo principal es integrar Portería, Oficina y Báscula en un flujo triangular que elimine errores, agilice las operaciones y cumpla con normativas de certificación orgánica.

OBJETIVOS DEL PRODUCTO
• Digitalizar y centralizar todo el flujo operativo.
• Evitar errores manuales en tickets, boletas, folios y pesajes.
• Garantizar trazabilidad completa de cada operación.
• Implementar lotificación dinámica y segura.
• Integrar básculas e impresoras mediante APIs expuestas.
• Crear un sistema totalmente web para evitar instalaciones manuales.

Indicadores de éxito:
• Reducción del tiempo de operación.
• Eliminación de inconsistencias en folios y pesajes.
• 100% trazabilidad con lote.
• Sistema accesible desde cualquier equipo definido por la empresa.

ALCANCE
Incluye:
• Módulos de: Ingreso, Oficina, Báscula (Reciba/Embarque), Movimientos, Clientes, Proveedores, Laboratorio, Producción, Reportes, Configuración, Administrador, Control de Calidad.
• Sistema de lotificación anual.
• APIs: lectura de báscula, impresión de tickets, impresión boletas (reciba y embarque).
• Gestión dinámica de productos, análisis y descuentos.
• Sistema RBAC (roles y permisos).
No incluye: Reportes avanzados, módulo completo de calidad (se documentará después), integraciones externas adicionales.

ROLES Y ACCESOS
Portero: Ingreso
Oficina: Oficina, Movimientos, Proveedores, Clientes, Reportes
Báscula: Reciba, Embarque, Movimientos, Proveedores, Reportes, Configuración
Calidad: Control de Calidad
Laboratorio: Laboratorio
Producción: Producción
Administrador: Acceso total

FLUJO OPERATIVO GENERAL
El sistema funciona en triángulo:

PORTERO → OFICINA → BÁSCULA

Portero (Ingreso):
• Registra chofer, placas, cliente/proveedor y tipo de operación.
• Genera movimiento en estatus “Nuevo”.
• Si es Reciba → envía directo a Báscula.
• Si es Embarque Nacional → envía a Oficina.
• Si es Exportación → operación inicia en Oficina.

Oficina (solo Embarques):
• Recibe operaciones desde Ingreso.
• Selecciona cliente, destino y producto.
• Genera vista previa del ticket.
• Al imprimir ticket genera número de boleta.

Estructura de boleta:
• 1 dígito = tipo de operación
• 2 dígitos = producto
• 4 dígitos = consecutivo
Ejemplo: 2030123 → Embarque soya, operación 0123

Báscula (Reciba y Embarque):
Reciba:
• Peso bruto → estatus “Descarga”
• Peso tara
• Peso neto
• Aplicar análisis y descuentos
• Generar boleta
• Estatus final “Cerrado”

Embarque:
• Peso tara → estatus “En carga”
• Peso bruto
• Peso neto
• Analisis informativos (sin descuentos)
• Generar boleta
• Estatus “Cerrado”

El sistema debe soportar 2 básculas: camionera y ferroviaria.

REQUERIMIENTOS FUNCIONALES POR MÓDULO

6.1 Ingreso (Portero)
• Registrar operación.
• Campos: chofer, cliente/proveedor, placas, tipo de operación.
• Guardar y enviar a módulo correspondiente.
• Estatus inicial siempre “Nuevo”.

6.2 Oficina
• Ver operaciones pendientes.
• Crear nueva orden de embarque.
• Seleccionar cliente, destino, producto.
• Vista previa del ticket.
• Generar boleta al imprimir.
• Enviar operación a Báscula.

6.3 Reciba (Báscula)
• Ver lista de operaciones.
• Capturar pesos: bruto, tara.
• Guardar parcial (estatus “Descarga”).
• Aplicar análisis dinámicos según producto.
• Descuentos aplicados solo en Reciba.
• Calcular peso neto real a liquidar.
• Imprimir boleta.
• Cerrar operación.

6.4 Embarque (Báscula)
• Capturar tara, luego bruto.
• Calcular peso neto.
• Registrar análisis informativos.
• Imprimir boleta.
• Estatus “En carga” → “Cerrado”.
• Uso de dos básculas (seleccionables).

6.5 Movimientos
• Lista de entradas y salidas unificada.
• Filtros: fecha, producto, cliente, proveedor, chofer, tipo.
• Opción de exportar Excel.

6.6 Proveedores
• CRUD básico.
• Campos definidos en PDF.
• Validación de duplicados.

6.7 Clientes
• CRUD básico.
• Quitar columna estatus.

6.8 Reportes
• Dejar vacío por ahora.
• Integración futura con: movimientos, pesajes, descuentos, lotes.

6.9 Laboratorio
• Tabla de reportes diarios.
• Botón “añadir nuevo reporte”.
• Campos basados en plantilla proporcionada.
• Posibilidad de adjuntar archivos.
• Vista detallada por reporte.

6.10 Control de Calidad
• De momento vacío.
• Será responsable del sistema de lotificación.

6.11 Configuración
Usuarios:
• Crear, editar, desactivar usuarios.
• Asignar roles.

Almacenes:
• CRUD simple.

Productos (módulo dinámico):
• Crear productos.
• Añadir análisis configurables.
• Definir cuáles generan descuento.
• Configurar rango de descuento y kg/ton descontados.
• Permitir agregar análisis ilimitados.
• Pestañas según categoría (aceites y pastas / semillas y granos).
• Compatible con análisis en PDF compartidos.

APIS EXTERNAS
• API Lectura de báscula (dos básculas).
• API Impresión ticket.
• API Impresión boleta reciba.
• API Impresión boleta embarque.
• Todas expuestas a internet mediante túneles.
• URLs serán proporcionadas posteriormente.

SISTEMA DE LOTIFICACIÓN
Variables:
• Tipo de operación
• Cliente/proveedor
• Producto
• Almacén
• Año
• Consecutivo

Reglas:
• Solo Control de Calidad puede modificar códigos o estructura.
• Si cliente/proveedor no existe → clasificar como “Otros”.
• Se renueva cada año.
• Generación automática al guardar operación.
• El lote debe aparecer en: ticket, boletas, reportes, movimientos, producción.

REQUERIMIENTOS NO FUNCIONALES
• Sistema web moderno.
• Autenticación JWT.
• HTTPS obligatorio.
• Roles estrictos según usuario.
• Logs y auditoría de cambios.
• Respuesta de báscula < 1 segundo.
• Backups diarios automáticos.
• Compatible con navegadores modernos.
• Manejo de dos básculas simultáneas.