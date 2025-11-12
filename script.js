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
let flyingCars = [];
let steamVents = [];
let sparkEmitters = [];
let gameState = 'idle'; // idle, intro, chase, stopped_at_crossroads_1, stopped_at_crossroads_2, stopped_at_crossroads_3, ending
let speed = 0;
let targetSpeed = 0;
let steerAngle = 0;
let targetSteerAngle = 0;
let crossroadsDistance = 0;
let decisionsMade = []; // Track all 3 decisions
let currentDecision = 0; // Which decision we're on (0, 1, 2)
let events = [];
let helicopter = null;
let obstacles = [];
let eventTimer = 0;
let introTimer = 0;
let pathPortals = []; // Clickable path objects
let raycaster, mouse;

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

    // Camera (Behind and above motorcycle - Cyberpunk 2077 style)
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 3, -4); // Behind and above rider
    camera.rotation.x = -0.15; // Looking slightly down over handlebars

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

    // Spawn flying cars (reduced for performance)
    for (let i = 0; i < 6; i++) {
        createFlyingCar();
    }

    // Create steam vents along the road (reduced for performance)
    for (let i = 0; i < 4; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        createSteamVent(side * (6 + Math.random() * 2), -20 - i * 20);
    }

    // Create overhead spark emitters (reduced for performance)
    for (let i = 0; i < 3; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        createSparkEmitter(side * (8 + Math.random() * 4), 8 + Math.random() * 4, -30 - i * 40);
    }

    // Setup raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Mouse events
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);

    // Start animation
    animate();

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// ===== CREATE 3D MOTORCYCLE (HANDLEBARS POV) =====
function createMotorcycle() {
    // Motorcycle body materials
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a0a,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3,
        shininess: 100
    });

    const chromeMat = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x00ffff,
        emissiveIntensity: 0.2,
        shininess: 200
    });

    // FUEL TANK (bigger, visible in front)
    const tankGeo = new THREE.BoxGeometry(1.2, 0.6, 1.8);
    const tank = new THREE.Mesh(tankGeo, bodyMat);
    tank.position.set(0, 0.3, 1.5);
    camera.add(tank);

    // Tank logo/stripe (glowing cyan)
    const stripeGeo = new THREE.PlaneGeometry(0.9, 0.25);
    const stripeMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.9
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, 0.6, 1.5);
    stripe.rotation.x = -Math.PI / 2;
    camera.add(stripe);

    // FRONT FENDER (bigger)
    const fenderGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16, 1, true);
    const fender = new THREE.Mesh(fenderGeo, chromeMat);
    fender.rotation.z = Math.PI / 2;
    fender.position.set(0, -0.3, 3);
    camera.add(fender);

    // FRONT WHEEL (bigger, visible, spinning)
    const wheelGeo = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
    const wheelMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 50
    });
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(0, -0.3, 3.5);
    camera.add(frontWheel);

    // Wheel rim (glowing cyan)
    const rimGeo = new THREE.TorusGeometry(0.35, 0.08, 8, 16);
    const rimMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.8
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(0, -0.3, 3.5);
    camera.add(rim);

    // Wheel spokes (glowing cyan, bigger)
    const spokesGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.8, 0.04);
        const spokeMat = new THREE.MeshBasicMaterial({ color: COLORS.cyan });
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        spoke.rotation.z = (Math.PI / 3) * i;
        spokesGroup.add(spoke);
    }
    spokesGroup.position.set(0, -0.3, 3.5);
    spokesGroup.rotation.y = Math.PI / 2;
    camera.add(spokesGroup);

    motorcycle.spokesGroup = spokesGroup;

    // EXHAUST PIPES (both sides, bigger)
    const exhaustGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.8, 8);
    const exhaustMat = new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: COLORS.orange,
        emissiveIntensity: 0.5,
        shininess: 80
    });

    const exhaustLeft = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustLeft.rotation.z = Math.PI / 2;
    exhaustLeft.rotation.y = -0.2;
    exhaustLeft.position.set(-0.7, -0.2, 1);
    camera.add(exhaustLeft);

    const exhaustRight = exhaustLeft.clone();
    exhaustRight.rotation.y = 0.2;
    exhaustRight.position.x = 0.7;
    camera.add(exhaustRight);

    // Exhaust glow (bigger and brighter)
    const exhaustGlowGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const exhaustGlowMat = new THREE.MeshBasicMaterial({
        color: COLORS.orange,
        transparent: true,
        opacity: 0.8
    });
    const exhaustGlowL = new THREE.Mesh(exhaustGlowGeo, exhaustGlowMat);
    exhaustGlowL.position.set(-1.6, -0.2, 1);
    camera.add(exhaustGlowL);

    const exhaustGlowR = exhaustGlowL.clone();
    exhaustGlowR.position.x = 1.6;
    camera.add(exhaustGlowR);

    // Exhaust point lights
    const exhaustLightL = new THREE.PointLight(COLORS.orange, 1, 5);
    exhaustLightL.position.set(-1.6, -0.2, 1);
    camera.add(exhaustLightL);

    const exhaustLightR = new THREE.PointLight(COLORS.orange, 1, 5);
    exhaustLightR.position.set(1.6, -0.2, 1);
    camera.add(exhaustLightR);

    // HANDLEBARS
    const leftHandlebarGeo = new THREE.BoxGeometry(0.15, 0.6, 0.3);
    const handlebarMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x00ffff,
        emissiveIntensity: 0.4,
        shininess: 100
    });
    const leftHandlebar = new THREE.Mesh(leftHandlebarGeo, handlebarMat);
    leftHandlebar.position.set(-1.2, 1, 1.5);
    leftHandlebar.rotation.z = -0.3;
    camera.add(leftHandlebar);
    scene.add(camera);

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

    // NEON UNDERGLOW (key cyberpunk feature)
    const underglowGeo = new THREE.PlaneGeometry(2, 0.1);
    const underglowMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const underglow = new THREE.Mesh(underglowGeo, underglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.set(0, -0.5, 2);
    camera.add(underglow);

    // Underglow point light
    const underglowLight = new THREE.PointLight(COLORS.cyan, 3, 8);
    underglowLight.position.set(0, -0.3, 2);
    camera.add(underglowLight);

    // WHEEL LIGHT TRAILS
    const trailGeo = new THREE.PlaneGeometry(0.1, 3);
    const trailMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.6
    });
    const leftTrail = new THREE.Mesh(trailGeo, trailMat);
    leftTrail.rotation.x = -Math.PI / 2;
    leftTrail.position.set(-0.4, -0.3, 5);
    camera.add(leftTrail);

    const rightTrail = leftTrail.clone();
    rightTrail.position.x = 0.4;
    camera.add(rightTrail);

    motorcycle.leftHandlebar = leftHandlebar;
    motorcycle.rightHandlebar = rightHandlebar;
    motorcycle.leftGrip = leftGrip;
    motorcycle.rightGrip = rightGrip;
    motorcycle.frontWheel = frontWheel;
    motorcycle.tank = tank;
    motorcycle.underglow = underglow;
    motorcycle.underglowLight = underglowLight;
}

