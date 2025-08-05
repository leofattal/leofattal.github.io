// MOMMYDOG: The Husky Fighter Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Character disappearing bug fixed! 🎉

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
let currentBackground = 0;
let platforms = [];
let gameTime = 99;
let gameTimer;

// Menu state
let menuOption = 0; // 0 = Start Game, 1 = Controls
let showControls = false;
let showCharacterSelect = false;
let showCharacterStats = false;
let selectedCharForStats = null;
let showSpecialSelect = false;

// Game complexity features
let gameMode = 'classic'; // 'classic', 'tournament', 'survival'
let roundsToWin = 2;
let currentRound = 1;
let player1Wins = 0;
let player2Wins = 0;
let comboCounter1 = 0;
let comboCounter2 = 0;
let lastHitTime1 = 0;
let lastHitTime2 = 0;

// Character roster with enhanced stats and special attacks
// Background configurations
const backgrounds = [
    {
        name: "Classic Street",
        color: "#4169E1",
        platforms: [
            { x: 200, y: 350, width: 150, height: 20, hardness: 1.0, color: "#8B4513" },
            { x: 450, y: 280, width: 100, height: 15, hardness: 0.8, color: "#A0522D" }
        ],
        decorations: [
            { type: "building", x: 50, y: 200, color: "#696969" },
            { type: "building", x: 600, y: 150, color: "#808080" }
        ]
    },
    {
        name: "Ancient Temple",
        color: "#8B4513",
        platforms: [
            { x: 150, y: 320, width: 200, height: 25, hardness: 1.2, color: "#CD853F" },
            { x: 400, y: 250, width: 120, height: 20, hardness: 1.0, color: "#DEB887" },
            { x: 550, y: 380, width: 80, height: 15, hardness: 0.9, color: "#F4A460" }
        ],
        decorations: [
            { type: "pillar", x: 100, y: 150, color: "#D2B48C" },
            { type: "pillar", x: 680, y: 180, color: "#D2B48C" }
        ]
    },
    {
        name: "Industrial Zone",
        color: "#2F4F4F",
        platforms: [
            { x: 180, y: 300, width: 100, height: 18, hardness: 1.5, color: "#708090" },
            { x: 320, y: 250, width: 150, height: 22, hardness: 1.3, color: "#778899" },
            { x: 500, y: 320, width: 120, height: 20, hardness: 1.4, color: "#696969" }
        ],
        decorations: [
            { type: "smokestack", x: 80, y: 100, color: "#505050" },
            { type: "crane", x: 600, y: 120, color: "#696969" }
        ]
    },
    {
        name: "Floating Islands",
        color: "#87CEEB",
        platforms: [
            { x: 120, y: 350, width: 90, height: 12, hardness: 0.6, color: "#98FB98" },
            { x: 280, y: 280, width: 110, height: 15, hardness: 0.7, color: "#90EE90" },
            { x: 450, y: 320, width: 100, height: 12, hardness: 0.6, color: "#98FB98" },
            { x: 590, y: 250, width: 85, height: 10, hardness: 0.5, color: "#90EE90" }
        ],
        decorations: [
            { type: "cloud", x: 150, y: 100, color: "#F0F8FF" },
            { type: "cloud", x: 400, y: 80, color: "#F0F8FF" },
            { type: "cloud", x: 650, y: 120, color: "#F0F8FF" }
        ]
    }
];

const characters = {
    'RYU': {
        name: 'RYU',
        colors: { body: '#ffffff', skin: '#ffdbac', pants: '#ff0000' },
        stats: { 
            strength: 85, 
            agility: 75, 
            endurance: 90,
            technique: 95,
            focus: 88
        },
        specialAttacks: [
            { name: 'HADOKEN', description: 'Energy projectile attack', damage: 20, range: 150 },
            { name: 'SHORYUKEN', description: 'Rising dragon punch', damage: 25, range: 60 },
            { name: 'TATSUMAKI', description: 'Hurricane kick', damage: 18, range: 90 }
        ]
    },
    'KEN': {
        name: 'KEN', 
        colors: { body: '#ff4500', skin: '#ffdbac', pants: '#0000ff' },
        stats: { 
            strength: 80, 
            agility: 95, 
            endurance: 75,
            technique: 85,
            focus: 70
        },
        specialAttacks: [
            { name: 'FLAMING SHORYUKEN', description: 'Fiery uppercut', damage: 28, range: 65 },
            { name: 'FLAME HADOKEN', description: 'Fire projectile', damage: 22, range: 140 },
            { name: 'BLAZING KICK', description: 'Fire spinning kick', damage: 24, range: 85 }
        ]
    },
    'CHUN-LI': {
        name: 'CHUN-LI',
        colors: { body: '#4169E1', skin: '#ffdbac', pants: '#FFD700' },
        stats: { 
            strength: 70, 
            agility: 100, 
            endurance: 85,
            technique: 90,
            focus: 80
        },
        specialAttacks: [
            { name: 'LIGHTNING LEGS', description: 'Rapid kick combo', damage: 15, range: 70 },
            { name: 'SPINNING BIRD KICK', description: 'Aerial spinning attack', damage: 20, range: 95 },
            { name: 'KIKOKEN', description: 'Energy sphere', damage: 18, range: 120 }
        ]
    },
    'ZANGIEF': {
        name: 'ZANGIEF',
        colors: { body: '#ff0000', skin: '#ffdbac', pants: '#008000' },
        stats: { 
            strength: 100, 
            agility: 50, 
            endurance: 95,
            technique: 60,
            focus: 85
        },
        specialAttacks: [
            { name: 'SCREW PILEDRIVER', description: 'Devastating grapple', damage: 35, range: 50 },
            { name: 'IRON MUSCLE', description: 'Defense boost move', damage: 10, range: 40 },
            { name: 'BEAR HUG', description: 'Crushing grab attack', damage: 30, range: 55 }
        ]
    },
    'MOMMYDOG': {
        name: 'MOMMYDOG',
        colors: { 
            body: '#8B7355', // Brown husky fur
            skin: '#FFFFFF', // White chest/belly
            pants: '#4A4A4A', // Dark gray legs
            accent: '#87CEEB' // Light blue eyes
        },
        stats: { 
            strength: 95, 
            agility: 90, 
            endurance: 85, 
            technique: 88, 
            focus: 92 
        },
        specialAttacks: [
            { name: 'DOGDASH', description: 'Sky fire rain then dash behind enemy', damage: 45, range: 300 },
            { name: 'ZEUS', description: 'Lightning strikes the opponent', damage: 50, range: 250 },
            { name: 'BLOWDRYER', description: 'Blows enemy to wall, 5 second stun', damage: 35, range: 200 }
        ],
        abilities: {
            kibbleBlast: { damage: 22, range: 180, cooldown: 30 },
            dogatadge: { damage: 30, range: 999, cooldown: 60, stunTime: 180 }, // 3 seconds = 180 frames
            reflectoshield: { cooldown: 300, duration: 60 } // 5 second cooldown, 1 second duration
        }
    },
    'DOUG': {
        name: 'DOUG',
        colors: { 
            body: '#000000', // Black panda fur
            skin: '#FFFFFF', // White panda belly/face
            pants: '#2F4F4F', // Dark slate gray
            accent: '#FF1493' // Deep pink eyes (OP glow)
        },
        stats: { 
            strength: 100, // MAX POWER
            agility: 100,  // MAX SPEED
            endurance: 100, // MAX HEALTH
            technique: 100, // PERFECT TECHNIQUE
            focus: 100 // ULTIMATE FOCUS - THE MASTER
        },
        specialAttacks: [
            { name: 'BAMBOO STORM', description: 'Summons a devastating bamboo hurricane', damage: 65, range: 400 },
            { name: 'PANDA RAGE', description: 'Berserker mode with increased damage', damage: 80, range: 150 },
            { name: 'MASTER\'S WISDOM', description: 'Instantly recharges all abilities and heals', damage: 0, range: 0 }
        ],
        abilities: {
            bambooBurst: { damage: 35, range: 250, cooldown: 20 }, // T - Fast bamboo projectiles
            shadowClone: { damage: 50, range: 999, cooldown: 45, duration: 120 }, // Y - Creates shadow clone
            zenMeditation: { cooldown: 180, duration: 90, healAmount: 30 } // U - Heals and becomes invincible
        }
    },
    'POOPIEN LEADER': {
        name: 'POOPIEN LEADER',
        colors: { 
            body: '#8B4513', // Brown poop color
            skin: '#A0522D', // Darker brown shading
            pants: '#654321', // Even darker brown
            accent: '#228B22' // Green stink effect
        },
        stats: { 
            strength: 85, 
            agility: 60, 
            endurance: 95, // Very tanky
            technique: 40, // Not very refined
            focus: 75 
        },
        specialAttacks: [
            { name: 'STINK STORM', description: 'Toxic cloud that damages over time', damage: 55, range: 300 },
            { name: 'SLUDGE WAVE', description: 'Wide-range ground attack', damage: 70, range: 400 },
            { name: 'FERTILIZER POWER', description: 'Grows stronger and heals from damage', damage: 0, range: 0 }
        ],
        abilities: {
            stinkBomb: { damage: 25, range: 200, cooldown: 25, duration: 120 }, // I - Stink bomb projectile
            sludgeSlide: { damage: 40, range: 150, cooldown: 40, stunTime: 90 }, // O - Slides forward leaving trail
            gasCloud: { damage: 15, range: 180, cooldown: 35, duration: 180 } // P - Creates toxic area
        }
    },
    'POKEMON GUY': {
        name: 'POKEMON GUY',
        colors: { 
            body: '#8B4513', // Brown poop color
            skin: '#654321', // Darker brown shading
            pants: '#A0522D', // Medium brown
            accent: '#FF6347' // Orange helicopter hat
        },
        stats: { 
            strength: 75, 
            agility: 85, // Flying around with helicopter hat
            endurance: 80, 
            technique: 95, // Very nerdy and technical
            focus: 90 // Focused on catching Pokemon
        },
        specialAttacks: [
            { name: 'GOTTA CATCH EM ALL', description: 'Throws multiple pokeballs everywhere', damage: 60, range: 350 },
            { name: 'HELICOPTER STORM', description: 'Spins hat creating tornado', damage: 75, range: 200 },
            { name: 'NERD RAGE', description: 'Gets angry about Pokemon facts, power boost', damage: 0, range: 0 }
        ],
        abilities: {
            pokeballThrow: { damage: 30, range: 220, cooldown: 20 }, // K - Throws pokeball projectiles
            helicopterSpin: { damage: 45, range: 120, cooldown: 35, duration: 60 }, // L - Spins hat for area damage
            nerdFacts: { cooldown: 50, duration: 180, boostAmount: 1.3 } // ; - Shares Pokemon facts for damage boost
        }
    }
};

let selectedSpecialAttacks = {
    player1: null,
    player2: null
};

// Screen shake effect
let screenShake = 0;

// Particle system
let particles = [];
let projectiles = [];

let selectedChar1 = null;
let selectedChar2 = null;

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

});
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
});

// Mouse handling
let mouseX = 0;
let mouseY = 0;
let mouseClicked = false;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    mouseClicked = true;
    handleMouseClick();
    
    // Reset click flag after a short delay
    setTimeout(() => {
        mouseClicked = false;
    }, 100);
});

// Handle mouse clicks
function handleMouseClick() {
    if (gameState === 'menu') {
        if (showSpecialSelect) {
            handleSpecialSelectClick();
        } else if (showCharacterStats) {
            handleCharacterStatsClick();
        } else if (showControls) {
            handleControlsClick();
        } else if (showCharacterSelect) {
            handleCharacterSelectClick();
        } else {
            handleMainMenuClick();
        }
    } else if (gameState === 'gameOver') {
        handleGameOverClick();
    }
}

function handleMainMenuClick() {
    // Check if click is on any menu option
    const options = ['START GAME', 'CONTROLS'];
    
    for (let i = 0; i < options.length; i++) {
        const y = 350 + i * 60;
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = y - 35;
        
        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
            
            if (i === 0) {
                showCharacterSelect = true;
                // Keep HUD hidden during character selection
                const hudElement = document.querySelector('.hud');
                if (hudElement) hudElement.style.display = 'none';
            } else if (i === 1) {
                showControls = true;
            }
            break;
        }
    }
}

function handleCharacterSelectClick() {
    const charNames = Object.keys(characters);
    const charPosX = [80, 170, 260, 350, 440, 530, 620, 710]; // 8 positions evenly spaced
    const charY = 200;
    
    // Check character portrait clicks
    charNames.forEach((charName, index) => {
        const x = charPosX[index];
        const portraitWidth = 100; // Made slightly smaller to fit 5 characters
        const portraitHeight = 160;
        const portraitX = x - 50;
        const portraitY = charY - 50;
        
        if (mouseX >= portraitX && mouseX <= portraitX + portraitWidth &&
            mouseY >= portraitY && mouseY <= portraitY + portraitHeight) {
            
            const selectedChar = charNames[index];
            
            // Check if character is already taken by the other player
            const isAlreadyTaken = (selectingPlayer === 1 && selectedChar2 === selectedChar) || 
                                  (selectingPlayer === 2 && selectedChar1 === selectedChar);
            
            if (!isAlreadyTaken) {
                // Show character stats popup
                selectedCharForStats = selectedChar;
                showCharacterStats = true;
            }
        }
    });
    
    // Check back button
    const backButtonWidth = 120;
    const backButtonHeight = 35;
    const backButtonX = 50;
    const backButtonY = canvas.height - 60;
    
    if (mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
        mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight) {
        showCharacterSelect = false;
        selectingPlayer = 1;
        // Reset selections
        selectedChar1 = null;
        selectedChar2 = null;
        selectedSpecialAttacks.player1 = null;
        selectedSpecialAttacks.player2 = null;
    }
}

// Fighter class
class Fighter {
    constructor(x, y, name, controls, color, facingRight = true) {
        this.x = Number(x) || (facingRight ? 100 : 650); // Safe fallback positions
        this.y = Number(y) || 380;
        
        // Set colors from character data
        this.colors = color || { body: '#ffffff', skin: '#ffdbac', pants: '#ff0000' };
        this.width = 60;
        this.height = 100;
        this.name = name;
        this.controls = controls;
        this.color = color;
        this.facingRight = facingRight;
        this.isPlayer1 = facingRight;
        
        // Combat stats
        this.health = 100;
        this.specialEffectTimer = 0;
        this.currentSpecialAttack = '';
        this.projectiles = [];
        this.multiHitTimer = 0;
        this.multiHitCount = 0;
        this.maxMultiHits = 5;
        this.rapidKickTimer = 0;
        this.rapidKickCount = 0;
        this.maxRapidKicks = 8;
        this.attackNameTimer = 0;
        this.flashTimer = 0;
        this.multiHitRange = 0;
        
        // Mommydog special abilities
        this.kibbleBlastCooldown = 0;
        this.dogatadgeCooldown = 0;
        this.reflectoshieldCooldown = 0;
        this.reflectoshieldActive = false;
        this.reflectoshieldTimer = 0;
        this.blowdryerStunTimer = 0;
        this.rainFireTimer = 0;
        this.rainFireActive = false;
        this.stunned = false;
        this.stunTimer = 0;
        this.knockedDown = false;
        this.getUpTimer = 0;
        this.maxHealth = 100;
        this.baseSpeed = 3;
        this.speed = 3;
        this.jumpPower = 15;
        this.gravity = 0.8;
        this.powerMultiplier = 1.0;
        this.defenseMultiplier = 1.0;
        
        // State
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.blocking = false;
        this.attacking = false;
        this.attackType = '';
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.hitCooldown = 0;
        this.stunned = false;
        this.knockedDown = false;
        this.getUpTimer = 0;
        this.stunTimer = 0;
        this.comboHits = 0;
        this.specialCharge = 0;
        this.maxSpecialCharge = 100;
        this.isBlocking = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.walkCycle = 0;
        this.idleAnimation = 0;
        this.attackAnimation = 0;
        
        // Ground level
        this.groundY = canvas.height - 120; // 600 - 120 = 480
        this.y = this.groundY - this.height; // 480 - 100 = 380
    }
    
    update() {
        // Handle knocked down state
        if (this.knockedDown) {
            this.getUpTimer--;
            if (this.getUpTimer <= 0) {
                this.knockedDown = false;
                this.y = this.groundY - this.height;
                this.velocityY = 0;
                this.velocityX = 0;
                this.stunned = true;
                this.stunTimer = 60; // 1 second stun after getting up
            }
            this.applyPhysics();
            this.updateAnimation();
            return;
        }
        
        // Reduce cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        if (this.hitCooldown > 0) this.hitCooldown--;
        if (this.stunTimer > 0) this.stunTimer--;
        
        // Update Mommydog ability cooldowns
        if (this.kibbleBlastCooldown > 0) this.kibbleBlastCooldown--;
        if (this.dogatadgeCooldown > 0) this.dogatadgeCooldown--;
        if (this.reflectoshieldCooldown > 0) this.reflectoshieldCooldown--;
        if (this.blowdryerStunTimer > 0) this.blowdryerStunTimer--;
        
        // Handle reflectoshield duration
        if (this.reflectoshieldActive) {
            this.reflectoshieldTimer--;
            if (this.reflectoshieldTimer <= 0) {
                this.reflectoshieldActive = false;
            }
        }
        
        // Handle rain fire effect
        if (this.rainFireActive) {
            this.rainFireTimer--;
            if (this.rainFireTimer <= 0) {
                this.rainFireActive = false;
            }
        }
        
        // Reset states
        if (this.attackCooldown <= 0) {
            this.attacking = false;
            this.attackType = '';
        }
        
        if (this.hitCooldown <= 0) {
            this.stunned = false;
        }
        
        if (this.stunTimer <= 0) {
            this.stunned = false;
        }
        
        // Handle input if not stunned
        if (!this.stunned) {
            this.handleInput();
        }
        
        // Apply physics
        this.applyPhysics();
        
        // Update animation
        this.updateAnimation();
        
        // Keep in bounds
        this.x = Math.max(10, Math.min(canvas.width - this.width - 10, this.x));
    }
    
