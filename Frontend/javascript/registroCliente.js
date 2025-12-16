document.addEventListener('DOMContentLoaded', function() {
    // Cargar departamentos al iniciar
    fetch('http://localhost:3001/api/departamentos')
        .then(res => {
            if (!res.ok) throw new Error('Error al cargar departamentos');
            return res.json();
        })
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
            // Insertar antes del select de distrito
            document.getElementById('id_distrito').parentNode.insertBefore(selectDepartamento, document.getElementById('id_distrito'));
            
            // Evento para cargar distritos
            selectDepartamento.addEventListener('change', function() {
                if (!this.value) return;
                
                fetch(`http://localhost:3001/api/distritos/departamento/${this.value}`)
                    .then(res => {
                        if (!res.ok) throw new Error('Error al cargar distritos');
                        return res.json();
                    })
                    .then(distritos => {
                        const selectDistrito = document.getElementById('id_distrito');
                        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
                        distritos.forEach(dis => {
                            selectDistrito.innerHTML += `<option value="${dis.id_distrito}">${dis.nombre_distrito}</option>`;
                        });
                        selectDistrito.disabled = false;
                    })
                    .catch(err => {
                        console.error('Error:', err);
                        alert('No se pudieron cargar los distritos');
                    });
            });
        })
        .catch(err => {
            console.error('Error:', err);
            alert('No se pudieron cargar los departamentos');
        });

    // Mostrar campos según tipo de cliente
    mostrarCamposCliente();
    document.getElementById('tipo_cliente').addEventListener('change', mostrarCamposCliente);

    // Validación y envío del formulario
    document.getElementById('registroForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const tipo_cliente = document.getElementById('tipo_cliente').value;
        let numero_documento = '';
        if (tipo_cliente === 'Natural') {
            numero_documento = document.getElementById('numero_documento').value;
        } else {
            numero_documento = document.getElementById('numero_documento_juridica').value;
        }

        // Validar que se haya seleccionado un distrito
        const id_distrito = document.getElementById('id_distrito').value;
        if (!id_distrito) {
            alert('Por favor seleccione un departamento y distrito');
            return;
        }

        const data = {
            tipo_cliente,
            nombres: document.getElementById('nombres').value,
            apellidos: document.getElementById('apellidos').value,
            razon_social: document.getElementById('razon_social').value,
            numero_documento,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            id_distrito: parseInt(id_distrito),
            contrasena: document.getElementById('contrasena').value
        };

        try {
            const response = await fetch('http://localhost:3001/api/client/register', {
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
                    this.reset(); // Limpia el formulario
                    window.location.href = '/login'; // Redirige al login
                });
            } else {
                // REEMPLAZO DEL ALERT DE ERROR
                Swal.fire({
                    title: 'Error en el Registro',
                    text: result.message || 'No se pudo completar el registro. Por favor, verifica tus datos.',
                    icon: 'error',
                    confirmButtonColor: '#E91E63'
                });
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            // REEMPLAZO DEL ALERT DE ERROR DE CONEXIÓN
            Swal.fire({
                title: 'Error de Conexión',
                text: 'No se pudo comunicar con el servidor. Inténtalo más tarde.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }
    });
});

// Función para mostrar campos según tipo de cliente
function mostrarCamposCliente() {
    const tipo = document.getElementById('tipo_cliente').value;
    document.getElementById('campos_natural').style.display = (tipo === 'Natural') ? 'block' : 'none';
    document.getElementById('campos_juridica').style.display = (tipo === 'Jurídica') ? 'block' : 'none';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('contrasena');
    const icon = document.getElementById('iconoPassword'); // Asegúrate que este ID coincida con tu HTML

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