// ===== CREATE ENHANCED CYBERPUNK CITY =====
function createCity() {
    const buildingCount = 60; // Reduced from 120 for better performance

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

    // Holographic advertisement (floating above building)
    if (Math.random() > 0.5) {
        const adWidth = width * 0.9;
        const adHeight = 4 + Math.random() * 3;
        const adGeo = new THREE.PlaneGeometry(adWidth, adHeight);

        const holoColors = [COLORS.cyan, COLORS.magenta, COLORS.pink, COLORS.yellow];
        const holoColor = holoColors[Math.floor(Math.random() * holoColors.length)];

        const adMat = new THREE.MeshBasicMaterial({
            color: holoColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ad = new THREE.Mesh(adGeo, adMat);
        ad.position.y = height/2 + 8 + Math.random() * 5;
        ad.position.z = depth/2 + 2;

        // Store original opacity for animation
        ad.userData = {
            originalOpacity: 0.7,
            phase: Math.random() * Math.PI * 2,
            floatSpeed: 0.3 + Math.random() * 0.3
        };

        building.add(ad);

        // Add holographic glow light
        const holoLight = new THREE.PointLight(holoColor, 4, 20);
        holoLight.position.copy(ad.position);
        holoLight.position.z += 3;
        building.add(holoLight);
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

// ===== CREATE CROSSROADS 1: INITIAL PATH CHOICE (3 OPTIONS) =====
function createCrossroads1() {
    const crossroadsZ = -50;

    // Intersection platform
    const intersectionGeo = new THREE.PlaneGeometry(80, 50);
    const intersectionMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: 0x220044,
        emissiveIntensity: 0.3
    });
    const intersection = new THREE.Mesh(intersectionGeo, intersectionMat);
    intersection.rotation.x = -Math.PI / 2;
    intersection.position.set(0, 0, crossroadsZ);
    scene.add(intersection);

    // Clear existing portals
    pathPortals = [];

    // LEFT PATH: BLUE NEON ALLEY
    const leftPath = createAlleyPath(-20, crossroadsZ);
    pathPortals.push(leftPath);

    // CENTER PATH: RED HIGHWAY RAMP
    const centerPath = createHighwayPath(0, crossroadsZ);
    pathPortals.push(centerPath);

    // RIGHT PATH: PURPLE TUNNEL
    const rightPath = createTunnelPath(20, crossroadsZ);
    pathPortals.push(rightPath);
}

// LEFT: Blue Neon Alley with graffiti, pipes, puddles
function createAlleyPath(x, z) {
    const alleyGroup = new THREE.Group();
    alleyGroup.userData = {
        pathType: 'left',
        color: COLORS.cyan,
        label: '◀ ALLEY',
        isHovered: false
    };

    // Alley walls (narrow)
    const wallMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a2a,
        emissive: COLORS.cyan,
        emissiveIntensity: 0.1
    });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 40), wallMat);
    leftWall.position.set(x - 6, 4, z - 30);
    scene.add(leftWall);

    const rightWall = leftWall.clone();
    rightWall.position.x = x + 6;
    scene.add(rightWall);

    // Graffiti decals (glowing cyan boxes)
    for (let i = 0; i < 5; i++) {
        const graffitiGeo = new THREE.PlaneGeometry(2, 2);
        const graffitiMat = new THREE.MeshBasicMaterial({
            color: COLORS.cyan,
            transparent: true,
            opacity: 0.7
        });
        const graffiti = new THREE.Mesh(graffitiGeo, graffitiMat);
        graffiti.position.set(x - 5.9, 2 + i * 1.5, z - 15 - i * 5);
        graffiti.rotation.y = Math.PI / 2;
        alleyGroup.add(graffiti);
    }

    // Pipes
    for (let i = 0; i < 3; i++) {
        const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 40, 8);
        const pipeMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(x - 5 + i * 2, 6, z - 30);
        alleyGroup.add(pipe);
    }

    // Puddle reflections (glowing plane)
    const puddleGeo = new THREE.CircleGeometry(3, 32);
    const puddleMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.3
    });
    const puddle = new THREE.Mesh(puddleGeo, puddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.01, z - 25);
    alleyGroup.add(puddle);

    // Clickable portal surface
    const portalGeo = new THREE.BoxGeometry(12, 8, 1);
    const portalMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(x, 4, z - 20);
    alleyGroup.add(portal);

    // Glow light
    const light = new THREE.PointLight(COLORS.cyan, 3, 30);
    light.position.set(x, 4, z - 20);
    alleyGroup.add(light);

    alleyGroup.position.set(0, 0, 0);
    alleyGroup.userData.portal = portalMat;
    alleyGroup.userData.light = light;

    scene.add(alleyGroup);
    return alleyGroup;
}

