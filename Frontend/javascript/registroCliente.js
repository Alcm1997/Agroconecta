/**
 * registroCliente.js - Lógica de registro (SPA Compatible)
 */
(function() {
    "use strict";

    function calcularFortaleza(password) {
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
    }

    function actualizarMedidorFortaleza(fortaleza) {
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
    window.mostrarCamposCliente = mostrarCamposCliente;

    function togglePassword() {
        const passwordInput = document.getElementById('contrasena');
        const icon = document.getElementById('iconoPassword');
        if (!passwordInput || !icon) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    }
    window.togglePassword = togglePassword;

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

            container.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const text = e.target.textContent;

                    document.getElementById('id_departamento').value = id;
                    document.getElementById('depSelectedText').textContent = text;
                    
                    document.getElementById('id_distrito').value = '';
                    document.getElementById('distSelectedText').textContent = 'Seleccione distrito...';
                    
                    await cargarDistritosPorDepartamento(id);
                    
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

            container.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const text = e.target.textContent;

                    document.getElementById('id_distrito').value = id;
                    document.getElementById('distSelectedText').textContent = text;
                    
                    const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById('distDropdown'));
                    if (bsDropdown) bsDropdown.hide();
                });
            });
            
            if (btnDist) btnDist.disabled = false;
        } catch (error) {
            console.error('Error al cargar distritos:', error);
        }
    }

    const initRegistro = function() {
        const registroForm = document.getElementById('registroForm');
        if (!registroForm) return;

        // Carga secuencial
        setTimeout(async () => {
            await cargarDepartamentos();
        }, 100);

        // Eventos Dropdown Tipo de Cliente
        document.querySelectorAll('#tipoClienteOptions .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const val = e.target.dataset.value;
                document.getElementById('tipo_cliente').value = val;
                document.getElementById('tipoClienteSelectedText').textContent = val;
                mostrarCamposCliente();
                const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(document.getElementById('tipoClienteDropdown'));
                if (bsDropdown) bsDropdown.hide();
            });
        });

        mostrarCamposCliente();

        // Limitadores y Restricciones
        const nombresInput = document.getElementById('nombres');
        const apellidosInput = document.getElementById('apellidos');
        const dniInput = document.getElementById('dni');
        const rucInput = document.getElementById('ruc');
        const direccionInput = document.getElementById('direccion');

        if (nombresInput) {
            nombresInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            });
        }

        if (apellidosInput) {
            apellidosInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            });
        }

        if (dniInput) {
            dniInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
            });
        }

        if (rucInput) {
            rucInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
                // Validación RUC: siempre empieza con 20
                if (this.value.length > 0 && !this.value.startsWith('20')) {
                    this.value = '20';
                }
            });
        }

        const contrasenaInput = document.getElementById('contrasena');
        if (contrasenaInput) {
            contrasenaInput.addEventListener('input', function() {
                const fortaleza = calcularFortaleza(this.value);
                actualizarMedidorFortaleza(fortaleza);
            });
        }

        const telefonoInput = document.getElementById('telefono');
        if (telefonoInput) {
            telefonoInput.addEventListener('input', function() {
                // Eliminar no numéricos
                let value = this.value.replace(/\D/g, '');
                if (value.length > 9) value = value.slice(0, 9);
                
                // Formatear: XXX XXX XXX
                const parts = value.match(/.{1,3}/g);
                this.value = parts ? parts.join(' ') : value;
            });
        }

        registroForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const contrasena = document.getElementById('contrasena').value;

            if (contrasena.length < 8 || contrasena.length > 15) {
                Swal.fire('Contraseña Inválida', 'Debe tener entre 8 y 15 caracteres.', 'error');
                return;
            }

            const tipo_cliente = document.getElementById('tipo_cliente').value;
            let numero_documento = (tipo_cliente === 'Natural') 
                ? document.getElementById('dni')?.value 
                : document.getElementById('ruc')?.value;

            const id_distrito = document.getElementById('id_distrito').value;
            if (!id_distrito) {
                Swal.fire('Ubicación Requerida', 'Seleccione departamento y distrito', 'warning');
                return;
            }

            const data = {
                tipo_cliente,
                nombres: document.getElementById('nombres')?.value || '',
                apellidos: document.getElementById('apellidos')?.value || '',
                razon_social: document.getElementById('razon_social')?.value || '',
                numero_documento,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value.replace(/\s/g, ''),
                direccion: document.getElementById('direccion').value,
                id_distrito: parseInt(id_distrito),
                contrasena: contrasena
            };

            try {
                const response = await fetch('/api/client/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (response.ok) {
                    Swal.fire({
                        title: '¡Registro Exitoso!',
                        text: 'Redirigiendo al login...',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        if (window.navigateTo) window.navigateTo('/login');
                        else window.location.href = '/login';
                    });
                } else {
                    Swal.fire('Error', result.message || 'No se pudo completar el registro.', 'error');
                }
            } catch (error) {
                Swal.fire('Error de Conexión', 'No se pudo comunicar con el servidor.', 'error');
            }
        });
    };

    initRegistro();

})();
