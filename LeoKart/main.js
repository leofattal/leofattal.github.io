import { supabase } from './supabase.js';
const leaderboardDiv = document.getElementById('leaderboard');

let scene, camera, renderer;
let kart, donut, coin;
const clock = new THREE.Clock();
const keyboard = {};
let track, trackUrl;
const obstacleBoxes = [];
let trackId = 0; // Initial track ID
const numTracks = 2; // Total number of tracks

let timerDiv, finishDiv;
let startTime = null, finishTime = null, bestTime = null;
let velocity = 0, verticalVelocity = 0;
let joystickState = { up: false, down: false, left: false, right: false };
let joystickContainer;
const acceleration = 0.02, deceleration = 0.01, maxSpeed = 3.5, friction = 0.005, turnSpeed = 0.03, gravity = -2;
let direction = new THREE.Vector3(0, 0, -1), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
let isOnGround = true, steer = 0, obstacleNormal = null, isLanding = false, oldZ = 0;
let donutAngularVelocity = 0.05, gameOver = false;
let audioContext = null, audioBuffer = null, audioSource = null, gainNode = null;
let finishSound = new Audio('assets/finish-sound.mp3');
finishSound.volume = 0.5;

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
    // Increment the track ID, cycling back to 0 when reaching numTracks
    trackId = (trackId + 1) % numTracks;
    console.log(`Switched to track ${trackId}`);

    // Save the new trackId in localStorage
    localStorage.setItem('lastTrackId', trackId);

    // Logic to reload or update the track
    loadTrack();
    loadModels();

    // Update the best time display for the new track
    updateBestTimeUI(trackId);
}

function initializeTrack() {
    // Retrieve the last trackId from localStorage, default to 0 if not found
    trackId = parseInt(localStorage.getItem('lastTrackId')) || 0;

    console.log(`Starting with track ${trackId}`);

    // Load the saved track
    loadTrack();

    // Update the best time display for the starting track
    updateBestTimeUI(trackId);
}

// Attach the toggleTrack function to the button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggle-track-button').addEventListener('click', toggleTrack);
});

// Joystick if mobile
document.addEventListener("DOMContentLoaded", () => {
    // Detect if the browser is mobile
    const isMobile = isMobileDevice();
    if (!isMobile) return;

    joystickContainer = document.getElementById("joystick-container");
    const joystickKnob = document.getElementById("joystick-knob");
    joystickContainer.style.display = "block";

    let startX, startY;
    const maxDistance = 30; // Maximum joystick displacement

    const updateJoystickState = (dx, dy) => {
        const threshold = 20; // Minimum displacement to trigger an action
        joystickState.up = dy < -threshold;
        joystickState.down = dy > threshold;
        joystickState.left = dx < -threshold / 4;
        joystickState.right = dx > threshold / 4;

        if (joystickState.up) console.log("Move Forward");
        if (joystickState.down) console.log("Move Backward");
        if (joystickState.left) console.log("Turn Left");
        if (joystickState.right) console.log("Turn Right");
    };

    const handleTouchMove = (event) => {
        const touch = event.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
        const angle = Math.atan2(dy, dx);

        const offsetX = distance * Math.cos(angle);
        const offsetY = distance * Math.sin(angle);

        // Apply displacement while keeping the knob visually centered
        joystickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;

        updateJoystickState(offsetX, offsetY);
    };

    const handleTouchEnd = () => {
        joystickKnob.style.transform = "translate(-50%, -50%)";

        // Reset joystick state
        joystickState.up = joystickState.down = joystickState.left = joystickState.right = false;
    };

    // Define handleTouchStart function
    const handleTouchStart = (event) => {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        joystickKnob.style.transition = "none";

        // Initialize audio and timer on first touch
        setupAudio();
        initializeOnJoystickEvent();
    };

    // Initialize on Joystick Event
    function initializeOnJoystickEvent() {
        console.log("Joystick triggered, initializing...");
        startTime = performance.now();
        leaderboardDiv.style.display = 'none';
        document.getElementById('game-logo').style.display = 'none';

        // Remove the listener to prevent re-triggering
        if (joystickContainer) {
            joystickContainer.removeEventListener("touchstart", handleTouchStart);
        }
    }

    // Add event listeners
    joystickContainer.addEventListener("touchstart", handleTouchStart);
    joystickContainer.addEventListener("touchmove", handleTouchMove);
    joystickContainer.addEventListener("touchend", handleTouchEnd);
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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, -20);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    updateCameraFOV();
    // Initialize the track
    initializeTrack();
    loadModels();
    loadKartSound();
    timerDiv = createDisplay(timerDiv, { position: 'absolute', top: '10px', right: '10px', color: 'white', fontStyle: 'italic', fontSize: '2rem', zIndex: '100' }, 'Time: 0.00s');
    finishDiv = createDisplay(finishDiv, { position: 'absolute', top: '40px', right: '10px', color: 'red', fontStyle: 'italic', fontSize: '2rem', zIndex: '100' }, '  --  ');

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', e => keyboard[e.key] = true);
    document.addEventListener('keyup', e => keyboard[e.key] = false);
    animate();
}

