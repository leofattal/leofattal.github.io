import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer;
let tank, turret, barrel;
let bullets = [];
let obstacles = [];
let backviewCamera;
let currentCamera = 'main';
let lights = {};
let tankModel, tankGroup;

let keys = {};

init();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87CEEB, 100, 300); // Sky blue fog for atmosphere

  // Main Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 30);
  camera.lookAt(0, 0, 0);

  // Backview Camera
  backviewCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Renderer with enhanced settings
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  document.body.appendChild(renderer.domElement);

  createLighting();
  createBattlefield();
  createObstacles();
  createAtmosphere();
  loadTankModel();

  // Camera follow variables
  window.cameraOffset = new THREE.Vector3(0, 20, 30);

  // Event listeners
  window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  window.addEventListener('mousemove', rotateTurret);
  window.addEventListener('keydown', shootBullet);
  window.addEventListener('keydown', switchCamera);
  window.addEventListener('resize', onWindowResize);

  // Start render loop
  renderer.setAnimationLoop(animate);
}

function loadTankModel() {
  const loader = new GLTFLoader();
  
  loader.load(
    't-72b3_main_battle_tank/scene.gltf',
    function (gltf) {
      tankModel = gltf.scene;
      
      // Scale and position the tank model
      tankModel.scale.set(0.5, 0.5, 0.5);
      tankModel.position.y = 0;
      
      // Enable shadows for all meshes in the model
      tankModel.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Create a group to hold the tank and make it easier to control
      tankGroup = new THREE.Group();
      tankGroup.add(tankModel);
      tankGroup.rotation.y = Math.PI / 2; // Rotate to face forward
      
      // Find the turret and barrel in the model
      findTankComponents(tankModel);
      
      scene.add(tankGroup);
      tank = tankGroup; // Set the tank reference
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error('An error happened loading the tank model:', error);
      // Fallback to basic tank if model fails to load
      createBasicTank();
    }
  );
}

function findTankComponents(model) {
  // Look for turret and barrel components in the model
  model.traverse(function (child) {
    if (child.isMesh) {
      // Try to identify turret and barrel by name or position
      const name = child.name.toLowerCase();
      if (name.includes('turret') || name.includes('tower')) {
        turret = child;
        console.log('Found turret:', child.name);
      }
      if (name.includes('barrel') || name.includes('gun') || name.includes('cannon')) {
        barrel = child;
        console.log('Found barrel:', child.name);
      }
    }
  });
  
  // If we can't find specific components, use the main model
  if (!turret) {
    turret = model;
  }
  if (!barrel) {
    // Create a simple barrel reference at the front of the model
    barrel = new THREE.Object3D();
    barrel.position.set(2, 1, 0);
    model.add(barrel);
  }
}

function createBasicTank() {
  // Fallback basic tank if model loading fails
  tank = new THREE.Group();
  tank.rotation.y = Math.PI / 2;
  scene.add(tank);

  const bodyGeometry = new THREE.BoxGeometry(4.5, 1.2, 3);
  const bodyMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x2d5016,
    roughness: 0.8,
    metalness: 0.2
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  body.castShadow = true;
  body.receiveShadow = true;
  tank.add(body);

  const turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
  const turretMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x2d5016,
    roughness: 0.6,
    metalness: 0.4
  });
  turret = new THREE.Mesh(turretGeometry, turretMaterial);
  turret.position.y = 1.8;
  turret.castShadow = true;
  turret.receiveShadow = true;
  body.add(turret);

  const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
  const barrelMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.8
  });
  barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(2, 1.8, 0);
  barrel.castShadow = true;
  turret.add(barrel);
}

function createLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // Bright directional sunlight
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
  directionalLight.position.set(100, 150, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 800;
  directionalLight.shadow.camera.left = -200;
  directionalLight.shadow.camera.right = 200;
  directionalLight.shadow.camera.top = 200;
  directionalLight.shadow.camera.bottom = -200;
  scene.add(directionalLight);
  lights.directional = directionalLight;

  // Additional fill light
  const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.5);
  fillLight.position.set(-50, 100, -50);
  scene.add(fillLight);

  // Point light for tank illumination
  const tankLight = new THREE.PointLight(0xffaa00, 0.6, 30);
  tankLight.position.set(0, 8, 0);
  tankLight.castShadow = true;
  scene.add(tankLight);
  lights.tank = tankLight;
}

