const elements = {
    H: { name: 'Hydrogen', color: '#FF0000' },
    O: { name: 'Oxygen', color: '#0000FF' },
    H2O: { name: 'Water', color: '#00FFFF' }
};

const STRESS_THRESHOLD = 150;
const MAX_TEMP = 200;
const MAX_PRESSURE = 100;

let temperature = 25;
let pressure = 1;
let selectedElement = '';
let particleCount = 1;
let isExploded = false;
let elementCounts = { H: 0, O: 0, H2O: 0 };
let lidStress = 0;
let particles = [];
let lidPosition = 0;
let explosionParticles = [];

const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

function getState(element) {
    if (element === 'H2O') {
        if (temperature < 0) return 'Solid';
        if (temperature < 100) return 'Liquid';
        return 'Gas';
    }
    return 'Gas';
}

function addParticles() {
    if (selectedElement && elements[selectedElement]) {
        const newParticles = Array(particleCount).fill().map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            element: selectedElement,
            radius: 5
        }));
        particles = [...particles, ...newParticles];
        updateElementCounts();
    }
}

function resetSimulation() {
    particles = [];
    explosionParticles = [];
    isExploded = false;
    pressure = 1;
    temperature = 25;
    lidStress = 0;
    updateElementCounts();
    updateUI();
}

function createExplosionParticles() {
    explosionParticles = Array(50).fill().map(() => ({
        x: canvas.width / 2,
        y: lidPosition,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10,
        radius: Math.random() * 3 + 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 50%)`,
        life: 100
    }));
}

function updateElementCounts() {
    elementCounts = { H: 0, O: 0, H2O: 0 };
    particles.forEach(particle => {
        elementCounts[particle.element]++;
    });
    updateUI();
}

function combineParticles() {
    const hydrogen = particles.filter(p => p.element === 'H');
    const oxygen = particles.filter(p => p.element === 'O');
    
    while (hydrogen.length >= 2 && oxygen.length >= 1) {
        const h1 = hydrogen.pop();
        const h2 = hydrogen.pop();
        const o = oxygen.pop();
        
        particles = particles.filter(p => p !== h1 && p !== h2 && p !== o);
        
        particles.push({
            x: (h1.x + h2.x + o.x) / 3,
            y: (h1.y + h2.y + o.y) / 3,
            vx: (h1.vx + h2.vx + o.vx) / 3,
            vy: (h1.vy + h2.vy + o.vy) / 3,
            element: 'H2O',
            radius: 6
        });
    }
    updateElementCounts();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw container
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw lid
    lidPosition = isExploded ? -50 : Math.min(canvas.height / 2, (pressure / 100) * canvas.height / 2);
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, lidPosition, canvas.width, 10);

    // Draw stress meter
    const stressWidth = (lidStress / STRESS_THRESHOLD) * canvas.width;
    ctx.fillStyle = `hsl(${120 - (lidStress / STRESS_THRESHOLD) * 120}, 100%, 50%)`;
    ctx.fillRect(0, canvas.height - 10, stressWidth, 10);
    ctx.strokeRect(0, canvas.height - 10, canvas.width, 10);

    particles.forEach(particle => {
        // Update position
        particle.x += particle.vx * (temperature / 100);
        particle.y += particle.vy * (temperature / 100);

        // Bounce off walls and lid
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (!isExploded) {
            if (particle.y < lidPosition) {
                particle.y = lidPosition;
                particle.vy *= -1;
            }
            if (particle.y > canvas.height) particle.vy *= -1;
        } else {
            if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = elements[particle.element].color;
        ctx.fill();

        // Change particle size based on state
        const state = getState(particle.element);
        particle.radius = state === 'Solid' ? 5 : state === 'Liquid' ? 4 : 3;
    });

    // Draw explosion particles
    explosionParticles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // Gravity
        particle.life--;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        if (particle.life <= 0) {
            explosionParticles.splice(index, 1);
        }
    });

    combineParticles();

    requestAnimationFrame(animate);
}

function updateUI() {
    document.getElementById('tempValue').textContent = temperature;
    document.getElementById('pressureValue').textContent = pressure.toFixed(2);
    
    Object.keys(elements).forEach(element => {
        document.getElementById(`${element}-state`).textContent = getState(element);
        document.getElementById(`${element}-count`).textContent = elementCounts[element];
    });
}

function updateStress() {
    const tempFactor = temperature / MAX_TEMP;
    const pressureFactor = pressure / MAX_PRESSURE;
    lidStress = (tempFactor + pressureFactor) * (STRESS_THRESHOLD / 2);

    if (lidStress > STRESS_THRESHOLD && !isExploded) {
        isExploded = true;
        createExplosionParticles();
        // Scatter particles
        particles.forEach(particle => {
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
        });
    } else if (lidStress <= STRESS_THRESHOLD && isExploded) {
        isExploded = false;
        explosionParticles = [];
    }
}

// Event Listeners
document.getElementById('tempSlider').addEventListener('input', (e) => {
    temperature = parseInt(e.target.value);
    updateStress();
    updateUI();
});

document.getElementById('pressureSlider').addEventListener('input', (e) => {
    pressure = parseFloat(e.target.value);
    updateStress();
    updateUI();
});

document.getElementById('elementSelect').addEventListener('change', (e) => {
    selectedElement = e.target.value;
});

document.getElementById('particleCount').addEventListener('input', (e) => {
    particleCount = Math.max(1, parseInt(e.target.value) || 1);
});

document.getElementById('addParticles').addEventListener('click', addParticles);
document.getElementById('resetSimulation').addEventListener('click', resetSimulation);

// Start the simulation
animate();
updateUI();
