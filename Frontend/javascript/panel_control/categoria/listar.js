// Inicializador global
window.initCategoriasListado = async function () {
    console.log('🟢 Ejecutando initCategoriasListado');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/panel-login';
        return;
    }

    const tbody = document.querySelector('#tablaCategorias tbody');
    if (!tbody) {
        console.warn('⚠️ Tabla de categorías no lista, reintentando...');
        setTimeout(window.initCategoriasListado, 25);
        return;
    }

    try {
        console.log('📡 GET /api/panel/categorias');
        const res = await fetch('/api/panel/categorias', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${err.message || 'Error al cargar categorías'}</td></tr>`;
            return;
        }

        const categorias = await res.json();

        if (categorias.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-warning">No hay categorías registradas</td></tr>`;
        } else {
            tbody.innerHTML = categorias.map(c => `
                <tr>
                    <td>${c.id_categoria}</td>
                    <td>${c.descripcion}</td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" title="Editar" onclick="editarCategoria(${c.id_categoria})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error de conexión</td></tr>`;
    }
};

// Modal nueva categoría
window.mostrarModalNuevaCategoria = function() {
    document.getElementById('tituloModal').textContent = 'Nueva Categoría';
    document.getElementById('categoriaId').value = '';
    document.getElementById('descripcion').value = '';
    new bootstrap.Modal(document.getElementById('modalCategoria')).show();
};

// Editar categoría
window.editarCategoria = async function(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/panel/categorias/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const categoria = await res.json();
            document.getElementById('tituloModal').textContent = 'Editar Categoría';
            document.getElementById('categoriaId').value = categoria.id_categoria;
            document.getElementById('descripcion').value = categoria.descripcion;
            new bootstrap.Modal(document.getElementById('modalCategoria')).show();
        }
    } catch (error) {
        console.error('Error al cargar categoría:', error);
    }
};

// Guardar categoría
window.guardarCategoria = async function() {
    const token = localStorage.getItem('token');
    const id = document.getElementById('categoriaId').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    if (!descripcion) {
        Swal.fire('Error', 'La descripción es requerida', 'error');
        return;
    }

    try {
        const url = id ? `/api/panel/categorias/${id}` : '/api/panel/categorias';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ descripcion })
        });

        const result = await res.json();

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
            Swal.fire('Éxito', result.message, 'success');
            window.initCategoriasListado();
        } else {
            Swal.fire('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
};
