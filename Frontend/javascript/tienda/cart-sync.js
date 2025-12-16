// Extensión para sincronización automática de carrito con backend
(function () {

    // Obtener token de autenticación
    function getToken() {
        const t =
            localStorage.getItem('token_cliente') ||
            localStorage.getItem('cliente_token') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token_cliente') ||
            sessionStorage.getItem('cliente_token') ||
            sessionStorage.getItem('token') || '';
        return (t || '').replace(/^"|"$/g, '').trim();
    }

    // Verificar si está autenticado
    function isLoggedIn() {
        return !!getToken();
    }

    // Obtener clave del carrito
    function getCartKey() {
        try {
            const cliente = JSON.parse(localStorage.getItem('cliente') || 'null');
            return cliente?.id_cliente ? `cart_${cliente.id_cliente}` : 'cart_tmp';
        } catch {
            return 'cart_tmp';
        }
    }

    // Sincronizar item con backend
    async function syncItemToBackend(item) {
        if (!isLoggedIn()) return;

        try {
            const token = getToken();
            await fetch('/api/client/carrito', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    opciones: item.opciones || []
                })
            });
        } catch (e) {
            console.error('Error sincronizando carrito:', e);
            // No mostrar error al usuario, el carrito local funciona
        }
    }

    // Sincronizar carrito completo al login
    async function syncCartOnLogin() {
        if (!isLoggedIn()) return;

        const carritoLocal = JSON.parse(localStorage.getItem('cart_tmp') || '[]');

        if (carritoLocal.length === 0) {
            // Cargar carrito desde servidor
            await loadCartFromServer();
            return;
        }

        try {
            const token = getToken();
            const response = await fetch('/api/client/carrito/sincronizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: carritoLocal })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.items) {
                    // Actualizar localStorage con carrito sincronizado
                    const cliente = JSON.parse(localStorage.getItem('cliente') || 'null');
                    if (cliente?.id_cliente) {
                        localStorage.setItem(`cart_${cliente.id_cliente}`, JSON.stringify(data.items));
                    }
                    // Limpiar carrito temporal
                    localStorage.removeItem('cart_tmp');
                }
            }
        } catch (e) {
            console.error('Error sincronizando carrito al login:', e);
        }
    }

    // Cargar carrito desde servidor
    async function loadCartFromServer() {
        if (!isLoggedIn()) return;

        try {
            const token = getToken();
            const response = await fetch('/api/client/carrito', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.items) {
                    const cliente = JSON.parse(localStorage.getItem('cliente') || 'null');
                    if (cliente?.id_cliente) {
                        localStorage.setItem(`cart_${cliente.id_cliente}`, JSON.stringify(data.items));
                    }
                }
            }
        } catch (e) {
            console.error('Error cargando carrito desde servidor:', e);
        }
    }

    // Interceptar función addToCart original
    const originalAddToCart = window.addToCart;
    if (typeof originalAddToCart === 'function') {
        window.addToCart = async function (item) {
            // Llamar función original
            originalAddToCart(item);

            // Sincronizar con backend si está autenticado
            await syncItemToBackend(item);
        };
    }

    // Sincronizar al cargar la página si está autenticado
    document.addEventListener('DOMContentLoaded', () => {
        if (isLoggedIn()) {
            syncCartOnLogin();
        }
    });

    // Exponer funciones globalmente
    window.cartSync = {
        syncItemToBackend,
        syncCartOnLogin,
        loadCartFromServer
    };

})();
