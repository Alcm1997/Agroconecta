(function () {
    const S = v => `S/ ${Number(v || 0).toFixed(2)}`;
    let currentProduct = null;
    let selectedOptions = [];

    // Obtener ID del producto desde URL
    function getProductId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Cargar producto
    async function loadProduct() {
        const productId = getProductId();

        if (!productId) {
            showError();
            return;
        }

        try {
            const response = await fetch(`/api/tienda/productos/${productId}`);

            if (!response.ok) {
                showError();
                return;
            }

            const product = await response.json();
            currentProduct = product;

            renderProduct(product);
            loadRelatedProducts(product.categoria);

            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('productContent').style.display = 'block';

        } catch (error) {
            console.error('Error cargando producto:', error);
            showError();
        }
    }

    // Renderizar producto
    function renderProduct(product) {
        // Imagen
        const img = document.getElementById('productImage');
        img.src = product.imagen_url || '/icono/favicon-96x96.png';
        img.alt = product.nombre;
        img.onerror = () => img.src = '/icono/favicon-96x96.png';

        // Breadcrumb
        document.getElementById('breadcrumbCategory').textContent = product.categoria || 'Productos';
        document.getElementById('breadcrumbProduct').textContent = product.nombre;

        // Información básica
        document.getElementById('productName').textContent = product.nombre;
        document.getElementById('productDescription').textContent = product.descripcion || 'Sin descripción';
        document.getElementById('productCategory').textContent = product.categoria || 'Sin categoría';

        // Stock
        const stockBadge = document.getElementById('productStock');
        const stock = Number(product.stock || 0);
        if (stock > 10) {
            stockBadge.className = 'badge stock-badge bg-success';
            stockBadge.textContent = `${stock} disponibles`;
        } else if (stock > 0) {
            stockBadge.className = 'badge stock-badge bg-warning text-dark';
            stockBadge.textContent = `Solo ${stock} disponibles`;
        } else {
            stockBadge.className = 'badge stock-badge bg-danger';
            stockBadge.textContent = 'Sin stock';
            document.getElementById('btnAddToCart').disabled = true;
        }

        // Precio
        document.getElementById('productPrice').textContent = S(product.precio_unitario);
        document.getElementById('productUnit').textContent = `/ ${product.unidad || 'unidad'}`;

        // Opciones adicionales (NDS)
        renderOptions(product.opciones || []);

        // Descuentos por volumen
        if (product.descuentos && product.descuentos.length > 0) {
            renderDiscounts(product.descuentos, product.precio_unitario);
        }

        // Calcular precio inicial
        updatePrice();

        // Event listeners
        document.getElementById('quantity').addEventListener('input', updatePrice);
        document.getElementById('btnAddToCart').addEventListener('click', addToCart);
    }

    // Renderizar opciones adicionales
    function renderOptions(options) {
        const container = document.getElementById('optionsContainer');

        if (!options || options.length === 0) {
            container.innerHTML = '';
            return;
        }

        const ndsOption = options.find(o => (o.nombre || '').toUpperCase() === 'NDS');

        if (ndsOption) {
            container.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="optionNDS" data-id="${ndsOption.id_opcion}" data-price="${ndsOption.precio_adicional}">
          <label class="form-check-label" for="optionNDS">
            <strong>NDS</strong> - Agregar ${S(ndsOption.precio_adicional)} por unidad
          </label>
        </div>
      `;

            document.getElementById('optionNDS').addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedOptions = [Number(e.target.dataset.id)];
                } else {
                    selectedOptions = [];
                }
                updatePrice();
            });
        }
    }

    // Renderizar descuentos
    function renderDiscounts(discounts, basePrice) {
        const section = document.getElementById('discountsSection');
        const tbody = document.getElementById('discountsTable');

        const sortedDiscounts = discounts.sort((a, b) =>
            Number(a.cantidad_minima) - Number(b.cantidad_minima)
        );

        tbody.innerHTML = sortedDiscounts.map(d => {
            const minQty = Number(d.cantidad_minima);
            const maxQty = d.cantidad_maxima ? Number(d.cantidad_maxima) : '∞';
            const discountPrice = Number(d.precio_descuento);
            const savings = basePrice - discountPrice;
            const savingsPercent = ((savings / basePrice) * 100).toFixed(0);

            return `
        <tr>
          <td><strong>${minQty}</strong></td>
          <td>${maxQty}</td>
          <td><span class="badge bg-success">${S(discountPrice)}</span></td>
          <td><span class="text-success">-${S(savings)} (${savingsPercent}%)</span></td>
        </tr>
      `;
        }).join('');

        section.style.display = 'block';
    }

    // Actualizar precio según cantidad y opciones
    function updatePrice() {
        if (!currentProduct) return;

        const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
        let unitPrice = getUnitPriceForQuantity(quantity);

        // Agregar precio de opciones
        const ndsCheckbox = document.getElementById('optionNDS');
        if (ndsCheckbox && ndsCheckbox.checked) {
            unitPrice += Number(ndsCheckbox.dataset.price || 0);
        }

        const total = unitPrice * quantity;
        document.getElementById('totalPrice').textContent = S(total);
    }

    // Obtener precio unitario según cantidad (con descuentos)
    function getUnitPriceForQuantity(qty) {
        const basePrice = Number(currentProduct.precio_unitario || 0);
        const discounts = currentProduct.descuentos || [];

        if (discounts.length === 0) return basePrice;

        for (const d of discounts) {
            const min = Number(d.cantidad_minima || 0);
            const max = d.cantidad_maxima ? Number(d.cantidad_maxima) : Infinity;

            if (qty >= min && qty <= max) {
                return Number(d.precio_descuento || basePrice);
            }
        }

        return basePrice;
    }

    // Agregar al carrito
    function addToCart() {
        if (!currentProduct) return;

        const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
        const stock = Number(currentProduct.stock || 0);

        // Validar stock
        if (quantity > stock) {
            alert(`Solo hay ${stock} unidades disponibles`);
            return;
        }

        let unitPrice = getUnitPriceForQuantity(quantity);
        const ndsCheckbox = document.getElementById('optionNDS');
        let extraKey = '';

        if (ndsCheckbox && ndsCheckbox.checked) {
            unitPrice += Number(ndsCheckbox.dataset.price || 0);
            extraKey = 'NDS';
        }

        // Obtener carrito actual
        const cartKey = getCartKey();
        let cart = [];
        try {
            cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        } catch (e) {
            cart = [];
        }

        // Buscar si ya existe
        const existingIndex = cart.findIndex(item =>
            item.id_producto === currentProduct.id_producto &&
            (item.extra_key || '') === extraKey
        );

        if (existingIndex >= 0) {
            cart[existingIndex].cantidad += quantity;
        } else {
            cart.push({
                id_producto: currentProduct.id_producto,
                nombre: currentProduct.nombre,
                imagen_url: currentProduct.imagen_url,
                precio_unitario: unitPrice,
                cantidad: quantity,
                opciones: selectedOptions,
                extra_key: extraKey
            });
        }

        // Guardar carrito
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartBadge();

        // Mostrar mensaje
        showToast(`${currentProduct.nombre} agregado al carrito`);
    }

    // Cargar productos relacionados
    async function loadRelatedProducts(category) {
        if (!category) return;

        try {
            const response = await fetch('/api/tienda/productos');
            if (!response.ok) return;

            const allProducts = await response.json();
            const related = allProducts
                .filter(p => p.categoria === category && p.id_producto !== currentProduct.id_producto)
                .slice(0, 4);

            renderRelatedProducts(related);
        } catch (error) {
            console.error('Error cargando productos relacionados:', error);
        }
    }

    // Renderizar productos relacionados
    function renderRelatedProducts(products) {
        const container = document.getElementById('relatedProducts');

        if (!products || products.length === 0) {
            document.getElementById('relatedSection').style.display = 'none';
            return;
        }

        container.innerHTML = products.map(p => `
      <div class="col-md-3">
        <a href="/html/producto_detalle.html?id=${p.id_producto}" class="text-decoration-none">
          <div class="card related-product h-100">
            <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" 
                 class="card-img-top" 
                 alt="${p.nombre}"
                 onerror="this.src='/icono/favicon-96x96.png'"
                 style="height:200px;object-fit:contain;">
            <div class="card-body">
              <h6 class="card-title">${p.nombre}</h6>
              <p class="card-text text-muted small">${(p.descripcion || '').substring(0, 60)}...</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-warning text-dark">${S(p.precio_unitario)}</span>
                <small class="text-muted">Ver detalle →</small>
              </div>
            </div>
          </div>
        </a>
      </div>
    `).join('');
    }

    // Utilidades
    function getCartKey() {
        try {
            const cliente = JSON.parse(localStorage.getItem('cliente') || 'null');
            return cliente?.id_cliente ? `cart_${cliente.id_cliente}` : 'cart_tmp';
        } catch {
            return 'cart_tmp';
        }
    }

    function updateCartBadge() {
        const cartBtn = document.getElementById('cartButton');
        if (!cartBtn) return;

        try {
            const cart = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
            const total = cart.reduce((sum, item) => sum + (item.cantidad || 0), 0);
            cartBtn.textContent = total > 0 ? `Carrito (${total})` : 'Carrito';
        } catch (e) {
            cartBtn.textContent = 'Carrito';
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'alert alert-success position-fixed top-0 end-0 m-3 shadow';
        toast.style.zIndex = '9999';
        toast.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    function showError() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('errorContent').style.display = 'block';
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        loadProduct();
        updateCartBadge();

        // Botón carrito
        const cartBtn = document.getElementById('cartButton');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = '/html/checkout.html';
            });
        }
    });

})();
