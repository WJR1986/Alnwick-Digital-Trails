document.addEventListener('DOMContentLoaded', () => {
    const trailListContainer = document.getElementById('trail-list');

    const renderTrails = (trails) => {
        trailListContainer.innerHTML = '';
        trails.forEach(trail => {
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6';
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
                    <div class="card-footer bg-white border-0 p-3">
                         <a href="#" class="btn btn-primary w-100 disabled">
                            <i class="bi bi-cart-fill"></i> Purchase Trail (Coming Soon)
                        </a>
                    </div>
                </div>
            `;
            trailListContainer.appendChild(card);
        });
    };

    const fetchTrails = async () => {
        try {
            const response = await fetch('/.netlify/functions/get-trails');
            if (!response.ok) throw new Error('Failed to fetch trails');
            const trails = await response.json();
            renderTrails(trails);
        } catch (error) {
            console.error(error);
            trailListContainer.innerHTML = '<p class="text-center text-danger">Could not load trails.</p>';
        }
    };

    fetchTrails();
});