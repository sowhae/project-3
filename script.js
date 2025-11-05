// ===== GAME STATE =====
let currentScene = 'scene-bar';

// ===== SCENE MANAGEMENT =====
function switchScene(fromScene, toScene) {
    const from = document.getElementById(fromScene);
    const to = document.getElementById(toScene);

    if (from) {
        from.classList.remove('active');
    }

    if (to) {
        setTimeout(() => {
            to.classList.add('active');
            currentScene = toScene;
        }, 300);
    }
}

// ===== START CHASE =====
function startChase() {
    // Add sound effect trigger here if audio exists
    const audio = document.getElementById('ambient-sound');
    if (audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    switchScene('scene-bar', 'scene-chase');

    // Trigger handlebar vibration
    setTimeout(() => {
        const handlebars = document.querySelectorAll('.handlebar');
        handlebars.forEach(h => h.style.animation = 'handlebar-shake 0.05s infinite');
    }, 500);
}

// ===== CHOOSE ENDING =====
function chooseEnding(ending) {
    let endingScene = '';

    switch(ending) {
        case 'blend':
            endingScene = 'ending-blend';
            triggerBlendEnding();
            break;
        case 'run':
            endingScene = 'ending-run';
            triggerRunEnding();
            break;
        case 'hack':
            endingScene = 'ending-hack';
            triggerHackEnding();
            break;
    }

    switchScene('scene-chase', endingScene);
}

// ===== ENDING ANIMATIONS =====
function triggerBlendEnding() {
    // Ending A: Return Changed
    // Color shift effect is already in CSS
    setTimeout(() => {
        const layer = document.querySelector('#ending-blend .distorted');
        if (layer) {
            layer.style.animation = 'color-wave 3s ease-in-out infinite';
        }
    }, 500);
}

function triggerRunEnding() {
    // Ending B: Drive Into Void
    // Create additional light particles
    const endingVisual = document.querySelector('#ending-run .ending-visual');
    if (endingVisual) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createLightParticle(endingVisual);
            }, i * 100);
        }
    }
}

function createLightParticle(container) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 10 + 5 + 'px';
    particle.style.height = particle.style.width;
    particle.style.borderRadius = '50%';
    particle.style.background = `radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent)`;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animation = `particle-burst ${Math.random() * 2 + 1}s ease-out forwards`;
    particle.style.pointerEvents = 'none';

    container.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 3000);
}

// Add particle animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes particle-burst {
        0% {
            transform: scale(0) translate(0, 0);
            opacity: 1;
        }
        100% {
            transform: scale(3) translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function triggerHackEnding() {
    // Ending C: Become the Glitch
    // Create digital fragments
    const endingVisual = document.querySelector('#ending-hack .ending-visual');
    if (endingVisual) {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                createDigitalFragment(endingVisual);
            }, i * 80);
        }
    }
}

function createDigitalFragment(container) {
    const fragment = document.createElement('div');
    fragment.style.position = 'absolute';
    fragment.style.width = Math.random() * 50 + 20 + 'px';
    fragment.style.height = Math.random() * 50 + 20 + 'px';
    fragment.style.border = '2px solid #0f0';
    fragment.style.left = Math.random() * 100 + '%';
    fragment.style.top = Math.random() * 100 + '%';
    fragment.style.animation = `fragment-scatter ${Math.random() * 3 + 2}s ease-out forwards`;
    fragment.style.pointerEvents = 'none';
    fragment.style.background = `rgba(0, 255, 0, ${Math.random() * 0.3})`;

    container.appendChild(fragment);

    setTimeout(() => {
        fragment.remove();
    }, 5000);
}