// CENTER: Red Highway Ramp with arrows and structure
function createHighwayPath(x, z) {
    const highwayGroup = new THREE.Group();
    highwayGroup.userData = {
        pathType: 'center',
        color: COLORS.red,
        label: '▲ HIGHWAY',
        isHovered: false
    };

    // Highway ramp structure
    const rampGeo = new THREE.BoxGeometry(14, 2, 50);
    const rampMat = new THREE.MeshPhongMaterial({
        color: 0x2a1a1a,
        emissive: COLORS.red,
        emissiveIntensity: 0.2
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(x, 1, z - 35);
    scene.add(ramp);

    // Support pillars
    for (let i = 0; i < 4; i++) {
        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
        const pillarMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x - 5 + i * 3, -3, z - 20 - i * 8);
        highwayGroup.add(pillar);
    }

    // Red hologram arrows
    for (let i = 0; i < 5; i++) {
        const arrowGeo = new THREE.ConeGeometry(1, 2, 4);
        const arrowMat = new THREE.MeshBasicMaterial({ color: COLORS.red });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.rotation.x = -Math.PI / 2;
        arrow.position.set(x, 2.5, z - 15 - i * 6);
        highwayGroup.add(arrow);
    }

    // Clickable portal surface
    const portalGeo = new THREE.BoxGeometry(14, 8, 1);
    const portalMat = new THREE.MeshBasicMaterial({
        color: COLORS.red,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(x, 4, z - 20);
    highwayGroup.add(portal);

    // Glow light
    const light = new THREE.PointLight(COLORS.red, 3, 30);
    light.position.set(x, 4, z - 20);
    highwayGroup.add(light);

    highwayGroup.position.set(0, 0, 0);
    highwayGroup.userData.portal = portalMat;
    highwayGroup.userData.light = light;

    scene.add(highwayGroup);
    return highwayGroup;
}

// RIGHT: Purple Underground Tunnel with metal doors
function createTunnelPath(x, z) {
    const tunnelGroup = new THREE.Group();
    tunnelGroup.userData = {
        pathType: 'right',
        color: COLORS.purple,
        label: '▶ TUNNEL',
        isHovered: false
    };

    // Tunnel arch
    const archGeo = new THREE.CylinderGeometry(7, 7, 40, 8, 1, true, 0, Math.PI);
    const archMat = new THREE.MeshPhongMaterial({
        color: 0x2a1a2a,
        emissive: COLORS.purple,
        emissiveIntensity: 0.15
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI / 2;
    arch.position.set(x, 7, z - 30);
    scene.add(arch);

    // Tunnel floor
    const floorGeo = new THREE.PlaneGeometry(14, 40);
    const floorMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: COLORS.purple,
        emissiveIntensity: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, 0.02, z - 30);
    scene.add(floor);

    // Metal door frames
    const doorFrameGeo = new THREE.BoxGeometry(0.5, 8, 2);
    const doorFrameMat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    const leftDoorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    leftDoorFrame.position.set(x - 7, 4, z - 18);
    tunnelGroup.add(leftDoorFrame);

    const rightDoorFrame = leftDoorFrame.clone();
    rightDoorFrame.position.x = x + 7;
    tunnelGroup.add(rightDoorFrame);

    // Flickering lights inside tunnel
    for (let i = 0; i < 4; i++) {
        const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: COLORS.purple });
        const lightBulb = new THREE.Mesh(lightGeo, lightMat);
        lightBulb.position.set(x, 6, z - 20 - i * 8);
        tunnelGroup.add(lightBulb);

        const bulbLight = new THREE.PointLight(COLORS.purple, 2, 15);
        bulbLight.position.set(x, 6, z - 20 - i * 8);
        tunnelGroup.add(bulbLight);
    }

    // Clickable portal surface
    const portalGeo = new THREE.BoxGeometry(14, 8, 1);
    const portalMat = new THREE.MeshBasicMaterial({
        color: COLORS.purple,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(x, 4, z - 20);
    tunnelGroup.add(portal);

    // Glow light
    const light = new THREE.PointLight(COLORS.purple, 3, 30);
    light.position.set(x, 4, z - 20);
    tunnelGroup.add(light);

    tunnelGroup.position.set(0, 0, 0);
    tunnelGroup.userData.portal = portalMat;
    tunnelGroup.userData.light = light;

    scene.add(tunnelGroup);
    return tunnelGroup;
}

// ===== CREATE CROSSROADS 2: LEFT/RIGHT FORK (2 OPTIONS) =====
function createCrossroads2() {
    const crossroadsZ = -50;

    // Intersection platform
    const intersectionGeo = new THREE.PlaneGeometry(60, 40);
    const intersectionMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: 0x220044,
        emissiveIntensity: 0.3
    });
    const intersection = new THREE.Mesh(intersectionGeo, intersectionMat);
    intersection.rotation.x = -Math.PI / 2;
    intersection.position.set(0, 0, crossroadsZ);
    scene.add(intersection);

    // Clear existing portals
    pathPortals.forEach(p => scene.remove(p));
    pathPortals = [];

    // LEFT PATH
    const leftPath = createSimplePath(-15, crossroadsZ, COLORS.cyan, '◀ LEFT');
    pathPortals.push(leftPath);

    // RIGHT PATH
    const rightPath = createSimplePath(15, crossroadsZ, COLORS.magenta, '▶ RIGHT');
    pathPortals.push(rightPath);
}

// ===== CREATE CROSSROADS 3: RISKY/SAFE ROUTE (2 OPTIONS) =====
function createCrossroads3() {
    const crossroadsZ = -50;

    // Intersection platform
    const intersectionGeo = new THREE.PlaneGeometry(60, 40);
    const intersectionMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: 0x440022,
        emissiveIntensity: 0.3
    });
    const intersection = new THREE.Mesh(intersectionGeo, intersectionMat);
    intersection.rotation.x = -Math.PI / 2;
    intersection.position.set(0, 0, crossroadsZ);
    scene.add(intersection);

    // Clear existing portals
    pathPortals.forEach(p => scene.remove(p));
    pathPortals = [];

    // RISKY PATH (left, red)
    const riskyPath = createSimplePath(-15, crossroadsZ, COLORS.red, '◀ RISKY');
    pathPortals.push(riskyPath);

    // SAFE PATH (right, green)
    const safePath = createSimplePath(15, crossroadsZ, COLORS.green, '▶ SAFE');
    pathPortals.push(safePath);
}