function createBattlefield() {
  // Expanded terrain with hills
  const terrainGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
  const terrainMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x3a5f3a,
    side: THREE.DoubleSide
  });
  
  // Add more dramatic height variation for hills
  const vertices = terrainGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    // Create multiple hills with different frequencies
    vertices[i + 1] = 
      Math.sin(x * 0.01) * Math.cos(z * 0.01) * 8 +
      Math.sin(x * 0.03) * Math.cos(z * 0.03) * 4 +
      Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
  }
  terrainGeometry.attributes.position.needsUpdate = true;
  terrainGeometry.computeVertexNormals();

  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Expanded battlefield boundaries
  const wallGeometry = new THREE.BoxGeometry(200, 10, 3);
  const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.1
  });

  // North wall
  const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
  northWall.position.set(0, 5, -100);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  scene.add(northWall);

  // South wall
  const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
  southWall.position.set(0, 5, 100);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  scene.add(southWall);

  // East wall
  const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
  eastWall.rotation.y = Math.PI / 2;
  eastWall.position.set(100, 5, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  scene.add(eastWall);

  // West wall
  const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
  westWall.rotation.y = Math.PI / 2;
  westWall.position.set(-100, 5, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  scene.add(westWall);

  // Add more grass patches across the expanded area
  for (let i = 0; i < 50; i++) {
    const grassGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 4);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.set(
      (Math.random() - 0.5) * 180,
      0.25,
      (Math.random() - 0.5) * 180
    );
    grass.castShadow = true;
    scene.add(grass);
  }

  // Add some trees for atmosphere
  for (let i = 0; i < 15; i++) {
    const treeTrunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2f1b });
    const treeTrunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
    
    const treeLeavesGeometry = new THREE.SphereGeometry(2, 8, 6);
    const treeLeavesMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const treeLeaves = new THREE.Mesh(treeLeavesGeometry, treeLeavesMaterial);
    treeLeaves.position.y = 3;
    
    const tree = new THREE.Group();
    tree.add(treeTrunk);
    tree.add(treeLeaves);
    
    tree.position.set(
      (Math.random() - 0.5) * 160,
      2,
      (Math.random() - 0.5) * 160
    );
    tree.castShadow = true;
    tree.receiveShadow = true;
    scene.add(tree);
  }
}

function createObstacles() {
  const obstaclePositions = [
    { x: 25, z: 25, scale: 4, type: 'building' },
    { x: -30, z: 15, scale: 3, type: 'bunker' },
    { x: 20, z: -35, scale: 5, type: 'building' },
    { x: -40, z: -20, scale: 3.5, type: 'bunker' },
    { x: 50, z: 30, scale: 4.5, type: 'building' },
    { x: -50, z: 40, scale: 3.8, type: 'bunker' },
    { x: 60, z: -50, scale: 6, type: 'building' },
    { x: -60, z: -60, scale: 4.2, type: 'building' },
    { x: 35, z: 60, scale: 3.5, type: 'bunker' },
    { x: -35, z: -40, scale: 4, type: 'building' },
    { x: 45, z: -30, scale: 3.2, type: 'bunker' },
    { x: -45, z: 50, scale: 4.8, type: 'building' }
  ];

  obstaclePositions.forEach(pos => {
    let obstacle;
    
    if (pos.type === 'building') {
      // Create building-like obstacle
      const buildingGeometry = new THREE.BoxGeometry(pos.scale, pos.scale * 2, pos.scale);
      const buildingMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x696969,
        roughness: 0.7,
        metalness: 0.1
      });
      obstacle = new THREE.Mesh(buildingGeometry, buildingMaterial);
      
      // Add windows
      const windowGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.1);
      const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
      
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          const window = new THREE.Mesh(windowGeometry, windowMaterial);
          window.position.set(
            (i - 1) * pos.scale * 0.3,
            j * pos.scale * 0.8 + 0.5,
            pos.scale * 0.6
          );
          obstacle.add(window);
        }
      }
    } else {
      // Create bunker-like obstacle
      const bunkerGeometry = new THREE.CylinderGeometry(pos.scale * 0.8, pos.scale, pos.scale * 1.5, 8);
      const bunkerMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4a4a4a,
        roughness: 0.8,
        metalness: 0.2
      });
      obstacle = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    }

    obstacle.position.set(pos.x, pos.scale, pos.z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    obstacle.userData = { 
      type: 'obstacle',
      width: pos.scale,
      height: pos.scale * 2,
      depth: pos.scale
    };
    obstacles.push(obstacle);
    scene.add(obstacle);
  });
}

function createAtmosphere() {
  // Add more dust particles in the air
  const particleCount = 200;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 400;
    particlePositions[i + 1] = Math.random() * 30;
    particlePositions[i + 2] = (Math.random() - 0.5) * 400;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 0.8,
    transparent: true,
    opacity: 0.4
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
}

function switchCamera(event) {
  if (event.code === 'KeyC') {
    currentCamera = currentCamera === 'main' ? 'backview' : 'main';
  }
}