    handleInput() {
        const c = this.controls;
        
        // Reset horizontal velocity
        this.velocityX = 0;
        this.blocking = false;
        
        // Movement
        if (keys[c.left] && !this.attacking) {
            this.velocityX = -(this.speed || 3);
            this.facingRight = false;
        }
        if (keys[c.right] && !this.attacking) {
            this.velocityX = this.speed || 3;
            this.facingRight = true;
        }
        
        // Jumping
        if (keys[c.up] && this.onGround && !this.attacking) {
            this.velocityY = -this.jumpPower;
            this.onGround = false;
        }
        
        // Crouching (defensive bonus)
        if (keys[c.down]) {
            this.blocking = true;
        }
        
        // Sweep attack (down + punch) - Check FIRST so it takes priority over regular punch
        if (keys[c.down] && keys[c.punch] && this.attackCooldown <= 0) {
            this.performSweep();
            return; // Exit early to prevent regular punch from triggering
        }
        
        // Attacks
        if (keys[c.punch] && this.attackCooldown <= 0) {
            this.performAttack('punch');
        }
        
        if (keys[c.kick] && this.attackCooldown <= 0) {
            this.performAttack('kick');
        }
        
        // Blocking
        if (keys[c.block]) {
            this.blocking = true;
        }
        
        // Special attack
        if (keys[c.special] && this.specialCooldown <= 0 && this.specialCharge >= 50) {
            this.performSpecialAttack();
        }
        
        // Mommydog abilities (only for MOMMYDOG character)
        if (this.name === 'MOMMYDOG') {
            try {
                if (keys['q'] && this.kibbleBlastCooldown <= 0) {
                    this.performKibbleBlast();
                }
                
                if (keys['e'] && this.dogatadgeCooldown <= 0) {
                    this.performDogatadge();
                }
                
                if (keys['r'] && this.reflectoshieldCooldown <= 0) {
                    this.activateReflectoshield();
                }
            } catch (error) {
                console.error('MOMMYDOG ability error:', error);
            }
        }
        
        // Doug's OP panda abilities (only for DOUG character)
        if (this.name === 'DOUG') {
            try {
                if (keys['t'] && this.bambooBurstCooldown <= 0) {
                    this.performBambooBurst();
                }
                
                if (keys['y'] && this.shadowCloneCooldown <= 0) {
                    this.performShadowClone();
                }
                
                if (keys['u'] && this.zenMeditationCooldown <= 0) {
                    this.activateZenMeditation();
                }
            } catch (error) {
                console.error('DOUG ability error:', error);
            }
        }
        
        // Poopien Leader's stinky abilities (only for POOPIEN LEADER character)
        if (this.name === 'POOPIEN LEADER') {
            try {
                if (keys['i'] && this.stinkBombCooldown <= 0) {
                    this.performStinkBomb();
                }
                
                if (keys['o'] && this.sludgeSlideCooldown <= 0) {
                    this.performSludgeSlide();
                }
                
                if (keys['p'] && this.gasCloudCooldown <= 0) {
                    this.createGasCloud();
                }
            } catch (error) {
                console.error('POOPIEN LEADER ability error:', error);
            }
        }
        
        // Pokemon Guy's nerdy Pokemon abilities (only for POKEMON GUY character)
        if (this.name === 'POKEMON GUY') {
            try {
                if (keys['k'] && this.pokeballThrowCooldown <= 0) {
                    this.performPokeballThrow();
                }
                
                if (keys['l'] && this.helicopterSpinCooldown <= 0) {
                    this.performHelicopterSpin();
                }
                
                if (keys[';'] && this.nerdFactsCooldown <= 0) {
                    this.shareNerdFacts();
                }
            } catch (error) {
                console.error('POKEMON GUY ability error:', error);
            }
        }
    }
    
    performAttack(type) {
        this.attacking = true;
        this.attackType = type;
        this.attackCooldown = type === 'punch' ? 20 : 25; // Kicks are slower
        
        // Create attack hitbox based on attack type and direction
        let attackRange, attackX, attackY, attackWidth, attackHeight;
        
        if (type === 'punch') {
            attackRange = 45; // Shorter range for punches
            attackX = this.facingRight ? this.x + this.width - 5 : this.x - attackRange + 5;
            attackY = this.y + 25;
            attackWidth = attackRange;
            attackHeight = 30;
        } else if (type === 'kick') {
            attackRange = 55; // Medium range for kicks
            attackX = this.facingRight ? this.x + this.width - 5 : this.x - attackRange + 5;
            attackY = this.y + 45;
            attackWidth = attackRange;
            attackHeight = 25;
        }
        
        // Check for hit on opponent
        const opponent = this === player1 ? player2 : player1;
        if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
            this.hitOpponent(opponent, type);
        }
        
