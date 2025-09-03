// app.js

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service worker registered.', reg))
            .catch(err => console.error('Service worker registration failed.', err));
    });
}

// This function will be called by the new "End Trail" button
function endTrail() {
    localStorage.removeItem('unlockedTrail');
    location.reload();
}


document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let allTrails = [];
    let currentTrailData = null;
    let map = null;
    let html5QrcodeScanner = null;
    let secretScanner = null;
    
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
    const scanSecretButton = document.getElementById('scan-secret-button');
    const closeSecretScannerButton = document.getElementById('close-secret-scanner-button');
    const secretQrReaderContainer = document.getElementById('secret-qr-reader-container');
    const endTrailButton = document.getElementById('end-trail-button'); // New button
    let isSecretScannerActive = false;


    // --- INITIALIZATION ---
    const init = async () => {
        // CHECK FOR A CACHED TRAIL FIRST
        const cachedTrail = localStorage.getItem('unlockedTrail');
        if (cachedTrail) {
            console.log("Found a cached trail, loading it from localStorage.");
            const trailData = JSON.parse(cachedTrail);
            showLiveTrailView(trailData);
            return; // Stop the init function here to prevent fetching public trails
        }

        // If no cached trail, proceed to fetch public trails
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
        <img src="${trail.image_url || 'https://via.placeholder.com/400x225.png?text=Alnwick+Trail'}" class="card-img-top" alt="${trail.name}">
        
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
        scanSecretButton.classList.remove('d-none');
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
                // SAVE THE UNLOCKED TRAIL TO LOCALSTORAGE
                localStorage.setItem('unlockedTrail', JSON.stringify(result));

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
            alert('Secret not found for your current trail.');
        }
    };

    // --- MAP LOGIC ---
    const initializeMap = (data) => {
        if (map) {
            map.remove();
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
    };
    
    // --- QR SCANNER LOGIC ---
    const startUnlockScanner = () => {
        qrReaderContainer.classList.remove('d-none');
        scanQrButton.textContent = 'Close Scanner';

        html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: {width: 250, height: 250} });
        html5QrcodeScanner.render((decodedText, decodedResult) => {
            trailCodeInput.value = decodedText;
            stopUnlockScanner();
            verifyTrailCode(decodedText);
        }, (errorMessage) => {});
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
        if (isSecretScannerActive) return;
        isSecretScannerActive = true;

        secretQrReaderContainer.classList.remove('d-none');
        scanSecretButton.classList.add('d-none');

        secretScanner = new Html5QrcodeScanner("secret-qr-reader", { fps: 10, qrbox: {width: 250, height: 250} });
        secretScanner.render((decodedText, decodedResult) => {
            revealSecret(decodedText);
            stopSecretScanner();
        }, (errorMessage) => {});
    };

    const stopSecretScanner = () => {
        if (!isSecretScannerActive) return;
        if (secretScanner) {
            secretScanner.clear().catch(error => {
                console.error("Failed to clear the secret QR scanner.", error);
            });
            secretScanner = null;
        }
        secretQrReaderContainer.classList.add('d-none');
        scanSecretButton.classList.remove('d-none');
        isSecretScannerActive = false;
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

    scanSecretButton.addEventListener('click', startSecretScanner);
    closeSecretScannerButton.addEventListener('click', stopSecretScanner);
    endTrailButton.addEventListener('click', endTrail);
    
    document.getElementById('unlock-modal').addEventListener('hidden.bs.modal', stopUnlockScanner);


    // Start the application
    init();
});