# 📚 DOCUMENTACIÓN TÉCNICA COMPLETA
## AgroConecta - Pitahaya Perú

---

## 📋 ÍNDICE

1. [Información General](#1-información-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos](#5-base-de-datos)
6. [Modelos (Models)](#6-modelos-models)
7. [Controladores (Controllers)](#7-controladores-controllers)
8. [Rutas API (Routes)](#8-rutas-api-routes)
9. [Endpoints de la API](#9-endpoints-de-la-api)
10. [Autenticación y Seguridad](#10-autenticación-y-seguridad)
11. [Frontend](#11-frontend)
12. [Instalación y Configuración](#12-instalación-y-configuración)

---

## 1. INFORMACIÓN GENERAL

| Campo | Descripción |
|-------|-------------|
| **Nombre** | AgroConecta - Pitahaya Perú |
| **Versión** | 1.0.0 |
| **Tipo** | Sistema Web Full-Stack (E-commerce + Panel Administrativo) |
| **Propósito** | Comercialización de productos agrícolas especializados en Pitahaya |
| **Autor** | Alberto Carrillo Millones |
| **Repositorio** | https://github.com/Alcm1997/Agroconecta |

---

## 2. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE PRESENTACIÓN                          │
│    HTML5 + CSS3 + JavaScript + Bootstrap 5 + Chart.js + SweetAlert2     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE APLICACIÓN                            │
│                     Node.js + Express.js + JWT                          │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   Routes    │ ─▶ │   Controllers   │ ─▶ │        Models           │  │
│  │   (19)      │    │      (17)       │    │         (15)            │  │
│  └─────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ pg (node-postgres)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAPA DE DATOS                                 │
│                          PostgreSQL 14+                                 │
│                        (20+ tablas + ENUMs)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Patrón de Diseño: MVC (Model-View-Controller)
- **Model**: Lógica de acceso a datos y consultas SQL
- **View**: Archivos HTML/CSS/JS en Frontend
- **Controller**: Lógica de negocio y manejo de peticiones

---

## 3. STACK TECNOLÓGICO

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución JavaScript |
| Express.js | 4.x | Framework web para Node.js |
| pg (node-postgres) | 8.x | Cliente PostgreSQL para Node.js |
| jsonwebtoken | 9.x | Generación y validación de tokens JWT |
| bcrypt | 5.x | Encriptación de contraseñas |
| nodemailer | 6.x | Envío de correos electrónicos |
| cors | 2.x | Manejo de Cross-Origin Resource Sharing |
| dotenv | 16.x | Variables de entorno |
| open | 9.x | Apertura automática del navegador |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| HTML5 | - | Estructura de páginas |
| CSS3 | - | Estilos y diseño |
| JavaScript ES6+ | - | Lógica del cliente |
| Bootstrap | 5.3 | Framework CSS responsive |
| Chart.js | 4.x | Gráficos del dashboard |
| SweetAlert2 | 11.x | Alertas y modales |
| DataTables | 1.x | Tablas interactivas |
| Font Awesome | 6.x | Iconografía |

### Base de Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PostgreSQL | 14+ | Sistema de gestión de base de datos relacional |

---

## 4. ESTRUCTURA DEL PROYECTO

```
Agroconecta_90%/
├── 📁 Backend/
│   ├── 📁 Controllers/          # 17 controladores
│   │   ├── asesoriaController.js
│   │   ├── authPanelController.js
│   │   ├── cargoController.js
│   │   ├── carritoController.js
│   │   ├── categoriaController.js
│   │   ├── clientController.js
│   │   ├── departamentoController.js
│   │   ├── distritoController.js
│   │   ├── guiaRemisionController.js
│   │   ├── pedidoController.js
│   │   ├── productoController.js
│   │   ├── recoveryController.js
│   │   ├── reporteController.js
│   │   ├── transporteController.js
│   │   ├── unidadMedidaController.js
│   │   └── userController.js
│   │
│   ├── 📁 Models/               # 15 modelos
│   │   ├── asesoriaModel.js
│   │   ├── cargoModel.js
│   │   ├── carritoModel.js
│   │   ├── categoriaModel.js
│   │   ├── clientModel.js
│   │   ├── departamentoModel.js
│   │   ├── distritoModel.js
│   │   ├── guiaRemisionModel.js
│   │   ├── pedidoModel.js
│   │   ├── productoModel.js
│   │   ├── recoveryModel.js
│   │   ├── reporteModel.js
│   │   ├── transporteModel.js
│   │   ├── unidadMedidaModel.js
│   │   └── userModel.js
│   │
│   ├── 📁 Routes/               # 19 archivos de rutas
│   │   ├── asesoriaRoutes.js
│   │   ├── authPanelRoutes.js
│   │   ├── cargoRoutes.js
│   │   ├── carritoRoutes.js
│   │   ├── categoriaRoutes.js
│   │   ├── clientPanelRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── departamentoRoutes.js
│   │   ├── distritoRoutes.js
│   │   ├── guiaRemisionRoutes.js
│   │   ├── pedidoAdminRoutes.js
│   │   ├── pedidoTiendaRoutes.js
│   │   ├── productoRoutes.js
│   │   ├── productoTiendaRoutes.js
│   │   ├── recoveryRoutes.js
│   │   ├── reporteRoutes.js
│   │   ├── transporteRoutes.js
│   │   ├── unidadMedidaRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── 📁 Middleware/
│   │   └── authMiddleware.js    # Validación de tokens JWT
│   │
│   ├── app.js                   # Punto de entrada del servidor
│   ├── db.js                    # Configuración de conexión PostgreSQL
│   ├── package.json             # Dependencias del proyecto
│   └── .env                     # Variables de entorno (NO versionado)
│
├── 📁 Frontend/
│   ├── 📁 html/                 # 26 archivos HTML
│   │   ├── agroconecta.html     # Página principal/tienda
│   │   ├── loginagroconecta.html
│   │   ├── registroagroconecta.html
│   │   ├── miCuenta.html
│   │   ├── recuperarcontrasenaagroconecta.html
│   │   ├── verificarcodigoagroconecta.html
│   │   └── 📁 panel_control/    # Panel administrativo
│   │       ├── menu.html
│   │       ├── dashboard.html
│   │       └── ... (secciones)
│   │
│   ├── 📁 javascript/           # 25 archivos JS
│   │   ├── 📁 tienda/           # Lógica de tienda
│   │   │   └── agroconecta.js
│   │   ├── 📁 panel_control/    # Lógica del panel
│   │   │   ├── menu.js
│   │   │   └── ... (módulos)
│   │   └── ... (otros)
│   │
│   ├── 📁 icono/                # Favicons
│   └── 📁 imagenes_pitahaya/    # Imágenes de productos
│
├── 📁 docs/                     # Documentación
├── AgroConecta.sql              # Script de base de datos
├── README.md                    # Descripción del proyecto
└── .gitignore                   # Archivos excluidos de Git
```

---

## 5. BASE DE DATOS

### Diagrama de Tablas

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   departamento   │     │     distrito     │     │     cliente      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id_departamento  │◄────│ id_departamento  │     │ id_cliente       │
│ nombre_depto     │     │ id_distrito      │◄────│ id_distrito      │
└──────────────────┘     │ nombre_distrito  │     │ nombres          │
                         └──────────────────┘     │ apellidos        │
                                                  │ razon_social     │
                                                  │ numero_documento │
                                                  │ email            │
                                                  │ telefono         │
┌──────────────────┐     ┌──────────────────┐     │ direccion        │
│      cargo       │     │     usuario      │     │ tipo_cliente     │
├──────────────────┤     ├──────────────────┤     │ contrasena       │
│ id_cargo         │◄────│ id_cargo         │     │ estado           │
│ nombre_cargo     │     │ id_usuario       │     └──────────────────┘
└──────────────────┘     │ nombres          │              │
                         │ apellidos        │              │
                         │ email            │              ▼
                         │ username         │     ┌──────────────────┐
                         │ contraseña       │     │     pedido       │
                         │ estado           │     ├──────────────────┤
                         └──────────────────┘     │ id_pedido        │
                                                  │ id_cliente       │◄──┐
┌──────────────────┐     ┌──────────────────┐     │ fecha_pedido     │   │
│    categoria     │     │    producto      │     │ fecha_entrega    │   │
├──────────────────┤     ├──────────────────┤     │ estado           │   │
│ id_categoria     │◄────│ id_categoria     │     │ id_tipo_pago     │   │
│ descripcion      │     │ id_producto      │     │ total            │   │
└──────────────────┘     │ nombre           │     └──────────────────┘   │
                         │ descripcion      │              │             │
┌──────────────────┐     │ precio_unitario  │              ▼             │
│  unidad_medida   │     │ stock            │     ┌──────────────────┐   │
├──────────────────┤     │ id_unidad        │     │  detalle_pedido  │   │
│ id_unidad        │◄────│ imagen_url       │◄────│ id_pedido        │   │
│ descripcion      │     │ es_pack          │     │ id_producto      │   │
└──────────────────┘     └──────────────────┘     │ cantidad         │   │
                                │                 │ precio_unitario  │   │
                                ▼                 │ opciones         │   │
                         ┌──────────────────┐     └──────────────────┘   │
                         │ descuento_volumen│                            │
                         ├──────────────────┤     ┌──────────────────┐   │
                         │ id_producto      │     │   comprobante    │◄──┘
                         │ cantidad_minima  │     ├──────────────────┤
                         │ cantidad_maxima  │     │ id_comprobante   │
                         │ precio_descuento │     │ id_pedido        │
                         └──────────────────┘     │ tipo_comprobante │
                                                  │ numero_comprobante│
┌──────────────────┐     ┌──────────────────┐     │ fecha_emision    │
│  transportista   │     │     vehiculo     │     │ subtotal, igv    │
├──────────────────┤     ├──────────────────┤     │ total_pago       │
│ id_transportista │◄────│ id_transportista │     └──────────────────┘
│ razon_social     │     │ id_vehiculo      │
│ ruc              │     │ placa            │     ┌──────────────────┐
└──────────────────┘     └──────────────────┘     │  guia_remision   │
        │                        │                ├──────────────────┤
        └────────────────────────┴───────────────►│ id_guia          │
                                                  │ id_pedido        │
┌──────────────────┐                              │ id_transportista │
│ consulta_asesoria│                              │ id_vehiculo      │
├──────────────────┤                              │ fecha_envio      │
│ id_consulta      │                              │ punto_partida    │
│ nombre           │                              │ punto_llegada    │
│ email            │                              └──────────────────┘
│ mensaje          │
│ fecha_consulta   │     ┌──────────────────┐
│ estado           │     │     carrito      │
│ respondido_por   │     ├──────────────────┤
└──────────────────┘     │ id_carrito       │
                         │ id_cliente       │
                         │ id_producto      │
                         │ cantidad         │
                         │ opciones (JSON)  │
                         └──────────────────┘
```

### Tipos ENUM

```sql
-- Estado de pedidos
CREATE TYPE estado_pedido_enum AS ENUM ('Pendiente', 'Entregado', 'Cancelado');

-- Tipo de cliente
CREATE TYPE tipo_cliente_enum AS ENUM ('Natural', 'Jurídica');

-- Tipo de comprobante
CREATE TYPE tipo_comprobante_enum AS ENUM ('Boleta', 'Factura');

-- Estado de cliente
CREATE TYPE estado_cliente_enum AS ENUM ('Activo', 'Inactivo');

-- Estado de usuario
CREATE TYPE estado_usuario_enum AS ENUM ('Activo', 'Inactivo');

-- Estado de comprobante
CREATE TYPE estado_comprobante_enum AS ENUM ('Emitido', 'Anulado');
```

### Tablas Principales (20+)

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `departamento` | Departamentos del Perú | id, nombre |
| `distrito` | Distritos del Perú | id, nombre, id_departamento |
| `cliente` | Clientes registrados | id, nombres, email, tipo_cliente |
| `cargo` | Cargos de usuarios | id, nombre_cargo |
| `usuario` | Usuarios admin del panel | id, username, contraseña, id_cargo |
| `categoria` | Categorías de productos | id, descripcion |
| `unidad_medida` | Unidades (Litro, Unidad, Kg) | id, descripcion |
| `producto` | Catálogo de productos | id, nombre, precio, stock, es_pack |
| `descuento_volumen` | Descuentos por cantidad | id, id_producto, cantidad_min/max, precio |
| `opcion_adicional` | Opciones extra (NDS) | id, nombre, precio_adicional |
| `producto_opcion` | Relación producto-opción | id_producto, id_opcion |
| `pack_componente` | Componentes de packs | id_pack, id_producto, cantidad |
| `carrito` | Carrito de compras | id, id_cliente, id_producto, cantidad |
| `tipo_pago` | Métodos de pago | id, descripcion (Yape, Plin, Tarjeta) |
| `pedido` | Pedidos realizados | id, id_cliente, fecha, estado, total |
| `detalle_pedido` | Detalle de cada pedido | id_pedido, id_producto, cantidad |
| `comprobante` | Boletas/Facturas | id, id_pedido, numero, tipo |
| `detalle_comprobante` | Detalle del comprobante | id_comprobante, id_producto |
| `transportista` | Transportistas registrados | id, razon_social, ruc |
| `vehiculo` | Vehículos de transporte | id, id_transportista, placa |
| `guia_remision` | Guías de remisión | id, id_pedido, id_transportista |
| `consulta_asesoria` | Solicitudes de asesoría | id, nombre, email, mensaje |
| `recuperacion_contrasena` | Códigos de recuperación | id, email, codigo, expiracion |

---

## 6. MODELOS (Models)

### 6.1 clientModel.js (15 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `createClient(data)` | Crear nuevo cliente | Cliente creado |
| `getAllClients()` | Obtener clientes activos | Array de clientes |
| `getClientById(id)` | Obtener cliente por ID | Cliente o null |
| `getClientByEmail(email)` | Obtener cliente por email | Cliente o null |
| `updateClient(id, data)` | Actualizar datos de cliente | Cliente actualizado |
| `deleteClient(id)` | Soft delete (estado=Inactivo) | Boolean |
| `updatePassword(email, hash)` | Actualizar contraseña | void |
| `reactivateClient(id)` | Reactivar cliente inactivo | Cliente |
| `getClientByEmailAnyStatus(email)` | Obtener cliente (cualquier estado) | Cliente |
| `getClientByDocument(doc)` | Buscar por DNI/RUC | Cliente |
| `getClientByDocumentExcluding(doc, id)` | Verificar documento excluyendo ID | Cliente |
| `getAllClientsAnyStatus()` | Todos los clientes sin filtro | Array |
| `obtenerPorId(id)` | Obtener cliente con datos básicos | Cliente |

### 6.2 productoModel.js (19 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `getAllProductos()` | Obtener todos los productos | Array |
| `getProductoById(id)` | Obtener producto con detalles | Producto |
| `createProducto(data)` | Crear nuevo producto | Producto |
| `updateProducto(id, data)` | Actualizar producto | Producto |
| `deleteProducto(id)` | Eliminar producto | Boolean |
| `getDescuentosPorProducto(id)` | Obtener descuentos por volumen | Array |
| `getCategorias()` | Obtener categorías | Array |
| `getUnidadesMedida()` | Obtener unidades | Array |
| `getOpcionesAdicionales()` | Obtener opciones (NDS) | Array |
| `getProductosNopack()` | Productos que no son pack | Array |
| `getDescuentosByProducto(id)` | Descuentos de un producto | Array |
| `replaceDescuentosVolumen(id, desc)` | Reemplazar descuentos | void |
| `getOpcionesDisponibles()` | Opciones del sistema | Array |
| `getOpcionesByProducto(id)` | Opciones de un producto | Array IDs |
| `replaceOpcionesProducto(id, ids)` | Asignar opciones | void |
| `getComponentesPack(id)` | Componentes de un pack | Array |
| `replaceComponentesPack(id, comp)` | Actualizar componentes pack | void |
| `getProductosTienda()` | Productos para tienda online | Array |

### 6.3 pedidoModel.js (12 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `getPrecioConDescuento(client, id, qty)` | Calcular precio con descuento | Precio |
| `getAdicionalOpciones(client, id, opts)` | Sumar adicionales por opciones | Precio |
| `crearPedidoConComprobante(data)` | Crear pedido + comprobante (transacción) | Pedido |
| `obtenerTodosPedidosAdmin(filtros)` | Listar pedidos con filtros | Array paginado |
| `obtenerDetallePedidoAdmin(id)` | Detalle completo de pedido | Pedido + items |
| `actualizarEstadoPedidoAdmin(id, estado)` | Cambiar estado del pedido | Pedido |
| `obtenerEstadisticasGenerales()` | KPIs del dashboard | Estadísticas |
| `obtenerPedidosPorCliente(id)` | Pedidos de un cliente | Array |
| `obtenerDetallePedido(id, id_cliente)` | Detalle para cliente | Pedido |
| `cancelarPedido(id, id_cliente)` | Cancelar pedido pendiente | Boolean |
| `obtenerComprobantePedido(id, id_cliente)` | Comprobante para cliente | Comprobante |

### 6.4 carritoModel.js (6 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `obtenerCarrito(id_cliente)` | Obtener carrito del cliente | Array items |
| `agregarItem(id_cliente, id_prod, qty, opts)` | Agregar producto al carrito | Item |
| `actualizarCantidad(id, id_cliente, qty)` | Actualizar cantidad | Item |
| `eliminarItem(id, id_cliente)` | Eliminar item del carrito | Item |
| `vaciarCarrito(id_cliente)` | Vaciar todo el carrito | Success |
| `sincronizarCarrito(id_cliente, items)` | Sincronizar desde localStorage | Array |

### 6.5 guiaRemisionModel.js (8 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `obtenerTodas()` | Listar todas las guías | Array |
| `obtenerPorId(id)` | Obtener guía por ID | Guía |
| `obtenerPorPedido(id_pedido)` | Obtener guía de un pedido | Guía |
| `existeGuiaPorPedido(id_pedido)` | Verificar si existe guía | Boolean |
| `crear(data)` | Crear nueva guía | Guía |
| `actualizar(id, data)` | Actualizar guía | Guía |
| `eliminar(id)` | Eliminar guía | Guía |
| `obtenerDatosPedidoParaGuia(id_pedido)` | Datos del pedido para guía | Datos |

### 6.6 transporteModel.js (14 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `obtenerTodos()` | Listar transportistas | Array |
| `obtenerPorId(id)` | Obtener transportista | Transportista |
| `crear(data)` | Crear transportista | Transportista |
| `actualizar(id, data)` | Actualizar transportista | Transportista |
| `eliminar(id)` | Eliminar transportista | Transportista |
| `existeRuc(ruc, excludeId)` | Verificar RUC único | Boolean |
| `obtenerVehiculos(id_transportista)` | Listar vehículos | Array |
| `obtenerVehiculoPorId(id)` | Obtener vehículo | Vehículo |
| `crearVehiculo(data)` | Crear vehículo | Vehículo |
| `actualizarVehiculo(id, data)` | Actualizar vehículo | Vehículo |
| `eliminarVehiculo(id)` | Eliminar vehículo | Vehículo |
| `existePlaca(placa, excludeId)` | Verificar placa única | Boolean |

### 6.7 reporteModel.js (7 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `obtenerResumenGeneral()` | KPIs principales | Resumen |
| `obtenerVentasPorMes()` | Ventas últimos 6 meses | Array |
| `obtenerTopProductos()` | Top 5 productos vendidos | Array |
| `obtenerPedidosPorEstado()` | Pedidos agrupados por estado | Array |
| `obtenerTopClientes()` | Top 5 clientes | Array |
| `obtenerVentasPorCategoria()` | Ventas por categoría | Array |
| `obtenerDashboardCompleto()` | Todos los datos del dashboard | Object |

### 6.8 userModel.js (7 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `createUser(data)` | Crear usuario admin | Usuario |
| `getAllUsers()` | Listar usuarios | Array |
| `getUserById(id)` | Obtener usuario | Usuario |
| `updateUser(id, data)` | Actualizar usuario | Usuario |
| `deactivateUser(id)` | Desactivar usuario | Boolean |
| `getUserByUsername(username)` | Buscar por username | Usuario |
| `activateUser(id)` | Reactivar usuario | Usuario |

### 6.9 asesoriaModel.js (5 métodos)

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `crearConsulta(data)` | Crear solicitud de asesoría | Consulta |
| `obtenerConsultas(filtros)` | Listar consultas paginadas | Array |
| `obtenerConsultaPorId(id)` | Obtener consulta | Consulta |
| `marcarComoRespondida(id, id_usuario)` | Marcar respondida | Consulta |
| `cambiarEstado(id, estado)` | Cambiar estado | Consulta |

### 6.10 Otros Modelos

| Modelo | Métodos | Descripción |
|--------|---------|-------------|
| `categoriaModel.js` | 4 | CRUD de categorías |
| `unidadMedidaModel.js` | 4 | CRUD de unidades de medida |
| `cargoModel.js` | 3 | CRUD de cargos |
| `departamentoModel.js` | 3 | Obtener departamentos |
| `distritoModel.js` | 3 | Obtener distritos |
| `recoveryModel.js` | 3 | Códigos de recuperación |

---

## 7. CONTROLADORES (Controllers)

### 7.1 clientController.js

| Función | HTTP | Descripción |
|---------|------|-------------|
| `register` | POST | Registro de nuevo cliente |
| `login` | POST | Inicio de sesión (genera JWT) |
| `getProfile` | GET | Obtener perfil del usuario logueado |
| `updateProfile` | PUT | Actualizar perfil |
| `getAllClients` | GET | [Admin] Listar clientes |
| `getClientById` | GET | [Admin] Obtener cliente |
| `createClient` | POST | [Admin] Crear cliente |
| `updateClient` | PUT | [Admin] Actualizar cliente |
| `deactivateClient` | PATCH | [Admin] Desactivar cliente |
| `reactivateClient` | PATCH | [Admin] Reactivar cliente |

### 7.2 productoController.js

| Función | HTTP | Descripción |
|---------|------|-------------|
| `getAll` | GET | Obtener todos los productos |
| `getById` | GET | Obtener producto por ID |
| `create` | POST | Crear producto nuevo |
| `update` | PUT | Actualizar producto |
| `delete` | DELETE | Eliminar producto |
| `getDescuentos` | GET | Obtener descuentos de producto |
| `replaceDescuentos` | PUT | Actualizar descuentos |
| `getOpciones` | GET | Obtener opciones de producto |
| `replaceOpciones` | PUT | Actualizar opciones |
| `getComponentesPack` | GET | Componentes de un pack |
| `replaceComponentesPack` | PUT | Actualizar componentes |
| `getProductosTienda` | GET | Productos para tienda pública |

### 7.3 pedidoController.js

| Función | HTTP | Descripción |
|---------|------|-------------|
| `crearPedido` | POST | Crear pedido + comprobante |
| `obtenerPedidos` | GET | [Admin] Listar pedidos |
| `obtenerDetallePedido` | GET | [Admin] Detalle de pedido |
| `actualizarEstado` | PATCH | [Admin] Cambiar estado |
| `obtenerEstadisticas` | GET | [Admin] Estadísticas |
| `misPedidos` | GET | [Cliente] Mis pedidos |
| `detalleMiPedido` | GET | [Cliente] Detalle de mi pedido |
| `cancelarMiPedido` | PATCH | [Cliente] Cancelar mi pedido |
| `obtenerMiComprobante` | GET | [Cliente] Mi comprobante |

### 7.4 guiaRemisionController.js

| Función | HTTP | Descripción |
|---------|------|-------------|
| `listar` | GET | Listar todas las guías |
| `obtener` | GET | Obtener guía por ID |
| `crear` | POST | Crear nueva guía |
| `actualizar` | PUT | Actualizar guía |
| `eliminar` | DELETE | Eliminar guía |
| `obtenerDatosPedido` | GET | Datos del pedido para guía |

### 7.5 Otros Controladores

| Controlador | Métodos | Descripción |
|-------------|---------|-------------|
| `authPanelController.js` | 2 | Login admin panel |
| `carritoController.js` | 6 | Gestión del carrito |
| `transporteController.js` | 12 | CRUD transportistas + vehículos |
| `reporteController.js` | 1 | Dashboard completo |
| `asesoriaController.js` | 5 | Gestión de asesorías |
| `userController.js` | 6 | CRUD usuarios admin |
| `categoriaController.js` | 4 | CRUD categorías |
| `unidadMedidaController.js` | 4 | CRUD unidades |
| `departamentoController.js` | 2 | Listar departamentos |
| `distritoController.js` | 2 | Listar distritos |
| `recoveryController.js` | 3 | Recuperación contraseña |

---

## 8. RUTAS API (Routes)

### Estructura de Rutas

```javascript
// Archivo: Backend/app.js

// CLIENTES (público)
app.use('/api/client', clientRoutes);
app.use('/api/recovery', recoveryRoutes);

// UBICACIÓN (público)
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/distritos', distritoRoutes);

// CARRITO (cliente autenticado)
app.use('/api/client/carrito', carritoRoutes);

// TIENDA (público)
app.use('/api/tienda/productos', productoTiendaRoutes);
app.use(pedidoTiendaRoutes);

// ASESORÍA (público)
app.use('/api/contacto/asesoria', asesoriaRoutes);

// PANEL ADMIN (protegido)
app.use('/api/panel/auth', authPanelRoutes);
app.use('/api/panel/users', userRoutes);
app.use('/api/panel/clients', clientPanelRoutes);
app.use('/api/panel/productos', productoRoutes);
app.use('/api/panel/pedidos', pedidoAdminRoutes);
app.use('/api/panel/categorias', categoriaRoutes);
app.use('/api/panel/unidades-medida', unidadMedidaRoutes);
app.use('/api/panel/asesorias', asesoriaRoutes);
app.use('/api/panel/transporte', transporteRoutes);
app.use('/api/panel/guias', guiaRemisionRoutes);
app.use('/api/panel/reportes', reporteRoutes);
app.use('/api/cargo', cargoRoutes);
```

---

## 9. ENDPOINTS DE LA API

### 9.1 Autenticación Cliente

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/client/register` | Registro de cliente | No |
| POST | `/api/client/login` | Login cliente | No |
| GET | `/api/client/profile` | Obtener perfil | JWT |
| PUT | `/api/client/profile` | Actualizar perfil | JWT |

### 9.2 Recuperación de Contraseña

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/recovery/send-code` | Enviar código por email | No |
| POST | `/api/recovery/verify-code` | Verificar código | No |
| POST | `/api/recovery/reset-password` | Cambiar contraseña | No |

### 9.3 Productos (Tienda)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/tienda/productos` | Listar productos tienda | No |

### 9.4 Carrito

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/client/carrito` | Obtener carrito | JWT |
| POST | `/api/client/carrito` | Agregar item | JWT |
| PUT | `/api/client/carrito/:id` | Actualizar cantidad | JWT |
| DELETE | `/api/client/carrito/:id` | Eliminar item | JWT |
| DELETE | `/api/client/carrito` | Vaciar carrito | JWT |
| POST | `/api/client/carrito/sync` | Sincronizar desde local | JWT |

### 9.5 Pedidos (Cliente)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/client/checkout` | Crear pedido | JWT |
| GET | `/api/client/pedidos` | Mis pedidos | JWT |
| GET | `/api/client/pedidos/:id` | Detalle de pedido | JWT |
| PATCH | `/api/client/pedidos/:id/cancelar` | Cancelar pedido | JWT |
| GET | `/api/client/pedidos/:id/comprobante` | Obtener comprobante | JWT |

### 9.6 Panel Admin - Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/panel/auth/login` | Login admin | No |

### 9.7 Panel Admin - Productos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/panel/productos` | Listar productos | JWT Admin |
| GET | `/api/panel/productos/:id` | Obtener producto | JWT Admin |
| POST | `/api/panel/productos` | Crear producto | JWT Admin |
| PUT | `/api/panel/productos/:id` | Actualizar producto | JWT Admin |
| DELETE | `/api/panel/productos/:id` | Eliminar producto | JWT Admin |
| GET | `/api/panel/productos/:id/descuentos` | Descuentos | JWT Admin |
| PUT | `/api/panel/productos/:id/descuentos` | Actualizar descuentos | JWT Admin |
| GET | `/api/panel/productos/:id/opciones` | Opciones | JWT Admin |
| PUT | `/api/panel/productos/:id/opciones` | Actualizar opciones | JWT Admin |
| GET | `/api/panel/productos/:id/componentes` | Componentes pack | JWT Admin |
| PUT | `/api/panel/productos/:id/componentes` | Actualizar componentes | JWT Admin |

### 9.8 Panel Admin - Pedidos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/panel/pedidos` | Listar pedidos | JWT Admin |
| GET | `/api/panel/pedidos/:id` | Detalle pedido | JWT Admin |
| PATCH | `/api/panel/pedidos/:id/estado` | Cambiar estado | JWT Admin |
| GET | `/api/panel/pedidos/estadisticas` | Estadísticas | JWT Admin |

### 9.9 Panel Admin - Guías de Remisión

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/panel/guias` | Listar guías | JWT Admin |
| GET | `/api/panel/guias/:id` | Obtener guía | JWT Admin |
| POST | `/api/panel/guias` | Crear guía | JWT Admin |
| PUT | `/api/panel/guias/:id` | Actualizar guía | JWT Admin |
| DELETE | `/api/panel/guias/:id` | Eliminar guía | JWT Admin |
| GET | `/api/panel/guias/pedido/:id` | Datos pedido para guía | JWT Admin |

### 9.10 Panel Admin - Transporte

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/panel/transporte/transportistas` | Listar transportistas | JWT Admin |
| POST | `/api/panel/transporte/transportistas` | Crear transportista | JWT Admin |
| PUT | `/api/panel/transporte/transportistas/:id` | Actualizar | JWT Admin |
| DELETE | `/api/panel/transporte/transportistas/:id` | Eliminar | JWT Admin |
| GET | `/api/panel/transporte/vehiculos` | Listar vehículos | JWT Admin |
| POST | `/api/panel/transporte/vehiculos` | Crear vehículo | JWT Admin |
| PUT | `/api/panel/transporte/vehiculos/:id` | Actualizar | JWT Admin |
| DELETE | `/api/panel/transporte/vehiculos/:id` | Eliminar | JWT Admin |

### 9.11 Panel Admin - Reportes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/panel/reportes/dashboard` | Dashboard completo | JWT Admin |

### 9.12 Panel Admin - Otros

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET/POST/PUT/DELETE | `/api/panel/users` | CRUD usuarios | JWT Admin |
| GET/POST/PUT/DELETE | `/api/panel/clients` | CRUD clientes | JWT Admin |
| GET/POST/PUT/DELETE | `/api/panel/categorias` | CRUD categorías | JWT Admin |
| GET/POST/PUT/DELETE | `/api/panel/unidades-medida` | CRUD unidades | JWT Admin |
| GET/POST/PATCH | `/api/panel/asesorias` | Gestión asesorías | JWT Admin |

---

## 10. AUTENTICACIÓN Y SEGURIDAD

### 10.1 JWT (JSON Web Token)

```javascript
// Generación de token (Backend/Controllers/clientController.js)
const token = jwt.sign(
  { id: cliente.id_cliente, email: cliente.email, tipo: 'cliente' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### 10.2 Middleware de Autenticación

```javascript
// Backend/Middleware/authMiddleware.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = decoded;
    next();
  });
};
```

### 10.3 Encriptación de Contraseñas

```javascript
// Registro
const hashedPassword = await bcrypt.hash(contrasena, 10);

// Login
const isValid = await bcrypt.compare(password, cliente.contrasena);
```

### 10.4 Configuración CORS

```javascript
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

---

## 11. FRONTEND

### 11.1 Páginas Principales

| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `agroconecta.html` | `/` | Página principal / Tienda |
| `loginagroconecta.html` | `/login` | Inicio de sesión |
| `registroagroconecta.html` | `/registro` | Registro de clientes |
| `miCuenta.html` | `/mi-cuenta` | Panel del cliente |
| `recuperarcontrasenaagroconecta.html` | `/recuperar-contrasena` | Recuperar contraseña |
| `panel_control/menu.html` | `/panel-control` | Panel administrativo |

### 11.2 Panel de Control (Admin)

| Sección | Descripción |
|---------|-------------|
| Dashboard | KPIs y gráficos de ventas |
| Pedidos | Gestión de pedidos |
| Productos | CRUD de productos |
| Clientes | Gestión de clientes |
| Guías | Guías de remisión |
| Transporte | Transportistas y vehículos |
| Reportes | Reportes y estadísticas |
| Asesorías | Solicitudes de asesoría |
| Usuarios | Administradores del panel |
| Configuración | Categorías y unidades |

### 11.3 Scripts JavaScript Principales

| Archivo | Descripción |
|---------|-------------|
| `tienda/agroconecta.js` | Lógica de la tienda online |
| `panel_control/menu.js` | Controlador del panel admin |
| `login.js` | Lógica de autenticación |
| `registro.js` | Registro de clientes |
| `carrito.js` | Gestión del carrito |

---

## 12. INSTALACIÓN Y CONFIGURACIÓN

### 12.1 Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 12.2 Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Alcm1997/Agroconecta.git
cd Agroconecta

# 2. Instalar dependencias
cd Backend
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear base de datos
psql -U postgres
CREATE DATABASE agroconecta;
\q

# 5. Ejecutar script SQL
psql -U postgres -d agroconecta -f AgroConecta.sql

# 6. Iniciar servidor
npm start
```

### 12.3 Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=agroconecta
DB_PORT=5432

# JWT
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura

# Servidor
PORT=3001

# Email (para recuperación de contraseña)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

### 12.4 Scripts NPM

```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  }
}
```

---

## 📊 RESUMEN ESTADÍSTICO

| Componente | Cantidad |
|------------|----------|
| Modelos | 15 |
| Controladores | 17 |
| Rutas | 19 |
| Endpoints API | 70+ |
| Tablas BD | 20+ |
| Páginas HTML | 26 |
| Archivos JS | 25 |
| Métodos totales | 150+ |

---

*Documento generado: Febrero 2026*
*Autor: Alberto Carrillo Millones*
*Proyecto: AgroConecta - Pitahaya Perú*
