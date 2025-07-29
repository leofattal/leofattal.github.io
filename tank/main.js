import * as THREE from 'three';

let scene, camera, renderer;
let tank, turret, barrel;
let bullets = [];
let obstacles = [];
let backviewCamera;
let currentCamera = 'main';
let lights = {};

let keys = {};

init();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87CEEB, 50, 200); // Sky blue fog for atmosphere

  // Main Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 15, 20);
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
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);

  createLighting();
  createTank();
  createBattlefield();
  createObstacles();
  createAtmosphere();

  // Camera follow variables
  window.cameraOffset = new THREE.Vector3(0, 15, 20);

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

function createLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);
  lights.directional = directionalLight;

  // Point light for tank illumination
  const tankLight = new THREE.PointLight(0xffaa00, 0.8, 20);
  tankLight.position.set(0, 5, 0);
  tankLight.castShadow = true;
  scene.add(tankLight);
  lights.tank = tankLight;
}

function createTank() {
  tank = new THREE.Group();
  scene.add(tank);

  // Tank body (main hull)
  const bodyGeometry = new THREE.BoxGeometry(3, 1.2, 4.5);
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

  // Tank tracks
  const trackGeometry = new THREE.BoxGeometry(3.2, 0.8, 4.8);
  const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  
  const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  leftTrack.position.set(-1.8, 0.4, 0);
  leftTrack.castShadow = true;
  leftTrack.receiveShadow = true;
  tank.add(leftTrack);

  const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  rightTrack.position.set(1.8, 0.4, 0);
  rightTrack.castShadow = true;
  rightTrack.receiveShadow = true;
  tank.add(rightTrack);

  // Track wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
  const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
  
  for (let i = 0; i < 6; i++) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-1.8, 0.4, -1.5 + i * 0.6);
    wheel.castShadow = true;
    tank.add(wheel);
  }
  
  for (let i = 0; i < 6; i++) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(1.8, 0.4, -1.5 + i * 0.6);
    wheel.castShadow = true;
    tank.add(wheel);
  }

  // Tank turret base
  const turretBaseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8);
  const turretBaseMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1e3a1e,
    roughness: 0.7,
    metalness: 0.3
  });
  const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
  turretBase.position.y = 1.2;
  turretBase.castShadow = true;
  turretBase.receiveShadow = true;
  tank.add(turretBase);

  // Turret
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
  tank.add(turret);

  // Main gun barrel
  const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
  const barrelMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.8
  });
  barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 1.8, 2);
  barrel.castShadow = true;
  turret.add(barrel);

  // Tank details - hatches
  const hatchGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
  const hatchMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  
  const frontHatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
  frontHatch.position.set(0, 1.9, 0.5);
  turret.add(frontHatch);

  const rearHatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
  rearHatch.position.set(0, 1.9, -0.5);
  turret.add(rearHatch);

  // Tank details - side skirts
  const skirtGeometry = new THREE.BoxGeometry(0.1, 0.6, 4);
  const skirtMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  
  const leftSkirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
  leftSkirt.position.set(-1.6, 0.3, 0);
  leftSkirt.castShadow = true;
  tank.add(leftSkirt);

  const rightSkirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
  rightSkirt.position.set(1.6, 0.3, 0);
  rightSkirt.castShadow = true;
  tank.add(rightSkirt);
}

function createBattlefield() {
  // Terrain with height variation
  const terrainGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
  const terrainMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x3a5f3a,
    side: THREE.DoubleSide
  });
  
  // Add height variation to terrain
  const vertices = terrainGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    vertices[i + 1] = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 2;
  }
  terrainGeometry.attributes.position.needsUpdate = true;
  terrainGeometry.computeVertexNormals();

  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Battlefield boundaries with realistic walls
  const wallGeometry = new THREE.BoxGeometry(100, 8, 2);
  const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x4a4a4a,
    roughness: 0.8,
    metalness: 0.1
  });

  // North wall
  const northWall = new THREE.Mesh(wallGeometry, wallMaterial);
  northWall.position.set(0, 4, -50);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  scene.add(northWall);

  // South wall
  const southWall = new THREE.Mesh(wallGeometry, wallMaterial);
  southWall.position.set(0, 4, 50);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  scene.add(southWall);

  // East wall
  const eastWall = new THREE.Mesh(wallGeometry, wallMaterial);
  eastWall.rotation.y = Math.PI / 2;
  eastWall.position.set(50, 4, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  scene.add(eastWall);

  // West wall
  const westWall = new THREE.Mesh(wallGeometry, wallMaterial);
  westWall.rotation.y = Math.PI / 2;
  westWall.position.set(-50, 4, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  scene.add(westWall);

  // Add some grass patches
  for (let i = 0; i < 20; i++) {
    const grassGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 4);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.position.set(
      (Math.random() - 0.5) * 80,
      0.25,
      (Math.random() - 0.5) * 80
    );
    grass.castShadow = true;
    scene.add(grass);
  }
}

