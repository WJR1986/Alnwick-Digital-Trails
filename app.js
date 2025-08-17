// app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allTrails = [];
    let currentTrailData = null;
    let map = null;
    let html5QrcodeScanner = null;
    
    // Modals
    const unlockModal = new bootstrap.Modal(document.getElementById('unlock-modal'));
    const secretModal = new bootstrap.Modal(document.getElementById('secret-modal'));

    // --- VIEWS ---
    const homeView = document.getElementById('home-view');
    const liveTrailView = document.getElementById('live-trail-view');
    const trailListContainer = document.getElementById('trail-list');
    
    // --- UI ELEMENTS ---
    const unlockButton = document.getElementById('unlock-button');
    const scanQrButton = document.getElementById('scan-qr-button');
    const trailCodeInput = document.getElementById('trail-code-input');
    const qrReaderContainer = document.getElementById('qr-reader-container');

    // --- INITIALIZATION ---
    const init = async () => {
        try {
            const response = await fetch('/.netlify/functions/get-trails');
            if (!response.ok) throw new Error('Failed to fetch trails');
            allTrails = await response.json();
            renderHomeView(allTrails);
        } catch (error) {
            console.error(error);
            trailListContainer.innerHTML = `<p class="text-center text-danger">Could not load trails. Please try again later.</p>`;
        }
    };

    // --- RENDER FUNCTIONS ---
    const renderHomeView = (trails) => {
        trailListContainer.innerHTML = ''; // Clear loading spinner
        if (!trails || trails.length === 0) {
            trailListContainer.innerHTML = `<p class="text-center">No trails available at the moment.</p>`;
            return;
        }

        trails.forEach(trail => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';
            card.innerHTML = `
                <div class="card h-100 shadow-sm trail-card">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${trail.name}</h5>
                        <p class="card-text text-muted small">${trail.theme}</p>
                        <p class="card-text flex-grow-1">${trail.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="badge bg-secondary"><i class="bi bi-clock"></i> ${trail.duration_text}</span>
                            <span class="badge bg-secondary"><i class="bi bi-pin-map"></i> ${trail.distance_text}</span>
                        </div>
                    </div>
                    <div class="card-footer bg-white border-0">
                         <button class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#unlock-modal">
                            <i class="bi bi-unlock-fill"></i> Unlock Trail
                        </button>
                    </div>
                </div>
            `;
            trailListContainer.appendChild(card);
        });
    };
    
    // --- VIEW SWITCHING ---
    const showLiveTrailView = (data) => {
        currentTrailData = data;
        document.getElementById('trail-title').textContent = data.trail.name;
        homeView.classList.add('d-none');
        liveTrailView.classList.remove('d-none');
        initializeMap(data);
    };

    // --- CORE LOGIC ---
    const verifyTrailCode = async (code) => {
        if (!code) {
            alert('Please enter a code.');
            return;
        }
        
        unlockButton.disabled = true;
        unlockButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...`;

        try {
            const response = await fetch('/.netlify/functions/verify', {
                method: 'POST',
                body: JSON.stringify({ code: code })
            });
            const result = await response.json();

            if (result.success) {
                unlockModal.hide();
                showLiveTrailView(result);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Verification failed:', error);
            alert('An error occurred. Please check your connection and try again.');
        } finally {
            unlockButton.disabled = false;
            unlockButton.innerHTML = `<i class="bi bi-key-fill"></i> Unlock Trail`;
        }
    };
    
    const revealSecret = (secretCode) => {
        if (!currentTrailData) return;
        const location = currentTrailData.locations.find(loc => loc.secret_code === secretCode);
        if (location && location.qr_secret_story) {
            document.getElementById('secret-location-name').textContent = location.name;
            document.getElementById('secret-story-content').textContent = location.qr_secret_story;
            secretModal.show();
        } else {
            // This might happen if a QR code from a different trail is scanned
            alert('Secret not found for your current trail.');
        }
    };

    // --- MAP LOGIC ---
    const initializeMap = (data) => {
        if (map) {
            map.remove(); // Remove previous map instance if it exists
        }
        const startLocation = data.locations[0];
        map = L.map('map').setView([startLocation.latitude, startLocation.longitude], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        data.locations.forEach((location, index) => {
            const stopNumber = index + 1;
            const marker = L.marker([location.latitude, location.longitude]).addTo(map);
            const popupContent = `<b>${stopNumber}. ${location.name}</b><br>${location.description}`;
            marker.bindPopup(popupContent);
        });
        
        // Start a separate scanner for in-trail secrets
        startSecretScanner();
    };
    
    // --- QR SCANNER LOGIC ---
    const startUnlockScanner = () => {
        qrReaderContainer.classList.remove('d-none');
        scanQrButton.textContent = 'Close Scanner';

        html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: {width: 250, height: 250} });
        html5QrcodeScanner.render((decodedText, decodedResult) => {
            // on success
            trailCodeInput.value = decodedText;
            stopUnlockScanner();
            verifyTrailCode(decodedText);
        }, (errorMessage) => {
            // on error
        });
    };

    const stopUnlockScanner = () => {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner.", error);
            });
            html5QrcodeScanner = null;
        }
        qrReaderContainer.classList.add('d-none');
        scanQrButton.textContent = 'Scan QR Code';
    };
    
    const startSecretScanner = () => {
        // This is a conceptual function. In a real app, you might overlay a scan button on the map
        // or re-use the main scanner. For simplicity, we'll just listen for any QR code.
        // A more robust solution would be a dedicated "Scan Secret" button on the map view.
        
        // For now, we can imagine a scenario where the user has to go back to a scanner page
        // or we can implement a simple global scanner. The logic below is a placeholder.
        console.log("Secret scanner ready. In a real app, provide a UI button to trigger this.");
    };


    // --- EVENT LISTENERS ---
    unlockButton.addEventListener('click', () => {
        const code = trailCodeInput.value.trim();
        verifyTrailCode(code);
    });

    scanQrButton.addEventListener('click', () => {
        if (html5QrcodeScanner) {
            stopUnlockScanner();
        } else {
            startUnlockScanner();
        }
    });
    
    // When the unlock modal is closed, stop the scanner
    document.getElementById('unlock-modal').addEventListener('hidden.bs.modal', stopUnlockScanner);


    // Start the application
    init();
});
