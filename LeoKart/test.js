const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });

// Renderer
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Variables
let kart;
const loader = new THREE.GLTFLoader();

// Camera
camera.position.set(0, 100, 200); // Position camera behind and above the kart
camera.lookAt(0, 2, 0);

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

// Load Kart
loader.load('assets/kart/scene.gltf', (gltf) => {
    kart = gltf.scene;
    kart.scale.set(0.5, 0.5, 0.5);
    kart.position.set(0, 0, 0); // Set the kart's initial position
    scene.add(kart);
});

// Key input handling
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Update function
function animate() {
    requestAnimationFrame(animate);

    if (kart) {
        if (keys['ArrowUp']) {
            // Rotate around local X axis (pitch)
            kart.rotateX(0.02);
        }
        if (keys['ArrowDown']) {
            // Rotate around local X axis (pitch)
            kart.rotateX(-0.02);
        }
        if (keys['ArrowLeft']) {
            // Rotate around local Y axis (yaw)
            kart.rotateY(0.02);
        }
        if (keys['ArrowRight']) {
            // Rotate around local Y axis (yaw)
            kart.rotateY(-0.02);
        }
        if (keys['[']) {
            // Rotate around local Z axis (roll)
            kart.rotateZ(0.02);
        }
        if (keys[']']) {
            // Rotate around local Z axis (roll)
            kart.rotateZ(-0.02);
        }
    }


    renderer.render(scene, camera);
}

animate();