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
      const container = document.getElementById('paymentOptions');
      if (!container) return;
      
      const r = await fetch('/api/tienda/tipos-pago');
      if (!r.ok) return;
      const tipos = await r.json();
      
      container.innerHTML = '';
      tipos.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<button class="dropdown-item" type="button" data-id="${t.id_tipo_pago}">${t.descripcion}</button>`;
        container.appendChild(li);
      });

      // Manejar click en las opciones
      container.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation(); // Evitar que el Router SPA intente capturar el clic
          
          const id = e.target.dataset.id;
          const text = e.target.textContent;
          
          const input = document.getElementById('tipoPago');
          const label = document.getElementById('selectedPaymentText');
          const btn = document.getElementById('paymentDropdown');

          if (input) input.value = id;
          if (label) label.textContent = text;
          
          if (btn) {
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-outline-primary');
            
            // ✅ CIERRE AUTOMÁTICO: Usamos la API de Bootstrap para cerrar el menú
            const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(btn);
            if (bsDropdown) bsDropdown.hide();
          }

          // Mostrar el formulario correspondiente
          togglePaymentForms(id);
        });
      });

    } catch (e) {
      console.error('Error cargando pagos:', e);
    }
  }

  function togglePaymentForms(id) {
    const container = document.getElementById('paymentFormContainer');
    const fTarjeta = document.getElementById('formTarjeta');
    const fYape = document.getElementById('formYape');
    const fPlin = document.getElementById('formPlin');

    if (!container) return;
    
    // Ocultar todos primero
    container.style.display = 'block';
    fTarjeta.style.display = 'none';
    fYape.style.display = 'none';
    fPlin.style.display = 'none';

    // ID 1: Tarjeta, 2: Yape, 3: Plin (según AgroConecta.sql)
    const numId = Number(id);
    if (numId === 1) fTarjeta.style.display = 'block';
    else if (numId === 2) fYape.style.display = 'block';
    else if (numId === 3) fPlin.style.display = 'block';
    else container.style.display = 'none';
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

    // Validación de campos según el método
    const id = Number(tp.value);
    const PF = window.PaymentFormatter;

    if (id === 1) { // Tarjeta
      const n = PF.unformat(document.getElementById('cardNum').value);
      const e = document.getElementById('cardExp').value;
      const c = document.getElementById('cardCvv').value;
      
      if (!n || !e || !c) return Swal.fire('Atención', 'Completa los datos de tu tarjeta', 'warning');
      
      const cardType = PF.detectCardType(n);
      if (!cardType) return Swal.fire('Error', 'Tipo de tarjeta no reconocido', 'error');
      if (n.length < cardType.maxLen) return Swal.fire('Atención', `El número de tarjeta debe tener ${cardType.maxLen} dígitos`, 'warning');
      if (!PF.validateLuhn(n)) return Swal.fire('Error', 'Número de tarjeta inválido (Luhn Check failed)', 'error');
      
      const expiryCheck = PF.validateExpiryDate(e);
      if (!expiryCheck.valid) return Swal.fire('Atención', expiryCheck.msg, 'warning');

      if (c.length < cardType.cvvLen) return Swal.fire('Atención', `El CVV para ${cardType.niceName} debe tener ${cardType.cvvLen} dígitos`, 'warning');

    } else if (id === 2 || id === 3) { // Yape o Plin
      const fieldPrefix = id === 2 ? 'yape' : 'plin';
      const p = PF.unformat(document.getElementById(`${fieldPrefix}Phone`).value);
      const c = document.getElementById(`${fieldPrefix}Code`).value;
      
      if (!p || !c) return Swal.fire('Atención', `Completa los datos de tu ${fieldPrefix.toUpperCase()}`, 'warning');
      
      const phoneCheck = PF.validatePhone(p);
      if (!phoneCheck.valid) return Swal.fire('Atención', phoneCheck.msg, 'warning');

      if (c.length !== 6) return Swal.fire('Atención', 'El código de aprobación debe tener 6 dígitos', 'warning');
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

  const setupPaymentMasks = () => {
    const PF = window.PaymentFormatter;
    if (!PF) return;

    // --- Máscara Tarjeta ---
    const cardInput = document.getElementById('cardNum');
    const cvvInput = document.getElementById('cardCvv');
    const iconContainer = document.getElementById('cardBrandIcon');

    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        const cursor = e.target.selectionStart;
        const oldVal = e.target.value;
        const clean = PF.unformat(oldVal);
        const cardType = PF.detectCardType(clean);

        // Aplicar máscara
        e.target.value = PF.formatCardNumber(clean, cardType);

        // Ajustar CVV y Placeholder
        if (cardType) {
          cvvInput.maxLength = cardType.cvvLen;
          cvvInput.placeholder = cardType.name === 'amex' ? '0000' : '000';
          if (iconContainer) {
            const icons = {
              visa: 'fab fa-cc-visa',
              mastercard: 'fab fa-cc-mastercard',
              amex: 'fab fa-cc-amex',
              diners: 'fab fa-cc-diners-club'
            };
            iconContainer.innerHTML = `<i class="${icons[cardType.name] || 'fas fa-credit-card'} animate__animated animate__flipInX"></i>`;
            iconContainer.className = `position-absolute top-50 end-0 translate-middle-y me-3 text-${cardType.name}`;
          }
        } else {
          cvvInput.maxLength = 3;
          cvvInput.placeholder = 'CVV';
          if (iconContainer) {
            iconContainer.innerHTML = '<i class="fas fa-credit-card"></i>';
            iconContainer.className = 'position-absolute top-50 end-0 translate-middle-y me-3 text-muted';
          }
        }

        // Mantener posición del cursor (aproximado por espacios)
        if (cursor < oldVal.length) {
            e.target.setSelectionRange(cursor, cursor);
        }
      });
    }

    // --- Máscara Expiración ---
    const expInput = document.getElementById('cardExp');
    if (expInput) {
      expInput.addEventListener('input', (e) => {
        e.target.value = PF.formatExpiry(e.target.value);
      });

      expInput.addEventListener('blur', (e) => {
        if (e.target.value.length === 5) {
          const check = PF.validateExpiryDate(e.target.value);
          if (!check.valid) {
            Swal.fire({
              icon: 'warning',
              title: 'Fecha inválida',
              text: check.msg,
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000
            });
            e.target.classList.add('is-invalid');
          } else {
            e.target.classList.remove('is-invalid');
            e.target.classList.add('is-valid');
          }
        }
      });
    }

    // --- Máscara Celulares (Yape/Plin) ---
    ['yapePhone', 'plinPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          e.target.value = PF.formatPhone(e.target.value);
        });

        el.addEventListener('blur', (e) => {
          if (e.target.value.length >= 1) {
            const check = PF.validatePhone(e.target.value);
            if (!check.valid) {
              Swal.fire({
                icon: 'warning',
                title: 'Celular inválido',
                text: check.msg,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
              });
              e.target.classList.add('is-invalid');
            } else {
              e.target.classList.remove('is-invalid');
              e.target.classList.add('is-valid');
            }
          }
        });
      }
    });
  };

  const initCheckout = () => {
    loadTiposPago();
    loadAndRender();
    setupPaymentMasks();
    
    const btn = document.getElementById('btnPedir');
    if (btn) btn.addEventListener('click', placeOrder);

    // ✅ REACCIÓN SPA: Evitamos duplicar el listener si el script se vuelve a ejecutar
    if (!window._checkoutCartListener) {
        window._checkoutCartListener = () => {
            console.log('Checkout: Cambios detectados en el carrito, actualizando vista...');
            loadAndRender();
        };
        window.addEventListener('cartUpdated', window._checkoutCartListener);
    }
  };

  initCheckout();

})();