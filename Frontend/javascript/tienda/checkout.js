/**
 * checkout.js - Lógica de proceso de pago (SPA Compatible)
 */
(function () {
  "use strict";

  const S = v => `S/ ${Number(v || 0).toFixed(2)}`;
  const IGV_RATE = 0.18;

  const getToken = () => {
    const t = localStorage.getItem('token_cliente') || localStorage.getItem('token') || '';
    return (t || '').replace(/^"|"$/g, '').trim();
  };

  const parseJSON = (v) => { try { return JSON.parse(v); } catch { return null; } };

  const getCliente = () => {
    return parseJSON(localStorage.getItem('cliente')) || parseJSON(localStorage.getItem('cliente_data')) || null;
  };

  const loadCart = () => {
    return window.CartService ? window.CartService.getCart() : [];
  };

  const saveCart = items => {
    if (window.CartService) window.CartService.saveLocal(items);
  };

  function ensureAuth() {
    if (!getToken()) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'warning',
          title: '¡Inicia sesión!',
          text: 'Necesitas una cuenta para continuar con tu pedido.',
          confirmButtonText: '🔑 Iniciar Sesión',
          confirmButtonColor: '#2E7D32',
          showCancelButton: true,
          cancelButtonText: '← Volver',
          allowOutsideClick: false
        }).then(result => {
          if (result.isConfirmed) {
            if (window.navigateTo) window.navigateTo('/login');
            else window.location.href = '/login';
          } else {
            if (window.navigateTo) window.navigateTo('/');
            else window.location.href = '/';
          }
        });
      }
      return false;
    }
    return true;
  }

  // ========== Render carrito ==========
  function loadAndRender() {
    if (!ensureAuth()) return;
    const items = loadCart();
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    if (!cartItems || !emptyCart) return;

    if (!items.length) {
      emptyCart.style.display = 'block';
      cartItems.parentElement.style.display = 'none';
      return;
    }
    emptyCart.style.display = 'none';
    cartItems.parentElement.style.display = 'block';

    cartItems.innerHTML = items.map(it => {
      const id = it.id_producto;
      const key = it.extra_key || '';
      const id_carrito = it.id_carrito || ''; // ID de la DB
      const lineTotal = Number(it.precio_unitario) * Number(it.cantidad);
      return `
        <tr id="row_${id}_${key}" class="align-middle border-bottom">
          <td style="width: 80px;">
            <img src="${it.imagen_url || '/icono/favicon-96x96.png'}" 
                 alt="${it.nombre}" 
                 style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px; background: #f8f9fa;">
          </td>
          <td>
            <div class="fw-semibold text-dark">${it.nombre}</div>
            ${it.extra_key ? `<small class="text-muted d-block">${it.extra_key}</small>` : ''}
          </td>
          <td class="text-center">${S(it.precio_unitario)}</td>
          <td class="text-center" style="width: 120px;">
            <div class="input-group input-group-sm justify-content-center">
              <input type="number" class="form-control text-center cart-qty-input" 
                     value="${it.cantidad}" min="1" 
                     data-id="${id}" data-key="${key}" data-id-carrito="${id_carrito}"
                     style="max-width: 60px;">
            </div>
          </td>
          <td class="text-end fw-bold text-primary">${S(lineTotal)}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-danger btn-delete-item" 
                    data-id="${id}" data-key="${key}" data-id-carrito="${id_carrito}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    bindRowEvents();
    recalcTotals();
  }

  function bindRowEvents() {
    // Evento para cambiar cantidades
    document.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const id_producto = Number(e.target.dataset.id);
        const id_carrito = Number(e.target.dataset.idCarrito) || null;
        const newQty = Math.max(1, parseInt(e.target.value) || 1);
        
        if (window.CartService) {
          await window.CartService.updateQuantity(id_carrito, id_producto, newQty);
          // recalcTotals se llama vía el evento cartUpdated que lanza el servicio
        }
      });
    });

    // Evento para eliminar productos
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-delete-item');
        const id_producto = Number(target.dataset.id);
        const id_carrito = Number(target.dataset.idCarrito) || null;
        
        Swal.fire({
          title: '¿Eliminar producto?',
          text: "Se quitará de tu carrito de compras",
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#E91E63',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        }).then(async (result) => {
          if (result.isConfirmed && window.CartService) {
            await window.CartService.removeItem(id_carrito, id_producto);
          }
        });
      });
    });
  }

  function recalcTotals() {
    const items = loadCart();
    const total = items.reduce((s, it) => s + (Number(it.precio_unitario) * Number(it.cantidad)), 0);
    const subtotal = total / (1 + IGV_RATE);
    const igv = total - subtotal;
    
    const subEl = document.getElementById('subtotalAmount');
    const igvEl = document.getElementById('igvAmount');
    const totEl = document.getElementById('totalAmount');
    if (subEl) subEl.textContent = S(subtotal);
    if (igvEl) igvEl.textContent = S(igv);
    if (totEl) totEl.textContent = S(total);
  }

  // ========== Lógica de Pago ==========
  async function loadTiposPago() {
    try {
      const tp = document.getElementById('tipoPago');
      if (!tp) return;
      const r = await fetch('/api/tienda/tipos-pago');
      if (!r.ok) return;
      const tipos = await r.json();
      tp.innerHTML = '<option value="">Seleccione método de pago...</option>';
      tipos.forEach(t => {
        const o = document.createElement('option');
        o.value = t.id_tipo_pago;
        o.textContent = t.descripcion;
        tp.appendChild(o);
      });
    } catch (e) {
      console.error('Error cargando pagos:', e);
    }
  }

  async function placeOrder() {
    const token = getToken();
    if (!token) return ensureAuth();
    const items = loadCart();
    if (!items.length) return;

    const tp = document.getElementById('tipoPago');
    if (!tp || !tp.value) {
        Swal.fire('Atención', 'Selecciona un método de pago', 'warning');
        return;
    }

    try {
      const btn = document.getElementById('btnPedir');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
      }

      const payload = {
        id_tipo_pago: Number(tp.value),
        items: items.map(it => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          nombre: it.nombre
        }))
      };

      const r = await fetch('/api/tienda/pedidos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!r.ok) throw new Error('Error al procesar el pedido');

      const out = await r.json();
      localStorage.setItem('ultimo_pedido', JSON.stringify({ ...out, items, cliente: getCliente() }));
      saveCart([]);

      Swal.fire('¡Gracias por tu compra!', 'Tu pedido ha sido procesado correctamente.', 'success').then(() => {
        window.location.href = '/comprobante';
      });

    } catch (e) {
      Swal.fire('Error', e.message, 'error');
    } finally {
      const btn = document.getElementById('btnPedir');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-file-invoice me-2"></i> REALIZAR PEDIDO';
      }
    }
  }

  const initCheckout = () => {
    loadTiposPago();
    loadAndRender();
    const tp = document.getElementById('tipoPago');
    if (tp) tp.addEventListener('change', () => {
        // Podríamos renderizar campos específicos según pago aquí
    });
    const btn = document.getElementById('btnPedir');
    if (btn) btn.addEventListener('click', placeOrder);

    // ✅ REACCIÓN SPA: Escuchamos el evento global del CartService
    window.addEventListener('cartUpdated', () => {
        console.log('Checkout: Cambios detectados en el carrito, actualizando vista...');
        loadAndRender();
    });
  };

  initCheckout();

})();