// Modern Three.js ES6 Module Imports (like Spaces project)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

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
let scaleFactor = 0.01;
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

// World container for VR mode
let worldContainer;

// VR-specific variables for XR space following kart
let vrReferencePosition = new THREE.Vector3(0, 0.5, 2); // Offset behind kart
let vrReferenceRotation = new THREE.Euler(0, 0, 0); // Reference rotation for kart in VR

// WebXR Reference Space Management following movingSpaces.md
let baseReferenceSpace = null; // Store the original reference space
let currentReferenceSpace = null; // Current offset reference space following kart

const raycaster = new THREE.Raycaster(), downDirection = new THREE.Vector3(0, -1, 0), raycasterFront = new THREE.Raycaster();

function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|webOS|Kindle|Silk/.test(userAgent);
    return hasTouch;
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: '859341970629-8gsjvbl86s7kg2gasposjh00qtfnf5pj.apps.googleusercontent.com',
        callback: onSignIn,
        auto_select: true,
    });

    google.accounts.id.renderButton(
        document.getElementById('login-button'),
        { theme: 'outline', size: 'small' }
    );

    const token = localStorage.getItem('googleCredential');
    if (token) {
        onSignIn({ credential: token });
    } else {
        google.accounts.id.prompt();
    }
};

const profilePic = document.getElementById('profile-pic');
profilePic.onload = function () {
    console.log('Profile picture loaded successfully');
};
profilePic.onerror = function () {
    profilePic.src = 'assets/generic-avatar.jpg';
};