// ===== CREATE SIMPLE PATH PORTAL =====
function createSimplePath(x, z, color, label) {
    const pathGroup = new THREE.Group();
    pathGroup.userData = {
        pathType: label.toLowerCase().replace(/[^a-z]/g, ''),
        color: color,
        label: label,
        isHovered: false
    };

    // Road segment
    const roadGeo = new THREE.PlaneGeometry(10, 30);
    const roadMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: color,
        emissiveIntensity: 0.15
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.01, z - 25);
    scene.add(road);

    // Side markers
    for (let i = 0; i < 3; i++) {
        const markerGeo = new THREE.BoxGeometry(0.5, 4, 1);
        const markerMat = new THREE.MeshBasicMaterial({ color: color });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(x - 5, 2, z - 15 - i * 8);
        pathGroup.add(marker);

        const marker2 = marker.clone();
        marker2.position.x = x + 5;
        pathGroup.add(marker2);
    }

    // Clickable portal surface
    const portalGeo = new THREE.BoxGeometry(10, 6, 1);
    const portalMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(x, 3, z - 20);
    pathGroup.add(portal);

    // Glow light
    const light = new THREE.PointLight(color, 3, 25);
    light.position.set(x, 3, z - 20);
    pathGroup.add(light);

    pathGroup.position.set(0, 0, 0);
    pathGroup.userData.portal = portalMat;
    pathGroup.userData.light = light;

    scene.add(pathGroup);
    return pathGroup;
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

