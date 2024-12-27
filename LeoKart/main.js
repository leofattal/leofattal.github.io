let scene, camera, renderer;
let kart, donut, coin;
const clock = new THREE.Clock();
const keyboard = {};
let track;
const obstacleBoxes = []; // Store bounding boxes of obstacles

let isAccelerating = false;
let startX = 0;
let currentX = 0;

// Physics variables
let velocity = 0; // Forward velocity
const acceleration = 0.02; // Acceleration rate
const deceleration = 0.01; // Deceleration rate
const maxSpeed = 3.5; // Maximum speed
const friction = 0.005; // Friction when no input is given
const turnSpeed = 0.03; // Steering sensitivity
let direction = new THREE.Vector3(0, 0, -1); // Forward direction
let up = new THREE.Vector3(0, 1, 0);
let right = new THREE.Vector3(1, 0, 0);
let verticalVelocity = 0; // Kart's vertical speed
const gravity = -2; // Gravity pulling the kart down
let isOnGround = true; // Whether the kart is touching the track
let oldPitch = 0;
let steer = 0;
let obstacleNormal = null;

let donutAngularVelocity = 0.05; // Angular velocity in radians per frame
let gameOver = false; // Track game state

let audioContext = null;
let audioBuffer = null;
let audioSource = null;
let gainNode = null;

function loadKartSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Fetch and decode the MP3 file
    fetch('assets/kart-sound.mp3')
        .then((response) => response.arrayBuffer())
        .then((data) => audioContext.decodeAudioData(data))
        .then((buffer) => {
            audioBuffer = buffer;
            console.log("Kart sound loaded successfully!");
        })
        .catch((error) => {
            console.error("Error loading kart sound:", error);
        });
}

function setupAudio() {
    if (!audioContext || !audioBuffer || audioSource) return;

    // Create a new audio source for playback
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.loop = true; // Loop the sound for continuous playback

    // Create a gain node to control the volume
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1; // Initial volume

    // Connect audio source -> gain -> audio output
    audioSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start playback
    audioSource.start();
    console.log("Kart sound started");
}

// Listen for the first key press to initialize the audio
document.addEventListener('keydown', function initializeAudioContext() {
    setupAudio();
    document.removeEventListener('keydown', initializeAudioContext); // Remove listener after first key press
});

function setupTouchControls() {
    // Detect when a finger touches the screen
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        currentX = touch.clientX;
        isAccelerating = true; // Start accelerating
    });

    // Detect finger movement (swipe)
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        currentX = touch.clientX; // Update current X position

        // Calculate swipe direction
        const deltaX = currentX - startX;

        if (deltaX < -5) {
            // Swipe left to steer left
            if (velocity !== 0) {
                const steer = turnSpeed * (velocity / maxSpeed);
                // kart.rotation.y += steer; // Turn left
                kart.rotateY(steer);
            }
        } else if (deltaX > 5) {
            // Swipe right to steer right
            if (velocity !== 0) {
                const steer = turnSpeed * (velocity / maxSpeed);
                // kart.rotation.y -= steer; // Turn right
                kart.rotateY(-steer);
            }
        }

        startX = currentX; // Reset startX for continuous swiping
    });

    // Detect when the finger is lifted
    document.addEventListener('touchend', () => {
        isAccelerating = false; // Stop accelerating
    });
}

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
    // Load the kart sound
    loadKartSound();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Handle keyboard
    document.addEventListener('keydown', (e) => keyboard[e.key] = true);
    document.addEventListener('keyup', (e) => keyboard[e.key] = false);

    // Set up touch controls
    setupTouchControls();

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

        kart.position.set(720, 0, 700); // Set the kart's initial position
        // kart.rotation.y = Math.PI / 2;
        // kart.rotateY(Math.PI / 2);
        // direction.set(-1, 0, 0);
        // right.set(0, 0, -1);

        scene.add(kart);
    });

    // Load Donut
    loader.load('assets/donut.gltf', (gltf) => {
        donut = gltf.scene;
        donut.scale.set(200, 200, 200);
        donut.rotateZ(Math.PI / 2);
        donut.position.set(1000, 300, 3250); // Set the donut's initial position
        scene.add(donut);

        // Create a bounding box for the donut
        const box = new THREE.Box3().setFromObject(donut);
        obstacleBoxes.push(box);

    });

    // Load Coin
    loader.load('assets/coin.gltf', (gltf) => {
        coin = gltf.scene;
        coin.scale.set(5, 5, 5);
        coin.position.set(720, 10, 530); // Set the donut's initial position
        scene.add(coin);

        // Create a bounding box for the donut
        const box = new THREE.Box3().setFromObject(coin);
        obstacleBoxes.push(box);

    });
}

const raycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3(0, -1, 0); // Ray direction (downward)
const raycasterFront = new THREE.Raycaster();

let isLanding = false; // Tracks whether the kart is landing

function getSignedAngle(u, v, axis) {
    // Ensure vectors are normalized
    u.normalize();
    v.normalize();

    // Compute the dot product (cosine of the angle)
    const dot = u.dot(v);

    // Clamp dot to avoid precision errors
    const clampedDot = Math.max(-1, Math.min(1, dot));

    // Calculate the angle in radians
    const angle = Math.acos(clampedDot);

    // Compute the cross product to determine the direction
    const cross = new THREE.Vector3().crossVectors(u, v);

    // Determine the sign of the angle using the axis
    const sign = Math.sign(cross.dot(axis));

    // Return the signed angle
    return angle * sign;
}

function getQuaternionFromVectors(u0, u1) {
    // Normalize the input vectors
    const v0 = u0.clone().normalize();
    const v1 = u1.clone().normalize();

    // Compute the dot product to determine the angle
    const dot = v0.dot(v1);

    // If the vectors are already aligned, return the identity quaternion
    if (dot > 0.99999) {
        return new THREE.Quaternion(); // Identity quaternion
    }

    // If the vectors are opposite, create a rotation 180° around a perpendicular axis
    if (dot < -0.99999) {
        const perpendicularAxis = new THREE.Vector3(1, 0, 0).cross(v0);
        if (perpendicularAxis.length() < 0.00001) {
            perpendicularAxis.set(0, 1, 0).cross(v0); // Try a different axis
        }
        perpendicularAxis.normalize();
        return new THREE.Quaternion().setFromAxisAngle(perpendicularAxis, Math.PI);
    }

    // Otherwise, compute the quaternion
    const cross = new THREE.Vector3().crossVectors(v0, v1); // Cross product
    const q = new THREE.Quaternion(
        cross.x,
        cross.y,
        cross.z,
        1 + dot // Scalar part
    );
    return q.normalize(); // Normalize the quaternion before returning
}

