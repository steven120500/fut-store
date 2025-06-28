// login.js - Sistema de autenticación para el inventario
const API_BASE_URL = 'https://fut-store.onrender.com/api';  // Usa HTTPS

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const togglePassword = document.createElement('span');
    
    // Credenciales válidas (en producción usar backend!)
    const CREDENTIALS = {
        username: '207370026',
        password: 'Bety1234',
        name: 'Bety',
        role: 'admin' // 'admin' o 'user'
    };
    
    // Configurar el toggle de contraseña
    setupPasswordToggle();
    
    // Manejar el envío del formulario
    loginForm.addEventListener('submit', handleLogin);
    
    // Limpiar errores al escribir
    usernameInput.addEventListener('input', clearErrors);
    passwordInput.addEventListener('input', clearErrors);
    
    // Mostrar credenciales de prueba (solo desarrollo)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Credenciales de prueba:', CREDENTIALS);
    }
    
    // Función para manejar el login
    function handleLogin(e) {
        e.preventDefault();
        
        // Mostrar estado de carga
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner loading"></i> Validando...';
        submitButton.disabled = true;
        
        // Simular delay para autenticación (remover en producción)
        setTimeout(() => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
                // Autenticación exitosa
                successfulLogin();
            } else {
                // Error de autenticación
                failedLogin();
            }
            
            // Restaurar botón
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }, 800); // Simula tiempo de red
    }
    
    function successfulLogin() {
        // Guardar sesión (en producción usar método seguro)
        sessionStorage.setItem('authenticated', 'true');
        sessionStorage.setItem('username', CREDENTIALS.username);
        sessionStorage.setItem('name', CREDENTIALS.name);
        sessionStorage.setItem('role', CREDENTIALS.role);
        
        // Redirigir a la página de inventario
        window.location.href = 'inventario.html';
    }
    
    function failedLogin() {
        // Mostrar error
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Credenciales incorrectas. Intente nuevamente.';
        
        // Efecto visual de error
        usernameInput.style.borderColor = '#e74c3c';
        passwordInput.style.borderColor = '#e74c3c';
        
        // Limpiar contraseña y enfocar
        passwordInput.value = '';
        passwordInput.focus();
        
        // Agregar animación
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }
    
    function clearErrors() {
        errorMessage.style.display = 'none';
        usernameInput.style.borderColor = '#dfe6e9';
        passwordInput.style.borderColor = '#dfe6e9';
    }
    
    function setupPasswordToggle() {
        // Crear botón para mostrar/ocultar contraseña
        togglePassword.innerHTML = '<i class="far fa-eye"></i>';
        togglePassword.className = 'toggle-password';
        togglePassword.style.cursor = 'pointer';
        
        // Insertar después del input de contraseña
        passwordInput.insertAdjacentElement('afterend', togglePassword);
        
        // Manejar el click
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
        });
    }
    
    // Proteger contra fuerza bruta (opcional)
    let failedAttempts = 0;
    const MAX_ATTEMPTS = 5;
    
    function checkBruteForce() {
        failedAttempts++;
        if (failedAttempts >= MAX_ATTEMPTS) {
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            errorMessage.textContent = `Demasiados intentos fallidos. Espere 5 minutos.`;
            errorMessage.style.display = 'block';
            
            // Reactivar después de 5 minutos
            setTimeout(() => {
                submitButton.disabled = false;
                failedAttempts = 0;
                errorMessage.style.display = 'none';
            }, 300000); // 5 minutos
        }
    }
});

// Verificar autenticación en otras páginas (agregar al inicio de inventario.js)
function checkAuth() {
    if (!sessionStorage.getItem('authenticated')) {
        window.location.href = 'login.html';
    }
}