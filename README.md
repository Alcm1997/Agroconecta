# 🌿 AgroConecta - Pitahaya Perú

Sistema integral de comercio electrónico y gestión para la venta de productos agrícolas, especializado en el cultivo de Pitahaya.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=flat&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

---

## 📋 Descripción

AgroConecta es una plataforma web full-stack diseñada para la comercialización de productos agrícolas. Incluye tienda online, panel de administración, gestión de pedidos, generación de guías de remisión y dashboard de reportes.

---

## ✨ Funcionalidades Principales

### 🛒 Tienda Online E-commerce
- Catálogo de productos por categorías (Fertilizantes, Esquejes, Packs, Frutas)
- Carrito de compras persistente
- Sistema de descuentos por volumen
- Checkout con generación de comprobantes

### 📦 Gestión de Pedidos y Logística
- Seguimiento de estados (Pendiente → Entregado → Cancelado)
- Generación de Guías de Remisión
- Gestión de transportistas y vehículos
- Control de puntos de origen/destino

### 📊 Dashboard de Reportes
- KPIs en tiempo real (ventas, pedidos, clientes)
- Gráficos interactivos con Chart.js
- Top productos más vendidos
- Top clientes por volumen de compra

### 👥 Gestión de Clientes
- Registro de clientes (Natural y Jurídica)
- Sistema de asesorías gratuitas
- Segmentación por ubicación geográfica

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js, Express.js |
| **Base de Datos** | PostgreSQL |
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap 5 |
| **Autenticación** | JWT (JSON Web Tokens) |
| **Gráficos** | Chart.js |
| **Alertas** | SweetAlert2 |

---

## 🚀 Instalación

### Prerrequisitos
- Node.js v18+
- PostgreSQL 14+
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/Alcm1997/Agroconecta.git
cd Agroconecta
```

2. **Instalar dependencias del backend**
```bash
cd Backend
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Crear la base de datos**
```bash
# En PostgreSQL, ejecutar el script:
psql -U postgres -f AgroConecta.sql
```

5. **Iniciar el servidor**
```bash
npm start
```

6. **Acceder a la aplicación**
```
http://localhost:3001
```

---

## 📁 Estructura del Proyecto

```
Agroconecta/
├── Backend/
│   ├── Controllers/     # Lógica de negocio
│   ├── Models/          # Consultas a BD
│   ├── Routes/          # Endpoints API
│   ├── Middleware/      # Autenticación JWT
│   └── app.js           # Punto de entrada
├── Frontend/
│   ├── html/            # Páginas HTML
│   ├── javascript/      # Scripts JS
│   ├── css/             # Estilos
│   └── icono/           # Assets
└── AgroConecta.sql      # Script de BD
```

---

## 🔐 Credenciales de Prueba

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | admin | admin123 |

---

## 📸 Screenshots

### Tienda Online
*Catálogo de productos con carrito de compras*

### Panel de Administración
*Dashboard con métricas y gestión de pedidos*

### Reportes
*Gráficos de ventas y KPIs*

---

## 👨‍💻 Autor

**Alberto Carrillo Millones**
- GitHub: [@Alcm1997](https://github.com/Alcm1997)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
