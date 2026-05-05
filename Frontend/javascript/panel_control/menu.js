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
                window.location.href = '/panel-login';
                return;
            }

            const response = await fetch('/api/panel/auth/verify-admin', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                window.location.href = '/panel-login';
                return;
            }

            this.adminData = await response.json();
            this.updateUserInfo();
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            window.location.href = '/panel-login';
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
                const isOpen = document.getElementById('sidebar').classList.toggle('show');
                document.getElementById('sidebarBackdrop')?.classList.toggle('show', isOpen);
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
                document.getElementById('sidebarBackdrop')?.classList.remove('show');
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
        if (l) {
            l.style.display = 'block';
            l.style.textAlign = 'center';
            l.style.padding = '2rem';
        }
        if (d) {
            d.style.opacity = '0.5';
            d.style.pointerEvents = 'none';
            d.style.transition = 'opacity 0.2s';
        }
    }

    hideLoading() {
        const l = document.getElementById('loading');
        const d = document.getElementById('dynamicContent');
        if (l) l.style.display = 'none';
        if (d) {
            d.style.opacity = '1';
            d.style.pointerEvents = 'auto';
        }
    }

    updateActiveNav(sectionName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Si es una subsección (ej. productos_registrar), mantener activo el padre
        const baseSection = sectionName.split('_')[0];
        
        const target = document.querySelector(`[data-section="${baseSection}"]`);
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
            reportes: 'Reportes del Sistema',
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
            document.getElementById('sidebarBackdrop')?.classList.remove('show');
        }
    }

    // Dashboard
    async loadDashboard() {
        try {
            const resp = await fetch('/html/panel_control/inicio.html');
            if (!resp.ok) {
                return '<div class="alert alert-danger">Error cargando el inicio.</div>';
            }
            let html = await resp.text();
            
            // Reemplazar el marcador {{ADMIN_NAME}}
            const adminName = this.adminData ? `${this.adminData.nombres} ${this.adminData.apellidos}` : 'Administrador';
            html = html.replace('{{ADMIN_NAME}}', adminName);
            
            return html;
        } catch (error) {
            console.error('Error cargando el dashboard:', error);
            return '<div class="alert alert-danger">Error de conexión al cargar el inicio.</div>';
        }
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
        // Esperar a que el DOM esté disponible antes de cargar los datos
        setTimeout(() => {
            if (typeof window.cargarAsesorias === 'function') {
                window.cargarAsesorias();
            }
        }, 100);
    }

    // ✅ CARGAR TRANSPORTE
    async loadTransporte() {
        this.updatePageTitle('transporte');
        const html = await fetch('/html/panel_control/transporte/listar.html').then(r => r.text());
        this.renderContent(html);
        this.currentSection = 'transporte';
        await import('/javascript/panel_control/transporte/listar.js?cache=' + Date.now());
        if (typeof window.initTransporteListado === 'function') {
            window.initTransporteListado();
        }
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
                window.location.href = '/panel-login';
            }
        });
    } else {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('token');
            window.location.href = '/html/panel_control/login-panel.html';
        }
    }
}

// ============================================================
// 🔒 CONTROL DE EXPIRACIÓN DE SESIÓN (ADMIN)
// ============================================================

function decodificarTokenAdmin(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(payload);
    } catch { return null; }
}

let _adminSessionTimers = [];

function limpiarTimersAdmin() {
    _adminSessionTimers.forEach(id => clearTimeout(id));
    _adminSessionTimers = [];
}

function forzarLogoutAdmin() {
    localStorage.removeItem('token');
    window.location.href = '/panel-login';
}

function iniciarVigilanteSesionAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return;

    limpiarTimersAdmin();
    const payload = decodificarTokenAdmin(token);
    if (!payload || !payload.exp) return;

    const expiresAt = payload.exp * 1000;
    const msLeft = expiresAt - Date.now();
    const WARNING_MS = 30 * 1000;

    if (msLeft <= 0) { forzarLogoutAdmin(); return; }

    if (msLeft > WARNING_MS) {
        _adminSessionTimers.push(setTimeout(() => mostrarAvisoExpiracionAdmin(30), msLeft - WARNING_MS));
    } else {
        mostrarAvisoExpiracionAdmin(Math.floor(msLeft / 1000));
    }

    _adminSessionTimers.push(setTimeout(() => forzarLogoutAdmin(), msLeft));
}

function mostrarAvisoExpiracionAdmin(segundosRestantes) {
    if (typeof Swal !== 'undefined') {
        let segs = segundosRestantes;
        let iv;
        Swal.fire({
            title: '⏰ Sesión por vencer',
            html: `Tu sesión cerrará en <strong id="swal-countdown-admin">${segs}</strong> segundos.<br><small class="text-muted">Serás redirigido al inicio de sesión.</small>`,
            icon: 'warning',
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2E7D32',
            allowOutsideClick: false,
            allowEscapeKey: false,
            timer: segundosRestantes * 1000,
            timerProgressBar: true,
            didOpen: () => {
                iv = setInterval(() => {
                    segs--;
                    const el = document.getElementById('swal-countdown-admin');
                    if (el) el.textContent = Math.max(segs, 0);
                    if (segs <= 0) clearInterval(iv);
                }, 1000);
            },
            willClose: () => clearInterval(iv)
        });
    } else {
        alert(`Tu sesión expirará en ${segundosRestantes} segundos. Por favor guarda tu trabajo.`);
    }
}

// Inicializar
let panelControl;
document.addEventListener('DOMContentLoaded', () => {
    panelControl = new PanelControl();
    window.panelControl = panelControl;
    panelControl.init();

    // Iniciar el vigilante de sesión admin
    iniciarVigilanteSesionAdmin();
});
