-- Crear la base de datos
CREATE DATABASE AgroConecta;
\c AgroConecta



-- ===================== TABLAS =====================

-- Tabla: DEPARTAMENTO
CREATE TABLE departamento (
    id_departamento SERIAL PRIMARY KEY,
    nombre_departamento VARCHAR(50) NOT NULL
);

-- Tabla: DISTRITO
CREATE TABLE distrito (
    id_distrito SERIAL PRIMARY KEY,
    nombre_distrito VARCHAR(100) NOT NULL,
    id_departamento INT NOT NULL REFERENCES DEPARTAMENTO(id_departamento)
);

-- Tabla: CLIENTE
CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombres VARCHAR(50), -- solo si Natural
    apellidos VARCHAR(50), -- solo si Natural
    razon_social VARCHAR(100), -- solo si Jurídica
    numero_documento CHAR(11) NOT NULL, -- para DNI o RUC
    email VARCHAR(100),
    telefono CHAR(12),
    direccion VARCHAR(150),
    id_distrito INT REFERENCES distrito(id_distrito),
    tipo_cliente tipo_cliente_enum NOT NULL,
    contrasena VARCHAR(100),
    estado estado_cliente_enum DEFAULT 'Activo' NOT NULL
);

-- Tabla: CARGO
CREATE TABLE cargo (
    id_cargo SERIAL PRIMARY KEY,
    nombre_cargo VARCHAR(50) NOT NULL
);

-- Tabla: USUARIO
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100),
    contraseña VARCHAR(100),
    id_cargo INT REFERENCES cargo(id_cargo)
);

-- Tabla: TIPO_PAGO
CREATE TABLE tipo_pago (
    id_tipo_pago SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: PEDIDO
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES CLIENTE(id_cliente),
    id_usuario INT REFERENCES USUARIO(id_usuario),
    fecha_pedido DATE NOT NULL,
    fecha_entrega DATE,
    estado estado_pedido_enum NOT NULL DEFAULT 'Pendiente',
    id_tipo_pago INT REFERENCES tipo_pago(id_tipo_pago),
    total DECIMAL(10,2) NOT NULL
);

-- Tabla: CATEGORIA
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: UNIDAD_MEDIDA
CREATE TABLE unidad_medida (
    id_unidad SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL
);

-- Tabla: PRODUCTO
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT,
    precio_unitario DECIMAL(10,2),
    stock INT,
    id_unidad INT REFERENCES unidad_medida(id_unidad),
    id_categoria INT REFERENCES categoria(id_categoria),
    imagen_url VARCHAR(500)
);

-- Tabla: COMPROBANTE
CREATE TABLE comprobante (
    id_comprobante SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES PEDIDO(id_pedido),
    tipo_comprobante tipo_comprobante_enum NOT NULL,
    numero_comprobante VARCHAR(25) NOT NULL,
    fecha_emision DATE NOT NULL,
    subtotal DECIMAL(10,2),
    igv DECIMAL(10,2),
    total_pago DECIMAL(10,2)
);

-- Tabla: DETALLE_COMPROBANTE
CREATE TABLE detalle_comprobante (
    id_comprobante INT REFERENCES COMPROBANTE(id_comprobante),
    id_producto INT REFERENCES PRODUCTO(id_producto),
    cantidad INT,
    precio_unitario DECIMAL(10,2),
    PRIMARY KEY (id_comprobante, id_producto)
);

-- Tabla: TRANSPORTISTA
CREATE TABLE transportista (
    id_transportista SERIAL PRIMARY KEY,
    razon_social VARCHAR(50),
    ruc CHAR(11)
);

-- Tabla: VEHICULO
CREATE TABLE vehiculo (
    id_vehiculo SERIAL PRIMARY KEY,
    id_transportista INT REFERENCES TRANSPORTISTA(id_transportista),
    placa VARCHAR(20) NOT NULL
);

