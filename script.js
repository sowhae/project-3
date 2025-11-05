// ===== THREE.JS SCENE SETUP =====
let scene, camera, renderer;
let buildings = [];
let roadSegments = [];
let motorcycle = {};
let policeCars = [];
let drones = [];
let particles = [];
let rainDrops = [];
let neonSigns = [];
let streetLights = [];
let gameState = 'idle'; // idle, chase, crossroads, ending
let speed = 0;
let targetSpeed = 0;
let steerAngle = 0;
let targetSteerAngle = 0;
let crossroadsDistance = 0;
let chosenPath = null; // 'left', 'center', 'right'

// Colors
const COLORS = {
    cyan: 0x00ffff,
    magenta: 0xff00ff,
    pink: 0xff0088,
    purple: 0x8800ff,
    green: 0x00ff88,
    red: 0xff0000,
    blue: 0x0088ff,
    yellow: 0xffff00,
    white: 0xffffff,
    orange: 0xff8800
};

// ===== INITIALIZATION =====
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000510, 0.012);

    // Camera (POV)
    camera = new THREE.PerspectiveCamera(
        80,
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
    const ambientLight = new THREE.AmbientLight(0x4444ff, 0.4);
    scene.add(ambientLight);

    const frontLight = new THREE.DirectionalLight(0x00ffff, 0.6);
    frontLight.position.set(0, 10, 10);
    scene.add(frontLight);

    // Create world
    createMotorcycle();
    createCity();
    createRoad();
    createRain();
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
        color: 0x1a1a1a,
        emissive: 0x00ffff,
        emissiveIntensity: 0.4,
        shininess: 100,
        metalness: 0.8
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
        opacity: 0.9
    });

    const leftGrip = new THREE.Mesh(gripGeo, gripMat);
    leftGrip.position.set(-1.2, 1.3, 1.5);
    leftGrip.rotation.z = Math.PI / 2;
    camera.add(leftGrip);

    const rightGrip = leftGrip.clone();
    rightGrip.position.set(1.2, 1.3, 1.5);
    camera.add(rightGrip);

    // Mirrors with cyan glow
    const mirrorGeo = new THREE.BoxGeometry(0.3, 0.2, 0.05);
    const mirrorMat = new THREE.MeshPhongMaterial({
        color: 0x88ffff,
        emissive: COLORS.cyan,
        emissiveIntensity: 0.6,
        shininess: 100
    });

    const leftMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    leftMirror.position.set(-1.5, 1.6, 1.2);
    leftMirror.rotation.y = -0.5;
    camera.add(leftMirror);

    const rightMirror = leftMirror.clone();
    rightMirror.position.set(1.5, 1.6, 1.2);
    rightMirror.rotation.y = 0.5;
    camera.add(rightMirror);

    // Dashboard screen
    const screenGeo = new THREE.PlaneGeometry(1, 0.5);
    const screenMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.7
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.5, 1.2);
    screen.rotation.x = -0.5;
    camera.add(screen);

    // Headlight beams
    const headlightLeft = new THREE.SpotLight(COLORS.cyan, 2, 50, Math.PI / 6, 0.5);
    headlightLeft.position.set(-0.5, 1.5, 2);
    headlightLeft.target.position.set(-0.5, 0, 20);
    camera.add(headlightLeft);
    camera.add(headlightLeft.target);

    const headlightRight = new THREE.SpotLight(COLORS.magenta, 2, 50, Math.PI / 6, 0.5);
    headlightRight.position.set(0.5, 1.5, 2);
    headlightRight.target.position.set(0.5, 0, 20);
    camera.add(headlightRight);
    camera.add(headlightRight.target);

    motorcycle.leftHandlebar = leftHandlebar;
    motorcycle.rightHandlebar = rightHandlebar;
    motorcycle.leftGrip = leftGrip;
    motorcycle.rightGrip = rightGrip;
}

// ===== CREATE ENHANCED CYBERPUNK CITY =====
function createCity() {
    const buildingCount = 120;

    for (let i = 0; i < buildingCount; i++) {
        const building = createBuilding();
        const side = Math.random() > 0.5 ? 1 : -1;

        building.position.x = side * (12 + Math.random() * 40);
        building.position.z = -50 - Math.random() * 300;
        building.position.y = building.geometry.parameters.height / 2;

        buildings.push(building);
        scene.add(building);

        // Add street lights
        if (Math.random() > 0.7) {
            const streetLight = createStreetLight();
            streetLight.position.set(
                side * (8 + Math.random() * 3),
                0,
                building.position.z
            );
            streetLights.push(streetLight);
            scene.add(streetLight);
        }
    }
}

