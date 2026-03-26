# 📖 Requerimientos e Historias de Usuario (HU)
## AgroConecta - Pitahaya Perú

En AgroConecta, hemos transformado los requisitos en **Historias de Usuario** para el enfoque ágil del proyecto, manteniendo siempre el foco en el valor que recibe cada actor de nuestro ecosistema (Clientes y Administradores). Cada historia incluye **Criterios de Aceptación** técnicos para garantizar que el desarrollo cumpla con los estándares de calidad definidos.

---

## 1. REQUERIMIENTOS FUNCIONALES COMO HISTORIAS DE USUARIO

### Módulo: Autenticación y Cuentas

#### HU-01: Registro de Cliente
**Como** cliente no registrado,
**Quiero** registrarme en la plataforma ingresando mis datos (Natural o Jurídica),
**Para que** pueda crear mi cuenta y realizar compras de productos.

* **Criterios de Aceptación:**
  - El sistema debe validar que el email o el documento (DNI/RUC) no estén registrados previamente.
  - La contraseña debe encriptarse utilizando el algoritmo `bcrypt`.
  - El sistema debe asignar por defecto el estado "Activo" al nuevo usuario en PostgreSQL.

#### HU-02: Autenticación Segura (Login)
**Como** usuario del sistema (Cliente o Administrador),
**Quiero** iniciar sesión con mi correo electrónico y contraseña,
**Para que** pueda acceder a mi panel correspondiente y a mis funcionalidades privadas.

* **Criterios de Aceptación:**
  - El login debe generar un token `JWT` (JSON Web Token) válido por 24 horas.
  - Si el usuario está "Inactivo", el sistema debe denegar el acceso mostrando un mensaje de error.

### Módulo: Tienda y Carrito

#### HU-03: Visualización de Catálogo Dinámico
**Como** cliente,
**Quiero** ver un catálogo de productos organizados por categorías (Fertilizantes, Esquejes, Packs, Frutas),
**Para que** pueda encontrar y evaluar rápidamente los productos que necesito.

* **Criterios de Aceptación:**
  - Los productos sin stock deben mostrar un indicador visual de "Agotado" o deshabilitar el botón de compra.
  - Las imágenes deben cargarse dinámicamente y contar con un *fallback* (imagen por defecto) en caso de error de red.

#### HU-04: Gestión de Carrito de Compras
**Como** cliente autenticado,
**Quiero** agregar productos al carrito, modificar cantidades y ver los descuentos aplicados,
**Para que** pueda revisar el detalle y el costo total antes de pagar.

* **Criterios de Aceptación:**
  - El sistema debe persistir los ítems del carrito en la base de datos (tabla `carrito`).
  - Al hacer login, el carrito local (`localStorage`) debe sincronizarse con el carrito almacenado en la base de datos.
  - El sistema debe calcular y mostrar dinámicamente el "Precio con descuento" si la cantidad del producto alcanza los rangos configurados en la tabla `descuento_volumen`.

### Módulo: Checkout y Compras

#### HU-05: Checkout y Métodos de Pago
**Como** cliente con productos en el carrito,
**Quiero** finalizar mi compra eligiendo mi método de pago (Yape, Plin o Tarjeta),
**Para que** pueda concretar la adquisición de mis productos agrícolas.

* **Criterios de Aceptación:**
  - El sistema debe realizar una validación de stock en tiempo real justo antes de procesar el pago.
  - Si el pago es exitoso, se debe generar el pedido y su respectivo comprobante (Boleta/Factura) usando una **transacción SQL** (Rollback en caso de fallo).

#### HU-06: Generación de Comprobantes PDF
**Como** cliente,
**Quiero** poder descargar o imprimir en PDF el comprobante de pago de mi compra,
**Para que** pueda tener un respaldo legal y contable de la transacción.

* **Criterios de Aceptación:**
  - El sistema debe mostrar el PDF generado mapeando los datos de la tabla `comprobante` y `detalle_comprobante`.
  - Debe incluir de manera calculada el Subtotal, IGV y Total pagado.

### Módulo: Panel de Administración e Inventario

#### HU-07: Gestión de Productos (CRUD)
**Como** administrador del sistema,
**Quiero** gestionar el catálogo de productos (crear, editar, eliminar, actualizar stock),
**Para que** la oferta de la tienda esté siempre actualizada para los clientes.

* **Criterios de Aceptación:**
  - Los formularios web deben validar los campos requeridos y tipos de datos antes del envío al backend.
  - No se permite la eliminación física (DELETE) de un producto si tiene historial de pedidos, aplicando controles de integridad referencial.

#### HU-08: Gestión de Pedidos y Guías de Remisión
**Como** administrador logístico,
**Quiero** revisar los pedidos pendientes, aprobarlos y generar sus Guías de Remisión asignando un transportista,
**Para que** el equipo de almacén pueda proceder con el despacho (picking) y el transporte.

* **Criterios de Aceptación:**
  - Al crear una Guía de Remisión, el sistema debe requerir la selección de un transportista y un vehículo previamente registrados.
  - Al cancelar un pedido, el controlador debe ejecutar un trigger o función que retorne el stock descontado nuevamente al inventario del producto.

#### HU-09: Dashboard y Analítica
**Como** gerente / administrador,
**Quiero** visualizar un panel de reportes con gráficos de ventas, top productos y KPIs,
**Para que** pueda tomar decisiones estratégicas sobre el negocio.

* **Criterios de Aceptación:**
  - La interfaz gráfica debe utilizar `Chart.js` para renderizar datos de la API REST.
  - El backend debe consolidar las métricas ejecutando consultas agrupadas en PostgreSQL para asegurar velocidad de respuesta.

---

## 2. REQUERIMIENTOS NO FUNCIONALES (RNF)

Los RNF definen las cualidades, restricciones y condiciones estructurales bajo las cuales la solución técnica de AgroConecta permanecerá efectiva.

| Código | Categoría | Descripción Técnica |
|--------|-----------|---------------------|
| **RNF-01** | **Seguridad** | Todas las contraseñas deben estar hasheadas con `bcrypt`. La API del backend debe proteger endpoints sensibles validando tokens `JWT` mediante middlewares, bloqueando peticiones no autorizadas (HTTP 401). |
| **RNF-02** | **Seguridad / Datos** | El sistema debe utilizar *Prepared Statements* o consultas parametrizadas a través de `node-postgres (pg)` para prevenir ataques de inyección SQL (SQLi). |
| **RNF-03** | **Rendimiento** | La velocidad de respuesta del API REST no debe exceder los 500 ms bajo carga normal de usuarios concurrentes. Las operaciones de lectura crítica deben estar respaldadas por índices en PostgreSQL. |
| **RNF-04** | **Usabilidad** | La interfaz de usuario del frontend debe ser estrictamente *Responsive Design* (adaptable a móviles, tablets y PCs), construida sobre la grilla y componentes de `Bootstrap 5`. |
| **RNF-05** | **Consistencia (Integridad)** | Todos los procesos de pago y generación de órdenes deben manejar el patrón de transacciones de base de datos (`BEGIN`, `COMMIT`, `ROLLBACK`) para garantizar atomicidad e integridad (ACID). |
| **RNF-06** | **Mantenibilidad** | El código fuente del servidor debe escribirse en Node.js, estrictamente organizado siguiendo el patrón arquitectónico MVC (Modelos, Vistas/Frontend, Controladores) separando lógica en directorios independientes. |

---
*Documento creado bajo el formato de gestión ágil.*
*Autor: Alberto Carrillo Millones*