-- Tabla: GUIA_REMISION
CREATE TABLE guia_remision (
    id_guia SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedido(id_pedido),
    fecha_envio DATE,
    id_transportista INT REFERENCES transportista(id_transportista),
    id_vehiculo INT REFERENCES vehiculo(id_vehiculo),
    punto_partida VARCHAR(150),
    punto_llegada VARCHAR(150),
    id_distrito INT REFERENCES distrito(id_distrito),
    id_departamento INT REFERENCES departamento(id_departamento)
);

-- Tabla: RECUPERACION_CONTRASENA
CREATE TABLE recuperacion_contrasena (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL,
    expiracion TIMESTAMP NOT NULL
);

-- ===================== ENUMs =====================

-- Tipo de estado del pedido
CREATE TYPE estado_pedido_enum AS ENUM ('Pendiente', 'Entregado', 'Cancelado');

-- Tipo de cliente
CREATE TYPE tipo_cliente_enum AS ENUM ('Natural', 'Jurídica');

-- Tipo de comprobante
CREATE TYPE tipo_comprobante_enum AS ENUM ('Boleta', 'Factura');

-- Agregar enum para estado del cliente
CREATE TYPE estado_cliente_enum AS ENUM ('Activo', 'Inactivo');

-- Agregar columna estado a la tabla cliente
ALTER TABLE cliente 
ADD COLUMN estado estado_cliente_enum DEFAULT 'Activo' NOT NULL;

-- Actualizar todos los clientes existentes a 'Activo'
UPDATE cliente SET estado = 'Activo' WHERE estado IS NULL;

-- Insertar cargo Administrador si no existe
INSERT INTO cargo (nombre_cargo) VALUES ('Administrador')

-- Modificar la tabla usuario
ALTER TABLE usuario
ADD COLUMN username VARCHAR(50) UNIQUE NOT NULL,
ADD COLUMN estado estado_usuario_enum DEFAULT 'Activo' NOT NULL,
ADD COLUMN fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN creado_por INT REFERENCES usuario(id_usuario);

-- Insertar primer usuario administrador
INSERT INTO usuario (
    nombres,
    apellidos,
    email,
    contraseña,
    username,
    id_cargo,
    estado,
    fecha_registro,
    creado_por
) VALUES (
    'Administrador',
    'Sistema',
    'admin@pitahayaperu.com',
    '$2b$10$8K1p5UqX8E.kS5LxK5Yx8uO8nQ2pVe8sN9rYc.1mOuUvPn7J3K4Cy', -- admin123
    'admin',
    (SELECT id_cargo FROM cargo WHERE nombre_cargo = 'Administrador'),
    'Activo',
    CURRENT_TIMESTAMP,
    NULL
);

-- 1. Eliminar la columna estado de usuario (esto eliminará el dato, haz backup si lo necesitas)
ALTER TABLE usuario DROP COLUMN estado;

-- 2. Eliminar el tipo enum anterior
DROP TYPE estado_usuario_enum;

-- 3. Crear el nuevo tipo enum solo con 'Activo' e 'Inactivo'
CREATE TYPE estado_usuario_enum AS ENUM ('Activo', 'Inactivo');

-- 4. Volver a agregar la columna estado a usuario
ALTER TABLE usuario
ADD COLUMN estado estado_usuario_enum DEFAULT 'Activo' NOT NULL;

-- Actualizar la contraseña del usuario admin
UPDATE usuario
SET contraseña = '$2b$10$3w3JA9J2DfF/2D8aXdc36eDhwgm4DO5XjqaLJ95fIv9EJ9.LV4zDK'
WHERE username = 'admin';

-- Agregar constraint UNIQUE al número de documento en la tabla cliente
ALTER TABLE cliente ADD CONSTRAINT unique_numero_documento UNIQUE (numero_documento);

-- Estado de comprobante
CREATE TYPE estado_comprobante_enum AS ENUM ('Emitido', 'Anulado');

ALTER TABLE comprobante ADD COLUMN estado estado_comprobante_enum DEFAULT 'Emitido' NOT NULL;

