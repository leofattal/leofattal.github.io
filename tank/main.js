import * as THREE from 'three';

let scene, camera, renderer;
let tank, turret;
let bullets = [];

let keys = {};

init();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 15);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x444444 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Tank base
  tank = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 3),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  tank.position.y = 0.5;
  scene.add(tank);

  // Turret
  turret = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.5, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x008800 })
  );
  turret.position.y = 0.6;
  turret.position.z = -0.2;
  tank.add(turret);

  // Event listeners
  window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('mousemove', rotateTurret);
  window.addEventListener('keydown', shootBullet);
  window.addEventListener('resize', onWindowResize);

  // Start render loop
  renderer.setAnimationLoop(animate);
}

function animate() {
  handleMovement();
  updateBullets();
  camera.lookAt(tank.position); // Keep camera looking at tank
  renderer.render(scene, camera);
}

function handleMovement() {
  if (keys['w']) tank.translateZ(-0.1);
  if (keys['s']) tank.translateZ(0.1);
  if (keys['a']) tank.rotation.y += 0.03;
  if (keys['d']) tank.rotation.y -= 0.03;
}

function rotateTurret(event) {
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  turret.rotation.y = mouseX * Math.PI / 2;
}

function shootBullet(event) {
  if (event.code !== 'Space') return;

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );

  const worldPos = new THREE.Vector3();
  turret.getWorldPosition(worldPos);
  bullet.position.copy(worldPos);

  const dir = new THREE.Vector3(
    -Math.sin(tank.rotation.y + turret.rotation.y),
    0,
    -Math.cos(tank.rotation.y + turret.rotation.y)
  );
  bullet.userData.velocity = dir.multiplyScalar(0.5);

  scene.add(bullet);
  bullets.push(bullet);
}

function updateBullets() {
  bullets.forEach(bullet => {
    bullet.position.add(bullet.userData.velocity);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}