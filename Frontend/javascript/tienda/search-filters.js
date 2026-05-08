// Extensión para búsqueda y filtros en la tienda
(function () {
    let allProductos = [];
    let currentFilters = {
        search: '',
        category: '',
        sort: 'default'
    };

    // Función de inicialización
    const initSearch = () => {
        initSearchAndFilters();
    };

    // Ejecutar inicialización inmediata para SPA
    initSearch();

    function initSearchAndFilters() {
        const searchInput = document.getElementById('searchInput');
        const filterCategory = document.getElementById('filterCategory');
        const sortBy = document.getElementById('sortBy');
        const btnClearFilters = document.getElementById('btnClearFilters');

        if (!searchInput || !filterCategory || !sortBy) {
            console.warn('Controles de búsqueda no encontrados');
            return;
        }

        // Cargar productos y categorías
        loadProductosForFilter();

        // Event listeners
        searchInput.addEventListener('input', debounce(() => {
            currentFilters.search = searchInput.value.trim().toLowerCase();
            applyFilters();
        }, 300));

        filterCategory.addEventListener('change', () => {
            currentFilters.category = filterCategory.value;
            applyFilters();
        });

        sortBy.addEventListener('change', () => {
            currentFilters.sort = sortBy.value;
            applyFilters();
        });

        btnClearFilters.addEventListener('click', () => {
            searchInput.value = '';
            filterCategory.value = '';
            sortBy.value = 'default';
            currentFilters = { search: '', category: '', sort: 'default' };
            applyFilters();
        });
    }

    async function loadProductosForFilter() {
        try {
            const r = await fetch('/api/tienda/productos');
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            allProductos = await r.json();

            // Llenar dropdown de categorías
            fillCategoryDropdown();
        } catch (e) {
            console.error('Error cargando productos para filtros:', e);
        }
    }

    function fillCategoryDropdown() {
        const filterCategory = document.getElementById('filterCategory');
        if (!filterCategory) return;

        // Obtener categorías únicas
        const categories = [...new Set(allProductos.map(p => p.categoria).filter(Boolean))];

        // Limpiar opciones existentes (excepto "Todas")
        filterCategory.innerHTML = '<option value="">Todas las categorías</option>';

        // Agregar categorías
        categories.sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            filterCategory.appendChild(option);
        });
    }

    function applyFilters() {
        let filtered = [...allProductos];

        // Aplicar búsqueda
        if (currentFilters.search) {
            filtered = filtered.filter(p =>
                (p.nombre || '').toLowerCase().includes(currentFilters.search) ||
                (p.descripcion || '').toLowerCase().includes(currentFilters.search)
            );
        }

        // Aplicar filtro de categoría
        if (currentFilters.category) {
            filtered = filtered.filter(p => p.categoria === currentFilters.category);
        }

        // Aplicar ordenamiento
        filtered = sortProducts(filtered, currentFilters.sort);

        // Renderizar productos filtrados
        renderFilteredProducts(filtered);

        // Actualizar mensaje de resultados
        updateFilterResults(filtered.length);
    }

    function sortProducts(products, sortType) {
        const sorted = [...products];

        switch (sortType) {
            case 'name-asc':
                return sorted.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            case 'name-desc':
                return sorted.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
            case 'price-asc':
                return sorted.sort((a, b) => Number(a.precio_unitario || 0) - Number(b.precio_unitario || 0));
            case 'price-desc':
                return sorted.sort((a, b) => Number(b.precio_unitario || 0) - Number(a.precio_unitario || 0));
            default:
                return sorted;
        }
    }

    function renderFilteredProducts(products) {
        const elFert = document.getElementById('gridFertilizantes');
        const elPacks = document.getElementById('gridPacks');
        const elEsq = document.getElementById('gridEsquejes');
        const elFrutas = document.getElementById('gridFrutas'); // ✅ FIX: incluir sección frutas

        if (!elFert || !elPacks || !elEsq) return;

        // Clasificar productos (idéntico a agroconecta.js para consistencia)
        const isEsqueje = p => (p.categoria || '').toLowerCase().includes('esquej');
        const isFruta = p => (p.categoria || '').toLowerCase().includes('fruta'); // ✅ FIX
        const packs = products.filter(p => p.es_pack === true);
        const esquejes = products.filter(isEsqueje);
        const frutas = products.filter(isFruta);                                  // ✅ FIX
        const ferts = products.filter(p => !p.es_pack && !isEsqueje(p) && !isFruta(p)); // ✅ FIX

        // Renderizar cada sección
        renderSection(elFert, ferts, 'fertilizante');
        renderSection(elPacks, packs, 'pack');
        renderSection(elEsq, esquejes, 'esqueje');
        if (elFrutas) renderSection(elFrutas, frutas, 'fruta');                   // ✅ FIX

        // Mostrar/ocultar secciones vacías
        toggleSection('fertilizantes', ferts.length > 0);
        toggleSection('packs', packs.length > 0);
        toggleSection('esquejes', esquejes.length > 0);
        if (elFrutas) toggleSection('frutas', frutas.length > 0);                 // ✅ FIX
    }

    function renderSection(el, products, type) {
        if (!el) return;

        if (products.length === 0) {
            el.innerHTML = '<div class="col-12 text-center text-muted py-4"><i class="fas fa-inbox fa-3x mb-3"></i><p>No se encontraron productos</p></div>';
            return;
        }

        el.innerHTML = products.map(p => createProductCard(p, type)).join('');

        // Re-bind eventos (llamar a la función del archivo original si está disponible)
        if (typeof window.bindCalcAndCart === 'function') {
            window.bindCalcAndCart(products);
        }
    }

    function createProductCard(p, type) {
        const S = v => `S/ ${Number(v || 0).toFixed(2)}`;
        const idQty = `qty_${p.id_producto}`;
        const idNds = `opt_${p.id_producto}_nds`;
        const ndsObj = (p.opciones || []).find(o => (o.nombre || '').toUpperCase() === 'NDS');
        const hasNDS = !!ndsObj;
        const ndsPrice = hasNDS ? Number(ndsObj.precio_adicional || 0) : 0;

        const colClass = type === 'esqueje' ? 'col-md-3' : 'col-md-4';
        const qtyLabel = type === 'pack' ? 'Packs' : type === 'esqueje' ? 'Cantidad' : type === 'fruta' ? 'Cantidad (Kg)' : 'Litros';
        const minQty = type === 'esqueje' ? 20 : 1;
        const defaultQty = type === 'esqueje' ? 20 : 1;
        const stepAttr = type === 'fruta' ? 'step="0.5"' : '';

        return `
      <div class="${colClass}">
        <div class="product-card">
          <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="product-img" alt="${p.nombre}"
               onerror="this.onerror=null;this.src='/icono/favicon-96x96.png'">
          <div class="p-3">
            <h3 class="mb-2">${p.nombre}</h3>
            <div class="text-muted mb-2">${p.descripcion || ''}</div>
            <div class="mb-2">
              <label class="fw-bold mb-1">${qtyLabel}:</label>
              <input id="${idQty}" type="number" min="${minQty}" value="${defaultQty}" ${stepAttr} class="form-control" style="max-width:120px">
            </div>
            ${hasNDS ? `
            <div class="form-check mb-2">
              <input class="form-check-input opt-nds" type="checkbox" id="${idNds}" data-op="${ndsObj.id_opcion}" data-price="${ndsPrice}">
              <label class="form-check-label" for="${idNds}">NDS (+${S(ndsPrice)} ${type === 'pack' ? 'por pack' : type === 'esqueje' ? 'c/u' : 'por litro'})</label>
            </div>` : ''}
            <div class="mb-2">
              <span class="fw-bold">Precio unitario:</span>
              <span id="up_${p.id_producto}" class="price-tag">${S(p.precio_unitario)}</span>
              ${type !== 'pack' ? `<small class="text-muted">/ ${p.unidad || ''}</small>` : ''}
            </div>
            <div class="mb-3">
              <span class="fw-bold">Total:</span>
              <span id="tot_${p.id_producto}" class="price-tag">${S(Number(p.precio_unitario) * defaultQty)}</span>
            </div>
            <button class="btn btn-primary w-100" data-add="${p.id_producto}">
              <i class="fas fa-cart-plus me-2"></i>Agregar al carrito
            </button>
          </div>
        </div>
      </div>`;
    }

    function bindCalcAndCart(products) {
        products.forEach(p => {
            const idQty = `qty_${p.id_producto}`;
            const idNds = `opt_${p.id_producto}_nds`;
            const idTot = `tot_${p.id_producto}`;
            const idUp = `up_${p.id_producto}`;
            
            const elQty = document.getElementById(idQty);
            const elNds = document.getElementById(idNds);
            const elTot = document.getElementById(idTot);
            const elUp = document.getElementById(idUp);
            const btnAdd = document.querySelector(`[data-add="${p.id_producto}"]`);

            const getEffectivePrice = (qty) => {
                let price = parseFloat(p.precio_unitario);
                if (p.descuentos && Array.isArray(p.descuentos)) {
                    const discount = p.descuentos.find(d => 
                        qty >= d.cantidad_minima && 
                        (!d.cantidad_maxima || qty <= d.cantidad_maxima)
                    );
                    if (discount) price = parseFloat(discount.precio_descuento);
                }
                return price;
            };

            const update = () => {
                const qty = parseFloat(elQty?.value) || 0;
                let unitPrice = getEffectivePrice(qty);
                
                if (elNds && elNds.checked) {
                    unitPrice += parseFloat(elNds.dataset.price || 0);
                }

                if (elUp) elUp.textContent = `S/ ${unitPrice.toFixed(2)}`;
                if (elTot) elTot.textContent = `S/ ${(unitPrice * qty).toFixed(2)}`;
            };

            if (elQty) elQty.addEventListener('input', update);
            if (elNds) elNds.addEventListener('change', update);

            if (btnAdd) {
                btnAdd.onclick = () => {
                    const qty = parseFloat(elQty?.value) || 0;
                    if (qty <= 0) return;

                    let unitPrice = getEffectivePrice(qty);
                    let extraKey = '';
                    let opciones = [];

                    if (elNds && elNds.checked) {
                        unitPrice += parseFloat(elNds.dataset.price || 0);
                        extraKey = 'NDS';
                        opciones.push({ id_opcion: elNds.dataset.op, nombre: 'NDS' });
                    }

                    if (typeof window.addToCart === 'function') {
                        window.addToCart({
                            id_producto: p.id_producto,
                            nombre: p.nombre,
                            imagen_url: p.imagen_url,
                            precio_unitario: unitPrice,
                            cantidad: qty,
                            extra_key: extraKey,
                            opciones: opciones
                        });
                        
                        const originalText = btnAdd.innerHTML;
                        btnAdd.innerHTML = '<i class="fas fa-check me-2"></i>¡Agregado!';
                        btnAdd.classList.replace('btn-primary', 'btn-success');
                        setTimeout(() => {
                            btnAdd.innerHTML = originalText;
                            btnAdd.classList.replace('btn-success', 'btn-primary');
                        }, 2000);
                    }
                };
            }
        });
    }

    function toggleSection(sectionId, show) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = show ? 'block' : 'none';
        }
    }

    function updateFilterResults(count) {
        const filterResults = document.getElementById('filterResults');
        if (!filterResults) return;

        const hasFilters = currentFilters.search || currentFilters.category || currentFilters.sort !== 'default';

        if (hasFilters) {
            filterResults.innerHTML = `<i class="fas fa-info-circle me-1"></i> Mostrando ${count} producto${count !== 1 ? 's' : ''}`;
        } else {
            filterResults.innerHTML = '';
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Exponer al objeto global para agroconecta.js
    window.createProductCard = createProductCard;
    window.bindCalcAndCart = bindCalcAndCart;

})();
