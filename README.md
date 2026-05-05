# 🌿 AgroConecta - Pitahaya Perú

Sistema integral de gestión empresarial (ERP) y comercio electrónico (SPA) especializado en la comercialización y logística de productos agrícolas.

![SPA Architecture](https://img.shields.io/badge/Architecture-SPA-FF69B4?style=flat-square)
![ERP System](https://img.shields.io/badge/System-Admin_ERP-blue?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat&logo=jsonwebtokens)

---

## 📋 Descripción del Sistema

AgroConecta no es solo una tienda en línea; es un ecosistema digital completo que integra la experiencia de compra del cliente final con las operaciones críticas de negocio de **Pitahaya Perú**. 

El sistema está dividido en dos portales independientes pero sincronizados:
1.  **Portal del Cliente:** Una aplicación de página única (SPA) rápida y segura.
2.  **Panel de Control Administrativo:** Una herramienta de gestión interna para control de ventas, inventario y logística.

---

## ✨ Módulos Principales

### 🛒 Portal del Cliente (B2C Experience)
*   **Navegación SPA:** Router personalizado en JavaScript Vanilla para transiciones instantáneas sin recargas.
*   **Seguridad Avanzada:** Flujo de autenticación con JWT, medidor de fortaleza de contraseñas en tiempo real y recuperación vía email.
*   **E-commerce dinámico:** Catálogo categorizado, carrito de compras sincronizado y proceso de checkout fluido.
*   **Centro de Asesoría:** Módulo de consultas técnicas directas para soporte en el cultivo de pitahaya.

### 🖥️ Panel Administrativo (ERP Operations)
*   **Dashboard de Inteligencia:** Gráficos estadísticos e interactivos (Chart.js) para monitoreo de ventas y KPIs.
*   **Gestión Logística:** Módulo completo de Guías de Remisión, control de transportistas y unidades de medida.
*   **Control de Inventario:** Gestión avanzada de productos (CRUD) con carga de medios y categorías.
*   **Gestión de Ventas:** Seguimiento detallado de pedidos, estados de entrega y facturación.
*   **Trazabilidad:** Sistema de respuesta a asesorías con registro del administrador responsable.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js & Express.js |
| **Base de Datos** | PostgreSQL (Relacional) |
| **Frontend Tienda** | Vanilla JavaScript (SPA), HTML5, CSS3 |
| **Diseño** | Bootstrap 5, Google Fonts, Font Awesome |
| **Autenticación** | JWT (JSON Web Tokens) & Bcrypt |
| **Comunicación** | Nodemailer (SMTP Service) |
| **Visualización** | Chart.js & SweetAlert2 |

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18 o superior.
- PostgreSQL 14 o superior.

### Pasos para ejecución local

1.  **Clonar el repositorio**
    ```bash
    git clone https://github.com/Alcm1997/Agroconecta.git
    cd Agroconecta
    ```

2.  **Configurar el Backend**
    ```bash
    cd Backend
    npm install
    cp .env.example .env # Configura tus credenciales de BD y Gmail
    ```

3.  **Preparar la Base de Datos**
    *   Crear una base de datos en PostgreSQL llamada `agroconecta`.
    *   Ejecutar el script SQL incluido:
    ```bash
    psql -U tu_usuario -d agroconecta -f AgroConecta.sql
    ```

4.  **Iniciar el Sistema**
    ```bash
    npm start
    ```
    *   Tienda: `http://localhost:3001/`
    *   Admin: `http://localhost:3001/login-panel`

---

## 👨‍💻 Autor

**Alberto Carrillo Millones**
- **GitHub:** [@Alcm1997](https://github.com/Alcm1997)
- **Proyecto:** AgroConecta - Pitahaya Perú

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - Consulta el archivo [LICENSE](LICENSE) para más detalles.