// Add fragment animation
const fragmentStyle = document.createElement('style');
fragmentStyle.textContent = `
    @keyframes fragment-scatter {
        0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) rotate(${Math.random() * 720}deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(fragmentStyle);

// ===== RESTART GAME =====
function restart() {
    // Reset to bar scene
    switchScene(currentScene, 'scene-bar');

    // Reset animations
    setTimeout(() => {
        const handlebars = document.querySelectorAll('.handlebar');
        handlebars.forEach(h => h.style.animation = '');
    }, 500);
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener('keydown', (e) => {
    if (currentScene === 'scene-chase') {
        // Number keys for choices
        if (e.key === '1') {
            chooseEnding('blend');
        } else if (e.key === '2') {
            chooseEnding('run');
        } else if (e.key === '3') {
            chooseEnding('hack');
        }
    }

    // Space to start from bar scene
    if (currentScene === 'scene-bar' && e.key === ' ') {
        startChase();
    }

    // R to restart from endings
    if (currentScene.includes('ending') && e.key === 'r') {
        restart();
    }
});

// ===== MOUSE PARALLAX EFFECT =====
document.addEventListener('mousemove', (e) => {
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    // Apply parallax to layers
    const layers = document.querySelectorAll('.layer');
    layers.forEach((layer, index) => {
        const depth = (index + 1) * 10;
        const moveX = mouseX * depth;
        const moveY = mouseY * depth;
        layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    // Apply to 3D elements
    const cityElements = document.querySelectorAll('.building-layer');
    cityElements.forEach((element, index) => {
        const depth = 5;
        const moveX = mouseX * depth * (index === 0 ? -1 : 1);
        element.style.transform += ` translateX(${moveX}px)`;
    });
});

// ===== HOVER EFFECTS FOR CHOICES =====
const choices = document.querySelectorAll('.choice');
choices.forEach((choice, index) => {
    choice.addEventListener('mouseenter', () => {
        // Add extra glow on hover
        const icon = choice.querySelector('.icon-visual');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(360deg)';
            icon.style.transition = 'transform 0.6s ease';
        }
    });

    choice.addEventListener('mouseleave', () => {
        const icon = choice.querySelector('.icon-visual');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// ===== DYNAMIC SPEED EFFECT =====
function updateSpeed() {
    if (currentScene === 'scene-chase') {
        const speedValue = document.querySelector('.speed-value');
        if (speedValue) {
            // Random speed fluctuation
            const baseSpeed = 248;
            const fluctuation = Math.floor(Math.random() * 10 - 5);
            speedValue.textContent = baseSpeed + fluctuation;
        }
    }
}

setInterval(updateSpeed, 100);

// ===== GLITCH EFFECT TRIGGER =====
function triggerGlitch() {
    const glitchOverlay = document.querySelector('.glitch-overlay');
    if (glitchOverlay) {
        glitchOverlay.style.opacity = Math.random() * 0.5 + 0.3;
        setTimeout(() => {
            glitchOverlay.style.opacity = 0.1;
        }, 50);
    }
}

setInterval(triggerGlitch, 2000);

// ===== AUDIO MANAGEMENT =====
function setupAudio() {
    const audio = document.getElementById('ambient-sound');
    if (audio) {
        audio.volume = 0.3;

        // Fade in when starting
        document.addEventListener('click', () => {
            audio.play().catch(e => console.log('Audio autoplay prevented'));
        }, { once: true });
    }
}

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    console.log('🌃 NEON CHASE LOADED');
    console.log('Controls: SPACE to start, 1/2/3 to choose, R to restart');

    setupAudio();

    // Preload images for smoother transitions
    const images = ['cafe.png', 'chase.png', 'looped.png', 'person pov.jpg', 'window pov.jpg'];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
});

// ===== ADDITIONAL VISUAL EFFECTS =====

// Random drone appearance during chase
function spawnRandomDrone() {
    if (currentScene === 'scene-chase') {
        const drones = document.querySelector('.chase-drones');
        if (drones && Math.random() > 0.7) {
            const drone = document.createElement('div');
            drone.className = 'chase-drone';
            drone.style.setProperty('--pos', Math.random() * 80 + 10 + '%');
            drone.style.top = Math.random() * 40 + 10 + '%';
            drones.appendChild(drone);

            setTimeout(() => {
                drone.remove();
            }, 3000);
        }
    }
}

setInterval(spawnRandomDrone, 2000);

// Screen shake effect
function screenShake(intensity = 5, duration = 200) {
    const container = document.getElementById('game-container');
    let startTime = Date.now();

    function shake() {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            container.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(shake);
        } else {
            container.style.transform = '';
        }
    }

    shake();
}

// Trigger shake when hovering over choices
choices.forEach(choice => {
    choice.addEventListener('click', () => {
        screenShake(3, 150);
    });
});
