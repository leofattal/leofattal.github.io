import { supabase } from './supabase.js';
const leaderboardDiv = document.getElementById('leaderboard');

let scene, camera, renderer;
let kart, donut, coin;
const clock = new THREE.Clock();
const keyboard = {};
let track;
const obstacleBoxes = [];
let trackId = 0; // Initial track ID
const numTracks = 2; // Total number of tracks

const timerDiv = document.getElementById('timer');
const finishDiv = document.getElementById('best');
const coinDiv = document.getElementById('coins');
let startTime = null, finishTime = null, bestTime = null;
let numCoins = 0;
let velocity = 0, verticalVelocity = 0;
let joystickState = { up: false, down: false, left: false, right: false };
let joystickContainer;
let scaleFactor = 0.03;
const acceleration = 0.02 * scaleFactor, deceleration = 0.01 * scaleFactor, maxSpeed = 3.5 * scaleFactor, friction = 0.005 * scaleFactor, turnSpeed = 0.03, gravity = -2 * scaleFactor;
let direction = new THREE.Vector3(0, 0, -1), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
let isOnGround = true, steer = 0, obstacleNormal = null, isLanding = false, oldZ = 0;
let donutAngularVelocity = 0.05, gameOver = false;
let audioContext = null, audioBuffer = null, audioSource = null, gainNode = null;
let finishSound = new Audio('assets/finish-sound.mp3');
finishSound.volume = 0.5;
let coinSound = new Audio('assets/coin-sound.mp3');
coinSound.volume = 1.0;
let isVRMode = false;
let vrButton;
// VR controller variables
let vrControllers = [];
let controllerGrips = [];
// Add a world container for VR mode
let worldContainer;



function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check for touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Match user agents for mobile or tablet devices
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|webOS|Kindle|Silk/.test(userAgent);

    return hasTouch;
}

window.onload = function () {
    // Initialize Google Sign-In button
    google.accounts.id.initialize({
        client_id: '859341970629-8gsjvbl86s7kg2gasposjh00qtfnf5pj.apps.googleusercontent.com',
        callback: onSignIn,
        auto_select: true, // Automatically selects the account if possible
    });

    // Render the Google Sign-In button
    google.accounts.id.renderButton(
        document.getElementById('login-button'),
        { theme: 'outline', size: 'small' }
    );

    // Check if the user has a saved session
    const token = localStorage.getItem('googleCredential');
    if (token) {
        onSignIn({ credential: token });
    } else {
        google.accounts.id.prompt(); // Prompt user if not signed in
    }
};

const profilePic = document.getElementById('profile-pic');
profilePic.onload = function () {
    console.log('Profile picture loaded successfully');
};
profilePic.onerror = function () {
    // console.error('Failed to load profile picture');
    profilePic.src = 'assets/generic-avatar.jpg'; // Provide a fallback image
};

async function onSignIn(response) {
    // Save the token locally for persistent login
    localStorage.setItem('googleCredential', response.credential);

    try {
        // Fetch fresh profile information using the Google API
        const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${response.credential}`);
        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const profileData = await profileResponse.json();

        // Extract necessary profile details
        const { sub: googleId, email, given_name: name, picture } = profileData;

        // Step 1: Check if the user already exists in the database
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single(); // Expect at most one result

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows found" error
            console.error('Error fetching user:', fetchError);
            return;
        }

        let userId;
        if (existingUser) {
            // Step 2: User exists; use their data
            console.log('User already exists:', existingUser);
            userId = existingUser.id;
        } else {
            // Step 3: User does not exist; insert a new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    google_id: googleId,
                    email,
                    name,
                })
                .select() // Retrieve the inserted row
                .single(); // Ensure we get the single row inserted

            if (insertError) {
                console.error('Error inserting new user:', insertError);
                return;
            }

            console.log('Inserted new user:', newUser);
            userId = newUser.id;
        }

        // Step 4: Save the user ID in localStorage for future use
        localStorage.setItem('supabaseUserId', userId);

        // Update UI with fresh profile information
        document.getElementById('login-button').style.display = 'none';
        const userInfo = document.getElementById('user-info');
        userInfo.style.display = 'flex';
        document.getElementById('profile-pic').src = picture;
        document.getElementById('user-name').textContent = name;

        console.log('User logged in successfully with ID:', userId);
    } catch (error) {
        console.error('Unexpected error during login:', error);
    }
}

function signOut() {
    // Clear the session and localStorage
    localStorage.removeItem('googleCredential');

    // Reset the UI
    document.getElementById('login-button').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';

    // Optionally disable auto-select for future sessions
    google.accounts.id.disableAutoSelect();
}

// Attach the logout function to the button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-button').addEventListener('click', signOut);
});

// Function to get the best time for the current track
async function getBestTime(trackId) {
    const userId = localStorage.getItem('supabaseUserId');
    if (!userId) {
        console.error('User ID not found in localStorage');
        return null; // Return default if user ID is not available
    }

    try {
        // Query the database for the best time of the current user for the given track
        const { data, error } = await supabase
            .from('track_times')
            .select('best_time')
            .eq('user_id', userId)
            .eq('track_id', trackId);
        // .single(); // Expect a single row

        if (error) {
            if (error.code === 'PGRST116') {
                // No best time found
                return null;
            }
            // console.error('Error fetching best time from database:', error);
            return null;
        }

        // Return the best time if found
        return data[0].best_time || null;
    } catch (err) {
        console.error('Unexpected error fetching best time:', err);
        return null;
    }
}

// Function to save the best time for the current track
async function saveBestTime() {
    const userId = localStorage.getItem('supabaseUserId');
    if (!userId) {
        console.error('User ID not found in localStorage');
        return;
    }

    try {
        // Save the best time in the database
        if (finishTime < bestTime || bestTime === null) {
            const { data, error } = await supabase
                .from('track_times')
                .upsert(
                    {
                        user_id: userId,
                        track_id: trackId,
                        best_time: finishTime,
                    },
                    { onConflict: ['user_id', 'track_id'] }
                );

            if (error) {
                console.error('Error saving best time to database:', error);
                return;
            }

            console.log('Best time saved successfully:', data);

            // Update the UI with the new best time
            document.getElementById('best-time').textContent = `Best: ${finishTime.toFixed(2)}`;
        }
    } catch (err) {
        console.error('Unexpected error saving best time:', err);
    }
}

async function fetchLeaderboard(trackId) {
    try {
        // Fetch leaderboard data from Supabase
        const { data, error } = await supabase
            .from('track_times')
            .select('best_time, user_id, users(name)')
            .eq('track_id', trackId)
            .order('best_time', { ascending: true });

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return;
        }

        // Clear the leaderboard div content
        leaderboardDiv.innerHTML = '';

        // Add a styled title
        const title = document.createElement('h3');
        title.textContent = 'Leaderboard';
        leaderboardDiv.appendChild(title);

        // If no data, display a message
        if (data.length === 0) {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No entries yet!';
            noDataMessage.style.color = '#ccc';
            leaderboardDiv.appendChild(noDataMessage);
            return;
        }

        // Create a list for leaderboard entries
        const list = document.createElement('ol');
        list.classList.add('leaderboard-list');

        data.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${entry.users.name}</span>
                <span class="time">${entry.best_time.toFixed(2)}s</span>
            `;
            list.appendChild(listItem);
        });

        leaderboardDiv.appendChild(list);

    } catch (err) {
        console.error('Unexpected error while fetching leaderboard:', err);
    }
}

