-- 1. Crear Base de Datos
CREATE DATABASE agroconecta;
\c agroconecta;

-- ===================================================
-- DEFINICIÓN DE TIPOS (ENUMs) SEGÚN DIAGRAMA
-- ===================================================

CREATE TYPE estado_cliente_enum AS ENUM ('Activo', 'Inactivo');
CREATE TYPE estado_usuario_enum AS ENUM ('Activo', 'Inactivo');
CREATE TYPE estado_pedido_enum AS ENUM ('Pendiente', 'Entregado', 'Cancelado');
CREATE TYPE estado_comprobante_enum AS ENUM ('Emitido', 'Anulado');

-- ===================================================
-- CREACIÓN DE TABLAS MAESTRAS (Sin llaves foráneas previas)
-- ===================================================

-- Tabla: departamento
CREATE TABLE departamento (
    id_departamento SERIAL PRIMARY KEY,
    nombre_departamento VARCHAR(50) NOT NULL
);

-- Tabla: cargo
CREATE TABLE cargo (
    id_cargo SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(50) NOT NULL
);

-- Tabla: tipo_pago
CREATE TABLE tipo_pago (
    id_tipo_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: transportista
CREATE TABLE transportista (
    id_transportista SERIAL PRIMARY KEY,
    razon_social VARCHAR(50),
    ruc CHAR(11)
);

-- Tabla: categoria
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: unidad_medida
CREATE TABLE unidad_medida (
    id_unidad SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: recuperacion_contrasena
CREATE TABLE recuperacion_contrasena (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    expiracion TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Tabla: opcion_adicional
CREATE TABLE opcion_adicional (
    id_opcion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_adicional NUMERIC(10,2) NOT NULL
);

-- ===================================================
-- CREACIÓN DE TABLAS TRANSACCIONALES Y RELACIONALES
-- ===================================================

-- Tabla: distrito (Depende de departamento)
CREATE TABLE distrito (
    id_distrito SERIAL PRIMARY KEY,
    nombre_distrito VARCHAR(100) NOT NULL,
    id_departamento INTEGER REFERENCES departamento(id_departamento)
);

-- Tabla: vehiculo (Depende de transportista)
CREATE TABLE vehiculo (
    id_vehiculo SERIAL PRIMARY KEY,
    id_transportista INTEGER REFERENCES transportista(id_transportista),
    placa VARCHAR(20) NOT NULL
);

-- Tabla: cliente (Depende de distrito)
CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombres VARCHAR(50),
    apellidos VARCHAR(50),
    razon_social VARCHAR(100),
    numero_documento CHAR(11) UNIQUE NOT NULL,
    email VARCHAR(100),
    telefono CHAR(12),
    direccion VARCHAR(150),
    id_distrito INTEGER REFERENCES distrito(id_distrito),
    tipo_cliente VARCHAR(50),
    contrasena VARCHAR(100),
    estado estado_cliente_enum DEFAULT 'Activo' NOT NULL
);

-- Tabla: usuario (Depende de cargo y de sí misma)
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100),
    contraseña VARCHAR(100),
    id_cargo INTEGER REFERENCES cargo(id_cargo),
    username VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_por INTEGER REFERENCES usuario(id_usuario),
    estado estado_usuario_enum DEFAULT 'Activo' NOT NULL
);

-- Tabla: consulta_asesoria (Depende de usuario)
CREATE TABLE consulta_asesoria (
    id_consulta SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(150),
    mensaje TEXT,
    fecha_consulta TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20),
    respondido_por INTEGER REFERENCES usuario(id_usuario),
    fecha_respuesta TIMESTAMP WITHOUT TIME ZONE
);

-- Tabla: producto (Depende de unidad_medida y categoria)
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT,
    precio_unitario NUMERIC(10,2),
    stock INTEGER,
    id_unidad INTEGER REFERENCES unidad_medida(id_unidad),
    id_categoria INTEGER REFERENCES categoria(id_categoria),
    imagen_url VARCHAR(500),
    es_pack BOOLEAN DEFAULT FALSE
);

-- Tabla: producto_opcion (Depende de producto y opcion_adicional)
CREATE TABLE producto_opcion (
    id_producto_opcion SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES producto(id_producto),
    id_opcion INTEGER REFERENCES opcion_adicional(id_opcion)
);

-- Tabla: pack_componente (Depende de producto x2)
CREATE TABLE pack_componente (
    id_componente SERIAL PRIMARY KEY,
    id_pack INTEGER REFERENCES producto(id_producto),
    id_producto INTEGER REFERENCES producto(id_producto),
    cantidad INTEGER NOT NULL
);

-- Tabla: descuento_volumen (Depende de producto)
CREATE TABLE descuento_volumen (
    id_descuento SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES producto(id_producto),
    cantidad_minima INTEGER NOT NULL,
    cantidad_maxima INTEGER,
    precio_descuento NUMERIC(10,2) NOT NULL
);

-- Tabla: carrito (Depende de cliente y producto)
CREATE TABLE carrito (
    id_carrito SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES cliente(id_cliente),
    id_producto INTEGER REFERENCES producto(id_producto),
    cantidad INTEGER NOT NULL,
    opciones JSONB,
    fecha_agregado TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: pedido (Depende de cliente, usuario y tipo_pago)
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente),
    id_usuario INTEGER REFERENCES usuario(id_usuario),
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    estado estado_pedido_enum NOT NULL DEFAULT 'Pendiente',
    id_tipo_pago INTEGER REFERENCES tipo_pago(id_tipo_pago),
    total NUMERIC(10,2) NOT NULL
);

-- Tabla: detalle_pedido (Depende de pedido y producto)
CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedido(id_pedido),
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    opciones JSONB
);

-- Tabla: comprobante (Depende de pedido)
CREATE TABLE comprobante (
    id_comprobante SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedido(id_pedido),
    tipo_comprobante VARCHAR(20) NOT NULL,
    numero_comprobante VARCHAR(25) NOT NULL,
    fecha_emision DATE NOT NULL,
    subtotal NUMERIC(10,2),
    igv NUMERIC(10,2),
    total_pago NUMERIC(10,2),
    estado estado_comprobante_enum DEFAULT 'Emitido' NOT NULL
);

-- Tabla: detalle_comprobante (Depende de comprobante y producto)
CREATE TABLE detalle_comprobante (
    id_detalle SERIAL PRIMARY KEY,
    id_comprobante INTEGER REFERENCES comprobante(id_comprobante),
    id_producto INTEGER REFERENCES producto(id_producto),
    cantidad INTEGER,
    precio_unitario NUMERIC(10,2)
);

-- Tabla: guia_remision (Depende de múltiples tablas)
CREATE TABLE guia_remision (
    id_guia SERIAL PRIMARY KEY,
    id_pedido INTEGER REFERENCES pedido(id_pedido),
    fecha_envio DATE,
    id_transportista INTEGER REFERENCES transportista(id_transportista),
    id_vehiculo INTEGER REFERENCES vehiculo(id_vehiculo),
    punto_partida VARCHAR(150),
    punto_llegada VARCHAR(150),
    id_distrito INTEGER REFERENCES distrito(id_distrito),
    id_departamento INTEGER REFERENCES departamento(id_departamento)
);