function createBuilding() {
    const width = 4 + Math.random() * 12;
    const height = 30 + Math.random() * 100;
    const depth = 4 + Math.random() * 12;

    const geometry = new THREE.BoxGeometry(width, height, depth);

    // Random neon color
    const neonColors = [COLORS.cyan, COLORS.magenta, COLORS.pink, COLORS.purple, COLORS.blue];
    const emissiveColor = neonColors[Math.floor(Math.random() * neonColors.length)];

    const material = new THREE.MeshPhongMaterial({
        color: 0x0a0a20,
        emissive: emissiveColor,
        emissiveIntensity: 0.2 + Math.random() * 0.3,
        shininess: 40
    });

    const building = new THREE.Mesh(geometry, material);

    // Add windows (glowing grid pattern)
    const windowCount = Math.floor(height / 4);
    const windowsPerRow = Math.floor(width / 1.5);

    for (let i = 0; i < windowCount; i++) {
        for (let j = 0; j < windowsPerRow; j++) {
            if (Math.random() > 0.2) {
                const windowGeo = new THREE.PlaneGeometry(0.8, 1.2);
                const isOn = Math.random() > 0.3;
                const windowMat = new THREE.MeshBasicMaterial({
                    color: isOn ? (Math.random() > 0.5 ? COLORS.cyan : COLORS.yellow) : 0x111122,
                    transparent: true,
                    opacity: isOn ? (0.7 + Math.random() * 0.3) : 0.2
                });
                const window = new THREE.Mesh(windowGeo, windowMat);
                window.position.y = -height/2 + 5 + i * 4;
                window.position.x = -width/2 + 1 + j * 1.5;
                window.position.z = depth/2 + 0.02;
                building.add(window);
            }
        }
    }

    // Add neon billboard/sign
    if (Math.random() > 0.4) {
        const signWidth = width * 0.8;
        const signHeight = 3 + Math.random() * 4;
        const signGeo = new THREE.PlaneGeometry(signWidth, signHeight);
        const signColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        const signMat = new THREE.MeshBasicMaterial({
            color: signColor,
            transparent: true,
            opacity: 0.9
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.y = height/2 - 10 - Math.random() * 20;
        sign.position.z = depth/2 + 0.1;
        building.add(sign);

        // Add sign light
        const signLight = new THREE.PointLight(signColor, 3, 25);
        signLight.position.copy(sign.position);
        signLight.position.z += 2;
        building.add(signLight);
    }

    // Rooftop antenna with blinking light
    if (Math.random() > 0.6) {
        const antennaGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
        const antennaMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = height/2 + 4;
        building.add(antenna);

        const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: COLORS.red });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = height/2 + 8;
        building.add(beacon);

        const beaconLight = new THREE.PointLight(COLORS.red, 5, 30);
        beaconLight.position.y = height/2 + 8;
        building.add(beaconLight);
    }

    return building;
}

function createStreetLight() {
    const group = new THREE.Group();

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3;
    group.add(pole);

    // Light head
    const lightGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({
        color: COLORS.orange,
        transparent: true,
        opacity: 0.9
    });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 6;
    group.add(light);

    // Point light
    const pointLight = new THREE.PointLight(COLORS.orange, 2, 15);
    pointLight.position.y = 6;
    group.add(pointLight);

    return group;
}

