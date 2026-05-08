/**
 * Agroconecta JS - Controlador de la Vista de Inicio
 */
(function () {
  
  async function loadProductos() {
    // Selectores sincronizados con inicio.html
    const elFert = document.getElementById('gridFertilizantes');
    const elPacks = document.getElementById('gridPacks');
    const elEsq = document.getElementById('gridEsquejes');
    const elFrutas = document.getElementById('gridFrutas');

    // Si no están los contenedores, reintentar (el Router SPA podría estar inyectando el HTML)
    if (!elFert && !elPacks) {
        setTimeout(loadProductos, 300);
        return;
    }

    try {
      const response = await fetch('/api/tienda/productos');
      const data = await response.json();
      const productos = Array.isArray(data) ? data : (data.data || []);

      const isEsqueje = p => (p.categoria || '').toLowerCase().includes('esqueje');
      const isFruta = p => (p.categoria || '').toLowerCase().includes('fruta');
      
      const renderSection = (container, items, type) => {
        if (!container) return;
        container.innerHTML = items.length > 0 
          ? items.map(it => card(it, type)).join('') 
          : '<p class="text-muted text-center w-100 py-3">No hay productos disponibles.</p>';
      };

      const card = (it, type) => {
        if (window.createProductCard) return window.createProductCard(it, type);
        return `<div class="col-md-4 mb-3"><div>${it.nombre}</div></div>`;
      };

      renderSection(elFert, productos.filter(p => !p.es_pack && !isEsqueje(p) && !isFruta(p)), 'fertilizante');
      renderSection(elPacks, productos.filter(p => p.es_pack === true), 'pack');
      renderSection(elEsq, productos.filter(isEsqueje), 'esqueje');
      renderSection(elFrutas, productos.filter(isFruta), 'fruta');

      const tryBind = () => {
        if (window.bindCalcAndCart) {
          window.bindCalcAndCart(productos);
        } else {
          // Si search-filters.js aún no carga, reintentar brevemente
          setTimeout(tryBind, 100);
        }
      };
      tryBind();

    } catch (e) {
      console.error('Error al cargar productos:', e);
    }
  }

  const init = () => {
    loadProductos();
  };

  // Ejecutar inmediatamente para SPA
  init();
})();