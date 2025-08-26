document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const loginView = document.getElementById('login-view');
    const adminView = document.getElementById('admin-view');
    const locationsView = document.getElementById('locations-view');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const trailListContainer = document.getElementById('trail-list-container');
    const addNewTrailButton = document.getElementById('add-new-trail-button');
    const addTrailModalEl = document.getElementById('add-trail-modal');
    const addTrailModal = new bootstrap.Modal(addTrailModalEl);
    const addTrailForm = document.getElementById('add-trail-form');
    const backToTrailsButton = document.getElementById('back-to-trails-button');
    const locationsTrailTitle = document.getElementById('locations-trail-title');
    const locationListContainer = document.getElementById('location-list-container');

    // --- Supabase Initialization ---
 const SUPABASE_URL = 'https://smqqultilrhuzkybvlzs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcXF1bHRpbHJodXpreWJ2bHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjcyNDUsImV4cCI6MjA3MDk0MzI0NX0.uuqMY1ZHEzZKwg1c99r5FQnipprCVUrRYfWSXfprKIs';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- Location Management Functions ---
    const loadLocationsForTrail = async (trailId) => {
        locationListContainer.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        try {
            const response = await fetch(`/.netlify/functions/get-locations?trailId=${trailId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const locationLinks = await response.json();

            if (locationLinks.length === 0) {
                locationListContainer.innerHTML = `<div class="alert alert-info">No locations found for this trail.</div>`;
                return;
            }

            const locationCards = locationLinks.map(link => {
                const location = link.locations; // The actual location data is nested
                return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title mb-1"><span class="badge bg-secondary me-2">${link.stop_number}</span> ${location.name}</h5>
                                <p class="card-subtitle text-muted">${location.category}</p>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-secondary me-2" disabled><i class="bi bi-pencil-fill"></i> Edit</button>
                                <button class="btn btn-sm btn-danger" disabled><i class="bi bi-trash-fill"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
            locationListContainer.innerHTML = locationCards;

        } catch (error) {
            console.error('Error loading locations:', error);
            locationListContainer.innerHTML = `<div class="alert alert-danger">Could not load locations.</div>`;
        }
    };

    // --- Trail Management Functions ---
    const loadTrails = async () => {
        trailListContainer.innerHTML = `<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        const { data: trails, error } = await supabaseClient.from('trails').select('*').order('id', { ascending: true });

        if (error) {
            console.error('Error fetching trails:', error);
            trailListContainer.innerHTML = `<div class="alert alert-danger">Error fetching trails.</div>`;
            return;
        }

        if (trails.length === 0) {
            trailListContainer.innerHTML = `<div class="alert alert-info">No trails found. Click "Add New Trail" to get started.</div>`;
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
                            <button class="btn btn-sm btn-secondary me-2 edit-trail-btn" data-trail-id="${trail.id}" disabled>
                                <i class="bi bi-pencil-fill"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-primary manage-locations-btn" data-trail-id="${trail.id}" data-trail-name="${trail.name}">
                                <i class="bi bi-geo-alt-fill"></i> Manage Locations
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        trailListContainer.innerHTML = trailCards;
    };

    const handleAddTrail = async (event) => {
        event.preventDefault();
        const trailData = {
            name: document.getElementById('trail-name').value,
            theme: document.getElementById('trail-theme').value,
            description: document.getElementById('trail-description').value,
            duration_text: document.getElementById('trail-duration').value,
            distance_text: document.getElementById('trail-distance').value,
        };
        try {
            const response = await fetch('/.netlify/functions/create-trail', {
                method: 'POST',
                body: JSON.stringify(trailData)
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to add trail');
            }
            addTrailModal.hide();
            addTrailForm.reset();
            loadTrails();
        } catch (error) {
            console.error('Error submitting new trail:', error);
            alert(`Error: ${error.message}`);
        }
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

    // --- View Switching Functions ---
    const showLocationsView = (trailId, trailName) => {
        adminView.classList.add('d-none');
        locationsView.classList.remove('d-none');
        locationsTrailTitle.textContent = trailName;
        loadLocationsForTrail(trailId);
    };

    const handleTrailListClick = (event) => {
        const target = event.target.closest('.manage-locations-btn');
        if (target) {
            const trailId = target.dataset.trailId;
            const trailName = target.dataset.trailName;
            showLocationsView(trailId, trailName);
        }
    };
    
    const showAdminView = () => {
        locationsView.classList.add('d-none');
        loginView.classList.add('d-none');
        adminView.classList.remove('d-none');
        loadTrails();
    };

    const showLoginView = () => {
        adminView.classList.add('d-none');
        loginView.classList.remove('d-none');
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
    addNewTrailButton.addEventListener('click', () => addTrailModal.show());
    addTrailForm.addEventListener('submit', handleAddTrail);
    trailListContainer.addEventListener('click', handleTrailListClick);
    backToTrailsButton.addEventListener('click', showAdminView);
});