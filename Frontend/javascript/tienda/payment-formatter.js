/**
 * payment-formatter.js
 * Utilidades para detección, formato y validación de métodos de pago.
 */
(function(window) {
    'use strict';

    const PaymentFormatter = {
        // Tipos de tarjeta soportados con sus reglas
        CARD_TYPES: [
            {
                name: 'visa',
                niceName: 'Visa',
                patterns: [/^4/],
                format: /(\d{1,4})/g,
                maxLen: 16,
                cvvLen: 3,
                regex: /^4[0-9]{12}(?:[0-9]{3})?$/
            },
            {
                name: 'mastercard',
                niceName: 'Mastercard',
                patterns: [/^5[1-5]/, /^222[1-9]/, /^22[3-9]/, /^2[3-6]/, /^27[01]/, /^2720/],
                format: /(\d{1,4})/g,
                maxLen: 16,
                cvvLen: 3,
                regex: /^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/
            },
            {
                name: 'amex',
                niceName: 'American Express',
                patterns: [/^34/, /^37/],
                format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
                maxLen: 15,
                cvvLen: 4,
                regex: /^3[47][0-9]{13}$/
            },
            {
                name: 'diners',
                niceName: 'Diners Club',
                patterns: [/^30[0-5]/, /^36/, /^38/],
                format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
                maxLen: 14,
                cvvLen: 3,
                regex: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/
            }
        ],

        /**
         * Detecta el tipo de tarjeta basado en el número (prefijos)
         */
        detectCardType(number) {
            const cleanNumber = number.replace(/\D/g, '');
            for (const card of this.CARD_TYPES) {
                for (const pattern of card.patterns) {
                    if (pattern.test(cleanNumber)) return card;
                }
            }
            return null;
        },

        /**
         * Aplica la máscara visual al número de tarjeta
         */
        formatCardNumber(value, cardType) {
            const v = value.replace(/\D/g, '').slice(0, cardType ? cardType.maxLen : 16);
            if (!cardType || cardType.name === 'visa' || cardType.name === 'mastercard') {
                const parts = v.match(cardType ? cardType.format : /(\d{1,4})/g);
                return parts ? parts.join(' ') : v;
            }
            
            // Formatos especiales (Amex, Diners)
            const matches = v.match(cardType.format);
            if (!matches) return v;
            return matches.slice(1).filter(Boolean).join(' ');
        },

        /**
         * Aplica la máscara MM/AA a la fecha de expiración
         */
        formatExpiry(value) {
            const v = value.replace(/\D/g, '').slice(0, 4);
            if (v.length >= 3) {
                return v.slice(0, 2) + '/' + v.slice(2);
            }
            return v;
        },

        /**
         * Aplica la máscara 999 888 777 al número de celular
         */
        formatPhone(value) {
            const v = value.replace(/\D/g, '').slice(0, 9);
            const parts = v.match(/(\d{1,3})/g);
            return parts ? parts.join(' ') : v;
        },

        /**
         * Valida si un celular es peruano (9 dígitos, empieza con 9)
         */
        validatePhone(value) {
            const clean = value.replace(/\D/g, '');
            if (clean.length !== 9) return { valid: false, msg: 'El celular debe tener 9 dígitos' };
            if (!clean.startsWith('9')) return { valid: false, msg: 'El celular debe empezar con 9' };
            return { valid: true };
        },

        /**
         * Valida la fecha de expiración (MM/AA)
         * Reglas: Mes 01-12, Año max actual+5 (2031), No vencida.
         */
        validateExpiryDate(value) {
            if (!/^\d{2}\/\d{2}$/.test(value)) return { valid: false, msg: 'Formato inválido (MM/AA)' };
            
            const [m, a] = value.split('/').map(n => parseInt(n));
            const now = new Date();
            const currYear = parseInt(now.getFullYear().toString().slice(-2)); // 26
            const currMonth = now.getMonth() + 1; // 5 (Mayo)
            const maxYear = currYear + 5; // 31

            if (m < 1 || m > 12) return { valid: false, msg: 'Mes inválido (01-12)' };
            if (a < currYear) return { valid: false, msg: 'La tarjeta ha expirado' };
            if (a === currYear && m < currMonth) return { valid: false, msg: 'La tarjeta ha expirado' };
            if (a > maxYear) return { valid: false, msg: `Fecha fuera de rango (Máx 20${maxYear})` };

            return { valid: true };
        },

        /**
         * Algoritmo de Luhn para validar la autenticidad del número
         */
        validateLuhn(number) {
            const clean = number.replace(/\D/g, '');
            if (!clean || clean.length < 13) return false;
            
            let sum = 0;
            let shouldDouble = false;
            for (let i = clean.length - 1; i >= 0; i--) {
                let digit = parseInt(clean.charAt(i));
                if (shouldDouble) {
                    if ((digit *= 2) > 9) digit -= 9;
                }
                sum += digit;
                shouldDouble = !shouldDouble;
            }
            return (sum % 10) === 0;
        },

        /**
         * Limpia cualquier formato para enviar solo números al backend
         */
        unformat(value) {
            return value.replace(/\D/g, '');
        }
    };

    // Exponer al objeto window
    window.PaymentFormatter = PaymentFormatter;

})(window);
