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

  // Add shadows for realism
  renderer.shadowMap.enabled = true;

  // Tank wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const wheelPositions = [
    [-0.8, 0.2, -1.1],
    [0.8, 0.2, -1.1],
    [-0.8, 0.2, -0.3],
    [0.8, 0.2, -0.3],
    [-0.8, 0.2, 0.5],
    [0.8, 0.2, 0.5],
  ];
  // Create tank base before adding wheels
  tank = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 3),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  tank.position.y = 0.5;
  scene.add(tank);

  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    tank.add(wheel);
  }

  // Tank hull (sticks out the body)
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.7, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x007700 })
  );
  hull.position.y = 0.7;
  hull.position.z = 0.6;
  tank.add(hull);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Camera follow variables
  window.cameraOffset = new THREE.Vector3(0, 10, 15);
  // Turret
  turret = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.5, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x008800 })
  );
  turret.position.y = 0.6; // Place on top of hull
  turret.position.z = 0.85; // Offset turret to stick out from the front of the hull
  hull.add(turret); // Attach turret to hull

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x444444 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

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
  // Prevent camera from going below ground or inside tank
  const minCameraHeight = 2;
  if (camera.position.y < minCameraHeight) {
    camera.position.y = minCameraHeight;
  }
  // Camera follows the tank
  if (typeof cameraOffset !== 'undefined') {
    const offset = cameraOffset.clone().applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      tank.rotation.y
    );
    camera.position.copy(tank.position).add(offset);
    camera.lookAt(tank.position);
  }

  renderer.render(scene, camera);
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