async function onSignIn(response) {
    localStorage.setItem('googleCredential', response.credential);

    try {
        const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${response.credential}`);
        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user profile');
        }
        const profileData = await profileResponse.json();

        const { sub: googleId, email, given_name: name, picture } = profileData;

        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', googleId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user:', fetchError);
            return;
        }

        let userId;
        if (existingUser) {
            console.log('User already exists:', existingUser);
            userId = existingUser.id;
        } else {
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    google_id: googleId,
                    email,
                    name,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting new user:', insertError);
                return;
            }

            console.log('Inserted new user:', newUser);
            userId = newUser.id;
        }

        localStorage.setItem('supabaseUserId', userId);

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
    localStorage.removeItem('googleCredential');
    document.getElementById('login-button').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    google.accounts.id.disableAutoSelect();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-button').addEventListener('click', signOut);
});

async function getBestTime(trackId) {
    const userId = localStorage.getItem('supabaseUserId');
    if (!userId) {
        console.error('User ID not found in localStorage');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('track_times')
            .select('best_time')
            .eq('user_id', userId)
            .eq('track_id', trackId);

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            return null;
        }

        return data[0].best_time || null;
    } catch (err) {
        console.error('Unexpected error fetching best time:', err);
        return null;
    }
}

async function saveBestTime() {
    const userId = localStorage.getItem('supabaseUserId');
    if (!userId) {
        console.error('User ID not found in localStorage');
        return;
    }

    try {
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
            document.getElementById('best-time').textContent = `Best: ${finishTime.toFixed(2)}`;
        }
    } catch (err) {
        console.error('Unexpected error saving best time:', err);
    }
}

async function fetchLeaderboard(trackId) {
    try {
        const { data, error } = await supabase
            .from('track_times')
            .select('best_time, user_id, users(name)')
            .eq('track_id', trackId)
            .order('best_time', { ascending: true });

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return;
        }

        leaderboardDiv.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = 'Leaderboard';
        leaderboardDiv.appendChild(title);

        if (data.length === 0) {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No entries yet!';
            noDataMessage.style.color = '#ccc';
            leaderboardDiv.appendChild(noDataMessage);
            return;
        }

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

async function updateBestTimeUI(trackId) {
    bestTime = await getBestTime(trackId);
    if (bestTime) {
        document.getElementById('best-time').textContent = `Best: ${bestTime.toFixed(2)}`;
    } else {
        document.getElementById('best-time').textContent = `No Record`;
    }
}

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

function toggleTrack() {
    startTime = null;
    if (timerDiv) {
        timerDiv.innerHTML = 'Time: 0.00s';
        finishDiv.innerHTML = 'Best: -- ';
        coinDiv.innerHTML = 'Coins: 0';
    }

    trackId = (trackId + 1) % numTracks;
    console.log(`Switched to track ${trackId}`);
    localStorage.setItem('lastTrackId', trackId);

    loadTrack(() => {
        loadModels();
    });

    updateBestTimeUI(trackId);
}

function initializeTrack() {
    trackId = parseInt(localStorage.getItem('lastTrackId')) || 0;
    console.log(`Starting with track ${trackId}`);

    loadTrack(() => {
        loadModels();
    });

    updateBestTimeUI(trackId);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggle-track-button').addEventListener('click', toggleTrack);
});

// Transform World to Position Kart in VR - SIMPLE APPROACH
function transformWorldForVR() {
    if (!isVRMode || !kart || !worldContainer) return;

    // Calculate where the kart currently is
    const kartPosition = kart.position.clone();
    const kartRotation = kart.rotation.clone();

    // Apply the vrReferencePosition offset in kart's local coordinate system
    const targetWorldPosition = kartPosition.clone();
    const offsetVector = vrReferencePosition.clone();
    offsetVector.applyQuaternion(kart.quaternion); // Transform offset to world space
    targetWorldPosition.add(offsetVector);

    // Calculate how to transform the world so kart appears at origin for VR camera
    const worldOffset = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), targetWorldPosition);
    const rotationOffset = vrReferenceRotation.y - kartRotation.y;

    // Apply transforms to world container
    worldContainer.position.copy(worldOffset);
    worldContainer.rotation.y = rotationOffset;

    console.log(`VR World Transform - Kart at: (${kartPosition.x.toFixed(2)}, ${kartPosition.z.toFixed(2)}), World offset: (${worldOffset.x.toFixed(2)}, ${worldOffset.z.toFixed(2)})`);
}

// Calculate Look-At Quaternions following movingSpaces.md
function calculateLookAtQuaternion(eyeX, eyeY, eyeZ, targetX, targetY, targetZ) {
    // Use Three.js Camera for proper lookAt calculation (cameras default to looking down -Z)
    const tempCamera = new THREE.PerspectiveCamera();
    const eyePos = new THREE.Vector3(eyeX, eyeY, eyeZ);
    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

    // Position the camera at the eye position
    tempCamera.position.copy(eyePos);

    // Make it look at the target
    tempCamera.lookAt(targetPos);

    // Extract the quaternion
    const quaternion = tempCamera.quaternion;

    return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

// Update XR Reference Space to Follow Kart - FOLLOWING movingSpaces.md with DIRECT sync
function updateXRSpaceToFollowKart() {
    if (!isVRMode || !kart || !baseReferenceSpace) return;

    // Use kart position and rotation directly - no smoothing needed with perfect sync
    const kartPosition = kart.position.clone();
    const kartQuaternion = kart.quaternion.clone();

    // Apply the vrReferencePosition offset in kart's local coordinate system
    const cameraTargetPosition = kartPosition.clone();
    const offsetVector = vrReferencePosition.clone(); // (0, 0.5, 2)
    offsetVector.applyQuaternion(kartQuaternion); // Transform to world space
    cameraTargetPosition.add(offsetVector);

    // Create transform as if positioning an object at the camera target position
    const transform = new XRRigidTransform(
        {
            x: cameraTargetPosition.x,
            y: cameraTargetPosition.y,
            z: cameraTargetPosition.z
        },
        {
            x: kartQuaternion.x,
            y: kartQuaternion.y,
            z: kartQuaternion.z,
            w: kartQuaternion.w
        }
    );

    // Apply the INVERSE to create the reference space
    currentReferenceSpace = baseReferenceSpace.getOffsetReferenceSpace(transform.inverse);

    // Set the New Reference Space using correct Three.js API
    renderer.xr.setReferenceSpace(currentReferenceSpace);
}

// Mobile joystick setup
document.addEventListener("DOMContentLoaded", () => {
    const isMobile = isMobileDevice();
    if (!isMobile) return;

    const gameCanvas = document.getElementById("game-canvas");
    gameCanvas.addEventListener("contextmenu", (e) => e.preventDefault());
    gameCanvas.addEventListener("selectstart", (e) => e.preventDefault());

    joystickContainer = document.getElementById("joystick-container");
    const joystickKnob = document.getElementById("joystick-knob");
    const steerLeft = document.getElementById("steer-left");
    const steerRight = document.getElementById("steer-right");

    steerLeft.addEventListener("contextmenu", (e) => e.preventDefault());
    steerRight.addEventListener("contextmenu", (e) => e.preventDefault());

    joystickContainer.style.display = "block";
    document.getElementById("steering-controls").style.display = "flex";

    let startX, startY;
    const maxDistance = 30;

    const updateJoystickState = (dx, dy) => {
        const threshold = 20;
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

function updateCameraFOV() {
    const aspect = window.innerWidth / window.innerHeight;

    if (aspect > 1) {
        camera.fov = 75;
    } else {
        const horizontalFOV = 75;
        camera.fov = 2 * Math.atan(Math.tan((horizontalFOV * Math.PI) / 360) / aspect) * (180 / Math.PI);
    }

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", updateCameraFOV);

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = skyboxLoader.load([
        'assets/skybox/right.jpg', 'assets/skybox/left.jpg', 'assets/skybox/top.jpg',
        'assets/skybox/bottom.jpg', 'assets/skybox/front.jpg', 'assets/skybox/back.jpg'
    ]);
    // Fix color space issue - set to SRGBColorSpace for proper colors
    skyboxTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyboxTexture;

    // Create a world container for VR mode
    worldContainer = new THREE.Group();
    scene.add(worldContainer);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10000 * scaleFactor, 10000 * scaleFactor);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Fix color space issue - set output color space to sRGB for proper colors
    renderer.outputColorSpace = THREE.SRGBColorSpace;

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

    // Fix lighting intensities for modern Three.js (r155+) - multiply by PI
    // See: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6 * Math.PI); // 0.6 * PI ≈ 1.885
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8 * Math.PI); // 0.8 * PI ≈ 2.513
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

// Fix Color Space on GLTF Models - prevents washed out textures in modern Three.js
function fixGLTFColorSpace(gltf) {
    gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const material = child.material;

            // Fix color space on all material textures
            if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
            if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            if (material.specularMap) material.specularMap.colorSpace = THREE.SRGBColorSpace;

            // Handle arrays of materials (multi-material objects)
            if (Array.isArray(material)) {
                material.forEach(mat => {
                    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
                    if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                    if (mat.specularMap) mat.specularMap.colorSpace = THREE.SRGBColorSpace;
                });
            }
        }
    });
}

// Alternative: Selective Color Space Fix - only applies sRGB if texture looks like it needs it
function fixGLTFColorSpaceSelective(gltf) {
    gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
            const material = child.material;

            // Only apply sRGB to textures that appear to need it
            const applyColorSpaceFix = (texture) => {
                if (!texture) return;

                // Skip if already has a color space set
                if (texture.colorSpace && texture.colorSpace !== THREE.NoColorSpace) {
                    return;
                }

                // Apply sRGB to diffuse/albedo textures only
                texture.colorSpace = THREE.SRGBColorSpace;
            };

            // Only fix base color/diffuse maps, not normal maps or other technical textures
            if (material.map) applyColorSpaceFix(material.map);
            if (material.emissiveMap) applyColorSpaceFix(material.emissiveMap);

            // Handle material arrays
            if (Array.isArray(material)) {
                material.forEach(mat => {
                    if (mat.map) applyColorSpaceFix(mat.map);
                    if (mat.emissiveMap) applyColorSpaceFix(mat.emissiveMap);
                });
            }
        }
    });
}


function loadTrack(callback) {
    leaderboardDiv.style.display = 'block';
    fetchLeaderboard(trackId);
    if (track) worldContainer.remove(track);

    const configPath = `trackConfigs/track_${trackId}.json`;

    fetch(configPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load track config: ${configPath}`);
            }
            return response.json();
        })
        .then(config => {
            const loader = new GLTFLoader();

            loader.load(config.path, gltf => {
                // Skip color space fix for track - textures might already be sRGB
                // fixGLTFColorSpace(gltf);

                track = gltf.scene;

                if (config.scale) {
                    track.scale.set(...config.scale.map(scale => scale * scaleFactor));
                }
                if (config.position) {
                    track.position.set(...config.position.map(pos => pos * scaleFactor));
                }
                if (config.rotation) {
                    track.rotation.set(...config.rotation.map(deg => THREE.MathUtils.degToRad(deg)));
                }

                worldContainer.add(track);
                console.log(`Track ${trackId} loaded successfully!`);

                if (typeof callback === "function") {
                    callback();
                }
            }, undefined, error => console.error('Error loading track asset:', error));
        })
        .catch(error => console.error('Error loading track configuration:', error));
}