-- Insertar categorías
INSERT INTO categoria (descripcion) VALUES 
('Fertilizantes líquidos'),
('Estimulantes de crecimiento'),
('Mejoradores de suelo'),
('Esquejes de pitahaya'),
('Fungicidas'),
('Jabones agrícolas'),
('Packs especiales')

-- Insertar unidades de medida
INSERT INTO unidad_medida (descripcion) VALUES 
('Litro'),
('Unidad')

-- Insertar productos fertilizantes (precio base por litro)
INSERT INTO producto (nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url) VALUES 
('INKAFISH', 'Estimula crecimiento de raíces y mejora absorción de nutrientes', 29.00, 50, 1, 2, 'https://drive.google.com/file/d/1wyeBADlR4qd0jNcf5ZKZGJbCI6zF-MdV/view?usp=sharing'),
('INKACUAJE', 'Favorece formación de flores y mejora calidad de frutos', 50.00, 40, 1, 2, 'https://drive.google.com/file/d/1N6DiRLHaWV-gNOTfnS_mF66AGEuz2hth/view?usp=sharing'),
('INKACITO', 'Estimula floración abundante y retrasa envejecimiento de plantas', 75.00, 35, 1, 2, 'https://drive.google.com/file/d/18K9Nq0FtHDgjjrssgIxYf55sB1QoonJr/view?usp=sharing'),
('MICROOINKA', 'Mejora fertilidad del suelo y controla plagas y enfermedades', 45.00, 30, 1, 1, 'https://drive.google.com/file/d/1pjS3CGygSWFR6IdQhTp3EjDjIhdv9F7V/view?usp=sharing'),
('INKACOBRE', 'Controla enfermedades y aporta cobre esencial', 85.00, 25, 1, 5, 'https://drive.google.com/file/d/1Zue390B2DslmPhfxhW9HkHFc7qmAvFi2/view?usp=sharing'),
('MELAZAGRO', 'Fuente de energía microbiana, mejora descomposición orgánica', 15.00, 20, 1, 3, 'https://drive.google.com/file/d/1Zue390B2DslmPhfxhW9HkHFc7qmAvFi2/view?usp=sharing'),
('JABÓN INKA', 'Elimina plagas sin dañar insectos benéficos, biodegradable y no tóxico', 25.00, 40, 1, 6, 'https://drive.google.com/file/d/1MmVfI-Fp81DeY6njKU0fXngKwj11mN80/view?usp=sharing');

-- Insertar esquejes de pitahaya (precio por unidad)
INSERT INTO producto (nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url) VALUES 
('COSTARICENSIS', 'Esquejes de pitahaya variedad Costaricensis', 4.00, 200, 2, 4, '/img/costaricensis.jpg'),
('GOLDEN ISRAEL', 'Esquejes de pitahaya variedad Golden Israel', 6.00, 150, 2, 4, '/img/golden_israel.jpg'),
('AMERICAN BEAUTY', 'Esquejes de pitahaya variedad American Beauty', 3.00, 180, 2, 4, '/img/american_beauty.jpg'),
('VIETNAM WHITE', 'Esquejes de pitahaya variedad Vietnam White', 4.00, 170, 2, 4, '/img/vietnam_white.jpg');

