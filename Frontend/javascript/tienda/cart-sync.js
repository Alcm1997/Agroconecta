/**
 * CartService - El "Cerebro" único del carrito de compras.
 * Gestiona localStorage, sincronización con Backend y eventos globales.
 */
(function () {
    "use strict";

    // --- UTILIDADES ---
    const getToken = () => {
        const t = localStorage.getItem('token_cliente') || localStorage.getItem('token') || '';
        return (t || '').replace(/^"|"$/g, '').trim();
    };

    const getClienteId = () => {
        try {
            const c = JSON.parse(localStorage.getItem('cliente') || localStorage.getItem('cliente_data') || 'null');
            return c?.id_cliente || c?.id || null;
        } catch { return null; }
    };

    const getCartKey = () => {
        const id = getClienteId();
        return id ? `cart_${id}` : 'cart_tmp';
    };

    const triggerUpdate = () => {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    };

    // --- API DEL SERVICIO ---
    const CartService = {
        
        getCart: function() {
            try { return JSON.parse(localStorage.getItem(getCartKey()) || '[]'); }
            catch { return []; }
        },

        saveLocal: function(items) {
            localStorage.setItem(getCartKey(), JSON.stringify(items || []));
            triggerUpdate();
        },

        // Añadir producto (Sincronizado)
        addItem: async function(item) {
            // 1. Actualizar Local primero (Optimismo)
            let cart = this.getCart();
            const idx = cart.findIndex(it => 
                it.id_producto === item.id_producto && 
                JSON.stringify(it.opciones || []) === JSON.stringify(item.opciones || [])
            );

            if (idx >= 0) {
                cart[idx].cantidad += Number(item.cantidad || 1);
            } else {
                cart.push(item);
            }
            this.saveLocal(cart);

            // 2. Sincronizar con Backend si está logueado
            const token = getToken();
            if (token) {
                try {
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
                    // Refrescar para obtener el id_carrito oficial
                    await this.syncFromServer();
                } catch (e) { console.warn('Error sincronizando item:', e); }
            }
        },

        // Actualizar cantidad exacta (Sincronizado - Crucial para Checkout)
        updateQuantity: async function(id_carrito, id_producto, newQty) {
            let cart = this.getCart();
            const idx = cart.findIndex(it => 
                (id_carrito && it.id_carrito === id_carrito) || 
                (!id_carrito && it.id_producto === id_producto)
            );

            if (idx === -1) return;
            cart[idx].cantidad = Number(newQty);
            this.saveLocal(cart);

            const token = getToken();
            if (token && (id_carrito || id_producto)) {
                try {
                    // Si tenemos id_carrito (preferido), usamos el endpoint PUT específico
                    const url = id_carrito ? `/api/client/carrito/${id_carrito}` : `/api/client/carrito/producto/${id_producto}`;
                    const r = await fetch(url, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ cantidad: newQty })
                    });
                    if (!r.ok) throw new Error('Error en servidor');
                } catch (e) { 
                    console.warn('Error actualizando cantidad en backend:', e);
                    // Opcional: Revertir localmente si falla críticamente
                }
            }
        },

        // Eliminar producto (Sincronizado)
        removeItem: async function(id_carrito, id_producto) {
            let cart = this.getCart();
            cart = cart.filter(it => !(
                (id_carrito && it.id_carrito === id_carrito) || 
                (!id_carrito && it.id_producto === id_producto)
            ));
            this.saveLocal(cart);

            const token = getToken();
            if (token && id_carrito) {
                try {
                    await fetch(`/api/client/carrito/${id_carrito}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) { console.warn('Error eliminando del backend:', e); }
            }
        },

        // Descargar la "verdad absoluta" del servidor
        syncFromServer: async function() {
            const token = getToken();
            if (!token) return;

            try {
                const r = await fetch('/api/client/carrito', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (r.ok) {
                    const data = await r.json();
                    if (data.success && data.data && Array.isArray(data.data.items)) {
                        localStorage.setItem(getCartKey(), JSON.stringify(data.data.items));
                        triggerUpdate();
                        window.dispatchEvent(new CustomEvent('cartSynced'));
                        return data.data.items;
                    }
                }
            } catch (e) { console.error('Error en syncFromServer:', e); }
        },

        // Sincronizar cart_tmp -> servidor al iniciar sesión
        mergeTempCart: async function() {
            const token = getToken();
            if (!token) return;
            const tmpItems = JSON.parse(localStorage.getItem('cart_tmp') || '[]');
            if (tmpItems.length === 0) return this.syncFromServer();

            try {
                const r = await fetch('/api/client/carrito/sincronizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ items: tmpItems })
                });
                if (r.ok) {
                    localStorage.removeItem('cart_tmp');
                    await this.syncFromServer();
                }
            } catch (e) { console.error('Error merging cart:', e); }
        }
    };

    // --- EXPOSICIÓN GLOBAL ---
    window.CartService = CartService;
    // Compatibilidad con código antiguo
    window.addToCart = (item) => CartService.addItem(item);

    // --- ESCUCHA DE EVENTOS ---
    // Sincronización multi-pestaña
    window.addEventListener('storage', (e) => {
        if (e.key === getCartKey()) {
            triggerUpdate();
        }
    });

    // Inicio automático si está logueado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (getToken()) CartService.syncFromServer();
        });
    } else {
        if (getToken()) CartService.syncFromServer();
    }

})();