function animate() {
    if (gameOver) return; // Stop animation if game is over

    const delta = clock.getDelta();
    if (donut) {
        donut.rotateX(donutAngularVelocity * delta / 0.08); // Rotate around Y-axis
    }
    if (coin) {
        coin.rotateY(2 * donutAngularVelocity * delta / 0.08); // Rotate around Y-axis
    }
    // Adjust engine sound pitch based on velocity
    if (audioSource) {
        // Adjust playback rate based on velocity
        const baseRate = 0.5; // Minimum playback rate
        const maxRate = 2.0; // Maximum playback rate
        const playbackRate = baseRate + (velocity / maxSpeed) * (maxRate - baseRate);
        audioSource.playbackRate.value = playbackRate; // Set the playback rate
        gainNode.gain.value = 0.05 + (velocity / maxSpeed) * 0.1; // Scale volume with velocity
        if (velocity === 0) {
            gainNode.gain.value = 0; // Mute the sound
        }
    }

    if (kart) {
        // Update velocity for forward/backward movement
        if ((keyboard['ArrowUp'] || isAccelerating) && isOnGround) velocity = Math.min(velocity + acceleration * delta / .008, maxSpeed);
        if (keyboard['ArrowDown'] && isOnGround) velocity = Math.max(velocity - acceleration * delta / .008, -maxSpeed / 2);

        // Apply friction
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown'] && !isAccelerating && isOnGround) {
            if (velocity > 0) velocity = Math.max(velocity - friction * delta / .008, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction * delta / .008, 0);
        }

        // Steering
        steer = 0;
        if (keyboard['ArrowLeft'] && velocity !== 0 && isOnGround) {
            steer = turnSpeed * (velocity / maxSpeed);
            //kart.rotation.y += steer; // Turn left
        }
        if (keyboard['ArrowRight'] && velocity !== 0 && isOnGround) {
            steer = -turnSpeed * (velocity / maxSpeed);
            //kart.rotation.y -= steer; // Turn right
        }

        // Update direction vector
        //direction.set(0, 0, -1).applyQuaternion(kart.quaternion).normalize();

        // Horizontal movement
        //kart.position.addScaledVector(direction, velocity * delta / .008);
        // console.log(kart.position);

        // Raycast to find track height
        raycaster.set(kart.position.clone().add(new THREE.Vector3(0, 10, 0)), downDirection);
        const intersects = raycaster.intersectObject(track, true);
        raycasterFront.set(kart.position.clone().add(new THREE.Vector3(0, 10, 0)), direction);
        const objectsToCheck = [track, donut]; // List of objects to detect collisions with
        const intersectsFront = raycasterFront.intersectObjects(objectsToCheck, true);

        if (intersects.length > 0) {
            const groundPoint = intersects[0].point;
            const groundHeight = groundPoint.y;

            // Calculate slope (change in height)
            const heightDifference = groundHeight - kart.position.y;

            const roadNormal = intersects[0].face.normal.clone(); // (0,0,-1) for flat
            intersects[0].object.updateMatrixWorld();
            roadNormal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld)).normalize();
            roadNormal.negate(); // Invert the normal

            if (isOnGround || isLanding) {
                const pitchQuaternion = getQuaternionFromVectors(up, roadNormal)
                // console.log('pitchQuaternion: ',pitchQuaternion);
                kart.quaternion.premultiply(pitchQuaternion); // Apply the rotation to the kart

                const forward = direction.clone().applyQuaternion(pitchQuaternion);
                up = roadNormal.clone();

                const yawQuaternion = new THREE.Quaternion();
                yawQuaternion.setFromAxisAngle(up, steer); // Create a quaternion for the rotation
                // console.log('yawQuaternion: ',yawQuaternion);
                kart.quaternion.premultiply(yawQuaternion); // Apply the rotation to the kart
                direction = forward.applyAxisAngle(up, steer);
                right = new THREE.Vector3().crossVectors(direction, up).normalize();
            }

            if (!isOnGround) {
                verticalVelocity += gravity * delta; // Gravity when airborne
            }

            // Check if the kart is on the ground
            if (kart.position.y <= groundHeight + 0.5) {
                if (!isOnGround) {
                    // Landing: Add bounce effect
                    verticalVelocity = Math.abs(verticalVelocity) * 0.5; // Bounce upward with reduced velocity
                    isLanding = true; // Indicate the kart is landing
                }

                kart.position.y = groundHeight; // Stick to the ground
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

        if (intersectsFront.length > 0) {
            const frontPoint = intersectsFront[0].point;

            // Check the distance from the raycaster's origin to the frontPoint
            const distanceToFrontPoint = raycaster.ray.origin.distanceTo(frontPoint);
            if (distanceToFrontPoint < 10) {
                // Get the obstacle's normal vector
                obstacleNormal = intersectsFront[0].face.normal.clone();
                intersectsFront[0].object.updateMatrixWorld();
                obstacleNormal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(intersectsFront[0].object.matrixWorld)).normalize();
                if (obstacleNormal.dot(direction) > 0) {
                    obstacleNormal.negate(); // Invert the normal if necessary
                }
            } else {
                obstacleNormal = null;
            }
        } else {
            obstacleNormal = null;
        }

        // Apply gravity if the kart is in the air
        if (!isOnGround) {
            verticalVelocity += gravity * delta; // Accelerate downward
        }

        // Update position
        if (obstacleNormal) {
            console.log('obstacleNormal: ', obstacleNormal);
            console.log(kart.position);
            console.log('direction: ', direction);
            // Calculate the current velocity vector
            const velocityVector = direction.clone().multiplyScalar(velocity);

            // Project velocity onto the obstacle normal
            const projectionOntoNormal = obstacleNormal.clone().multiplyScalar(velocityVector.dot(obstacleNormal));

            // Subtract the projection (tangential part)
            const tangentialVelocity = velocityVector.clone().sub(projectionOntoNormal);

            // Update position using tangential velocity
            kart.position.addScaledVector(tangentialVelocity, delta / 0.008);
        } else {
            // No obstacle, proceed with full velocity
            kart.position.addScaledVector(direction, velocity * delta / 0.008);
        }
        kart.position.y += verticalVelocity * delta / .008;
        // console.log(kart.position);
        // console.log('direction: ', direction);

        // Check for game over
        if (kart.position.y < -1000) {
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