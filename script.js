// ===== THREE.JS SCENE SETUP =====
let scene, camera, renderer;
let buildings = [];
let roadSegments = [];
let motorcycle = {};
let drones = [];
let particles = [];
let gameState = 'idle'; // idle, chase, ending
let speed = 0;
let targetSpeed = 0;

// Colors
const COLORS = {
    cyan: 0x00ffff,
    magenta: 0xff00ff,
    pink: 0xff0088,
    purple: 0x8800ff,
    green: 0x00ff88,
    red: 0xff0000,
    yellow: 0xffff00,
    white: 0xffffff
};

// ===== INITIALIZATION =====
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000510, 0.015);

    // Camera (POV)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 0);
    camera.rotation.x = -0.1;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000510);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0x00ffff, 0.5);
    frontLight.position.set(0, 10, 10);
    scene.add(frontLight);

    // Create world
    createMotorcycle();
    createCity();
    createRoad();
    createParticles();

    // Start animation
    animate();

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// ===== CREATE 3D MOTORCYCLE (HANDLEBARS POV) =====
function createMotorcycle() {
    // Left Handlebar
    const leftHandlebarGeo = new THREE.BoxGeometry(0.15, 0.6, 0.3);
    const handlebarMat = new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3,
        shininess: 100
    });
    const leftHandlebar = new THREE.Mesh(leftHandlebarGeo, handlebarMat);
    leftHandlebar.position.set(-1.2, 1, 1.5);
    leftHandlebar.rotation.z = -0.3;
    camera.add(leftHandlebar);
    scene.add(camera);

    // Right Handlebar
    const rightHandlebar = leftHandlebar.clone();
    rightHandlebar.position.set(1.2, 1, 1.5);
    rightHandlebar.rotation.z = 0.3;
    camera.add(rightHandlebar);

    // Handlebar grips (glowing)
    const gripGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    const gripMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.8
    });

    const leftGrip = new THREE.Mesh(gripGeo, gripMat);
    leftGrip.position.set(-1.2, 1.3, 1.5);
    leftGrip.rotation.z = Math.PI / 2;
    camera.add(leftGrip);

    const rightGrip = leftGrip.clone();
    rightGrip.position.set(1.2, 1.3, 1.5);
    camera.add(rightGrip);

    // Dashboard screen
    const screenGeo = new THREE.PlaneGeometry(0.8, 0.4);
    const screenMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.6
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.5, 1.2);
    screen.rotation.x = -0.5;
    camera.add(screen);

    // Add point lights to handlebars
    const leftLight = new THREE.PointLight(COLORS.cyan, 1, 5);
    leftLight.position.set(-1.2, 1.3, 1.5);
    camera.add(leftLight);

    const rightLight = new THREE.PointLight(COLORS.magenta, 1, 5);
    rightLight.position.set(1.2, 1.3, 1.5);
    camera.add(rightLight);

    motorcycle.leftHandlebar = leftHandlebar;
    motorcycle.rightHandlebar = rightHandlebar;
    motorcycle.leftGrip = leftGrip;
    motorcycle.rightGrip = rightGrip;
}

// ===== CREATE CYBERPUNK CITY =====
function createCity() {
    const buildingCount = 80;

    for (let i = 0; i < buildingCount; i++) {
        const building = createBuilding();
        const side = Math.random() > 0.5 ? 1 : -1;

        building.position.x = side * (10 + Math.random() * 30);
        building.position.z = -50 - Math.random() * 200;
        building.position.y = building.geometry.parameters.height / 2;

        buildings.push(building);
        scene.add(building);
    }
}

function createBuilding() {
    const width = 3 + Math.random() * 8;
    const height = 20 + Math.random() * 80;
    const depth = 3 + Math.random() * 8;

    const geometry = new THREE.BoxGeometry(width, height, depth);

    // Random neon color
    const neonColors = [COLORS.cyan, COLORS.magenta, COLORS.pink, COLORS.purple];
    const emissiveColor = neonColors[Math.floor(Math.random() * neonColors.length)];

    const material = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: emissiveColor,
        emissiveIntensity: 0.3 + Math.random() * 0.4,
        shininess: 30
    });

    const building = new THREE.Mesh(geometry, material);

    // Add windows (glowing rectangles)
    const windowCount = Math.floor(height / 3);
    for (let i = 0; i < windowCount; i++) {
        if (Math.random() > 0.3) {
            const windowGeo = new THREE.PlaneGeometry(width * 0.8, 1.5);
            const windowMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? COLORS.cyan : COLORS.magenta,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.4
            });
            const window = new THREE.Mesh(windowGeo, windowMat);
            window.position.y = -height/2 + 5 + i * 3;
            window.position.z = depth/2 + 0.01;
            building.add(window);
        }
    }

    // Add neon sign on top
    if (Math.random() > 0.5) {
        const signGeo = new THREE.BoxGeometry(width * 0.6, 2, 0.2);
        const signMat = new THREE.MeshBasicMaterial({ color: emissiveColor });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.y = height/2 + 1;
        building.add(sign);

        // Add point light
        const light = new THREE.PointLight(emissiveColor, 2, 30);
        light.position.y = height/2 + 1;
        building.add(light);
    }

    return building;
}

