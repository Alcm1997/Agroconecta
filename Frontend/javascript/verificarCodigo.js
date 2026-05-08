/**
 * verificarCodigo.js - Lógica de verificación de código (SPA Compatible)
 */
(function() {
    "use strict";

    let emailUsuario = '';
    let tiempoRestante = 0;

    // Asegurar que no haya múltiples timers corriendo si el usuario navega mucho
    if (window.verificarTimerInterval) {
        clearInterval(window.verificarTimerInterval);
    }

    function actualizarPantallaTimer() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;

        const minutos = Math.floor(tiempoRestante / 60);
        const segundos = tiempoRestante % 60;
        
        display.textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;
        
        if (tiempoRestante < 60) {
            display.style.color = '#ff4444';
            display.style.fontWeight = 'bold';
        }
    }

    function mostrarCodigoExpirado() {
        const form = document.getElementById('verificarForm');
        if (form) {
            const elements = form.querySelectorAll('input, button');
            elements.forEach(el => el.disabled = true);
        }
        
        const reenviarBtn = document.getElementById('reenviarBtn');
        if (reenviarBtn) reenviarBtn.disabled = true;

        Swal.fire({
            title: '⏰ Código Expirado',
            text: 'Solicita un nuevo código.',
            icon: 'warning',
            confirmButtonText: 'Solicitar Nuevo Código',
            confirmButtonColor: '#E91E63'
        }).then(() => {
            sessionStorage.removeItem('recoveryExpiration');
            if (window.navigateTo) window.navigateTo('/recuperar-contrasena');
            else window.location.href = '/recuperar-contrasena';
        });
    }

    function iniciarTimer() {
        actualizarPantallaTimer();
        window.verificarTimerInterval = setInterval(function() {
            tiempoRestante--;
            if (tiempoRestante <= 0) {
                clearInterval(window.verificarTimerInterval);
                tiempoRestante = 0;
                actualizarPantallaTimer();
                mostrarCodigoExpirado();
            } else {
                actualizarPantallaTimer();
            }
        }, 1000);
    }

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

    function validarContrasenas() {
        const nPass = document.getElementById('nuevaContrasena')?.value || '';
        const cPass = document.getElementById('confirmarContrasena')?.value || '';
        const cInput = document.getElementById('confirmarContrasena');
        
        actualizarMedidorFortaleza(calcularFortaleza(nPass));
        
        const esValida = nPass.length >= 8 && nPass.length <= 15;
        if (esValida && cPass.length > 0 && cInput) {
            if (nPass === cPass) {
                cInput.classList.replace('is-invalid', 'is-valid') || cInput.classList.add('is-valid');
                return true;
            } else {
                cInput.classList.replace('is-valid', 'is-invalid') || cInput.classList.add('is-invalid');
                return false;
            }
        }
        return false;
    }

    const initVerificar = () => {
        const urlParams = new URLSearchParams(window.location.search);
        emailUsuario = urlParams.get('email');
        
        if (!emailUsuario) {
            if (window.navigateTo) window.navigateTo('/recuperar-contrasena');
            else window.location.href = '/recuperar-contrasena';
            return;
        }
        
        const elEmail = document.getElementById('emailDestino');
        if (elEmail) elEmail.textContent = emailUsuario;
        
        const expirationTimestamp = sessionStorage.getItem('recoveryExpiration');
        if (expirationTimestamp) {
            tiempoRestante = Math.floor((expirationTimestamp - Date.now()) / 1000);
            if (tiempoRestante <= 0) {
                mostrarCodigoExpirado();
                return;
            }
            iniciarTimer();
        } else {
            tiempoRestante = 600;
            iniciarTimer();
        }
        
        const form = document.getElementById('verificarForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await procesarCambio();
            });
        }

        const codigoInput = document.getElementById('codigo');
        if (codigoInput) {
            codigoInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }

        const nPass = document.getElementById('nuevaContrasena');
        const cPass = document.getElementById('confirmarContrasena');
        if (nPass) nPass.addEventListener('input', validarContrasenas);
        if (cPass) cPass.addEventListener('input', validarContrasenas);
    };

    async function procesarCambio() {
        const codigo = document.getElementById('codigo').value.trim();
        const nPass = document.getElementById('nuevaContrasena').value;
        
        try {
            Swal.fire({ title: 'Verificando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            const response = await fetch('/api/recovery/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailUsuario, codigo, nuevaContrasena: nPass })
            });
            
            if (response.ok) {
                clearInterval(window.verificarTimerInterval);
                Swal.fire('¡Éxito!', 'Contraseña actualizada', 'success').then(() => {
                    if (window.navigateTo) window.navigateTo('/login');
                    else window.location.href = '/login';
                });
            } else {
                const res = await response.json();
                Swal.fire('Error', res.message || 'Código incorrecto', 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    }

    window.togglePassword = (id) => {
        const input = document.getElementById(id);
        if (!input) return;
        const icon = input.nextElementSibling?.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    initVerificar();

})();