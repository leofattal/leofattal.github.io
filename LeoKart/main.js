let scene, camera, renderer;
let kart;
const clock = new THREE.Clock();
const keyboard = {};
let track;
const obstacleBoxes = []; // Store bounding boxes of obstacles

// Physics variables
let velocity = 0; // Forward velocity
const acceleration = 0.02; // Acceleration rate
const deceleration = 0.01; // Deceleration rate
const maxSpeed = 3.0; // Maximum speed
const friction = 0.005; // Friction when no input is given
const turnSpeed = 0.03; // Steering sensitivity
let direction = new THREE.Vector3(0, 0, -1); // Forward direction
let verticalVelocity = 0; // Kart's vertical speed
const gravity = -2.0; // Gravity pulling the kart down
let isOnGround = false; // Whether the kart is touching the track

let gameOver = false; // Track game state

// Initialize the game
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Add Skybox
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = skyboxLoader.load([
        'assets/skybox/right.jpg', // Right
        'assets/skybox/left.jpg', // Left
        'assets/skybox/top.jpg', // Top
        'assets/skybox/bottom.jpg', // Bottom
        'assets/skybox/front.jpg', // Front
        'assets/skybox/back.jpg', // Back
    ]);
    scene.background = skyboxTexture;

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, -20); // Default camera position

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Load models and track
    loadTrack();
    loadModels();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Handle keyboard
    document.addEventListener('keydown', (e) => keyboard[e.key] = true);
    document.addEventListener('keyup', (e) => keyboard[e.key] = false);

    // Start the animation loop
    animate();
}

function loadTrack() {
    const loader = new THREE.GLTFLoader();

    // Load the GLTF track
    loader.load('assets/track/scene.gltf', (gltf) => {
        track = gltf.scene; // Store the track for future reference
        track.scale.set(10, 10, 10); // Adjust scale (change if needed)
        track.position.set(0, -20, 0); // Center the track
        scene.add(track);

        console.log('Track loaded successfully!');
    }, undefined, (error) => {
        console.error('Error loading track:', error);
    });
}

function loadModels() {
    const loader = new THREE.GLTFLoader();

    // Load Kart
    loader.load('assets/kart/scene.gltf', (gltf) => {
        kart = gltf.scene;
        kart.scale.set(0.5, 0.5, 0.5);

        // Attach the camera to the kart
        kart.add(camera);
        camera.position.set(0, 100, 200); // Position camera behind and above the kart
        camera.lookAt(0, 2, 0);

        kart.position.set(0, 0, -350); // Set the kart's initial position
        kart.rotation.y = Math.PI / 2;

        scene.add(kart);
    });
}

const raycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3(0, -1, 0); // Ray direction (downward)

let isLanding = false; // Tracks whether the kart is landing

function animate() {
    if (gameOver) return; // Stop animation if game is over

    const delta = clock.getDelta();

    if (kart) {
        // Update velocity for forward/backward movement
        if (keyboard['ArrowUp']) velocity = Math.min(velocity + acceleration, maxSpeed);
        if (keyboard['ArrowDown']) velocity = Math.max(velocity - acceleration, -maxSpeed / 2);

        // Apply friction
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown']) {
            if (velocity > 0) velocity = Math.max(velocity - friction, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction, 0);
        }

        // Steering
        if (keyboard['ArrowLeft'] && velocity !== 0) {
            const steer = turnSpeed * (velocity / maxSpeed);
            kart.rotation.y += steer; // Turn left
        }
        if (keyboard['ArrowRight'] && velocity !== 0) {
            const steer = turnSpeed * (velocity / maxSpeed);
            kart.rotation.y -= steer; // Turn right
        }

        // Update direction vector
        direction.set(0, 0, -1).applyQuaternion(kart.quaternion).normalize();

        // Horizontal movement
        kart.position.addScaledVector(direction, velocity);

        // Raycast to find track height
        raycaster.set(kart.position.clone().add(new THREE.Vector3(0, 10, 0)), downDirection);
        const intersects = raycaster.intersectObject(track, true);

        if (intersects.length > 0) {
            const groundPoint = intersects[0].point;
            const groundHeight = groundPoint.y;

            // Calculate slope (change in height)
            const heightDifference = groundHeight - kart.position.y;

            // Adjust vertical velocity based on slope when on the ground
            if (heightDifference > 0 && isOnGround) {
                verticalVelocity += heightDifference * 0.5; // Boost upward velocity on ramps
            } else if (!isOnGround) {
                verticalVelocity += gravity * delta; // Gravity when airborne
            }

            // Check if the kart is on the ground
            if (kart.position.y <= groundHeight + 0.5) {
                if (!isOnGround) {
                    // Landing: Add bounce effect
                    verticalVelocity = Math.abs(verticalVelocity) * 0.5; // Bounce upward with reduced velocity
                    isLanding = true; // Indicate the kart is landing
                }

                kart.position.y = groundHeight + 0.5; // Stick to the ground
                isOnGround = true;

                // Damping the bounce
                if (isLanding) {
                    verticalVelocity *= 0.8; // Reduce bounce velocity
                    if (Math.abs(verticalVelocity) < 0.01) {
                        verticalVelocity = 0; // Stop bouncing
                        isLanding = false;
                    }
                }
            } else {
                isOnGround = false; // Kart is in the air
            }
        } else {
            isOnGround = false; // Kart is in the air
        }

        // Apply gravity if the kart is in the air
        if (!isOnGround) {
            verticalVelocity += gravity * delta; // Accelerate downward
        }

        // Update vertical position
        kart.position.y += verticalVelocity;

        // Check for game over
        if (kart.position.z < -1000) {
            showGameOver();
            return;
        }
    }

    // Render the scene
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

function showGameOver() {
    gameOver = true;

    // Create and display the GAME OVER message
    const gameOverDiv = document.createElement('div');
    gameOverDiv.innerHTML = 'GAME OVER';
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.fontSize = '5rem';
    gameOverDiv.style.color = 'red';
    gameOverDiv.style.fontWeight = 'bold';
    gameOverDiv.style.zIndex = '100';
    document.body.appendChild(gameOverDiv);

    // Restart the game after 3 seconds
    setTimeout(() => {
        document.body.removeChild(gameOverDiv);
        restartGame();
    }, 3000);
}

function restartGame() {
    location.reload(); // Reload the page to reset the game
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the game
init();