// Update the UI with the best time for the current track
async function updateBestTimeUI(trackId) {
    bestTime = await getBestTime(trackId);
    if (bestTime) {
        document.getElementById('best-time').textContent = `Best: ${bestTime.toFixed(2)}`;
    } else {
        document.getElementById('best-time').textContent = `No Record`;
    }
}

const raycaster = new THREE.Raycaster(), downDirection = new THREE.Vector3(0, -1, 0), raycasterFront = new THREE.Raycaster();

function loadKartSound() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    fetch('assets/kart-sound.mp3')
        .then(response => response.arrayBuffer())
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
            audioBuffer = buffer;
            console.log("Kart sound loaded successfully!");
        })
        .catch(error => console.error("Error loading kart sound:", error));
}

function setupAudio() {
    if (!audioContext || !audioBuffer || audioSource) return;
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.loop = true;
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.1;
    audioSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    audioSource.start();
    console.log("Kart sound started");
}

document.addEventListener('keydown', function initializeAudioContext() {
    setupAudio();
    startTime = performance.now();
    leaderboardDiv.style.display = 'none';
    document.getElementById('game-logo').style.display = 'none';
    document.removeEventListener('keydown', initializeAudioContext);
});

function createDisplay(element, styles, innerHTML) {
    element = document.createElement('div');
    Object.assign(element.style, styles);
    element.innerHTML = innerHTML;
    document.body.appendChild(element);
    return element;
}

// Function to toggle the track
function toggleTrack() {
    // Stop and reset the timer
    startTime = null; // Reset the start time
    if (timerDiv) {
        timerDiv.innerHTML = 'Time: 0.00s'; // Reset the timer display
        finishDiv.innerHTML = 'Best: -- '; // Reset the best time display
        coinDiv.innerHTML = 'Coins: 0'; // Reset the coin count
    }

    // Increment the track ID, cycling back to 0 when reaching numTracks
    trackId = (trackId + 1) % numTracks;
    console.log(`Switched to track ${trackId}`);

    // Save the new trackId in localStorage
    localStorage.setItem('lastTrackId', trackId);

    // Logic to reload or update the track
    loadTrack(() => {
        loadModels();
    });

    // Update the best time display for the new track
    updateBestTimeUI(trackId);
}

function initializeTrack() {
    // Retrieve the last trackId from localStorage, default to 0 if not found
    trackId = parseInt(localStorage.getItem('lastTrackId')) || 0;

    console.log(`Starting with track ${trackId}`);

    // Load the saved track
    loadTrack(() => {
        loadModels();
    });

    // Update the best time display for the starting track
    updateBestTimeUI(trackId);
}

// Attach the toggleTrack function to the button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggle-track-button').addEventListener('click', toggleTrack);
});