function loadTrack() {
    leaderboardDiv.style.display = 'block';
    fetchLeaderboard(trackId);
    if (track) scene.remove(track); // Remove the existing track if it exists

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
                    track.scale.set(...config.scale);
                }
                if (config.position) {
                    track.position.set(...config.position);
                }
                if (config.rotation) {
                    track.rotation.set(...config.rotation.map(deg => THREE.MathUtils.degToRad(deg))); // Convert degrees to radians
                }

                scene.add(track);
                console.log(`Track ${trackId} loaded successfully!`);
            }, undefined, error => console.error('Error loading track asset:', error));
        })
        .catch(error => console.error('Error loading track configuration:', error));
}

function loadModels() {
    if (kart) scene.remove(kart);
    if (coin) scene.remove(coin);
    if (donut) scene.remove(donut);
    const loader = new THREE.GLTFLoader();
    loader.load('assets/kart/scene.gltf', gltf => {
        kart = gltf.scene;
        kart.scale.set(0.5, 0.5, 0.5);
        kart.add(camera);
        camera.position.set(0, 100, 200);
        camera.lookAt(0, 2, 0);
        kart.position.set(0, 0, 0);
        scene.add(kart);
    });

    loader.load('assets/donut.gltf', gltf => {
        donut = gltf.scene;
        donut.scale.set(200, 200, 200);
        donut.rotateZ(Math.PI / 2);
        donut.position.set(280, 300, 2700);
        scene.add(donut);
        obstacleBoxes.push(new THREE.Box3().setFromObject(donut));
    });

    loader.load('assets/coin.gltf', gltf => {
        coin = gltf.scene;
        coin.scale.set(10, 10, 10);
        // Position the coin 200 units away from the kart in the "direction" vector
        coin.position.set(0, 30, -200); // Add offset to kart's position
        scene.add(coin);
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
        triggerFlashingEffect();

        // Remove the coin from the scene after collision
        scene.remove(coin);
        coin = null; // Avoid multiple triggers
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

    if (kart) {
        oldZ = kart.position.z;
        if ((keyboard['ArrowUp'] || joystickState.up) && isOnGround) velocity = Math.min(velocity + acceleration * delta / .008, maxSpeed);
        if ((keyboard['ArrowDown'] || joystickState.down) && isOnGround) velocity = Math.max(velocity - acceleration * delta / .008, -maxSpeed / 2);
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown'] && !joystickState.up && !joystickState.down && isOnGround) {
            if (velocity > 0) velocity = Math.max(velocity - friction * delta / .008, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction * delta / .008, 0);
        }

        steer = 0;
        if ((keyboard['ArrowLeft'] || joystickState.left) && velocity !== 0 && isOnGround) steer = turnSpeed * (velocity / maxSpeed);
        if ((keyboard['ArrowRight'] || joystickState.right) && velocity !== 0 && isOnGround) steer = -turnSpeed * (velocity / maxSpeed);

        raycaster.set(kart.position.clone().add(new THREE.Vector3(0, 10, 0)), downDirection);
        const intersects = raycaster.intersectObject(track, true);
        raycasterFront.set(kart.position.clone().add(new THREE.Vector3(0, 10, 0)), direction);
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
                kart.quaternion.premultiply(pitchQuaternion);
                const forward = direction.clone().applyQuaternion(pitchQuaternion);
                up = roadNormal.clone();
                const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(up, steer);
                kart.quaternion.premultiply(yawQuaternion);
                direction = forward.applyAxisAngle(up, steer);
                right = new THREE.Vector3().crossVectors(direction, up).normalize();
            }

            if (!isOnGround) verticalVelocity += gravity * delta;

            if (kart.position.y <= groundHeight + 0.5) {
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
            if (distanceToFrontPoint < 10) {
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

        if (obstacleNormal) {
            const velocityVector = direction.clone().multiplyScalar(velocity);
            const projectionOntoNormal = obstacleNormal.clone().multiplyScalar(velocityVector.dot(obstacleNormal));
            const tangentialVelocity = velocityVector.clone().sub(projectionOntoNormal);
            kart.position.addScaledVector(tangentialVelocity, delta / 0.008);
        } else {
            kart.position.addScaledVector(direction, velocity * delta / 0.008);
        }
        kart.position.y += verticalVelocity * delta / .008;
        // console.log(kart.position, direction);

        if (kart && startTime !== null) {
            const kartX = kart.position.x, kartZ = kart.position.z;
            if (kartX >= -100 && kartX <= 100 && kartZ <= 0 && oldZ > 0) { // always same finish condition now
                finishTime = (performance.now() - startTime) / 1000;
                if (finishTime > 20) {
                    finishDiv.innerHTML = `${finishTime.toFixed(2)}s`;
                    finishSound.play();
                    saveBestTime();
                    startTime = performance.now();
                }
            }
        }

        if (kart.position.y < -1000) {
            showGameOver();
            return;
        }

        // Check collision with coin
        checkCoinCollision();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
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
    setTimeout(() => {
        // Use visualViewport if available, fallback to window dimensions
        // const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        // const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update camera and renderer
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        // Ensure the canvas matches the viewport
        const canvas = renderer.domElement;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        console.log(`Viewport resized: ${width}x${height}`);
    }, 100); // Delay for stabilization
}

// Add resize listener
window.addEventListener("resize", onWindowResize);

// Add the resize event listener with debounce
window.addEventListener("resize", debounce(onWindowResize, 200));

// Detect and adjust on page load
document.addEventListener("DOMContentLoaded", adjustGameLogoForMobile);

// Adjust on resize for dynamic behavior
window.addEventListener("resize", adjustGameLogoForMobile);

init();
onWindowResize(); // Ensure proper size on load