        // Visual debug for attack range (optional - remove in final version)
        this.lastAttackBox = { x: attackX, y: attackY, width: attackWidth, height: attackHeight };
    }
    
    performSpecialAttack() {
        if (this.specialCharge < 50) return; // Require special charge
        
        this.attacking = true;
        this.attackType = 'special';
        this.attackCooldown = 40;
        this.specialCooldown = 180; // 3 second cooldown
        this.specialCharge = Math.max(0, this.specialCharge - 50); // Use special charge
        
        // Get the selected special attack for this player
        const selectedAttack = this.isPlayer1 ? selectedSpecialAttacks.player1 : selectedSpecialAttacks.player2;
        
        let attackName = 'HADOKEN'; // Default
        if (selectedAttack) {
            attackName = selectedAttack.name;
        } else {
            // Fallback to default special attacks based on character
            switch (this.name) {
                case 'RYU': attackName = 'HADOKEN'; break;
                case 'KEN': attackName = 'FLAMING SHORYUKEN'; break;
                case 'CHUN-LI': attackName = 'KIKOKEN'; break;
                case 'ZANGIEF': attackName = 'SCREW PILEDRIVER'; break;
                case 'MOMMYDOG': attackName = 'DOGDASH'; break;
            }
        }
        
        // Execute the specific special attack
        this.executeSpecialAttack(attackName, selectedAttack);
    }
    
    performSweep() {
        this.attacking = true;
        this.attackType = 'sweep';
        this.attackCooldown = 45; // Longer cooldown for sweep
        
        // Check if opponent is in range
        const opponent = this === player1 ? player2 : player1;
        const distance = Math.abs(this.x - opponent.x);
        
        if (distance < 90) { // Slightly longer range than normal attacks
            this.hitOpponent(opponent, 'sweep', true); // Deal damage and knock down
            
            // Create sweep effect particles
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: this.x + (this.facingRight ? this.width : 0),
                    y: this.y + this.height - 10,
                    vx: (this.facingRight ? 1 : -1) * (Math.random() * 4 + 2),
                    vy: Math.random() * -2 - 1,
                    life: 30,
                    color: '#8B4513' // Brown dust effect
                });
            }
        }
    }
    
    // Mommydog's Kibble Blast - long-range projectile
    performKibbleBlast() {
        this.kibbleBlastCooldown = 30;
        this.attackNameTimer = 60;
        this.currentAttackName = 'KIBBLE BLAST!';
        
        // Create kibble projectile
        const projectile = {
            x: this.facingRight ? this.x + this.width : this.x,
            y: this.y + 30,
            vx: this.facingRight ? 8 : -8,
            vy: 0,
            damage: 22,
            range: 180,
            life: 180,
            color: '#D2691E', // Orange-brown kibble color
            type: 'kibble'
        };
        
        // Add owner reference and push to projectiles
        projectile.owner = this;
        projectiles.push(projectile);
        
        // Create kibble particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: projectile.x,
                y: projectile.y,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * -2 - 1,
                life: 20,
                color: '#D2691E'
            });
        }
    }
    
    // Mommydog's Dogatadge - teleport behind and stun
    performDogatadge() {
        this.dogatadgeCooldown = 60;
        this.attackNameTimer = 60;
        this.currentAttackName = 'DOGATADGE!';
        
        const opponent = this === player1 ? player2 : player1;
        
        // Teleport behind opponent with bounds checking
        let newX = opponent.facingRight ? opponent.x - this.width - 10 : opponent.x + opponent.width + 10;
        
        // Keep within canvas bounds
        newX = Math.max(10, Math.min(canvas.width - this.width - 10, newX));
        
        this.x = newX;
        this.y = this.groundY - this.height; // Make sure Y position is correct
        this.facingRight = !opponent.facingRight;
        
        // Bash them to the ground
        this.hitOpponent(opponent, 'dogatadge', true);
        opponent.stunned = true;
        opponent.stunTimer = 180; // 3 seconds
        opponent.knockedDown = true;
        opponent.getUpTimer = 60; // 1 second knockdown
        
        // Create teleport effect particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6,
                life: 40,
                color: '#9370DB' // Purple teleport effect
            });
        }
        
        screenShake = 15;
    }
    
    // Mommydog's Reflectoshield
    activateReflectoshield() {
        this.reflectoshieldCooldown = 300; // 5 seconds
        this.reflectoshieldActive = true;
        this.reflectoshieldTimer = 60; // 1 second duration
        this.attackNameTimer = 60;
        this.currentAttackName = 'REFLECTOSHIELD!';
        
        // Create shield effect particles
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            particles.push({
                x: this.x + this.width/2 + Math.cos(angle) * 40,
                y: this.y + this.height/2 + Math.sin(angle) * 40,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 60,
                color: '#00FFFF' // Cyan shield color
            });
        }
    }
    
    // Doug's OP Panda Abilities
    
    // Doug's Bamboo Burst - rapid-fire bamboo projectiles
    performBambooBurst() {
        this.bambooBurstCooldown = 20; // Very short cooldown because she's OP
        this.attackNameTimer = 60;
        this.currentAttackName = 'BAMBOO BURST!';
        
        // Create multiple bamboo projectiles
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const projectile = {
                    x: this.facingRight ? this.x + this.width : this.x,
                    y: this.y + 25 + (i * 8), // Spread vertically
                    vx: this.facingRight ? 12 : -12, // Very fast
                    vy: (i - 2) * 2, // Spread pattern
                    damage: 35,
                    range: 250,
                    life: 120,
                    color: '#228B22', // Forest green bamboo
                    type: 'bamboo'
                };
                
                projectile.owner = this;
                projectiles.push(projectile);
                
                // Create bamboo particles
                for (let j = 0; j < 3; j++) {
                    particles.push({
                        x: projectile.x,
                        y: projectile.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: Math.random() * -3,
                        life: 15,
                        color: '#32CD32'
                    });
                }
            }, i * 50); // Staggered release
        }
        
        screenShake = 12;
    }
    
    // Doug's Shadow Clone - creates a temporary duplicate
    performShadowClone() {
        this.shadowCloneCooldown = 45;
        this.attackNameTimer = 60;
        this.currentAttackName = 'SHADOW CLONE!';
        
        const opponent = this === player1 ? player2 : player1;
        
        // Create shadow clone effect
        this.shadowCloneActive = true;
        this.shadowCloneTimer = 120; // 2 seconds
        
        // Teleport to multiple positions and attack
        const positions = [
            { x: opponent.x - 100, side: 'left' },
            { x: opponent.x + 100, side: 'right' },
            { x: opponent.x, side: 'above' }
        ];
        
        positions.forEach((pos, index) => {
            setTimeout(() => {
                // Create shadow at position
                for (let i = 0; i < 20; i++) {
                    particles.push({
                        x: pos.x,
                        y: pos.side === 'above' ? opponent.y - 50 : opponent.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: Math.random() * -8,
                        life: 40,
                        color: '#4B0082' // Indigo shadow
                    });
                }
                
                // Deal damage from each shadow
                const distance = Math.abs(pos.x - opponent.x);
                if (distance < 120) {
                    this.hitOpponent(opponent, 'shadowclone', true);
                }
            }, index * 200);
        });
        
        screenShake = 20;
    }
    
    // Doug's Zen Meditation - healing and invincibility
    activateZenMeditation() {
        this.zenMeditationCooldown = 180; // 3 seconds
        this.zenMeditationActive = true;
        this.zenMeditationTimer = 90; // 1.5 seconds duration
        this.attackNameTimer = 60;
        this.currentAttackName = 'ZEN MEDITATION!';
        
        // Heal Doug
        this.health = Math.min(100, this.health + 30);
        
        // Update health display
        try {
            if (this === player1) {
                document.getElementById('player1Health').style.width = this.health + '%';
                document.getElementById('player1HealthText').textContent = `${this.health}/100`;
            } else {
                document.getElementById('player2Health').style.width = this.health + '%';
                document.getElementById('player2HealthText').textContent = `${this.health}/100`;
            }
        } catch (e) { /* Ignore UI errors */ }
        
        // Create golden meditation particles
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            particles.push({
                x: this.x + this.width/2 + Math.cos(angle) * 40,
                y: this.y + this.height/2 + Math.sin(angle) * 40,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 60,
                color: '#FFD700' // Golden meditation aura
            });
        }
        
        // Reset all cooldowns because she's the MASTER
        this.bambooBurstCooldown = 0;
        this.shadowCloneCooldown = 0;
        this.specialCooldown = 0;
        this.specialCharge = 100; // Full special charge
    }
    
    // Poopien Leader's Stinky Abilities
    
    // Poopien Leader's Stink Bomb - toxic projectile
    performStinkBomb() {
        this.stinkBombCooldown = 25;
        this.attackNameTimer = 60;
        this.currentAttackName = 'STINK BOMB!';
        
        // Create stink bomb projectile
        const projectile = {
            x: this.facingRight ? this.x + this.width : this.x,
            y: this.y + 35,
            vx: this.facingRight ? 6 : -6,
            vy: -2, // Arc trajectory
            gravity: 0.3,
            damage: 25,
            range: 200,
            life: 180,
            color: '#228B22', // Green stink
            type: 'stinkbomb'
        };
        
        projectile.owner = this;
        projectiles.push(projectile);
        
        // Create stink particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: projectile.x,
                y: projectile.y,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * -4,
                life: 30,
                color: '#228B22'
            });
        }
        
        screenShake = 8;
    }
    
    // Poopien Leader's Sludge Slide - forward dash attack
    performSludgeSlide() {
        this.sludgeSlideCooldown = 40;
        this.attackNameTimer = 60;
        this.currentAttackName = 'SLUDGE SLIDE!';
        
        const opponent = this === player1 ? player2 : player1;
        
        // Slide forward rapidly
        this.velocityX = this.facingRight ? 15 : -15;
        this.sludgeSlideActive = true;
        this.sludgeSlideTimer = 30; // Half second slide
        
        // Create sludge trail particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                particles.push({
                    x: this.x + Math.random() * this.width,
                    y: this.y + this.height - 5,
                    vx: (Math.random() - 0.5) * 2,
                    vy: 0,
                    life: 120,
                    color: '#654321' // Dark brown sludge
                });
            }, i * 5);
        }
        
        // Check for hit during slide
        const distance = Math.abs(this.x - opponent.x);
        if (distance < 80) {
            this.hitOpponent(opponent, 'sludgeslide', true);
            opponent.stunned = true;
            opponent.stunTimer = 90; // 1.5 seconds
        }
        
        screenShake = 12;
    }
    
    // Poopien Leader's Gas Cloud - area denial
    createGasCloud() {
        this.gasCloudCooldown = 35;
        this.attackNameTimer = 60;
        this.currentAttackName = 'GAS CLOUD!';
        
        // Create toxic gas area
        this.gasCloudActive = true;
        this.gasCloudTimer = 180; // 3 seconds
        this.gasCloudX = this.x + this.width/2;
        this.gasCloudY = this.y + this.height/2;
        
        // Create expanding gas cloud particles
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100;
                particles.push({
                    x: this.gasCloudX + Math.cos(angle) * distance,
                    y: this.gasCloudY + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 0.5,
                    vy: Math.sin(angle) * 0.5,
                    life: 180,
                    color: '#228B22' // Green toxic gas
                });
            }, i * 10);
        }
        
        // Continuous damage to opponent in gas
        const checkGasDamage = () => {
            if (this.gasCloudTimer > 0) {
                const opponent = this === player1 ? player2 : player1;
                const distance = Math.sqrt(
                    Math.pow(opponent.x + opponent.width/2 - this.gasCloudX, 2) +
                    Math.pow(opponent.y + opponent.height/2 - this.gasCloudY, 2)
                );
                
                if (distance < 100 && opponent.hitCooldown <= 0) {
                    opponent.health = Math.max(0, opponent.health - 2); // Small continuous damage
                    opponent.hitCooldown = 30;
                    
                    // Update health display
                    try {
                        if (opponent === player1) {
                            document.getElementById('player1Health').style.width = opponent.health + '%';
                            document.getElementById('player1HealthText').textContent = `${opponent.health}/100`;
                        } else {
                            document.getElementById('player2Health').style.width = opponent.health + '%';
                            document.getElementById('player2HealthText').textContent = `${opponent.health}/100`;
                        }
                    } catch (e) { /* Ignore UI errors */ }
                }
                
                setTimeout(checkGasDamage, 100);
            }
        };
        
        checkGasDamage();
        screenShake = 5;
    }
    
    // Pokemon Guy's Nerdy Pokemon Abilities
    
    // Pokemon Guy's Pokeball Throw - projectile that "catches" enemies
    performPokeballThrow() {
        this.pokeballThrowCooldown = 20;
        this.attackNameTimer = 60;
        this.currentAttackName = 'POKEBALL THROW!';
        
        // Create pokeball projectile
        const projectile = {
            x: this.facingRight ? this.x + this.width : this.x,
            y: this.y + 30,
            vx: this.facingRight ? 10 : -10,
            vy: -1,
            damage: 30,
            range: 220,
            life: 150,
            color: '#FF0000', // Red pokeball
            type: 'pokeball'
        };
        
        projectile.owner = this;
        projectiles.push(projectile);
        
        // Create sparkle particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: projectile.x,
                y: projectile.y,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * -3,
                life: 25,
                color: '#FFD700' // Golden sparkles
            });
        }
        
        screenShake = 6;
    }
    
    // Pokemon Guy's Helicopter Spin - spinning area attack
    performHelicopterSpin() {
        this.helicopterSpinCooldown = 35;
        this.helicopterSpinActive = true;
        this.helicopterSpinTimer = 60; // 1 second spin
        this.attackNameTimer = 60;
        this.currentAttackName = 'HELICOPTER SPIN!';
        
        const opponent = this === player1 ? player2 : player1;
        
        // Create spinning effect particles
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const angle = (i / 30) * Math.PI * 2;
                const distance = 40 + Math.random() * 30;
                particles.push({
                    x: this.x + this.width/2 + Math.cos(angle) * distance,
                    y: this.y + this.height/2 + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    life: 30,
                    color: '#FF6347' // Orange helicopter blades
                });
            }, i * 5);
        }
        
        // Check for hit in spinning range
        const distance = Math.abs(this.x - opponent.x);
        if (distance < 120) {
            this.hitOpponent(opponent, 'helicopterspin', true);
            
            // Blow enemy away with helicopter wind
            opponent.velocityX = this.facingRight ? 8 : -8;
            opponent.velocityY = -3;
        }
        
        screenShake = 15;
    }
    
    // Pokemon Guy's Nerd Facts - shares Pokemon trivia for power boost
    shareNerdFacts() {
        this.nerdFactsCooldown = 50;
        this.nerdFactsActive = true;
        this.nerdFactsTimer = 180; // 3 seconds
        this.powerMultiplier = 1.3; // 30% damage boost
        this.attackNameTimer = 60;
        this.currentAttackName = 'NERD FACTS!';
        
        // Create text bubble effect particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x + this.width/2 + (Math.random() - 0.5) * 60,
                y: this.y + 20 + Math.random() * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * -4,
                life: 90,
                color: '#FFFFFF' // White text bubbles
            });
        }
        
        // Show random Pokemon fact
        const pokemonFacts = [
            'DID YOU KNOW PIKACHU IS ELECTRIC TYPE?',
            'CHARIZARD IS NOT A DRAGON TYPE!',
            'THERE ARE 18 POKEMON TYPES!',
            'MAGIKARP CAN LEARN TACKLE!',
            'DITTO CAN TRANSFORM!'
        ];
        
        this.currentPokemonFact = pokemonFacts[Math.floor(Math.random() * pokemonFacts.length)];
        this.pokemonFactTimer = 120; // Display fact for 2 seconds
        
        screenShake = 3;
    }
    
    // Doug's Special Attack Implementations
    
    performBambooStorm() {
        // Hurricane of bamboo projectiles
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const angle = (i / 15) * Math.PI * 2;
                const projectile = {
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: Math.cos(angle) * 8,
                    vy: Math.sin(angle) * 8,
                    damage: 65,
                    range: 400,
                    life: 200,
                    color: '#008000',
                    type: 'bamboostorm'
                };
                projectile.owner = this;
                projectiles.push(projectile);
            }, i * 100);
        }
        screenShake = 25;
    }
    
    performPandaRage() {
        // Berserker mode
        this.pandaRageActive = true;
        this.pandaRageTimer = 300; // 5 seconds
        this.powerMultiplier = 2.5; // 2.5x damage
        this.attackCooldown = 5; // Super fast attacks
        
        // Rage particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 12,
                vy: Math.random() * -8,
                life: 100,
                color: '#FF0000'
            });
        }
        screenShake = 30;
    }
    
    performMastersWisdom() {
        // Reset everything and heal fully
        this.health = 100;
        this.specialCharge = 100;
        this.bambooBurstCooldown = 0;
        this.shadowCloneCooldown = 0;
        this.zenMeditationCooldown = 0;
        this.specialCooldown = 0;
        
        // Update health display
        try {
            if (this === player1) {
                document.getElementById('player1Health').style.width = '100%';
                document.getElementById('player1HealthText').textContent = '100/100';
            } else {
                document.getElementById('player2Health').style.width = '100%';
                document.getElementById('player2HealthText').textContent = '100/100';
            }
        } catch (e) { /* Ignore UI errors */ }
        
        // Master's wisdom particles
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: (Math.random() - 0.5) * 15,
                vy: Math.random() * -15,
                life: 120,
                color: '#FFFFFF'
            });
        }
    }
    
    // Poopien Leader's Special Attack Implementations
    
    performStinkStorm(attackData, opponent) {
        // Toxic cloud that spreads everywhere
        for (let i = 0; i < 25; i++) {
            setTimeout(() => {
                const angle = (i / 25) * Math.PI * 2;
                const distance = 50 + Math.random() * 150;
                particles.push({
                    x: this.x + this.width/2 + Math.cos(angle) * distance,
                    y: this.y + this.height/2 + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    life: 240,
                    color: '#228B22'
                });
            }, i * 20);
        }
        
        // Area damage
        const distance = Math.abs(this.x - opponent.x);
        if (distance < 300) {
            this.hitOpponent(opponent, 'stinkstorm', true);
        }
        
        screenShake = 20;
    }
    
    performSludgeWave(attackData, opponent) {
        // Wide ground attack
        this.sludgeWaveActive = true;
        this.sludgeWaveTimer = 60; // 1 second
        
        // Create wave particles along ground
        for (let i = 0; i < 40; i++) {
            setTimeout(() => {
                const waveX = this.facingRight ? this.x + (i * 10) : this.x - (i * 10);
                particles.push({
                    x: waveX,
                    y: this.groundY - 5,
                    vx: 0,
                    vy: Math.random() * -3,
                    life: 60,
                    color: '#654321'
                });
            }, i * 10);
        }
        
        // Damage if opponent on ground level
        if (Math.abs(opponent.y - this.groundY + opponent.height) < 20 && Math.abs(this.x - opponent.x) < 400) {
            this.hitOpponent(opponent, 'sludgewave', true);
        }
        
        screenShake = 25;
    }
    
    performFertilizerPower(attackData, opponent) {
        // Heals and grows stronger
        this.health = Math.min(100, this.health + 40);
        this.powerMultiplier = 1.5; // 50% damage boost
        this.fertilizerPowerActive = true;
        this.fertilizerPowerTimer = 300; // 5 seconds
        
        // Update health display
        try {
            if (this === player1) {
                document.getElementById('player1Health').style.width = this.health + '%';
                document.getElementById('player1HealthText').textContent = `${this.health}/100`;
            } else {
                document.getElementById('player2Health').style.width = this.health + '%';
                document.getElementById('player2HealthText').textContent = `${this.health}/100`;
            }
        } catch (e) { /* Ignore UI errors */ }
        
        // Growth particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -5,
                life: 80,
                color: '#228B22'
            });
        }
    }
    
    // Pokemon Guy's Special Attack Implementations
    
    performGottaCatchEmAll(attackData, opponent) {
        // Throws multiple pokeballs in all directions
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                const angle = (i / 12) * Math.PI * 2;
                const projectile = {
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: Math.cos(angle) * 7,
                    vy: Math.sin(angle) * 7,
                    damage: 60,
                    range: 350,
                    life: 180,
                    color: '#FF0000',
                    type: 'pokeball'
                };
                projectile.owner = this;
                projectiles.push(projectile);
                
                // Sparkle effect
                particles.push({
                    x: projectile.x,
                    y: projectile.y,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    life: 40,
                    color: '#FFD700'
                });
            }, i * 50);
        }
        screenShake = 25;
    }
    
    performHelicopterStorm(attackData, opponent) {
        // Creates a tornado effect
        this.helicopterStormActive = true;
        this.helicopterStormTimer = 120; // 2 seconds
        
        // Tornado particles
        for (let i = 0; i < 60; i++) {
            setTimeout(() => {
                const angle = (i / 60) * Math.PI * 6; // Multiple spirals
                const distance = (i / 60) * 80;
                particles.push({
                    x: this.x + this.width/2 + Math.cos(angle) * distance,
                    y: this.y + this.height/2 + Math.sin(angle) * distance,
                    vx: Math.cos(angle) * 5,
                    vy: Math.sin(angle) * 5,
                    life: 80,
                    color: '#87CEEB' // Sky blue tornado
                });
            }, i * 20);
        }
        
        // Pull opponent towards center and damage
        const distance = Math.abs(this.x - opponent.x);
        if (distance < 200) {
            this.hitOpponent(opponent, 'helicopterstorm', true);
            // Pull effect
            opponent.velocityX = this.x > opponent.x ? 3 : -3;
        }
        
        screenShake = 30;
    }
    
    performNerdRage(attackData, opponent) {
        // Gets angry about Pokemon misconceptions
        this.nerdRageActive = true;
        this.nerdRageTimer = 240; // 4 seconds
        this.powerMultiplier = 2.0; // Double damage when angry!
        this.attackCooldown = 3; // Super fast attacks
        
        // Angry red aura
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * -6,
                life: 120,
                color: '#FF0000' // Red rage
            });
        }
        
        // Show angry nerd text
        this.currentAttackName = 'ACTUALLY, ITS FAIRY TYPE!';
        this.attackNameTimer = 120;
    }
    
    executeSpecialAttack(attackName, attackData) {
        const opponent = this === player1 ? player2 : player1;
        
        switch (attackName) {
            case 'HADOKEN':
            case 'FLAME HADOKEN':
            case 'KIKOKEN':
                this.createProjectile(attackName, attackData);
                break;
                
            case 'SHORYUKEN':
            case 'FLAMING SHORYUKEN':
                this.performUppercut(attackName, attackData, opponent);
                break;
                
            case 'TATSUMAKI':
            case 'BLAZING KICK':
                this.performSpinningAttack(attackName, attackData, opponent);
                break;
                
            case 'SPINNING BIRD KICK':
                this.performMultiHitSpin(attackName, attackData, opponent);
                break;
                
            case 'LIGHTNING LEGS':
                this.performRapidKicks(attackName, attackData, opponent);
                break;
                
            case 'SCREW PILEDRIVER':
                this.performGrapple(attackName, attackData, opponent);
                break;
                
            case 'IRON MUSCLE':
            case 'BEAR HUG':
                this.performCommandGrab(attackName, attackData, opponent);
                break;
                
            case 'DOGDASH':
                this.performDogdash(attackData, opponent);
                break;
                
            case 'ZEUS':
                this.performZeus(attackData, opponent);
                break;
                
            case 'BLOWDRYER':
                this.performBlowdryer(attackData, opponent);
                break;
                
            case 'BAMBOO STORM':
                this.performBambooStorm(attackData, opponent);
                break;
                
            case 'PANDA RAGE':
                this.performPandaRage(attackData, opponent);
                break;
                
            case 'MASTER\'S WISDOM':
                this.performMastersWisdom(attackData, opponent);
                break;
                
            case 'STINK STORM':
                this.performStinkStorm(attackData, opponent);
                break;
                
            case 'SLUDGE WAVE':
                this.performSludgeWave(attackData, opponent);
                break;
                
            case 'FERTILIZER POWER':
                this.performFertilizerPower(attackData, opponent);
                break;
                
            case 'GOTTA CATCH EM ALL':
                this.performGottaCatchEmAll(attackData, opponent);
                break;
                
            case 'HELICOPTER STORM':
                this.performHelicopterStorm(attackData, opponent);
                break;
                
            case 'NERD RAGE':
                this.performNerdRage(attackData, opponent);
                break;
                
            default:
                // Generic special attack
                this.performGenericSpecial(attackData, opponent);
                break;
        }
        
        // Set special effect based on attack type
        this.currentSpecialAttack = attackName;
        this.specialEffectTimer = 30; // Show effect for 30 frames
        this.attackNameTimer = 60; // Show attack name for 60 frames
        
        // Screen shake for special attacks
        screenShake = 10;
    }
    
    hitOpponent(opponent, attackType) {
        if (opponent.hitCooldown > 0) return; // Already hit recently
        
        let damage;
        let knockback;
        
        switch (attackType) {
            case 'punch':
                damage = opponent.blocking ? 3 : 8;
                knockback = 5;
                break;
            case 'kick':
                damage = opponent.blocking ? 5 : 12;
                knockback = 8;
                break;
            case 'sweep':
                damage = 15; // Can't be blocked
                knockback = 12;
                // Knock down the opponent
                opponent.knockedDown = true;
                opponent.getUpTimer = 90; // 1.5 seconds to get up
                opponent.velocityY = -8; // Launch into air
                opponent.velocityX = (this.x < opponent.x) ? 3 : -3; // Push away
                screenShake = 12;
                break;
            case 'dogatadge':
                damage = 30; // High damage for teleport attack
                knockback = 15;
                break;
            case 'special':
                // Get the selected special attack for this player
                const selectedSpecial = this.isPlayer1 ? selectedSpecialAttacks.player1 : selectedSpecialAttacks.player2;
                if (selectedSpecial) {
                    damage = selectedSpecial.damage;
                    knockback = Math.max(8, selectedSpecial.damage / 3); // Scale knockback with damage
                } else {
                    damage = 25;
                    knockback = 8;
                }
                
                // Special attacks cause screen shake and flash effect
                screenShake = 8;
                opponent.flashTimer = 10;
                break;
        }
        
        // Apply damage with defense modifier
        const finalDamage = Math.floor(damage * this.powerMultiplier / opponent.defenseMultiplier);
        // Handle reflectoshield
        if (opponent.reflectoshieldActive) {
            // Reflect the attack back
            this.health = Math.max(0, this.health - finalDamage);
            this.hitCooldown = 30;
            this.stunned = true;
            
            // Create reflection effect
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x: opponent.x + opponent.width/2,
                    y: opponent.y + opponent.height/2,
                    vx: (Math.random() - 0.5) * 8,
                    vy: Math.random() * -6,
                    life: 40,
                    color: '#00FFFF' // Cyan reflection
                });
            }
            return; // Don't damage the opponent
        }
        
        opponent.health = Math.max(0, opponent.health - finalDamage);
        opponent.hitCooldown = 30;
        opponent.stunned = true;
        
        // Combo system
        const currentTime = Date.now();
        const playerNum = this === player1 ? 1 : 2;
        const lastHitTime = playerNum === 1 ? lastHitTime1 : lastHitTime2;
        
        if (currentTime - lastHitTime < 2000) { // 2 second combo window
            if (playerNum === 1) {
                comboCounter1++;
                this.comboHits = comboCounter1;
            } else {
                comboCounter2++;
                this.comboHits = comboCounter2;
            }
        } else {
            if (playerNum === 1) {
                comboCounter1 = 1;
                this.comboHits = 1;
            } else {
                comboCounter2 = 1;
                this.comboHits = 1;
            }
        }
        
        if (playerNum === 1) {
            lastHitTime1 = currentTime;
        } else {
            lastHitTime2 = currentTime;
        }
        
        // Build special charge
        this.specialCharge = Math.min(this.maxSpecialCharge, this.specialCharge + 15);
        
        // Bonus damage for combos
        if (this.comboHits > 1) {
            const comboDamage = Math.floor(finalDamage * 0.2 * (this.comboHits - 1));
            opponent.health = Math.max(0, opponent.health - comboDamage);
        }
        
        // Apply knockback
        const direction = this.facingRight ? 1 : -1;
        opponent.velocityX = knockback * direction;
        
        // Update health display
        const healthElement = opponent === player1 ? 
            document.getElementById('player1Health') : 
            document.getElementById('player2Health');
        const healthTextElement = opponent === player1 ?
            document.getElementById('player1HealthText') :
            document.getElementById('player2HealthText');
            
        if (healthElement) {
            const healthPercent = (opponent.health / opponent.maxHealth) * 100;
            healthElement.style.width = healthPercent + '%';
        }
        
        if (healthTextElement) {
            healthTextElement.textContent = `${Math.max(0, Math.floor(opponent.health))}/${opponent.maxHealth}`;
        }
        
        // Check for knockout
        if (opponent.health <= 0) {
            endRound(this);
        }
    }
    
    isColliding(ax, ay, aw, ah, other) {
        return ax < other.x + other.width &&
               ax + aw > other.x &&
               ay < other.y + other.height &&
               ay + ah > other.y;
    }
    
    applyPhysics() {
        // Apply horizontal movement with NaN protection
        this.x = Number(this.x + (this.velocityX || 0)) || (this.isPlayer1 ? 100 : 650);
        
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity;
        }
        
        // Apply vertical movement
        this.y += this.velocityY;
        
        // Platform collision detection
        let onPlatform = false;
        
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Landing on top of platform
                if (this.velocityY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.onGround = true;
                    onPlatform = true;
                    
                    // Apply platform hardness effect
                    if (platform.hardness > 1.0) {
                        // Hard platforms - less bounce, more stable
                        this.velocityX *= 0.9;
                    } else if (platform.hardness < 0.8) {
                        // Soft platforms - more bounce, less stable
                        this.velocityX *= 0.7;
                        this.velocityY = -2; // Slight bounce
                    }
                }
                // Side collision
                else if (this.velocityX > 0 && this.x < platform.x) {
                    this.x = platform.x - this.width;
                    this.velocityX = 0;
                } else if (this.velocityX < 0 && this.x > platform.x) {
                    this.x = platform.x + platform.width;
                    this.velocityX = 0;
                }
                // Bottom collision (hitting platform from below)
                else if (this.velocityY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
            }
        });
        
        // Ground collision
        if (this.y >= this.groundY - this.height) {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else if (!onPlatform) {
            this.onGround = false;
        }
        
        // Friction
        this.velocityX *= 0.8;
        
        // Keep in bounds
        this.x = Math.max(10, Math.min(canvas.width - this.width - 10, this.x));
    }
    
    updateAnimation() {
        this.animationTimer++;
        
        // Different animation speeds for different states
        let animSpeed = 8;
        if (this.attacking) animSpeed = 4; // Faster for attacks
        if (Math.abs(this.velocityX) > 0.5) animSpeed = 6; // Medium for walking
        
        if (this.animationTimer >= animSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 8;
            
            // Update specific animation cycles
            if (Math.abs(this.velocityX) > 0.5) {
                this.walkCycle = (this.walkCycle + 1) % 4;
            }
            
            this.idleAnimation = (this.idleAnimation + 1) % 60; // Slow idle breathing
            
            if (this.attacking) {
                this.attackAnimation = (this.attackAnimation + 1) % 12;
            } else {
                this.attackAnimation = 0;
            }
            
            this.animationTimer = 0;
        }
    }
    
    draw() {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.groundY + 5, this.width/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main body color with hit flash effect
        let bodyColor = this.color.body;
        let skinColor = this.color.skin;
        let pantsColor = this.color.pants;
        
        if (this.hitCooldown > 0 && Math.floor(this.hitCooldown / 3) % 2) {
            bodyColor = '#fff';
            skinColor = '#fff';
            pantsColor = '#fff';
        }
        
        // Apply flash effect if hit by special attack
        if (this.flashTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.globalCompositeOperation = 'lighter';
            this.flashTimer--;
        }
        
        // Different pose when knocked down
        if (this.knockedDown) {
            this.drawKnockedDown(bodyColor, skinColor, pantsColor);
            ctx.restore();
            return;
        }
        
        // Stunned effect - slight shake
        let shakeX = 0, shakeY = 0;
        if (this.stunned && this.stunTimer > 0) {
            shakeX = Math.random() * 2 - 1;
            shakeY = Math.random() * 2 - 1;
            ctx.translate(shakeX, shakeY);
        }
        
        // Draw more detailed character
        this.drawDetailedFighter(bodyColor, skinColor, pantsColor);
        
        // Restore flash effect
        if (this.flashTimer >= 0) {
            ctx.restore();
        }
        
        // Draw attack effects
        if (this.attacking) {
            this.drawAttackEffects();
        }
        
        // Draw special attack effects
        if (this.specialEffectTimer > 0) {
            this.drawSpecialEffects();
            this.specialEffectTimer--;
        }
        
        // Update and draw projectiles
        this.updateProjectiles();
        this.drawProjectiles();
        
        // Draw attack name
        if (this.attackNameTimer > 0) {
            this.drawAttackName();
            this.attackNameTimer--;
        }
        
        // Draw blocking indicator
        if (this.blocking) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            ctx.setLineDash([]);
        }
        
        // Draw player name above head
        this.drawPlayerName();
        
        // Draw special charge bar and combo counter
        this.drawSpecialBar();
        
        // Draw combo counter
        if (this.comboHits > 1) {
            this.drawComboCounter();
        }
        
        ctx.restore();
    }
    
    drawKnockedDown(bodyColor, skinColor, pantsColor) {
        // Draw fighter lying down
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x, this.y + this.height - 25, this.width + 20, 25);
        
        // Head lying down
        ctx.fillStyle = skinColor;
        ctx.fillRect(this.x + 5, this.y + this.height - 20, 20, 15);
        
        // Arms spread out
        ctx.fillStyle = skinColor;
        ctx.fillRect(this.x - 5, this.y + this.height - 15, 15, 8);
        ctx.fillRect(this.x + this.width + 5, this.y + this.height - 15, 15, 8);
        
        // Legs
        ctx.fillStyle = pantsColor;
        ctx.fillRect(this.x + 15, this.y + this.height - 12, 12, 8);
        ctx.fillRect(this.x + 30, this.y + this.height - 12, 12, 8);
        
        // "Stunned" stars effect
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            const angle = (this.idleAnimation + i * 120) * 0.1;
            const starX = this.x + this.width/2 + Math.cos(angle) * 20;
            const starY = this.y + this.height - 40 + Math.sin(angle) * 10;
            this.drawStar(starX, starY, 3);
        }
    }
    
    drawStar(x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    drawDetailedFighter(bodyColor, skinColor, pantsColor) {
        if (this.name === 'MOMMYDOG') {
            this.drawMommydog(bodyColor, skinColor, pantsColor);
        } else if (this.name === 'DOUG') {
            this.drawDoug(bodyColor, skinColor, pantsColor);
        } else if (this.name === 'POOPIEN LEADER') {
            this.drawPoopienLeader(bodyColor, skinColor, pantsColor);
        } else if (this.name === 'POKEMON GUY') {
            this.drawPokemonGuy(bodyColor, skinColor, pantsColor);
        } else {
            this.drawHumanFighter(bodyColor, skinColor, pantsColor);
        }
    }
    
    drawMommydog(bodyColor, skinColor, pantsColor) {
        // Mommydog the Husky drawing
        const breathOffset = Math.sin(this.idleAnimation * 0.1) * 1;
        const tailWag = Math.sin(this.idleAnimation * 0.2) * 15; // Wagging tail
        
        // Husky body (standing upright)
        ctx.fillStyle = bodyColor; // Brown fur
        ctx.fillRect(this.x + 12, this.y + 25, 36, 45);
        
        // White chest/belly
        ctx.fillStyle = skinColor; // White
        ctx.fillRect(this.x + 18, this.y + 30, 24, 35);
        
        // Husky head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 16, this.y + 5 + breathOffset, 28, 25);
        
        // White face markings
        ctx.fillStyle = skinColor;
        ctx.fillRect(this.x + 20, this.y + 10 + breathOffset, 20, 15);
        
        // Pointy ears
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 18, this.y + 2 + breathOffset, 8, 12);
        ctx.fillRect(this.x + 34, this.y + 2 + breathOffset, 8, 12);
        
        // Husky eyes (blue)
        ctx.fillStyle = this.colors.accent || '#87CEEB'; // Light blue eyes
        const blinkFrame = Math.floor(this.idleAnimation / 40) % 3;
        if (blinkFrame < 2) {
            ctx.fillRect(this.x + 22, this.y + 12 + breathOffset, 3, 3);
            ctx.fillRect(this.x + 35, this.y + 12 + breathOffset, 3, 3);
        }
        
        // Black nose
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 28, this.y + 18 + breathOffset, 4, 3);
        
        // Husky arms/front legs
        ctx.fillStyle = bodyColor;
        this.drawAnimatedArms(bodyColor, breathOffset);
        
        // Husky legs
        ctx.fillStyle = pantsColor; // Dark gray legs
        this.drawAnimatedLegs(pantsColor);
        
        // Paws - make sure they're visible
        ctx.fillStyle = '#000';
        if (!(this.attacking && this.attackType === 'kick')) {
            const footBob = Math.abs(this.velocityX) > 0.5 ? Math.sin(this.walkCycle * Math.PI) * 1 : 0;
            const pawY = Math.min(this.y + 85 + footBob, this.groundY - 5); // Keep paws above ground
            ctx.fillRect(this.x + 12, pawY, 18, 8); // Made paws slightly bigger
            ctx.fillRect(this.x + 30, pawY - footBob, 18, 8);
        }
        
        // Wagging tail
        ctx.fillStyle = bodyColor;
        const tailX = this.x + (this.facingRight ? 48 : 4);
        const tailY = this.y + 40;
        ctx.save();
        ctx.translate(tailX, tailY);
        ctx.rotate(tailWag * Math.PI / 180);
        ctx.fillRect(-3, -15, 6, 20);
        ctx.restore();
        
        // Show reflectoshield effect
        if (this.reflectoshieldActive) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    drawDoug(bodyColor, skinColor, pantsColor) {
        // Doug the OP Panda Master drawing
        const breathOffset = Math.sin(this.idleAnimation * 0.1) * 1;
        const masterGlow = Math.sin(this.idleAnimation * 0.05) * 0.3 + 0.7; // Pulsing master aura
        
        // Master aura (because she's OP)
        ctx.save();
        ctx.globalAlpha = masterGlow * 0.4;
        ctx.fillStyle = '#FF1493'; // Deep pink OP glow
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Panda body (standing upright)
        ctx.fillStyle = bodyColor; // Black fur
        ctx.fillRect(this.x + 10, this.y + 25, 40, 50);
        
        // White panda belly
        ctx.fillStyle = skinColor; // White
        ctx.fillRect(this.x + 16, this.y + 30, 28, 40);
        
        // Panda head
        ctx.fillStyle = bodyColor; // Black
        ctx.fillRect(this.x + 14, this.y + 5 + breathOffset, 32, 28);
        
        // White face
        ctx.fillStyle = skinColor; // White
        ctx.fillRect(this.x + 18, this.y + 10 + breathOffset, 24, 18);
        
        // Black eye patches (iconic panda feature)
        ctx.fillStyle = bodyColor; // Black
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 12 + breathOffset, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 38, this.y + 12 + breathOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // OP glowing eyes
        ctx.fillStyle = pantsColor; // Deep pink accent for OP glow
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 12 + breathOffset, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 38, this.y + 12 + breathOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Panda ears
        ctx.fillStyle = bodyColor; // Black
        ctx.beginPath();
        ctx.arc(this.x + 18, this.y + 8 + breathOffset, 6, 0, Math.PI * 2);
        ctx.arc(this.x + 42, this.y + 8 + breathOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Small black nose
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 29, this.y + 18 + breathOffset, 2, 2);
        
        // Arms (powerful panda arms)
        ctx.fillStyle = bodyColor; // Black
        if (this.attacking && this.attackType === 'punch') {
            const extension = Math.sin(this.attackAnimation / 3) * 15;
            const armX = this.facingRight ? this.x + 45 + extension : this.x + 5 - extension;
            ctx.fillRect(armX, this.y + 30, 12, 25);
            ctx.fillRect(this.facingRight ? this.x + 5 : this.x + 45, this.y + 35, 12, 20);
        } else {
            ctx.fillRect(this.x + 5, this.y + 35, 12, 25);
            ctx.fillRect(this.x + 45, this.y + 35, 12, 25);
        }
        
        // Legs
        ctx.fillStyle = bodyColor; // Black
        if (this.attacking && this.attackType === 'kick') {
            const extension = Math.sin(this.attackAnimation / 3) * 20;
            const legX = this.facingRight ? this.x + 30 + extension : this.x + 15 - extension;
            ctx.fillRect(legX, this.y + 70, 14, 28);
            ctx.fillRect(this.facingRight ? this.x + 15 : this.x + 30, this.y + 75, 14, 23);
        } else {
            ctx.fillRect(this.x + 15, this.y + 75, 14, 23);
            ctx.fillRect(this.x + 30, this.y + 75, 14, 23);
        }
        
        // Panda paws (feet)
        ctx.fillStyle = bodyColor; // Black
        const footBob = Math.abs(this.velocityX) > 0.5 ? Math.sin(this.walkCycle * Math.PI) * 1 : 0;
        ctx.fillRect(this.x + 12, this.y + 95 + footBob, 20, 8);
        ctx.fillRect(this.x + 32, this.y + 95 - footBob, 20, 8);
        
        // Show active abilities
        if (this.zenMeditationActive) {
            // Golden meditation aura
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (this.pandaRageActive) {
            // Red rage aura
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (this.shadowCloneActive) {
            // Purple shadow clone effect
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#4B0082';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + (i * 5), this.y + (i * 3), 60, 98);
            }
            ctx.restore();
        }
    }
    
    drawPoopienLeader(bodyColor, skinColor, pantsColor) {
        // Poopien Leader the Poop drawing
        const breathOffset = Math.sin(this.idleAnimation * 0.1) * 1;
        const stinkWave = Math.sin(this.idleAnimation * 0.15) * 3; // Stink waves
        
        // Main poop body (rounded blob shape)
        ctx.fillStyle = bodyColor; // Brown poop color
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 50 + breathOffset, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Poop swirl on top
        ctx.fillStyle = skinColor; // Darker brown
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 25 + breathOffset, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Second poop layer
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 35 + breathOffset, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top swirl
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 15 + breathOffset, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (angry leader expression)
        ctx.fillStyle = '#FF0000'; // Red angry eyes
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 30 + breathOffset, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 30 + breathOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Evil pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + 30 + breathOffset, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 35, this.y + 30 + breathOffset, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry mouth/grimace
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 27, this.y + 38 + breathOffset, 6, 2);
        
        // Arms (stubby poop arms)
        ctx.fillStyle = bodyColor;
        if (this.attacking && this.attackType === 'punch') {
            const extension = Math.sin(this.attackAnimation / 3) * 10;
            const armX = this.facingRight ? this.x + 50 + extension : this.x + 5 - extension;
            ctx.beginPath();
            ctx.ellipse(armX, this.y + 45, 8, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Other arm
            ctx.beginPath();
            ctx.ellipse(this.facingRight ? this.x + 10 : this.x + 50, this.y + 50, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(this.x + 10, this.y + 50, 8, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + 50, this.y + 50, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Legs (poop stumps)
        ctx.fillStyle = pantsColor; // Even darker brown
        if (this.attacking && this.attackType === 'kick') {
            const extension = Math.sin(this.attackAnimation / 3) * 15;
            const legX = this.facingRight ? this.x + 35 + extension : this.x + 20 - extension;
            ctx.beginPath();
            ctx.ellipse(legX, this.y + 80, 10, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            // Other leg
            ctx.beginPath();
            ctx.ellipse(this.facingRight ? this.x + 20 : this.x + 35, this.y + 82, 10, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(this.x + 20, this.y + 82, 10, 15, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + 35, this.y + 82, 10, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Stink lines (animated)
        ctx.strokeStyle = pantsColor; // Green stink
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 3; i++) {
            const stinkY = this.y + 10 + (i * 8) + stinkWave;
            ctx.beginPath();
            ctx.moveTo(this.x + 15 + (i * 10), stinkY);
            ctx.quadraticCurveTo(this.x + 20 + (i * 10), stinkY - 5, this.x + 25 + (i * 10), stinkY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Show active abilities
        if (this.gasCloudActive) {
            // Toxic gas aura
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (this.fertilizerPowerActive) {
            // Growth/power aura
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 55, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawPokemonGuy(bodyColor, skinColor, pantsColor) {
        // Pokemon Guy the Nerdy Poop with Helicopter Hat
        const breathOffset = Math.sin(this.idleAnimation * 0.1) * 1;
        const helicopterSpin = this.helicopterSpinActive ? (this.idleAnimation * 0.5) : (this.idleAnimation * 0.1);
        
        // Main poop body (similar to Poopien Leader but nerdier)
        ctx.fillStyle = bodyColor; // Brown poop color
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 55 + breathOffset, 22, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Poop swirl layers
        ctx.fillStyle = skinColor; // Darker brown
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 30 + breathOffset, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 40 + breathOffset, 16, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 20 + breathOffset, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nerd glasses (iconic!)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#FFFFFF'; // White lenses
        
        // Left lens
        ctx.beginPath();
        ctx.arc(this.x + 24, this.y + 35 + breathOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right lens
        ctx.beginPath();
        ctx.arc(this.x + 36, this.y + 35 + breathOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Bridge of glasses
        ctx.beginPath();
        ctx.moveTo(this.x + 30, this.y + 35 + breathOffset);
        ctx.lineTo(this.x + 30, this.y + 37 + breathOffset);
        ctx.stroke();
        
        // Eyes behind glasses (focused nerd eyes)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 24, this.y + 35 + breathOffset, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 36, this.y + 35 + breathOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Concentrated mouth (thinking about Pokemon)
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 28, this.y + 42 + breathOffset, 4, 1);
        
        // HELICOPTER HAT! (The best part!)
        ctx.fillStyle = pantsColor; // Orange hat
        ctx.beginPath();
        ctx.ellipse(this.x + 30, this.y + 15 + breathOffset, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat propeller (animated spinning)
        ctx.save();
        ctx.translate(this.x + 30, this.y + 10 + breathOffset);
        ctx.rotate(helicopterSpin);
        
        // Propeller blades
        ctx.fillStyle = '#C0C0C0'; // Silver blades
        ctx.fillRect(-20, -1, 40, 2); // Horizontal blade
        ctx.fillRect(-1, -20, 2, 40); // Vertical blade
        
        ctx.restore();
        
        // Arms (holding pokeballs)
        ctx.fillStyle = bodyColor;
        if (this.attacking && this.attackType === 'punch') {
            const extension = Math.sin(this.attackAnimation / 3) * 12;
            const armX = this.facingRight ? this.x + 48 + extension : this.x + 8 - extension;
            ctx.beginPath();
            ctx.ellipse(armX, this.y + 50, 7, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pokeball in extended hand
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(armX + (this.facingRight ? 8 : -8), this.y + 45, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(armX + (this.facingRight ? 8 : -8), this.y + 45, 2, 0, Math.PI);
            ctx.fill();
            
            // Other arm
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(this.facingRight ? this.x + 12 : this.x + 48, this.y + 52, 7, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(this.x + 12, this.y + 52, 7, 10, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + 48, this.y + 52, 7, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Legs
        ctx.fillStyle = pantsColor;
        if (this.attacking && this.attackType === 'kick') {
            const extension = Math.sin(this.attackAnimation / 3) * 18;
            const legX = this.facingRight ? this.x + 34 + extension : this.x + 22 - extension;
            ctx.beginPath();
            ctx.ellipse(legX, this.y + 84, 9, 16, 0, 0, Math.PI * 2);
            ctx.fill();
            // Other leg
            ctx.beginPath();
            ctx.ellipse(this.facingRight ? this.x + 22 : this.x + 34, this.y + 86, 9, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(this.x + 22, this.y + 86, 9, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(this.x + 34, this.y + 86, 9, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Show Pokemon facts text (when active)
        if (this.pokemonFactTimer > 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentPokemonFact || 'POKEMON FACT!', this.x + 30, this.y - 10);
        }
        
        // Show active abilities
        if (this.helicopterSpinActive) {
            // Spinning wind effect
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#87CEEB';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const radius = 40 + (i * 10);
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        if (this.nerdRageActive) {
            // Red angry nerd aura
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (this.nerdFactsActive) {
            // Blue knowledge aura
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#0066FF';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    drawHumanFighter(bodyColor, skinColor, pantsColor) {
        // Original human fighter drawing
        const breathOffset = Math.sin(this.idleAnimation * 0.1) * 1;
        const headBob = Math.abs(this.velocityX) > 0.5 ? Math.sin(this.walkCycle * Math.PI * 0.5) * 2 : breathOffset;
        
        // Head with animation
        ctx.fillStyle = skinColor;
        ctx.fillRect(this.x + 18, this.y + headBob, 24, 22);
        
        // Hair with slight movement
        ctx.fillStyle = this.name === 'RYU' ? '#2c1810' : '#8b4513';
        ctx.fillRect(this.x + 16, this.y - 2 + headBob, 28, 8);
        
        // Animated eyes with blinking
        ctx.fillStyle = '#000';
        const eyeOffset = this.facingRight ? 0 : 2;
        const blinkFrame = Math.floor(this.idleAnimation / 40) % 3;
        
        if (blinkFrame < 2) { // Eyes open most of the time
            ctx.fillRect(this.x + 22 + eyeOffset, this.y + 8 + headBob, 2, 2);
            ctx.fillRect(this.x + 28 + eyeOffset, this.y + 8 + headBob, 2, 2);
        } else { // Blink
            ctx.fillRect(this.x + 22 + eyeOffset, this.y + 10 + headBob, 2, 1);
            ctx.fillRect(this.x + 28 + eyeOffset, this.y + 10 + headBob, 2, 1);
        }
        
        // Torso/Gi with breathing
        ctx.fillStyle = bodyColor;
        ctx.fillRect(this.x + 12, this.y + 22 + breathOffset * 0.5, 36, 48);
        
        // Belt
        ctx.fillStyle = this.name === 'RYU' ? '#000' : '#8b0000';
        ctx.fillRect(this.x + 12, this.y + 50 + breathOffset * 0.5, 36, 6);
        
        // Animated arms based on state
        ctx.fillStyle = skinColor;
        this.drawAnimatedArms(skinColor, breathOffset);
        
        // Animated legs based on state
        ctx.fillStyle = pantsColor;
        this.drawAnimatedLegs(pantsColor);
        
        // Feet with walking animation
        ctx.fillStyle = '#654321';
        if (!(this.attacking && this.attackType === 'kick')) {
            const footBob = Math.abs(this.velocityX) > 0.5 ? Math.sin(this.walkCycle * Math.PI) * 1 : 0;
            ctx.fillRect(this.x + 14, this.y + 95 + footBob, 18, 8);
            ctx.fillRect(this.x + 28, this.y + 95 - footBob, 18, 8);
        }
    }
    
    drawAnimatedArms(skinColor, breathOffset) {
        if (this.attacking && this.attackType === 'punch') {
            // Animated punching sequence
            const punchProgress = this.attackAnimation / 12;
            const extension = Math.sin(punchProgress * Math.PI) * 20;
            
            const punchArmX = this.facingRight ? this.x + 45 + extension : this.x + 5 - extension;
            const otherArmX = this.facingRight ? this.x + 5 : this.x + 45;
            
            // Extended punching arm with smooth animation
            ctx.fillRect(punchArmX, this.y + 25, 18 + extension * 0.5, 10);
            ctx.fillRect(punchArmX + (this.facingRight ? 15 + extension : -8 - extension), this.y + 23, 8, 8);
            
            // Other arm
            ctx.fillRect(otherArmX, this.y + 28 + breathOffset, 12, 22);
        } else if (this.attacking && this.attackType === 'kick') {
            // Arms in defensive position during kick
            const armSway = Math.sin(this.attackAnimation * 0.5) * 2;
            ctx.fillRect(this.x + 5, this.y + 28 + breathOffset + armSway, 12, 22);
            ctx.fillRect(this.x + 43, this.y + 28 + breathOffset - armSway, 12, 22);
        } else if (Math.abs(this.velocityX) > 0.5) {
            // Walking arm swing
            const armSwing = Math.sin(this.walkCycle * Math.PI * 0.5) * 3;
            ctx.fillRect(this.x + 5, this.y + 28 + armSwing, 12, 22);
            ctx.fillRect(this.x + 43, this.y + 28 - armSwing, 12, 22);
        } else {
            // Idle arms with breathing
            ctx.fillRect(this.x + 5, this.y + 28 + breathOffset, 12, 22);
            ctx.fillRect(this.x + 43, this.y + 28 + breathOffset, 12, 22);
        }
    }
    
    drawAnimatedLegs(pantsColor) {
        if (this.attacking && this.attackType === 'kick') {
            // Animated kicking sequence
            const kickProgress = this.attackAnimation / 12;
            const extension = Math.sin(kickProgress * Math.PI) * 25;
            
            const kickLegX = this.facingRight ? this.x + 32 + extension * 0.5 : this.x + 16 - extension * 0.5;
            const otherLegX = this.facingRight ? this.x + 16 : this.x + 32;
            
            // Extended kicking leg with smooth animation
            ctx.fillRect(kickLegX, this.y + 56, 14, 28);
            ctx.fillRect(kickLegX + (this.facingRight ? 12 + extension : -8 - extension), this.y + 56, 16, 8);
            
            // Supporting leg
            ctx.fillRect(otherLegX, this.y + 70, 14, 30);
        } else if (Math.abs(this.velocityX) > 0.5) {
            // Walking leg animation
            const legOffset = Math.sin(this.walkCycle * Math.PI * 0.5) * 2;
            ctx.fillRect(this.x + 16, this.y + 70 + legOffset, 14, 30);
            ctx.fillRect(this.x + 30, this.y + 70 - legOffset, 14, 30);
        } else {
            // Normal legs
            ctx.fillRect(this.x + 16, this.y + 70, 14, 30);
            ctx.fillRect(this.x + 30, this.y + 70, 14, 30);
        }
    }
    
    drawAttackEffects() {
        const attackProgress = this.attackAnimation / 12;
        
        if (this.attackType === 'punch') {
            // Enhanced punch impact effect with animated particles
            const effectX = this.facingRight ? this.x + 60 + Math.sin(attackProgress * Math.PI) * 10 : this.x - 20 - Math.sin(attackProgress * Math.PI) * 10;
            const effectY = this.y + 25;
            
            // Main impact burst
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(attackProgress * Math.PI)})`;
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + attackProgress * Math.PI;
                const distance = Math.sin(attackProgress * Math.PI) * 15;
                const particleX = effectX + Math.cos(angle) * distance;
                const particleY = effectY + Math.sin(angle) * distance;
                
                ctx.beginPath();
                ctx.arc(particleX, particleY, 3 * Math.sin(attackProgress * Math.PI), 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Speed lines
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(attackProgress * Math.PI) * 0.7})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const lineX = this.facingRight ? this.x + 45 + i * 5 : this.x + 15 - i * 5;
                ctx.beginPath();
                ctx.moveTo(lineX, this.y + 20 + i * 3);
                ctx.lineTo(lineX + (this.facingRight ? 15 : -15), this.y + 25 + i * 3);
                ctx.stroke();
            }
            
        } else if (this.attackType === 'kick') {
            // Enhanced kick impact effect with sweep motion
            const effectX = this.facingRight ? this.x + 60 + Math.sin(attackProgress * Math.PI) * 15 : this.x - 20 - Math.sin(attackProgress * Math.PI) * 15;
            const effectY = this.y + 60;
            
            // Sweeping arc effect
            ctx.strokeStyle = `rgba(255, 200, 0, ${Math.sin(attackProgress * Math.PI)})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            const startAngle = this.facingRight ? -Math.PI/4 : Math.PI + Math.PI/4;
            const endAngle = this.facingRight ? Math.PI/4 : Math.PI - Math.PI/4;
            ctx.arc(this.x + this.width/2, effectY, 30, startAngle, endAngle);
            ctx.stroke();
            
            // Impact particles
            ctx.fillStyle = `rgba(255, 200, 0, ${Math.sin(attackProgress * Math.PI)})`;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + attackProgress * Math.PI * 2;
                const distance = Math.sin(attackProgress * Math.PI) * 20;
                const particleX = effectX + Math.cos(angle) * distance;
                const particleY = effectY + Math.sin(angle) * distance * 0.5;
                
                ctx.beginPath();
                ctx.arc(particleX, particleY, 4 * Math.sin(attackProgress * Math.PI), 0, Math.PI * 2);
                ctx.fill();
            }
            
        } else if (this.attackType === 'special') {
            // Enhanced special attack with multiple layers
            const time = Date.now() * 0.005;
            
            // Inner aura
            ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            const innerSize = 35 + Math.sin(time * 2) * 8;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, innerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Outer aura
            ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
            const outerSize = 50 + Math.sin(time) * 15;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, outerSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Rotating energy particles
            for (let i = 0; i < 12; i++) {
                const angle = (time + i * Math.PI / 6) % (Math.PI * 2);
                const radius = 45 + Math.sin(time * 3 + i) * 10;
                const particleX = this.x + this.width/2 + Math.cos(angle) * radius;
                const particleY = this.y + this.height/2 + Math.sin(angle) * radius * 0.6;
                
                const size = 2 + Math.sin(time * 2 + i) * 2;
                ctx.fillStyle = `rgba(255, 255, ${100 + Math.sin(time + i) * 155}, 0.9)`;
                ctx.beginPath();
                ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Lightning effect
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 10) * 0.3})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const startAngle = (time * 2 + i * Math.PI / 2) % (Math.PI * 2);
                const startX = this.x + this.width/2 + Math.cos(startAngle) * 20;
                const startY = this.y + this.height/2 + Math.sin(startAngle) * 20;
                const endX = this.x + this.width/2 + Math.cos(startAngle) * 60;
                const endY = this.y + this.height/2 + Math.sin(startAngle) * 60;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
    }
    
    drawPlayerName() {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        const nameX = this.x + this.width / 2;
        const nameY = this.y - 25;
        
        ctx.strokeText(this.name, nameX, nameY);
        ctx.fillText(this.name, nameX, nameY);
    }
    
    drawHealthBar() {
        const barWidth = 50;
        const barHeight = 6;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 15;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#0f0' : healthPercent > 0.3 ? '#ff0' : '#f00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    drawSpecialBar() {
        const barWidth = 40;
        const barHeight = 4;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 8;
        
        // Special charge fill
        const chargePercent = this.specialCharge / this.maxSpecialCharge;
        const isReady = this.specialCharge >= 50;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Charge fill with different colors
        if (isReady) {
            // Flashing effect when ready
            const flash = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 0, ${flash})`;
        } else {
            ctx.fillStyle = chargePercent >= 0.25 ? '#ff8800' : '#888';
        }
        ctx.fillRect(barX, barY, barWidth * chargePercent, barHeight);
        
        // "READY" text when special is available
        if (isReady && this.specialCooldown <= 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('READY', barX + barWidth/2, barY + barHeight/2 + 3);
        }
        
        // Border
        ctx.strokeStyle = isReady ? '#ffff00' : '#fff';
        ctx.lineWidth = isReady ? 2 : 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    drawComboCounter() {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const comboX = this.x + this.width / 2;
        const comboY = this.y - 45;
        
        ctx.strokeText(`${this.comboHits} HITS!`, comboX, comboY);
        ctx.fillText(`${this.comboHits} HITS!`, comboX, comboY);
    }
    
    drawSpecialEffects() {
        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2;
        const progress = (30 - this.specialEffectTimer) / 30;
        
        ctx.save();
        ctx.globalAlpha = this.specialEffectTimer / 30;
        
        switch (this.currentSpecialAttack) {
            case 'HADOKEN':
            case 'KIKOKEN':
                this.drawEnergyBallEffect(centerX, centerY, progress, '#4444ff');
                break;
                
            case 'FLAME HADOKEN':
            case 'FLAMING SHORYUKEN':
            case 'BLAZING KICK':
                this.drawFlameEffect(centerX, centerY, progress);
                break;
                
            case 'SHORYUKEN':
                this.drawUppercutEffect(centerX, centerY, progress);
                break;
                
            case 'TATSUMAKI':
            case 'SPINNING BIRD KICK':
            case 'DOUBLE LARIAT':
                this.drawSpinEffect(centerX, centerY, progress);
                break;
                
            case 'LIGHTNING LEGS':
                this.drawLightningEffect(centerX, centerY, progress);
                break;
                
            case 'SCREW PILEDRIVER':
            case 'BANISHING FLAT':
                this.drawGrappleEffect(centerX, centerY, progress);
                break;
                
            default:
                this.drawGenericEffect(centerX, centerY, progress);
                break;
        }
        
        ctx.restore();
    }
    
    drawEnergyBallEffect(x, y, progress, color) {
        const radius = progress * 25;
        
        // Energy ball
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Energy rings
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius + i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawFlameEffect(x, y, progress) {
        const flames = Math.floor(progress * 8) + 3;
        
        for (let i = 0; i < flames; i++) {
            const angle = (i / flames) * Math.PI * 2;
            const distance = progress * 30;
            const fx = x + Math.cos(angle) * distance;
            const fy = y + Math.sin(angle) * distance;
            
            ctx.fillStyle = i % 2 === 0 ? '#ff4400' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(fx, fy, 8 - progress * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawUppercutEffect(x, y, progress) {
        // Rising energy trail
        for (let i = 0; i < 5; i++) {
            const trailY = y - progress * 60 + i * 15;
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress - i * 0.2})`;
            ctx.fillRect(x - 5, trailY, 10, 20);
        }
        
        // Impact burst at top
        if (progress > 0.5) {
            const burstRadius = (progress - 0.5) * 40;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y - 30, burstRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawSpinEffect(x, y, progress) {
        const rotation = progress * Math.PI * 8;
        
        // Spinning energy lines
        for (let i = 0; i < 6; i++) {
            const angle = rotation + (i * Math.PI / 3);
            const length = progress * 40;
            const x1 = x + Math.cos(angle) * 10;
            const y1 = y + Math.sin(angle) * 10;
            const x2 = x + Math.cos(angle) * length;
            const y2 = y + Math.sin(angle) * length;
            
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    drawLightningEffect(x, y, progress) {
        // Electric bolts
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const length = progress * 35;
            const zigzag = Math.sin(progress * 20 + i) * 10;
            
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length + zigzag, y + Math.sin(angle) * length);
            ctx.stroke();
        }
    }
    
    drawGrappleEffect(x, y, progress) {
        // Crushing impact rings
        for (let i = 0; i < 4; i++) {
            const radius = progress * 50 + i * 10;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 5 - i;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawGenericEffect(x, y, progress) {
        const radius = progress * 25;
        
        // Generic energy burst
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // PROJECTILE ATTACKS
    createProjectile(attackName, attackData) {
        const projectile = {
            x: this.facingRight ? this.x + this.width : this.x - 20,
            y: this.y + this.height/2,
            width: 20,
            height: 20,
            velocityX: this.facingRight ? 8 : -8,
            velocityY: 0,
            damage: attackData ? attackData.damage : 20,
            type: attackName,
            life: 120, // 2 seconds at 60fps
            owner: this
        };
        this.projectiles.push(projectile);
    }
    
    // UPPERCUT ATTACKS
    performUppercut(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 25;
        const range = attackData ? attackData.range : 65;
        
        // Launch self upward
        this.velocityY = -12;
        this.y -= 5; // Slight lift
        
        // Check for hit
        const attackX = this.facingRight ? this.x + this.width - 5 : this.x - range + 5;
        const attackY = this.y - 10;
        const attackWidth = range;
        const attackHeight = this.height + 20;
        
        if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
            opponent.velocityY = -10; // Launch opponent upward
            this.hitOpponent(opponent, 'special');
        }
    }
    
    // SPINNING ATTACKS
    performSpinningAttack(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 18;
        const range = attackData ? attackData.range : 90;
        
        // Move forward while spinning
        this.velocityX = this.facingRight ? 6 : -6;
        
        // Use actual range from attack data
        const attackX = this.x - range/4;
        const attackY = this.y;
        const attackWidth = range;
        const attackHeight = this.height;
        
        if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
            this.hitOpponent(opponent, 'special');
        }
        
        // Store attack box for visual effects
        this.lastAttackBox = { x: attackX, y: attackY, width: attackWidth, height: attackHeight };
    }
    
    // MULTI-HIT SPINNING ATTACK
    performMultiHitSpin(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 15;
        const range = attackData ? attackData.range : 120;
        
        // Multiple hits over time
        this.multiHitTimer = 60; // 1 second of multi-hits
        this.multiHitCount = 0;
        this.maxMultiHits = 5;
        this.multiHitRange = range; // Store range for use in multi-hit
        
        this.startMultiHitAttack(opponent, damage);
    }
    
    startMultiHitAttack(opponent, damage) {
        if (this.multiHitTimer > 0 && this.multiHitCount < this.maxMultiHits) {
            if (this.multiHitTimer % 12 === 0) { // Hit every 12 frames
                const range = this.multiHitRange || 120;
                const attackX = this.x - range/4;
                const attackY = this.y;
                const attackWidth = range;
                const attackHeight = this.height;
                
                if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
                    opponent.health = Math.max(0, opponent.health - damage);
                    opponent.velocityX = this.facingRight ? 3 : -3;
                    this.multiHitCount++;
                    
                    // Update health display for multi-hits
                    const healthElement = opponent === player1 ? 
                        document.getElementById('player1Health') : 
                        document.getElementById('player2Health');
                    const healthTextElement = opponent === player1 ?
                        document.getElementById('player1HealthText') :
                        document.getElementById('player2HealthText');
                        
                    if (healthElement) {
                        const healthPercent = (opponent.health / opponent.maxHealth) * 100;
                        healthElement.style.width = healthPercent + '%';
                    }
                    
                    if (healthTextElement) {
                        healthTextElement.textContent = `${Math.max(0, Math.floor(opponent.health))}/${opponent.maxHealth}`;
                    }
                }
            }
            this.multiHitTimer--;
        }
    }
    
    // RAPID KICKS
    performRapidKicks(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 12;
        const range = attackData ? attackData.range : 60;
        
        // Very fast multiple kicks
        this.rapidKickTimer = 45; // 0.75 seconds
        this.rapidKickCount = 0;
        this.maxRapidKicks = 8;
        this.rapidKickRange = range; // Store range for use in rapid kicks
        
        this.startRapidKicks(opponent, damage);
    }
    
    startRapidKicks(opponent, damage) {
        if (this.rapidKickTimer > 0 && this.rapidKickCount < this.maxRapidKicks) {
            if (this.rapidKickTimer % 6 === 0) { // Kick every 6 frames (very fast)
                const range = this.rapidKickRange || 60;
                const attackX = this.facingRight ? this.x + this.width - 5 : this.x - range + 5;
                const attackY = this.y + 30;
                const attackWidth = range;
                const attackHeight = 40;
                
                if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
                    opponent.health = Math.max(0, opponent.health - damage);
                    opponent.velocityX = this.facingRight ? 2 : -2;
                    this.rapidKickCount++;
                    
                    // Update health display for rapid kicks
                    const healthElement = opponent === player1 ? 
                        document.getElementById('player1Health') : 
                        document.getElementById('player2Health');
                    const healthTextElement = opponent === player1 ?
                        document.getElementById('player1HealthText') :
                        document.getElementById('player2HealthText');
                        
                    if (healthElement) {
                        const healthPercent = (opponent.health / opponent.maxHealth) * 100;
                        healthElement.style.width = healthPercent + '%';
                    }
                    
                    if (healthTextElement) {
                        healthTextElement.textContent = `${Math.max(0, Math.floor(opponent.health))}/${opponent.maxHealth}`;
                    }
                }
            }
            this.rapidKickTimer--;
        }
    }
    
    // GRAPPLE ATTACKS
    performGrapple(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 40;
        const range = 50;
        
        // Check if close enough to grapple
        const distance = Math.abs(this.x - opponent.x);
        if (distance <= range) {
            // Pull opponent to this position
            opponent.x = this.facingRight ? this.x + this.width + 5 : this.x - opponent.width - 5;
            opponent.velocityY = -8; // Lift and slam
            
            // Massive damage and knockback
            this.hitOpponent(opponent, 'special');
            opponent.velocityX = this.facingRight ? 12 : -12;
        }
    }
    
    // SPINNING CLOTHESLINE
    performSpinningClothesline(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 22;
        
        // 360-degree attack
        const range = 100;
        const attackX = this.x - range/2;
        const attackY = this.y;
        const attackWidth = range;
        const attackHeight = this.height;
        
        if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
            this.hitOpponent(opponent, 'special');
            opponent.velocityX = this.facingRight ? 8 : -8;
        }
    }
    
    // COMMAND GRAB
    performCommandGrab(attackName, attackData, opponent) {
        const damage = attackData ? attackData.damage : 35;
        const range = 60;
        
        // Check if close enough for command grab
        const distance = Math.abs(this.x - opponent.x);
        if (distance <= range) {
            // Grab and slam
            opponent.x = this.x + (this.facingRight ? this.width : -opponent.width);
            opponent.velocityY = -6;
            
            // High damage
            this.hitOpponent(opponent, 'special');
            opponent.velocityX = this.facingRight ? 10 : -10;
        }
    }
    
    // GENERIC SPECIAL
    performGenericSpecial(attackData, opponent) {
        const damage = attackData ? attackData.damage : 25;
        const range = attackData ? attackData.range : 80;
        
        const attackX = this.facingRight ? this.x + this.width - 5 : this.x - range + 5;
        const attackY = this.y + 10;
        const attackWidth = range;
        const attackHeight = this.height - 20;
        
        if (this.isColliding(attackX, attackY, attackWidth, attackHeight, opponent)) {
            this.hitOpponent(opponent, 'special');
        }
        
        // Store attack box for visual effects
        this.lastAttackBox = { x: attackX, y: attackY, width: attackWidth, height: attackHeight };
    }
    
    // Mommydog's DOGDASH - Sky fire rain then dash behind
    performDogdash(attackData, opponent) {
        this.attackNameTimer = 90;
        this.currentAttackName = 'DOGDASH!';
        
        // Launch into sky
        this.velocityY = -20;
        this.y -= 100;
        
        // Start rain fire effect
        this.rainFireActive = true;
        this.rainFireTimer = 120; // 2 seconds of fire rain
        
        // After delay, dash behind enemy
        setTimeout(() => {
            if (opponent) {
                this.x = opponent.facingRight ? opponent.x - this.width - 10 : opponent.x + opponent.width + 10;
                this.facingRight = !opponent.facingRight;
                this.y = this.groundY - this.height;
                this.velocityY = 0;
                
                // Deal damage
                this.hitOpponent(opponent, 'special');
                screenShake = 12;
            }
        }, 1000);
        
        // Create fire rain particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -50,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 8 + 5,
                life: 60,
                color: '#FF4500' // Orange-red fire
            });
        }
    }
    
    // Mommydog's ZEUS - Lightning attack
    performZeus(attackData, opponent) {
        this.attackNameTimer = 90;
        this.currentAttackName = 'ZEUS LIGHTNING!';
        
        // Create lightning effect
        const lightningX = opponent.x + opponent.width/2;
        
        // Lightning particles from sky to opponent
        for (let i = 0; i < 25; i++) {
            particles.push({
                x: lightningX + (Math.random() - 0.5) * 20,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 3,
                vy: 0,
                life: 30,
                color: '#FFFF00' // Bright yellow lightning
            });
        }
        
        // Deal lightning damage
        this.hitOpponent(opponent, 'special');
        opponent.stunned = true;
        opponent.stunTimer = 60; // 1 second stun
        
        screenShake = 15;
    }
    
    // Mommydog's BLOWDRYER - Wall slam and stun
    performBlowdryer(attackData, opponent) {
        this.attackNameTimer = 90;
        this.currentAttackName = 'BLOWDRYER BLAST!';
        
        // Blow opponent against the wall
        const direction = this.facingRight ? 1 : -1;
        opponent.velocityX = direction * 15;
        opponent.x = direction > 0 ? canvas.width - opponent.width - 10 : 10;
        
        // Deal damage and apply long stun
        this.hitOpponent(opponent, 'special');
        opponent.blowdryerStunTimer = 300; // 5 seconds
        opponent.stunned = true;
        opponent.stunTimer = 300;
        
        // Create wind effect particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x + (this.facingRight ? this.width : 0),
                y: this.y + 30,
                vx: direction * (Math.random() * 6 + 4),
                vy: (Math.random() - 0.5) * 4,
                life: 40,
                color: '#87CEEB' // Light blue wind
            });
        }
        
        screenShake = 10;
    }
    
    // PROJECTILE MANAGEMENT
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            projectile.life--;
            
            // Check collision with opponent
            const opponent = this === player1 ? player2 : player1;
            if (this.isColliding(projectile.x, projectile.y, projectile.width, projectile.height, opponent)) {
                opponent.health = Math.max(0, opponent.health - projectile.damage);
                opponent.velocityX = projectile.velocityX > 0 ? 6 : -6;
                opponent.hitCooldown = 20;
                opponent.stunned = true;
                
                // Update health display for projectile hits
                const healthElement = opponent === player1 ? 
                    document.getElementById('player1Health') : 
                    document.getElementById('player2Health');
                const healthTextElement = opponent === player1 ?
                    document.getElementById('player1HealthText') :
                    document.getElementById('player2HealthText');
                    
                if (healthElement) {
                    const healthPercent = (opponent.health / opponent.maxHealth) * 100;
                    healthElement.style.width = healthPercent + '%';
                }
                
                if (healthTextElement) {
                    healthTextElement.textContent = `${Math.max(0, Math.floor(opponent.health))}/${opponent.maxHealth}`;
                }
                
                // Remove projectile after hit
                this.projectiles.splice(i, 1);
                
                // Screen shake on projectile hit
                screenShake = 5;
                continue;
            }
            
            // Remove projectile if it goes off screen or expires
            if (projectile.x < -50 || projectile.x > canvas.width + 50 || projectile.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update multi-hit attacks
        if (this.multiHitTimer > 0) {
            const opponent = this === player1 ? player2 : player1;
            this.startMultiHitAttack(opponent, 15);
        }
        
        // Update rapid kicks
        if (this.rapidKickTimer > 0) {
            const opponent = this === player1 ? player2 : player1;
            this.startRapidKicks(opponent, 12);
        }
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            ctx.save();
            
            switch (projectile.type) {
                case 'HADOKEN':
                case 'KIKOKEN':
                    this.drawEnergyProjectile(projectile, '#4444ff');
                    break;
                case 'FLAME HADOKEN':
                    this.drawFlameProjectile(projectile);
                    break;
                default:
                    this.drawGenericProjectile(projectile);
                    break;
            }
            
            ctx.restore();
        });
    }
    
    drawEnergyProjectile(projectile, color) {
        const time = Date.now() * 0.01;
        
        // Energy ball with rotating rings
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(projectile.x + projectile.width/2, projectile.y + projectile.height/2, projectile.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating energy rings
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(projectile.x + projectile.width/2, projectile.y + projectile.height/2, 
                   projectile.width/2 + i * 5 + Math.sin(time + i) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawFlameProjectile(projectile) {
        const centerX = projectile.x + projectile.width/2;
        const centerY = projectile.y + projectile.height/2;
        
        // Fire effects
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + Date.now() * 0.02;
            const radius = 8 + Math.sin(Date.now() * 0.03 + i) * 3;
            const fx = centerX + Math.cos(angle) * radius;
            const fy = centerY + Math.sin(angle) * radius;
            
            ctx.fillStyle = i % 2 === 0 ? '#ff4400' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawGenericProjectile(projectile) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
    
    drawAttackName() {
        if (!this.currentSpecialAttack) return;
        
        const centerX = this.x + this.width/2;
        const centerY = this.y - 60;
        const alpha = this.attackNameTimer / 60;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(centerX - 60, centerY - 15, 120, 30);
        
        // Border
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 60, centerY - 15, 120, 30);
        
        // Attack name text
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentSpecialAttack, centerX, centerY);
        
        ctx.restore();
    }
}

// Create players (will be initialized based on character selection)
let player1, player2;

function createPlayers() {
    // Use defaults if no character selected (for initial game load)
    const char1 = characters[selectedChar1 || 'RYU'];
    const char2 = characters[selectedChar2 || 'KEN'];
    
    // Initialize platforms for current background
    platforms = [...backgrounds[currentBackground].platforms];
    
    player1 = new Fighter(100, 0, char1.name, {
        left: 'a',
        right: 'd',
        up: 'w',
        down: 's',
        punch: 'z',
        kick: 'x',
        block: 'c',
        special: ' '
    }, char1.colors, true);
    
    player2 = new Fighter(650, 0, char2.name, {
        left: 'arrowleft',
        right: 'arrowright',
        up: 'arrowup',
        down: 'arrowdown',
        punch: '8',
        kick: '0',
        block: '9',
        special: 'enter'
    }, char2.colors, false);
    
    // Apply character stats with safety checks
    player1.speed = Number(char1.stats.speed) || 3;
    player1.baseSpeed = Number(char1.stats.speed) || 3;
    player1.powerMultiplier = Number(char1.stats.power) || 1;
    player1.defenseMultiplier = Number(char1.stats.defense) || 1;
    
    player2.speed = Number(char2.stats.speed) || 3;
    player2.baseSpeed = Number(char2.stats.speed) || 3;
    player2.powerMultiplier = Number(char2.stats.power) || 1;
    player2.defenseMultiplier = Number(char2.stats.defense) || 1;
    
    // Give players some initial special charge for testing
    player1.specialCharge = 50;
    player2.specialCharge = 50;
    
    // Initialize special attack timers
    player1.multiHitTimer = 0;
    player1.multiHitCount = 0;
    player1.rapidKickTimer = 0;
    player1.rapidKickCount = 0;
    player1.attackNameTimer = 0;
    player2.multiHitTimer = 0;
    player2.multiHitCount = 0;
    player2.rapidKickTimer = 0;
    player2.rapidKickCount = 0;
    player2.attackNameTimer = 0;
    player1.flashTimer = 0;
    player2.flashTimer = 0;
}

// Initialize players
createPlayers();

// Game timer
function startGameTimer() {
    gameTimer = setInterval(() => {
        if (gameState === 'playing' && gameTime > 0) {
            gameTime--;
            try {
                document.getElementById('timer').textContent = gameTime;
            } catch (error) {
                // Timer UI not available, continue silently
            }
            
            if (gameTime <= 0) {
                // Time's up - player with more health wins
                if (player1.health > player2.health) {
                    endRound(player1);
                } else if (player2.health > player1.health) {
                    endRound(player2);
                } else {
                    endRound(null); // Draw
                }
            }
        }
    }, 1000);
}

// End round
function endRound(winner) {
    if (winner === player1) {
        player1Wins++;
    } else if (winner === player2) {
        player2Wins++;
    }
    
    const winnerDisplay = document.getElementById('winnerDisplay');
    
    // Check if someone won the match
    if (player1Wins >= roundsToWin) {
        gameState = 'gameOver';
        winnerDisplay.textContent = `${player1.name} WINS THE MATCH!`;
        
        // Return to menu after showing winner
        setTimeout(() => {
            returnToMenu();
        }, 4000);
    } else if (player2Wins >= roundsToWin) {
        gameState = 'gameOver';
        winnerDisplay.textContent = `${player2.name} WINS THE MATCH!`;
        
        // Return to menu after showing winner
        setTimeout(() => {
            returnToMenu();
        }, 4000);
    } else {
        // Next round
        currentRound++;
        winnerDisplay.textContent = `ROUND ${currentRound - 1}: ${winner ? winner.name : 'DRAW'} WINS!`;
        
        // Reset for next round after delay
        setTimeout(() => {
            startNextRound();
        }, 2000);
    }
    
    winnerDisplay.style.display = 'block';
    
    // Flash effect
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        winnerDisplay.style.opacity = winnerDisplay.style.opacity === '0' ? '1' : '0';
        flashCount++;
        if (flashCount >= 6) {
            clearInterval(flashInterval);
            winnerDisplay.style.opacity = '1';
        }
    }, 300);
}

function startNextRound() {
    // Reset fighters for next round
    player1.health = player1.maxHealth;
    player2.health = player2.maxHealth;
    player1.x = 100;
    player2.x = 650;
    player1.y = player1.groundY - player1.height;
    player2.y = player2.groundY - player2.height;
    player1.velocityX = 0;
    player1.velocityY = 0;
    player2.velocityX = 0;
    player2.velocityY = 0;
    player1.specialCharge = 0;
    player2.specialCharge = 0;
    player1.comboHits = 0;
    player2.comboHits = 0;
    player1.projectiles = [];
    player2.projectiles = [];
    player1.multiHitTimer = 0;
    player2.multiHitTimer = 0;
    player1.rapidKickTimer = 0;
    player2.rapidKickTimer = 0;
    player1.attackNameTimer = 0;
    player2.attackNameTimer = 0;
    player1.flashTimer = 0;
    player2.flashTimer = 0;
    player1.flashTimer = 0;
    player2.flashTimer = 0;
    player1.attacking = false;
    player2.attacking = false;
    player1.blocking = false;
    player2.blocking = false;
    player1.stunned = false;
    player2.stunned = false;
    
    // Reset UI
    document.getElementById('player1Health').style.width = '100%';
    document.getElementById('player2Health').style.width = '100%';
    
    // Update health text
    try {
        document.getElementById('player1HealthText').textContent = '100/100';
        document.getElementById('player2HealthText').textContent = '100/100';
    } catch (error) {
        // Health text elements not available yet
    }
    
    // Update health text
    try {
        document.getElementById('player1HealthText').textContent = '100/100';
        document.getElementById('player2HealthText').textContent = '100/100';
    } catch (error) {
        // Health text elements not available yet
    }
    document.getElementById('winnerDisplay').style.display = 'none';
    
    gameTime = 99;
    try {
        document.getElementById('timer').textContent = gameTime;
    } catch (error) {
        // Timer element not available
    }
}

// Return to main menu function
function returnToMenu() {
    // Reset all game state
    gameState = 'menu';
    showCharacterSelect = false;
    showCharacterStats = false;
    showSpecialSelect = false;
    selectedCharForStats = null;
    menuOption = 0;
    
    // Hide HUD when returning to menu
    const hudElement = document.querySelector('.hud');
    const controlsElement = document.querySelector('.controls');
    if (hudElement) hudElement.style.display = 'none';
    if (controlsElement) controlsElement.style.display = 'none';
    
    // Reset match state
    currentRound = 1;
    player1Wins = 0;
    player2Wins = 0;
    
    // Reset character selections
    selectedChar1 = null;
    selectedChar2 = null;
    selectedSpecialAttacks.player1 = null;
    selectedSpecialAttacks.player2 = null;
    
    // Clear any active projectiles and timers
    if (typeof player1 !== 'undefined') {
        player1.projectiles = [];
        player1.multiHitTimer = 0;
        player1.rapidKickTimer = 0;
        player1.attackNameTimer = 0;
        player1.flashTimer = 0;
    }
    if (typeof player2 !== 'undefined') {
        player2.projectiles = [];
        player2.multiHitTimer = 0;
        player2.rapidKickTimer = 0;
        player2.attackNameTimer = 0;
    player1.flashTimer = 0;
    player2.flashTimer = 0;
        player2.flashTimer = 0;
    }
    
    // Hide winner display
    try {
        document.getElementById('winnerDisplay').style.display = 'none';
    } catch (error) {
        // UI not available
    }
    
    // Clear any timers
    if (gameTimer) {
        clearInterval(gameTimer);
    }
}



// Handle menu and game keys
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (gameState === 'menu') {
        if (showControls || showCharacterSelect || showCharacterStats || showSpecialSelect) {
            if (showSpecialSelect) {
                handleSpecialSelectInput(key);
            } else if (showCharacterStats) {
                handleCharacterStatsInput(key);
            } else if (showCharacterSelect) {
                handleCharacterSelectInput(key);
            } else if (key === 'escape' || key === ' ' || key === 'enter') {
                showControls = false;
            }
        } else {
            if (key === 'arrowup' || key === 'w') {
                menuOption = Math.max(0, menuOption - 1);
            } else if (key === 'arrowdown' || key === 's') {
                menuOption = Math.min(1, menuOption + 1);
            } else if (key === 'enter' || key === ' ') {
                if (menuOption === 0) {
                    showCharacterSelect = true;
                    // Keep HUD hidden during character selection
                    const hudElement = document.querySelector('.hud');
                    if (hudElement) hudElement.style.display = 'none';
                } else if (menuOption === 1) {
                    showControls = true;
                }
            }
        }

    } else if (key === 'escape' && gameState === 'gameOver') {
        returnToMenu();
    }
});

function startGame() {
    gameState = 'playing';
    showCharacterSelect = false;
    showCharacterStats = false;
    showSpecialSelect = false;
    
    // Show HUD when gameplay starts
    const hudElement = document.querySelector('.hud');
    const controlsElement = document.querySelector('.controls');
    if (hudElement) hudElement.style.display = 'flex';
    if (controlsElement) controlsElement.style.display = 'block';
    
    gameState = 'playing';
    gameTime = 99;
    currentRound = 1;
    player1Wins = 0;
    player2Wins = 0;
    comboCounter1 = 0;
    comboCounter2 = 0;
    
    // Recreate players with selected characters
    createPlayers();
    
    // Reset UI with error handling
    try {
        document.getElementById('player1Health').style.width = '100%';
        document.getElementById('player2Health').style.width = '100%';
        document.getElementById('timer').textContent = gameTime;
        document.getElementById('winnerDisplay').style.display = 'none';
        document.getElementById('player1Name').textContent = selectedChar1 || 'RYU';
        document.getElementById('player2Name').textContent = selectedChar2 || 'KEN';
    } catch (error) {
        // Gracefully handle DOM element access errors
        console.warn('Could not update UI elements:', error);
    }
    
    startGameTimer();
}

// Game loop
function gameLoop() {
    try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply screen shake
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.save();
            ctx.translate(shakeX, shakeY);
            screenShake *= 0.9; // Decay shake
            if (screenShake < 0.1) screenShake = 0;
        }
        
        // Control HUD visibility based on game state
        const hudElement = document.querySelector('.hud');
        const controlsElement = document.querySelector('.controls');
        
        if (gameState === 'menu') {
            // Hide HUD and controls on menu
            if (hudElement) hudElement.style.display = 'none';
            if (controlsElement) controlsElement.style.display = 'none';
            drawMenu();
        } else {
            // Show HUD and controls during gameplay
            if (hudElement) hudElement.style.display = 'flex';
            if (controlsElement) controlsElement.style.display = 'block';
        // Draw background elements
        drawBackground();
        
        if (gameState === 'playing') {
            // Update fighters
            player1.update();
            player2.update();
            
            // Make fighters face each other
            if (Math.abs(player1.x - player2.x) > 20) {
                if (player1.x < player2.x) {
                    player1.facingRight = true;
                    player2.facingRight = false;
                } else {
                    player1.facingRight = false;
                    player2.facingRight = true;
                }
            }
        }
        
        // Draw fighters
        if (player1) player1.draw();
        if (player2) player2.draw();
        
        // Draw round info
        if (gameState === 'playing') {
            drawRoundInfo();
        } else if (gameState === 'gameOver') {
            drawGameOverScreen();
        }
    }
        // Restore canvas transform if screen shake was applied
        if (screenShake >= 0.1) {
            ctx.restore();
        }
    } catch (error) {
        console.error("Error in gameLoop:", error);
    }
    
    requestAnimationFrame(gameLoop);
}

// Draw menu screen
function drawMenu() {
    // Animated background
    const time = Date.now() * 0.003;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${Math.sin(time) * 30 + 240}, 70%, 20%)`);
    gradient.addColorStop(0.5, `hsl(${Math.sin(time + 1) * 30 + 260}, 60%, 15%)`);
    gradient.addColorStop(1, `hsl(${Math.sin(time + 2) * 30 + 280}, 50%, 10%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animated particles
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i) * 100 + canvas.width / 2 + (i * 16) % canvas.width) % canvas.width;
        const y = (Math.cos(time * 0.7 + i) * 50 + canvas.height / 2 + (i * 23) % canvas.height) % canvas.height;
        const alpha = (Math.sin(time * 2 + i) + 1) * 0.3;
        
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (showSpecialSelect) {
        drawSpecialSelectScreen();
    } else if (showCharacterStats) {
        drawCharacterStatsScreen();
    } else if (showControls) {
        drawControlsScreen();
    } else if (showCharacterSelect) {
        drawCharacterSelectScreen();
    } else {
        drawMainMenu();
    }
}

function drawMainMenu() {
    const time = Date.now() * 0.005;
    
    // Title with glow effect
    ctx.font = 'bold 72px Orbitron';
    ctx.textAlign = 'center';
    
    // Glow effect
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffd700';
    ctx.fillText('STREET FIGHTER', canvas.width / 2, 150);
    ctx.fillText('RETRO', canvas.width / 2, 220);
    ctx.shadowBlur = 0;
    
    // Subtitle
    ctx.font = 'bold 24px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.fillText('The Ultimate Fighting Experience', canvas.width / 2, 270);
    
    // Menu options with hover detection
    const options = ['START GAME', 'CONTROLS'];
    ctx.font = 'bold 32px Orbitron';
    
    for (let i = 0; i < options.length; i++) {
        const y = 350 + i * 60;
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = y - 35;
        
        // Check if mouse is hovering over this option
        const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                         mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
        const isSelected = i === menuOption || isHovered;
        
        // Draw button background
        if (isHovered) {
            ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
            ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            ctx.strokeStyle = '#ff4500';
            ctx.lineWidth = 2;
            ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        if (isSelected) {
            // Selected/hovered option glow
            ctx.shadowColor = '#ff4500';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff4500';
            
            // Pulsing effect
            const pulse = isHovered ? 1.1 : Math.sin(time * 3) * 0.1 + 1;
            ctx.font = `bold ${32 * pulse}px Orbitron`;
            
            // Selection indicator
            if (isHovered) {
                ctx.fillText(options[i], canvas.width / 2, y);
            } else {
                ctx.fillText('► ' + options[i] + ' ◄', canvas.width / 2, y);
            }
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ccc';
            ctx.font = 'bold 32px Orbitron';
            ctx.fillText(options[i], canvas.width / 2, y);
        }
    }
    
    ctx.shadowBlur = 0;
    
    // Instructions
    ctx.font = '18px Orbitron';
    ctx.fillStyle = '#888';
    ctx.fillText('Click on options or use ↑↓/W/S to navigate, ENTER/SPACE to select', canvas.width / 2, canvas.height - 30);
}

function drawControlsScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.font = 'bold 48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('CONTROLS', canvas.width / 2, 80);
    
    // Controls layout
    const controls = [
                { title: 'PLAYER 1', color: '#ff6b6b' },
        { text: 'W A S D - Movement', color: '#fff' },
        { text: 'Z - Punch', color: '#fff' },
        { text: 'X - Kick', color: '#fff' },
        { text: 'C - Block', color: '#fff' },
        { text: 'SPACE - Special Attack (need 50% charge)', color: '#ffff00' },
        { text: 'DOWN+Z - Sweep Attack (knocks down)', color: '#ff8800' },
        { text: 'MOMMYDOG: Q - Kibble Blast, E - Dogatadge, R - Reflectoshield', color: '#D2691E' },
        { text: 'DOUG: T - Bamboo Burst, Y - Shadow Clone, U - Zen Meditation', color: '#FFD700' },
        { text: 'POOPIEN LEADER: I - Stink Bomb, O - Sludge Slide, P - Gas Cloud', color: '#8B4513' },
        { text: 'POKEMON GUY: K - Pokeball Throw, L - Helicopter Spin, ; - Nerd Facts', color: '#FF6347' },
        { text: '', color: '#fff' },
        { title: 'PLAYER 2', color: '#4ecdc4' },
        { text: 'Arrow Keys - Movement', color: '#fff' },
        { text: '8 - Punch', color: '#fff' },
        { text: '0 - Kick', color: '#fff' },
        { text: '9 - Block', color: '#fff' },
                    { text: 'ENTER - Special Attack (need 50% charge)', color: '#ffff00' },
        { text: 'DOWN+8 - Sweep Attack (knocks down)', color: '#ff8800' },
        { text: 'Same character abilities: MOMMYDOG, DOUG, POOPIEN LEADER, or POKEMON GUY', color: '#fff' },
        { text: '', color: '#fff' },
        { title: 'GENERAL', color: '#ffd700' },
        { text: 'B - Change Background (in menu)', color: '#fff' },
        { text: 'ESC - Back to Menu', color: '#fff' }
    ];
    
    ctx.font = '24px Orbitron';
    let y = 140;
    
    controls.forEach(control => {
        if (control.title) {
            ctx.font = 'bold 28px Orbitron';
            ctx.fillStyle = control.color;
        } else {
            ctx.font = '20px Orbitron';
            ctx.fillStyle = control.color;
        }
        
        ctx.fillText(control.title || control.text, canvas.width / 2, y);
        y += control.title ? 35 : 25;
    });
    
    // Clickable back button
    const backButtonWidth = 200;
    const backButtonHeight = 40;
    const backButtonX = canvas.width / 2 - backButtonWidth / 2;
    const backButtonY = canvas.height - 60;
    
    const isBackHovered = mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
                         mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight;
    
    // Draw back button
    ctx.fillStyle = isBackHovered ? 'rgba(255, 69, 0, 0.5)' : 'rgba(100, 100, 100, 0.3)';
    ctx.fillRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    
    ctx.strokeStyle = isBackHovered ? '#ff4500' : '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    
    // Back instruction
    ctx.font = '18px Orbitron';
    ctx.fillStyle = isBackHovered ? '#ff4500' : '#888';
    ctx.fillText('CLICK TO GO BACK', canvas.width / 2, backButtonY + 25);
}

// Character selection variables
let charSelectCursor = 0; // 0-7 for characters (RYU, KEN, CHUN-LI, ZANGIEF, MOMMYDOG, DOUG, POOPIEN LEADER, POKEMON GUY)
let selectingPlayer = 1; // Which player is selecting

function drawCharacterSelectScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.font = 'bold 48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('CHARACTER SELECT', canvas.width / 2, 60);
    
    // Current player selection indicator
    ctx.font = 'bold 28px Orbitron';
    if (selectingPlayer === 1) {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('PLAYER 1 - CHOOSE YOUR FIGHTER!', canvas.width / 2, 110);
    } else {
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('PLAYER 2 - CHOOSE YOUR FIGHTER!', canvas.width / 2, 110);
    }
    
    // Player selections display
    ctx.font = 'bold 20px Orbitron';
    ctx.fillStyle = selectedChar1 ? '#ff6b6b' : '#666';
    ctx.fillText(`P1: ${selectedChar1 || 'NOT SELECTED'}`, 150, 140);
    
    ctx.fillStyle = selectedChar2 ? '#4ecdc4' : '#666';
    ctx.fillText(`P2: ${selectedChar2 || 'NOT SELECTED'}`, 650, 140);
    
    // Character roster
    const charNames = Object.keys(characters);
    const charPosX = [80, 170, 260, 350, 440, 530, 620, 710]; // 8 positions evenly spaced
    const charY = 200;
    
    charNames.forEach((charName, index) => {
        const char = characters[charName];
        const x = charPosX[index];
        const isSelected = index === charSelectCursor;
        const isPlayer1 = selectedChar1 === charName;
        const isPlayer2 = selectedChar2 === charName;
        const isAlreadyTaken = (selectingPlayer === 1 && isPlayer2) || (selectingPlayer === 2 && isPlayer1);
        
        // Check if mouse is hovering over this character
        const portraitWidth = 100; // Made slightly smaller to fit 5 characters
        const portraitHeight = 160;
        const portraitX = x - 50;
        const portraitY = charY - 50;
        
        const isHovered = mouseX >= portraitX && mouseX <= portraitX + portraitWidth &&
                         mouseY >= portraitY && mouseY <= portraitY + portraitHeight && !isAlreadyTaken;
        
        // Character portrait background with hover effect
        if (isHovered) {
            ctx.fillStyle = selectingPlayer === 1 ? '#ff6b6b' : '#4ecdc4';
            ctx.fillRect(portraitX - 3, portraitY - 3, portraitWidth + 6, portraitHeight + 6);
        }
        
        // Dim character if already taken
        const opacity = isAlreadyTaken ? 0.3 : 1.0;
        
        ctx.fillStyle = isSelected || isHovered ? '#ffd700' : (isAlreadyTaken ? '#222' : '#333');
        ctx.fillRect(portraitX, portraitY, portraitWidth, portraitHeight);
        
        // Character colors
        ctx.globalAlpha = opacity;
        ctx.fillStyle = char.colors.body;
        ctx.fillRect(x - 50, charY - 30, 100, 80);
        
        ctx.fillStyle = char.colors.skin;
        ctx.fillRect(x - 30, charY - 45, 60, 40);
        
        ctx.fillStyle = char.colors.pants;
        ctx.fillRect(x - 40, charY + 50, 80, 40);
        ctx.globalAlpha = 1.0;
        
        // Character name  
        ctx.font = 'bold 14px Orbitron'; // Slightly smaller font for 5 characters
        ctx.fillStyle = isAlreadyTaken ? '#666' : ((isSelected || isHovered) ? '#000' : '#fff');
        ctx.textAlign = 'center';
        ctx.fillText(charName, x, charY + 130);
        
        // Player assignments
        if (isPlayer1) {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText('P1', x - 40, charY - 60);
        }
        if (isPlayer2) {
            ctx.fillStyle = '#4ecdc4';
            ctx.fillText('P2', x + 40, charY - 60);
        }
        
        // "TAKEN" indicator
        if (isAlreadyTaken) {
            ctx.font = 'bold 12px Orbitron';
            ctx.fillStyle = '#ff0000';
            ctx.fillText('TAKEN', x, charY + 20);
        }
        
        // Character stats preview
        ctx.font = '9px Orbitron';
        ctx.fillStyle = isAlreadyTaken ? '#444' : '#aaa';
        ctx.fillText(`STR:${char.stats.strength}`, x - 35, charY + 145);
        ctx.fillText(`AGI:${char.stats.agility}`, x, charY + 145);
        ctx.fillText(`END:${char.stats.endurance}`, x + 35, charY + 145);
        ctx.fillText(`CLICK FOR DETAILS`, x, charY + 160);
        
        // Hover effect indicator
        if (isHovered) {
            ctx.strokeStyle = selectingPlayer === 1 ? '#ff6b6b' : '#4ecdc4';
            ctx.lineWidth = 4;
            ctx.strokeRect(portraitX, portraitY, portraitWidth, portraitHeight);
        }
    });
    
    // Instructions for special attacks
    ctx.font = '16px Orbitron';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('Click on a character to view their detailed stats and special attacks', canvas.width / 2, 420);
    
    // Progress indicator
    ctx.font = '16px Orbitron';
    ctx.fillStyle = '#ffd700';
    if (selectingPlayer === 1) {
        ctx.fillText('Step 1 of 2: Player 1 Selection', canvas.width / 2, 450);
    } else {
        ctx.fillText('Step 2 of 2: Player 2 Selection', canvas.width / 2, 450);
    }
    
    // Instructions
    ctx.font = '14px Orbitron';
    ctx.fillStyle = '#888';
    ctx.fillText('Click on available characters to select', canvas.width / 2, 480);
    
    // Back button
    const backButtonWidth = 120;
    const backButtonHeight = 35;
    const backButtonX = 50;
    const backButtonY = canvas.height - 60;
    
    const isBackHovered = mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
                         mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight;
    
    // Draw back button
    ctx.fillStyle = isBackHovered ? 'rgba(255, 69, 0, 0.7)' : 'rgba(100, 100, 100, 0.5)';
    ctx.fillRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    
    ctx.strokeStyle = isBackHovered ? '#ff4500' : '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    
    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = isBackHovered ? '#ff4500' : '#ccc';
    ctx.textAlign = 'center';
    ctx.fillText('← BACK', backButtonX + backButtonWidth/2, backButtonY + 22);
    

}

function handleCharacterSelectInput(key) {
    const charNames = Object.keys(characters);
    
    if (key === 'arrowleft') {
        charSelectCursor = Math.max(0, charSelectCursor - 1);
    } else if (key === 'arrowright') {
        charSelectCursor = Math.min(charNames.length - 1, charSelectCursor + 1);
    } else if (key === 'enter') {
        const selectedChar = charNames[charSelectCursor];
        
        // Check if character is already taken by the other player
        const isAlreadyTaken = (selectingPlayer === 1 && selectedChar2 === selectedChar) || 
                              (selectingPlayer === 2 && selectedChar1 === selectedChar);
        
        if (!isAlreadyTaken) {
            // Show character stats popup (same as clicking)
            selectedCharForStats = selectedChar;
            showCharacterStats = true;
        }
    } else if (key === 'escape') {
        showCharacterSelect = false;
        selectingPlayer = 1;
        // Reset selections
        selectedChar1 = null;
        selectedChar2 = null;
        selectedSpecialAttacks.player1 = null;
        selectedSpecialAttacks.player2 = null;
    }
}

// Add click support for the controls screen back button
function handleControlsClick() {
    const backButtonWidth = 200;
    const backButtonHeight = 40;
    const backButtonX = canvas.width / 2 - backButtonWidth / 2;
    const backButtonY = canvas.height - 60;
    
    if (mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
        mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight) {
        showControls = false;
    }
}

// Draw background
function drawBackground() {
    const bg = backgrounds[currentBackground];
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bg.color);
    gradient.addColorStop(1, adjustBrightness(bg.color, -0.3));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = adjustBrightness(bg.color, -0.5);
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
    
    // Draw decorations
    bg.decorations.forEach(decoration => {
        drawDecoration(decoration);
    });
    
    // Draw platforms
    platforms.forEach(platform => {
        drawPlatform(platform);
    });
}

function adjustBrightness(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount * 255;
    let g = (num >> 8 & 0x00FF) + amount * 255;
    let b = (num & 0x0000FF) + amount * 255;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function drawDecoration(decoration) {
    ctx.fillStyle = decoration.color;
    
    switch(decoration.type) {
        case 'building':
            ctx.fillRect(decoration.x, decoration.y, 80, canvas.height - decoration.y - 120);
            // Windows
            ctx.fillStyle = '#FFFF00';
            for (let i = 0; i < 12; i++) {
                const row = Math.floor(i / 4);
                const col = i % 4;
                ctx.fillRect(decoration.x + 10 + col * 15, decoration.y + 20 + row * 25, 8, 12);
            }
            break;
        case 'pillar':
            ctx.fillRect(decoration.x, decoration.y, 25, canvas.height - decoration.y - 120);
            ctx.fillRect(decoration.x - 5, decoration.y, 35, 20);
            break;
        case 'smokestack':
            ctx.fillRect(decoration.x, decoration.y, 20, canvas.height - decoration.y - 120);
            ctx.fillStyle = '#A0A0A0';
            ctx.fillRect(decoration.x + 5, decoration.y - 20, 10, 25);
            break;
        case 'crane':
            ctx.fillRect(decoration.x, decoration.y, 15, canvas.height - decoration.y - 120);
            ctx.fillRect(decoration.x - 30, decoration.y + 20, 80, 8);
            break;
        case 'cloud':
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(decoration.x + i * 15, decoration.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
}

function drawPlatform(platform) {
    // Platform base
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Platform highlight (top edge)
    ctx.fillStyle = adjustBrightness(platform.color, 0.2);
    ctx.fillRect(platform.x, platform.y, platform.width, 3);
    
    // Platform shadow (bottom edge)
    ctx.fillStyle = adjustBrightness(platform.color, -0.3);
    ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
    
    // Hardness indicator (visual roughness)
    if (platform.hardness > 1.0) {
        // Metal platforms - add rivets
        ctx.fillStyle = '#404040';
        for (let i = 0; i < platform.width; i += 20) {
            ctx.fillRect(platform.x + i + 5, platform.y + 5, 3, 3);
            if (platform.height > 15) {
                ctx.fillRect(platform.x + i + 5, platform.y + platform.height - 8, 3, 3);
            }
        }
    } else if (platform.hardness < 0.8) {
        // Soft platforms - add texture lines
        ctx.strokeStyle = adjustBrightness(platform.color, -0.2);
        ctx.lineWidth = 1;
        for (let i = 0; i < platform.width; i += 8) {
            ctx.beginPath();
            ctx.moveTo(platform.x + i, platform.y + 2);
            ctx.lineTo(platform.x + i, platform.y + platform.height - 2);
            ctx.stroke();
        }
    }
}

// Initialize game
startGameTimer();
gameLoop();

// Add some visual flair with particles for special attacks
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.life = 30;
        this.maxLife = 30;
    }
    
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
    }
    
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace('1)', `${alpha})`);
        ctx.fillRect(this.x, this.y, 3, 3);
    }
}

// Draw round information
function drawRoundInfo() {
    // Round indicator
    ctx.font = 'bold 18px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    ctx.strokeText(`ROUND ${currentRound}`, canvas.width / 2, 120);
    ctx.fillText(`ROUND ${currentRound}`, canvas.width / 2, 120);
    
    // Win counters
    ctx.font = 'bold 14px Orbitron';
    ctx.fillStyle = '#fff';
    
    // Player 1 wins
    for (let i = 0; i < roundsToWin; i++) {
        ctx.fillStyle = i < player1Wins ? '#ff6b6b' : '#333';
        ctx.fillRect(50 + i * 15, 135, 10, 10);
    }
    
    // Player 2 wins  
    for (let i = 0; i < roundsToWin; i++) {
        ctx.fillStyle = i < player2Wins ? '#4ecdc4' : '#333';
        ctx.fillRect(canvas.width - 90 + i * 15, 135, 10, 10);
    }
}

function handleSpecialSelectClick() {
    const popupWidth = 600;
    const popupHeight = 450;
    const popupX = (canvas.width - popupWidth) / 2;
    const popupY = (canvas.height - popupHeight) / 2;
    
    const selectedChar = selectingPlayer === 1 ? selectedChar1 : selectedChar2;
    const char = characters[selectedChar];
    const attackY = popupY + 120;
    
    // Check special attack selections
    char.specialAttacks.forEach((attack, index) => {
        const attackX = popupX + 50 + index * 180;
        const attackWidth = 160;
        const attackHeight = 200;
        const selectY = attackY + attackHeight - 40;
        
        if (mouseX >= attackX + 30 && mouseX <= attackX + attackWidth - 30 &&
            mouseY >= selectY && mouseY <= selectY + 25) {
            
            // Select this special attack
            if (selectingPlayer === 1) {
                selectedSpecialAttacks.player1 = attack;
                selectingPlayer = 2;
                showSpecialSelect = false;
                selectedCharForStats = null;
                
                // If player 2 already selected, start game
                if (selectedChar2 && selectedSpecialAttacks.player2) {
                    startGame();
                }
            } else {
                selectedSpecialAttacks.player2 = attack;
                showSpecialSelect = false;
                showCharacterSelect = false;
                selectingPlayer = 1;
                selectedCharForStats = null;
                startGame();
            }
        }
    });
    
    // Back button
    const backButtonX = popupX + 20;
    const backButtonY = popupY + popupHeight - 50;
    const backButtonWidth = 80;
    const backButtonHeight = 30;
    
    if (mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
        mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight) {
        showSpecialSelect = false;
        showCharacterStats = true;
    }
}

function handleSpecialSelectInput(key) {
    if (key === 'escape') {
        showSpecialSelect = false;
        showCharacterStats = true;
    }
}

function drawSpecialSelectScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Popup window
    const popupWidth = 600;
    const popupHeight = 450;
    const popupX = (canvas.width - popupWidth) / 2;
    const popupY = (canvas.height - popupHeight) / 2;
    
    // Popup background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
    
    const selectedChar = selectingPlayer === 1 ? selectedChar1 : selectedChar2;
    const char = characters[selectedChar];
    
    // Title
    ctx.font = 'bold 28px Orbitron';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`${char.name} - CHOOSE SPECIAL ATTACK`, canvas.width / 2, popupY + 40);
    
    ctx.font = 'bold 20px Orbitron';
    ctx.fillStyle = selectingPlayer === 1 ? '#ff6b6b' : '#4ecdc4';
    ctx.fillText(`PLAYER ${selectingPlayer}`, canvas.width / 2, popupY + 70);
    
    // Special attacks
    const attackY = popupY + 120;
    char.specialAttacks.forEach((attack, index) => {
        const attackX = popupX + 50 + index * 180;
        const attackWidth = 160;
        const attackHeight = 200;
        
        const isHovered = mouseX >= attackX && mouseX <= attackX + attackWidth &&
                         mouseY >= attackY && mouseY <= attackY + attackHeight;
        
        // Attack box
        ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.3)' : 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(attackX, attackY, attackWidth, attackHeight);
        ctx.strokeStyle = isHovered ? '#ffd700' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(attackX, attackY, attackWidth, attackHeight);
        
        // Attack name
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = isHovered ? '#ffd700' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(attack.name, attackX + attackWidth/2, attackY + 25);
        
        // Attack description
        ctx.font = '12px Orbitron';
        ctx.fillStyle = '#ccc';
        const words = attack.description.split(' ');
        let line = '';
        let y = attackY + 50;
        words.forEach(word => {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > attackWidth - 20) {
                ctx.fillText(line, attackX + attackWidth/2, y);
                line = word + ' ';
                y += 15;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, attackX + attackWidth/2, y);
        
        // Attack stats
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#ff6666';
        ctx.fillText(`Damage: ${attack.damage}`, attackX + attackWidth/2, y + 40);
        ctx.fillStyle = '#66ff66';
        ctx.fillText(`Range: ${attack.range}`, attackX + attackWidth/2, y + 60);
        
        // Select button
        const selectY = attackY + attackHeight - 40;
        const isSelectHovered = mouseX >= attackX + 30 && mouseX <= attackX + attackWidth - 30 &&
                               mouseY >= selectY && mouseY <= selectY + 25;
        
        ctx.fillStyle = isSelectHovered ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 150, 0, 0.5)';
        ctx.fillRect(attackX + 30, selectY, attackWidth - 60, 25);
        ctx.strokeStyle = isSelectHovered ? '#0f0' : '#080';
        ctx.lineWidth = 1;
        ctx.strokeRect(attackX + 30, selectY, attackWidth - 60, 25);
        
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = isSelectHovered ? '#fff' : '#ccc';
        ctx.fillText('SELECT', attackX + attackWidth/2, selectY + 16);
    });
    
    // Back button
    const backButtonX = popupX + 20;
    const backButtonY = popupY + popupHeight - 50;
    const backButtonWidth = 80;
    const backButtonHeight = 30;
    
    const isBackHovered = mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
                         mouseY >= backButtonY && mouseY <= backButtonY + backButtonHeight;
    
    ctx.fillStyle = isBackHovered ? 'rgba(255, 69, 0, 0.7)' : 'rgba(150, 50, 0, 0.5)';
    ctx.fillRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    ctx.strokeStyle = isBackHovered ? '#ff4500' : '#884400';
    ctx.lineWidth = 2;
    ctx.strokeRect(backButtonX, backButtonY, backButtonWidth, backButtonHeight);
    
    ctx.font = 'bold 14px Orbitron';
    ctx.fillStyle = isBackHovered ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.fillText('BACK', backButtonX + backButtonWidth/2, backButtonY + 20);
}

function drawCharacterStatsScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Popup window
    const popupWidth = 500;
    const popupHeight = 400;
    const popupX = (canvas.width - popupWidth) / 2;
    const popupY = (canvas.height - popupHeight) / 2;
    
    // Popup background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
    
    const char = characters[selectedCharForStats];
    
    // Character name
    ctx.font = 'bold 32px Orbitron';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(char.name, canvas.width / 2, popupY + 50);
    
    // Character preview
    const charX = canvas.width / 2 - 80;
    const charY = popupY + 80;
    
    // Character colors
    ctx.fillStyle = char.colors.body;
    ctx.fillRect(charX, charY, 60, 50);
    ctx.fillStyle = char.colors.skin;
    ctx.fillRect(charX + 10, charY - 10, 40, 25);
    ctx.fillStyle = char.colors.pants;
    ctx.fillRect(charX + 5, charY + 50, 50, 30);
    
    // Stats
    const statsX = canvas.width / 2 + 20;
    const statsY = popupY + 80;
    
    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    
    const statNames = ['STRENGTH', 'AGILITY', 'ENDURANCE', 'TECHNIQUE', 'FOCUS'];
    const statValues = [char.stats.strength, char.stats.agility, char.stats.endurance, char.stats.technique, char.stats.focus];
    
    statNames.forEach((statName, index) => {
        const y = statsY + index * 25;
        ctx.fillText(`${statName}:`, statsX, y);
        
        // Stat bar
        const barWidth = 100;
        const barHeight = 12;
        const barX = statsX + 120;
        const barY = y - 10;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const fillWidth = (statValues[index] / 100) * barWidth;
        ctx.fillStyle = statValues[index] >= 80 ? '#0f0' : statValues[index] >= 60 ? '#ff0' : '#f00';
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(statValues[index], barX + barWidth + 20, y);
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px Orbitron';
    });
    
    // Select and Back buttons
    const buttonY = popupY + popupHeight - 60;
    
    // Select button
    const selectButtonX = canvas.width / 2 - 100;
    const selectButtonWidth = 80;
    const selectButtonHeight = 35;
    
    const isSelectHovered = mouseX >= selectButtonX && mouseX <= selectButtonX + selectButtonWidth &&
                           mouseY >= buttonY && mouseY <= buttonY + selectButtonHeight;
    
    ctx.fillStyle = isSelectHovered ? 'rgba(0, 255, 0, 0.7)' : 'rgba(0, 150, 0, 0.5)';
    ctx.fillRect(selectButtonX, buttonY, selectButtonWidth, selectButtonHeight);
    ctx.strokeStyle = isSelectHovered ? '#0f0' : '#080';
    ctx.lineWidth = 2;
    ctx.strokeRect(selectButtonX, buttonY, selectButtonWidth, selectButtonHeight);
    
    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = isSelectHovered ? '#fff' : '#ccc';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT', selectButtonX + selectButtonWidth/2, buttonY + 22);
    
    // Back button
    const backButtonX = canvas.width / 2 + 20;
    const backButtonWidth = 80;
    const backButtonHeight = 35;
    
    const isBackHovered = mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
                         mouseY >= buttonY && mouseY <= buttonY + backButtonHeight;
    
    ctx.fillStyle = isBackHovered ? 'rgba(255, 69, 0, 0.7)' : 'rgba(150, 50, 0, 0.5)';
    ctx.fillRect(backButtonX, buttonY, backButtonWidth, backButtonHeight);
    ctx.strokeStyle = isBackHovered ? '#ff4500' : '#884400';
    ctx.lineWidth = 2;
    ctx.strokeRect(backButtonX, buttonY, backButtonWidth, backButtonHeight);
    
    ctx.fillStyle = isBackHovered ? '#fff' : '#ccc';
    ctx.fillText('BACK', backButtonX + backButtonWidth/2, buttonY + 22);
}

