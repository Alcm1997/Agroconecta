window.initActualizarProducto = async function () {
  console.log('🟢 Iniciando formulario Actualizar Producto');

  // Contexto
  if (window.panelControl) {
    window.panelControl.currentSection = 'productos_actualizar';
    const title = document.getElementById('pageTitle');
    if (title) title.textContent = 'Actualizar Producto';
  }

  // Loading
  const overlay = document.getElementById('loadingOverlay');
  const showLoading = () => { if (overlay) overlay.style.display = 'flex'; };
  const hideLoading = () => { if (overlay) overlay.style.display = 'none'; };

  // Auth
  const token = localStorage.getItem('token') || localStorage.getItem('panel_token');
  if (!token) {
    alert('Sesión expirada. Inicia sesión nuevamente.');
    window.location.href = '/html/panel_control/login-panel.html';
    return;
  }

  // Refs DOM
  const form = document.getElementById('formActualizarProducto');
  const id_producto = document.getElementById('id_producto');
  const nombre = document.getElementById('nombre');
  const descripcion = document.getElementById('descripcion');
  const id_categoria = document.getElementById('id_categoria');
  const id_unidad = document.getElementById('id_unidad');
  const stock = document.getElementById('stock');
  const precio_unitario = document.getElementById('precio_unitario');
  const imagen_url = document.getElementById('imagen_url');
  const es_pack = document.getElementById('es_pack');
  const btnVolver = document.getElementById('btnVolverProductos');

  const preview = document.getElementById('previewImagen');
  const abrirImagen = document.getElementById('abrirImagen');
  const btnNormalizarDrive = document.getElementById('btnNormalizarDrive'); // no normaliza, solo informa

  const descuentosContainer = document.getElementById('descuentosContainer');
  const btnAddDescuento = document.getElementById('btnAddDescuento');
  const opcionesContainer = document.getElementById('opcionesContainer');
  const packSection = document.getElementById('packSection');
  const componentesContainer = document.getElementById('componentesContainer');
  const btnAddComponente = document.getElementById('btnAddComponente');

  let productosDisponibles = [];
  let opcionesDisponibles = [];

  // Obtener ID desde query/contexto
  function obtenerIdProducto() {
    const qsId = new URLSearchParams(location.search).get('id');
    if (qsId) return parseInt(qsId, 10);
    if (window.panelControl?.context?.id_producto) return parseInt(window.panelControl.context.id_producto, 10);
    const cache = localStorage.getItem('edit_producto_id');
    return cache ? parseInt(cache, 10) : NaN;
  }
  const productoId = obtenerIdProducto();
  if (isNaN(productoId)) {
    alert('No se encontró el producto a editar.');
    if (window.panelControl) window.panelControl.loadSection('productos');
    else window.location.href = '/html/panel_control/menu.html#productos';
    return;
  }
  localStorage.setItem('edit_producto_id', String(productoId));
  if (id_producto) id_producto.value = productoId;

  // Auxiliares (categorías, unidades, productos para pack, opciones)
  async function cargarAuxiliares() {
    try {
      const r = await fetch('/api/panel/productos/datos-auxiliares', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const aux = await r.json();
        poblarCategorias(aux.categorias || []);
        poblarUnidades(aux.unidadesMedida || []);
        productosDisponibles = aux.productos || [];
      } else {
        throw new Error('fallback');
      }
    } catch {
      const [cats, units, prods] = await Promise.all([
        fetch('/api/panel/categorias', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch('/api/panel/unidades-medida', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
        fetch('/api/panel/productos', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      ]);
      poblarCategorias(cats);
      poblarUnidades(units);
      productosDisponibles = (prods || []).map(p => ({ id_producto: p.id_producto, nombre: p.nombre }));
    }

    // Opciones disponibles (checkboxes)
    try {
      const r = await fetch('/api/panel/productos/opciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      opcionesDisponibles = r.ok ? await r.json() : [];
    } catch { opcionesDisponibles = []; }
    renderOpciones(opcionesDisponibles);
  }

  function poblarCategorias(categorias) {
    id_categoria.innerHTML = '<option value="">Cargando categorías...</option>';
    id_categoria.innerHTML = '<option value="">Seleccionar categoría...</option>';
    (categorias || []).forEach(c => {
      const o = document.createElement('option');
      o.value = c.id_categoria;
      o.textContent = c.descripcion;
      id_categoria.appendChild(o);
    });
  }

  function poblarUnidades(unidades) {
    id_unidad.innerHTML = '<option value="">Cargando unidades...</option>';
    id_unidad.innerHTML = '<option value="">Seleccionar unidad...</option>';
    (unidades || []).forEach(u => {
      const o = document.createElement('option');
      o.value = u.id_unidad;
      o.textContent = u.descripcion;
      id_unidad.appendChild(o);
    });
  }

  function renderOpciones(opciones) {
    opcionesContainer.innerHTML = '';
    (opciones || []).forEach(op => {
      const col = document.createElement('div');
      col.className = 'col-md-4 mb-2';
      col.innerHTML = `
        <div class="form-check opcion-disponible">
          <input class="form-check-input" type="checkbox" value="${op.id_opcion}" id="op_${op.id_opcion}">
          <label class="form-check-label" for="op_${op.id_opcion}">${op.descripcion}</label>
        </div>`;
      opcionesContainer.appendChild(col);
    });
  }

  // UI: descuentos
  function agregarDescuentoItem(values = {}) {
    const row = document.createElement('div');
    row.className = 'descuento-item row g-2 mb-2';
    row.innerHTML = `
      <div class="col-md-3">
        <label class="form-label">Cantidad mínima</label>
        <input type="number" class="form-control d-min" min="1" value="${values.cantidad_minima ?? ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">Cantidad máxima</label>
        <input type="number" class="form-control d-max" placeholder="Opcional" value="${values.cantidad_maxima ?? ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">Precio (S/)</label>
        <input type="number" class="form-control d-precio" min="0" step="0.01" value="${values.precio_descuento ?? ''}">
      </div>
      <div class="col-md-3 d-flex align-items-end">
        <button type="button" class="btn btn-danger btn-sm btn-del-desc"><i class="fas fa-trash"></i></button>
      </div>
    `;
    row.querySelector('.btn-del-desc').addEventListener('click', () => row.remove());
    descuentosContainer.appendChild(row);
  }
  function leerDescuentos() {
    const items = descuentosContainer.querySelectorAll('.descuento-item');
    const list = [];
    items.forEach(it => {
      const min = it.querySelector('.d-min').value;
      const max = it.querySelector('.d-max').value;
      const precio = it.querySelector('.d-precio').value;
      if (min && precio) {
        list.push({
          cantidad_minima: parseInt(min, 10),
          cantidad_maxima: max ? parseInt(max, 10) : null,
          precio_descuento: parseFloat(precio)
        });
      }
    });
    return list;
  }

  // UI: componentes pack
  function agregarComponenteItem(values = {}) {
    const row = document.createElement('div');
    row.className = 'componente-item row g-2 mb-2';
    const options = ['<option value="">Seleccionar producto...</option>']
      .concat((productosDisponibles || []).map(p => `<option value="${p.id_producto}">${p.nombre}</option>`))
      .join('');
    row.innerHTML = `
      <div class="col-md-6">
        <label class="form-label">Producto</label>
        <select class="form-select c-id">${options}</select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Cantidad</label>
        <input type="number" class="form-control c-cant" min="1" value="${values.cantidad ?? 1}">
      </div>
      <div class="col-md-3 d-flex align-items-end">
        <button type="button" class="btn btn-danger btn-sm btn-del-comp"><i class="fas fa-trash"></i></button>
      </div>
    `;
    if (values.id_producto) row.querySelector('.c-id').value = String(values.id_producto);
    row.querySelector('.btn-del-comp').addEventListener('click', () => row.remove());
    componentesContainer.appendChild(row);
  }
  function leerComponentes() {
    const rows = componentesContainer.querySelectorAll('.componente-item');
    const list = [];
    const usados = new Set();
    rows.forEach(r => {
      const idp = r.querySelector('.c-id').value;
      const cant = r.querySelector('.c-cant').value;
      if (idp && cant) {
        const idNum = parseInt(idp, 10);
        if (!usados.has(idNum)) {
          list.push({ id_producto: idNum, cantidad: parseInt(cant, 10) });
          usados.add(idNum);
        }
      }
    });
    return list;
  }
  function actualizarPackVisibility() {
    if (!es_pack) return;
    const isPack = es_pack.value === 'true';
    packSection.style.display = isPack ? 'block' : 'none';
    if (isPack && componentesContainer.childElementCount === 0) {
      agregarComponenteItem();
    }
  }

  // Cargar producto (usa tu controlador getProductoById que incluye volumenes/opciones/componentes)
  async function cargarProducto() {
    const r = await fetch(`/api/panel/productos/${productoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) throw new Error('No se pudo cargar el producto');
    const p = await r.json();

    // Base
    nombre.value = p.nombre || '';
    descripcion.value = p.descripcion || '';
    precio_unitario.value = p.precio_unitario ?? 0;
    stock.value = p.stock ?? 0;
    imagen_url.value = p.imagen_url || '';
    es_pack.value = p.es_pack ? 'true' : 'false';
    if (p.id_categoria) id_categoria.value = String(p.id_categoria);
    if (p.id_unidad) id_unidad.value = String(p.id_unidad);

    // Preview
    if (preview) preview.src = p.imagen_url || '/icono/favicon-96x96.png';
    if (abrirImagen) abrirImagen.href = p.imagen_url || '#';

    // Descuentos
    descuentosContainer.innerHTML = '';
    const volumenes = Array.isArray(p.volumenes) ? p.volumenes : [];
    if (volumenes.length) volumenes.forEach(d => agregarDescuentoItem(d));
    else agregarDescuentoItem();

    // Opciones seleccionadas
    const seleccionadas = new Set((p.opciones || []).map(o => o.id_opcion));
    opcionesContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.checked = seleccionadas.has(parseInt(chk.value, 10));
    });

    // Componentes pack
    componentesContainer.innerHTML = '';
    const comps = Array.isArray(p.componentes) ? p.componentes : [];
    if (p.es_pack) {
      if (comps.length) comps.forEach(c => agregarComponenteItem({ id_producto: c.id_producto, cantidad: c.cantidad }));
      else agregarComponenteItem();
    }
    actualizarPackVisibility();
  }

  // Validaciones
  function validar() {
    if (!nombre.value.trim()) { alert('El nombre es obligatorio.'); nombre.focus(); return false; }
    if (nombre.value.trim().length > 50) { alert('Máximo 50 caracteres para el nombre.'); nombre.focus(); return false; }
    if (!id_categoria.value) { alert('Seleccione una categoría.'); id_categoria.focus(); return false; }
    if (!id_unidad.value) { alert('Seleccione una unidad de medida.'); id_unidad.focus(); return false; }
    if (descripcion.value && descripcion.value.length > 500) { alert('Máximo 500 caracteres en descripción.'); descripcion.focus(); return false; }

    const p = precio_unitario.value ? parseFloat(precio_unitario.value) : 0;
    if (isNaN(p) || p < 0) { alert('El precio unitario debe ser >= 0.'); precio_unitario.focus(); return false; }

    const s = stock.value ? parseInt(stock.value, 10) : 0;
    if (isNaN(s) || s < 0) { alert('El stock debe ser >= 0.'); stock.focus(); return false; }

    // Descuentos
    const des = leerDescuentos();
    for (let i = 0; i < des.length; i++) {
      const d = des[i];
      if (d.cantidad_minima < 1) { alert(`Cantidad mínima inválida en nivel ${i + 1}`); return false; }
      if (d.cantidad_maxima !== null && d.cantidad_maxima <= d.cantidad_minima) {
        alert(`La cantidad máxima debe ser > a la mínima (nivel ${i + 1})`); return false;
      }
      if (d.precio_descuento < 0) { alert(`Precio inválido en nivel ${i + 1}`); return false; }
    }
    return true;
  }

  // Eventos
  if (stock) stock.addEventListener('input', e => { if (e.target.value < 0) e.target.value = 0; });
  if (precio_unitario) precio_unitario.addEventListener('input', e => { if (e.target.value < 0) e.target.value = 0; });
  if (imagen_url) {
    imagen_url.addEventListener('input', () => {
      const v = imagen_url.value.trim();
      if (preview) preview.src = v || '/icono/favicon-96x96.png';
      if (abrirImagen) abrirImagen.href = v || '#';
    });
  }
  if (btnNormalizarDrive) {
    btnNormalizarDrive.addEventListener('click', () => {
      alert('Normalización deshabilitada.');
    });
  }
  if (es_pack) es_pack.addEventListener('change', () => actualizarPackVisibility());
  if (btnAddDescuento) btnAddDescuento.addEventListener('click', () => agregarDescuentoItem());
  if (btnAddComponente) btnAddComponente.addEventListener('click', () => agregarComponenteItem());
  if (btnVolver) {
    btnVolver.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.panelControl) window.panelControl.loadSection('productos');
      else window.location.href = '/html/panel_control/menu.html#productos';
    });
  }

  // Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validar()) return;

      const payload = {
        nombre: nombre.value.trim(),
        descripcion: (descripcion.value.trim() || null),
        id_categoria: parseInt(id_categoria.value, 10),
        id_unidad: parseInt(id_unidad.value, 10),
        stock: stock.value ? parseInt(stock.value, 10) : 0,
        precio_unitario: precio_unitario.value ? parseFloat(precio_unitario.value) : 0,
        imagen_url: (imagen_url.value.trim() || null),
        es_pack: es_pack && es_pack.value === 'true'
      };

      const descuentos = leerDescuentos();
      const ids_opcion = Array.from(opcionesContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(ch => parseInt(ch.value, 10));
      const componentes = leerComponentes();

      const btnSubmit = form.querySelector('button[type="submit"]');
      const prev = btnSubmit ? btnSubmit.innerHTML : '';
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...'; }
      showLoading();

      try {
        // 1) PUT producto base
        const res = await fetch(`/api/panel/productos/${productoId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const base = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(base?.message || `Error (${res.status}) al guardar el producto`);

        // 2) POST descuentos (reemplazo, permite [])
        const rDesc = await fetch(`/api/panel/productos/${productoId}/descuentos`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(descuentos)
        });
        if (!rDesc.ok) {
          const e2 = await rDesc.json().catch(() => ({}));
          throw new Error(e2.message || 'No se pudieron guardar los descuentos');
        }

        // 3) POST opciones (reemplazo)
        const rOpt = await fetch(`/api/panel/productos/${productoId}/opciones`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids_opcion })
        });
        if (!rOpt.ok) {
          const e3 = await rOpt.json().catch(() => ({}));
          throw new Error(e3.message || 'No se pudieron guardar las opciones');
        }

        // 4) POST componentes (si es pack) o limpiar si no
        if (payload.es_pack) {
          const rComp = await fetch(`/api/panel/productos/${productoId}/componentes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(componentes)
          });
          if (!rComp.ok) {
            const e4 = await rComp.json().catch(() => ({}));
            throw new Error(e4.message || 'No se pudieron guardar los componentes del pack');
          }
        } else {
          await fetch(`/api/panel/productos/${productoId}/componentes`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify([])
          }).catch(() => {});
        }

        if (window.Swal) {
          await Swal.fire({ icon: 'success', title: 'Cambios guardados', text: 'El producto se actualizó correctamente.', confirmButtonColor: '#2E7D32' });
        } else {
          alert('Producto actualizado correctamente.');
        }
        if (window.panelControl) window.panelControl.loadSection('productos');
        else window.location.href = '/html/panel_control/menu.html#productos';
      } catch (err) {
        console.error('❌ Actualización:', err);
        if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Fallo en la actualización.' });
        else alert(err.message || 'Error en la actualización.');
      } finally {
        hideLoading();
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = prev; }
      }
    });
  }

  // Init
  try {
    showLoading();
    await cargarAuxiliares();   // cat, unidades, productos, opciones
    await cargarProducto();     // base + volumenes + opciones + componentes
    if (nombre) nombre.focus();
  } catch (e) {
    console.error('❌ Error iniciando edición:', e);
    alert('No se pudo cargar el producto.');
    if (window.panelControl) window.panelControl.loadSection('productos');
  } finally {
    hideLoading();
  }
};