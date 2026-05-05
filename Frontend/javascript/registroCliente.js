document.addEventListener('DOMContentLoaded', function() {
    // Cargar departamentos al iniciar (Lógica existente)
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
            document.getElementById('id_distrito').parentNode.insertBefore(selectDepartamento, document.getElementById('id_distrito'));
            
            selectDepartamento.addEventListener('change', function() {
                if (!this.value) return;
                fetch(`/api/distritos/departamento/${this.value}`)
                    .then(res => res.json())
                    .then(distritos => {
                        const selectDistrito = document.getElementById('id_distrito');
                        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
                        distritos.forEach(dis => {
                            selectDistrito.innerHTML += `<option value="${dis.id_distrito}">${dis.nombre_distrito}</option>`;
                        });
                        selectDistrito.disabled = false;
                    });
            });
        });

    // Mostrar campos según tipo de cliente
    mostrarCamposCliente();
    document.getElementById('tipo_cliente').addEventListener('change', mostrarCamposCliente);

    // LÓGICA DE FORTALEZA DE CONTRASEÑA
    const contrasenaInput = document.getElementById('contrasena');
    if (contrasenaInput) {
        contrasenaInput.addEventListener('input', function() {
            const fortaleza = calcularFortaleza(this.value);
            actualizarMedidorFortaleza(fortaleza);
        });
    }

    // Validación y envío del formulario
    document.getElementById('registroForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const contrasena = document.getElementById('contrasena').value;

        // Validar requisitos de seguridad
        if (contrasena.length < 8 || contrasena.length > 15) {
            Swal.fire({
                title: 'Contraseña Inválida',
                text: 'La contraseña debe tener entre 8 y 15 caracteres.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
            return;
        }

        const tipo_cliente = document.getElementById('tipo_cliente').value;
        let numero_documento = '';
        if (tipo_cliente === 'Natural') {
            numero_documento = document.getElementById('numero_documento')?.value || '';
        } else {
            numero_documento = document.getElementById('numero_documento_juridica')?.value || '';
        }

        const id_distrito = document.getElementById('id_distrito').value;
        if (!id_distrito) {
            Swal.fire({
                title: 'Ubicación Requerida',
                text: 'Por favor seleccione un departamento y distrito',
                icon: 'warning',
                confirmButtonColor: '#E91E63'
            });
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
                    text: 'Serás redirigido a la página de inicio de sesión.',
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false,
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = '/login';
                });
            } else {
                Swal.fire({
                    title: 'Error en el Registro',
                    text: result.message || 'No se pudo completar el registro.',
                    icon: 'error',
                    confirmButtonColor: '#E91E63'
                });
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            Swal.fire({
                title: 'Error de Conexión',
                text: 'No se pudo comunicar con el servidor.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }
    });
});

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

// Función para mostrar campos según tipo de cliente
function mostrarCamposCliente() {
    const tipo = document.getElementById('tipo_cliente').value;
    document.getElementById('campos_natural').style.display = (tipo === 'Natural') ? 'block' : 'none';
    document.getElementById('campos_juridica').style.display = (tipo === 'Jurídica') ? 'block' : 'none';
}

function togglePassword() {
    const passwordInput = document.getElementById('contrasena');
    const icon = document.getElementById('iconoPassword');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}

// ✅ NUEVA FUNCIÓN: Cancelar registro
function cancelarRegistro() {
    // Verificar si hay datos en el formulario
    const formulario = document.getElementById('registroForm');
    const formData = new FormData(formulario);
    let tienesDatos = false;
    
    // Verificar si hay algún campo con datos
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '' && key !== 'tipo_cliente') { // Excluir tipo_cliente porque siempre tiene valor por defecto
            tienesDatos = true;
            break;
        }
    }
    
    if (tienesDatos) {
        // Si hay datos, mostrar confirmación
        Swal.fire({
            title: '¿Cancelar registro?',
            text: 'Se perderán todos los datos ingresados. ¿Estás seguro?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#6c757d',
            cancelButtonColor: '#E91E63',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'Continuar registro',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Limpiar formulario y redirigir
                formulario.reset();
                window.location.href = '/';
            }
        });
    } else {
        // Si no hay datos, redirigir directamente
        window.location.href = '/';
    }
}
