document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');

    // Show/Hide Forms
    showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // Login Form Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        try {
            const response = await api.login(username, password);
            if (response.user.role !== role) {
                throw new Error('Invalid role selected');
            }
            localStorage.setItem('user', JSON.stringify(response.user));
            showDashboard(response.user);
        } catch (error) {
            alert(error.message);
        }
    });

    // Register Form Handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('reg-username').value,
            password: document.getElementById('reg-password').value,
            email: document.getElementById('reg-email').value,
            fullName: document.getElementById('reg-fullname').value,
            role: document.getElementById('reg-role').value
        };

        try {
            await api.register(userData);
            alert('Registration successful! Please login.');
            showLoginBtn.click();
        } catch (error) {
            alert(error.message);
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        api.clearToken();
        localStorage.removeItem('user');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('advocate-dashboard').classList.add('hidden');
        document.getElementById('client-dashboard').classList.add('hidden');
    });

    // Check if user is already logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && api.token) {
        showDashboard(user);
    }
});

function showDashboard(user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('user-name').textContent = user.fullName;

    if (user.role === 'advocate') {
        document.getElementById('advocate-dashboard').classList.remove('hidden');
        document.getElementById('client-dashboard').classList.add('hidden');
        initializeAdvocateDashboard();
    } else {
        document.getElementById('client-dashboard').classList.remove('hidden');
        document.getElementById('advocate-dashboard').classList.add('hidden');
        initializeClientDashboard();
    }
} 