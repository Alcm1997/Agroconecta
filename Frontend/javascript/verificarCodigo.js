let emailUsuario = '';
let timerInterval;
let tiempoRestante = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Obtener email de la URL
    const urlParams = new URLSearchParams(window.location.search);
    emailUsuario = urlParams.get('email');
    
    if (!emailUsuario) {
        window.location.href = '/recuperar-contrasena';
        return;
    }
    
    // Mostrar el email en la interfaz
    document.getElementById('emailDestino').textContent = emailUsuario;
    
    // LÓGICA DE TIEMPO PERSISTENTE
    const expirationTimestamp = sessionStorage.getItem('recoveryExpiration');
    
    if (expirationTimestamp) {
        const ahora = Date.now();
        tiempoRestante = Math.floor((expirationTimestamp - ahora) / 1000);
        
        if (tiempoRestante <= 0) {
            mostrarCodigoExpirado();
            return;
        }
        
        iniciarTimer();
    } else {
        // Si por alguna razón no hay timestamp, fallback a 10 min pero avisamos
        console.warn('No se encontró timestamp de expiración. Usando fallback.');
        tiempoRestante = 600;
        iniciarTimer();
    }
    
    // Event listeners
    const form = document.getElementById('verificarForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        verificarCodigoYCambiarContrasena();
    });
    
    // Validación en tiempo real del código
    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            validarCodigo();
        });
    }
    
    // Validación de contraseñas
    const nuevaContrasena = document.getElementById('nuevaContrasena');
    const confirmarContrasena = document.getElementById('confirmarContrasena');
    
    if (nuevaContrasena) nuevaContrasena.addEventListener('input', validarContrasenas);
    if (confirmarContrasena) confirmarContrasena.addEventListener('input', validarContrasenas);
});

function iniciarTimer() {
    // Actualización inmediata para no esperar el primer segundo
    actualizarPantallaTimer();

    timerInterval = setInterval(function() {
        tiempoRestante--;
        
        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            tiempoRestante = 0;
            actualizarPantallaTimer();
            mostrarCodigoExpirado();
        } else {
            actualizarPantallaTimer();
        }
    }, 1000);
}

function actualizarPantallaTimer() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;
    
    const display = document.getElementById('timerDisplay');
    if (display) {
        display.textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;
        
        // Alerta visual cuando queda menos de 1 minuto
        if (tiempoRestante < 60) {
            display.style.color = '#ff4444';
            display.style.fontWeight = 'bold';
        }
    }
}

function mostrarCodigoExpirado() {
    // BLOQUEAR FORMULARIO
    const form = document.getElementById('verificarForm');
    if (form) {
        const elements = form.querySelectorAll('input, button');
        elements.forEach(el => el.disabled = true);
    }
    
    // Deshabilitar también el botón de reenviar si existe
    const reenviarBtn = document.getElementById('reenviarBtn');
    if (reenviarBtn) reenviarBtn.disabled = true;

    Swal.fire({
        title: '⏰ Código Expirado',
        text: 'El código de verificación ha expirado. Solicita un nuevo código.',
        icon: 'warning',
        confirmButtonText: 'Solicitar Nuevo Código',
        confirmButtonColor: '#E91E63',
        allowOutsideClick: false
    }).then(() => {
        // Limpiar storage al salir
        sessionStorage.removeItem('recoveryExpiration');
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
    
    // 1. Calcular fortaleza
    const fortaleza = calcularFortaleza(nuevaContrasena);
    actualizarMedidorFortaleza(fortaleza);
    
    // 2. Validar requisitos mínimos (8-15 caracteres)
    const esValida = nuevaContrasena.length >= 8 && nuevaContrasena.length <= 15;
    
    // 3. Validar coincidencia
    if (esValida && confirmarContrasena.length > 0) {
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

function calcularFortaleza(password) {
    let score = 0;
    if (!password) return { score: 0, label: 'Esperando...', class: '' };

    // Longitud
    if (password.length >= 8) score += 25;
    
    // Mayúsculas
    if (/[A-Z]/.test(password)) score += 25;
    
    // Números
    if (/[0-9]/.test(password)) score += 25;
    
    // Símbolos
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25;

    if (score <= 25) return { score, label: 'Débil', class: 'strength-weak' };
    if (score <= 50) return { score, label: 'Regular', class: 'strength-medium' };
    if (score <= 75) return { score, label: 'Buena', class: 'strength-good' };
    return { score, label: 'Fuerte', class: 'strength-strong' };
}

function actualizarMedidorFortaleza(fortaleza) {
    const meterBar = document.getElementById('meterBar');
    const meterText = document.getElementById('meterText').querySelector('span');
    
    if (meterBar && meterText) {
        // Limpiar clases anteriores
        meterBar.className = 'meter-bar';
        if (fortaleza.class) meterBar.classList.add(fortaleza.class);
        
        meterText.textContent = fortaleza.label;
        
        // Color del texto
        if (fortaleza.score <= 25) meterText.style.color = '#ff4d4d';
        else if (fortaleza.score <= 50) meterText.style.color = '#ffa500';
        else if (fortaleza.score <= 75) meterText.style.color = '#ffd700';
        else meterText.style.color = '#2ecc71';
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
    
    if (nuevaContrasena.length < 8 || nuevaContrasena.length > 15) {
        Swal.fire({
            title: 'Contraseña Inválida',
            text: 'La contraseña debe tener entre 8 y 15 caracteres.',
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
        const response = await fetch('/api/recovery/reset-password', {
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
        
        const response = await fetch('/api/recovery/send-code', {
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
            
            // ACTUALIZAR TIMESTAMP DE EXPIRACIÓN (Nuevos 10 minutos)
            const expirationTime = Date.now() + (10 * 60 * 1000);
            sessionStorage.setItem('recoveryExpiration', expirationTime);
            
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