-- Crear tabla para rangos de descuento por volumen
CREATE TABLE descuento_volumen (
    id_descuento SERIAL PRIMARY KEY,
    id_producto INT NOT NULL REFERENCES producto(id_producto),
    cantidad_minima INT NOT NULL,
    cantidad_maxima INT,
    precio_descuento DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Insertar descuentos por volumen para INKAFISH
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(1, 1, 4, 29.00),     -- 1-4 litros: S/ 29.00 por litro
(1, 5, 19, 22.00),   -- 5-19 litros: S/ 22.00 por litro
(1, 20, NULL, 14.75); -- 20+ litros: S/ 14.75 por litro

-- Insertar descuentos por volumen para INKACUAJE
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(2, 1, 11, 50.00),   -- 1-11 litros: S/ 50.00 por litro
(2, 12, NULL, 40.00); -- 12+ litros: S/ 40.00 por litro

-- Insertar descuentos por volumen para INKACITO
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(3, 1, 11, 75.00),   -- 1-11 litros: S/ 75.00 por litro
(3, 12, NULL, 50.00); -- 12+ litros: S/ 50.00 por litro

-- Insertar descuentos por volumen para MICROOINKA
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(4, 1, 11, 45.00),   -- 1-11 litros: S/ 45.00 por litro
(4, 12, NULL, 25.00); -- 12+ litros: S/ 25.00 por litro

-- Insertar descuentos por volumen para INKACOBRE
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(5, 1, 11, 85.00),   -- 1-11 litros: S/ 85.00 por litro
(5, 12, NULL, 55.00); -- 12+ litros: S/ 55.00 por litro

-- Insertar descuentos por volumen para JABÓN INKA
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(7, 1, 11, 25.00),   -- 1-11 litros: S/ 25.00 por litro
(7, 12, NULL, 22.00); -- 12+ litros: S/ 22.00 por litro

-- Insertar descuentos por volumen para esquejes COSTARICENSIS
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(8, 20, 99, 4.00),    -- 20-99 unidades: S/ 4.00 por unidad
(8, 100, 999, 3.40),  -- 100-999 unidades: S/ 3.40 por unidad
(8, 1000, NULL, 2.90); -- 1000+ unidades: S/ 2.90 por unidad

-- Insertar descuentos por volumen para esquejes GOLDEN ISRAEL
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(9, 20, 99, 6.00),    -- 20-99 unidades: S/ 6.00 por unidad
(9, 100, 999, 5.00),  -- 100-999 unidades: S/ 5.00 por unidad
(9, 1000, NULL, 4.00); -- 1000+ unidades: S/ 4.00 por unidad

-- Insertar descuentos por volumen para esquejes AMERICAN BEAUTY
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(10, 20, 99, 3.00),   -- 20-99 unidades: S/ 3.00 por unidad
(10, 100, 999, 2.00), -- 100-999 unidades: S/ 2.00 por unidad
(10, 1000, NULL, 1.50); -- 1000+ unidades: S/ 1.50 por unidad

-- Insertar descuentos por volumen para esquejes VIETNAM WHITE
INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento) VALUES
(11, 20, 99, 4.00),   -- 20-99 unidades: S/ 4.00 por unidad
(11, 100, 999, 3.40), -- 100-999 unidades: S/ 3.40 por unidad
(11, 1000, NULL, 3.00); -- 1000+ unidades: S/ 3.00 por unidad

