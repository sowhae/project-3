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
let gameState = 'idle'; // idle, intro, chase, stopped_at_crossroads, ending
let speed = 0;
let targetSpeed = 0;
let steerAngle = 0;
let targetSteerAngle = 0;
let crossroadsDistance = 0;
let chosenPath = null; // 'left', 'center', 'right'
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

    // Camera (POV) - pulled back to see motorcycle
    camera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2.5, -1.5); // Pulled back and up
    camera.rotation.x = -0.05;

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

    motorcycle.leftHandlebar = leftHandlebar;
    motorcycle.rightHandlebar = rightHandlebar;
    motorcycle.leftGrip = leftGrip;
    motorcycle.rightGrip = rightGrip;
    motorcycle.frontWheel = frontWheel;
    motorcycle.tank = tank;
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

// ===== CREATE CROSSROADS WITH CLICKABLE PORTALS =====
function createCrossroads() {
    const crossroadsZ = -50; // Closer so player stops at it

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

    // LEFT PATH PORTAL (Blue - Alleyways)
    const leftPortal = createPathPortal(
        -20,
        5,
        crossroadsZ - 20,
        COLORS.cyan,
        'left',
        'ALLEYWAYS'
    );
    scene.add(leftPortal);
    pathPortals.push(leftPortal);

    // CENTER PATH PORTAL (Red - Highway)
    const centerPortal = createPathPortal(
        0,
        5,
        crossroadsZ - 20,
        COLORS.red,
        'center',
        'HIGHWAY'
    );
    scene.add(centerPortal);
    pathPortals.push(centerPortal);

    // RIGHT PATH PORTAL (Purple - Tunnel)
    const rightPortal = createPathPortal(
        20,
        5,
        crossroadsZ - 20,
        COLORS.purple,
        'right',
        'TUNNEL'
    );
    scene.add(rightPortal);
    pathPortals.push(rightPortal);

    // Add road paths behind portals
    createRoadPath(-20, crossroadsZ - 30, -Math.PI / 6, COLORS.cyan);
    createRoadPath(0, crossroadsZ - 30, 0, COLORS.red);
    createRoadPath(20, crossroadsZ - 30, Math.PI / 6, COLORS.purple);
}