function handleCharacterStatsClick() {
    const popupWidth = 500;
    const popupHeight = 400;
    const popupX = (canvas.width - popupWidth) / 2;
    const popupY = (canvas.height - popupHeight) / 2;
    const buttonY = popupY + popupHeight - 60;
    
    // Select button
    const selectButtonX = canvas.width / 2 - 100;
    const selectButtonWidth = 80;
    const selectButtonHeight = 35;
    
    if (mouseX >= selectButtonX && mouseX <= selectButtonX + selectButtonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + selectButtonHeight) {
        // Select this character
        if (selectingPlayer === 1) {
            selectedChar1 = selectedCharForStats;
        } else {
            selectedChar2 = selectedCharForStats;
        }
        showCharacterStats = false;
        showSpecialSelect = true;
    }
    
    // Back button
    const backButtonX = canvas.width / 2 + 20;
    const backButtonWidth = 80;
    
    if (mouseX >= backButtonX && mouseX <= backButtonX + backButtonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + selectButtonHeight) {
        showCharacterStats = false;
        selectedCharForStats = null;
    }
}

function handleCharacterStatsInput(key) {
    if (key === 'enter') {
        // Select this character
        if (selectingPlayer === 1) {
            selectedChar1 = selectedCharForStats;
        } else {
            selectedChar2 = selectedCharForStats;
        }
        showCharacterStats = false;
        showSpecialSelect = true;
    } else if (key === 'escape') {
        showCharacterStats = false;
        selectedCharForStats = null;
    }
}

