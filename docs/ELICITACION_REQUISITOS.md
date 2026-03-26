# 📋 Elicitación de Requisitos - AgroConecta

## Información del Proyecto

| Campo | Descripción |
|-------|-------------|
| **Proyecto** | AgroConecta - Pitahaya Perú |
| **Cliente** | Productores y compradores de productos agrícolas |
| **Versión** | 1.0 |
| **Fecha** | Febrero 2026 |

---

## Definiciones (IEEE 610.12-1990)

**Requisito Funcional (RF):** Capacidad que debe tener el sistema en términos del comportamiento y la información que administrará. Define la funcionalidad que el sistema debe proporcionar.

**Requisito No Funcional (RNF):** Describe las condiciones bajo las cuales una solución debe permanecer efectiva o las cualidades que debe tener. No se relaciona directamente con la funcionalidad, sino con atributos de calidad.

---

## REQUERIMIENTOS FUNCIONALES (RF)

### Módulo de Autenticación y Usuarios

| # | DETALLE |
|---|---------|
| **RF01** | El sistema debe permitir el registro de nuevos clientes mediante formulario con datos personales (nombre, email, teléfono, contraseña). |
| **RF02** | El sistema debe permitir el inicio de sesión de clientes registrados mediante email y contraseña. |
| **RF03** | El sistema debe validar las credenciales de acceso mediante tokens JWT con expiración configurable. |
| **RF04** | El sistema debe permitir el cierre de sesión invalidando el token actual del usuario. |
| **RF05** | El sistema debe permitir la recuperación de contraseña mediante envío de correo electrónico. |
| **RF06** | El sistema debe gestionar roles de usuario: Cliente y Administrador con permisos diferenciados. |
| **RF07** | El sistema debe permitir al administrador crear, editar y eliminar usuarios del panel de control. |

### Módulo de Catálogo y Productos

| # | DETALLE |
|---|---------|
| **RF08** | El sistema debe mostrar un catálogo de productos organizados por categorías (Fertilizantes, Packs, Esquejes, Frutas). |
| **RF09** | El sistema debe permitir al administrador crear nuevos productos con: nombre, descripción, precio, stock, imagen y categoría. |
| **RF10** | El sistema debe permitir al administrador editar la información de productos existentes. |
| **RF11** | El sistema debe permitir al administrador eliminar productos del catálogo. |
| **RF12** | El sistema debe gestionar el stock de cada producto y actualizarlo automáticamente al realizar ventas. |
| **RF13** | El sistema debe aplicar descuentos por volumen según tablas de precios configurables. |
| **RF14** | El sistema debe mostrar el precio unitario y calcular el total según la cantidad seleccionada. |
| **RF15** | El sistema debe permitir la gestión de unidades de medida (unidades, kilogramos, litros). |
| **RF16** | El sistema debe permitir marcar productos como "Pack" para ventas combinadas. |

### Módulo de Carrito de Compras

| # | DETALLE |
|---|---------|
| **RF17** | El sistema debe permitir agregar productos al carrito de compras con cantidad seleccionada. |
| **RF18** | El sistema debe permitir modificar la cantidad de productos en el carrito. |
| **RF19** | El sistema debe permitir eliminar productos del carrito. |
| **RF20** | El sistema debe mostrar el resumen del carrito con subtotal, descuentos y total. |
| **RF21** | El sistema debe persistir el carrito del usuario entre sesiones si está logueado. |
| **RF22** | El sistema debe validar disponibilidad de stock antes de agregar productos al carrito. |

### Módulo de Checkout y Pagos

| # | DETALLE |
|---|---------|
| **RF23** | El sistema debe requerir inicio de sesión obligatorio para proceder al checkout. |
| **RF24** | El sistema debe solicitar datos de entrega: dirección, departamento, provincia, distrito. |
| **RF25** | El sistema debe permitir seleccionar método de pago: Yape, Plin o Tarjeta. |
| **RF26** | El sistema debe generar un número de pedido único al confirmar la compra. |
| **RF27** | El sistema debe generar boleta/factura en formato PDF exportable e imprimible. |
| **RF28** | El sistema debe enviar confirmación de pedido al correo electrónico del cliente. |
| **RF29** | El sistema debe descontar automáticamente el stock de los productos vendidos. |

### Módulo de Gestión de Pedidos

