document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Cargar datos del perfil y distritos
    cargarPerfilUsuario();
    cargarDepartamentos();
    
    // Manejar envío del formulario
    document.getElementById('perfilForm').addEventListener('submit', function(e) {
        e.preventDefault();
        actualizarPerfil();
    });
    // AÑADIR ESTE EVENT LISTENER
    document.getElementById('btnEliminarCuenta').addEventListener('click', function() {
        confirmarEliminacionCuenta();
    });
});

async function cargarPerfilUsuario() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/client/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const cliente = await response.json();
            llenarFormulario(cliente);
        } else if (response.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else {
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los datos del perfil',
                icon: 'error'
            });
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor',
            icon: 'error'
        });
    }
}

function llenarFormulario(cliente) {
    document.getElementById('tipo_cliente').value = cliente.tipo_cliente;
    document.getElementById('nombres').value = cliente.nombres || '';
    document.getElementById('apellidos').value = cliente.apellidos || '';
    document.getElementById('razon_social').value = cliente.razon_social || '';
    document.getElementById('numero_documento').value = cliente.numero_documento || '';
    document.getElementById('numero_documento_juridica').value = cliente.numero_documento || '';
    document.getElementById('email').value = cliente.email || '';
    document.getElementById('telefono').value = cliente.telefono || '';
    document.getElementById('direccion').value = cliente.direccion || '';
    
    // Cargar distrito del cliente después de que se carguen los departamentos
    if (cliente.id_distrito) {
        setTimeout(() => {
            cargarDistritoDelCliente(cliente.id_distrito);
        }, 1000);
    }
    
    // Mostrar campos según tipo de cliente
    mostrarCamposCliente();
}

// NUEVA FUNCIÓN para cargar el distrito específico del cliente:
async function cargarDistritoDelCliente(idDistrito) {
    try {
        // Obtener información del distrito para saber a qué departamento pertenece
        const response = await fetch(`http://localhost:3001/api/distritos/${idDistrito}`);
        if (!response.ok) throw new Error('Error al obtener datos del distrito');
        
        const distrito = await response.json();
        
        // Seleccionar el departamento
        const selectDepartamento = document.getElementById('id_departamento');
        if (selectDepartamento) {
            selectDepartamento.value = distrito.id_departamento;
            
            // Cargar distritos de ese departamento
            await cargarDistritosPorDepartamento(distrito.id_departamento);
            
            // Seleccionar el distrito específico
            setTimeout(() => {
                document.getElementById('id_distrito').value = idDistrito;
            }, 300);
        }
        
    } catch (error) {
        console.error('Error al cargar distrito del cliente:', error);
    }
}