// ===== CREATE ROAD =====
function createRoad() {
    const roadLength = 20;
    const roadWidth = 12;

    for (let i = 0; i < 20; i++) {
        const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMat = new THREE.MeshPhongMaterial({
            color: 0x0a0a15,
            emissive: 0x220044,
            emissiveIntensity: 0.2
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -i * roadLength;
        road.position.y = 0;

        // Road lines
        const lineGeo = new THREE.PlaneGeometry(0.3, roadLength);
        const lineMat = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            transparent: true,
            opacity: 0.6
        });

        // Center lines
        for (let j = 0; j < 3; j++) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(-3 + j * 3, 0.01, -i * roadLength);
            scene.add(line);
        }

        roadSegments.push(road);
        scene.add(road);
    }
}

// ===== CREATE PARTICLE SYSTEM (SPEED LINES) =====
function createParticles() {
    const particleCount = 500;

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 1);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? COLORS.cyan : COLORS.magenta,
            transparent: true,
            opacity: 0.6
        });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.x = (Math.random() - 0.5) * 20;
        particle.position.y = Math.random() * 10;
        particle.position.z = -Math.random() * 100;

        particles.push(particle);
        scene.add(particle);
    }
}

// ===== CREATE POLICE DRONES =====
function spawnDrone() {
    const droneGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const droneMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.8
    });
    const drone = new THREE.Mesh(droneGeo, droneMat);

    drone.position.x = (Math.random() - 0.5) * 15;
    drone.position.y = 3 + Math.random() * 5;
    drone.position.z = -30 - Math.random() * 20;

    // Add red light
    const light = new THREE.PointLight(COLORS.red, 3, 15);
    drone.add(light);

    // Add scanning cone
    const coneGeo = new THREE.ConeGeometry(2, 4, 8, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI;
    cone.position.y = -2;
    drone.add(cone);

    drones.push(drone);
    scene.add(drone);
}

// ===== ANIMATION LOOP =====
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'chase') {
        updateChase();
    } else if (gameState === 'ending') {
        updateEnding();
    }

    renderer.render(scene, camera);
}

function updateChase() {
    // Accelerate
    speed += (targetSpeed - speed) * 0.05;

    // Update speed display
    document.getElementById('speed').textContent = Math.floor(speed);

    // Move world toward camera
    const moveSpeed = speed * 0.01;

    // Buildings
    buildings.forEach(building => {
        building.position.z += moveSpeed;

        // Respawn behind
        if (building.position.z > 10) {
            building.position.z = -200 - Math.random() * 50;
            building.position.x = (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 30);
        }

        // Pulse emissive
        building.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.001 + building.position.x) * 0.2;
    });

    // Road
    roadSegments.forEach(road => {
        road.position.z += moveSpeed;
        if (road.position.z > 20) {
            road.position.z -= 400;
        }
    });

    // Particles (speed lines)
    particles.forEach(particle => {
        particle.position.z += moveSpeed * 3;

        if (particle.position.z > 5) {
            particle.position.z = -100 - Math.random() * 50;
            particle.position.x = (Math.random() - 0.5) * 20;
            particle.position.y = Math.random() * 10;
        }

        // Fade based on distance
        const distance = Math.abs(particle.position.z);
        particle.material.opacity = Math.min(1, distance / 50) * 0.6;
    });

    // Drones
    drones.forEach((drone, index) => {
        drone.position.z += moveSpeed * 0.8;
        drone.position.y += Math.sin(Date.now() * 0.003 + index) * 0.02;
        drone.position.x += Math.cos(Date.now() * 0.002 + index) * 0.03;

        // Rotate
        drone.rotation.y += 0.05;

        if (drone.position.z > 10) {
            scene.remove(drone);
            drones.splice(index, 1);
        }
    });

    // Handlebar shake
    const shake = Math.sin(Date.now() * 0.01) * 0.002;
    motorcycle.leftHandlebar.rotation.z = -0.3 + shake;
    motorcycle.rightHandlebar.rotation.z = 0.3 - shake;

    // Camera shake
    camera.position.y = 2 + Math.sin(Date.now() * 0.02) * 0.05;
}

function updateEnding() {
    // Slow down
    speed *= 0.95;
    document.getElementById('speed').textContent = Math.floor(speed);

    // Still move world but slower
    const moveSpeed = speed * 0.01;

    buildings.forEach(building => {
        building.position.z += moveSpeed;
    });

    roadSegments.forEach(road => {
        road.position.z += moveSpeed;
    });
}

