// Import Matter.js as a physics engine
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Create the engine and world
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1; // Set gravity

// Set canvas size to match the window size dynamically
const canvas = document.getElementById('worldCanvas');
const updateCanvasSize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

// Render setup
const render = Render.create({
  element: document.body,
  canvas: canvas,
  engine: engine,
  options: {
    wireframes: false,
    background: '#87CEEB', // Sky blue background
  },
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Function to keep object sizes proportional
const scaleFactor = window.innerWidth / 1920; // Scale objects based on a 1920px width reference

// Cannon base
const cannonWidth = 100 * scaleFactor;
const cannonHeight = 20 * scaleFactor;
const cannon = Bodies.rectangle(100 * scaleFactor, window.innerHeight - 50 * scaleFactor, cannonWidth, cannonHeight, { isStatic: true });
World.add(world, cannon);

// Ground
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight, window.innerWidth, 20 * scaleFactor, { isStatic: true });
World.add(world, ground);

// Moving target logic
const targetSpeed = 2; // Target speed
const targets = [];
function createTarget(x, y) {
  const targetSize = 50 * scaleFactor;
  const target = Bodies.rectangle(x * scaleFactor, y * scaleFactor, targetSize, targetSize, { isStatic: true, render: { fillStyle: 'red' } });
  target.movingRight = true; // Initial direction
  targets.push(target);
  World.add(world, target);
}
createTarget(window.innerWidth - 200 * scaleFactor, window.innerHeight - 60 * scaleFactor); // Create a moving target

// Variables to store angle and velocity
let angle = 45;
let velocity = 0;
const cannonballs = [];

const velocityBar = document.getElementById('velocityBar');
const indicator = document.getElementById('indicator');
let isCharging = false;
let chargeAmount = 0;

// Mouse control for adjusting angle
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = event.clientY - rect.top;

  // Map mouse Y position to angle between 0 and 90 degrees
  angle = Math.max(0, Math.min(90, (canvas.height - mouseY) * 90 / canvas.height));
});

// Score system
let score = 0;
const scoreDisplay = document.createElement('div');
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.fontSize = '24px';
scoreDisplay.style.fontFamily = 'Arial';
scoreDisplay.style.color = 'black';
scoreDisplay.textContent = `Score: ${score}`;
document.body.appendChild(scoreDisplay);

// Function to fire cannonball
function fireCannonball() {
  const radians = (Math.PI / 180) * angle;
  const speed = velocity * 10 * scaleFactor; // Scale speed by the screen width

  const cannonballSize = 10 * scaleFactor; // Adjust cannonball size
  const cannonball = Bodies.circle(150 * scaleFactor, canvas.height - 60 * scaleFactor, cannonballSize, {
    restitution: 0.8, // Bounce
    density: 0.05,    // Mass
  });

  // Apply velocity based on angle
  Body.setVelocity(cannonball, {
    x: speed * Math.cos(radians),
    y: -speed * Math.sin(radians),
  });

  World.add(world, cannonball);
  cannonballs.push(cannonball);
}

// Charge cannonball velocity based on how long the button is held
function chargeVelocity() {
  if (isCharging) {
    chargeAmount = Math.min(150, chargeAmount + 2); // Max charge amount = 150
    indicator.style.bottom = `${chargeAmount}px`;
    velocity = (chargeAmount / 150) * 20; // Scale velocity to max value of 20
    requestAnimationFrame(chargeVelocity);
  }
}

// Clear all cannonballs
function clearCannonballs() {
  cannonballs.forEach(ball => World.remove(world, ball));
  cannonballs.length = 0;
}

// Moving target logic (back and forth)
function updateTargets() {
  targets.forEach(target => {
    if (target.position.x >= window.innerWidth - 50 * scaleFactor) {
      target.movingRight = false;
    } else if (target.position.x <= window.innerWidth - 300 * scaleFactor) {
      target.movingRight = true;
    }

    const direction = target.movingRight ? targetSpeed : -targetSpeed;
    Body.setPosition(target, { x: target.position.x + direction, y: target.position.y });
  });
}

// Event listeners for charging and shooting
canvas.addEventListener('mousedown', () => {
  isCharging = true;
  chargeAmount = 0;
  velocityBar.style.display = 'block';
  chargeVelocity();
});

canvas.addEventListener('mouseup', () => {
  isCharging = false;
  velocityBar.style.display = 'none';
  fireCannonball();
});

// Clear button event listener
document.getElementById('clearBtn').addEventListener('click', clearCannonballs);

// Adjust cannon angle visual
Events.on(engine, 'beforeUpdate', () => {
  const radians = (Math.PI / 180) * angle;
  Body.setAngle(cannon, -radians); // Rotate the cannon
  updateTargets(); // Update moving targets every frame
});

// Detect collisions and update score
Events.on(engine, 'collisionStart', (event) => {
  const pairs = event.pairs;
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;

    // Check if a cannonball hits a target
    targets.forEach((target, index) => {
      if ((bodyA === target && cannonballs.includes(bodyB)) || (bodyB === target && cannonballs.includes(bodyA))) {
        // Remove the target from the world and targets array
        World.remove(world, target);
        targets.splice(index, 1);

        // Increment the score
        score += 1;
        scoreDisplay.textContent = `Score: ${score}`;
      }
    });
  });
});