// ===== CREATE ROAD WITH CROSSROADS =====
function createRoad() {
    const roadLength = 30;
    const roadWidth = 12;

    // Main road segments
    for (let i = 0; i < 15; i++) {
        const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
        const roadMat = new THREE.MeshPhongMaterial({
            color: 0x0a0a15,
            emissive: 0x220044,
            emissiveIntensity: 0.15
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.z = -i * roadLength;
        road.position.y = 0;

        // Road lane markers
        const lineGeo = new THREE.PlaneGeometry(0.4, roadLength);
        const lineMat = new THREE.MeshBasicMaterial({
            color: COLORS.yellow,
            transparent: true,
            opacity: 0.8
        });

        // Dashed center line
        for (let dash = 0; dash < 10; dash++) {
            const dashGeo = new THREE.PlaneGeometry(0.3, 2);
            const dashLine = new THREE.Mesh(dashGeo, lineMat);
            dashLine.rotation.x = -Math.PI / 2;
            dashLine.position.set(0, 0.02, -i * roadLength - dash * 3);
            scene.add(dashLine);
        }

        // Side lines
        const leftLine = new THREE.Mesh(lineGeo, lineMat);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-roadWidth/2 + 0.5, 0.02, -i * roadLength);
        scene.add(leftLine);

        const rightLine = leftLine.clone();
        rightLine.position.x = roadWidth/2 - 0.5;
        scene.add(rightLine);

        roadSegments.push({ road, type: 'straight' });
        scene.add(road);
    }
}

// ===== CREATE CROSSROADS =====
function createCrossroads() {
    const crossroadsZ = -200;

    // Intersection platform
    const intersectionGeo = new THREE.PlaneGeometry(40, 40);
    const intersectionMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: 0x220044,
        emissiveIntensity: 0.2
    });
    const intersection = new THREE.Mesh(intersectionGeo, intersectionMat);
    intersection.rotation.x = -Math.PI / 2;
    intersection.position.set(0, 0, crossroadsZ);
    scene.add(intersection);

    // Left road path
    const leftRoadGeo = new THREE.PlaneGeometry(12, 60);
    const leftRoad = new THREE.Mesh(leftRoadGeo, intersectionMat);
    leftRoad.rotation.x = -Math.PI / 2;
    leftRoad.rotation.z = -Math.PI / 6; // 30 degrees left
    leftRoad.position.set(-20, 0, crossroadsZ - 40);
    scene.add(leftRoad);

    // Right road path
    const rightRoad = leftRoad.clone();
    rightRoad.rotation.z = Math.PI / 6; // 30 degrees right
    rightRoad.position.set(20, 0, crossroadsZ - 40);
    scene.add(rightRoad);

    // Center road (straight)
    const centerRoad = new THREE.Mesh(new THREE.PlaneGeometry(12, 60), intersectionMat);
    centerRoad.rotation.x = -Math.PI / 2;
    centerRoad.position.set(0, 0, crossroadsZ - 50);
    scene.add(centerRoad);

    // Add arrow signs
    createArrowSign(-15, crossroadsZ - 10, -Math.PI / 4, COLORS.cyan); // Left
    createArrowSign(0, crossroadsZ - 10, 0, COLORS.magenta); // Straight
    createArrowSign(15, crossroadsZ - 10, Math.PI / 4, COLORS.green); // Right

    return { intersection, leftRoad, centerRoad, rightRoad };
}

function createArrowSign(x, z, rotation, color) {
    // Arrow shape using triangles
    const arrowGeo = new THREE.ConeGeometry(1.5, 3, 3);
    const arrowMat = new THREE.MeshBasicMaterial({ color });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = rotation;
    arrow.position.set(x, 0.5, z);

    // Glow light
    const light = new THREE.PointLight(color, 3, 10);
    light.position.set(x, 2, z);
    scene.add(light);

    scene.add(arrow);
}

// ===== CREATE POLICE CARS =====
function spawnPoliceCar() {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: 0x111111,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    carGroup.add(body);

    // Car top (cockpit)
    const topGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
    const top = new THREE.Mesh(topGeo, bodyMat);
    top.position.y = 1.3;
    carGroup.add(top);

    // Police light bar (flashing red/blue)
    const lightBarGeo = new THREE.BoxGeometry(1.5, 0.2, 0.3);
    const lightBarRed = new THREE.MeshBasicMaterial({ color: COLORS.red });
    const lightBarBlue = new THREE.MeshBasicMaterial({ color: COLORS.blue });

    const redLight = new THREE.Mesh(lightBarGeo, lightBarRed);
    redLight.position.set(-0.4, 1.8, 0);
    carGroup.add(redLight);

    const blueLight = new THREE.Mesh(lightBarGeo, lightBarBlue);
    blueLight.position.set(0.4, 1.8, 0);
    carGroup.add(blueLight);

    // Flashing lights
    const redPointLight = new THREE.PointLight(COLORS.red, 5, 20);
    redPointLight.position.set(-0.4, 1.8, 0);
    carGroup.add(redPointLight);

    const bluePointLight = new THREE.PointLight(COLORS.blue, 5, 20);
    bluePointLight.position.set(0.4, 1.8, 0);
    carGroup.add(bluePointLight);

    // Headlights
    const headlightGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const headlightMat = new THREE.MeshBasicMaterial({ color: COLORS.white });

    const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
    headlightL.position.set(-0.7, 0.5, 2);
    carGroup.add(headlightL);

    const headlightR = headlightL.clone();
    headlightR.position.x = 0.7;
    carGroup.add(headlightR);

    // Position behind player
    carGroup.position.set(
        (Math.random() - 0.5) * 6,
        0.3,
        10 + Math.random() * 15
    );

    carGroup.userData = {
        redLight: redPointLight,
        blueLight: bluePointLight,
        flashTimer: 0
    };

    policeCars.push(carGroup);
    scene.add(carGroup);
}

