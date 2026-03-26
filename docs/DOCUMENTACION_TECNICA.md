# 📋 Documentación Técnica - AgroConecta

## 1. Información General

| Campo | Descripción |
|-------|-------------|
| **Nombre** | AgroConecta - Pitahaya Perú |
| **Versión** | 1.0 |
| **Tipo** | Sistema Web E-commerce + Panel Administrativo |
| **Stack** | Node.js, Express, PostgreSQL, Bootstrap 5 |

---

## 2. Descripción del Sistema

AgroConecta es una plataforma web integral para la comercialización de productos agrícolas, especializada en el cultivo de Pitahaya. Conecta directamente a productores con compradores, eliminando intermediarios.

---

## 3. Requisitos Funcionales

### RF01 - Autenticación de Usuarios
- El sistema debe permitir el registro de clientes con datos personales.
- El sistema debe validar credenciales mediante JWT.
- El sistema debe permitir recuperación de contraseña por email.

### RF02 - Gestión de Productos
- El sistema debe permitir CRUD de productos con categorías.
- El sistema debe gestionar stock por producto.
- El sistema debe aplicar descuentos por volumen automáticamente.

### RF03 - Carrito de Compras
- El sistema debe permitir agregar/eliminar productos del carrito.
- El carrito debe persistir entre sesiones para usuarios logueados.
- El sistema debe calcular totales con descuentos aplicados.

### RF04 - Proceso de Checkout
- El sistema debe validar stock antes de confirmar pedido.
- El sistema debe soportar pagos: Yape, Plin, Tarjeta.
- El sistema debe generar boleta/factura exportable en PDF.

### RF05 - Gestión de Pedidos
- El sistema debe mostrar lista de pedidos con filtros.
- El sistema debe permitir cambiar estados: Pendiente → Entregado → Cancelado.
- El sistema debe restaurar stock al cancelar un pedido.

### RF06 - Guías de Remisión
- El sistema debe generar guías de remisión con datos de transporte.
- El sistema debe asignar transportista y vehículo registrados.
- El sistema debe registrar puntos de origen y destino.

### RF07 - Dashboard de Reportes
- El sistema debe mostrar KPIs: ventas, pedidos, clientes.
- El sistema debe generar gráficos de ventas por período.
- El sistema debe listar top productos y top clientes.

### RF08 - Gestión de Clientes
- El sistema debe permitir CRUD de clientes.
- El sistema debe clasificar clientes: Natural/Jurídica.
- El sistema debe registrar ubicación por departamento/distrito.

### RF09 - Asesorías
- El sistema debe permitir solicitar asesorías gratuitas.
- El sistema debe notificar al administrador nuevas solicitudes.

### RF10 - Gestión de Usuarios Admin
- El sistema debe permitir CRUD de administradores.
- El sistema debe asignar roles y permisos.

---

## 4. Requisitos No Funcionales

### RNF01 - Rendimiento
- El sistema debe cargar páginas en menos de 3 segundos.
- La API debe responder en menos de 500ms.

### RNF02 - Seguridad
- Las contraseñas deben encriptarse con bcrypt.
- Las rutas protegidas deben validar tokens JWT.
- El sistema debe prevenir inyección SQL mediante consultas parametrizadas.

### RNF03 - Usabilidad
- La interfaz debe ser responsive (móvil, tablet, desktop).
- El sistema debe mostrar mensajes de error claros al usuario.
- La navegación debe ser intuitiva con máximo 3 clics.

### RNF04 - Disponibilidad
- El sistema debe estar disponible 99% del tiempo.
- Debe soportar al menos 100 usuarios concurrentes.

### RNF05 - Compatibilidad
- Compatible con Chrome, Firefox, Edge, Safari.
- Responsive en dispositivos de 320px a 1920px.

### RNF06 - Mantenibilidad
- Código organizado en capas: Routes, Controllers, Models.
- Documentación de API disponible.
- Versionado con Git.

### RNF07 - Escalabilidad
- Base de datos PostgreSQL con índices optimizados.
- Arquitectura modular para agregar nuevas funcionalidades.

---

## 5. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  HTML5 + CSS3 + JavaScript + Bootstrap 5 + Chart.js         │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  Node.js + Express.js + JWT Authentication                  │
│  ┌─────────┐  ┌─────────────┐  ┌────────┐                  │
│  │ Routes  │→ │ Controllers │→ │ Models │                  │
│  └─────────┘  └─────────────┘  └────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                           │
│                      PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Tienda** | Catálogo, carrito, checkout |
| **Pedidos** | Gestión de estados y detalles |
| **Guías** | Remisión con transportistas |
| **Clientes** | CRM básico |
| **Productos** | Inventario y categorías |
| **Reportes** | Dashboard con KPIs |
| **Usuarios** | Administradores del panel |
| **Configuración** | Categorías y unidades |

---

## 7. Tecnologías Utilizadas

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5, CSS3, JavaScript ES6+, Bootstrap 5.3 |
| Backend | Node.js 18+, Express.js 4.x |
| Base de Datos | PostgreSQL 14+ |
| Autenticación | JWT (jsonwebtoken) |
| Gráficos | Chart.js |
| Alertas | SweetAlert2 |
| Tablas | DataTables |

---

## 8. Instalación

```bash
# Clonar repositorio
git clone https://github.com/Alcm1997/Agroconecta.git

# Instalar dependencias
cd Backend && npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar base de datos
psql -U postgres -f AgroConecta.sql

# Iniciar servidor
npm start
```

---

## 9. Repositorio

🔗 **GitHub:** https://github.com/Alcm1997/Agroconecta

---

*Documento generado: Enero 2026*
*Autor: Alberto Carrillo Millones*
