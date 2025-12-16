// Convertir a función global en lugar de DOMContentLoaded
window.initProductosListado = async function () {
    console.log('🟢 Ejecutando initProductosListado desde listar.js');
    
    const token = localStorage.getItem('panel_token') || localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token');
        window.location.href = '/html/panel_control/login-panel.html';
        return;
    }

    // Esperar a que el DOM esté listo
    const tbody = document.querySelector('#tablaProductos tbody');
    if (!tbody) {
        console.warn('⚠️ Tabla no encontrada, reintentando...');
        setTimeout(window.initProductosListado, 25);
        return;
    }

    try {
        console.log('📡 Haciendo petición a /api/panel/productos...');
        const response = await fetch('/api/panel/productos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const productos = await response.json();
            console.log('📦 Productos recibidos:', productos);
            console.log('📊 Cantidad productos:', productos.length);
            
            if (!Array.isArray(productos) || productos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-warning">No hay productos registrados</td></tr>`;
                return;
            }

            tbody.innerHTML = productos.map(p => `
                <tr>
                    <td>
                        ${p.imagen_url 
                            ? `<img src="${p.imagen_url}" class="producto-imagen" alt="${p.nombre}" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                               <div class="producto-imagen-placeholder" style="display:none">
                                   <i class="fas fa-image"></i>
                               </div>`
                            : `<div class="producto-imagen-placeholder">
                                   <i class="fas fa-image"></i>
                               </div>`
                        }
                    </td>
                    <td>
                        <div class="fw-medium" title="${p.nombre || 'N/A'}">${p.nombre || 'N/A'}</div>
                        ${p.descripcion 
                            ? `<small class="text-muted" title="${p.descripcion}">
                                   ${p.descripcion.length > 50 ? p.descripcion.substring(0, 50) + '...' : p.descripcion}
                               </small>` 
                            : '<small class="text-muted">Sin descripción</small>'
                        }
                    </td>
                    <td>
                        <span class="badge bg-secondary">${p.categoria || 'Sin categoría'}</span>
                    </td>
                    <td>
                        <span class="badge ${obtenerClaseStock(p.stock)}">
                            ${parseInt(p.stock) || 0} ${p.unidad_medida || 'unid'}
                        </span>
                    </td>
                    <td>
                        <span class="fw-medium text-success">S/ ${parseFloat(p.precio_unitario || 0).toFixed(2)}</span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" title="Editar" onclick="editarProducto(${p.id_producto})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // ✅ FUNCIÓN GLOBAL PARA EDITAR PRODUCTO
            window.editarProducto = function(id) {
                console.log('📝 Editando producto ID:', id);
                
                // Verificar que el panel control existe
                if (window.panelControl && typeof window.panelControl.loadActualizarProducto === 'function') {
                    window.panelControl.loadActualizarProducto(id);
                } else {
                    console.error('Panel control no disponible o método no encontrado');
                    console.log('window.panelControl:', window.panelControl);
                    
                    // Fallback: recargar la página con parámetro
                    window.location.href = `/html/panel_control/producto/actualizar.html?id=${id}`;
                }
            };

            console.log('✅ Productos cargados correctamente');
        } else {
            let errorMsg = 'Error al cargar productos';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
                console.error('❌ Error del servidor:', errorData);
            } catch (e) {
                console.error('❌ Error parsing response:', e);
            }
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${errorMsg}</td></tr>`;
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error de conexión</td></tr>`;
    }
};

// Función auxiliar para determinar la clase del badge de stock
function obtenerClaseStock(stock) {
    const stockNum = parseInt(stock) || 0;
    if (stockNum === 0) return 'bg-danger';
    if (stockNum < 10) return 'bg-warning text-dark';
    if (stockNum < 50) return 'bg-info';
    return 'bg-success';
}