function handleMovement() {
  if (!tank) return; // Wait for tank to load
  
  const speed = 0.08;

  // Calculate new position
  let newX = tank.position.x;
  let newZ = tank.position.z;

  // Forward/backward movement (tank always moves in the direction it's facing)
  if (keys['w'] || keys['arrowup']) {
    newX += Math.cos(tank.rotation.y) * speed;
    newZ += Math.sin(tank.rotation.y) * speed;
  }
  if (keys['s'] || keys['arrowdown']) {
    newX -= Math.cos(tank.rotation.y) * speed;
    newZ -= Math.sin(tank.rotation.y) * speed;
  }

  // Tank rotation is now controlled by mouse cursor
  // (removed A/D rotation controls)

  // Check collision with obstacles
  if (!checkTankCollision(newX, newZ)) {
    tank.position.x = newX;
    tank.position.z = newZ;
  }

  // Keep tank within expanded battlefield boundaries
  tank.position.x = Math.max(-90, Math.min(90, tank.position.x));
  tank.position.z = Math.max(-90, Math.min(90, tank.position.z));

  // Update tank light position
  if (lights.tank) {
    lights.tank.position.copy(tank.position);
    lights.tank.position.y += 8;
  }
}

function checkTankCollision(x, z) {
  if (!tank) return false;
  
  const tankRadius = 3; // Larger radius for realistic tank
  
  for (const obstacle of obstacles) {
    const dx = x - obstacle.position.x;
    const dz = z - obstacle.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    const minDistance = tankRadius + obstacle.userData.width / 2;
    
    if (distance < minDistance) {
      return true; // Collision detected
    }
  }
  return false;
}

function rotateTurret(event) {
  if (!tank) return; // Wait for tank to load
  
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Calculate angle based on mouse position
  const angle = Math.atan2(mouseX, mouseY);
  
  // Rotate the entire tank to face the cursor direction
  tank.rotation.y = angle;
}

function animate() {
  handleMovement();
  updateBullets();
  updateCameras();

  renderer.render(scene, currentCamera === 'main' ? camera : backviewCamera);
}

function updateCameras() {
  if (!tank) return; // Wait for tank to load
  
  // Prevent camera from going below ground or inside tank
  const minCameraHeight = 5;
  if (camera.position.y < minCameraHeight) {
    camera.position.y = minCameraHeight;
  }
  
  // Main camera follows the tank
  if (typeof window.cameraOffset !== 'undefined') {
    const offset = window.cameraOffset.clone().applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      tank.rotation.y
    );
    camera.position.copy(tank.position).add(offset);
    camera.lookAt(tank.position);
  }

  // Backview camera (behind and above the tank)
  const backviewOffset = new THREE.Vector3(0, 15, -15);
  const backviewPos = backviewOffset.clone().applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    tank.rotation.y
  );
  backviewCamera.position.copy(tank.position).add(backviewPos);
  backviewCamera.lookAt(tank.position);
}

function shootBullet(event) {
  if (event.code !== 'Space' || !tank) return;

  // Create a more realistic bullet
  const bullet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
    new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      metalness: 0.8,
      roughness: 0.2
    })
  );
  
  // Rotate bullet to point forward
  bullet.rotation.x = Math.PI / 2;

  // Get the world position of the tank hull front
  const hullFront = new THREE.Vector3(1.5, 0.8, 0);
  hullFront.applyMatrix4(tank.matrixWorld);
  bullet.position.copy(hullFront);

  // Calculate direction based on tank rotation
  const tankRotation = tank.rotation.y;
  
  const dir = new THREE.Vector3(
    Math.cos(tankRotation),
    0,
    Math.sin(tankRotation)
  );
  bullet.userData.velocity = dir.multiplyScalar(1.2); // Faster bullets
  bullet.userData.life = 150; // Longer bullet life
  bullet.castShadow = true;

  scene.add(bullet);
  bullets.push(bullet);

  // Add realistic muzzle flash effect
  createMuzzleFlash(hullFront, tankRotation);

  // Add shell casing effect
  createShellCasing(hullFront, tankRotation);
}

function createMuzzleFlash(position, rotation) {
  // Create a more realistic muzzle flash
  const flashGroup = new THREE.Group();
  
  // Main flash
  const flashGeometry = new THREE.SphereGeometry(0.4);
  const flashMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffaa00,
    transparent: true,
    opacity: 0.9
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.copy(position);
  flashGroup.add(flash);
  
  // Secondary flash particles
  for (let i = 0; i < 8; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.1);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff4400,
      transparent: true,
      opacity: 0.8
    });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position particles around the flash
    const angle = (i / 8) * Math.PI * 2;
    const radius = 0.3;
    particle.position.set(
      position.x + Math.cos(angle) * radius,
      position.y + Math.random() * 0.2,
      position.z + Math.sin(angle) * radius
    );
    
    flashGroup.add(particle);
  }
  
  scene.add(flashGroup);
  
  // Animate and remove flash
  let opacity = 1;
  const fadeOut = () => {
    opacity -= 0.1;
    flashGroup.children.forEach(child => {
      if (child.material) {
        child.material.opacity = opacity;
      }
    });
    
    if (opacity > 0) {
      requestAnimationFrame(fadeOut);
    } else {
      scene.remove(flashGroup);
    }
  };
  
  setTimeout(fadeOut, 50);
}