// ===== GAME FUNCTIONS =====
function startGame() {
    console.log('startGame() called!');

    const startScreen = document.getElementById('start-screen');
    const hud = document.getElementById('hud');

    if (!startScreen || !hud) {
        console.error('Required elements not found!');
        return;
    }

    startScreen.classList.add('hidden');
    hud.classList.add('active');

    gameState = 'chase';
    targetSpeed = 250;

    console.log('Game state:', gameState, 'Target speed:', targetSpeed);

    // Spawn drones
    setTimeout(() => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => spawnDrone(), i * 500);
        }
    }, 2000);

    // Show warning
    setTimeout(() => {
        document.getElementById('warning').classList.add('active');
    }, 3000);

    // Show choices
    setTimeout(() => {
        document.getElementById('choices').classList.add('active');
    }, 5000);
}

function chooseEnding(type) {
    gameState = 'ending';

    document.getElementById('choices').classList.remove('active');
    document.getElementById('warning').classList.remove('active');

    setTimeout(() => {
        document.getElementById('ending-screen').classList.add('active');

        const titleEl = document.getElementById('ending-title');
        const descEl = document.getElementById('ending-desc');

        if (type === 'blend') {
            titleEl.textContent = 'RETURN CHANGED';
            titleEl.style.color = '#0ff';
            titleEl.style.textShadow = '0 0 30px #0ff, 0 0 60px #f0f';
            descEl.innerHTML = 'The drones pass you by<br>But the city will never look the same<br>Colors are wrong, reality rewritten';

            // Color shift buildings
            buildings.forEach(building => {
                setInterval(() => {
                    const colors = [COLORS.cyan, COLORS.magenta, COLORS.green, COLORS.yellow];
                    building.material.emissive.setHex(colors[Math.floor(Math.random() * colors.length)]);
                }, 500);
            });

        } else if (type === 'run') {
            titleEl.textContent = 'DRIVE INTO VOID';
            titleEl.style.color = '#fff';
            titleEl.style.textShadow = '0 0 40px #0ff, 0 0 80px #f0f';
            descEl.innerHTML = 'You burst into infinite light<br>Speed becomes existence<br>The void welcomes you';

            // Accelerate into infinity
            targetSpeed = 500;
            scene.fog.density = 0.05;

            // Fade to white
            setTimeout(() => {
                renderer.setClearColor(0xffffff);
            }, 2000);

        } else if (type === 'hack') {
            titleEl.textContent = 'BECOME THE GLITCH';
            titleEl.style.color = '#0f0';
            titleEl.style.textShadow = '0 0 30px #0f0';
            descEl.innerHTML = 'You don\'t escape<br>You merge with the neon system<br>Consciousness uploaded, body dissolved';

            // Pixelate effect - change materials
            buildings.forEach(building => {
                building.material.wireframe = true;
                building.material.emissiveIntensity = 1;
                building.material.emissive.setHex(COLORS.green);
            });

            // Make everything green
            scene.fog.color.setHex(0x001100);
            renderer.setClearColor(0x001100);
        }
    }, 1000);
}

function restart() {
    // Reset
    gameState = 'idle';
    speed = 0;
    targetSpeed = 0;

    // Clear drones
    drones.forEach(drone => scene.remove(drone));
    drones = [];

    // Reset scene
    scene.fog.density = 0.015;
    scene.fog.color.setHex(0x000510);
    renderer.setClearColor(0x000510);

    buildings.forEach(building => {
        building.material.wireframe = false;
        building.material.emissiveIntensity = 0.3 + Math.random() * 0.4;
    });

    // Reset positions
    buildings.forEach((building, i) => {
        const side = Math.random() > 0.5 ? 1 : -1;
        building.position.x = side * (10 + Math.random() * 30);
        building.position.z = -50 - Math.random() * 200;
    });

    // Hide/show UI
    document.getElementById('ending-screen').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('start-screen').classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener('keydown', (e) => {
    if (gameState === 'chase') {
        if (e.key === '1') chooseEnding('blend');
        if (e.key === '2') chooseEnding('run');
        if (e.key === '3') chooseEnding('hack');
    }

    if (e.key === ' ' && gameState === 'idle') {
        startGame();
    }

    if (e.key === 'r' && gameState === 'ending') {
        restart();
    }
});

// ===== START =====
window.addEventListener('load', () => {
    try {
        console.log('Starting initialization...');

        // Check if THREE is loaded
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded! Check your internet connection.');
            alert('Failed to load 3D library. Please check your internet connection and refresh.');
            return;
        }

        init();
        console.log('🏍️ NEON CHASE 3D LOADED');
        console.log('Controls: SPACE=start, 1/2/3=choose, R=restart');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize game: ' + error.message);
    }
});

// Make functions global so onclick works
window.startGame = startGame;
window.chooseEnding = chooseEnding;
window.restart = restart;
