// Motor de navegación SPA para la tienda del cliente
(function () {
    const appContent = document.getElementById('app-content');

    // Mapeo de rutas (URL mostrada en navegador -> Archivo HTML físico)
    const routes = {
        '/': '/html/cliente/inicio.html',
        '/mi-cuenta': '/html/cliente/miCuenta.html',
        '/checkout': '/html/cliente/checkout.html',
        '/producto': '/html/cliente/producto_detalle.html',
        '/login': '/html/cliente/loginagroconecta.html',
        '/registro': '/html/cliente/registroagroconecta.html',
        '/recuperar-contrasena': '/html/cliente/recuperarcontrasenaagroconecta.html',
        '/verificar-codigo': '/html/cliente/verificarcodigoagroconecta.html'
    };

    const loadView = async (url) => {
        try {
            if (!appContent) return;

            // 1. Mostrar estado de carga
            appContent.innerHTML = `
                <div class="text-center py-5 my-5">
                    <div class="spinner-border text-success" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>`;

            // 2. Extraer la ruta base ignorando parámetros (ej. ?id=1)
            const [pathname] = url.split('?');
            const templatePath = routes[pathname] || routes['/'];

            // 3. Descargar el archivo HTML
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error('Error al cargar la vista');
            
            const html = await response.text();
            
            // 4. Manejar el Shell (Navbar y Footer globales)
            const mainNav = document.querySelector('.navbar-cliente');
            const authNav = document.getElementById('authNavbar');
            const mainFooter = document.querySelector('.footer-cliente');
            const isAuthRoute = ['/login', '/registro', '/recuperar-contrasena', '/verificar-codigo'].includes(pathname);

            if (isAuthRoute) {
                if (mainNav) mainNav.style.display = 'none';
                if (authNav) authNav.style.display = 'block';
                if (mainFooter) mainFooter.style.display = 'none';
                document.body.classList.add('auth-bg');
            } else {
                if (mainNav) mainNav.style.display = 'flex';
                if (authNav) authNav.style.display = 'none';
                if (mainFooter) mainFooter.style.display = 'block';
                document.body.classList.remove('auth-bg');
            }

            // 5. Inyectar HTML en el DOM
            appContent.innerHTML = html;

            // 5. Extraer y re-ejecutar etiquetas <script> inyectadas
            const scripts = appContent.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
                script.remove();
            });

            // 6. Manejar Scroll (Ancla o Inicio)
            // Esperamos un brevísimo momento para que el DOM inyectado se asiente
            setTimeout(() => {
                const hash = window.location.hash;
                if (hash) {
                    const targetElement = document.querySelector(hash);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        window.scrollTo(0, 0);
                    }
                } else {
                    window.scrollTo(0, 0);
                }
                
                // NOTIFICAR NAVEGACIÓN SPA COMPLETADA
                window.dispatchEvent(new CustomEvent('spaNavigation', { detail: { path: pathname } }));
            }, 100);

        } catch (error) {
            console.error('SPA Router Error:', error);
            appContent.innerHTML = `
                <div class="container my-5">
                    <div class="alert alert-danger text-center">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i><br>
                        Error al cargar la página. Por favor, refresca el navegador.
                    </div>
                </div>`;
        }
    };

    // Función global para navegar desde botones u otros scripts
    window.navigateTo = (url) => {
        history.pushState(null, null, url);
        loadView(url);
    };

    // Interceptar clicks en enlaces (<a>)
    document.addEventListener('click', e => {
        const link = e.target.closest('a');
        
        // Si el enlace es interno (mismo dominio) y no tiene target="_blank"
        if (link && link.href.startsWith(window.location.origin) && link.target !== '_blank') {
            const urlObj = new URL(link.href);
            
            // CASO 0: Click en Logo/Home estando ya en la Home (evitar recarga, solo subir)
            if (urlObj.pathname === '/' && window.location.pathname === '/' && !urlObj.hash) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // CASO 1: Enlaces de ancla en la misma página (ej: /#fertilizantes estando en /)
            if (urlObj.pathname === window.location.pathname && urlObj.hash) {
                const target = document.querySelector(urlObj.hash);
                if (target) {
                    e.preventDefault();
                    history.pushState(null, null, link.href);
                    target.scrollIntoView({ behavior: 'smooth' });
                    return;
                }
            }

            // CASO 2: Rutas conocidas del SPA (incluyendo home con anclas)
            if (routes[urlObj.pathname] || urlObj.pathname === '/') {
                e.preventDefault();
                window.navigateTo(urlObj.pathname + urlObj.search + urlObj.hash);
            }
        }
    });

    // Escuchar el evento de navegar "Atrás" o "Adelante" del navegador
    window.addEventListener('popstate', () => {
        loadView(window.location.pathname + window.location.search + window.location.hash);
    });

    // Carga inicial (cuando se abre la página por primera vez o se da F5)
    document.addEventListener('DOMContentLoaded', () => {
        loadView(window.location.pathname + window.location.search);
    });

})();