function createPathPortal(x, y, z, color, pathType, label) {
    const portalGroup = new THREE.Group();
    portalGroup.userData = {
        pathType: pathType,
        color: color,
        label: label,
        isHovered: false,
        baseEmissive: 0.5,
        targetEmissive: 0.5
    };

    // Portal frame (rectangular gate)
    const frameGeo = new THREE.TorusGeometry(4, 0.3, 8, 32);
    const frameMat = new THREE.MeshPhongMaterial({
        color: 0x222222,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.rotation.y = 0;
    portalGroup.add(frame);

    // Portal surface (clickable area)
    const portalGeo = new THREE.CircleGeometry(3.5, 32);
    const portalMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portalGroup.add(portal);

    // Glow ring
    const glowGeo = new THREE.RingGeometry(3.5, 4.5, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    portalGroup.add(glow);

    // Point light
    const light = new THREE.PointLight(color, 5, 30);
    light.position.z = 2;
    portalGroup.add(light);

    // Particles swirling in portal
    const particleGroup = new THREE.Group();
    for (let i = 0; i < 20; i++) {
        const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({ color });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        const angle = (Math.PI * 2 * i) / 20;
        const radius = 2 + Math.random();
        particle.position.x = Math.cos(angle) * radius;
        particle.position.y = Math.sin(angle) * radius;
        particle.userData = { angle, radius, speed: 0.02 + Math.random() * 0.03 };
        particleGroup.add(particle);
    }
    portalGroup.add(particleGroup);

    portalGroup.position.set(x, y, z);

    portalGroup.userData.frame = frameMat;
    portalGroup.userData.portal = portalMat;
    portalGroup.userData.glow = glowMat;
    portalGroup.userData.light = light;
    portalGroup.userData.particles = particleGroup;

    return portalGroup;
}

function createRoadPath(x, z, rotation, color) {
    const roadGeo = new THREE.PlaneGeometry(12, 60);
    const roadMat = new THREE.MeshPhongMaterial({
        color: 0x0a0a15,
        emissive: color,
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.6
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = rotation;
    road.position.set(x * 0.8, 0.01, z - 30);
    scene.add(road);
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

    if (gameState === 'intro') {
        updateIntro();
    } else if (gameState === 'chase') {
        updateChase();
    } else if (gameState === 'stopped_at_crossroads') {
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

    // Check for crossroads trigger
    crossroadsDistance += moveSpeed;
    if (crossroadsDistance > 80 && gameState === 'chase') {
        gameState = 'stopped_at_crossroads';
        targetSpeed = 0; // Stop the bike
        createCrossroads();
        document.getElementById('warning').classList.remove('active');
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
}

function updateStoppedAtCrossroads() {
    // Slow down to a stop
    speed *= 0.9;
    document.getElementById('speed').textContent = Math.floor(speed);

    // Animate portals
    pathPortals.forEach(portal => {
        const particles = portal.userData.particles;
        particles.children.forEach(particle => {
            particle.userData.angle += particle.userData.speed;
            particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
            particle.position.y = Math.sin(particle.userData.angle) * particle.userData.radius;
        });

        // Pulse light
        portal.userData.light.intensity = 5 + Math.sin(Date.now() * 0.003) * 2;

        // Hover glow effect
        if (portal.userData.isHovered) {
            portal.userData.targetEmissive = 1.5;
            portal.userData.portal.opacity = 0.7;
            portal.userData.glow.opacity = 0.9;
        } else {
            portal.userData.targetEmissive = 0.5;
            portal.userData.portal.opacity = 0.4;
            portal.userData.glow.opacity = 0.6;
        }

        // Smooth emissive transition
        portal.userData.frame.emissiveIntensity +=
            (portal.userData.targetEmissive - portal.userData.frame.emissiveIntensity) * 0.1;
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
    if (gameState !== 'stopped_at_crossroads') return;

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
    if (gameState !== 'stopped_at_crossroads') return;

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
    console.log('Chosen path:', path);
    chosenPath = path;

    document.getElementById('choose-path-msg').classList.remove('active');
    document.getElementById('path-label').classList.remove('active');

    gameState = 'ending';
    targetSpeed = 150; // Accelerate into chosen path

    // Hide portals
    pathPortals.forEach(portal => {
        portal.visible = false;
    });

    // Steer camera toward chosen path
    if (path === 'left') {
        targetSteerAngle = -0.4;
    } else if (path === 'right') {
        targetSteerAngle = 0.4;
    } else {
        targetSteerAngle = 0;
    }

    setTimeout(() => {
        playEnding(path);
    }, 1500);
}

function playEnding(path) {
    document.getElementById('ending-screen').classList.add('active');

    const titleEl = document.getElementById('ending-title');
    const descEl = document.getElementById('ending-desc');

    if (path === 'left') {
        // ALLEY ESCAPE
        titleEl.textContent = 'ALLEY ESCAPE';
        titleEl.style.color = '#0ff';
        titleEl.style.textShadow = '0 0 30px #0ff, 0 0 60px #f0f';
        descEl.innerHTML = 'You zip through tight alleys covered in neon graffiti<br>' +
                           'Police drones crash into walls trying to follow<br>' +
                           'You escape into a hidden street market';

        // Color shift buildings to graffiti colors
        buildings.forEach(building => {
            setInterval(() => {
                const colors = [COLORS.cyan, COLORS.magenta, COLORS.green, COLORS.pink];
                building.material.emissive.setHex(colors[Math.floor(Math.random() * colors.length)]);
            }, 400);
        });

    } else if (path === 'center') {
        // HIGHWAY JUMP
        titleEl.textContent = 'HIGHWAY JUMP';
        titleEl.style.color = '#f00';
        titleEl.style.textShadow = '0 0 40px #f00, 0 0 80px #ff0';
        descEl.innerHTML = 'You speed onto a massive cyber-highway with flying cars<br>' +
                           'A risky jump over a collapsed road — slow-motion moment<br>' +
                           'Safe landing. You escaped.';

        // Accelerate faster
        targetSpeed = 400;
        scene.fog.density = 0.04;

        // Fade to white flash
        setTimeout(() => {
            renderer.setClearColor(0xffffff);
            setTimeout(() => {
                renderer.setClearColor(0x000510);
            }, 500);
        }, 1000);

    } else if (path === 'right') {
        // TUNNEL ESCAPE
        titleEl.textContent = 'TUNNEL ESCAPE';
        titleEl.style.color = '#a0f';
        titleEl.style.textShadow = '0 0 30px #a0f';
        descEl.innerHTML = 'You enter a dark underground maintenance tunnel<br>' +
                           'Sparks fly, water drips, pipes rattle<br>' +
                           'You press a button — giant steel doors slam shut behind you';

        // Make everything dark purple
        buildings.forEach(building => {
            building.material.emissive.setHex(COLORS.purple);
            building.material.emissiveIntensity = 0.2;
        });

        scene.fog.color.setHex(0x200020);
        scene.fog.density = 0.03;
        renderer.setClearColor(0x0a0010);
    }
}


function restart() {
    gameState = 'idle';
    speed = 0;
    targetSpeed = 0;
    steerAngle = 0;
    targetSteerAngle = 0;
    crossroadsDistance = 0;
    chosenPath = null;
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
