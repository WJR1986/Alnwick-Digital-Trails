document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const adminView = document.getElementById('admin-view');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // --- Core Functions ---
    const showAdminView = () => {
        loginView.classList.add('d-none');
        adminView.classList.remove('d-none');
    };

    const showLoginView = () => {
        adminView.classList.add('d-none');
        loginView.classList.remove('d-none');
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        loginError.classList.add('d-none');
        const password = passwordInput.value;

        try {
            const response = await fetch('/.netlify/functions/admin-login', {
                method: 'POST',
                body: JSON.stringify({ password: password })
            });

            if (response.ok) {
                const data = await response.json();
                // Store the token to keep the user logged in for the session
                sessionStorage.setItem('admin-token', data.token);
                showAdminView();
            } else {
                loginError.classList.remove('d-none');
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Login failed:', error);
            loginError.textContent = 'An error occurred. Please try again.';
            loginError.classList.remove('d-none');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin-token');
        showLoginView();
    };

    // --- Initial Check ---
    // When the page loads, check if the user is already logged in (has a token)
    if (sessionStorage.getItem('admin-token') === 'admin-access-granted') {
        showAdminView();
    } else {
        showLoginView();
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
});