| # | DETALLE |
|---|---------|
| **RF30** | El sistema debe mostrar lista de pedidos con filtros por estado, fecha y cliente. |
| **RF31** | El sistema debe permitir visualizar el detalle completo de cada pedido. |
| **RF32** | El sistema debe gestionar estados de pedido: Pendiente, En Proceso, Entregado, Cancelado. |
| **RF33** | El sistema debe permitir al administrador cambiar el estado de los pedidos. |
| **RF34** | El sistema debe restaurar el stock automáticamente al cancelar un pedido. |
| **RF35** | El sistema debe registrar el historial de cambios de estado de cada pedido. |

### Módulo de Guías de Remisión

| # | DETALLE |
|---|---------|
| **RF36** | El sistema debe permitir generar guías de remisión para pedidos aprobados. |
| **RF37** | El sistema debe registrar datos de origen: razón social, RUC, dirección del remitente. |
| **RF38** | El sistema debe registrar datos de destino: cliente, dirección de entrega. |
| **RF39** | El sistema debe permitir asignar transportista registrado a la guía de remisión. |
| **RF40** | El sistema debe permitir asignar vehículo (placa, marca) a la guía de remisión. |
| **RF41** | El sistema debe generar la guía de remisión en formato PDF para impresión. |
| **RF42** | El sistema debe registrar fecha de emisión y fecha de traslado. |

### Módulo de Clientes (CRM)

| # | DETALLE |
|---|---------|
| **RF43** | El sistema debe permitir registrar clientes con datos: nombre/razón social, tipo (Natural/Jurídica), DNI/RUC. |
| **RF44** | El sistema debe permitir registrar dirección completa del cliente con departamento, provincia y distrito. |
| **RF45** | El sistema debe permitir editar información de clientes existentes. |
| **RF46** | El sistema debe permitir eliminar clientes que no tengan pedidos asociados. |
| **RF47** | El sistema debe mostrar historial de compras por cada cliente. |

### Módulo de Transportes y Vehículos

| # | DETALLE |
|---|---------|
| **RF48** | El sistema debe permitir registrar transportistas con datos personales y licencia de conducir. |
| **RF49** | El sistema debe permitir registrar vehículos con placa, marca, modelo y capacidad. |
| **RF50** | El sistema debe asociar vehículos a transportistas registrados. |
| **RF51** | El sistema debe permitir editar y eliminar transportistas y vehículos. |

### Módulo de Dashboard y Reportes

| # | DETALLE |
|---|---------|
| **RF52** | El sistema debe mostrar dashboard con KPIs: total ventas, pedidos del día, clientes nuevos. |
| **RF53** | El sistema debe generar gráfico de ventas por período (diario, semanal, mensual). |
| **RF54** | El sistema debe mostrar ranking de productos más vendidos (Top 10). |
| **RF55** | El sistema debe mostrar ranking de mejores clientes por monto de compra. |
| **RF56** | El sistema debe permitir filtrar reportes por rango de fechas. |
| **RF57** | El sistema debe mostrar estadísticas de pedidos por estado. |

### Módulo de Asesorías

| # | DETALLE |
|---|---------|
| **RF58** | El sistema debe permitir a clientes solicitar asesorías agrícolas gratuitas. |
| **RF59** | El sistema debe registrar datos de la solicitud: nombre, email, teléfono, cultivo, mensaje. |
| **RF60** | El sistema debe notificar al administrador cuando se recibe nueva solicitud de asesoría. |

### Módulo de Configuración

| # | DETALLE |
|---|---------|
| **RF61** | El sistema debe permitir gestionar categorías de productos (crear, editar, eliminar). |
| **RF62** | El sistema debe permitir gestionar unidades de medida. |
| **RF63** | El sistema debe permitir configurar datos de la empresa para documentos (RUC, razón social, dirección). |

---

## REQUERIMIENTOS NO FUNCIONALES (RNF)

### Seguridad

| # | DETALLE |
|---|---------|
| **RNF01** | El sistema debe encriptar las contraseñas de usuarios utilizando el algoritmo bcrypt con salt de 10 rounds. |
| **RNF02** | El sistema debe implementar autenticación mediante tokens JWT con expiración de 24 horas. |
| **RNF03** | El sistema debe proteger las rutas del API mediante middleware de validación de tokens. |
| **RNF04** | El sistema debe prevenir ataques de inyección SQL mediante consultas parametrizadas. |
| **RNF05** | El sistema debe implementar CORS para controlar acceso desde dominios autorizados. |
| **RNF06** | El sistema debe validar y sanitizar todos los datos de entrada del usuario. |