// ===== CREATE POLICE DRONE =====
function spawnDrone() {
    const droneGroup = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: COLORS.red,
        emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    droneGroup.add(body);

    // Scanner ring
    const ringGeo = new THREE.TorusGeometry(0.8, 0.1, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLORS.red });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    droneGroup.add(ring);

    // Spotlight cone
    const coneGeo = new THREE.ConeGeometry(3, 6, 8, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI;
    cone.position.y = -3;
    droneGroup.add(cone);

    // Spotlight
    const spotlight = new THREE.SpotLight(COLORS.red, 5, 30, Math.PI / 4, 0.5);
    spotlight.position.y = 0;
    spotlight.target.position.set(0, -10, 0);
    droneGroup.add(spotlight);
    droneGroup.add(spotlight.target);

    // Red pulsing light
    const light = new THREE.PointLight(COLORS.red, 4, 20);
    droneGroup.add(light);

    droneGroup.position.set(
        (Math.random() - 0.5) * 20,
        5 + Math.random() * 5,
        -20 - Math.random() * 30
    );

    droneGroup.userData = { ring, spotlight, light };

    drones.push(droneGroup);
    scene.add(droneGroup);
}

// ===== CREATE RAIN EFFECT =====
function createRain() {
    const rainCount = 2000;

    for (let i = 0; i < rainCount; i++) {
        const dropGeo = new THREE.BoxGeometry(0.02, 0.02, 0.8);
        const dropMat = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            transparent: true,
            opacity: 0.3
        });
        const drop = new THREE.Mesh(dropGeo, dropMat);

        drop.position.x = (Math.random() - 0.5) * 100;
        drop.position.y = Math.random() * 50;
        drop.position.z = (Math.random() - 0.5) * 100;

        rainDrops.push(drop);
        scene.add(drop);
    }
}

// ===== CREATE PARTICLE SYSTEM (SPEED LINES) =====
function createParticles() {
    const particleCount = 800;

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.BoxGeometry(0.05, 0.05, 1.5);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? COLORS.cyan : COLORS.magenta,
            transparent: true,
            opacity: 0.4
        });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.x = (Math.random() - 0.5) * 30;
        particle.position.y = Math.random() * 12;
        particle.position.z = -Math.random() * 100;

        particles.push(particle);
        scene.add(particle);
    }
}