async function actualizarPerfil() {
    try {
        const formData = new FormData(document.getElementById('perfilForm'));
        const datos = Object.fromEntries(formData);

        // LIMPIEZA Y VALIDACIÓN DE DOCUMENTO
        if (datos.tipo_cliente === 'Natural') {
            datos.numero_documento = (datos.numero_documento || '').replace(/\D/g, '').slice(0, 8);
            delete datos.numero_documento_juridica;
            if (datos.numero_documento.length !== 8) {
                Swal.fire({
                    title: 'DNI inválido',
                    text: 'El DNI debe tener exactamente 8 dígitos numéricos.',
                    icon: 'error',
                    confirmButtonColor: '#E91E63'
                });
                return;
            }
        } else if (datos.tipo_cliente === 'Jurídica') {
            datos.numero_documento = (datos.numero_documento_juridica || '').replace(/\D/g, '').slice(0, 11);
            delete datos.numero_documento_juridica;
            if (datos.numero_documento.length !== 11) {
                Swal.fire({
                    title: 'RUC inválido',
                    text: 'El RUC debe tener exactamente 11 dígitos numéricos.',
                    icon: 'error',
                    confirmButtonColor: '#E91E63'
                });
                return;
            }
        }

        // LIMPIEZA Y VALIDACIÓN DE TELÉFONO
        datos.telefono = (datos.telefono || '').replace(/\D/g, '').slice(0, 9);
        if (datos.telefono.length !== 9) {
            Swal.fire({
                title: 'Teléfono inválido',
                text: 'El teléfono debe tener exactamente 9 dígitos.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/client/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const result = await response.json();

        if (response.ok) {
            // ✅ Éxito real
            Swal.fire({
                title: '¡Actualización Exitosa!',
                text: 'Tus datos han sido actualizados correctamente',
                icon: 'success',
                confirmButtonColor: '#E91E63'
            });
        } else {
            // ❌ Error del servidor (incluyendo duplicados)
            let errorMessage = result.message || 'Error al actualizar el perfil';
            let errorTitle = 'Error de Validación';

            // Personalizar mensaje según el tipo de error
            if (result.field === 'numero_documento') {
                errorTitle = 'Documento Duplicado';
                if (datos.tipo_cliente === 'Natural') {
                    errorMessage = result.message || 'Este DNI ya está registrado por otro cliente';
                } else {
                    errorMessage = result.message || 'Este RUC ya está registrado por otro cliente';
                }
            } else if (result.field === 'email') {
                errorTitle = 'Correo Duplicado';
                errorMessage = result.message || 'Este correo ya está registrado por otro cliente';
            }

            console.log('❌ Error al actualizar:', result.message);

            Swal.fire({
                title: errorTitle,
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });

            // Opcional: Enfocar el campo con error
            if (result.field) {
                const errorField = document.getElementById(result.field) ||
                    document.getElementById(`${result.field}_juridica`);
                if (errorField) {
                    errorField.focus();
                    errorField.style.borderColor = '#dc3545';
                    setTimeout(() => {
                        errorField.style.borderColor = '';
                    }, 3000);
                }
            }
        }

    } catch (error) {
        console.error('Error en actualizarPerfil:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor. Intenta nuevamente.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
    }
}

async function cargarDepartamentos() {
    try {
        const response = await fetch('http://localhost:3001/api/departamentos');
        if (!response.ok) throw new Error('Error al cargar departamentos');
        
        const departamentos = await response.json();
        
        // Modificar el HTML para tener dos selects separados
        const selectDistrito = document.getElementById('id_distrito');
        const contenedorDistrito = selectDistrito.parentElement;
        
        // Crear select de departamento
        const divDepartamento = document.createElement('div');
        divDepartamento.className = 'mb-3';
        divDepartamento.innerHTML = `
            <label for="id_departamento" class="form-label">Departamento</label>
            <select class="form-select" id="id_departamento" name="id_departamento">
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
        
        // Cambiar label del distrito
        selectDistrito.previousElementSibling.textContent = 'Distrito';
        
        // Evento para cargar distritos cuando cambie el departamento
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
        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
        
        if (!idDepartamento) {
            selectDistrito.disabled = true;
            return;
        }
        
        const response = await fetch(`http://localhost:3001/api/distritos/departamento/${idDepartamento}`);
        if (!response.ok) throw new Error('Error al cargar distritos');
        
        const distritos = await response.json();
        
        distritos.forEach(distrito => {
            const option = document.createElement('option');
            option.value = distrito.id_distrito;
            option.textContent = distrito.nombre_distrito;
            selectDistrito.appendChild(option);
        });
        
        selectDistrito.disabled = false;
        
    } catch (error) {
        console.error('Error al cargar distritos:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los distritos',
            icon: 'error'
        });
    }
}

function mostrarCamposCliente() {
    const tipo = document.getElementById('tipo_cliente').value;
    document.getElementById('campos_natural').style.display = (tipo === 'Natural') ? 'block' : 'none';
    document.getElementById('campos_juridica').style.display = (tipo === 'Jurídica') ? 'block' : 'none';
}


function confirmarEliminacionCuenta() {
    Swal.fire({
        title: '⚠️ ¿Desactivar tu cuenta?',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <p><strong>Al desactivar tu cuenta:</strong></p>
                <ul style="color: #dc3545; font-weight: 500;">
                    <li>No podrás iniciar sesión</li>
                    <li>Tu cuenta quedará inactiva</li>
                    <li>Tus datos se conservarán</li>
                    <li>Podrás reactivarla contactando soporte</li>
                </ul>
                <p style="color: #28a745; font-size: 14px; margin-top: 15px;">
                    <strong>Nota:</strong> Esta acción NO elimina permanentemente tus datos.
                </p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, desactivar mi cuenta',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true,
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Segunda confirmación
            Swal.fire({
                title: 'Confirmación final',
                text: 'Escribe "DESACTIVAR" para confirmar',
                input: 'text',
                inputPlaceholder: 'Escribe DESACTIVAR',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Desactivar cuenta',
                cancelButtonText: 'Cancelar',
                allowOutsideClick: false,
                allowEscapeKey: false,
                inputValidator: (value) => {
                    if (value !== 'DESACTIVAR') {
                        return 'Debes escribir exactamente "DESACTIVAR" para continuar';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    desactivarCuentaDefinitivamente();
                }
            });
        }
    });
}

async function desactivarCuentaDefinitivamente() {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Desactivando cuenta...',
            text: 'Por favor espera mientras procesamos tu solicitud',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/client/account', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            // Limpiar localStorage
            localStorage.removeItem('token');
            
            // Mostrar mensaje de éxito
            Swal.fire({
                title: 'Cuenta Desactivada',
                text: 'Tu cuenta ha sido desactivada. Contacta con soporte si deseas reactivarla.',
                icon: 'success',
                timer: 4000,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                window.location.href = '/';
            });
            
        } else {
            Swal.fire({
                title: 'Error al Desactivar Cuenta',
                text: resultado.message || 'No se pudo desactivar la cuenta. Inténtalo más tarde.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }
        
    } catch (error) {
        console.error('Error al desactivar cuenta:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor. Inténtalo más tarde.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
    }
}