-- Crear tabla para opciones adicionales (como NDS para esquejes)
CREATE TABLE opcion_adicional (
    id_opcion SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_adicional DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Insertar opción NDS para esquejes
INSERT INTO opcion_adicional (nombre, descripcion, precio_adicional) VALUES
('NDS', 'Nutrientes y desarrollo superior para esquejes', 1.00);

-- Crear tabla de relación entre productos y opciones adicionales
CREATE TABLE producto_opcion (
    id_producto_opcion SERIAL PRIMARY KEY,
    id_producto INT NOT NULL REFERENCES producto(id_producto),
    id_opcion INT NOT NULL REFERENCES opcion_adicional(id_opcion),
    activo BOOLEAN DEFAULT TRUE
);

-- Asignar opción NDS a todos los esquejes
INSERT INTO producto_opcion (id_producto, id_opcion) VALUES
(8, 1),  -- COSTARICENSIS con NDS
(9, 1),  -- GOLDEN ISRAEL con NDS
(10, 1), -- AMERICAN BEAUTY con NDS
(11, 1); -- VIETNAM WHITE con NDS

-- Crear tabla para los componentes del pack
CREATE TABLE pack_componente (
    id_componente SERIAL PRIMARY KEY,
    id_pack INT NOT NULL REFERENCES producto(id_producto),
    id_producto INT NOT NULL REFERENCES producto(id_producto),
    cantidad INT NOT NULL
);

-- Insertar el PACK como producto principal
INSERT INTO producto (nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url) VALUES 
('PACK CUAJADO DE CACAO', 'Pack especial para cuajado de cacao', 130.00, 30, 1, 
 (SELECT id_categoria FROM categoria WHERE descripcion = 'Packs especiales'), 
 'https://drive.google.com/file/d/1xv_E_tNoM-z7fXiNBxFwc8oubyCqW8BW/view?usp=drive_link');

-- Insertar componentes del pack (relacionar con productos existentes)
INSERT INTO pack_componente (id_pack, id_producto, cantidad) VALUES
(
    (SELECT id_producto FROM producto WHERE nombre = 'PACK CUAJADO DE CACAO'),
    (SELECT id_producto FROM producto WHERE nombre = 'INKACITO'),
    1
),
(
    (SELECT id_producto FROM producto WHERE nombre = 'PACK CUAJADO DE CACAO'),
    (SELECT id_producto FROM producto WHERE nombre = 'INKACUAJE'),
    1
),
(
    (SELECT id_producto FROM producto WHERE nombre = 'PACK CUAJADO DE CACAO'),
    (SELECT id_producto FROM producto WHERE nombre = 'INKAFISH'),
    1
);

-- Eliminar columnas 'activo' de las tablas
ALTER TABLE descuento_volumen DROP COLUMN IF EXISTS activo;
ALTER TABLE opcion_adicional DROP COLUMN IF EXISTS activo;
ALTER TABLE producto_opcion DROP COLUMN IF EXISTS activo;

-- Agregar columna para identificar productos pack
ALTER TABLE producto ADD COLUMN es_pack BOOLEAN DEFAULT FALSE;

-- Cambiar la unidad de medida del pack a "Unidad" (id_unidad = 2)
UPDATE producto 
SET id_unidad = 2 
WHERE nombre = 'PACK CUAJADO DE CAFÉ';

-- Cambiar la unidad de medida del pack a "Unidad" (id_unidad = 2)
UPDATE producto 
SET id_unidad = 2, es_pack = true 
WHERE nombre = 'PACK CUAJADO DE CACAO';

-- Cambiar el precio
UPDATE producto 
SET precio_unitario = 130
WHERE nombre = 'PACK CUAJADO DE CACAO';

-- Actualizar las imágenes de los esquejes con nuevas URLs
UPDATE producto SET imagen_url = 'https://drive.google.com/file/d/1FkY8IYfHoriCWWtgACATSTZAm3MAy-I9/view?usp=sharing' WHERE nombre = 'COSTARICENSIS';
UPDATE producto SET imagen_url = 'https://drive.google.com/file/d/1CUSMMz_6R1_Ypxnvkffy1fJJn2XLfySv/view?usp=sharing' WHERE nombre = 'GOLDEN ISRAEL';
UPDATE producto SET imagen_url = 'https://drive.google.com/file/d/1ynY_WB3RrLf5ZTt5tvMelg-3RYUtU6Jv/view?usp=sharing' WHERE nombre = 'AMERICAN BEAUTY';
UPDATE producto SET imagen_url = 'https://drive.google.com/file/d/19EpGm_jxsoAxSZqE_k2JxqA2wxeYv0EO/view?usp=sharing' WHERE nombre = 'VIETNAM WHITE';


-- Actualizar imágenes de productos fertilizantes
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/530612124_1848559082675196_60531329653347358_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=9f807c&_nc_ohc=u0SpScyDUGAQ7kNvwFltk1I&_nc_oc=AdlKWiNbP8u8B9cZarpXTVVwC7oOq7pVw2_-1ZXY58f_w6_vjGHhbuWyIevJEiduCo4&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AF4ey6AnC4LmPialvH8d1o3oYE7NO-kAuUTcQKLPvd61A&oe=68CCF189' WHERE nombre = 'INKAFISH';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/534889442_2299544657182099_2425458357630717051_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=WaDxcpx4p4QQ7kNvwGHw--L&_nc_oc=AdnAuPt695BFpdzYJvQRrf4t6nIIsSB8JhILQUbyd_2znNrUaMtKJ0Lg1JGbzIi0_io&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AHhOHG8NUrlyE6jOdoH5jNpHl_OiXkzN7h8VCekyRzWpQ&oe=68CCF942' WHERE nombre = 'INKACUAJE';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/534924937_1948197412388760_7352575868906464974_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=9f807c&_nc_ohc=RPB0LVSTsDYQ7kNvwEB267e&_nc_oc=AdnwzHeJn_f_hImlAGk-EmVWZSPpkFVS0X9ifPPQfXk6U9NYr0kVvj8n3A2qEK2i2GU&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AELHQYQIzHLdYeXMw84xDQXb-UplIn2texT_7IjohHinQ&oe=68CD18A6' WHERE nombre = 'INKACITO';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/534948723_743099095237704_6274428443165612102_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=9f807c&_nc_ohc=TcBA08oXle0Q7kNvwHSyyIY&_nc_oc=Adl1vxrUZNPF1MHhzLeQ3nTTb8pWOVWk9JDhoQ1V6v5QIjcg6DhLZ4A4HJKqjNWuDzs&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AGZxwccO_60RR3RWGE7KyHtK1k9Y2q0V2ePDJ6imXcOYA&oe=68CD2287' WHERE nombre = 'MICROOINKA';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/532871353_1710816472946044_8810097374855948758_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=9f807c&_nc_ohc=p2zaVYw-PMIQ7kNvwGo6hO_&_nc_oc=AdlRhIObb7gUByywg6odkIY2dBqG_2_QCzLzMg2FNA_atdrTckybbXOEBfSbL0l5-Ag&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AFYdACrIarV11NTHZFrqH91mt9e2hlnhCjvSLz8ceAVpg&oe=68CCF023' WHERE nombre = 'INKACOBRE';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/534921063_660744050396915_1354988029320602604_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=9f807c&_nc_ohc=MVRagVJQ_swQ7kNvwEsF-JB&_nc_oc=AdlEYDhD0wmydE_YXUNy25JEC1_codlcGPB0I9Z-B9lxN3m5fo2kWE3y4pvoqqkiE2M&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AESTCgxhSw2QhQrlMZ5MpSxiTzSp4YZL1CCTyHopDHs1g&oe=68CD09D0' WHERE nombre = 'MELAZAGRO';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/530482725_1100889681519009_5099290409577094944_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=9f807c&_nc_ohc=IQ5xTQTiAhUQ7kNvwGe7tEC&_nc_oc=Adn2ljssIFt2-kh_8uTX2mma4va18okFaKZIHjDhJQJaoilA9GFTKRy8dtKhiTt2hxM&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AF6H-0aS7U_IyDbTz5FdehfpQw6GPiZBEzRw-nHGoWivQ&oe=68CCEDC7' WHERE nombre = 'JABÓN INKA';

-- Actualizar imágenes de esquejes de pitahaya
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/530635946_1033785968834916_4739591754470402342_n.jpg?stp=dst-jpg_s2048x2048_tt6&_nc_cat=111&ccb=1-7&_nc_sid=9f807c&_nc_ohc=HxA4FoY3gN8Q7kNvwF28jFK&_nc_oc=Adl60Lr2S8s1vcBrqNkApAbl4DTA6B1N5K0walZtajkL2dWmdEXuNkP8LKI2ByZEjOs&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AGb0Kww0izQhIQJN8air2YuwhbyJ6st7W1zFSWywBQyVQ&oe=68CD0F84' WHERE nombre = 'COSTARICENSIS';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/536808370_647971231163496_6721308443326438954_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=9f807c&_nc_ohc=pFNBngmwCuAQ7kNvwFtd0EI&_nc_oc=AdnuGLwjZLp-K-sDWdS1X4ByKCsIFw8wrtBoXqp-IEnR0j9ESZtTdnas0eRH2y6RJ6A&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AEbgpsEfa2CYH-GLvke4NCsWE9eTwXqRGIhwxNbhcXJoQ&oe=68CD1E74' WHERE nombre = 'GOLDEN ISRAEL';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/523898228_1402661677491196_7099413279885131994_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=9f807c&_nc_ohc=kHRDIp3pLuAQ7kNvwHJsVte&_nc_oc=AdnLT5oGcS16UjjODDMa3WtrgtdlJTdWOwUuoGqxQV_bkJxtQPR_EO-mZgtt5swsM0A&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AHwoejNwrZrvo8MoJdSU5cOiLfK9qEf0O3GbYVOJF0nFg&oe=68CCFED5' WHERE nombre = 'AMERICAN BEAUTY';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/535473008_1098614141797546_4349812384889175802_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=9f807c&_nc_ohc=079exUtaJeYQ7kNvwEdmaWO&_nc_oc=AdkFaFQ3cKbQIj2a4JbFe_rRKUHftgCawnZjcMoD4fOZ1CkhG9DZcJibn-j0HBMz4Q0&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AGlg0Wyr3D0XDjxMWaBrwNR0RcwMXg2lJ79cu9tPytGkg&oe=68CD06FD' WHERE nombre = 'VIETNAM WHITE';

-- Actualizar imagen del pack
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/537168408_793333259786958_1939642810357343142_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=_T7T3Vn7Wy8Q7kNvwHwhrMu&_nc_oc=Adl9xgPgXhgBpgL851njBs9YGnrajo0J64LLMw_wklCwOjcL6hmGw-wxAJgIQDqCf8A&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AFcI5eXKT-mK6W6wIaoXc3tol9lg-r0iw5GDuWsYFtLYQ&oe=68CD1BCC' WHERE nombre = 'PACK CUAJADO DE CACAO';
UPDATE producto SET imagen_url = 'https://scontent-lim1-1.xx.fbcdn.net/v/t1.15752-9/532609197_1278029399974436_6986856001616317195_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=9f807c&_nc_ohc=XlrJ9xVB-RAQ7kNvwHFrMt4&_nc_oc=AdmXITJ2fQJYSWu2E4USqmbRNHZI95oUI-hIP1jeK61gqiIIYo1Z6GWiVrtEepFvrmA&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&oh=03_Q7cD3AH8vQzUz3jAD6wDGL_cEqALx9_Ah81OTKA6Mz1NM3eEXA&oe=68CD173A' WHERE nombre = 'PACK CUAJADO DE CAFÉ';

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle SERIAL PRIMARY KEY,
  id_pedido INT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_producto INT NOT NULL REFERENCES producto(id_producto),
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  opciones JSONB DEFAULT '[]'::jsonb
);