// Joystick logic for mobile devices
document.addEventListener("DOMContentLoaded", () => {
    const isMobile = isMobileDevice();
    if (!isMobile) return;

    const gameCanvas = document.getElementById("game-canvas");

    // Prevent context menu on long press
    gameCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Optional: Prevent text selection on long press
    gameCanvas.addEventListener("selectstart", (e) => e.preventDefault());

    joystickContainer = document.getElementById("joystick-container");
    const joystickKnob = document.getElementById("joystick-knob");
    const steerLeft = document.getElementById("steer-left");
    const steerRight = document.getElementById("steer-right");

    // Prevent long-press context menu on steering buttons
    steerLeft.addEventListener("contextmenu", (e) => e.preventDefault());
    steerRight.addEventListener("contextmenu", (e) => e.preventDefault());

    joystickContainer.style.display = "block";
    document.getElementById("steering-controls").style.display = "flex";

    let startX, startY;
    const maxDistance = 30;

    const updateJoystickState = (dx, dy) => {
        const threshold = 20; // Minimum displacement to trigger an action
        joystickState.up = dy < -threshold;
        joystickState.down = dy > threshold;

        if (joystickState.up) console.log("Move Forward");
        if (joystickState.down) console.log("Move Backward");
    };

    const handleTouchMove = (event) => {
        const touch = event.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
        const angle = Math.atan2(dy, dx);

        const offsetX = distance * Math.cos(angle);
        const offsetY = distance * Math.sin(angle);

        joystickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
        updateJoystickState(offsetX, offsetY);
    };

    const handleTouchEnd = () => {
        joystickKnob.style.transform = "translate(-50%, -50%)";
        joystickState.up = joystickState.down = false;
    };

    const handleTouchStart = (event) => {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        joystickKnob.style.transition = "none";

        setupAudio();
        initializeOnJoystickEvent();
    };

    function initializeOnJoystickEvent() {
        console.log("Joystick triggered, initializing...");
        startTime = performance.now();
        leaderboardDiv.style.display = 'none';
        document.getElementById('game-logo').style.display = 'none';

        joystickContainer.removeEventListener("touchstart", handleTouchStart);
    }

    joystickContainer.addEventListener("touchstart", handleTouchStart);
    joystickContainer.addEventListener("touchmove", handleTouchMove);
    joystickContainer.addEventListener("touchend", handleTouchEnd);

    // Steering button logic
    steerLeft.addEventListener("touchstart", () => {
        joystickState.left = true;
        console.log("Turn Left");
    });
    steerLeft.addEventListener("touchend", () => {
        joystickState.left = false;
    });

    steerRight.addEventListener("touchstart", () => {
        joystickState.right = true;
        console.log("Turn Right");
    });
    steerRight.addEventListener("touchend", () => {
        joystickState.right = false;
    });
});

function adjustGameLogoForMobile() {
    const gameLogo = document.getElementById("game-logo");

    // if (isMobileDevice()) {
    //     console.log("Adjusting game logo for mobile.");
    //     gameLogo.style.top = "unset"; // Remove the `top` property
    //     gameLogo.style.bottom = "20px"; // Position 20px from the bottom
    // } else {
    //     console.log("Desktop detected, restoring game logo position.");
    //     gameLogo.style.bottom = "unset"; // Remove the `bottom` property
    //     gameLogo.style.top = "20px"; // Reset to default
    // }
}

function updateCameraFOV() {
    const aspect = window.innerWidth / window.innerHeight;

    if (aspect > 1) {
        // Landscape orientation: set vertical FOV to 75
        camera.fov = 75;
    } else {
        // Portrait orientation: calculate vertical FOV for horizontal FOV of 75
        const horizontalFOV = 75;
        camera.fov = 2 * Math.atan(Math.tan((horizontalFOV * Math.PI) / 360) / aspect) * (180 / Math.PI);
    }

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

// Add event listener for window resize to update FOV dynamically
window.addEventListener("resize", updateCameraFOV);

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    const skyboxLoader = new THREE.CubeTextureLoader();
    scene.background = skyboxLoader.load([
        'assets/skybox/right.jpg', 'assets/skybox/left.jpg', 'assets/skybox/top.jpg',
        'assets/skybox/bottom.jpg', 'assets/skybox/front.jpg', 'assets/skybox/back.jpg'
    ]);

    // Create a world container for VR mode
    worldContainer = new THREE.Group();
    scene.add(worldContainer);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10000 * scaleFactor, 10000 * scaleFactor);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Enable XR features
    renderer.xr.enabled = true;

    // Check if WebXR is available
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                setupVRButton();
            } else {
                const vrToggle = document.getElementById('vr-toggle');
                vrToggle.classList.add('hidden');
            }
        });
    } else {
        const vrToggle = document.getElementById('vr-toggle');
        vrToggle.classList.add('hidden');
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    updateCameraFOV();
    // Initialize the track
    initializeTrack();
    loadKartSound();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', e => keyboard[e.key] = true);
    document.addEventListener('keyup', e => keyboard[e.key] = false);
    animate();
}