function createObstacles() {
  const obstaclePositions = [
    { x: 15, z: 15, scale: 3, type: 'building' },
    { x: -20, z: 10, scale: 2.5, type: 'bunker' },
    { x: 12, z: -18, scale: 4, type: 'building' },
    { x: -25, z: -12, scale: 2, type: 'bunker' },
    { x: 30, z: 20, scale: 3.5, type: 'building' },
    { x: -30, z: 25, scale: 2.8, type: 'bunker' },
    { x: 35, z: -30, scale: 4.5, type: 'building' },
    { x: -35, z: -35, scale: 3.2, type: 'building' }
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
  // Add some dust particles in the air
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 200;
    particlePositions[i + 1] = Math.random() * 20;
    particlePositions[i + 2] = (Math.random() - 0.5) * 200;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 0.5,
    transparent: true,
    opacity: 0.3
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
  const speed = 0.08;
  const rotationSpeed = 0.025;

  // Calculate new position
  let newX = tank.position.x;
  let newZ = tank.position.z;
  let newRotation = tank.rotation.y;

  // Forward/backward movement
  if (keys['w'] || keys['arrowup']) {
    newX += Math.sin(tank.rotation.y) * speed;
    newZ += Math.cos(tank.rotation.y) * speed;
  }
  if (keys['s'] || keys['arrowdown']) {
    newX -= Math.sin(tank.rotation.y) * speed;
    newZ -= Math.cos(tank.rotation.y) * speed;
  }

  // Left/right rotation
  if (keys['a'] || keys['arrowleft']) {
    newRotation += rotationSpeed;
  }
  if (keys['d'] || keys['arrowright']) {
    newRotation -= rotationSpeed;
  }

  // Check collision with obstacles
  if (!checkTankCollision(newX, newZ)) {
    tank.position.x = newX;
    tank.position.z = newZ;
    tank.rotation.y = newRotation;
  }

  // Keep tank within battlefield boundaries
  tank.position.x = Math.max(-45, Math.min(45, tank.position.x));
  tank.position.z = Math.max(-45, Math.min(45, tank.position.z));

  // Update tank light position
  if (lights.tank) {
    lights.tank.position.copy(tank.position);
    lights.tank.position.y += 5;
  }
}

function checkTankCollision(x, z) {
  const tankRadius = 2.5; // Larger radius for realistic tank
  
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
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Calculate angle based on mouse position
  const angle = Math.atan2(mouseX, mouseY);
  turret.rotation.y = angle;
}

function animate() {
  handleMovement();
  updateBullets();
  updateCameras();

  renderer.render(scene, currentCamera === 'main' ? camera : backviewCamera);
}

function updateCameras() {
  // Prevent camera from going below ground or inside tank
  const minCameraHeight = 3;
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
  const backviewOffset = new THREE.Vector3(0, 12, -12);
  const backviewPos = backviewOffset.clone().applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    tank.rotation.y
  );
  backviewCamera.position.copy(tank.position).add(backviewPos);
  backviewCamera.lookAt(tank.position);
}

function shootBullet(event) {
  if (event.code !== 'Space') return;

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.15),
    new THREE.MeshLambertMaterial({ 
      color: 0xffaa00,
      emissive: 0xff4400,
      emissiveIntensity: 0.3
    })
  );

  // Get the world position of the barrel tip
  const barrelTip = new THREE.Vector3(0, 0, 1.5);
  barrelTip.applyMatrix4(barrel.matrixWorld);
  bullet.position.copy(barrelTip);

  // Calculate direction based on tank rotation and turret rotation
  const tankRotation = tank.rotation.y;
  const turretRotation = turret.rotation.y;
  const totalRotation = tankRotation + turretRotation;
  
  const dir = new THREE.Vector3(
    -Math.sin(totalRotation),
    0,
    -Math.cos(totalRotation)
  );
  bullet.userData.velocity = dir.multiplyScalar(0.8);
  bullet.userData.life = 120; // Longer bullet life
  bullet.castShadow = true;

  scene.add(bullet);
  bullets.push(bullet);

  // Add muzzle flash effect
  const flashGeometry = new THREE.SphereGeometry(0.3);
  const flashMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffaa00,
    transparent: true,
    opacity: 0.8
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.copy(barrelTip);
  scene.add(flash);

  // Remove flash after a short time
  setTimeout(() => {
    scene.remove(flash);
  }, 100);
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

    // Check if bullet is out of bounds
    if (Math.abs(bullet.position.x) > 50 || Math.abs(bullet.position.z) > 50) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
}

function createExplosion(position) {
  // Create explosion particles
  const particleCount = 20;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = [];
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePositions[i] = position.x;
    particlePositions[i + 1] = position.y;
    particlePositions[i + 2] = position.z;
    
    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.2,
      y: Math.random() * 0.3,
      z: (Math.random() - 0.5) * 0.2,
      life: 30
    });
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xff4400,
    size: 0.3,
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
      
      velocities[i].y -= 0.01; // Gravity
      velocities[i].life--;
    }
    
    explosion.geometry.attributes.position.needsUpdate = true;
    explosion.material.opacity = velocities[0].life / 30;
    
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