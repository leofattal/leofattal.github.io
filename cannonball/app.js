// Module aliases
const { Engine, Render, Runner, Bodies, Composite, Body, Events } = Matter;

// Create an engine
let engine = Engine.create();
let world = engine.world;

// Create a renderer
let render = Render.create({
    element: document.body,
    canvas: document.getElementById('world'),
    engine: engine,
    options: {
        width: 1200,  // Bigger canvas width
        height: 600,  // Bigger canvas height
        wireframes: false,
        background: 'lightblue'
    }
});

Render.run(render);

// Create a runner
let runner = Runner.create();
Runner.run(runner, engine);

// Cannon settings
let cannonAngle = Math.PI / 4; // Initial angle (45 degrees)
let cannonVelocity = 20;       // Initial velocity
const cannonLength = 100;

// Ground
const ground = Bodies.rectangle(600, 580, 1210, 60, { isStatic: true });
Composite.add(world, ground);

// Cannon base
const cannonBase = Bodies.rectangle(50, 540, 100, 20, { isStatic: true });
Composite.add(world, cannonBase);

// Cannon barrel
let cannonBarrel = Bodies.rectangle(50 + Math.cos(cannonAngle) * 50, 540 - Math.sin(cannonAngle) * 50, 100, 20, { 
    isStatic: true,
    render: {
        fillStyle: 'black'
    }
});
Composite.add(world, cannonBarrel);

// Function to update cannon rotation
function updateCannonRotation() {
    Body.setPosition(cannonBarrel, { 
        x: 50 + Math.cos(cannonAngle) * 50, 
        y: 540 - Math.sin(cannonAngle) * 50 
    });
    Body.setAngle(cannonBarrel, -cannonAngle);
}

// Cannonball firing function
function fireCannonball() {
    const angle = cannonAngle;

    // Create the cannonball
    const cannonball = Bodies.circle(50 + Math.cos(angle) * cannonLength, 540 - Math.sin(angle) * cannonLength, 15, {
        restitution: 0.6  // Make it bounce a bit
    });
    Body.setVelocity(cannonball, {
        x: cannonVelocity * Math.cos(angle),
        y: -cannonVelocity * Math.sin(angle)
    });
    Composite.add(world, cannonball);
}

// Clear all cannonballs
function clearCannonballs() {
    // Loop through all bodies in the world
    Composite.allBodies(world).forEach((body) => {
        // If it's not the ground or cannon, remove it
        if (body !== ground && body !== cannonBase && body !== cannonBarrel) {
            Composite.remove(world, body);
        }
    });
}

// Update cannon angle display and rotation
document.getElementById('angle').addEventListener('input', (event) => {
    const angleDeg = event.target.value;
    document.getElementById('angleValue').textContent = angleDeg;
    cannonAngle = angleDeg * Math.PI / 180; // Convert degrees to radians
    updateCannonRotation(); // Update the cannon's position and rotation
});

// Update cannonball velocity
document.getElementById('velocity').addEventListener('input', (event) => {
    cannonVelocity = event.target.value;
    document.getElementById('velocityValue').textContent = cannonVelocity;
});

// Shoot button
document.getElementById('shoot').addEventListener('click', fireCannonball);

// Clear button
document.getElementById('clear').addEventListener('click', clearCannonballs);

// Add physics boundaries
const walls = [
    Bodies.rectangle(600, 0, 1200, 50, { isStatic: true }),   // Top wall
    Bodies.rectangle(600, 600, 1200, 50, { isStatic: true }), // Bottom wall
    Bodies.rectangle(1200, 300, 50, 600, { isStatic: true }), // Right wall
    Bodies.rectangle(0, 300, 50, 600, { isStatic: true })     // Left wall
];

Composite.add(world, walls);

// Run the engine
Engine.run(engine);
