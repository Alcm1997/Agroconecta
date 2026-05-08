/**
 * Navbar Controller - Maneja los elementos globales del Shell (Navbar)
 */
(function() {
    const loginBtn = document.getElementById('loginButton');
    const cartBtn = document.getElementById('cartButton');
    const clientDropdown = document.getElementById('clientDropdown');
    const clientNameEl = document.getElementById('clientName');
    const logoutBtn = document.getElementById('logoutButton');

    const getCliente = () => {
        try {
            return JSON.parse(localStorage.getItem('cliente') || localStorage.getItem('cliente_data') || 'null');
        } catch { return null; }
    };

    const getToken = () => {
        const t = localStorage.getItem('token_cliente') || localStorage.getItem('token') || '';
        return (t || '').replace(/^"|"$/g, '').trim();
    };

    const updateAuthUI = () => {
        const cliente = getCliente();
        const token = getToken();

        if (token && cliente) {
            if (loginBtn) loginBtn.style.display = 'none';
                if (clientDropdown) {
                    clientDropdown.style.display = 'block';
                    if (clientNameEl) {
                        const nombre = cliente.nombres || cliente.nombre || '';
                        const apellido = cliente.apellidos || cliente.apellido || '';
                        const fullName = `${nombre} ${apellido}`.trim() || 'Cliente';
                        
                        if (clientNameEl.textContent !== fullName) {
                            clientNameEl.textContent = fullName;
                        }
                    }

                    // ✅ GARANTÍA SPA: Reinicialización robusta del componente Bootstrap
                    setTimeout(() => {
                        const toggle = clientDropdown.querySelector('.dropdown-toggle');
                        if (toggle && typeof bootstrap !== 'undefined') {
                            try {
                                // 1. Intentar obtener y destruir instancia previa
                                const oldInstance = bootstrap.Dropdown.getInstance(toggle);
                                if (oldInstance) {
                                    oldInstance.dispose();
                                }
                                // 2. Crear instancia nueva sobre el elemento visible
                                new bootstrap.Dropdown(toggle);
                            } catch (e) {
                                console.warn('Error inicializando Bootstrap Dropdown:', e);
                            }
                        }
                    }, 150); // Delay optimizado para dar tiempo al Router y al Renderizado de CSS
                }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (clientDropdown) clientDropdown.style.display = 'none';
        }
    };

    const updateCartBadge = () => {
        const btn = cartBtn || document.getElementById('cartButton');
        if (!btn || !window.CartService) return;
        try {
            const cart = window.CartService.getCart();
            const total = cart.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
            btn.innerHTML = `<i class="fas fa-shopping-cart me-2"></i> ${total > 0 ? `Carrito (${total})` : 'Carrito de Compras'}`;
        } catch (e) {
            btn.innerHTML = `<i class="fas fa-shopping-cart me-2"></i> Carrito de Compras`;
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        if (window.navigateTo) window.navigateTo('/');
        else window.location.href = '/';
        updateAuthUI();
        updateCartBadge();
    };


    const initNavbar = () => {
        updateAuthUI();
        updateCartBadge();
        
        // Si hay token, descargar la verdad absoluta del servidor
        if (getToken() && window.CartService) {
            window.CartService.syncFromServer();
        }

        if (cartBtn) {
            cartBtn.onclick = (e) => {
                e.preventDefault();
                if (window.navigateTo) window.navigateTo('/checkout');
                else window.location.href = '/checkout';
            };
        }

        if (loginBtn) {
            loginBtn.onclick = () => {
                if (window.navigateTo) window.navigateTo('/login');
                else window.location.href = '/login';
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        }

        window.addEventListener('cartUpdated', updateCartBadge);
        window.addEventListener('authUpdated', () => {
            updateAuthUI();
            updateCartBadge();
            if (window.CartService) window.CartService.mergeTempCart();
        });
        window.addEventListener('popstate', () => {
            updateAuthUI();
            updateCartBadge();
        });
        window.addEventListener('spaNavigation', () => {
            updateAuthUI();
            updateCartBadge();
            // Si el usuario acaba de loguearse, sincronizamos
            if (getToken() && window.CartService) window.CartService.syncFromServer();
        });

        // ✅ SINCRONIZACIÓN MULTI-PESTAÑA
        window.addEventListener('storage', (e) => {
            if (['token', 'token_cliente', 'cliente'].includes(e.key)) {
                updateAuthUI();
                updateCartBadge();
                if (getToken() && window.CartService) window.CartService.syncFromServer();
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }

    window.navbarController = { updateAuthUI, updateCartBadge };
})();