function loadTrack(callback) {
    leaderboardDiv.style.display = 'block';
    fetchLeaderboard(trackId);
    if (track) worldContainer.remove(track); // Modified to use worldContainer

    // Load the configuration for the given track ID
    const configPath = `trackConfigs/track_${trackId}.json`;

    fetch(configPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load track config: ${configPath}`);
            }
            return response.json();
        })
        .then(config => {
            const loader = new THREE.GLTFLoader();

            loader.load(config.path, gltf => {
                track = gltf.scene;

                // Apply configurations from JSON
                if (config.scale) {
                    track.scale.set(...config.scale.map(scale => scale * scaleFactor));
                }
                if (config.position) {
                    track.position.set(...config.position.map(pos => pos * scaleFactor));
                }
                if (config.rotation) {
                    track.rotation.set(...config.rotation.map(deg => THREE.MathUtils.degToRad(deg))); // Convert degrees to radians
                }

                worldContainer.add(track); // Modified to use worldContainer
                console.log(`Track ${trackId} loaded successfully!`);

                if (typeof callback === "function") {
                    callback(); // Call the callback once the track is loaded
                }
            }, undefined, error => console.error('Error loading track asset:', error));
        })
        .catch(error => console.error('Error loading track configuration:', error));
}

function loadModels() {
    if (kart) scene.remove(kart);
    if (coin) worldContainer.remove(coin); // Modified to use worldContainer
    if (donut) worldContainer.remove(donut); // Modified to use worldContainer
    const loader = new THREE.GLTFLoader();
    loader.load('assets/kart/scene.gltf', gltf => {
        kart = gltf.scene;
        kart.scale.set(0.5 * scaleFactor, 0.5 * scaleFactor, 0.5 * scaleFactor);
        kart.add(camera);
        // In non-VR mode, position is set to 0,0,0 and kart moves through world
        if (!isVRMode) {
            kart.position.set(0, 0, 0);
        } else {
            // In VR mode, kart stays in front of user
            kart.position.set(0, 0, -3);
        }
        scene.add(kart);

        // Initial camera position (far away)
        const startPosition = { x: 0, y: 10000 * scaleFactor, z: 10000 * scaleFactor };
        camera.position.set(startPosition.x, startPosition.y, startPosition.z);

        // Target camera position (close to kart)
        const targetPosition = { x: 0, y: 100, z: 200 };

        const startTime = performance.now();
        const duration = 2000; // 2 seconds

        function animateCamera() {
            const elapsedTime = performance.now() - startTime;
            const t = Math.min(elapsedTime / duration, 1); // Normalized time [0, 1]

            // Correctly interpolate using the fixed start position
            camera.position.x = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, t);
            camera.position.y = THREE.MathUtils.lerp(startPosition.y, targetPosition.y, t);
            camera.position.z = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, t);

            camera.lookAt(0, 2 * scaleFactor, 0); // Ensure camera keeps looking at the kart

            if (t < 1) {
                requestAnimationFrame(animateCamera); // Continue animating
            }
        }

        animateCamera(); // Start animation
    });

    loader.load('assets/donut.gltf', gltf => {
        donut = gltf.scene;
        donut.scale.set(200 * scaleFactor, 200 * scaleFactor, 200 * scaleFactor);
        donut.rotateZ(Math.PI / 2);
        donut.position.set(280 * scaleFactor, 300 * scaleFactor, 2700 * scaleFactor);
        worldContainer.add(donut); // Modified to use worldContainer
        obstacleBoxes.push(new THREE.Box3().setFromObject(donut));
    });

    loader.load('assets/coin.gltf', gltf => {
        coin = gltf.scene;
        coin.scale.set(10 * scaleFactor, 10 * scaleFactor, 10 * scaleFactor);
        // Position the coin 200 units away from the kart in the "direction" vector
        coin.position.set(0, 30 * scaleFactor, -200 * scaleFactor); // Add offset to kart's position
        worldContainer.add(coin); // Modified to use worldContainer
        obstacleBoxes.push(new THREE.Box3().setFromObject(coin));
    });
}

function getQuaternionFromVectors(u0, u1) {
    const v0 = u0.clone().normalize();
    const v1 = u1.clone().normalize();
    const dot = v0.dot(v1);
    if (dot > 0.99999) return new THREE.Quaternion();
    if (dot < -0.99999) {
        const perpendicularAxis = new THREE.Vector3(1, 0, 0).cross(v0);
        if (perpendicularAxis.length() < 0.00001) perpendicularAxis.set(0, 1, 0).cross(v0);
        perpendicularAxis.normalize();
        return new THREE.Quaternion().setFromAxisAngle(perpendicularAxis, Math.PI);
    }
    const cross = new THREE.Vector3().crossVectors(v0, v1);
    const q = new THREE.Quaternion(cross.x, cross.y, cross.z, 1 + dot);
    return q.normalize();
}

// Collision detection and flashing logic
function checkCoinCollision() {
    if (!coin || !kart) return;

    // Check if the kart is close to the coin (bounding box or distance)
    const kartBox = new THREE.Box3().setFromObject(kart);
    const coinBox = new THREE.Box3().setFromObject(coin);

    if (kartBox.intersectsBox(coinBox)) {
        // Trigger the flashing effect
        coinSound.play();
        triggerFlashingEffect();
        numCoins++; // Increment the coin count
        coinDiv.innerHTML = `Coins: ${numCoins}`;

        // Reposition the coin
        repositionCoin();
    }
}

function repositionCoin() {
    // Compute the bounding box for the track
    const trackBox = new THREE.Box3().setFromObject(track);

    // Extract the min and max X, Z values from the track's bounding box
    const minX = trackBox.min.x;
    const maxX = trackBox.max.x;
    const minZ = trackBox.min.z;
    const maxZ = trackBox.max.z;

    const randomInRange = (min, max) => Math.random() * (max - min) + min; // Helper to get a random value in range
    const raycaster = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);

    let positioned = false;

    while (!positioned) {
        // Generate random X and Z within the track's bounds
        const randomX = randomInRange(minX, maxX);
        const randomZ = randomInRange(minZ, maxZ);

        // Set the new position high above the track
        const newPosition = new THREE.Vector3(randomX, 1000 * scaleFactor, randomZ);

        // Cast a ray downwards from the new position
        raycaster.set(newPosition, downDirection);
        const intersects = raycaster.intersectObject(track, true);

        if (intersects.length > 0) {
            // Position the coin at the hit point
            const groundPoint = intersects[0].point;
            coin.position.set(groundPoint.x, groundPoint.y + 30 * scaleFactor, groundPoint.z); // Slightly above the ground
            positioned = true; // Successful positioning
        }
    }
}

function triggerFlashingEffect() {
    let flashCount = 0;
    const maxFlashes = 6; // Number of flashes (on/off cycles)
    const flashInterval = 200; // Flash duration in milliseconds

    const flashTimer = setInterval(() => {
        kart.visible = !kart.visible; // Toggle visibility
        flashCount++;

        if (flashCount >= maxFlashes) {
            clearInterval(flashTimer); // Stop flashing
            kart.visible = true; // Ensure kart is visible at the end
        }
    }, flashInterval);
}

function animate() {
    if (gameOver) return;

    // Use the renderer's animation loop for WebXR support
    renderer.setAnimationLoop(render);
}

function render() {
    if (gameOver) {
        renderer.setAnimationLoop(null);
        return;
    }

    if (startTime !== null) {
        const elapsedTime = (performance.now() - startTime) / 1000;
        timerDiv.innerHTML = `${elapsedTime.toFixed(2)}s`;
    }

    const delta = clock.getDelta();
    if (donut) donut.rotateX(donutAngularVelocity * delta / 0.08);
    if (coin) coin.rotateY(2 * donutAngularVelocity * delta / 0.08);

    if (audioSource) {
        const baseRate = 0.5, maxRate = 2.0;
        const playbackRate = baseRate + (velocity / maxSpeed) * (maxRate - baseRate);
        audioSource.playbackRate.value = playbackRate;
        gainNode.gain.value = 0.05 + (velocity / maxSpeed) * 0.1;
        if (velocity === 0 || (!isOnGround && !isLanding)) gainNode.gain.value = 0;
    }

    // Check for X button press in VR mode
    if (isVRMode) {
        checkXButtonState();

        // Update VR camera pose to follow the kart using WebXR-OpenXR Bridge
        if (window.WebXROpenXRBridge && kart && camera.userData.vrMode) {
            try {
                // Calculate position 2m behind the kart in local kart coordinates
                const backwardOffset = new THREE.Vector3(0, 0, 2); // 2m behind in local space

                // Transform the offset to world space using kart's rotation
                backwardOffset.applyQuaternion(kart.quaternion);

                // Calculate world position (kart position + rotated offset)
                const cameraWorldPos = kart.position.clone().add(backwardOffset);

                // Prepare pose object for the extension
                const headPose = {
                    position: {
                        x: cameraWorldPos.x,
                        y: cameraWorldPos.y,
                        z: cameraWorldPos.z
                    },
                    orientation: {
                        x: kart.quaternion.x,
                        y: kart.quaternion.y,
                        z: kart.quaternion.z,
                        w: kart.quaternion.w
                    }
                };

                // Update the VR camera pose (non-blocking)
                WebXROpenXRBridge.setHeadPose(headPose).catch(error => {
                    // Silently handle errors to avoid spamming console
                    if (error.message !== 'No active OpenXR session' && error.message !== 'Request timed out') {
                        console.warn('VR pose update failed:', error.message);
                    }
                });

            } catch (error) {
                // Handle any unexpected errors
                console.warn('VR pose calculation error:', error);
            }
        }
    }

    if (kart) {
        oldZ = kart.position.z;
        if ((keyboard['ArrowUp'] || joystickState.up) && isOnGround) velocity = Math.min(velocity + acceleration * delta / .008, maxSpeed);
        if ((keyboard['ArrowDown'] || joystickState.down) && isOnGround) velocity = Math.max(velocity - acceleration * delta / .008, -maxSpeed / 2);
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown'] && !joystickState.up && !joystickState.down && isOnGround) {
            if (velocity > 0) velocity = Math.max(velocity - friction * delta / .008, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction * delta / .008, 0);
        }

        steer = 0;
        // Restore original velocity check
        if ((keyboard['ArrowLeft'] || joystickState.left) && velocity !== 0 && isOnGround) steer = turnSpeed * (velocity / maxSpeed);
        if ((keyboard['ArrowRight'] || joystickState.right) && velocity !== 0 && isOnGround) steer = -turnSpeed * (velocity / maxSpeed);



        raycaster.set(kart.position.clone().add(new THREE.Vector3(0, 10 * scaleFactor, 0)), downDirection);
        const intersects = raycaster.intersectObject(track, true);
        raycasterFront.set(kart.position.clone().add(new THREE.Vector3(0, 10 * scaleFactor, 0)), direction);
        const objectsToCheck = [track, donut];
        const intersectsFront = raycasterFront.intersectObjects(objectsToCheck, true);

        if (intersects.length > 0) {
            const groundPoint = intersects[0].point;
            const groundHeight = groundPoint.y;
            const roadNormal = intersects[0].face.normal.clone();
            intersects[0].object.updateMatrixWorld();
            roadNormal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld)).normalize();
            if (roadNormal.dot(downDirection) > 0) {
                roadNormal.negate();
            }

            if (isOnGround || isLanding) {
                const pitchQuaternion = getQuaternionFromVectors(up, roadNormal);

                // Unified steering logic for both VR and non-VR modes
                kart.quaternion.premultiply(pitchQuaternion);
                const forward = direction.clone().applyQuaternion(pitchQuaternion);
                up = roadNormal.clone();
                const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(up, steer);
                kart.quaternion.premultiply(yawQuaternion);
                direction = forward.applyAxisAngle(up, steer);

                right = new THREE.Vector3().crossVectors(direction, up).normalize();
            }

            if (!isOnGround) verticalVelocity += gravity * delta;

            if (kart.position.y <= groundHeight + 0.5 * scaleFactor) {
                if (!isOnGround) {
                    verticalVelocity = Math.abs(verticalVelocity) * 0.5;
                    isLanding = true;
                }
                kart.position.y = groundHeight;
                isOnGround = true;
                if (isLanding) {
                    verticalVelocity *= 0.8;
                    if (Math.abs(verticalVelocity) < 0.01) {
                        verticalVelocity = 0;
                        isLanding = false;
                    }
                }
            } else {
                isOnGround = false;
            }
        } else {
            isOnGround = false;
        }

        if (intersectsFront.length > 0) {
            const frontPoint = intersectsFront[0].point;
            const distanceToFrontPoint = raycaster.ray.origin.distanceTo(frontPoint);
            if (distanceToFrontPoint < 10 * scaleFactor) {
                obstacleNormal = intersectsFront[0].face.normal.clone();
                intersectsFront[0].object.updateMatrixWorld();
                obstacleNormal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(intersectsFront[0].object.matrixWorld)).normalize();
                if (obstacleNormal.dot(direction) > 0) obstacleNormal.negate();
            } else {
                obstacleNormal = null;
            }
        } else {
            obstacleNormal = null;
        }

        if (!isOnGround) verticalVelocity += gravity * delta;

        // Movement logic (same for both VR and non-VR modes)
        if (obstacleNormal) {
            const velocityVector = direction.clone().multiplyScalar(velocity);
            const projectionOntoNormal = obstacleNormal.clone().multiplyScalar(velocityVector.dot(obstacleNormal));
            const tangentialVelocity = velocityVector.clone().sub(projectionOntoNormal);
            kart.position.addScaledVector(tangentialVelocity, delta / 0.008);
        } else {
            kart.position.addScaledVector(direction, velocity * delta / 0.008);
        }
        kart.position.y += verticalVelocity * delta / .008;

        // Check for finish line crossing
        if (kart && startTime !== null) {
            const kartX = kart.position.x;
            const kartZ = kart.position.z;
            if (kartX >= -100 * scaleFactor && kartX <= 100 * scaleFactor && kartZ <= 0 && oldZ > 0) {
                finishTime = (performance.now() - startTime) / 1000;
                if (finishTime > 20) {
                    finishDiv.innerHTML = `Best: ${finishTime.toFixed(2)}s`;
                    finishSound.play();
                    saveBestTime();
                    startTime = performance.now();
                }
            }
        }

        // Check for falling off the track
        if (kart.position.y < -1000 * scaleFactor) {
            showGameOver();
            return;
        }

        // Check collision with coin
        checkCoinCollision();
    }

    renderer.render(scene, camera);
}

function showGameOver() {
    gameOver = true;
    const gameOverDiv = createDisplay(null, {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontSize: '5rem', color: 'red', fontWeight: 'bold', zIndex: '100'
    }, 'GAME OVER');
    setTimeout(() => {
        document.body.removeChild(gameOverDiv);
        restartGame();
    }, 3000);
}

function restartGame() {
    location.reload();
}

// Debounce function to limit execution frequency
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraFOV();
}

// Add resize listener
window.addEventListener("resize", onWindowResize);

// Add the resize event listener with debounce
window.addEventListener("resize", debounce(onWindowResize, 200));

// Detect and adjust on page load
document.addEventListener("DOMContentLoaded", adjustGameLogoForMobile);

// Adjust on resize for dynamic behavior
window.addEventListener("resize", adjustGameLogoForMobile);

// Setup VR button and functionality
function setupVRButton() {
    const vrToggle = document.getElementById('vr-toggle');

    // Custom implementation to create WebXR session without relying on VRButton
    vrToggle.addEventListener('click', () => {
        // Adjust camera position for VR mode to prevent motion sickness
        if (!isVRMode) {
            // Save original camera position before entering VR
            if (kart) {
                const originalPosition = camera.position.clone();
                camera.userData.originalPosition = originalPosition;

                // Move camera slightly higher and further back for VR
                camera.position.set(0, 130, 250);
                camera.lookAt(0, 2, 0);
            }

            // Request VR session
            if (navigator.xr) {
                navigator.xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                }).then(onSessionStarted)
                    .catch(error => {
                        console.error('Error starting VR session:', error);
                    });
            }
        } else {
            // End current session
            if (renderer.xr.isPresenting) {
                renderer.xr.getSession().end();
            }
        }
    });

    // Listen for the end of the VR session
    renderer.xr.addEventListener('sessionend', () => {
        isVRMode = false;
        vrToggle.textContent = 'Enter VR';

        // Restore original camera parent and position when exiting VR
        if (camera.userData.vrMode && camera.userData.originalParent) {
            // Remove camera from scene
            scene.remove(camera);

            // Add camera back to kart
            camera.userData.originalParent.add(camera);

            // Restore original camera position
            if (camera.userData.originalPosition) {
                camera.position.copy(camera.userData.originalPosition);
                camera.lookAt(0, 2, 0);
            }

            // Reset kart position and rotation to pre-VR state
            kart.position.set(0, 0, 0);
            kart.rotation.set(0, 0, 0);

            // Clean up references
            camera.userData.vrMode = false;
        }

        document.getElementById('game-overlay').style.display = 'block';
        if (isMobileDevice()) {
            document.getElementById('joystick-container').style.display = 'block';
            document.getElementById('steering-controls').style.display = 'flex';
        }

        // Clean up VR controllers
        vrControllers.forEach(controller => {
            scene.remove(controller);
        });
        controllerGrips.forEach(grip => {
            scene.remove(grip);
        });
        vrControllers = [];
        controllerGrips = [];
    });

    // Function to handle when a VR session is started
    function onSessionStarted(session) {
        renderer.xr.setSession(session);
        isVRMode = true;
        vrToggle.textContent = 'Exit VR';

        // Reset world container position when entering VR
        worldContainer.position.set(0, 0, 0);

        // Adjust kart positioning for VR view
        if (kart) {
            // Store reference to original parent of camera (the kart)
            const originalParent = camera.parent;

            // Remove camera from kart and add it directly to the scene
            // This makes the camera position controlled by WebXR and independent of kart
            kart.remove(camera);
            scene.add(camera);

            // Store references for restoration when exiting VR
            camera.userData.originalParent = originalParent;
            camera.userData.vrMode = true;

            // Position the kart in front of where the VR user will be standing
            // In WebXR, the initial position is typically (0,0,0) facing negative Z
            kart.position.set(0, 0, -3); // Position kart 3 units in front of the user

            // Now change the rotation so we see the rear of the kart
            // 0 degrees means kart is facing toward the user (+Z direction)
            kart.rotation.y = 0; // Face toward the user so we see the rear
        }

        // Hide UI elements in VR mode
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('joystick-container').style.display = 'none';
        document.getElementById('steering-controls').style.display = 'none';

        // Check for WebXR-OpenXR Bridge extension
        if (window.WebXROpenXRBridge) {
            console.log('WebXR-OpenXR Bridge extension detected - VR camera pose control enabled');
        } else {
            console.log('WebXR-OpenXR Bridge extension not found - using standard VR camera positioning');
        }

        setupVRControllers();
    }
}

// Function to check X button state on left controller
function checkXButtonState() {
    const session = renderer.xr.getSession();
    if (!session) return;

    let leftTriggerPressed = false;
    let rightTriggerPressed = false;

    for (const source of session.inputSources) {
        // Add comprehensive button logging to identify correct indices
        if (source.gamepad) {
            source.gamepad.buttons.forEach((btn, idx) => {
                if (btn.pressed) {
                    console.log(`Controller ${source.handedness} button ${idx}: PRESSED (value: ${btn.value.toFixed(2)})`);
                }
            });
        }

        // Check if it's a gamepad
        if (source.gamepad && source.handedness === 'left') {
            // X button (index 4) for turning left
            const xButton = source.gamepad.buttons[4];
            // Y button (index 5) for turning right
            const yButton = source.gamepad.buttons[5];
            // Left trigger (index 0) for deceleration
            const leftTrigger = source.gamepad.buttons[0];

            if (xButton && xButton.pressed) {
                joystickState.left = true;
                console.log("Left controller X button pressed - TURNING LEFT");
            } else {
                joystickState.left = false;
            }

            if (yButton && yButton.pressed) {
                joystickState.right = true;
                console.log("Left controller Y button pressed - TURNING RIGHT");
            } else {
                joystickState.right = false;
            }

            if (leftTrigger && leftTrigger.pressed) {
                joystickState.down = true;
                console.log("Left controller trigger pressed - DECELERATING");
            } else {
                joystickState.down = false;
            }
        }

        // Also check right controller buttons and thumbstick
        if (source.gamepad && source.handedness === 'right') {
            // Right trigger (try multiple indices) for acceleration
            const possibleTriggerIndices = [0, 2, 3, 4];
            let triggerPressed = false;

            for (const idx of possibleTriggerIndices) {
                if (source.gamepad.buttons[idx] && source.gamepad.buttons[idx].pressed) {
                    triggerPressed = true;
                    console.log(`Right controller button ${idx} pressed - Using as TRIGGER/ACCELERATE`);
                    break;
                }
            }

            // Handle thumbstick inputs (axes[2] = right stick X, axes[3] = right stick Y)
            let thumbstickActive = false;
            if (source.gamepad.axes && source.gamepad.axes.length >= 4) {
                const rightStickX = source.gamepad.axes[2]; // Left/Right steering
                const rightStickY = source.gamepad.axes[3]; // Up/Down acceleration/deceleration

                const deadzone = 0.2; // Ignore small movements

                // Thumbstick Y-axis: Up = negative (accelerate), Down = positive (decelerate)
                if (rightStickY < -deadzone) {
                    joystickState.up = true;
                    thumbstickActive = true;
                    if (Math.abs(rightStickY) > 0.5) {
                        console.log(`Right thumbstick UP: ${rightStickY.toFixed(2)} - ACCELERATING`);
                    }
                } else if (rightStickY > deadzone) {
                    joystickState.down = true;
                    thumbstickActive = true;
                    if (Math.abs(rightStickY) > 0.5) {
                        console.log(`Right thumbstick DOWN: ${rightStickY.toFixed(2)} - DECELERATING`);
                    }
                } else {
                    // Reset acceleration/deceleration if thumbstick is neutral
                    if (!triggerPressed) {
                        joystickState.up = false;
                    }
                    joystickState.down = false;
                }

                // Thumbstick X-axis: Left = negative, Right = positive
                if (rightStickX < -deadzone) {
                    joystickState.left = true;
                    if (Math.abs(rightStickX) > 0.5) {
                        console.log(`Right thumbstick LEFT: ${rightStickX.toFixed(2)} - TURNING LEFT`);
                    }
                } else if (rightStickX > deadzone) {
                    joystickState.right = true;
                    if (Math.abs(rightStickX) > 0.5) {
                        console.log(`Right thumbstick RIGHT: ${rightStickX.toFixed(2)} - TURNING RIGHT`);
                    }
                } else {
                    // Reset steering if thumbstick is neutral (but don't override button inputs)
                    if (!joystickState.left && !joystickState.right) {
                        joystickState.left = false;
                        joystickState.right = false;
                    }
                }
            }

            // Handle trigger button (only if thumbstick isn't controlling acceleration)
            if (triggerPressed && !thumbstickActive) {
                joystickState.up = true;
                rightTriggerPressed = true;
                console.log("Right controller trigger pressed - ACCELERATING");
            } else if (!thumbstickActive) {
                joystickState.up = false;
            }
        }
    }

    // Log overall state for debugging
    if (leftTriggerPressed || rightTriggerPressed) {
        console.log("VR Turning state:", {
            leftTrigger: leftTriggerPressed,
            rightTrigger: rightTriggerPressed,
            joystickStateLeft: joystickState.left,
            joystickStateRight: joystickState.right,
            velocity: velocity,
            steer: steer,
            isWorldContainerValid: !!worldContainer,
            worldRotation: worldContainer ? worldContainer.rotation.y : "N/A",
            cameraPosition: camera ? `${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}` : "N/A",
            kartPosition: kart ? `${kart.position.x.toFixed(2)}, ${kart.position.y.toFixed(2)}, ${kart.position.z.toFixed(2)}` : "N/A",
            worldPosition: worldContainer ? `${worldContainer.position.x.toFixed(2)}, ${worldContainer.position.y.toFixed(2)}, ${worldContainer.position.z.toFixed(2)}` : "N/A"
        });
    }
}

// Initialize VR controllers with more robust debugging
function setupVRControllers() {
    console.log("Setting up VR controllers...");

    // Controller models - check if XRControllerModelFactory is available
    let controllerModelFactory;

    if (window.XRControllerModelFactory) {
        controllerModelFactory = new window.XRControllerModelFactory();
        console.log("Using XRControllerModelFactory for controller models");
    } else {
        console.warn("XRControllerModelFactory not found, using simplified controller visualization");
    }

    // Setup controllers
    for (let i = 0; i < 2; i++) {
        // Controller
        const controller = renderer.xr.getController(i);

        // Add debug logging to controller events
        controller.addEventListener('connected', (event) => {
            console.log(`Controller ${i} connected, handedness: ${event.data.handedness}`);
            if (event.data.gamepad) {
                console.log(`Controller has gamepad with ${event.data.gamepad.buttons.length} buttons and ${event.data.gamepad.axes.length} axes`);

                // Log initial button state
                console.log("Initial button state:",
                    event.data.gamepad.buttons.map((b, idx) =>
                        `Button ${idx}: ${b.pressed ? 'PRESSED' : 'not pressed'} (${b.value.toFixed(2)})`).join(', '));
            }

            // Store button mapping information for this controller
            controller.userData.handedness = event.data.handedness;
            controller.userData.buttonCount = event.data.gamepad ? event.data.gamepad.buttons.length : 0;
        });

        controller.addEventListener('disconnected', () => {
            console.log(`Controller ${i} disconnected`);
        });

        // Add handlers for all supported event types
        const eventTypes = [
            'selectstart', 'selectend',
            'squeezestart', 'squeezeend',
            'buttondown', 'buttonup',
            'axischanged'
        ];

        eventTypes.forEach(eventType => {
            controller.addEventListener(eventType, (event) => {
                console.log(`Controller ${i} event: ${eventType}`, event);

                // For button events, try to identify which button triggered it
                if (eventType === 'buttondown' || eventType === 'buttonup') {
                    const session = renderer.xr.getSession();
                    if (session && session.inputSources && session.inputSources[i] && session.inputSources[i].gamepad) {
                        const gamepad = session.inputSources[i].gamepad;
                        console.log(`Button state at ${eventType}:`,
                            gamepad.buttons.map((b, idx) =>
                                `Button ${idx}: ${b.pressed ? 'PRESSED' : 'not pressed'} (${b.value.toFixed(2)})`).join(', '));
                    }
                }

                // Implement control logic based on events
                if (eventType === 'selectstart' && controller.userData.handedness === 'right') {
                    joystickState.left = true;
                    console.log("Right controller select started - turning LEFT");
                } else if (eventType === 'selectend' && controller.userData.handedness === 'right') {
                    joystickState.left = false;
                    console.log("Right controller select ended - stopped turning LEFT");
                } else if (eventType === 'squeezestart' && controller.userData.handedness === 'right') {
                    joystickState.right = true;
                    console.log("Right controller squeeze started - turning RIGHT");
                } else if (eventType === 'squeezeend' && controller.userData.handedness === 'right') {
                    joystickState.right = false;
                    console.log("Right controller squeeze ended - stopped turning RIGHT");
                }
            });
        });

        controller.userData.index = i; // Left (0) or right (1) controller

        // Add a simple visual for the controller if no model factory is available
        if (!controllerModelFactory) {
            const geometry = new THREE.BoxGeometry(0.03, 0.1, 0.03);
            const material = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0x3333ff : 0xff3333 // Blue for left, red for right
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, -0.05, 0); // Offset to align with hand
            controller.add(mesh);
        }

        scene.add(controller);
        vrControllers.push(controller);

        // Controller grip with model (if factory available)
        const controllerGrip = renderer.xr.getControllerGrip(i);
        if (controllerModelFactory) {
            controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
        }
        scene.add(controllerGrip);
        controllerGrips.push(controllerGrip);
    }

    console.log("VR controllers initialized");

    // Log session and inputSources for debugging
    const session = renderer.xr.getSession();
    if (session) {
        console.log("XR Session found:", session);
        if (session.inputSources) {
            console.log(`${session.inputSources.length} input sources available`);
            session.inputSources.forEach((source, index) => {
                console.log(`Input source ${index}:`, source.handedness,
                    source.gamepad ? `has gamepad with ${source.gamepad.buttons.length} buttons` : 'no gamepad');

                // Log initial button state if available
                if (source.gamepad) {
                    console.log(`Initial button state for ${source.handedness}:`,
                        source.gamepad.buttons.map((b, idx) =>
                            `Button ${idx}: ${b.pressed ? 'PRESSED' : 'not pressed'} (${b.value.toFixed(2)})`).join(', '));
                }
            });
        }

        // Try to select all available XR input profiles to help with debugging
        session.addEventListener('inputsourceschange', (event) => {
            console.log('Input sources changed:', {
                added: event.added ? event.added.length : 0,
                removed: event.removed ? event.removed.length : 0
            });

            if (event.added) {
                event.added.forEach(source => {
                    console.log(`New input source:`,
                        source.handedness,
                        source.profiles,
                        source.gamepad ? `has gamepad with ${source.gamepad.buttons.length} buttons` : 'no gamepad');
                });
            }
        });
    }
}

init();
onWindowResize(); // Ensure proper size on load
