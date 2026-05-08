/**
 * miCuenta.js - Lógica de la página de Perfil de Usuario (SPA Compatible)
 */
(function() {
    "use strict";

    // --- Utilidades ---
    const getToken = () => {
        const t = localStorage.getItem('token_cliente') || localStorage.getItem('token') || '';
        return (t || '').replace(/^"|"$/g, '').trim();
    };

    // --- Funciones de Carga de Datos ---
    async function cargarPerfilUsuario() {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch('/api/client/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const cliente = await response.json();
                llenarFormulario(cliente);
            } else if (response.status === 401 || response.status === 404) {
                console.warn('Sesión no válida en Mi Cuenta');
                localStorage.removeItem('token_cliente');
                window.navigateTo('/login');
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
        }
    }

    function llenarFormulario(cliente) {
        // Asegurar que los elementos existen antes de llenar
        const fields = {
            'tipo_cliente': cliente.tipo_cliente,
            'nombres': cliente.nombres || '',
            'apellidos': cliente.apellidos || '',
            'razon_social': cliente.razon_social || '',
            'numero_documento': cliente.numero_documento || '',
            'numero_documento_juridica': cliente.numero_documento || '',
            'email': cliente.email || '',
            'telefono': cliente.telefono || '',
            'direccion': cliente.direccion || ''
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }
        
        if (cliente.id_distrito) {
            setTimeout(() => {
                cargarDistritoDelCliente(cliente.id_distrito);
            }, 500);
        }
        
        mostrarCamposCliente();
    }

    async function cargarDistritoDelCliente(idDistrito) {
        try {
            const response = await fetch(`/api/distritos/${idDistrito}`);
            if (!response.ok) return;
            const distrito = await response.json();
            
            const selectDepartamento = document.getElementById('id_departamento');
            if (selectDepartamento) {
                selectDepartamento.value = distrito.id_departamento;
                await cargarDistritosPorDepartamento(distrito.id_departamento);
                
                setTimeout(() => {
                    const selectDistrito = document.getElementById('id_distrito');
                    if (selectDistrito) selectDistrito.value = idDistrito;
                }, 300);
            }
        } catch (error) {
            console.error('Error al cargar distrito del cliente:', error);
        }
    }

    async function cargarDepartamentos() {
        try {
            const response = await fetch('/api/departamentos');
            if (!response.ok) return;
            const departamentos = await response.json();
            
            const selectDistrito = document.getElementById('id_distrito');
            if (!selectDistrito) return;

            const contenedorDistrito = selectDistrito.parentElement;
            
            // Evitar duplicados si ya existe el select de departamento (SPA navigation)
            if (document.getElementById('id_departamento')) return;

            const divDepartamento = document.createElement('div');
            divDepartamento.className = 'mb-3';
            divDepartamento.innerHTML = `
                <label for="id_departamento" class="form-label">Departamento</label>
                <select class="form-select" id="id_departamento" name="id_departamento" disabled>
                    <option value="">Seleccione un departamento</option>
                </select>
            `;
            
            contenedorDistrito.parentNode.insertBefore(divDepartamento, contenedorDistrito);
            const selectDepartamento = document.getElementById('id_departamento');
            
            departamentos.forEach(dep => {
                const option = document.createElement('option');
                option.value = dep.id_departamento;
                option.textContent = dep.nombre_departamento;
                selectDepartamento.appendChild(option);
            });
            
            selectDistrito.previousElementSibling.textContent = 'Distrito';
            selectDepartamento.addEventListener('change', function() {
                cargarDistritosPorDepartamento(this.value);
            });
            
        } catch (error) {
            console.error('Error al cargar departamentos:', error);
        }
    }

    async function cargarDistritosPorDepartamento(idDepartamento) {
        try {
            const selectDistrito = document.getElementById('id_distrito');
            if (!selectDistrito) return;
            selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
            
            if (!idDepartamento) {
                selectDistrito.disabled = true;
                return;
            }
            
            const response = await fetch(`/api/distritos/departamento/${idDepartamento}`);
            if (!response.ok) return;
            const distritos = await response.json();
            
            distritos.forEach(distrito => {
                const option = document.createElement('option');
                option.value = distrito.id_distrito;
                option.textContent = distrito.nombre_distrito;
                selectDistrito.appendChild(option);
            });
            
            const btnEditar = document.getElementById('btnEditarPerfil');
            selectDistrito.disabled = (btnEditar && btnEditar.style.display !== 'none');
            
        } catch (error) {
            console.error('Error al cargar distritos:', error);
        }
    }

    function mostrarCamposCliente() {
        const elTipo = document.getElementById('tipo_cliente');
        if (!elTipo) return;
        const tipo = elTipo.value;
        const cNatural = document.getElementById('campos_natural');
        const cJuridica = document.getElementById('campos_juridica');
        if (cNatural) cNatural.style.display = (tipo === 'Natural') ? 'block' : 'none';
        if (cJuridica) cJuridica.style.display = (tipo === 'Jurídica') ? 'block' : 'none';
    }

    async function actualizarPerfil() {
        try {
            const form = document.getElementById('perfilForm');
            if (!form) return;
            const formData = new FormData(form);
            const datos = Object.fromEntries(formData);

            // Validaciones básicas
            if (datos.tipo_cliente === 'Natural') {
                datos.numero_documento = (datos.numero_documento || '').replace(/\D/g, '').slice(0, 8);
                if (datos.numero_documento.length !== 8) {
                    Swal.fire('DNI inválido', 'Debe tener 8 dígitos', 'error');
                    return;
                }
            } else {
                datos.numero_documento = (datos.numero_documento_juridica || '').replace(/\D/g, '').slice(0, 11);
                if (datos.numero_documento.length !== 11) {
                    Swal.fire('RUC inválido', 'Debe tener 11 dígitos', 'error');
                    return;
                }
            }

            const token = getToken();
            const response = await fetch('/api/client/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            if (response.ok) {
                Swal.fire('¡Éxito!', 'Datos actualizados', 'success');
                toggleEdicion(false);
                cargarPerfilUsuario();
                window.dispatchEvent(new CustomEvent('authUpdated'));
            } else {
                const res = await response.json();
                Swal.fire('Error', res.message || 'No se pudo actualizar', 'error');
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
        }
    }

    const toggleEdicion = (habilitar) => {
        const form = document.getElementById('perfilForm');
        if (!form) return;
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => input.disabled = !habilitar);
        
        const btnEditar = document.getElementById('btnEditarPerfil');
        const btnGuardar = document.getElementById('btnGuardarCambios');
        const btnCancelar = document.getElementById('btnCancelarEdicion');
        const seccionPass = document.getElementById('seccionPassword');

        if (btnEditar) btnEditar.style.display = habilitar ? 'none' : 'inline-block';
        if (btnGuardar) btnGuardar.style.display = habilitar ? 'inline-block' : 'none';
        if (btnCancelar) btnCancelar.style.display = habilitar ? 'inline-block' : 'none';
        if (seccionPass) seccionPass.style.display = habilitar ? 'block' : 'none';
    };

    // --- Inicialización ---
    const init = () => {
        const token = getToken();
        if (!token) {
            window.navigateTo('/login');
            return;
        }

        // Carga inicial
        setTimeout(() => {
            cargarPerfilUsuario();
            cargarDepartamentos();
        }, 100);

        // Event Listeners
        const form = document.getElementById('perfilForm');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                actualizarPerfil();
            });
        }

        const btnEditar = document.getElementById('btnEditarPerfil');
        if (btnEditar) btnEditar.addEventListener('click', () => toggleEdicion(true));

        const btnCancelar = document.getElementById('btnCancelarEdicion');
        if (btnCancelar) btnCancelar.addEventListener('click', () => {
            toggleEdicion(false);
            cargarPerfilUsuario();
        });

        const btnEliminar = document.getElementById('btnEliminarCuenta');
        if (btnEliminar) btnEliminar.addEventListener('click', () => {
            if (typeof confirmarEliminacionCuenta === 'function') {
                confirmarEliminacionCuenta();
            } else {
                Swal.fire('Info', 'Funcionalidad en desarrollo', 'info');
            }
        });

        // Manejar pestaña de pedidos desde URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'pedidos') {
            const tabBtn = document.getElementById('pedidos-tab');
            if (tabBtn) {
                const tab = new bootstrap.Tab(tabBtn);
                tab.show();
            }
        }
    };

    // Ejecución inmediata (el router inyecta y ejecuta)
    init();

})();
