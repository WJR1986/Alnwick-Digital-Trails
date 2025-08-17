// --- GLOBAL VARIABLE ---
let trailData = null; // To store the current trail data
let map = null;       // To store the map instance

// --- QR SCANNER LOGIC ---
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scanned: ${decodedText}`);

    // Check if it's a trail access code (from a leaflet)
    if (decodedText.startsWith('ALNWICK-TRAIL-')) {
        html5QrcodeScanner.clear();
        verifyTrailCode(decodedText);
    }
    // Check if it's a secret unlock code (at a location)
    else if (decodedText.startsWith('secret-')) {
        // Don't stop the scanner, just show the secret
        revealSecret(decodedText);
    }
}

let html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);


// --- FUNCTION TO VERIFY INITIAL TRAIL CODE ---
async function verifyTrailCode(code) {
    const response = await fetch('/.netlify/functions/verify', {
        method: 'POST',
        body: JSON.stringify({ code: code })
    });

    const result = await response.json();

    if (result.success) {
        alert(`Trail Unlocked: ${result.trail.name}`);
        trailData = result; // Store the entire package

        document.getElementById('scanner-container').style.display = 'none';
        document.getElementById('map-container').style.display = 'block';

        initializeMap(trailData);
    } else {
        alert(`Error: ${result.message}`);
    }
}


// --- FUNCTION TO REVEAL A HIDDEN SECRET ---
function revealSecret(secretCode) {
    if (!trailData) return; // No trail loaded

    // Find the location in our trail data that matches the secret code
    const location = trailData.locations.find(loc => loc.secret_code === secretCode);

    if (location && location.qr_secret_story) {
        // Use a more elegant modal/popup in the future, but alert works for now
        alert(`Secret for ${location.name}:\n\n${location.qr_secret_story}`);
    } else {
        alert('Secret not found for this trail.');
    }
}


// --- MAP LOGIC ---
function initializeMap(data) {
    // Center the map on the first location of the trail
    const startLocation = data.locations[0];
    map = L.map('map').setView([startLocation.latitude, startLocation.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add a marker for each location on the trail
    data.locations.forEach((location, index) => {
        const stopNumber = index + 1;
        const marker = L.marker([location.latitude, location.longitude]).addTo(map);

        // Create the popup content from your document's data
        const popupContent = `<b>${stopNumber}. ${location.name}</b><br>${location.description}`;
        marker.bindPopup(popupContent);
    });

    // You can also draw a line connecting the stops here if you wish
}