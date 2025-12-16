(function () {
  // Secciones y utilidades
  const elFert = document.getElementById('gridFertilizantes');
  const elPacks = document.getElementById('gridPacks');
  const elEsq = document.getElementById('gridEsquejes');
  const elFrutas = document.getElementById('gridFrutas');
  const cartBtn = document.getElementById('cartButton');
  const S = v => `S/ ${Number(v || 0).toFixed(2)}`;

  // Auth cliente (lee token de varias llaves)
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
  const getCliente = () => {
    try { return JSON.parse(localStorage.getItem('cliente') || localStorage.getItem('cliente_data') || 'null'); }
    catch { return null; }
  };
  const isLoggedIn = () => !!getToken() || !!getCliente()?.id_cliente;

  // Carrito
  const cartKey = () => {
    const c = getCliente();
    return c?.id_cliente ? `cart_${c.id_cliente}` : 'cart_tmp';
  };
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(cartKey()) || '[]'); } catch { return []; }
  };
  const updateCartBadge = () => {
    if (!cartBtn) return;
    const total = loadCart().reduce((s, it) => s + (it.cantidad || 0), 0);
    cartBtn.textContent = total > 0 ? `Carrito (${total})` : 'Carrito de Compras';
  };
  const saveCart = (items) => {
    localStorage.setItem(cartKey(), JSON.stringify(items || []));
    updateCartBadge();
  };

  function showToast(msg = 'Producto agregado al carrito') {
    try {
      const el = document.createElement('div');
      el.className = 'alert alert-success position-fixed top-0 end-0 m-3 py-2 px-3 shadow';
      el.style.zIndex = 1080;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    } catch { }
  }

  // Agregar al carrito (no exige login; se valida en checkout)
  function addToCart(linea) {
    const items = loadCart();
    const idx = items.findIndex(x => x.id_producto === linea.id_producto && (x.extra_key || '') === (linea.extra_key || ''));
    if (idx >= 0) items[idx].cantidad += linea.cantidad;
    else items.push(linea);
    saveCart(items);
    showToast();
  }

  // Precio unitario según cantidad usando descuento_volumen
  function unitPriceForQty(p, qty) {
    const q = Math.max(1, Number(qty || 1));
    const niveles = Array.isArray(p.descuentos) ? p.descuentos : [];
    if (!niveles.length) return Number(p.precio_unitario || 0);
    let price = Number(p.precio_unitario || 0);
    for (const n of niveles) {
      const min = Number(n.cantidad_minima ?? 0);
      const max = n.cantidad_maxima == null ? Infinity : Number(n.cantidad_maxima);
      if (q >= min && q <= max) price = Number(n.precio_descuento || price);
    }
    return price;
  }

  // Cards
  function cardFert(p) {
    const idQty = `qty_${p.id_producto}`;
    const idNds = `opt_${p.id_producto}_nds`;
    const ndsObj = (p.opciones || []).find(o => (o.nombre || '').toUpperCase() === 'NDS');
    const hasNDS = !!ndsObj;
    const ndsPrice = hasNDS ? Number(ndsObj.precio_adicional || 0) : 0;
    return `
      <div class="col-md-4">
        <div class="product-card">
          <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="product-img" alt="${p.nombre}"
               onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
          <div class="p-3">
            <h3 class="mb-2">${p.nombre}</h3>
            <div class="text-muted mb-2">${p.descripcion || ''}</div>
            <div class="mb-2">
              <label class="fw-bold mb-1">Litros:</label>
              <input id="${idQty}" type="number" min="1" value="1" class="form-control" style="max-width:120px">
            </div>
            ${hasNDS ? `
            <div class="form-check mb-2">
              <input class="form-check-input opt-nds" type="checkbox" id="${idNds}" data-op="${ndsObj.id_opcion}" data-price="${ndsPrice}">
              <label class="form-check-label" for="${idNds}">NDS (+${S(ndsPrice)} por litro)</label>
            </div>` : ``}
            <div class="mb-2">
              <span class="fw-bold">Precio unitario:</span>
              <span id="up_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
              <small class="text-muted">/ ${p.unidad || ''}</small>
            </div>
            <div class="mb-3">
              <span class="fw-bold">Total:</span>
              <span id="tot_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <button class="btn btn-primary w-100" data-add="${p.id_producto}">
              <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
  }

  function cardPack(p) {
    const idQty = `qty_${p.id_producto}`;
    return `
      <div class="col-md-4">
        <div class="product-card">
          <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="product-img" alt="${p.nombre}"
               onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
          <div class="p-3">
            <h3 class="mb-2">${p.nombre}</h3>
            <div class="text-muted mb-2">${p.descripcion || ''}</div>
            <div class="mb-2">
              <label class="fw-bold mb-1">Packs:</label>
              <input id="${idQty}" type="number" min="1" value="1" class="form-control" style="max-width:120px">
            </div>
            <div class="mb-2">
              <span class="fw-bold">Precio unitario:</span>
              <span id="up_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <div class="mb-3">
              <span class="fw-bold">Total:</span>
              <span id="tot_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <button class="btn btn-primary w-100" data-add="${p.id_producto}">
              <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
  }

  function cardEsqueje(p) {
    const idQty = `qty_${p.id_producto}`;
    const idNds = `opt_${p.id_producto}_nds`;
    const ndsObj = (p.opciones || []).find(o => (o.nombre || '').toUpperCase() === 'NDS');
    const hasNDS = !!ndsObj;
    const ndsPrice = hasNDS ? Number(ndsObj.precio_adicional || 0) : 0;
    return `
      <div class="col-md-3">
        <div class="product-card">
          <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="product-img" alt="${p.nombre}"
               onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
          <div class="p-3">
            <h3 class="mb-2">${p.nombre}</h3>
            <div class="text-muted mb-2">${p.descripcion || ''}</div>
            <div class="mb-2">
              <label class="fw-bold mb-1">Cantidad:</label>
              <input id="${idQty}" type="number" min="20" value="20" class="form-control" style="max-width:120px">
            </div>
            ${hasNDS ? `
            <div class="form-check mb-2">
              <input class="form-check-input opt-nds" type="checkbox" id="${idNds}" data-op="${ndsObj.id_opcion}" data-price="${ndsPrice}">
              <label class="form-check-label" for="${idNds}">NDS (+${S(ndsPrice)} c/u)</label>
            </div>` : ``}
            <div class="mb-2">
              <span class="fw-bold">Precio unitario:</span>
              <span id="up_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <div class="mb-3">
              <span class="fw-bold">Total:</span>
              <span id="tot_${p.id_producto}" class="price-tag">${S(Number(p.precio_unitario) * 20)}</span>
            </div>
            <button class="btn btn-primary w-100" data-add="${p.id_producto}">
              <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
  }

  // Card para Frutas
  function cardFruta(p) {
    const idQty = `qty_${p.id_producto}`;
    return `
      <div class="col-md-4">
        <div class="product-card">
          <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="product-img" alt="${p.nombre}"
               onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
          <div class="p-3">
            <h3 class="mb-2">${p.nombre}</h3>
            <div class="text-muted mb-2">${p.descripcion || ''}</div>
            <div class="mb-2">
              <label class="fw-bold mb-1">Cantidad (Kg):</label>
              <input id="${idQty}" type="number" min="1" step="0.5" value="1" class="form-control" style="max-width:120px">
            </div>
            <div class="mb-2">
              <span class="fw-bold">Precio x Kg:</span>
              <span id="up_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <div class="mb-3">
              <span class="fw-bold">Total:</span>
              <span id="tot_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
            </div>
            <button class="btn btn-primary w-100" data-add="${p.id_producto}">
              <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
  }

  // Bind de cálculo y carrito
  function bindCalcAndCart(list) {
    list.forEach(p => {
      const qtyEl = document.getElementById(`qty_${p.id_producto}`);
      const upEl = document.getElementById(`up_${p.id_producto}`);
      const totEl = document.getElementById(`tot_${p.id_producto}`);
      const ndsEl = document.getElementById(`opt_${p.id_producto}_nds`);

      function update() {
        const q = Math.max(1, Number(qtyEl?.value || 1));
        let unit = unitPriceForQty(p, q);
        const selectedOps = [];
        if (ndsEl && ndsEl.checked) {
          unit += Number(ndsEl.dataset.price || 0);
          selectedOps.push(Number(ndsEl.dataset.op));
        }
        if (upEl) upEl.textContent = S(unit);
        if (totEl) totEl.textContent = S(unit * q);
      }

      qtyEl && qtyEl.addEventListener('input', update);
      ndsEl && ndsEl.addEventListener('change', update);
      update();

      // Add to cart
      document.querySelectorAll(`button[data-add="${p.id_producto}"]`).forEach(btn => {
        btn.addEventListener('click', () => {
          const q = Math.max(1, Number(qtyEl?.value || 1));
          let unit = unitPriceForQty(p, q);
          const selectedOps = [];
          let extraKey = '';
          if (ndsEl && ndsEl.checked) {
            unit += Number(ndsEl.dataset.price || 0);
            selectedOps.push(Number(ndsEl.dataset.op));
            extraKey = 'NDS';
          }
          addToCart({
            id_producto: p.id_producto,
            nombre: p.nombre,
            imagen_url: p.imagen_url,
            precio_unitario: unit,  // ya con opciones por unidad
            cantidad: q,
            opciones: selectedOps,
            extra_key: extraKey
          });
        });
      });
    });
  }

  function renderSection(el, list, cardFn) {
    if (!el) return;
    el.innerHTML = (list || []).map(cardFn).join('');
    bindCalcAndCart(list);
  }

  async function loadProductos() {
    try {
      const r = await fetch('/api/tienda/productos');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const productos = await r.json();

      const isEsqueje = p => (p.categoria || '').toLowerCase().includes('esquej');
      const isFruta = p => (p.categoria || '').toLowerCase().includes('fruta');
      const packs = productos.filter(p => p.es_pack === true);
      const esquejes = productos.filter(isEsqueje);
      const frutas = productos.filter(isFruta);
      const ferts = productos.filter(p => !p.es_pack && !isEsqueje(p) && !isFruta(p));

      renderSection(elFert, ferts, cardFert);
      renderSection(elPacks, packs, cardPack);
      renderSection(elEsq, esquejes, cardEsqueje);
      renderSection(elFrutas, frutas, cardFruta);
      updateCartBadge();
    } catch (e) {
      console.error('Tienda loadProductos:', e);
    }
  }

  // Eventos iniciales
  document.addEventListener('DOMContentLoaded', () => {
    loadProductos();
    updateCartBadge();
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        window.location.href = '/html/checkout.html';
      });
    }
  });
})();