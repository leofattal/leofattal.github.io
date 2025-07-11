import * as THREE from 'three';

let scene, camera, renderer;
let pirateShip, marineShips = [];
let cannonballs = [];

init();
animate();

function init() {
    // Set up the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add a pirate ship
    const geometry = new THREE.BoxGeometry(1, 1, 3);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    pirateShip = new THREE.Mesh(geometry, material);
    scene.add(pirateShip);

    // Add marine ships
    for (let i = 0; i < 5; i++) {
        const marineShip = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        marineShip.position.set(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
        marineShips.push(marineShip);
        scene.add(marineShip);
    }

    camera.position.z = 5;

    // Add event listener for shooting
    window.addEventListener('keydown', onKeyDown);
}

function animate() {
    requestAnimationFrame(animate);

    // Update pirate ship position
    if (keys['ArrowUp']) pirateShip.position.z -= 0.1;
    if (keys['ArrowDown']) pirateShip.position.z += 0.1;
    if (keys['ArrowLeft']) pirateShip.position.x -= 0.1;
    if (keys['ArrowRight']) pirateShip.position.x += 0.1;

    // Update cannonballs
    cannonballs.forEach((cannonball, index) => {
        cannonball.position.z -= 0.2;
        if (cannonball.position.z < -10) {
            scene.remove(cannonball);
            cannonballs.splice(index, 1);
        }
    });

    renderer.render(scene, camera);
}

let keys = {};
window.addEventListener('keydown', (event) => keys[event.key] = true);
window.addEventListener('keyup', (event) => keys[event.key] = false);

function onKeyDown(event) {
    if (event.key === ' ') {
        shoot();
    }
}

function shoot() {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const cannonball = new THREE.Mesh(geometry, material);
    cannonball.position.set(pirateShip.position.x, pirateShip.position.y, pirateShip.position.z);
    cannonballs.push(cannonball);
    scene.add(cannonball);
}