// ===== ANIMATION LOOP =====
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'chase' || gameState === 'crossroads') {
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

    // Steering
    steerAngle += (targetSteerAngle - steerAngle) * 0.1;
    camera.rotation.z = -steerAngle * 0.3;
    camera.position.x += steerAngle * 0.5;

    // Move world toward camera
    const moveSpeed = speed * 0.01;

    // Check for crossroads trigger
    crossroadsDistance += moveSpeed;
    if (crossroadsDistance > 150 && gameState === 'chase') {
        gameState = 'crossroads';
        createCrossroads();
        document.getElementById('crossroads-ui').classList.add('active');
    }

    // Buildings
    buildings.forEach(building => {
        building.position.z += moveSpeed;

        if (building.position.z > 20) {
            building.position.z = -300 - Math.random() * 100;
            const side = Math.random() > 0.5 ? 1 : -1;
            building.position.x = side * (12 + Math.random() * 40);
        }

        // Pulse effect
        building.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.001 + building.position.x) * 0.15;
    });

    // Street lights
    streetLights.forEach(light => {
        light.position.z += moveSpeed;
        if (light.position.z > 20) {
            light.position.z = -300;
        }
    });

    // Road
    roadSegments.forEach(segment => {
        segment.road.position.z += moveSpeed;
        if (segment.road.position.z > 30) {
            segment.road.position.z -= 450;
        }
    });

    // Rain
    rainDrops.forEach(drop => {
        drop.position.z += moveSpeed * 2;
        drop.position.y -= 0.5;

        if (drop.position.y < 0 || drop.position.z > 20) {
            drop.position.y = 20 + Math.random() * 30;
            drop.position.z = -50 - Math.random() * 50;
            drop.position.x = (Math.random() - 0.5) * 100;
        }
    });

    // Particles (speed lines)
    particles.forEach(particle => {
        particle.position.z += moveSpeed * 4;

        if (particle.position.z > 10) {
            particle.position.z = -100 - Math.random() * 50;
            particle.position.x = (Math.random() - 0.5) * 30;
            particle.position.y = Math.random() * 12;
        }

        const distance = Math.abs(particle.position.z);
        particle.material.opacity = Math.min(1, distance / 50) * 0.4;
    });

    // Police cars
    policeCars.forEach((car, index) => {
        car.position.z += moveSpeed * 0.7; // Catching up

        // Sway side to side
        car.position.x += Math.sin(Date.now() * 0.003 + index) * 0.05;

        // Flash lights
        car.userData.flashTimer += 0.1;
        if (Math.floor(car.userData.flashTimer) % 2 === 0) {
            car.userData.redLight.intensity = 5;
            car.userData.blueLight.intensity = 0;
        } else {
            car.userData.redLight.intensity = 0;
            car.userData.blueLight.intensity = 5;
        }

        if (car.position.z > 15) {
            scene.remove(car);
            policeCars.splice(index, 1);
        }
    });

    // Drones
    drones.forEach((drone, index) => {
        drone.position.z += moveSpeed * 0.6;
        drone.position.y += Math.sin(Date.now() * 0.003 + index) * 0.03;
        drone.position.x += Math.cos(Date.now() * 0.002 + index) * 0.04;

        // Rotate scanner ring
        drone.userData.ring.rotation.z += 0.1;

        // Pulse light
        drone.userData.light.intensity = 4 + Math.sin(Date.now() * 0.01) * 2;

        if (drone.position.z > 15) {
            scene.remove(drone);
            drones.splice(index, 1);
        }
    });

    // Handlebar shake
    const shake = Math.sin(Date.now() * 0.02) * 0.003 * (speed / 250);
    motorcycle.leftHandlebar.rotation.z = -0.3 + shake + steerAngle * 0.05;
    motorcycle.rightHandlebar.rotation.z = 0.3 - shake - steerAngle * 0.05;

    // Camera shake
    camera.position.y = 2 + Math.sin(Date.now() * 0.03) * 0.08 * (speed / 250);
}

function updateEnding() {
    speed *= 0.95;
    document.getElementById('speed').textContent = Math.floor(speed);

    const moveSpeed = speed * 0.01;

    buildings.forEach(building => {
        building.position.z += moveSpeed;
    });

    roadSegments.forEach(segment => {
        segment.road.position.z += moveSpeed;
    });

    rainDrops.forEach(drop => {
        drop.position.z += moveSpeed;
        drop.position.y -= 0.3;
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
    crossroadsDistance = 0;

    console.log('Game state:', gameState, 'Target speed:', targetSpeed);

    // Spawn police cars
    setTimeout(() => {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnPoliceCar(), i * 1000);
        }
    }, 1500);

    // Spawn drones
    setTimeout(() => {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => spawnDrone(), i * 800);
        }
    }, 2500);

    // Show warning
    setTimeout(() => {
        document.getElementById('warning').classList.add('active');
    }, 2000);

    // Keep spawning more police
    setInterval(() => {
        if (gameState === 'chase' && policeCars.length < 5) {
            spawnPoliceCar();
        }
        if (gameState === 'chase' && drones.length < 6) {
            spawnDrone();
        }
    }, 5000);
}

function choosePath(path) {
    console.log('Chosen path:', path);
    chosenPath = path;

    document.getElementById('crossroads-ui').classList.remove('active');

    // Steer camera based on choice
    if (path === 'left') {
        targetSteerAngle = -0.5;
    } else if (path === 'right') {
        targetSteerAngle = 0.5;
    } else {
        targetSteerAngle = 0;
    }

    setTimeout(() => {
        chooseEnding(path);
    }, 2000);
}