// ===== CREATE FLYING CARS =====
function createFlyingCar() {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeo = new THREE.BoxGeometry(3, 1, 5);
    const bodyMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a2a,
        emissive: Math.random() > 0.5 ? COLORS.cyan : COLORS.magenta,
        emissiveIntensity: 0.4,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    carGroup.add(body);

    // Cockpit
    const cockpitGeo = new THREE.BoxGeometry(2, 0.8, 2.5);
    const cockpit = new THREE.Mesh(cockpitGeo, bodyMat);
    cockpit.position.y = 0.9;
    carGroup.add(cockpit);

    // Engine glow (bottom)
    const engineGeo = new THREE.BoxGeometry(2.5, 0.3, 4);
    const engineMat = new THREE.MeshBasicMaterial({
        color: COLORS.cyan,
        transparent: true,
        opacity: 0.8
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.y = -0.8;
    carGroup.add(engine);

    // Engine lights
    const engineLight = new THREE.PointLight(COLORS.cyan, 2, 10);
    engineLight.position.y = -0.8;
    carGroup.add(engineLight);

    // Tail lights
    const tailLightGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const tailLightMat = new THREE.MeshBasicMaterial({ color: COLORS.red });

    const tailLight1 = new THREE.Mesh(tailLightGeo, tailLightMat);
    tailLight1.position.set(-1, 0, -2.5);
    carGroup.add(tailLight1);

    const tailLight2 = tailLight1.clone();
    tailLight2.position.x = 1;
    carGroup.add(tailLight2);

    // Position high above the city
    carGroup.position.set(
        (Math.random() - 0.5) * 80,
        15 + Math.random() * 15,
        -Math.random() * 250 - 50
    );

    carGroup.userData = {
        speed: 0.1 + Math.random() * 0.15,
        sway: Math.random() * Math.PI * 2
    };

    flyingCars.push(carGroup);
    scene.add(carGroup);
}

// ===== CREATE STEAM VENTS =====
function createSteamVent(x, z) {
    const ventGroup = new THREE.Group();

    // Steam particles (reduced for performance)
    for (let i = 0; i < 8; i++) {
        const steamGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 6, 6);
        const steamMat = new THREE.MeshBasicMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.4
        });
        const steam = new THREE.Mesh(steamGeo, steamMat);

        steam.userData = {
            startY: 0.5,
            speed: 0.05 + Math.random() * 0.05,
            maxHeight: 4 + Math.random() * 3,
            offsetX: (Math.random() - 0.5) * 0.5,
            offsetZ: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2
        };

        steam.position.set(
            steam.userData.offsetX,
            steam.userData.startY,
            steam.userData.offsetZ
        );

        ventGroup.add(steam);
    }

    ventGroup.position.set(x, 0, z);
    steamVents.push(ventGroup);
    scene.add(ventGroup);
}

// ===== CREATE SPARK EMITTERS =====
function createSparkEmitter(x, y, z) {
    const sparksGroup = new THREE.Group();

    // Create sparks
    for (let i = 0; i < 20; i++) {
        const sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? COLORS.yellow : COLORS.orange,
            transparent: true,
            opacity: 0.9
        });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);

        spark.userData = {
            velocityX: (Math.random() - 0.5) * 0.1,
            velocityY: -0.05 - Math.random() * 0.05,
            velocityZ: (Math.random() - 0.5) * 0.1,
            life: Math.random() * 2,
            maxLife: 2,
            phase: Math.random() * Math.PI * 2
        };

        spark.position.set(0, 0, 0);
        sparksGroup.add(spark);
    }

    sparksGroup.position.set(x, y, z);
    sparkEmitters.push(sparksGroup);
    scene.add(sparksGroup);
}

// ===== CREATE RAIN EFFECT =====
function createRain() {
    const rainCount = 800; // Reduced from 2000 for better performance

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
    const particleCount = 400; // Reduced from 800 for better performance

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

    if (gameState === 'intro') {
        updateIntro();
    } else if (gameState === 'chase') {
        updateChase();
    } else if (gameState === 'stopped_at_crossroads_1') {
        updateStoppedAtCrossroads();
    } else if (gameState === 'stopped_at_crossroads_2') {
        updateStoppedAtCrossroads();
    } else if (gameState === 'stopped_at_crossroads_3') {
        updateStoppedAtCrossroads();
    } else if (gameState === 'ending') {
        updateEnding();
    }

    renderer.render(scene, camera);
}

