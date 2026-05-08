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

    const initRegistro = function() {
        const registroForm = document.getElementById('registroForm');
        if (!registroForm) return;

        // Cargar departamentos al iniciar (Prevenir duplicados)
        if (!document.getElementById('id_departamento')) {
            fetch('/api/departamentos')
                .then(res => res.json())
                .then(departamentos => {
                    const selectDepartamento = document.createElement('select');
                    selectDepartamento.className = 'form-select mb-3';
                    selectDepartamento.id = 'id_departamento';
                    selectDepartamento.name = 'id_departamento';
                    selectDepartamento.required = true;
                    selectDepartamento.innerHTML = '<option value="">Seleccione un departamento</option>';
                    departamentos.forEach(dep => {
                        selectDepartamento.innerHTML += `<option value="${dep.id_departamento}">${dep.nombre_departamento}</option>`;
                    });
                    
                    const elDistrito = document.getElementById('id_distrito');
                    if (elDistrito) elDistrito.parentNode.insertBefore(selectDepartamento, elDistrito);
                    
                    selectDepartamento.addEventListener('change', function() {
                        if (!this.value) return;
                        fetch(`/api/distritos/departamento/${this.value}`)
                            .then(res => res.json())
                            .then(distritos => {
                                const selectDistrito = document.getElementById('id_distrito');
                                if (!selectDistrito) return;
                                selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
                                distritos.forEach(dis => {
                                    selectDistrito.innerHTML += `<option value="${dis.id_distrito}">${dis.nombre_distrito}</option>`;
                                });
                                selectDistrito.disabled = false;
                            });
                    });
                });
        }

        mostrarCamposCliente();
        const tipoCli = document.getElementById('tipo_cliente');
        if (tipoCli) tipoCli.addEventListener('change', mostrarCamposCliente);

        const contrasenaInput = document.getElementById('contrasena');
        if (contrasenaInput) {
            contrasenaInput.addEventListener('input', function() {
                const fortaleza = calcularFortaleza(this.value);
                actualizarMedidorFortaleza(fortaleza);
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
                ? document.getElementById('numero_documento')?.value 
                : document.getElementById('numero_documento_juridica')?.value;

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
                telefono: document.getElementById('telefono').value,
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
