(function () {
    let currentProduct = null;
    let selectedOptions = {};

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const S = (price) => `S/ ${Number(price).toFixed(2)}`;

    async function loadProduct() {
        if (!productId) {
            showError();
            return;
        }

        try {
            document.getElementById('loadingSpinner').style.display = 'block';
            const response = await fetch(`/api/productos/${productId}`);
            const data = await response.json();

            if (!data.success || !data.data) {
                showError();
                return;
            }

            currentProduct = data.data;
            renderProductDetail();
            loadRelatedProducts(currentProduct.categoria);
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('productContent').style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            showError();
        }
    }

    function renderProductDetail() {
        document.getElementById('productName').textContent = currentProduct.nombre;
        document.getElementById('productDescription').textContent = currentProduct.descripcion;
        document.getElementById('productMainImage').src = currentProduct.imagen_url || '/icono/favicon-96x96.png';
        
        const priceEl = document.getElementById('productPrice');
        priceEl.textContent = S(currentProduct.precio_unitario);
        
        const stockEl = document.getElementById('productStock');
        const stock = Number(currentProduct.stock || 0);
        stockEl.textContent = `${stock} unidades disponibles`;
        
        if (stock <= 0) {
            stockEl.className = 'text-danger fw-bold';
            document.getElementById('btnAddToCart').disabled = true;
        }

        renderOptions();
        updatePrice();
    }

    function renderOptions() {
        const container = document.getElementById('additionalOptions');
        if (!container) return;
        container.innerHTML = '';

        if (currentProduct.categoria && currentProduct.categoria.toLowerCase().includes('esqueje')) {
            const ndsOption = `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="optionNDS" data-price="5">
                    <label class="form-check-label" for="optionNDS">
                        Certificado NDS (+ ${S(5)})
                    </label>
                </div>
            `;
            container.innerHTML = ndsOption;
            document.getElementById('optionNDS').addEventListener('change', updatePrice);
        }
    }

    function updatePrice() {
        const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
        let basePrice = getUnitPriceForQuantity(quantity);
        
        const ndsCheckbox = document.getElementById('optionNDS');
        if (ndsCheckbox && ndsCheckbox.checked) {
            basePrice += Number(ndsCheckbox.dataset.price || 0);
        }

        document.getElementById('productPrice').textContent = S(basePrice * quantity);
    }

    function getUnitPriceForQuantity(qty) {
        let basePrice = Number(currentProduct.precio_unitario);
        // Lógica de escala de precios si existiera
        return basePrice;
    }

    // La función addToCart ahora es global y reside en cart-sync.js

    function handleAddToCartClick() {
        if (!currentProduct) return;
        const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
        
        let unitPrice = getUnitPriceForQuantity(quantity);
        const ndsCheckbox = document.getElementById('optionNDS');
        let extraKey = '';
        if (ndsCheckbox && ndsCheckbox.checked) {
            unitPrice += Number(ndsCheckbox.dataset.price || 0);
            extraKey = 'NDS';
        }

        window.addToCart({
            id_producto: currentProduct.id_producto,
            nombre: currentProduct.nombre,
            imagen_url: currentProduct.imagen_url,
            precio_unitario: unitPrice,
            cantidad: quantity,
            extra_key: extraKey
        });
    }

    async function loadRelatedProducts(category) {
        const container = document.getElementById('relatedProducts');
        if (!container) return;

        try {
            const response = await fetch('/api/productos');
            const data = await response.json();
            const all = data.data || [];
            const related = all.filter(p => p.categoria === category && p.id_producto !== currentProduct.id_producto).slice(0, 4);
            renderRelated(related);
        } catch (e) { console.error(e); }
    }

    function renderRelated(products) {
        const container = document.getElementById('relatedProducts');
        if (!container || products.length === 0) return;

        container.innerHTML = products.map(p => `
            <div class="col-md-3">
                <a href="/producto?id=${p.id_producto}" class="text-decoration-none">
                    <div class="card related-product h-100">
                        <img src="${p.imagen_url || '/icono/favicon-96x96.png'}" class="card-img-top" style="height:150px;object-fit:contain;">
                        <div class="card-body p-2">
                            <h6 class="card-title small mb-1">${p.nombre}</h6>
                            <span class="text-success fw-bold small">${S(p.precio_unitario)}</span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
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

    const initView = () => {
        loadProduct();
        const btn = document.getElementById('btnAddToCart');
        if (btn) btn.onclick = handleAddToCartClick;
        const qtyInput = document.getElementById('quantity');
        if (qtyInput) qtyInput.oninput = updatePrice;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initView);
    } else {
        initView();
    }
})();
