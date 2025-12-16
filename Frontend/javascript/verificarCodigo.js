let emailUsuario = '';
let timerInterval;
let tiempoRestante = 600; // 10 minutos en segundos

document.addEventListener('DOMContentLoaded', function() {
    // Obtener email de la URL
    const urlParams = new URLSearchParams(window.location.search);
    emailUsuario = urlParams.get('email');
    
    if (!emailUsuario) {
        // Si no hay email, redirigir a la página de recuperación
        window.location.href = '/recuperar-contrasena';
        return;
    }
    
    // Mostrar el email en la interfaz
    document.getElementById('emailDestino').textContent = emailUsuario;
    
    // Iniciar timer
    iniciarTimer();
    
    // Event listeners
    const form = document.getElementById('verificarForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        verificarCodigoYCambiarContrasena();
    });
    
    // Validación en tiempo real del código
    const codigoInput = document.getElementById('codigo');
    codigoInput.addEventListener('input', function(e) {
        // Solo permitir números
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        validarCodigo();
    });
    
    // Validación de contraseñas
    const nuevaContrasena = document.getElementById('nuevaContrasena');
    const confirmarContrasena = document.getElementById('confirmarContrasena');
    
    nuevaContrasena.addEventListener('input', validarContrasenas);
    confirmarContrasena.addEventListener('input', validarContrasenas);
});

function iniciarTimer() {
    timerInterval = setInterval(function() {
        const minutos = Math.floor(tiempoRestante / 60);
        const segundos = tiempoRestante % 60;
        
        document.getElementById('timerDisplay').textContent = 
            `${minutos}:${segundos.toString().padStart(2, '0')}`;
        
        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            mostrarCodigoExpirado();
        }
        
        tiempoRestante--;
    }, 1000);
}

function mostrarCodigoExpirado() {
    Swal.fire({
        title: '⏰ Código Expirado',
        text: 'El código de verificación ha expirado. Solicita un nuevo código.',
        icon: 'warning',
        confirmButtonText: 'Solicitar Nuevo Código',
        confirmButtonColor: '#E91E63',
        allowOutsideClick: false
    }).then(() => {
        window.location.href = '/recuperar-contrasena';
    });
}

function validarCodigo() {
    const codigo = document.getElementById('codigo').value;
    const codigoInput = document.getElementById('codigo');
    
    if (codigo.length === 6) {
        codigoInput.classList.remove('is-invalid');
        codigoInput.classList.add('is-valid');
        return true;
    } else if (codigo.length > 0) {
        codigoInput.classList.add('is-invalid');
        codigoInput.classList.remove('is-valid');
        return false;
    } else {
        codigoInput.classList.remove('is-invalid', 'is-valid');
        return false;
    }
}

function validarContrasenas() {
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmarContrasena = document.getElementById('confirmarContrasena').value;
    const confirmarInput = document.getElementById('confirmarContrasena');
    
    if (nuevaContrasena.length >= 6 && confirmarContrasena.length > 0) {
        if (nuevaContrasena === confirmarContrasena) {
            confirmarInput.classList.remove('is-invalid');
            confirmarInput.classList.add('is-valid');
            return true;
        } else {
            confirmarInput.classList.add('is-invalid');
            confirmarInput.classList.remove('is-valid');
            return false;
        }
    } else {
        confirmarInput.classList.remove('is-invalid', 'is-valid');
        return false;
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

async function verificarCodigoYCambiarContrasena() {
    const codigo = document.getElementById('codigo').value.trim();
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmarContrasena = document.getElementById('confirmarContrasena').value;
    
    // Validaciones
    if (!validarCodigo()) {
        Swal.fire({
            title: 'Código Inválido',
            text: 'Por favor ingresa el código de 6 dígitos correctamente.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
        return;
    }
    
    if (nuevaContrasena.length < 6) {
        Swal.fire({
            title: 'Contraseña Muy Corta',
            text: 'La contraseña debe tener al menos 6 caracteres.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
        return;
    }
    
    if (!validarContrasenas()) {
        Swal.fire({
            title: 'Contraseñas No Coinciden',
            text: 'La confirmación de contraseña no coincide.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Verificando código...',
            text: 'Por favor espera mientras verificamos la información',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Enviar solicitud al backend
        const response = await fetch('http://localhost:3001/api/recovery/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailUsuario,
                codigo: codigo,
                nuevaContrasena: nuevaContrasena
            })
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            // Limpiar timer
            clearInterval(timerInterval);
            
            // Éxito - Actualizar pasos y mostrar mensaje
            actualizarPasosCompletados();
            
            Swal.fire({
                title: '🎉 ¡Contraseña Actualizada!',
                text: 'Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.',
                icon: 'success',
                confirmButtonText: 'Ir al Login',
                confirmButtonColor: '#28a745',
                allowOutsideClick: false
            }).then(() => {
                window.location.href = '/login';
            });
            
        } else {
            Swal.fire({
                title: 'Error',
                text: resultado.message || 'No se pudo verificar el código. Inténtalo de nuevo.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }
        
    } catch (error) {
        console.error('Error al verificar código:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
    }
}

function actualizarPasosCompletados() {
    // Actualizar indicador visual de pasos
    const pasos = document.querySelectorAll('.step');
    const lineas = document.querySelectorAll('.step-line');
    
    pasos.forEach((paso, index) => {
        paso.classList.remove('pending', 'active');
        paso.classList.add('completed');
    });
    
    lineas.forEach(linea => {
        linea.classList.add('completed');
    });
}

async function reenviarCodigo() {
    try {
        Swal.fire({
            title: 'Reenviando código...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const response = await fetch('http://localhost:3001/api/recovery/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailUsuario })
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            // Reiniciar timer
            clearInterval(timerInterval);
            tiempoRestante = 600;
            iniciarTimer();
            
            Swal.fire({
                title: '📧 Código Reenviado',
                text: 'Se ha enviado un nuevo código a tu correo electrónico.',
                icon: 'success',
                confirmButtonColor: '#E91E63'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: resultado.message || 'No se pudo reenviar el código.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }
        
    } catch (error) {
        console.error('Error al reenviar código:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
    }
}

function volverAtras() {
    Swal.fire({
        title: '¿Volver atrás?',
        text: 'Perderás el progreso actual. ¿Estás seguro?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#E91E63',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, volver',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            clearInterval(timerInterval);
            window.location.href = '/recuperar-contrasena';
        }
    });
}