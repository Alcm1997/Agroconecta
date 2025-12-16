(function () {
  const S = v => `S/ ${Number(v || 0).toFixed(2)}`;
  const IGV_RATE = 0.18;

  // ========== Auth y cliente ==========
  const getToken = () => {
    const t =
      localStorage.getItem('token_cliente') ||
      localStorage.getItem('cliente_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token_cliente') ||
      sessionStorage.getItem('cliente_token') ||
      sessionStorage.getItem('token') || '';
    return (t || '').replace(/^"|"$/g, '').trim();
  };

  const parseJSON = (v) => { try { return JSON.parse(v); } catch { return null; } };

  const getCliente = () => {
    return (
      parseJSON(localStorage.getItem('cliente')) ||
      parseJSON(localStorage.getItem('cliente_data')) ||
      parseJSON(localStorage.getItem('perfil_cliente')) ||
      parseJSON(localStorage.getItem('user')) ||
      parseJSON(localStorage.getItem('usuario')) ||
      parseJSON(sessionStorage.getItem('cliente')) ||
      null
    );
  };

  const saveCliente = (c) => {
    if (c) localStorage.setItem('cliente', JSON.stringify(c));
  };

  const nombreCliente = (c) => {
    if (!c) return 'Cliente';
    const tipo = (c.tipo_cliente || '').toLowerCase();
    if (['juridica', 'jurídica', 'juridico'].includes(tipo))
      return (c.razon_social || c.nombre_comercial || 'Cliente').trim();
    const nombres = (c.nombres || c.nombre || '').trim();
    const apellidos = (c.apellidos || c.apellido || '').trim();
    return (nombres + ' ' + apellidos).trim() || (c.fullname || 'Cliente');
  };

  // Intenta obtener el perfil si falta en storage
  async function fetchClienteDelServidor() {
    const token = getToken();
    if (!token) return null;
    const urls = [
      '/api/tienda/clientes/me',
      '/api/tienda/clientes/perfil',
      '/api/tienda/cliente/perfil',
      '/api/cliente/perfil',
      '/api/clientes/me'
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const c = await r.json();
          if (c) {
            saveCliente(c);
            return c;
          }
        }
      } catch (_) { }
    }
    return null;
  }

  // ========== Carrito ==========
  const cartKey = () => {
    const c = getCliente();
    return c?.id_cliente ? `cart_${c.id_cliente}` : 'cart_tmp';
  };
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(cartKey()) || '[]'); }
    catch { return []; }
  };
  const saveCart = items => localStorage.setItem(cartKey(), JSON.stringify(items || []));

  function ensureAuth() {
    if (!getToken()) {
      alert('Inicia sesión para continuar con el checkout.');
      window.location.href = '/html/loginagroconecta.html';
      return false;
    }
    return true;
  }

  // ========== DOM ==========
  const cartItems = document.getElementById('cartItems');
  const emptyCart = document.getElementById('emptyCart');
  const subtotalAmount = document.getElementById('subtotalAmount');
  const igvAmount = document.getElementById('igvAmount');
  const totalAmount = document.getElementById('totalAmount');
  const btnPedir = document.getElementById('btnPedir');
  const tipoPago = document.getElementById('tipoPago');
  const msg = document.getElementById('msg');

  // ========== Tipos de pago ==========
  async function loadTiposPago() {
    try {
      const r = await fetch('/api/tienda/tipos-pago');
      if (!r.ok) throw new Error('Error al cargar tipos de pago');
      const tipos = await r.json();
      tipoPago.innerHTML = '<option value="">Seleccione método de pago...</option>';
      tipos.forEach(t => {
        const o = document.createElement('option');
        o.value = t.id_tipo_pago;
        o.textContent = t.descripcion;
        tipoPago.appendChild(o);
      });
    } catch (e) {
      console.error('Error cargando tipos de pago:', e);
      tipoPago.innerHTML = '<option value="">Error al cargar métodos de pago</option>';
    }
  }

  // ========== Campos por método de pago ==========
  function renderCamposPago() {
    const opt = tipoPago.selectedOptions[0];
    if (!opt || !opt.value) {
      // Si no hay selección, limpiar cualquier formulario existente
      limpiarFormulariosPago();
      return;
    }

    const d = opt.textContent.toLowerCase();
    let html = '';

    if (d.includes('tarjeta')) {
      html = `
        <div class="card bg-light mt-3 payment-form-card">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-credit-card me-2"></i>Datos de la Tarjeta</h6>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Número de tarjeta</label>
                <input id="numeroTarjeta" type="text" class="form-control" placeholder="1234 5678 9012 3456"
                       maxlength="19" pattern="[0-9\\s]{13,19}" required>
              </div>
              <div class="col-8">
                <label class="form-label">Vencimiento</label>
                <input id="vencimiento" type="text" class="form-control" placeholder="MM/AA"
                       maxlength="5" pattern="[0-9]{2}/[0-9]{2}" required>
              </div>
              <div class="col-4">
                <label class="form-label">CVV</label>
                <input id="cvv" type="text" class="form-control" placeholder="123"
                       maxlength="4" pattern="[0-9]{3,4}" required>
              </div>
              <div class="col-12">
                <label class="form-label">Nombre del titular</label>
                <input id="nombreTitular" type="text" class="form-control" placeholder="Como aparece en la tarjeta" required>
              </div>
            </div>
          </div>
        </div>`;
    } else if (d.includes('yape')) {
      html = `
        <div class="card bg-light mt-3 payment-form-card">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-mobile-alt me-2" style="color:#722F87"></i>Pago con Yape</h6>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Número de celular</label>
                <input id="celularYape" type="tel" class="form-control" placeholder="999 123 456"
                       pattern="[0-9]{9}" maxlength="9" required>
              </div>
              <div class="col-12">
                <label class="form-label">Código de verificación</label>
                <input id="codigoYape" type="text" class="form-control" placeholder="Código de 6 dígitos"
                       maxlength="6" pattern="[0-9]{6}" required>
                <div class="form-text">Ingresa el código que te llegará por SMS</div>
              </div>
            </div>
          </div>
        </div>`;
    } else if (d.includes('plin')) {
      html = `
        <div class="card bg-light mt-3 payment-form-card">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-mobile-alt me-2" style="color:#FF6B35"></i>Pago con Plin</h6>
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Número de celular</label>
                <input id="celularPlin" type="tel" class="form-control" placeholder="999 123 456"
                       pattern="[0-9]{9}" maxlength="9" required>
              </div>
              <div class="col-12">
                <label class="form-label">Código de verificación</label>
                <input id="codigoPlin" type="text" class="form-control" placeholder="Código de 4 dígitos"
                       maxlength="4" pattern="[0-9]{4}" required>
                <div class="form-text">Ingresa tu PIN de Plin</div>
              </div>
            </div>
          </div>
        </div>`;
    } else if (d.includes('transferencia')) {
      html = `
        <div class="card bg-light mt-3 payment-form-card">
          <div class="card-body">
            <h6 class="card-title"><i class="fas fa-university me-2"></i>Transferencia Bancaria</h6>
            <div class="alert alert-info">
              <strong>Datos para transferencia:</strong><br>
              <strong>Banco:</strong> BCP<br>
              <strong>Cuenta:</strong> 123-456-789-012<br>
              <strong>CCI:</strong> 00212345678901234567<br>
              <strong>Titular:</strong> Pitahaya Perú S.A.C.
            </div>
            <div class="mb-3">
              <label class="form-label">Número de operación</label>
              <input id="numeroOperacion" type="text" class="form-control" placeholder="Número de la transferencia" required>
            </div>
          </div>
        </div>`;
    }

    // ✅ CORRECCIÓN: Limpiar TODOS los formularios de pago existentes antes de insertar el nuevo
    limpiarFormulariosPago();

    if (html) {
      tipoPago.parentElement.insertAdjacentHTML('afterend', html);
      bindCamposPago();
    }
  }

  // ✅ NUEVA FUNCIÓN: Limpiar todos los formularios de pago existentes
  function limpiarFormulariosPago() {
    // Buscar y eliminar todos los formularios de pago (clase específica)
    document.querySelectorAll('.payment-form-card').forEach(card => card.remove());
  }

  // ========== Formateos ==========
  function bindCamposPago() {
    const numeroTarjeta = document.getElementById('numeroTarjeta');
    const vencimiento = document.getElementById('vencimiento');
    const cvv = document.getElementById('cvv');
    const celularYape = document.getElementById('celularYape');
    const celularPlin = document.getElementById('celularPlin');

    if (numeroTarjeta) {
      numeroTarjeta.addEventListener('input', e => {
        let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
        let parts = [];
        for (let i = 0; i < v.length; i += 4) parts.push(v.substring(i, i + 4));
        e.target.value = parts.join(' ');
      });
    }
    if (vencimiento) {
      vencimiento.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
        e.target.value = v;
      });
    }
    if (cvv) cvv.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, ''));
    [celularYape, celularPlin].forEach(el => el && el.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '')));
  }

  // ========== Validación ==========
  function validarCamposPago() {
    const opt = tipoPago.selectedOptions[0];
    if (!opt || !opt.value) throw new Error('Seleccione un método de pago');
    const d = opt.textContent.toLowerCase();

    if (d.includes('tarjeta')) {
      const numeroTarjeta = document.getElementById('numeroTarjeta')?.value.replace(/\s/g, '');
      const vencimiento = document.getElementById('vencimiento')?.value;
      const cvv = document.getElementById('cvv')?.value;
      const nombreTitular = document.getElementById('nombreTitular')?.value;
      if (!numeroTarjeta || numeroTarjeta.length < 13) throw new Error('Número de tarjeta inválido');
      if (!vencimiento || !/^\d{2}\/\d{2}$/.test(vencimiento)) throw new Error('Fecha de vencimiento inválida');
      if (!cvv || cvv.length < 3) throw new Error('CVV inválido');
      if (!nombreTitular || nombreTitular.trim().length < 3) throw new Error('Nombre del titular requerido');
    } else if (d.includes('yape')) {
      const celularYape = document.getElementById('celularYape')?.value;
      const codigoYape = document.getElementById('codigoYape')?.value;
      if (!celularYape || celularYape.length !== 9) throw new Error('Número de celular inválido');
      if (!codigoYape || codigoYape.length !== 6) throw new Error('Código de verificación inválido');
    } else if (d.includes('plin')) {
      const celularPlin = document.getElementById('celularPlin')?.value;
      const codigoPlin = document.getElementById('codigoPlin')?.value;
      if (!celularPlin || celularPlin.length !== 9) throw new Error('Número de celular inválido');
      if (!codigoPlin || codigoPlin.length !== 4) throw new Error('PIN inválido');
    } else if (d.includes('transferencia')) {
      const numeroOperacion = document.getElementById('numeroOperacion')?.value;
      if (!numeroOperacion || numeroOperacion.trim().length < 6) throw new Error('Número de operación requerido');
    }
  }

  // ========== Render carrito ==========
  function loadAndRender() {
    if (!ensureAuth()) return;
    const items = loadCart();

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
      const rowId = `row_${id}_${key}`;
      const qtyId = `qty_${id}_${key}`;
      const lineTotal = Number(it.precio_unitario) * Number(it.cantidad);
      return `
        <tr id="${rowId}">
          <td>
            <div class="d-flex align-items-center">
              <img src="${it.imagen_url || '/icono/favicon-96x96.png'}"
                   class="product-img me-3" alt="${it.nombre}"
                   onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
              <div>
                <div class="fw-semibold">${it.nombre}</div>
                ${it.extra_key ? `<div class="text-muted small">${it.extra_key}</div>` : ''}
              </div>
            </div>
          </td>
          <td class="text-center">${S(it.precio_unitario)}</td>
          <td class="text-center">
            <input id="${qtyId}" class="form-control form-control-sm text-center" style="width:80px;margin:0 auto"
                   type="number" min="1" value="${it.cantidad}" data-id="${id}" data-key="${key}">
          </td>
          <td class="text-end fw-semibold" id="lt_${id}_${key}">${S(lineTotal)}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-danger" data-del="${id}" data-key="${key}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    bindRowEvents();
    recalcTotals();
  }

  function recalcTotals() {
    const items = loadCart();
    const total = items.reduce((s, it) => s + (Number(it.precio_unitario) * Number(it.cantidad)), 0);
    const subtotal = total / (1 + IGV_RATE);
    const igv = total - subtotal;
    if (subtotalAmount) subtotalAmount.textContent = S(subtotal);
    if (igvAmount) igvAmount.textContent = S(igv);
    if (totalAmount) totalAmount.textContent = S(total);
  }

  function bindRowEvents() {
    cartItems.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('input', () => {
        const id = Number(inp.dataset.id);
        const key = inp.dataset.key || '';
        const q = Math.max(1, Number(inp.value || 1));
        const items = loadCart();
        const idx = items.findIndex(x => x.id_producto === id && (x.extra_key || '') === key);
        if (idx >= 0) {
          items[idx].cantidad = q;
          saveCart(items);
          const totalEl = document.getElementById(`lt_${id}_${key}`);
          if (totalEl) totalEl.textContent = S(items[idx].precio_unitario * q);
          recalcTotals();
        }
      });
    });

    cartItems.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-del'));
        const key = btn.getAttribute('data-key') || '';
        const items = loadCart().filter(x => !(x.id_producto === id && (x.extra_key || '') === key));
        saveCart(items);
        const row = document.getElementById(`row_${id}_${key}`);
        if (row) row.remove();
        if (!items.length) {
          emptyCart.style.display = 'block';
          cartItems.parentElement.style.display = 'none';
        }
        recalcTotals();
      });
    });
  }

  // ========== Pedido ==========
  async function placeOrder() {
    if (msg) msg.innerHTML = '';
    const token = getToken();
    if (!token) return ensureAuth();
    const items = loadCart();
    if (!items.length) return;

    try {
      validarCamposPago();

      const payload = {
        id_tipo_pago: Number(tipoPago.value),
        items: items.map(it => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          nombre: it.nombre,
          opciones: Array.isArray(it.opciones) ? it.opciones : (it.extra_key === 'NDS' ? [1] : [])
        }))
      };

      if (btnPedir) {
        btnPedir.disabled = true;
        btnPedir.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
      }

      const r = await fetch('/api/tienda/pedidos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${r.status}`);
      }

      const out = await r.json();

      const comprobanteData = {
        id_pedido: out.id_pedido,
        tipo_comprobante: out.tipo_comprobante || 'BOLETA',
        numero_comprobante: out.numero_comprobante || 'No disponible',
        total: out.total,
        fecha_pedido: out.fecha_pedido || new Date().toISOString(),
        cliente: getCliente(),
        items,
        metodo_pago: tipoPago.selectedOptions[0]?.textContent || 'No especificado'
      };

      localStorage.setItem('ultimo_pedido', JSON.stringify(comprobanteData));
      saveCart([]);

      if (msg) {
        msg.innerHTML = `
          <div class="alert alert-success text-center">
            <div class="spinner-border spinner-border-sm me-2"></div>
            <strong>¡Pedido generado exitosamente!</strong><br>
            <small>Redirigiendo al comprobante...</small>
          </div>`;
      }

      setTimeout(() => window.location.href = '/html/comprobante.html', 1500);

    } catch (e) {
      console.error('Error en placeOrder:', e);
      if (msg) msg.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${e.message || 'No se pudo generar el pedido'}</div>`;
    } finally {
      if (btnPedir) {
        btnPedir.disabled = false;
        btnPedir.innerHTML = '<i class="fas fa-file-invoice me-2"></i> REALIZAR PEDIDO';
      }
    }
  }

  // ========== Navbar: nombre del cliente ==========
  async function updateAuthUI() {
    try {
      const clientDropdown = document.getElementById('clientDropdown');
      const clientName = document.getElementById('clientName');
      const loginButton = document.getElementById('loginButton');

      const token = getToken();
      if (!token) {
        if (clientName) clientName.textContent = 'Invitado';
        if (loginButton) loginButton.style.display = '';
        return;
      }

      // Mostrar estado de carga
      if (clientName) clientName.textContent = 'Cargando...';
      if (loginButton) loginButton.style.display = 'none';
      if (clientDropdown) {
        clientDropdown.style.display = 'inline-flex';
        clientDropdown.classList.remove('d-none');
      }

      let cliente = getCliente();
      if (!cliente) {
        cliente = await fetchClienteDelServidor();
      }

      if (cliente) {
        if (clientName) clientName.textContent = nombreCliente(cliente);
      } else {
        // Token sin perfil: mostrar genérico
        if (clientName) clientName.textContent = 'Cliente';
      }
    } catch (e) {
      console.error('updateAuthUI error:', e);
      const clientName = document.getElementById('clientName');
      if (clientName) clientName.textContent = 'Cliente';
    }
  }

  // ========== Init ==========
  document.addEventListener('DOMContentLoaded', async () => {
    await updateAuthUI();
    loadTiposPago();
    loadAndRender();
    if (tipoPago) tipoPago.addEventListener('change', renderCamposPago);
    if (btnPedir) btnPedir.addEventListener('click', placeOrder);
  });
})();

// Logout global
window.logout = function () {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/html/loginagroconecta.html';
};