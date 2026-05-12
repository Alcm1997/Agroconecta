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

    const formatTelefono = (valor) => {
        if (!valor) return '';
        let v = valor.replace(/\D/g, '');
        if (v.length > 9) v = v.slice(0, 9);
        const parts = v.match(/.{1,3}/g);
        return parts ? parts.join(' ') : v;
    };

    const calcularFortaleza = (password) => {
        let score = 0;
        if (!password) return { score: 0, label: 'Esperando...', class: '' };
        if (password.length >= 8) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/[0-9]/.test(password)) score += 25;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25;
        if (score <= 25) return { score, label: 'Débil', class: 'strength-weak' };
        if (score <= 50) return { score, label: 'Regular', class: 'strength-medium' };
        if (score <= 75) return { score, label: 'Buena', class: 'strength-good' };
        return { score, label: 'Fuerte', class: 'strength-strong' };
    };

    const actualizarMedidorFortaleza = (fortaleza) => {
        const meterBar = document.getElementById('meterBar');
        const meterText = document.getElementById('meterText')?.querySelector('span');
        if (meterBar && meterText) {
            meterBar.className = 'meter-bar';
            if (fortaleza.class) meterBar.classList.add(fortaleza.class);
            meterText.textContent = fortaleza.label;
            if (fortaleza.score <= 25) meterText.style.color = '#ff4d4d';
            else if (fortaleza.score <= 50) meterText.style.color = '#ffa500';
            else if (fortaleza.score <= 75) meterText.style.color = '#ffd700';
            else meterText.style.color = '#2ecc71';
        }
    };

    window.togglePassword = (inputId, iconId) => {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (input && icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            }
        }
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
            'telefono': formatTelefono(cliente.telefono || ''),
            'direccion': cliente.direccion || ''
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }
        
        // Manejar Tipo de Cliente (Dropdown Custom)
        const tipo = cliente.tipo_cliente || 'Natural';
        const inputTipo = document.getElementById('tipo_cliente');
        const labelTipo = document.getElementById('tipoClienteSelectedText');
        if (inputTipo) inputTipo.value = tipo;
        if (labelTipo) labelTipo.textContent = tipo;

        if (cliente.id_distrito) {
            setTimeout(() => {
                cargarDistritoDelCliente(cliente.id_distrito);
            }, 500);
        } else {
            const depLabel = document.getElementById('depSelectedText');
            const distLabel = document.getElementById('distSelectedText');
            if (depLabel) depLabel.textContent = 'Seleccione departamento...';
            if (distLabel) distLabel.textContent = 'Seleccione distrito...';
            const inputDep = document.getElementById('id_departamento');
            const inputDist = document.getElementById('id_distrito');
            if (inputDep) inputDep.value = '';
            if (inputDist) inputDist.value = '';
        }
        
        mostrarCamposCliente();
    }

    async function cargarDistritoDelCliente(idDistrito) {
        try {
            // 1. Obtener datos del distrito desde la API
            const response = await fetch(`/api/distritos/${idDistrito}`);
            if (!response.ok) return;
            const distrito = await response.json();
            
            const inputDep = document.getElementById('id_departamento');
            const labelDep = document.getElementById('depSelectedText');
            
            if (inputDep && labelDep) {
                // 2. Sincronizar Departamento
                const idDep = distrito.id_departamento;
                inputDep.value = idDep;
                
                // Buscar el nombre en la lista ya cargada
                const depOptions = document.querySelectorAll('#depOptions .dropdown-item');
                let depNombre = 'Departamento';
                depOptions.forEach(opt => {
                    if (opt.dataset.id == idDep) depNombre = opt.textContent;
                });
                labelDep.textContent = depNombre;
                
                // 3. Cargar Distritos de ese departamento
                await cargarDistritosPorDepartamento(idDep);
                
                // 4. Sincronizar Distrito (pequeño delay para asegurar renderizado)
                setTimeout(() => {
                    const inputDist = document.getElementById('id_distrito');
                    const labelDist = document.getElementById('distSelectedText');
                    if (inputDist && labelDist) {
                        inputDist.value = idDistrito;
                        const distOptions = document.querySelectorAll('#distOptions .dropdown-item');
                        let distNombre = 'Distrito';
                        distOptions.forEach(opt => {
                            if (opt.dataset.id == idDistrito) distNombre = opt.textContent;
                        });
                        labelDist.textContent = distNombre;
                    }
                }, 100);
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
            
            const container = document.getElementById('depOptions');
            if (!container) return;

            container.innerHTML = '';
            departamentos.forEach(dep => {
                const li = document.createElement('li');
                li.innerHTML = `<button class="dropdown-item" type="button" data-id="${dep.id_departamento}">${dep.nombre_departamento}</button>`;
                container.appendChild(li);
            });

            // Eventos de selección
            container.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = e.target.dataset.id;
                    const text = e.target.textContent;

                    document.getElementById('id_departamento').value = id;
                    document.getElementById('depSelectedText').textContent = text;
                    
                    // Reset distrito
                    document.getElementById('id_distrito').value = '';
                    document.getElementById('distSelectedText').textContent = 'Seleccione distrito...';
                    
                    cargarDistritosPorDepartamento(id);
                    
                    const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById('depDropdown'));
                    if (bsDropdown) bsDropdown.hide();
                });
            });
            
        } catch (error) {
            console.error('Error al cargar departamentos:', error);
        }
    }

    async function cargarDistritosPorDepartamento(idDepartamento) {
        try {
            const container = document.getElementById('distOptions');
            if (!container) return;
            container.innerHTML = '';
            
            const btnDist = document.getElementById('distDropdown');
            if (!idDepartamento) {
                if (btnDist) btnDist.disabled = true;
                return;
            }
            
            const response = await fetch(`/api/distritos/departamento/${idDepartamento}`);
            if (!response.ok) return;
            const distritos = await response.json();
            
            distritos.forEach(distrito => {
                const li = document.createElement('li');
                li.innerHTML = `<button class="dropdown-item" type="button" data-id="${distrito.id_distrito}">${distrito.nombre_distrito}</button>`;
                container.appendChild(li);
            });

            // Eventos de selección
            container.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const id = e.target.dataset.id;
                    const text = e.target.textContent;

                    document.getElementById('id_distrito').value = id;
                    document.getElementById('distSelectedText').textContent = text;
                    
                    const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById('distDropdown'));
                    if (bsDropdown) bsDropdown.hide();
                });
            });
            
            const btnEditar = document.getElementById('btnEditarPerfil');
            if (btnDist) btnDist.disabled = (btnEditar && btnEditar.style.display !== 'none');
            
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

            // Validaciones y limpieza
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,15}$/;

            if (!datos.email || datos.email.length > 50 || !emailRegex.test(datos.email)) {
                Swal.fire('Correo Inválido', 'Máximo 50 caracteres y formato válido.', 'error');
                return;
            }

            if (datos.direccion && datos.direccion.length > 150) {
                Swal.fire('Dirección Inválida', 'Máximo 150 caracteres.', 'error');
                return;
            }

            if (datos.contrasena && datos.contrasena.trim() !== '') {
                if (!passRegex.test(datos.contrasena)) {
                    Swal.fire('Contraseña Débil', 'Debe tener 8-15 caracteres, incluir letras, números y un símbolo.', 'error');
                    return;
                }
                if (datos.contrasena !== datos.confirmar_contrasena) {
                    Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
                    return;
                }
            }

            datos.telefono = (datos.telefono || '').replace(/\s/g, '');
            if (datos.telefono.length !== 9) {
                Swal.fire('Teléfono Inválido', 'Debe tener exactamente 9 dígitos.', 'error');
                return;
            }

            if (datos.tipo_cliente === 'Natural') {
                datos.numero_documento = (datos.numero_documento || '').replace(/\D/g, '').slice(0, 8);
                if (datos.numero_documento.length !== 8) {
                    Swal.fire('DNI inválido', 'Debe tener 8 dígitos', 'error');
                    return;
                }
                datos.razon_social = null;
            } else {
                datos.numero_documento = (datos.numero_documento_juridica || '').replace(/\D/g, '').slice(0, 11);
                if (datos.numero_documento.length !== 11) {
                    Swal.fire('RUC inválido', 'Debe tener 11 dígitos', 'error');
                    return;
                }
                if (!datos.razon_social || datos.razon_social.length > 60) {
                    Swal.fire('Razón Social Inválida', 'Es obligatoria y máximo 60 caracteres.', 'error');
                    return;
                }
                datos.nombres = null;
                datos.apellidos = null;
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
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Datos actualizados',
                    icon: 'success',
                    customClass: {
                        popup: 'swal2-modal-responsive'
                    }
                });
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
    
    async function confirmarEliminacionCuenta() {
        try {
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: "Tu cuenta se desactivará temporalmente. Para reactivarla, deberás contactar con soporte técnico.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E91E63',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-pause me-2"></i>Sí, desactivar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
                customClass: {
                    popup: 'swal2-modal-responsive'
                }
            });

            if (result.isConfirmed) {
                const token = getToken();
                if (!token) return;

                const response = await fetch('/api/client/account', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    await Swal.fire({
                        title: 'Cuenta Desactivada',
                        text: data.message || 'Tu sesión se cerrará ahora.',
                        icon: 'success',
                        confirmButtonColor: '#2E7D32',
                        customClass: {
                            popup: 'swal2-modal-responsive'
                        }
                    });
                    
                    // Limpiar sesión y redirigir
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/login';
                } else {
                    Swal.fire({
                        title: 'No se pudo desactivar',
                        text: data.message || 'Ocurrió un error inesperado.',
                        icon: 'error',
                        confirmButtonColor: '#E91E63',
                        customClass: {
                            popup: 'swal2-modal-responsive'
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error en confirmarEliminacionCuenta:', error);
            Swal.fire({
                title: 'Error de Conexión',
                text: 'No se pudo comunicar con el servidor.',
                icon: 'error',
                customClass: {
                    popup: 'swal2-modal-responsive'
                }
            });
        }
    }

    const toggleEdicion = (habilitar) => {
        const form = document.getElementById('perfilForm');
        if (!form) return;
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => input.disabled = !habilitar);
        
        // Habilitar/Deshabilitar Dropdowns Custom
        const btnTipo = document.getElementById('tipoClienteDropdown');
        const btnDep = document.getElementById('depDropdown');
        const btnDist = document.getElementById('distDropdown');
        
        if (btnTipo) btnTipo.disabled = !habilitar;
        if (btnDep) btnDep.disabled = !habilitar;
        if (btnDist) {
            const hasDep = document.getElementById('id_departamento')?.value;
            btnDist.disabled = !habilitar || !hasDep;
        }

        const btnEditar = document.getElementById('btnEditarPerfil');
        const btnGuardar = document.getElementById('btnGuardarCambios');
        const btnCancelar = document.getElementById('btnCancelarEdicion');
        const secPass = document.getElementById('seccionPassword');
        const passMeter = document.getElementById('passwordStrength');

        if (btnEditar) btnEditar.style.display = habilitar ? 'none' : 'inline-block';
        if (btnGuardar) btnGuardar.style.display = habilitar ? 'inline-block' : 'none';
        if (btnCancelar) btnCancelar.style.display = habilitar ? 'inline-block' : 'none';
        if (secPass) secPass.style.display = habilitar ? 'block' : 'none';
        if (passMeter) passMeter.style.display = 'none'; // Ocultar al deshabilitar/resetear
        
        if (!habilitar) {
            const passInput = document.getElementById('contrasena');
            const passConfirm = document.getElementById('confirmar_contrasena');
            if (passInput) {
                passInput.value = '';
                passInput.type = 'password';
            }
            if (passConfirm) {
                passConfirm.value = '';
                passConfirm.type = 'password';
            }
            // Resetear iconos de ojo
            const iconNueva = document.getElementById('iconoNueva');
            const iconConfirmar = document.getElementById('iconoConfirmar');
            if (iconNueva) iconNueva.className = 'fa-solid fa-eye-slash';
            if (iconConfirmar) iconConfirmar.className = 'fa-solid fa-eye-slash';
        }
    };

    // --- Inicialización ---
    const init = () => {
        const token = getToken();
        if (!token) {
            window.navigateTo('/login');
            return;
        }

        // Carga secuencial para evitar fallos de sincronización
        setTimeout(async () => {
            await cargarDepartamentos();
            await cargarPerfilUsuario();
        }, 100);

        // Eventos Dropdown Tipo de Cliente
        document.querySelectorAll('#tipoClienteOptions .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const val = e.target.dataset.value;
                const input = document.getElementById('tipo_cliente');
                const label = document.getElementById('tipoClienteSelectedText');
                
                if (input) input.value = val;
                if (label) label.textContent = val;
                
                mostrarCamposCliente();
                
                const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById('tipoClienteDropdown'));
                if (bsDropdown) bsDropdown.hide();
            });
        });

        // Event Listeners
        const form = document.getElementById('perfilForm');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                actualizarPerfil();
            });
        }

        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.addEventListener('input', function() {
                this.value = formatTelefono(this.value);
            });
        }

        const contrasenaInput = document.getElementById('contrasena');
        const strengthContainer = document.getElementById('passwordStrength');
        if (contrasenaInput && strengthContainer) {
            contrasenaInput.addEventListener('input', function() {
                if (this.value.length > 0) {
                    strengthContainer.style.display = 'block';
                    actualizarMedidorFortaleza(calcularFortaleza(this.value));
                } else {
                    strengthContainer.style.display = 'none';
                }
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