function updateIntro() {
    // Auto-play sequence - speed up for 3-5 seconds
    introTimer += 0.016; // ~60fps

    speed += (200 - speed) * 0.03; // Accelerate to 200
    document.getElementById('speed').textContent = Math.floor(speed);

    // Move world
    const moveSpeed = speed * 0.01;

    buildings.forEach(building => {
        building.position.z += moveSpeed;
        if (building.position.z > 20) {
            building.position.z = -300 - Math.random() * 100;
        }
        building.material.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.001 + building.position.x) * 0.15;
    });

    roadSegments.forEach(segment => {
        segment.road.position.z += moveSpeed;
        if (segment.road.position.z > 30) {
            segment.road.position.z -= 450;
        }
    });

    rainDrops.forEach(drop => {
        drop.position.z += moveSpeed * 2;
        drop.position.y -= 0.5;
        if (drop.position.y < 0 || drop.position.z > 20) {
            drop.position.y = 20 + Math.random() * 30;
            drop.position.z = -50 - Math.random() * 50;
        }
    });

    particles.forEach(particle => {
        particle.position.z += moveSpeed * 4;
        if (particle.position.z > 10) {
            particle.position.z = -100;
        }
    });

    // Wheel spin
    if (motorcycle.spokesGroup) {
        motorcycle.spokesGroup.rotation.x += speed * 0.005;
    }

    // Flying cars
    flyingCars.forEach(car => {
        car.position.z += moveSpeed * 0.3;
        car.userData.sway += 0.01;
        car.position.x += Math.sin(car.userData.sway) * 0.03;
        if (car.position.z > 50) {
            car.position.z = -250 - Math.random() * 100;
        }
    });

    // Steam vents
    steamVents.forEach(vent => {
        vent.position.z += moveSpeed;
        vent.children.forEach(steam => {
            steam.position.y += steam.userData.speed;
            if (steam.position.y > steam.userData.maxHeight) {
                steam.position.y = steam.userData.startY;
            }
        });
        if (vent.position.z > 20) {
            vent.position.z = -200;
        }
    });

    // Spark emitters
    sparkEmitters.forEach(emitter => {
        emitter.position.z += moveSpeed;
        if (emitter.position.z > 20) {
            emitter.position.z = -200;
        }
    });

    // After 4 seconds, spawn police and enter chase
    if (introTimer > 4) {
        gameState = 'chase';
        document.getElementById('warning').classList.add('active');

        // Spawn police
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnPoliceCar(), i * 800);
        }
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnDrone(), i * 1000);
        }
    }
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

    // Check for crossroads triggers (3 separate decisions)
    crossroadsDistance += moveSpeed;

    // First decision at distance 80
    if (crossroadsDistance > 80 && currentDecision === 0 && gameState === 'chase') {
        gameState = 'stopped_at_crossroads_1';
        currentDecision = 1;
        targetSpeed = 0;
        createCrossroads1(); // First choice: alley/highway/tunnel
        document.getElementById('warning').classList.remove('active');
        document.getElementById('choose-path-msg').textContent = 'DECISION 1/3: CHOOSE YOUR PATH';
        document.getElementById('choose-path-msg').classList.add('active');
    }

    // Second decision at distance 160
    if (crossroadsDistance > 160 && currentDecision === 1 && gameState === 'chase') {
        gameState = 'stopped_at_crossroads_2';
        currentDecision = 2;
        targetSpeed = 0;
        createCrossroads2(); // Second choice: left/right fork
        document.getElementById('choose-path-msg').textContent = 'DECISION 2/3: LEFT OR RIGHT?';
        document.getElementById('choose-path-msg').classList.add('active');
    }

    // Third decision at distance 240
    if (crossroadsDistance > 240 && currentDecision === 2 && gameState === 'chase') {
        gameState = 'stopped_at_crossroads_3';
        currentDecision = 3;
        targetSpeed = 0;
        createCrossroads3(); // Third choice: risky/safe route
        document.getElementById('choose-path-msg').textContent = 'DECISION 3/3: FINAL CHOICE';
        document.getElementById('choose-path-msg').classList.add('active');
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

        // Animate holographic ads
        building.children.forEach(child => {
            if (child.userData.originalOpacity !== undefined) {
                // Float animation
                child.userData.phase += 0.02 * child.userData.floatSpeed;
                const floatOffset = Math.sin(child.userData.phase) * 0.5;
                child.position.y = child.position.y - (child.userData.lastFloat || 0) + floatOffset;
                child.userData.lastFloat = floatOffset;

                // Flicker opacity
                child.material.opacity = child.userData.originalOpacity + Math.sin(Date.now() * 0.003) * 0.2;
            }
        });
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

    // Wheel rotation (spins based on speed)
    if (motorcycle.spokesGroup) {
        motorcycle.spokesGroup.rotation.x += speed * 0.005;
    }

    // Handlebar shake
    const shake = Math.sin(Date.now() * 0.02) * 0.003 * (speed / 250);
    motorcycle.leftHandlebar.rotation.z = -0.3 + shake + steerAngle * 0.05;
    motorcycle.rightHandlebar.rotation.z = 0.3 - shake - steerAngle * 0.05;

    // Tank and bike lean with steering
    if (motorcycle.tank) {
        motorcycle.tank.rotation.z = -steerAngle * 0.2;
    }

    // Camera shake
    camera.position.y = 2.5 + Math.sin(Date.now() * 0.03) * 0.08 * (speed / 250);

    // Flying cars
    flyingCars.forEach((car, index) => {
        car.position.z += moveSpeed * 0.3;

        // Sway motion
        car.userData.sway += 0.01;
        car.position.x += Math.sin(car.userData.sway) * 0.03;
        car.position.y += Math.cos(car.userData.sway * 0.7) * 0.02;

        if (car.position.z > 50) {
            car.position.z = -250 - Math.random() * 100;
            car.position.x = (Math.random() - 0.5) * 80;
            car.position.y = 15 + Math.random() * 15;
        }
    });

    // Steam vents
    steamVents.forEach(vent => {
        vent.position.z += moveSpeed;

        // Animate steam particles rising
        vent.children.forEach(steam => {
            steam.position.y += steam.userData.speed;
            steam.position.x = steam.userData.offsetX + Math.sin(Date.now() * 0.002 + steam.userData.phase) * 0.3;

            // Reset when too high
            if (steam.position.y > steam.userData.maxHeight) {
                steam.position.y = steam.userData.startY;
                steam.material.opacity = 0.4;
            } else {
                // Fade out as it rises
                steam.material.opacity = 0.4 * (1 - steam.position.y / steam.userData.maxHeight);
            }
        });

        // Respawn when too far
        if (vent.position.z > 20) {
            vent.position.z = -200 - Math.random() * 100;
        }
    });

    // Spark emitters
    sparkEmitters.forEach(emitter => {
        emitter.position.z += moveSpeed;

        // Animate sparks falling
        emitter.children.forEach(spark => {
            spark.userData.life += 0.016;

            spark.position.x += spark.userData.velocityX;
            spark.position.y += spark.userData.velocityY;
            spark.position.z += spark.userData.velocityZ;

            // Fade based on life
            spark.material.opacity = 0.9 * (1 - spark.userData.life / spark.userData.maxLife);

            // Reset spark
            if (spark.userData.life > spark.userData.maxLife) {
                spark.position.set(0, 0, 0);
                spark.userData.life = 0;
            }
        });

        // Respawn when too far
        if (emitter.position.z > 20) {
            emitter.position.z = -200 - Math.random() * 100;
        }
    });
}

