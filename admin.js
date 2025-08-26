// --- admin.js ---
// This script manages the admin panel for the Alnwick Digital Trails application.

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const loginView = document.getElementById('login-view');
    const adminView = document.getElementById('admin-view');
    const locationsView = document.getElementById('locations-view'); // New
    const loginForm = document.getElementById('login-form');
    // ... (other selectors)
    const logoutButton = document.getElementById('logout-button');
    const trailListContainer = document.getElementById('trail-list-container');
    const addNewTrailButton = document.getElementById('add-new-trail-button');
    const addTrailModalEl = document.getElementById('add-trail-modal');
    const addTrailModal = new bootstrap.Modal(addTrailModalEl);
    const addTrailForm = document.getElementById('add-trail-form');
    const backToTrailsButton = document.getElementById('back-to-trails-button'); // New
    const locationsTrailTitle = document.getElementById('locations-trail-title'); // New

    // --- Supabase Initialization ---
    const SUPABASE_URL = 'https://smqqultilrhuzkybvlzs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtcXF1bHRpbHJodXpreWJ2bHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjcyNDUsImV4cCI6MjA3MDk0MzI0NX0.uuqMY1ZHEzZKwg1c99r5FQnipprCVUrRYfWSXfprKIs';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- Core Functions ---
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
        // ... (this function is unchanged)
    };

    // --- NEW: View Switching for Locations Page ---
    const showLocationsView = (trailId, trailName) => {
        adminView.classList.add('d-none');
        locationsView.classList.remove('d-none');
        locationsTrailTitle.textContent = trailName;
        // In the future, we will call a function here to load the locations for trailId
    };

    const handleTrailListClick = (event) => {
        const target = event.target.closest('.manage-locations-btn');
        if (target) {
            const trailId = target.dataset.trailId;
            const trailName = target.dataset.trailName;
            showLocationsView(trailId, trailName);
        }
    };
    
    // --- Existing View Switching ---
    const showAdminView = () => {
        locationsView.classList.add('d-none'); // Hide locations view if visible
        loginView.classList.add('d-none');
        adminView.classList.remove('d-none');
        loadTrails();
    };

    const showLoginView = () => {
        adminView.classList.add('d-none');
        loginView.classList.remove('d-none');
    };
    
    // ... (handleLogin and handleLogout are unchanged)

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
    trailListContainer.addEventListener('click', handleTrailListClick); // New
    backToTrailsButton.addEventListener('click', showAdminView); // New
});