function loadModels() {
    if (kart) scene.remove(kart);
    if (coin) worldContainer.remove(coin);
    if (donut) worldContainer.remove(donut);

    const loader = new GLTFLoader();
    loader.load('assets/kart/scene.gltf', gltf => {
        // Fix color space for proper colors in modern Three.js
        fixGLTFColorSpace(gltf);

        kart = gltf.scene;
        kart.scale.set(0.5 * scaleFactor, 0.5 * scaleFactor, 0.5 * scaleFactor);

        // In VR mode: kart starts at origin and stays there logically
        // In non-VR mode: attach camera to kart
        if (!isVRMode) {
            kart.add(camera);
            kart.position.set(0, 0, 0);
        } else {
            // In VR mode, camera is independent, kart starts at origin
            kart.position.set(0, 0, 0);
        }

        scene.add(kart);

        // Initial camera animation only for non-VR mode
        if (!isVRMode) {
            const startPosition = { x: 0, y: 10000, z: 10000 };
            camera.position.set(startPosition.x, startPosition.y, startPosition.z);

            const targetPosition = { x: 0, y: 100, z: 200 };
            const startTime = performance.now();
            const duration = 2000;

            function animateCamera() {
                const elapsedTime = performance.now() - startTime;
                const t = Math.min(elapsedTime / duration, 1);

                camera.position.x = THREE.MathUtils.lerp(startPosition.x, targetPosition.x, t);
                camera.position.y = THREE.MathUtils.lerp(startPosition.y, targetPosition.y, t);
                camera.position.z = THREE.MathUtils.lerp(startPosition.z, targetPosition.z, t);

                camera.lookAt(0, 2 * scaleFactor, 0);

                if (t < 1) {
                    requestAnimationFrame(animateCamera);
                }
            }

            animateCamera();
        }
    });

    loader.load('assets/donut.gltf', gltf => {
        // Fix color space for proper colors in modern Three.js
        fixGLTFColorSpace(gltf);

        donut = gltf.scene;
        donut.scale.set(200 * scaleFactor, 200 * scaleFactor, 200 * scaleFactor);
        donut.rotateZ(Math.PI / 2);
        donut.position.set(280 * scaleFactor, 300 * scaleFactor, 2700 * scaleFactor);
        worldContainer.add(donut);
        obstacleBoxes.push(new THREE.Box3().setFromObject(donut));
    });

    loader.load('assets/coin.gltf', gltf => {
        // Fix color space for proper colors in modern Three.js
        fixGLTFColorSpace(gltf);

        coin = gltf.scene;
        coin.scale.set(10 * scaleFactor, 10 * scaleFactor, 10 * scaleFactor);
        coin.position.set(0, 30 * scaleFactor, -200 * scaleFactor);
        worldContainer.add(coin);
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

function checkCoinCollision() {
    if (!coin || !kart) return;

    const kartBox = new THREE.Box3().setFromObject(kart);
    const coinBox = new THREE.Box3().setFromObject(coin);

    if (kartBox.intersectsBox(coinBox)) {
        coinSound.play();
        triggerFlashingEffect();
        numCoins++;
        coinDiv.innerHTML = `Coins: ${numCoins}`;
        repositionCoin();
    }
}

function repositionCoin() {
    const trackBox = new THREE.Box3().setFromObject(track);

    const minX = trackBox.min.x;
    const maxX = trackBox.max.x;
    const minZ = trackBox.min.z;
    const maxZ = trackBox.max.z;

    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const raycaster = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);

    let positioned = false;

    while (!positioned) {
        const randomX = randomInRange(minX, maxX);
        const randomZ = randomInRange(minZ, maxZ);

        const newPosition = new THREE.Vector3(randomX, 1000 * scaleFactor, randomZ);

        raycaster.set(newPosition, downDirection);
        const intersects = raycaster.intersectObject(track, true);

        if (intersects.length > 0) {
            const groundPoint = intersects[0].point;
            coin.position.set(groundPoint.x, groundPoint.y + 30 * scaleFactor, groundPoint.z);
            positioned = true;
        }
    }
}

function triggerFlashingEffect() {
    let flashCount = 0;
    const maxFlashes = 6;
    const flashInterval = 200;

    const flashTimer = setInterval(() => {
        kart.visible = !kart.visible;
        flashCount++;

        if (flashCount >= maxFlashes) {
            clearInterval(flashTimer);
            kart.visible = true;
        }
    }, flashInterval);
}

function animate() {
    if (gameOver) return;
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

    // VR controller input handling
    if (isVRMode) {
        checkXButtonState();
        // Update XR Reference Space CONTINUOUSLY for perfect sync (like Spaces project)
        updateXRSpaceToFollowKart();
    }

    // ============= PHYSICS AND GAME LOGIC PHASE =============
    // Run ALL physics and game logic first, exactly like web version
    if (kart) {
        oldZ = kart.position.z;

        // Standard kart movement logic (same as web mode)
        if ((keyboard['ArrowUp'] || joystickState.up) && isOnGround) velocity = Math.min(velocity + acceleration * delta / .008, maxSpeed);
        if ((keyboard['ArrowDown'] || joystickState.down) && isOnGround) velocity = Math.max(velocity - acceleration * delta / .008, -maxSpeed / 2);
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown'] && !joystickState.up && !joystickState.down && isOnGround) {
            if (velocity > 0) velocity = Math.max(velocity - friction * delta / .008, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction * delta / .008, 0);
        }

        steer = 0;
        if (velocity !== 0 && isOnGround) {
            if (keyboard['ArrowLeft']) {
                steer = turnSpeed * (velocity / maxSpeed);
            }
            if (keyboard['ArrowRight']) {
                steer = -turnSpeed * (velocity / maxSpeed);
            }

            const vrSteerMultiplier = 1.5;
            if (joystickState.left && isVRMode) {
                steer = turnSpeed * (velocity / maxSpeed) * vrSteerMultiplier;
            }
            if (joystickState.right && isVRMode) {
                steer = -turnSpeed * (velocity / maxSpeed) * vrSteerMultiplier;
            }

            if (isVRMode && window.vrThumbstickSteering !== undefined) {
                steer = window.vrThumbstickSteering * turnSpeed * (velocity / maxSpeed);
            }
        }

        // Raycasting for ground detection and obstacles
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
            console.log("WARNING: No ground intersects found! Kart position:", kart.position.y.toFixed(2));
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

        // Apply movement
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

        checkCoinCollision();
    }

    // ============= ALL PHYSICS COMPLETE - NOW RENDER PHASE =============

    // Render the scene
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

window.addEventListener("resize", onWindowResize);
window.addEventListener("resize", debounce(onWindowResize, 200));

// Setup VR button and functionality - UPDATED FOR NEW APPROACH
function setupVRButton() {
    const vrToggle = document.getElementById('vr-toggle');

    vrToggle.addEventListener('click', () => {
        if (!isVRMode) {
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

        // Reset reference spaces following movingSpaces.md
        baseReferenceSpace = null;
        currentReferenceSpace = null;

        // Reset world container transform (cleanup from old approach)
        worldContainer.position.set(0, 0, 0);
        worldContainer.rotation.set(0, 0, 0);

        // Restore camera to kart in non-VR mode
        if (kart && camera.parent !== kart) {
            // Remove camera from scene and add back to kart
            scene.remove(camera);
            kart.add(camera);

            // Restore normal camera position relative to kart
            camera.position.set(0, 100, 200);
            camera.lookAt(0, 2, 0);
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

    // Function to handle when a VR session is started - FOLLOWING movingSpaces.md
    function onSessionStarted(session) {
        renderer.xr.setSession(session);
        isVRMode = true;
        vrToggle.textContent = 'Exit VR';

        // Initialize WebXR reference spaces following movingSpaces.md
        session.requestReferenceSpace('local').then((referenceSpace) => {
            baseReferenceSpace = referenceSpace;
            currentReferenceSpace = referenceSpace;
            console.log("VR reference space initialized following movingSpaces.md");
        }).catch((error) => {
            console.error("Failed to get reference space:", error);
        });

        if (kart) {
            // Remove camera from kart and add directly to scene
            kart.remove(camera);
            scene.add(camera);
            console.log("VR mode: XR reference space will follow kart (movingSpaces.md approach)");
        }

        // Hide UI elements in VR mode
        document.getElementById('game-overlay').style.display = 'none';
        document.getElementById('joystick-container').style.display = 'none';
        document.getElementById('steering-controls').style.display = 'none';

        setupVRControllers();
    }
}

// Function to check X button state on controllers
function checkXButtonState() {
    const session = renderer.xr.getSession();
    if (!session) return;

    let anyVRInputDetected = false;

    for (const source of session.inputSources) {
        if (source.gamepad && source.handedness === 'left') {
            // X button (index 4) for turning left
            const xButton = source.gamepad.buttons[4];
            // Y button (index 5) for turning right
            const yButton = source.gamepad.buttons[5];
            // Left trigger (index 0) for deceleration
            const leftTrigger = source.gamepad.buttons[0];

            if (xButton && xButton.pressed) {
                joystickState.left = true;
                anyVRInputDetected = true;
            } else {
                joystickState.left = false;
            }

            if (yButton && yButton.pressed) {
                joystickState.right = true;
                anyVRInputDetected = true;
            } else {
                joystickState.right = false;
            }

            if (leftTrigger && leftTrigger.pressed) {
                joystickState.down = true;
                anyVRInputDetected = true;
            } else {
                joystickState.down = false;
            }

            // Check left controller thumbstick
            if (source.gamepad.axes && source.gamepad.axes.length >= 2) {
                const leftStickX = source.gamepad.axes[0];
                const leftStickY = source.gamepad.axes[1];
                const deadzone = 0.1;

                if (Math.abs(leftStickY) > deadzone) {
                    anyVRInputDetected = true;
                    if (leftStickY < -deadzone) {
                        joystickState.up = true;
                    } else if (leftStickY > deadzone) {
                        joystickState.down = true;
                    }
                } else {
                    // Reset only if no other acceleration input is active
                    if (!joystickState.up) {
                        joystickState.up = false;
                    }
                }

                if (Math.abs(leftStickX) > deadzone) {
                    anyVRInputDetected = true;
                    if (leftStickX < -deadzone) {
                        joystickState.left = true;
                    } else if (leftStickX > deadzone) {
                        joystickState.right = true;
                    }
                }
            }
        }

        // Right controller
        if (source.gamepad && source.handedness === 'right') {
            // Right trigger for acceleration
            const possibleTriggerIndices = [0, 2, 3, 4];
            let triggerPressed = false;

            for (const idx of possibleTriggerIndices) {
                if (source.gamepad.buttons[idx] && source.gamepad.buttons[idx].pressed) {
                    triggerPressed = true;
                    joystickState.up = true;
                    anyVRInputDetected = true;
                    break;
                }
            }

            // Handle thumbstick inputs
            let rightStickX = 0, rightStickY = 0;
            let gamepadAxes = source.gamepad.axes;

            if (gamepadAxes && gamepadAxes.length >= 2) {
                if (gamepadAxes.length >= 4) {
                    rightStickX = gamepadAxes[2];
                    rightStickY = gamepadAxes[3];
                } else {
                    rightStickX = gamepadAxes[0];
                    rightStickY = gamepadAxes[1];
                }

                const deadzone = 0.1;
                const steeringMultiplier = 1.5;

                // Thumbstick Y-axis for acceleration/deceleration
                if (Math.abs(rightStickY) > deadzone) {
                    anyVRInputDetected = true;
                    if (rightStickY < -deadzone) {
                        joystickState.up = true;
                    } else if (rightStickY > deadzone) {
                        joystickState.down = true;
                    }
                }

                // Analog steering using thumbstick X-axis
                if (Math.abs(rightStickX) > deadzone) {
                    anyVRInputDetected = true;
                    window.vrThumbstickSteering = Math.max(-1, Math.min(1, -rightStickX * steeringMultiplier));
                    joystickState.left = rightStickX < 0;
                    joystickState.right = rightStickX > 0;
                } else {
                    window.vrThumbstickSteering = undefined;
                }
            }

            // Reset acceleration if no inputs are active
            if (!triggerPressed &&
                (!gamepadAxes || gamepadAxes.length < 2 || Math.abs(gamepadAxes[rightStickY < 0 ? 3 : 1]) <= 0.1)) {
                joystickState.up = false;
            }
        }
    }

    // Initialize audio and game when VR input is first detected (similar to keyboard/mobile)
    if (anyVRInputDetected && !audioSource && startTime === null) {
        console.log("VR input detected, initializing audio and game...");
        setupAudio();
        startTime = performance.now();
        leaderboardDiv.style.display = 'none';
        document.getElementById('game-logo').style.display = 'none';
    }
}

// Initialize VR controllers
function setupVRControllers() {
    console.log("Setting up VR controllers...");

    let controllerModelFactory;
    controllerModelFactory = new XRControllerModelFactory();
    console.log("Using XRControllerModelFactory for controller models");

    // Setup controllers
    for (let i = 0; i < 2; i++) {
        const controller = renderer.xr.getController(i);

        controller.addEventListener('connected', (event) => {
            console.log(`Controller ${i} connected, handedness: ${event.data.handedness}`);
            if (event.data.gamepad) {
                console.log(`Controller has gamepad with ${event.data.gamepad.buttons.length} buttons and ${event.data.gamepad.axes.length} axes`);
            }
            controller.userData.handedness = event.data.handedness;
            controller.userData.buttonCount = event.data.gamepad ? event.data.gamepad.buttons.length : 0;
        });

        controller.addEventListener('disconnected', () => {
            console.log(`Controller ${i} disconnected`);
        });

        controller.userData.index = i;

        scene.add(controller);
        vrControllers.push(controller);

        const controllerGrip = renderer.xr.getControllerGrip(i);
        controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
        scene.add(controllerGrip);
        controllerGrips.push(controllerGrip);
    }

    console.log("VR controllers initialized");
}

init();
onWindowResize(); 