-- 0.2) Ajuste de detalle_comprobante para permitir múltiples líneas por producto (diferentes precios/opciones)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='detalle_comprobante' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE detalle_comprobante DROP CONSTRAINT IF EXISTS detalle_comprobante_pkey;
  END IF;
END $$;

ALTER TABLE detalle_comprobante
  ADD COLUMN IF NOT EXISTS id_detalle SERIAL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='detalle_comprobante' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE detalle_comprobante ADD CONSTRAINT detalle_comprobante_pkey PRIMARY KEY (id_detalle);
  END IF;
END $$;

-- 0.3) Numeración concurrente y segura
CREATE SEQUENCE IF NOT EXISTS sec_boleta START 1;
CREATE SEQUENCE IF NOT EXISTS sec_factura START 1;

-- Helpers de numeración (opcional)
CREATE OR REPLACE FUNCTION next_boleta() RETURNS TEXT AS $$
  SELECT 'BO000-' || LPAD(nextval('sec_boleta')::TEXT, 3, '0');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION next_factura() RETURNS TEXT AS $$
  SELECT 'FA000-' || LPAD(nextval('sec_factura')::TEXT, 3, '0');
$$ LANGUAGE sql;

insert into tipo_pago (descripcion) values
('Tarjeta Debito'),
('Yape'),
('Plin')