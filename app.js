// Register the service worker for offline capability
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
   .then(reg => console.log('Service worker registered', reg))
   .catch(err => console.log('Service worker not registered', err));
}

// --- QR SCANNER LOGIC ---
function onScanSuccess(decodedText, decodedResult) {
  console.log(`Code matched = ${decodedText}`, decodedResult);
  // Stop scanning
  html5QrcodeScanner.clear();
  // Call a function to verify the code
  verifyCode(decodedText);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
  "qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);

// --- FUNCTION TO VERIFY CODE ---
async function verifyCode(code) {
  // This will call our serverless function (see Step 3)
  const response = await fetch('/.netlify/functions/verify', {
      method: 'POST',
      body: JSON.stringify({ code: code })
  });

  const result = await response.json();

  if (result.success) {
      alert('Trail Unlocked!');
      // Hide scanner, show map
      document.getElementById('scanner-container').style.display = 'none';
      document.getElementById('map-container').style.display = 'block';
      // Initialize the map with the unlocked trail data
      initializeMap(result.trail);
  } else {
      alert(`Error: ${result.message}`);
      // Optionally, restart the scanner
  }
}

// --- MAP LOGIC ---
function initializeMap(trailData) {
  // Initialize Leaflet map
  var map = L.map('map').setView([55.415, -1.706], 15); // Centered on Alnwick

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Add markers for the trail stops from trailData
  // For example: L.marker([55.415, -1.706]).addTo(map).bindPopup("Alnwick Castle");
}