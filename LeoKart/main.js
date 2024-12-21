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
const maxSpeed = 1.0; // Maximum speed
const friction = 0.005; // Friction when no input is given
const turnSpeed = 0.03; // Steering sensitivity
let direction = new THREE.Vector3(0, 0, -1); // Forward direction

// Initialize the game
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 1000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

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

// Load the track
function loadTrack() {
    const shape = new THREE.Shape();
    shape.moveTo(-50, -50);
    shape.lineTo(50, -50);
    shape.lineTo(50, 500);
    shape.lineTo(-50, 500);
    shape.lineTo(-50, -50); // Close the shape

    const extrudeSettings = { depth: 1, bevelEnabled: false };
    const trackGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 }); // Asphalt color
    track = new THREE.Mesh(trackGeometry, trackMaterial);

    track.rotation.x = -Math.PI / 2; // Lay track flat
    scene.add(track);
}

// Load models (kart, trees, boxes)
function loadModels() {
    const loader = new THREE.GLTFLoader();

    // Load Kart
    loader.load('assets/kart/scene.gltf', (gltf) => {
        kart = gltf.scene;
        kart.scale.set(0.5, 0.5, 0.5);
        kart.position.set(0, 0, 0);

        // Attach the camera to the kart
        kart.add(camera);
        camera.position.set(0, 100, 200); // Position camera behind and above the kart
        camera.lookAt(0, 2, 0);

        scene.add(kart);
    });

    // Load Trees
    loader.load('assets/tree/scene.gltf', (gltf) => {
        for (let i = 0; i < 5; i++) {
            const tree = gltf.scene.clone();
            tree.scale.set(0.8, 0.8, 0.8);
            tree.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 250);
            scene.add(tree);

            const treeBox = new THREE.Box3().setFromObject(tree);
            obstacleBoxes.push(treeBox);
        }
    });

    // Load Boxes
    loader.load('assets/box/box.gltf', (gltf) => {
        for (let i = 0; i < 3; i++) {
            const box = gltf.scene.clone();
            box.scale.set(0.3, 0.3, 0.3);
            box.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 250);
            scene.add(box);

            const boxBox = new THREE.Box3().setFromObject(box);
            obstacleBoxes.push(boxBox);
        }
    });
}

// Animation loop
function animate() {
    const delta = clock.getDelta();

    if (kart) {
        // Update velocity
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

        // Update kart position
        kart.position.addScaledVector(direction, velocity);
    }

    // Render the scene
    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

// Resize the renderer when the window is resized
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the game
init();