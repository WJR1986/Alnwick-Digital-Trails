document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const adminView = document.getElementById('admin-view');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const trailListContainer = document.getElementById('trail-list-container');

    // --- Supabase Initialization ---
    // IMPORTANT: Replace with your actual Supabase URL and Anon Key
    const SUPABASE_URL = 'https://smqqultilrhuzkybvlzs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcXF1bHRpbHJodXpreWJ2bHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjcyNDUsImV4cCI6MjA3MDk0MzI0NX0.uuqMY1ZHEzZKwg1c99r5FQnipprCVUrRYfWSXfprKIs';
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


    // --- Core Functions ---
    const loadTrails = async () => {
        trailListContainer.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

        const { data: trails, error } = await supabase
            .from('trails')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching trails:', error);
            trailListContainer.innerHTML = `<div class="alert alert-danger">Error fetching trails. Check the console for details.</div>`;
            return;
        }

        trailListContainer.innerHTML = ''; // Clear spinner

        if (trails.length === 0) {
            trailListContainer.innerHTML = `<p>No trails found. You can add one now!</p>`;
            return;
        }
        
        const trailCards = trails.map(trail => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="card-title mb-1">${trail.name}</h5>
                            <p class="card-subtitle text-muted">${trail.theme}</p>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-secondary me-2" disabled>
                                <i class="bi bi-pencil-fill"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-primary" disabled>
                                <i class="bi bi-geo-alt-fill"></i> Manage Locations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        trailListContainer.innerHTML = trailCards;
    };


    const showAdminView = () => {
        loginView.classList.add('d-none');
        adminView.classList.remove('d-none');
        loadTrails(); // Fetch and display trails as soon as the view is shown
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
    if (sessionStorage.getItem('admin-token') === 'admin-access-granted') {
        showAdminView();
    } else {
        showLoginView();
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
});