function updateStoppedAtCrossroads() {
    // Slow down to a stop
    speed *= 0.9;
    document.getElementById('speed').textContent = Math.floor(speed);

    // Animate portals
    pathPortals.forEach(portal => {
        // Pulse light
        if (portal.userData.light) {
            portal.userData.light.intensity = 5 + Math.sin(Date.now() * 0.003) * 2;
        }

        // Hover glow effect
        if (portal.userData.portal) {
            if (portal.userData.isHovered) {
                portal.userData.portal.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.2;
            } else {
                portal.userData.portal.opacity = 0.2;
            }
        }
    });

    // Wheel still spins slowly
    if (motorcycle.spokesGroup) {
        motorcycle.spokesGroup.rotation.x += speed * 0.005;
    }
}

function updateEnding() {
    speed *= 0.98;
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

// ===== MOUSE INTERACTION =====
function onMouseMove(event) {
    const atCrossroads = gameState === 'stopped_at_crossroads_1' ||
                         gameState === 'stopped_at_crossroads_2' ||
                         gameState === 'stopped_at_crossroads_3';
    if (!atCrossroads) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pathPortals, true);

    // Reset all hovers
    pathPortals.forEach(portal => {
        portal.userData.isHovered = false;
    });

    // Set hover on intersected portal
    if (intersects.length > 0) {
        let portal = intersects[0].object;
        while (portal.parent && !portal.userData.pathType) {
            portal = portal.parent;
        }
        if (portal.userData.pathType) {
            portal.userData.isHovered = true;
            document.body.style.cursor = 'pointer';

            // Show label
            const label = portal.userData.label;
            document.getElementById('path-label').textContent = label;
            document.getElementById('path-label').classList.add('active');
        }
    } else {
        document.body.style.cursor = 'default';
        document.getElementById('path-label').classList.remove('active');
    }
}

function onMouseClick(event) {
    const atCrossroads = gameState === 'stopped_at_crossroads_1' ||
                         gameState === 'stopped_at_crossroads_2' ||
                         gameState === 'stopped_at_crossroads_3';
    if (!atCrossroads) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pathPortals, true);

    if (intersects.length > 0) {
        let portal = intersects[0].object;
        while (portal.parent && !portal.userData.pathType) {
            portal = portal.parent;
        }
        if (portal.userData.pathType) {
            choosePath(portal.userData.pathType);
        }
    }
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

    // Start with INTRO state (auto-play)
    gameState = 'intro';
    targetSpeed = 200;
    crossroadsDistance = 0;
    introTimer = 0;
    decisionsMade = [];
    currentDecision = 0;

    console.log('Game state: intro - auto-play sequence started');

    // Keep spawning police during chase
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
    console.log('Decision ' + decisionsMade.length + '/3:', path);

    // Store the decision
    decisionsMade.push(path);

    document.getElementById('choose-path-msg').classList.remove('active');
    document.getElementById('path-label').classList.remove('active');

    // Hide portals
    pathPortals.forEach(portal => {
        portal.visible = false;
    });

    // Steer camera toward chosen path briefly
    if (path.includes('left') || path.includes('alley')) {
        targetSteerAngle = -0.4;
    } else if (path.includes('right') || path.includes('tunnel')) {
        targetSteerAngle = 0.4;
    } else {
        targetSteerAngle = 0;
    }

    // Check if all 3 decisions made
    if (decisionsMade.length >= 3) {
        // All decisions made - show ending
        gameState = 'ending';
        targetSpeed = 150;
        setTimeout(() => {
            playEnding();
        }, 1500);
    } else {
        // More decisions to make - resume chase
        gameState = 'chase';
        targetSpeed = 200;
        setTimeout(() => {
            targetSteerAngle = 0; // Straighten out
        }, 800);
    }
}

