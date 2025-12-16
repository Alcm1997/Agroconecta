class PanelControl {
    constructor() {
        this.currentSection = 'dashboard';
        this.adminData = null;
    }

    async init() {
        await this.verificarAutenticacion();
        this.setupEventListeners();
        this.loadSection('menu'); // Sección inicial
    }

    async verificarAutenticacion() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/html/panel_control/login-panel.html';
                return;
            }

            const response = await fetch('/api/panel/auth/verify-admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                window.location.href = '/html/panel_control/login-panel.html';
                return;
            }

            this.adminData = await response.json();
            this.updateUserInfo();
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/html/panel_control/login-panel.html';
        }
    }

    updateUserInfo() {
        if (this.adminData) {
            const adminNameEl = document.getElementById('adminName');
            const userAvatarEl = document.getElementById('userAvatar');
            const fullName = `${this.adminData.nombres} ${this.adminData.apellidos}`;
            if (adminNameEl) adminNameEl.textContent = fullName;
            if (userAvatarEl) userAvatarEl.textContent = this.adminData.nombres.charAt(0).toUpperCase();
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.loadSection(section);
            });
        });

        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('show');
            });
        }

        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebarToggle');
            if (window.innerWidth <= 768 &&
                sidebar &&
                toggle &&
                !sidebar.contains(e.target) &&
                !toggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });
    }

    async loadSection(sectionName) {
        if (this.currentSection === sectionName) {
            // Evita recarga redundante
            return;
        }

        this.showLoading();
        this.updateActiveNav(sectionName);
        this.updatePageTitle(sectionName);

        try {
            let content;
            switch (sectionName) {
                case 'menu':
                    content = await this.loadDashboard();
                    break;
                case 'productos':
                    await this.loadProductos();
                    return;
                case 'productos_registrar':
                    content = await this.loadRegistrarProducto();
                    break;
                case 'clientes':
                    await this.loadClientes(); // No retorna content, maneja el render internamente
                    return; // Salir aquí
                case 'pedidos':
                    content = await this.loadPedidos();
                    break;
                case 'reportes':
                    await this.loadReportes(); // No retorna content
                    return; // Salir aquí
                case 'usuarios':
                    await this.loadUsuarios(); // No retorna content
                    return; // Salir aquí
                case 'usuarios_registrar':
                    content = await this.loadRegistrarUsuario();
                    break;
                case 'configuracion':
                    await this.loadConfiguracion(); // No retorna content
                    return; // Salir aquí
                case 'asesorias':
                    await this.loadAsesorias(); // No retorna content
                    return;
                case 'transporte':
                    await this.loadTransporte(); // No retorna content
                    return;
                case 'dashboard':
                    content = await this.loadDashboard();
                    break;
                default:
                    content = '<div class="alert alert-warning">Sección no encontrada</div>';
            }

            // Solo renderizar si hay content
            if (content) {
                this.renderContent(content);
            }
            this.currentSection = sectionName;
        } catch (error) {
            console.error('Error cargando sección:', error);
            this.renderContent(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error cargando la sección. Intenta nuevamente.
                </div>
            `);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const l = document.getElementById('loading');
        const d = document.getElementById('dynamicContent');
        if (l) l.style.display = 'block';
        if (d) d.style.display = 'none';
    }

    hideLoading() {
        const l = document.getElementById('loading');
        const d = document.getElementById('dynamicContent');
        if (l) l.style.display = 'none';
        if (d) d.style.display = 'block';
    }

    updateActiveNav(sectionName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const target = document.querySelector(`[data-section="${sectionName}"]`);
        if (target) target.classList.add('active');
    }

    updatePageTitle(sectionName) {
        const titles = {
            menu: 'Panel de Control - Bienvenido',
            configuracion: 'Configuración del Sistema',
            categorias: 'Gestión de Categorías',
            'unidades-medida': 'Gestión de Unidades de Medida',
            clientes: 'Gestión de Clientes',
            productos: 'Gestión de Productos',
            pedidos: 'Gestión de Pedidos',
            reportes: 'Reportes y Analytics',
            usuarios: 'Gestión de Usuarios',
            asesorias: 'Consultas de Asesoría',
            transporte: 'Gestión de Transporte'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = titles[sectionName] || sectionName;
    }

    renderContent(content) {
        console.log('🔄 renderContent ejecutado');
        const container = document.getElementById('dynamicContent');
        if (container && content !== undefined && content !== null) {
            container.innerHTML = content;
        }
        // Re-inyectar scripts embebidos si los hubiera
        if (container) {
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) newScript.src = oldScript.src;
                newScript.textContent = oldScript.textContent;
                document.head.appendChild(newScript);
                oldScript.remove();
            });
        }
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar')?.classList.remove('show');
        }
    }

    // Dashboard
    async loadDashboard() {
        const adminName = this.adminData ? `${this.adminData.nombres} ${this.adminData.apellidos}` : 'Administrador';
        return `
            <div class="welcome-container">
                <div class="welcome-card">
                    <div class="welcome-header">
                        <div class="welcome-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h1>¡Bienvenido al Panel de Control!</h1>
                        <p class="welcome-subtitle">Hola <strong>${adminName}</strong>, tienes acceso completo al sistema de administración.</p>
                    </div>
                    <div class="welcome-content">
                        <div class="row">
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('usuarios')">
                                    <div class="feature-icon bg-primary">
                                        <i class="fas fa-user-shield"></i>
                                    </div>
                                    <h5>Gestión de Usuarios</h5>
                                    <p>Administra los usuarios del sistema, crea, edita y gestiona permisos.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('productos')">
                                    <div class="feature-icon bg-success">
                                        <i class="fas fa-box"></i>
                                    </div>
                                    <h5>Productos</h5>
                                    <p>Gestiona el catálogo de productos, precios e inventario.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('clientes')">
                                    <div class="feature-icon bg-info">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <h5>Clientes</h5>
                                    <p>Administra la base de datos de clientes.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('pedidos')">
                                    <div class="feature-icon bg-warning">
                                        <i class="fas fa-shopping-cart"></i>
                                    </div>
                                    <h5>Pedidos</h5>
                                    <p>Revisa y gestiona pedidos.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('reportes')">
                                    <div class="feature-icon bg-purple">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <h5>Reportes</h5>
                                    <p>Visualiza estadísticas del sistema.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                            <div class="col-md-4 mb-4">
                                <div class="feature-card" onclick="panelControl.loadSection('configuracion')">
                                    <div class="feature-icon bg-secondary">
                                        <i class="fas fa-cog"></i>
                                    </div>
                                    <h5>Configuración</h5>
                                    <p>Ajusta valores generales.</p>
                                    <span class="feature-arrow"><i class="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="welcome-footer">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-box">
                                    <i class="fas fa-clock text-primary"></i>
                                    <div>
                                        <strong>Último acceso:</strong><br>
                                        <span id="currentDateTime"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-box">
                                    <i class="fas fa-shield-check text-success"></i>
                                    <div>
                                        <strong>Estado del sistema:</strong><br>
                                        <span class="text-success">Operativo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .welcome-container{max-width:1200px;margin:0 auto;}
                .welcome-card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:3rem;text-align:center;}
                .welcome-header{margin-bottom:3rem;}
                .welcome-icon{width:80px;height:80px;background:linear-gradient(135deg,#2E7D32,#66BB6A);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem;color:#fff;}
                .welcome-header h1{color:#2E7D32;font-weight:700;margin-bottom:1rem;font-size:2.5rem;}
                .welcome-subtitle{color:#6c757d;font-size:1.1rem;margin:0;}
                .feature-card{background:#f8f9fa;border-radius:12px;padding:2rem 1.5rem;height:100%;border:2px solid transparent;transition:.3s;cursor:pointer;position:relative;overflow:hidden;}
                .feature-card:hover{transform:translateY(-4px);border-color:#2E7D32;box-shadow:0 8px 24px rgba(46,125,50,.15);}
                .feature-icon{width:60px;height:60px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;font-size:1.5rem;color:#fff;}
                .bg-purple{background:linear-gradient(135deg,#9C27B0,#E91E63)!important;}
                .feature-card h5{color:#2E7D32;font-weight:600;margin-bottom:.75rem;}
                .feature-card p{color:#6c757d;font-size:.9rem;line-height:1.5;margin-bottom:1rem;}
                .feature-arrow{position:absolute;bottom:1rem;right:1rem;color:#2E7D32;opacity:0;transition:.3s;}
                .feature-card:hover .feature-arrow{opacity:1;}
                .welcome-footer{margin-top:3rem;padding-top:2rem;border-top:1px solid #e9ecef;}
                .info-box{display:flex;align-items:center;gap:1rem;padding:1rem;background:#f8f9fa;border-radius:8px;text-align:left;}
                .info-box i{font-size:1.5rem;flex-shrink:0;}
                @media (max-width:768px){
                    .welcome-card{padding:2rem 1rem;}
                    .welcome-header h1{font-size:2rem;}
                    .feature-card{margin-bottom:1rem;}
                }
            </style>
            <script>
                const now=new Date();
                const options={year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'};
                document.getElementById('currentDateTime').textContent=now.toLocaleDateString('es-ES',options);
            </script>
        `;
    }



    // Productos
    async loadProductos() {
        this.updatePageTitle('productos');
        const html = await fetch('/html/panel_control/producto/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'productos'; // ← AGREGAR ESTA LÍNEA
        await import('/javascript/panel_control/producto/listar.js?cache=' + Date.now());
        if (window.initProductosListado) window.initProductosListado();
    }

    // Cargar formulario de registro de producto
    async loadRegistrarProducto() {
        try {
            const resp = await fetch('/html/panel_control/producto/registrar.html');
            if (!resp.ok) {
                return `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error cargando formulario de registro</div>`;
            }
            const html = await resp.text();
            this.currentSection = 'productos_registrar';
            setTimeout(() => {
                if (typeof window.initRegistrarProducto === 'function') {
                    window.initRegistrarProducto();
                } else {
                    console.warn('initRegistrarProducto no definida');
                }
            }, 120);
            return html;
        } catch (err) {
            console.error('Error loadRegistrarProducto:', err);
            return `<div class="alert alert-danger">Error de conexión al cargar registro</div>`;
        }
    }

    // Módulos pendientes (devuelven contenido)
    async loadPedidos() {
        // Verificar si es detalle de pedido
        const hash = window.location.hash;
        const detalleMatch = hash.match(/\/pedidos\/(\d+)/);

        if (detalleMatch) {
            // Cargar vista de detalle
            this.updatePageTitle('pedidos');
            const html = await fetch('/html/panel_control/pedido/detalle.html').then(r => r.text());
            this.renderContent(html);
            this.currentSection = 'pedidos_detalle';
            await import('/javascript/panel_control/pedido/detalle.js?cache=' + Date.now());
            return;
        }

        // Cargar vista de lista
        this.updatePageTitle('pedidos');
        const html = await fetch('/html/panel_control/pedido/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'pedidos';
        await import('/javascript/panel_control/pedido/listar.js?cache=' + Date.now());
    }

    // ✅ CARGAR REPORTES
    async loadReportes() {
        this.updatePageTitle('reportes');
        const html = await fetch('/html/panel_control/reportes/dashboard.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'reportes';
    }

    // Cargar Configuración (no retorna content)
    async loadConfiguracion() {
        this.updatePageTitle('configuracion');
        const html = await fetch('/html/panel_control/configuracion/configuracion.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'configuracion';
    }

    // Cargar subsecciones de configuración
    async loadConfigSubSection(subSection) {
        this.showLoading();

        try {
            let html, initFunction;

            switch (subSection) {
                case 'categorias':
                    this.updatePageTitle('categorias');
                    html = await fetch('/html/panel_control/categoria/listar.html').then(r => r.text());
                    this.renderContent(html);
                    this.currentSection = 'categorias';
                    await import('/javascript/panel_control/categoria/listar.js?cache=' + Date.now());
                    initFunction = window.initCategoriasListado;
                    break;

                case 'unidades-medida':
                    this.updatePageTitle('unidades-medida');
                    html = await fetch('/html/panel_control/unidad_medida/listar.html').then(r => r.text());
                    this.renderContent(html);
                    this.currentSection = 'unidades-medida';
                    await import('/javascript/panel_control/unidad_medida/listar.js?cache=' + Date.now());
                    initFunction = window.initUnidadesListado;
                    break;

                default:
                    this.renderContent('<div class="alert alert-warning">Subsección no encontrada</div>');
                    return;
            }

            if (initFunction) initFunction();

        } catch (error) {
            console.error('Error cargando subsección:', error);
            this.renderContent('<div class="alert alert-danger">Error cargando la subsección</div>');
        } finally {
            this.hideLoading();
        }
    }

    // Cargar Usuarios (no retorna content)
    async loadUsuarios() {
        try {
            this.updatePageTitle('usuarios');
            const response = await fetch('/html/panel_control/usuario/listar.html');
            if (response.ok) {
                const html = await response.text();
                this.renderContent(html);
                this.currentSection = 'usuarios';
                if (typeof window.initUsuariosListado === 'function') {
                    setTimeout(window.initUsuariosListado, 50);
                    console.log('✅ initUsuariosListado ejecutado desde menu.js');
                } else {
                    console.warn('⚠️ window.initUsuariosListado no está disponible');
                }
            } else {
                this.renderContent(`
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error cargando la sección de usuarios.
                    </div>
                `);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            this.renderContent(`
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error de conexión al cargar usuarios.
                </div>
            `);
        }
    }

    // FORMULARIO REGISTRAR USUARIO (retorna content)
    async loadRegistrarUsuario() {
        try {
            const resp = await fetch('/html/panel_control/usuario/registrar.html');
            if (!resp.ok) {
                return `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>Error cargando formulario de registro</div>`;
            }
            const html = await resp.text();
            // Marcar sección distinta
            this.currentSection = 'usuarios_registrar';
            // Devolvemos el HTML para que loadSection lo inyecte vía renderContent
            setTimeout(() => {
                if (typeof window.initRegistrarUsuario === 'function') {
                    window.initRegistrarUsuario();
                } else {
                    console.warn('initRegistrarUsuario no definida');
                }
            }, 120);
            return html;
        } catch (err) {
            console.error('Error loadRegistrarUsuario:', err);
            return `<div class="alert alert-danger">Error de conexión al cargar registro</div>`;
        }
    }

    // CARGAR CLIENTES (no retorna content)
    async loadClientes() {
        this.updatePageTitle('clientes');
        const html = await fetch('/html/panel_control/cliente/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'clientes';
        await import('/javascript/panel_control/cliente/listar.js?cache=' + Date.now());
        if (window.initClientesListado) window.initClientesListado();
    }

    // FORMULARIO ACTUALIZAR USUARIO (no retorna content)
    async loadActualizarUsuario(userId) {
        console.log('🔄 Cargando formulario de actualización para usuario:', userId);
        const loadingDiv = document.getElementById('loading');
        const contentDiv = document.getElementById('dynamicContent');
        if (loadingDiv) loadingDiv.style.display = 'block';

        try {
            const response = await fetch('/html/panel_control/usuario/actualizar.html');
            if (response.ok) {
                const html = await response.text();
                if (contentDiv) contentDiv.innerHTML = html;
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.textContent = 'Actualizar Usuario';

                // Marcar sección distinta para permitir volver a 'usuarios'
                this.currentSection = 'usuarios_editar';

                if (typeof window.initActualizarUsuario === 'function') {
                    setTimeout(() => window.initActualizarUsuario(userId), 150);
                } else {
                    console.error('Función initActualizarUsuario no encontrada');
                }
            } else {
                if (contentDiv) {
                    contentDiv.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Error cargando el formulario de actualización.
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error cargando actualizar usuario:', error);
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error de conexión al cargar el formulario.
                    </div>
                `;
            }
        } finally {
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    }
    async loadActualizarProducto(productoId) {
        this.showLoading();
        try {
            // Cargar HTML del formulario
            const resp = await fetch('/html/panel_control/producto/actualizar.html');
            if (!resp.ok) {
                this.renderContent('<div class="alert alert-danger">Error cargando formulario de producto</div>');
                return;
            }
            const html = await resp.text();
            this.renderContent(html);

            // Marcar sección y pasar id al contexto
            this.currentSection = 'productos_editar';
            this.context = { id_producto: Number(productoId) };

            // Ajustar el título visible (opcional)
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = 'Actualizar Producto';

            // Importar y ejecutar el JS de la pantalla
            await import('/javascript/panel_control/producto/actualizar.js?cache=' + Date.now());
            if (typeof window.initActualizarProducto === 'function') {
                window.initActualizarProducto();
            } else {
                console.error('initActualizarProducto no encontrado');
            }
        } catch (err) {
            console.error('Error loadActualizarProducto:', err);
            this.renderContent('<div class="alert alert-danger">No se pudo cargar la edición de producto</div>');
        } finally {
            this.hideLoading();
        }
    }

    // ✅ CARGAR ASESORÍAS
    async loadAsesorias() {
        this.updatePageTitle('asesorias');
        const html = await fetch('/html/panel_control/asesoria/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'asesorias';
    }

    // ✅ CARGAR TRANSPORTE
    async loadTransporte() {
        this.updatePageTitle('transporte');
        const html = await fetch('/html/panel_control/transporte/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'transporte';
    }
}


// Cerrar sesión
function cerrarSesion() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que quieres salir del panel de control?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                window.location.href = '/html/panel_control/login-panel.html';
            }
        });
    } else {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('token');
            window.location.href = '/html/panel_control/login-panel.html';
        }
    }
}

// Inicializar
let panelControl;
document.addEventListener('DOMContentLoaded', () => {
    panelControl = new PanelControl();
    window.panelControl = panelControl;
    panelControl.init();
});