### Rendimiento

| # | DETALLE |
|---|---------|
| **RNF07** | El sistema debe cargar las páginas principales en un tiempo máximo de 3 segundos. |
| **RNF08** | Las consultas a la API deben responder en un tiempo máximo de 500 milisegundos. |
| **RNF09** | El sistema debe soportar al menos 100 usuarios concurrentes sin degradación del rendimiento. |
| **RNF10** | Las imágenes de productos deben estar optimizadas para carga rápida (formato WebP o comprimidas). |

### Disponibilidad

| # | DETALLE |
|---|---------|
| **RNF11** | El sistema debe estar disponible el 99% del tiempo (uptime). |
| **RNF12** | El sistema debe contar con mecanismos de reconexión automática a la base de datos. |
| **RNF13** | El sistema debe mostrar mensajes informativos cuando el servicio no esté disponible. |

### Usabilidad

| # | DETALLE |
|---|---------|
| **RNF14** | La interfaz debe ser responsive, adaptándose a dispositivos móviles (320px), tablets (768px) y desktop (1200px+). |
| **RNF15** | El sistema debe mostrar mensajes de error claros y descriptivos al usuario. |
| **RNF16** | La navegación debe permitir acceder a cualquier funcionalidad en máximo 3 clics. |
| **RNF17** | El sistema debe proporcionar feedback visual (loaders, toasts) durante operaciones asíncronas. |
| **RNF18** | Los formularios deben incluir validación en tiempo real antes del envío. |

### Compatibilidad

| # | DETALLE |
|---|---------|
| **RNF19** | El sistema debe ser compatible con los navegadores: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+. |
| **RNF20** | El sistema debe funcionar correctamente en sistemas operativos Windows, macOS y Linux. |
| **RNF21** | La API debe seguir estándares RESTful para facilitar integraciones futuras. |

### Mantenibilidad

| # | DETALLE |
|---|---------|
| **RNF22** | El código debe estar organizado en capas: Routes, Controllers, Models siguiendo patrón MVC. |
| **RNF23** | El código debe incluir comentarios descriptivos en funciones principales. |
| **RNF24** | El proyecto debe utilizar control de versiones Git con repositorio en GitHub. |
| **RNF25** | Las variables de entorno sensibles deben almacenarse en archivo .env no versionado. |

### Escalabilidad

| # | DETALLE |
|---|---------|
| **RNF26** | La base de datos PostgreSQL debe contar con índices optimizados en campos de búsqueda frecuente. |
| **RNF27** | La arquitectura debe ser modular para permitir agregar nuevas funcionalidades sin afectar las existentes. |
| **RNF28** | El sistema debe permitir la integración futura con pasarelas de pago (Culqi, MercadoPago). |

### Integridad de Datos

| # | DETALLE |
|---|---------|
| **RNF29** | El sistema debe implementar transacciones para operaciones críticas (pedidos, stock). |
| **RNF30** | El sistema debe validar integridad referencial mediante foreign keys en la base de datos. |
| **RNF31** | El sistema debe registrar logs de operaciones críticas para auditoría. |

### Recuperación

| # | DETALLE |
|---|---------|
| **RNF32** | El sistema debe permitir realizar backups de la base de datos de forma programada. |
| **RNF33** | El sistema debe contar con scripts de restauración de base de datos documentados. |

### Documentación

| # | DETALLE |
|---|---------|
| **RNF34** | El proyecto debe contar con archivo README.md con instrucciones de instalación y configuración. |
| **RNF35** | La API debe estar documentada con endpoints, métodos y parámetros requeridos. |

---

## Resumen de Requisitos

| Tipo | Cantidad |
|------|----------|
| **Requisitos Funcionales (RF)** | 63 |
| **Requisitos No Funcionales (RNF)** | 35 |
| **Total** | 98 |

---

## Referencias

- IEEE 610.12-1990: IEEE Standard Glossary of Software Engineering Terminology
- IREB - International Requirements Engineering Board: https://www.ireb.org/
- BABOK Guide - Business Analysis Body of Knowledge (IIBA): https://www.iiba.org/

---

*Documento elaborado por: Alberto Carrillo Millones*
*Proyecto Integrador - Desarrollo de Software III*
*Instituto IDAT - 2026*