// Draw game over screen with return to menu option
function drawGameOverScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // "GAME OVER" text
    ctx.font = 'bold 48px Orbitron';
    ctx.fillStyle = '#ff6b6b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    
    ctx.strokeText('GAME OVER', canvas.width / 2, canvas.height / 2 - 100);
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 100);
    
    // Instructions
    ctx.font = '20px Orbitron';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Returning to menu...', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '16px Orbitron';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Press ESC to return immediately', canvas.width / 2, canvas.height / 2);
    
    // Return to menu button with hover effect
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 40;
    
    const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                     mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
    
    ctx.fillStyle = isHovered ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = isHovered ? '#fff' : '#ffd700';
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.font = 'bold 18px Orbitron';
    ctx.fillStyle = isHovered ? '#000' : '#ffd700';
    ctx.fillText('RETURN TO MENU', canvas.width / 2, buttonY + 32);
}

// Handle game over screen clicks
function handleGameOverClick() {
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = (canvas.width - buttonWidth) / 2;
    const buttonY = canvas.height / 2 + 40;
    
    // Check if clicked on return to menu button
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        returnToMenu();
    }
}



// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'playing') {
        // Draw background
        drawBackground();
        
        // Update and draw players
        if (player1 && player2) {
            player1.update();
            player2.update();
            player1.draw();
            player2.draw();
        }
        
        // Update and draw projectiles
        updateProjectiles();
        drawProjectiles();
        
        // Draw particles/effects
        drawParticles();
        
        // Update screen shake
        if (screenShake > 0) {
            screenShake--;
            ctx.save();
            ctx.translate(Math.random() * screenShake - screenShake/2, Math.random() * screenShake - screenShake/2);
        }
        
        // Draw round info
        drawRoundInfo();
        
        if (screenShake > 0) {
            ctx.restore();
        }
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Projectile management functions
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        // Update projectile position
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.life--;
        
        // Remove dead or off-screen projectiles
        if (projectile.life <= 0 || projectile.x < -50 || projectile.x > canvas.width + 50) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with players
        if (player1 && player2) {
            const target = projectile.owner === player1 ? player2 : player1;
            if (projectile.x < target.x + target.width &&
                projectile.x + 10 > target.x &&
                projectile.y < target.y + target.height &&
                projectile.y + 10 > target.y) {
                
                // Hit the target
                if (target.hitCooldown <= 0) {
                    target.health = Math.max(0, target.health - projectile.damage);
                    target.hitCooldown = 30;
                    target.stunned = true;
                    
                    // Update health display
                    try {
                        if (target === player1) {
                            document.getElementById('player1Health').style.width = target.health + '%';
                            document.getElementById('player1HealthText').textContent = `${target.health}/100`;
                        } else {
                            document.getElementById('player2Health').style.width = target.health + '%';
                            document.getElementById('player2HealthText').textContent = `${target.health}/100`;
                        }
                    } catch (e) { /* Ignore UI errors */ }
                }
                
                // Remove projectile
                projectiles.splice(i, 1);
            }
        }
    }
}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        ctx.fillRect(projectile.x, projectile.y, 10, 6);
        
        // Add glowing effect for kibble
        if (projectile.type === 'kibble') {
            ctx.shadowColor = projectile.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(projectile.x, projectile.y, 10, 6);
            ctx.shadowBlur = 0;
        }
    });
}

// Particle drawing function
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        const alpha = particle.life / 30; // Fade out
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, 3, 3);
        ctx.globalAlpha = 1;
    }
}

// Start game loop
gameLoop();

// MOMMYDOG: The Husky Fighter loaded! 🐕⚡🔥