function chooseEnding(type) {
    gameState = 'ending';

    document.getElementById('warning').classList.remove('active');

    setTimeout(() => {
        document.getElementById('ending-screen').classList.add('active');

        const titleEl = document.getElementById('ending-title');
        const descEl = document.getElementById('ending-desc');

        if (type === 'left') {
            titleEl.textContent = 'RETURN CHANGED';
            titleEl.style.color = '#0ff';
            titleEl.style.textShadow = '0 0 30px #0ff, 0 0 60px #f0f';
            descEl.innerHTML = 'You disappeared into the crowd<br>But the city will never look the same<br>Colors are wrong, reality rewritten';

            buildings.forEach(building => {
                setInterval(() => {
                    const colors = [COLORS.cyan, COLORS.magenta, COLORS.green, COLORS.yellow];
                    building.material.emissive.setHex(colors[Math.floor(Math.random() * colors.length)]);
                }, 500);
            });

        } else if (type === 'center') {
            titleEl.textContent = 'DRIVE INTO VOID';
            titleEl.style.color = '#fff';
            titleEl.style.textShadow = '0 0 40px #0ff, 0 0 80px #f0f';
            descEl.innerHTML = 'Full throttle into infinite light<br>Speed becomes existence<br>The void welcomes you';

            targetSpeed = 500;
            scene.fog.density = 0.05;

            setTimeout(() => {
                renderer.setClearColor(0xffffff);
            }, 2000);

        } else if (type === 'right') {
            titleEl.textContent = 'BECOME THE GLITCH';
            titleEl.style.color = '#0f0';
            titleEl.style.textShadow = '0 0 30px #0f0';
            descEl.innerHTML = 'You merged with the system<br>Consciousness uploaded<br>Body dissolved into neon data';

            buildings.forEach(building => {
                building.material.wireframe = true;
                building.material.emissiveIntensity = 1;
                building.material.emissive.setHex(COLORS.green);
            });

            scene.fog.color.setHex(0x001100);
            renderer.setClearColor(0x001100);
        }
    }, 1000);
}

function restart() {
    gameState = 'idle';
    speed = 0;
    targetSpeed = 0;
    steerAngle = 0;
    targetSteerAngle = 0;
    crossroadsDistance = 0;
    chosenPath = null;

    policeCars.forEach(car => scene.remove(car));
    policeCars = [];

    drones.forEach(drone => scene.remove(drone));
    drones = [];

    scene.fog.density = 0.012;
    scene.fog.color.setHex(0x000510);
    renderer.setClearColor(0x000510);

    buildings.forEach(building => {
        building.material.wireframe = false;
        building.material.emissiveIntensity = 0.2 + Math.random() * 0.3;
    });

    buildings.forEach((building) => {
        const side = Math.random() > 0.5 ? 1 : -1;
        building.position.x = side * (12 + Math.random() * 40);
        building.position.z = -50 - Math.random() * 300;
    });

    camera.position.x = 0;
    camera.rotation.z = 0;

    document.getElementById('ending-screen').classList.remove('active');
    document.getElementById('crossroads-ui').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('start-screen').classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== KEYBOARD CONTROLS =====
let keysPressed = {};

document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;

    // Steering
    if (gameState === 'chase' || gameState === 'crossroads') {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
            targetSteerAngle = -0.3;
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
            targetSteerAngle = 0.3;
        }
    }

    // Crossroads choice
    if (gameState === 'crossroads') {
        if (e.key === '1' || e.key === 'ArrowLeft') choosePath('left');
        if (e.key === '2' || e.key === 'ArrowUp') choosePath('center');
        if (e.key === '3' || e.key === 'ArrowRight') choosePath('right');
    }

    if (e.key === ' ' && gameState === 'idle') {
        e.preventDefault();
        startGame();
    }

    if (e.key === 'r' && gameState === 'ending') {
        restart();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;

    // Reset steering
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' ||
        e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        targetSteerAngle = 0;
    }
});

// ===== START =====
window.addEventListener('load', () => {
    try {
        console.log('Starting initialization...');

        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded! Check your internet connection.');
            alert('Failed to load 3D library. Please check your internet connection and refresh.');
            return;
        }

        init();
        console.log('🏍️ NEON CHASE 3D LOADED');
        console.log('Controls: SPACE=start, A/D or Arrows=steer, 1/2/3=crossroads choice, R=restart');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize game: ' + error.message);
    }
});

// Make functions global
window.startGame = startGame;
window.chooseEnding = chooseEnding;
window.choosePath = choosePath;
window.restart = restart;