function createShellCasing(position, rotation) {
  // Create a shell casing that ejects from the tank
  const casingGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
  const casingMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x8B4513,
    metalness: 0.9,
    roughness: 0.1
  });
  const casing = new THREE.Mesh(casingGeometry, casingMaterial);
  
  // Position casing at ejection point
  const ejectionPoint = new THREE.Vector3(
    position.x - Math.cos(rotation) * 0.5,
    position.y + 0.3,
    position.z - Math.sin(rotation) * 0.5
  );
  casing.position.copy(ejectionPoint);
  
  // Add physics to casing
  casing.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.3,
    Math.random() * 0.5 + 0.2,
    (Math.random() - 0.5) * 0.3
  );
  casing.userData.angularVelocity = new THREE.Vector3(
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 10
  );
  casing.userData.life = 60;
  
  scene.add(casing);
  
  // Animate casing
  const animateCasing = () => {
    casing.position.add(casing.userData.velocity);
    casing.rotation.x += casing.userData.angularVelocity.x * 0.01;
    casing.rotation.y += casing.userData.angularVelocity.y * 0.01;
    casing.rotation.z += casing.userData.angularVelocity.z * 0.01;
    
    casing.userData.velocity.y -= 0.02; // Gravity
    casing.userData.life--;
    
    if (casing.userData.life > 0) {
      requestAnimationFrame(animateCasing);
    } else {
      scene.remove(casing);
    }
  };
  
  animateCasing();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Update bullet life
    bullet.userData.life--;
    
    // Remove bullet if life expired
    if (bullet.userData.life <= 0) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    // Update bullet position
    bullet.position.add(bullet.userData.velocity);

    // Add bullet trail effect
    createBulletTrail(bullet.position);

    // Check collision with obstacles
    for (const obstacle of obstacles) {
      const dx = bullet.position.x - obstacle.position.x;
      const dy = bullet.position.y - obstacle.position.y;
      const dz = bullet.position.z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (distance < obstacle.userData.width / 2 + 0.2) {
        // Bullet hit obstacle - create explosion effect
        createExplosion(bullet.position);
        scene.remove(bullet);
        bullets.splice(i, 1);
        break;
      }
    }

    // Check if bullet is out of bounds (expanded area)
    if (Math.abs(bullet.position.x) > 100 || Math.abs(bullet.position.z) > 100) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
}

function createBulletTrail(position) {
  // Create bullet trail particles
  const trailGeometry = new THREE.BufferGeometry();
  const trailPositions = new Float32Array(3);
  trailPositions[0] = position.x;
  trailPositions[1] = position.y;
  trailPositions[2] = position.z;
  
  trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
  
  const trailMaterial = new THREE.PointsMaterial({
    color: 0xffaa00,
    size: 0.1,
    transparent: true,
    opacity: 0.6
  });
  
  const trail = new THREE.Points(trailGeometry, trailMaterial);
  scene.add(trail);
  
  // Remove trail after short time
  setTimeout(() => {
    scene.remove(trail);
  }, 100);
}

function createExplosion(position) {
  // Create more realistic explosion particles
  const particleCount = 30;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = [];
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = position.x;
    particlePositions[i + 1] = position.y;
    particlePositions[i + 2] = position.z;
    
    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.4,
      y: Math.random() * 0.6,
      z: (Math.random() - 0.5) * 0.4,
      life: 40,
      color: Math.random() > 0.5 ? 0xff4400 : 0xffaa00
    });
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff4400,
    size: 0.4,
    transparent: true,
    opacity: 1
  });
  
  const explosion = new THREE.Points(particleGeometry, particleMaterial);
  explosion.userData = { velocities: particleVelocities };
  scene.add(explosion);
  
  // Animate explosion
  const animateExplosion = () => {
    const positions = explosion.geometry.attributes.position.array;
    const velocities = explosion.userData.velocities;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      positions[idx] += velocities[i].x;
      positions[idx + 1] += velocities[i].y;
      positions[idx + 2] += velocities[i].z;
      
      velocities[i].y -= 0.015; // Gravity
      velocities[i].life--;
    }
    
    explosion.geometry.attributes.position.needsUpdate = true;
    explosion.material.opacity = velocities[0].life / 40;
    
    if (velocities[0].life > 0) {
      requestAnimationFrame(animateExplosion);
    } else {
      scene.remove(explosion);
    }
  };
  
  animateExplosion();
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  backviewCamera.aspect = aspect;
  backviewCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}