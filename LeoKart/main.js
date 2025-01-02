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
let startTime = null, finishTime = null;
let isAccelerating = false, startX = 0, currentX = 0;
let velocity = 0, verticalVelocity = 0;
const acceleration = 0.02, deceleration = 0.01, maxSpeed = 3.5, friction = 0.005, turnSpeed = 0.03, gravity = -2;
let direction = new THREE.Vector3(0, 0, -1), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
let isOnGround = true, steer = 0, obstacleNormal = null, isLanding = false, oldZ = 0;
let donutAngularVelocity = 0.05, gameOver = false;
let audioContext = null, audioBuffer = null, audioSource = null, gainNode = null;
let finishSound = new Audio('assets/finish-sound.mp3');
finishSound.volume = 0.5;

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
        return '--'; // Return default if user ID is not available
    }

    try {
        // Query the database for the best time of the current user for the given track
        const { data, error } = await supabase
            .from('track_times')
            .select('best_time')
            .eq('user_id', userId)
            .eq('track_id', trackId)
            .single(); // Expect a single row

        if (error) {
            if (error.code === 'PGRST116') {
                // No best time found
                return '--';
            }
            console.error('Error fetching best time from database:', error);
            return '--';
        }

        // Return the best time if found
        return data.best_time.toFixed(2);
    } catch (err) {
        console.error('Unexpected error fetching best time:', err);
        return '--';
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
    const bestTime = await getBestTime(trackId);
    document.getElementById('best-time').textContent = `Best: ${bestTime}`;
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

function setupTouchControls() {
    document.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        startX = touch.clientX;
        currentX = touch.clientX;
        isAccelerating = true;
    });

    document.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        currentX = touch.clientX;
        const deltaX = currentX - startX;
        if (deltaX < -5 && velocity !== 0) kart.rotateY(turnSpeed * (velocity / maxSpeed));
        if (deltaX > 5 && velocity !== 0) kart.rotateY(-turnSpeed * (velocity / maxSpeed));
        startX = currentX;
    });

    document.addEventListener('touchend', () => isAccelerating = false);
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

    // Initialize the track
    initializeTrack();
    loadModels();
    loadKartSound();
    timerDiv = createDisplay(timerDiv, { position: 'absolute', top: '10px', right: '10px', color: 'white', fontStyle: 'italic', fontSize: '2rem', zIndex: '100' }, 'Time: 0.00s');
    finishDiv = createDisplay(finishDiv, { position: 'absolute', top: '40px', right: '10px', color: 'red', fontStyle: 'italic', fontSize: '2rem', zIndex: '100' }, '  --  ');

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', e => keyboard[e.key] = true);
    document.addEventListener('keyup', e => keyboard[e.key] = false);
    setupTouchControls();
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
        const offset = direction.clone().normalize().multiplyScalar(200); // Scale direction vector to 200 units
        coin.position.copy(kart.position.clone().add(offset)); // Add offset to kart's position
        coin.position.y = kart.position.y + 20; // Adjust the height if needed (10 units above kart's height)
        scene.add(coin);
        obstacleBoxes.push(new THREE.Box3().setFromObject(coin));
    });
}

function getSignedAngle(u, v, axis) {
    u.normalize();
    v.normalize();
    const dot = Math.max(-1, Math.min(1, u.dot(v)));
    const angle = Math.acos(dot);
    const cross = new THREE.Vector3().crossVectors(u, v);
    return angle * Math.sign(cross.dot(axis));
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
        if ((keyboard['ArrowUp'] || isAccelerating) && isOnGround) velocity = Math.min(velocity + acceleration * delta / .008, maxSpeed);
        if (keyboard['ArrowDown'] && isOnGround) velocity = Math.max(velocity - acceleration * delta / .008, -maxSpeed / 2);
        if (!keyboard['ArrowUp'] && !keyboard['ArrowDown'] && !isAccelerating && isOnGround) {
            if (velocity > 0) velocity = Math.max(velocity - friction * delta / .008, 0);
            if (velocity < 0) velocity = Math.min(velocity + friction * delta / .008, 0);
        }

        steer = 0;
        if (keyboard['ArrowLeft'] && velocity !== 0 && isOnGround) steer = turnSpeed * (velocity / maxSpeed);
        if (keyboard['ArrowRight'] && velocity !== 0 && isOnGround) steer = -turnSpeed * (velocity / maxSpeed);

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