function playEnding() {
    document.getElementById('ending-screen').classList.add('active');

    const titleEl = document.getElementById('ending-title');
    const descEl = document.getElementById('ending-desc');

    // Generate ending based on combination of all 3 decisions
    const path1 = decisionsMade[0] || '';
    const path2 = decisionsMade[1] || '';
    const path3 = decisionsMade[2] || '';

    console.log('Ending for decisions:', decisionsMade);

    // Determine ending based on path combinations
    let title = 'ESCAPED';
    let desc = 'You made it through the night city chase!';
    let color = '#0ff';

    // Decision 1 determines theme
    if (path1.includes('left') || path1.includes('alley')) {
        color = '#0ff';
        if (path3.includes('risky')) {
            title = 'ALLEY LEGEND';
            desc = 'Risky shortcuts through neon alleys<br>Drones crashed into walls<br>You became a street racing legend';
            buildings.forEach(building => {
                building.material.emissive.setHex(COLORS.cyan);
                building.material.emissiveIntensity = 0.4;
            });
        } else {
            title = 'STREET ESCAPE';
            desc = 'Careful navigation through tight alleys<br>You blend into the street market<br>Police lost your trail';
        }
    } else if (path1.includes('center') || path1.includes('highway')) {
        color = '#f00';
        if (path3.includes('risky')) {
            title = 'HIGHWAY HERO';
            desc = 'High-speed pursuit on the cyber-highway<br>A daring jump over collapsed sections<br>You stick the landing perfectly!';
            targetSpeed = 400;
            scene.fog.density = 0.04;
            setTimeout(() => {
                renderer.setClearColor(0xffffff);
                setTimeout(() => renderer.setClearColor(0x000510), 500);
            }, 1000);
        } else {
            title = 'HIGHWAY DRIFT';
            desc = 'Smart evasive driving on elevated roads<br>Flying cars provided cover<br>You merge into traffic and disappear';
        }
    } else if (path1.includes('right') || path1.includes('tunnel')) {
        color = '#a0f';
        if (path3.includes('risky')) {
            title = 'TUNNEL MASTER';
            desc = 'Dark underground tunnels with sparks flying<br>You slam the steel doors behind you<br>Police trapped on the other side!';
            buildings.forEach(building => {
                building.material.emissive.setHex(COLORS.purple);
                building.material.emissiveIntensity = 0.3;
            });
            scene.fog.color.setHex(0x200020);
            renderer.setClearColor(0x0a0010);
        } else {
            title = 'UNDERGROUND ESCAPE';
            desc = 'Slow and steady through maintenance tunnels<br>Emergency exits lead to safety<br>You emerge in a different district';
        }
    }

    titleEl.textContent = title;
    titleEl.style.color = color;
    titleEl.style.textShadow = `0 0 30px ${color}, 0 0 60px ${color}`;
    descEl.innerHTML = desc + '<br><br>Your choices:<br>' +
                      '1. ' + decisionsMade[0] + '<br>' +
                      '2. ' + decisionsMade[1] + '<br>' +
                      '3. ' + decisionsMade[2];
}


function restart() {
    gameState = 'idle';
    speed = 0;
    targetSpeed = 0;
    steerAngle = 0;
    targetSteerAngle = 0;
    crossroadsDistance = 0;
    decisionsMade = [];
    currentDecision = 0;
    introTimer = 0;

    // Remove police
    policeCars.forEach(car => scene.remove(car));
    policeCars = [];

    drones.forEach(drone => scene.remove(drone));
    drones = [];

    // Remove portals
    pathPortals.forEach(portal => scene.remove(portal));
    pathPortals = [];

    // Reset scene
    scene.fog.density = 0.012;
    scene.fog.color.setHex(0x000510);
    renderer.setClearColor(0x000510);

    buildings.forEach(building => {
        building.material.wireframe = false;
        building.material.emissiveIntensity = 0.2 + Math.random() * 0.3;
        const side = Math.random() > 0.5 ? 1 : -1;
        building.position.x = side * (12 + Math.random() * 40);
        building.position.z = -50 - Math.random() * 300;
    });

    camera.position.x = 0;
    camera.rotation.z = 0;

    // Reset UI
    document.getElementById('ending-screen').classList.remove('active');
    document.getElementById('choose-path-msg').classList.remove('active');
    document.getElementById('path-label').classList.remove('active');
    document.getElementById('warning').classList.remove('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('start-screen').classList.remove('hidden');
    document.body.style.cursor = 'default';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && gameState === 'idle') {
        e.preventDefault();
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

        if (typeof THREE === 'undefined') {
            console.error('THREE.js not loaded! Check your internet connection.');
            alert('Failed to load 3D library. Please check your internet connection and refresh.');
            return;
        }

        init();
        console.log('🏍️ NEON CHASE 3D LOADED');
        console.log('Controls: SPACE=start, MOUSE=hover & click portals, R=restart');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Failed to initialize game: ' + error.message);
    }
});

// Make functions global
window.startGame = startGame;
window.restart = restart;
