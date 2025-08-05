// Legend of Heroes - Advanced RPG Game

class AdvancedRPG {
    constructor() {
        this.gameState = 'characterCreation';
        this.selectedCharacter = null;
        this.playerName = '';
        this.canvas = null;
        this.ctx = null;
        this.paused = false;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            smoothing: 0.1  // How smooth the camera follows (0.1 = smooth, 1.0 = instant)
        };
        
        // Audio system
        this.audio = {
            backgroundMusic: null,
            combatSound: null,
            itemPickup: null,
            musicEnabled: true,
            soundEnabled: true,
            musicVolume: 0.3,
            soundVolume: 0.5
        };
        
        // Player stats
        this.player = {
            name: '',
            characterType: '',
            level: 1,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            xp: 0,
            nextLevelXP: 100,
            strength: 10,
            defense: 10,
            speed: 10,
            magic: 10,
            gold: 100,
            // Position and movement
            x: 800,  // Center of 1600px width
            y: 500,  // Center of 1000px height
            width: 32,
            height: 32,
            direction: 'down',
            isMoving: false,
            // Special attacks
            specialAttackCooldown: 0,
            ultimateAttackCooldown: 0
        };
        
        // Game completion tracking
        this.gameComplete = false;
        this.bossDefeated = false;
        this.bossSpawned = false;  // Track if boss has been spawned
        this.specialAttacks = {
            'Fire Blast': { manaCost: 20, cooldown: 5000, damage: 50, range: 150 },
            'Lightning Strike': { manaCost: 25, cooldown: 7000, damage: 75, range: 200 },
            'Healing Aura': { manaCost: 30, cooldown: 10000, heal: 40, range: 100 },
            'Dragon Breath': { manaCost: 40, cooldown: 15000, damage: 100, range: 250 }
        };
        
        // Weapon collection tracking
        this.weaponCollection = new Set();
        this.bestWeapons = [];
        
        // Shrine system
        this.shrines = [
            { name: 'Shrine of Courage', x: 300, y: 150, area: 'Starting Village', completed: false, active: false },
            { name: 'Shrine of Wisdom', x: 200, y: 300, area: 'Dark Forest', completed: false, active: false },
            { name: 'Shrine of Power', x: 400, y: 200, area: 'Mountain Pass', completed: false, active: false },
            { name: 'Shrine of Balance', x: 600, y: 400, area: 'Ancient Ruins', completed: false, active: false }
        ];
        
        // Status effects for weapon abilities
        this.statusEffects = new Map(); // Map of enemy -> effects array
        
        // Trading system
        this.traders = [
            {
                name: 'Village Merchant',
                x: 150, y: 200,
                area: 'Starting Village',
                trades: [
                    { wants: ['Health Potion'], offers: ['Magic Crystal'], ratio: '2:1' },
                    { wants: ['Iron Sword'], offers: ['Steel Sword'], ratio: '1:1' },
                    { wants: ['Wood'], offers: ['Stone'], ratio: '3:2' }
                ]
            },
            {
                name: 'Forest Witch',
                x: 250, y: 350,
                area: 'Dark Forest',
                trades: [
                    { wants: ['Mana Potion', 'Health Potion'], offers: ['Super Potion'], ratio: '1:1' },
                    { wants: ['Magic Crystal'], offers: ['Enchanted Ring'], ratio: '2:1' },
                    { wants: ['Poison Dagger'], offers: ['Flame Blade'], ratio: '1:1' }
                ]
            },
            {
                name: 'Mountain Dwarf',
                x: 450, y: 150,
                area: 'Mountain Pass',
                trades: [
                    { wants: ['Stone'], offers: ['Iron Ore'], ratio: '4:1' },
                    { wants: ['Steel Sword'], offers: ['Dragon Scale Shield'], ratio: '1:1' },
                    { wants: ['Iron Ore'], offers: ['Master Axe'], ratio: '3:1' }
                ]
            },
            {
                name: 'Ancient Sage',
                x: 550, y: 450,
                area: 'Ancient Ruins',
                trades: [
                    { wants: ['Dragon Scale'], offers: ['Dragon Slayer'], ratio: '1:1' },
                    { wants: ['Super Potion'], offers: ['Phoenix Feather'], ratio: '2:1' },
                    { wants: ['Enchanted Ring'], offers: ['Wisdom Scroll'], ratio: '1:1' }
                ]
            },
            {
                name: 'Mysterious Collector',
                x: 700, y: 600,
                area: 'Dragon\'s Lair',
                trades: [
                    { wants: ['Phoenix Feather'], offers: ['Ancient Artifact'], ratio: '1:1' },
                    { wants: ['Wisdom Scroll'], offers: ['Time Crystal'], ratio: '1:1' },
                    { wants: ['Ancient Artifact', 'Time Crystal'], offers: ['Legendary Blade'], ratio: '1:1' }
                ]
            }
        ];
        
        this.currentTrader = null;
        this.tradeOffers = [];
        
        // Input handling
        this.keys = {};
        this.lastTime = 0;
        
        // Equipment system
        this.equipment = {
            weapon: null,
            shield: null,
            armor: null
        };
        
        // Inventory system
        this.inventory = [
            // Add some trading materials to get started
            this.itemDatabase['Wood'],
            this.itemDatabase['Wood'], 
            this.itemDatabase['Stone']
        ];
        this.inventorySize = 20;
        
        // Combat system
        this.enemies = [];
        this.projectiles = [];
        this.combatEffects = [];
        this.isAttacking = false;
        this.attackCooldown = 0;
        
        // Current area
        this.currentArea = {
            name: 'Starting Village',
            description: 'A peaceful village where your journey begins.',
            dangerLevel: 1
        };
        
        this.areas = [
            {
                name: 'Starting Village',
                description: 'A peaceful village where your journey begins.',
                dangerLevel: 1,
                enemies: ['Goblin', 'Slime']
            },
            {
                name: 'Dark Forest',
                description: 'A mysterious forest filled with ancient magic.',
                dangerLevel: 2,
                enemies: ['Wolf', 'Orc', 'Dark Mage']
            },
            {
                name: 'Mountain Pass',
                description: 'Treacherous mountain paths with hidden dangers.',
                dangerLevel: 3,
                enemies: ['Troll', 'Dragon', 'Giant Spider']
            },
            {
                name: 'Ancient Ruins',
                description: 'Crumbling ruins of a lost civilization.',
                dangerLevel: 4,
                enemies: ['Skeleton', 'Lich', 'Stone Golem']
            },
            {
                            name: 'Dragon\'s Lair',
            description: 'The final challenge - the dragon\'s domain.',
            dangerLevel: 5,
            enemies: ['Dragon', 'Dark Mage', 'Troll']  // Fixed enemy names to match defined stats
            }
        ];
        
        this.initializeItems();
        this.initializeGame();
        this.setupInputHandlers();
    }
    
    initializeItems() {
        // Define all available items
        this.itemDatabase = {
            // SWORDS - Close combat weapons
            'Broken Sword': { type: 'weapon', subtype: 'sword', icon: '⚔️', strength: 2, speed: 0, range: 30, attackSpeed: 800, value: 20 },
            'Rusty Sword': { type: 'weapon', subtype: 'sword', icon: '🗡️', strength: 5, speed: 1, range: 35, attackSpeed: 700, value: 50 },
            'Iron Sword': { type: 'weapon', subtype: 'sword', icon: '⚔️', strength: 10, speed: 2, range: 40, attackSpeed: 600, value: 150 },
            'Steel Blade': { type: 'weapon', subtype: 'sword', icon: '🗡️', strength: 15, speed: 3, range: 45, attackSpeed: 550, value: 250 },
            'Silver Sword': { type: 'weapon', subtype: 'sword', icon: '⚔️', strength: 20, speed: 4, range: 50, attackSpeed: 500, value: 400 },
            'Magic Blade': { type: 'weapon', subtype: 'sword', icon: '🔮', strength: 15, magic: 8, range: 45, attackSpeed: 550, value: 300 },
            'Flame Sword': { type: 'weapon', subtype: 'sword', icon: '🔥', strength: 22, magic: 5, range: 50, attackSpeed: 500, value: 600 },
            'Ice Blade': { type: 'weapon', subtype: 'sword', icon: '❄️', strength: 20, magic: 6, range: 48, attackSpeed: 520, value: 580 },
            'Lightning Edge': { type: 'weapon', subtype: 'sword', icon: '⚡', strength: 25, magic: 8, speed: 2, range: 52, attackSpeed: 450, value: 800 },
            'Dragon Slayer': { type: 'weapon', subtype: 'sword', icon: '🐉', strength: 35, magic: 5, range: 60, attackSpeed: 600, value: 1000 },
        
        // Trading-specific items
        'Wood': { type: 'material', icon: '🪵', value: 5 },
        'Stone': { type: 'material', icon: '🪨', value: 8 },
        'Iron Ore': { type: 'material', icon: '⛏️', value: 25 },
        'Dragon Scale': { type: 'material', icon: '🐲', value: 200 },
        'Phoenix Feather': { type: 'material', icon: '🪶', strength: 5, magic: 15, value: 500 },
        'Ancient Artifact': { type: 'accessory', icon: '🏺', magic: 20, defense: 10, value: 1000 },
        'Time Crystal': { type: 'accessory', icon: '💎', magic: 25, speed: 10, value: 1500 },
        'Wisdom Scroll': { type: 'consumable', icon: '📜', value: 300 },
        'Legendary Blade': { type: 'weapon', subtype: 'sword', icon: '🗡️', strength: 60, magic: 20, range: 80, attackSpeed: 400, value: 5000 },
        'Excalibur': { type: 'weapon', subtype: 'sword', icon: '👑', strength: 40, magic: 10, speed: 5, range: 65, attackSpeed: 400, value: 2000 },
        
        // CLUBS & HAMMERS - Heavy weapons
        'Wooden Club': { type: 'weapon', subtype: 'club', icon: '🏏', strength: 8, speed: -2, range: 35, attackSpeed: 900, value: 30 },
        'Iron Mace': { type: 'weapon', subtype: 'club', icon: '🔨', strength: 18, speed: -3, range: 40, attackSpeed: 1000, value: 200 },
        'War Hammer': { type: 'weapon', subtype: 'club', icon: '🔨', strength: 25, speed: -4, range: 45, attackSpeed: 1100, value: 350 },
        'Thunder Hammer': { type: 'weapon', subtype: 'club', icon: '⚡', strength: 30, magic: 5, speed: -3, range: 50, attackSpeed: 1000, value: 700 },
        'Mjolnir': { type: 'weapon', subtype: 'club', icon: '⚡', strength: 45, magic: 15, speed: -2, range: 55, attackSpeed: 800, value: 1500 },
        
        // BOWS - Ranged weapons
        'Slingshot': { type: 'weapon', subtype: 'bow', icon: '🪃', strength: 3, speed: 4, range: 150, attackSpeed: 400, value: 40 },
        'Wooden Bow': { type: 'weapon', subtype: 'bow', icon: '🏹', strength: 8, speed: 3, range: 200, attackSpeed: 600, value: 100 },
        'Hunter Bow': { type: 'weapon', subtype: 'bow', icon: '🏹', strength: 12, speed: 4, range: 250, attackSpeed: 550, value: 180 },
        'Composite Bow': { type: 'weapon', subtype: 'bow', icon: '🏹', strength: 16, speed: 5, range: 280, attackSpeed: 500, value: 300 },
        'Elven Bow': { type: 'weapon', subtype: 'bow', icon: '🏹', strength: 20, speed: 6, magic: 3, range: 320, attackSpeed: 450, value: 500 },
        'Crossbow': { type: 'weapon', subtype: 'bow', icon: '🏹', strength: 25, speed: 2, range: 300, attackSpeed: 800, value: 400 },
        'Magic Bow': { type: 'weapon', subtype: 'bow', icon: '🌟', strength: 18, magic: 10, speed: 5, range: 350, attackSpeed: 400, value: 600 },
        'Phoenix Bow': { type: 'weapon', subtype: 'bow', icon: '🔥', strength: 30, magic: 8, speed: 4, range: 400, attackSpeed: 450, value: 1000 },
        
        // STAFFS & WANDS - Magic weapons
        'Wooden Wand': { type: 'weapon', subtype: 'staff', icon: '🪄', strength: 2, magic: 8, mana: 5, range: 180, attackSpeed: 500, value: 80 },
        'Iron Staff': { type: 'weapon', subtype: 'staff', icon: '🪄', strength: 5, magic: 15, mana: 8, range: 200, attackSpeed: 600, value: 200 },
        'Magic Staff': { type: 'weapon', subtype: 'staff', icon: '🔮', strength: 3, magic: 20, mana: 12, range: 250, attackSpeed: 550, value: 350 },
        'Crystal Wand': { type: 'weapon', subtype: 'staff', icon: '💎', strength: 4, magic: 25, mana: 15, range: 280, attackSpeed: 500, value: 500 },
        'Fire Staff': { type: 'weapon', subtype: 'staff', icon: '🔥', strength: 8, magic: 22, mana: 10, range: 300, attackSpeed: 600, value: 450 },
        'Ice Scepter': { type: 'weapon', subtype: 'staff', icon: '❄️', strength: 6, magic: 24, mana: 12, range: 290, attackSpeed: 580, value: 480 },
        'Storm Rod': { type: 'weapon', subtype: 'staff', icon: '⚡', strength: 10, magic: 28, mana: 8, range: 350, attackSpeed: 500, value: 700 },
        'Archmage Staff': { type: 'weapon', subtype: 'staff', icon: '🌟', strength: 5, magic: 35, mana: 20, range: 400, attackSpeed: 450, value: 1200 },
            
            // DAGGERS - Fast weapons
            'Rusty Dagger': { type: 'weapon', subtype: 'dagger', icon: '🗡️', strength: 4, speed: 6, range: 25, attackSpeed: 300, value: 35 },
            'Steel Dagger': { type: 'weapon', subtype: 'dagger', icon: '🔪', strength: 8, speed: 8, range: 28, attackSpeed: 250, value: 120 },
            'Poison Blade': { type: 'weapon', subtype: 'dagger', icon: '🟢', strength: 10, speed: 7, magic: 3, range: 30, attackSpeed: 280, value: 200 },
            'Shadow Dagger': { type: 'weapon', subtype: 'dagger', icon: '🌑', strength: 15, speed: 10, magic: 5, range: 32, attackSpeed: 200, value: 400 },
            'Assassin Blade': { type: 'weapon', subtype: 'dagger', icon: '🗡️', strength: 20, speed: 12, range: 35, attackSpeed: 180, value: 600 },
            
            // SPEARS - Long reach weapons
            'Wooden Spear': { type: 'weapon', subtype: 'spear', icon: '🏹', strength: 10, speed: 1, range: 70, attackSpeed: 700, value: 90 },
            'Iron Spear': { type: 'weapon', subtype: 'spear', icon: '🔱', strength: 18, speed: 0, range: 80, attackSpeed: 750, value: 250 },
            'Halberd': { type: 'weapon', subtype: 'spear', icon: '🔱', strength: 22, speed: -1, range: 90, attackSpeed: 800, value: 350 },
            'Trident': { type: 'weapon', subtype: 'spear', icon: '🔱', strength: 25, magic: 5, speed: 1, range: 85, attackSpeed: 700, value: 500 },
            'Dragon Lance': { type: 'weapon', subtype: 'spear', icon: '🐉', strength: 35, magic: 8, range: 100, attackSpeed: 750, value: 900 },

            // AXES - Heavy cutting weapons
            'Hand Axe': { type: 'weapon', subtype: 'axe', icon: '🪓', strength: 12, speed: 0, range: 40, attackSpeed: 650, value: 80 },
            'Battle Axe': { type: 'weapon', subtype: 'axe', icon: '🪓', strength: 20, speed: -2, range: 45, attackSpeed: 750, value: 200 },
            'Viking Axe': { type: 'weapon', subtype: 'axe', icon: '🪓', strength: 25, speed: -1, range: 50, attackSpeed: 700, value: 350 },
            'Frost Axe': { type: 'weapon', subtype: 'axe', icon: '❄️', strength: 22, magic: 6, speed: -1, range: 48, attackSpeed: 720, value: 450 },
            'Executioner Axe': { type: 'weapon', subtype: 'axe', icon: '🪓', strength: 35, speed: -3, range: 55, attackSpeed: 900, value: 700 },

            // WHIPS - Long range flexible weapons
            'Leather Whip': { type: 'weapon', subtype: 'whip', icon: '🔗', strength: 6, speed: 5, range: 65, attackSpeed: 400, value: 60 },
            'Chain Whip': { type: 'weapon', subtype: 'whip', icon: '⛓️', strength: 12, speed: 4, range: 70, attackSpeed: 450, value: 150 },
            'Thorn Whip': { type: 'weapon', subtype: 'whip', icon: '🌹', strength: 10, magic: 4, speed: 6, range: 68, attackSpeed: 400, value: 200 },
            'Lightning Whip': { type: 'weapon', subtype: 'whip', icon: '⚡', strength: 18, magic: 8, speed: 5, range: 75, attackSpeed: 350, value: 500 },

            // GUNS - Advanced ranged weapons
            'Flintlock Pistol': { type: 'weapon', subtype: 'gun', icon: '🔫', strength: 15, speed: 3, range: 200, attackSpeed: 800, value: 300 },
            'Musket': { type: 'weapon', subtype: 'gun', icon: '🔫', strength: 25, speed: 1, range: 350, attackSpeed: 1200, value: 500 },
            'Blunderbuss': { type: 'weapon', subtype: 'gun', icon: '🔫', strength: 30, speed: 0, range: 150, attackSpeed: 1000, value: 400 },
            'Magic Rifle': { type: 'weapon', subtype: 'gun', icon: '🌟', strength: 20, magic: 12, speed: 4, range: 400, attackSpeed: 700, value: 800 },

            // THROWING WEAPONS - Projectile weapons
            'Throwing Knife': { type: 'weapon', subtype: 'throwing', icon: '🔪', strength: 8, speed: 7, range: 120, attackSpeed: 300, value: 50 },
            'Shuriken': { type: 'weapon', subtype: 'throwing', icon: '⭐', strength: 6, speed: 10, range: 100, attackSpeed: 250, value: 75 },
            'Chakram': { type: 'weapon', subtype: 'throwing', icon: '🔴', strength: 14, speed: 6, range: 140, attackSpeed: 400, value: 200 },
            'Boomerang': { type: 'weapon', subtype: 'throwing', icon: '🪃', strength: 12, speed: 8, range: 160, attackSpeed: 500, value: 150 },

            // KATANAS - Special swords
            'Apprentice Katana': { type: 'weapon', subtype: 'katana', icon: '🗡️', strength: 18, speed: 6, range: 50, attackSpeed: 400, value: 350 },
            'Master Katana': { type: 'weapon', subtype: 'katana', icon: '⚔️', strength: 28, speed: 8, range: 55, attackSpeed: 350, value: 700 },
            'Demon Blade': { type: 'weapon', subtype: 'katana', icon: '👹', strength: 35, magic: 10, speed: 7, range: 60, attackSpeed: 300, value: 1200 },

            // SCYTHES - Magical curved weapons
            'Farmer Scythe': { type: 'weapon', subtype: 'scythe', icon: '🪓', strength: 16, speed: 2, range: 60, attackSpeed: 600, value: 180 },
            'Death Scythe': { type: 'weapon', subtype: 'scythe', icon: '💀', strength: 30, magic: 15, speed: 3, range: 70, attackSpeed: 550, value: 900 },
            'Soul Reaper': { type: 'weapon', subtype: 'scythe', icon: '👻', strength: 25, magic: 20, speed: 4, range: 75, attackSpeed: 500, value: 1100 },

            // EXOTIC WEAPONS - Unique weapons
            'Nunchucks': { type: 'weapon', subtype: 'exotic', icon: '🥢', strength: 12, speed: 9, range: 35, attackSpeed: 200, value: 180 },
            'Kama': { type: 'weapon', subtype: 'exotic', icon: '🔪', strength: 14, speed: 7, range: 40, attackSpeed: 300, value: 220 },
            'Tonfa': { type: 'weapon', subtype: 'exotic', icon: '🏏', strength: 10, defense: 5, speed: 8, range: 30, attackSpeed: 250, value: 200 },
            'Claws': { type: 'weapon', subtype: 'exotic', icon: '🐾', strength: 16, speed: 12, range: 25, attackSpeed: 150, value: 300 },
            'Crystal Orb': { type: 'weapon', subtype: 'exotic', icon: '🔮', strength: 5, magic: 30, mana: 25, range: 300, attackSpeed: 400, value: 800 },
            
            // Shields
            'Wooden Shield': { type: 'shield', icon: '🛡️', defense: 3, value: 30 },
            'Iron Shield': { type: 'shield', icon: '🛡️', defense: 8, value: 120 },
            'Magic Shield': { type: 'shield', icon: '🔰', defense: 12, magic: 3, value: 250 },
            'Dragon Scale Shield': { type: 'shield', icon: '🛡️', defense: 20, value: 800 },
            
            // Armor
            'Leather Armor': { type: 'armor', icon: '🦺', defense: 5, speed: 1, value: 80 },
            'Chain Mail': { type: 'armor', icon: '🦺', defense: 12, value: 200 },
            'Plate Armor': { type: 'armor', icon: '🦺', defense: 20, strength: 3, value: 500 },
            'Mage Robes': { type: 'armor', icon: '👘', defense: 8, magic: 8, mana: 15, value: 300 },
            
            // Consumables
            'Health Potion': { type: 'consumable', icon: '🧪', heal: 50, value: 25 },
            'Mana Potion': { type: 'consumable', icon: '💙', mana: 30, value: 20 },
            'Food': { type: 'consumable', icon: '🍖', heal: 20, value: 10 },
            'Scroll of Fireball': { type: 'consumable', icon: '📜', magic: true, damage: 30, value: 50 },
            
            // Special Items
            'Gold Coin': { type: 'currency', icon: '💰', value: 1 },
            'Gem': { type: 'valuable', icon: '💎', value: 100 },
            'Treasure Chest': { type: 'container', icon: '📦', value: 200, openable: true },
            'Small Chest': { type: 'container', icon: '📦', value: 100, openable: true },
            'Large Chest': { type: 'container', icon: '📦', value: 300, openable: true },
            'Magic Chest': { type: 'container', icon: '✨', value: 500, openable: true },
        };
    }
    
    initializeGame() {
        // Character selection event listeners
        document.querySelectorAll('.character-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.character-option').forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedCharacter = option.dataset.character;
            });
        });
        
        // Initialize starting inventory with variety of weapons and trading materials
        this.addItem('Health Potion', 5);
        this.addItem('Mana Potion', 3);
        this.addItem('Food', 3);
        this.addItem('Broken Sword', 1);
        this.addItem('Wooden Bow', 1);
        this.addItem('Wooden Wand', 1);
        this.addItem('Rusty Dagger', 1);
        this.addItem('Wooden Shield', 1);
        this.addItem('Wood', 2);
        this.addItem('Stone', 1);
        this.addItem('Leather Armor', 1);
        this.addItem('Small Chest', 2);  // Give players some chests to try!
        
        // Auto-equip starting weapon, shield, and armor
        this.equipItem(this.findItemSlot('Broken Sword'));
        this.equipItem(this.findItemSlot('Wooden Shield'));
        this.equipItem(this.findItemSlot('Leather Armor'));
        
        // Initialize audio
        this.initializeAudio();
    }
    
    setupInputHandlers() {
        // Keyboard event listeners for movement
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Handle inventory toggle (only during gameplay)
            if (e.key.toLowerCase() === 'i' && this.gameState === 'playing') {
                this.toggleInventory();
                e.preventDefault();
                return;
            }
            
            // Handle teleport menu (only during gameplay)
            if (e.key.toLowerCase() === 'v' && this.gameState === 'playing') {
                console.log('V key pressed! Attempting to show teleport dialog...');
                this.showTeleportDialog();
                e.preventDefault();
                return;
            }
            
            // Only prevent default for game controls during gameplay
            if (this.gameState === 'playing' && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'q', 'e', 'r', 't'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    // Character Creation
    startGame() {
        const nameInput = document.getElementById('playerName');
        this.playerName = nameInput.value.trim() || 'Hero';
        
        if (!this.selectedCharacter) {
            alert('Please select a character!');
            return;
        }
        
        this.applyCharacterBonuses();
        this.player.name = this.playerName;
        this.player.characterType = this.selectedCharacter === 'mommydog' ? 'Swift Husky' : 'Mighty Panda';
        
        document.getElementById('characterCreation').style.display = 'none';
        document.getElementById('gameUI').style.display = 'grid';
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set game state to playing
        this.gameState = 'playing';
        
        this.updateUI();
        this.renderGameArea();
        this.addMessage(`Welcome ${this.playerName}! Your adventure begins in ${this.currentArea.name}.`, 'system');
        
        // Start background music
        this.playBackgroundMusic();
        this.addMessage('Use WASD or Arrow Keys to move around!', 'system');
        
        // Start the game loop
        this.gameLoop();
    }
    
    applyCharacterBonuses() {
        if (this.selectedCharacter === 'mommydog') {
            this.player.speed += 2;
            this.player.magic += 1;
            this.player.maxMana += 10;
            this.player.mana += 10;
        } else if (this.selectedCharacter === 'doug') {
            this.player.defense += 2;
            this.player.strength += 1;
            this.player.maxHealth += 20;
            this.player.health += 20;
        }
    }
    
    // Game Loop
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing' && !this.paused) {
            this.update(deltaTime);
            this.renderGameArea();
        } else if (this.gameState === 'playing' && this.paused) {
            // Still render but don't update game logic when paused
            this.renderGameArea();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Only update game logic during gameplay
        if (this.gameState !== 'playing' || this.gameComplete) {
            return;  // Stop game logic when game is complete
        }
        
        // Update camera to follow player
        this.updateCamera();
        
        // Handle movement input
        this.handleMovement(deltaTime);
        
        // Update combat cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        if (this.player.specialAttackCooldown > 0) {
            this.player.specialAttackCooldown -= deltaTime;
        }
        if (this.player.ultimateAttackCooldown > 0) {
            this.player.ultimateAttackCooldown -= deltaTime;
        }
        
        // Update weapon status effects
        if (this.weaponStatusEffect && this.weaponStatusEffect.remaining > 0) {
            this.weaponStatusEffect.remaining -= deltaTime;
            if (this.weaponStatusEffect.remaining <= 0) {
                this.weaponStatusEffect = null;
            }
        }
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime, this));
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return projectile.active;
        });
        
        // Update combat effects
        this.combatEffects = this.combatEffects.filter(effect => {
            effect.update(deltaTime);
            return effect.life > 0;
        });
        
        // Check combat collisions
        this.checkCombatCollisions();
        
        // Spawn enemies based on area (but not after game completion)
        if (!this.gameComplete) {
            this.manageEnemySpawning();
            
            // Check for boss spawn
            this.spawnBoss();
        }
        
        // Check for interactions
        this.checkInteractions();
        
        // Check shrine interactions
        this.checkShrineInteractions();
        
        // Check trader interactions
        this.checkTraderInteractions();
    }
    
    updateCamera() {
        // Calculate desired camera position (center player on screen)
        const targetX = this.player.x - (this.canvas.width / 2);
        const targetY = this.player.y - (this.canvas.height / 2);
        
        // Smooth camera following
        this.camera.x += (targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (targetY - this.camera.y) * this.camera.smoothing;
        
        // Keep camera within world bounds (optional)
        const worldWidth = 2000;  // Adjust based on your world size
        const worldHeight = 1500;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, worldWidth - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, worldHeight - this.canvas.height));
    }
    
    handleMovement(deltaTime) {
        // Only allow movement during gameplay
        if (this.gameState !== 'playing') {
            return;
        }
        
        const moveSpeed = 4; // Increased movement speed for larger world
        let dx = 0, dy = 0;
        let isMoving = false;
        
        // Remove excessive debug logging for cleaner console
        // Only log when there's actual movement
        
        // Check movement keys
        if (this.keys['w'] || this.keys['arrowup']) {
            dy = -moveSpeed;
            this.player.direction = 'up';
            isMoving = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            dy = moveSpeed;
            this.player.direction = 'down';
            isMoving = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            dx = -moveSpeed;
            this.player.direction = 'left';
            isMoving = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            dx = moveSpeed;
            this.player.direction = 'right';
            isMoving = true;
        }
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Move player if there's input
        if (dx !== 0 || dy !== 0) {
            const newX = this.player.x + dx;
            const newY = this.player.y + dy;
            
            // Check boundaries (use world size instead of canvas size)
            const worldWidth = 2000;
            const worldHeight = 1500;
            
            if (newX >= 0 && newX <= worldWidth - this.player.width &&
                newY >= 0 && newY <= worldHeight - this.player.height) {
                this.player.x = newX;
                this.player.y = newY;
                
                        // Player moved successfully
            }
        }
        
        this.player.isMoving = isMoving;
        
        // Check for space key interactions (only during gameplay)
        if (this.gameState === 'playing' && this.keys[' '] && !this.spacePressed) {
            this.spacePressed = true;
            this.handleSpaceInteraction();
        }
        if (!this.keys[' ']) {
            this.spacePressed = false;
        }
        
        // Check for attack (X key or click) - only during gameplay
        if (this.gameState === 'playing' && (this.keys['x'] || this.keys['z']) && this.attackCooldown <= 0) {
            this.performAttack();
        }
        
        // Check for special attacks - only during gameplay
        if (this.gameState === 'playing') {
            if (this.keys['q'] && this.player.specialAttackCooldown <= 0) {
                this.performSpecialAttack('Fire Blast');
            }
            if (this.keys['e'] && this.player.specialAttackCooldown <= 0) {
                this.performSpecialAttack('Lightning Strike');
            }
            if (this.keys['r'] && this.player.specialAttackCooldown <= 0) {
                this.performSpecialAttack('Healing Aura');
            }
            if (this.keys['t'] && this.player.ultimateAttackCooldown <= 0) {
                this.performSpecialAttack('Dragon Breath');
            }
        }
    }
    
    performSpecialAttack(attackName) {
        const attack = this.specialAttacks[attackName];
        if (!attack) return;
        
        // Check mana cost
        if (this.player.mana < attack.manaCost) {
            this.addMessage(`Not enough mana for ${attackName}! Need ${attack.manaCost}`, 'system');
            return;
        }
        
        // Consume mana
        this.player.mana -= attack.manaCost;
        
        // Set cooldown
        if (attackName === 'Dragon Breath') {
            this.player.ultimateAttackCooldown = attack.cooldown;
        } else {
            this.player.specialAttackCooldown = attack.cooldown;
        }
        
        // Execute special attack
        if (attackName === 'Healing Aura') {
            const healAmount = Math.min(attack.heal, this.player.maxHealth - this.player.health);
            this.player.health += healAmount;
            this.addMessage(`Healed for ${healAmount} HP!`, 'combat');
            this.createCombatEffect(this.player.x, this.player.y, 'heal');
        } else {
            // Damage-based special attacks
            let enemiesHit = 0;
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - this.player.x, 2) + 
                    Math.pow(enemy.y - this.player.y, 2)
                );
                
                if (distance <= attack.range) {
                    enemy.health -= attack.damage;
                    this.createCombatEffect(enemy.x, enemy.y, 'special');
                    enemiesHit++;
                    
                    if (enemy.health <= 0) {
                        this.killEnemy(enemy);
                    }
                }
            });
            
            if (enemiesHit > 0) {
                this.addMessage(`${attackName} hit ${enemiesHit} enemies for ${attack.damage} damage!`, 'combat');
                this.playSoundEffect('combat');
            } else {
                this.addMessage(`${attackName} missed all enemies!`, 'system');
            }
        }
        
        this.updateUI();
    }
    
    triggerWeaponSpecial(weapon) {
        // Special weapon abilities
        switch(weapon.name) {
            case 'Flame Blade':
            case 'Fire Sword':
                this.addStatusEffect('burn', 3000); // Burn for 3 seconds
                this.addMessage('🔥 Your weapon ignites with flames!', 'combat');
                break;
            case 'Ice Blade':
            case 'Frost Sword':
                this.addStatusEffect('freeze', 2000); // Freeze for 2 seconds
                this.addMessage('❄️ Your weapon radiates freezing cold!', 'combat');
                break;
            case 'Lightning Edge':
                this.addStatusEffect('shock', 1500); // Shock for 1.5 seconds
                this.addMessage('⚡ Your weapon crackles with electricity!', 'combat');
                break;
            case 'Poison Dagger':
                this.addStatusEffect('poison', 5000); // Poison for 5 seconds
                this.addMessage('☠️ Your weapon drips with poison!', 'combat');
                break;
            case 'Dragon Slayer':
                if (this.enemies.some(e => e.name.includes('Dragon'))) {
                    this.addStatusEffect('dragonbane', 10000); // Extra damage vs dragons
                    this.addMessage('🐉 Your Dragon Slayer glows with ancient power!', 'combat');
                }
                break;
        }
    }
    
    addStatusEffect(effect, duration) {
        this.weaponStatusEffect = { type: effect, duration: duration, remaining: duration };
    }
    
    performAttack() {
        if (!this.equipment.weapon) {
            this.addMessage('No weapon equipped!', 'system');
            return;
        }
        
        const weapon = this.equipment.weapon;
        // Make melee attacks much faster
        let cooldown = weapon.attackSpeed || 500;
        if (weapon.subtype !== 'bow' && weapon.subtype !== 'staff') {
            cooldown = Math.min(cooldown, 150); // Cap melee at 150ms max for super fast combat
        }
        this.attackCooldown = cooldown;
        this.isAttacking = true;
        
        // Create attack based on weapon type
        const rangedWeapons = ['bow', 'staff', 'gun', 'throwing'];
        if (rangedWeapons.includes(weapon.subtype)) {
            this.createProjectile();
        } else {
            this.createMeleeAttack();
        }
        
        // Trigger weapon special ability
        this.triggerWeaponSpecial(weapon);
        
        // Reset attack animation
        setTimeout(() => {
            this.isAttacking = false;
        }, 200);
    }
    
    createProjectile() {
        if (!this.equipment.weapon) return;
        
        const weapon = this.equipment.weapon;
        let dx = 0, dy = 0;
        

        
        // AUTO-AIM: Find nearest enemy
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        for (let enemy of this.enemies) {
            const distance = Math.sqrt(
                Math.pow(enemy.x - this.player.x, 2) + 
                Math.pow(enemy.y - this.player.y, 2)
            );
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        // Increase auto-aim range significantly for better targeting
        const autoAimRange = Math.max(weapon.range || 250, 400); // At least 400px range
        
        if (nearestEnemy && nearestDistance <= autoAimRange) {
            // Calculate direction to nearest enemy
            const deltaX = nearestEnemy.x + nearestEnemy.width/2 - (this.player.x + this.player.width/2);
            const deltaY = nearestEnemy.y + nearestEnemy.height/2 - (this.player.y + this.player.height/2);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Normalize direction
            dx = deltaX / distance;
            dy = deltaY / distance;
            
            this.addMessage(`🎯 Auto-targeting enemy at ${Math.round(nearestDistance)}px!`, 'combat');
        } else {
            // Fallback to player facing direction if no enemies in range
            switch(this.player.direction) {
                case 'up': dy = -1; break;
                case 'down': dy = 1; break;
                case 'left': dx = -1; break;
                case 'right': dx = 1; break;
            }
            
            if (this.enemies.length > 0) {
                this.addMessage(`No enemies in range (nearest: ${Math.round(nearestDistance)}px)`, 'system');
            } else {
                this.addMessage('No enemies found - shooting forward', 'system');
            }
        }
        
        // For magic weapons, check mana
        if (weapon.subtype === 'staff' || weapon.name === 'Magic Rifle' || weapon.name === 'Crystal Orb') {
            const manaCost = weapon.name === 'Crystal Orb' ? 10 : 5;
            if (this.player.mana < manaCost) {
                this.addMessage('Not enough mana!', 'system');
                return;
            }
            this.player.mana -= manaCost;
            this.updateUI();
        }
        
        this.projectiles.push(new Projectile(
            this.player.x + this.player.width/2,
            this.player.y + this.player.height/2,
            dx, dy,
            weapon
        ));
    }
    
    createMeleeAttack() {
        const weapon = this.equipment.weapon;
        const range = weapon.range || 60; // Increased default melee range
        let enemiesHit = 0;
        
        this.addMessage(`Melee attack with ${weapon.name} (${weapon.subtype}) - Range: ${range}px`, 'system');
        
        // Check for enemies in range
        this.enemies.forEach(enemy => {
            // Calculate distance between player center and enemy center
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(enemyCenterX - playerCenterX, 2) + 
                Math.pow(enemyCenterY - playerCenterY, 2)
            );
            
            // Account for enemy size in hit detection
            const effectiveRange = range + (enemy.width + enemy.height) / 4;
            
            if (distance <= effectiveRange) {
                this.damageEnemy(enemy, weapon);
                enemiesHit++;
            }
        });
        
        // Create visual effect
        this.createCombatEffect(this.player.x, this.player.y, 'melee');
        
        // Debug message if no enemies hit
        if (enemiesHit === 0) {
            this.addMessage(`Melee attack missed! Range: ${range}px. Enemies nearby: ${this.enemies.length}`, 'system');
        } else {
            // Play combat sound effect
            this.playSoundEffect('combat');
        }
    }
    
    createCombatEffect(x, y, type) {
        this.combatEffects.push(new CombatEffect(x, y, type));
    }
    
    damageEnemy(enemy, weapon) {
        const playerStats = this.calculateTotalStats();
        const damage = Math.max(1, (weapon.strength || 0) + playerStats.strength - enemy.defense);
        
        enemy.health -= damage;
        this.createCombatEffect(enemy.x, enemy.y, 'damage');
        
        // Apply weapon status effects
        this.applyWeaponEffects(enemy, weapon);
        
        // Add combat message to show damage
        this.addMessage(`Dealt ${damage} damage to ${enemy.name}! (${enemy.health}/${enemy.maxHealth} HP)`, 'combat');
        
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    applyWeaponEffects(enemy, weapon) {
        if (!this.weaponStatusEffect) return;
        
        const effect = this.weaponStatusEffect;
        let extraDamage = 0;
        
        switch(effect.type) {
            case 'burn':
                extraDamage = 10;
                this.createCombatEffect(enemy.x, enemy.y, 'fire');
                this.addMessage(`🔥 ${enemy.name} is burning! +${extraDamage} fire damage!`, 'combat');
                break;
            case 'freeze':
                extraDamage = 8;
                enemy.speed *= 0.5; // Slow enemy
                this.createCombatEffect(enemy.x, enemy.y, 'ice');
                this.addMessage(`❄️ ${enemy.name} is frozen! +${extraDamage} frost damage!`, 'combat');
                break;
            case 'shock':
                extraDamage = 15;
                this.createCombatEffect(enemy.x, enemy.y, 'lightning');
                this.addMessage(`⚡ ${enemy.name} is shocked! +${extraDamage} lightning damage!`, 'combat');
                break;
            case 'poison':
                extraDamage = 5;
                this.createCombatEffect(enemy.x, enemy.y, 'poison');
                this.addMessage(`☠️ ${enemy.name} is poisoned! +${extraDamage} poison damage!`, 'combat');
                break;
            case 'dragonbane':
                if (enemy.name.includes('Dragon')) {
                    extraDamage = 25;
                    this.createCombatEffect(enemy.x, enemy.y, 'dragonbane');
                    this.addMessage(`🐉 DRAGONBANE! +${extraDamage} bonus damage to ${enemy.name}!`, 'combat');
                }
                break;
        }
        
        enemy.health -= extraDamage;
        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }
    
    killEnemy(enemy) {
        // Remove enemy from array
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // Award XP and gold
        this.player.xp += enemy.xpReward;
        this.player.gold += enemy.goldReward;
        
        this.addMessage(`Defeated ${enemy.name}! Gained ${enemy.xpReward} XP and ${enemy.goldReward} gold!`, 'combat');
        
        // Check for boss defeat
        if (enemy.name === 'Ancient Dragon King') {
            this.bossDefeated = true;
            this.gameComplete = true;
            this.addMessage('🎉 THE ANCIENT DRAGON KING HAS FALLEN! 🎉', 'combat');
            this.showVictoryScreen();
            return;
        }
        
        // Random item drop
        if (Math.random() < 0.2) {
            const drops = ['Health Potion', 'Mana Potion', 'Steel Blade', 'Hunter Bow', 'Gem', 'Small Chest'];
            const drop = drops[Math.floor(Math.random() * drops.length)];
            this.addItem(drop, 1);
            this.addMessage(`${enemy.name} dropped a ${drop}!`, 'loot');
        }
        
        this.checkLevelUp();
        this.updateUI();
    }
    
    checkCombatCollisions() {
        // Check projectile vs enemy collisions
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (projectile.active && this.isColliding(projectile, enemy)) {
                    this.damageEnemy(enemy, projectile.weapon);
                    projectile.active = false;
                    this.createCombatEffect(enemy.x, enemy.y, 'projectile');
                }
            });
        });
        
        // Check enemy vs player collisions
        this.enemies.forEach(enemy => {
            if (this.isColliding(this.player, enemy)) {
                // Damage player
                this.player.health -= 5;
                this.createCombatEffect(this.player.x, this.player.y, 'damage');
                
                if (this.player.health <= 0) {
                    this.gameOver();
                } else {
                    this.updateUI();
                }
                
                // Push enemy away to prevent continuous damage
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    enemy.x += (dx / distance) * 20;
                    enemy.y += (dy / distance) * 20;
                }
            }
        });
    }
    
    manageEnemySpawning() {
        // Limit enemies based on area danger level
        const maxEnemies = this.currentArea.dangerLevel * 2;
        
        // Don't spawn regular enemies if boss is present
        const bossPresent = this.enemies.some(enemy => enemy.name === 'Ancient Dragon King');
        
        if (this.enemies.length < maxEnemies && Math.random() < 0.01 && !bossPresent) {
            this.spawnRandomEnemy();
        }
    }
    
    spawnRandomEnemy() {
        const enemyTypes = this.currentArea.enemies || ['Goblin', 'Slime'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Find spawn position away from player
        let x, y;
        do {
            x = Math.random() * (this.canvas.width - 50) + 25;
            y = Math.random() * (this.canvas.height - 50) + 25;
        } while (Math.sqrt(Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2)) < 100);
        
        this.enemies.push(new Enemy(x, y, enemyType, this.currentArea.dangerLevel));
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    checkInteractions() {
        // Check if player is near any interactive objects
        // This is where we can add NPCs, treasure chests, doors, etc.
    }
    
    handleSpaceInteraction() {
        const interactDistance = 50;
        let foundInteraction = false;
        
        // Check for specific area interactions
        if (this.currentArea.name === 'Starting Village') {
            const wellX = 790, wellY = 490, wellW = 30, wellH = 30;
            const distToWell = Math.sqrt(
                Math.pow(this.player.x - (wellX + wellW/2), 2) + 
                Math.pow(this.player.y - (wellY + wellH/2), 2)
            );
            
            if (distToWell < interactDistance) {
                this.addMessage('You examine the village well. It looks deep and mysterious...', 'system');
                if (Math.random() < 0.4) {
                    this.addMessage('You found a gold coin at the bottom!', 'loot');
                    this.player.gold += 10;
                    this.updateUI();
                }
                foundInteraction = true;
            }
        }
        
        if (this.currentArea.name === 'Ancient Ruins') {
            const chestX = 790, chestY = 490, chestW = 30, chestH = 20;
            const distToChest = Math.sqrt(
                Math.pow(this.player.x - (chestX + chestW/2), 2) + 
                Math.pow(this.player.y - (chestY + chestH/2), 2)
            );
            
            if (distToChest < interactDistance) {
                // Give player different types of chests to collect
                const chestTypes = ['Small Chest', 'Treasure Chest', 'Large Chest', 'Magic Chest'];
                const chestType = chestTypes[Math.floor(Math.random() * chestTypes.length)];
                
                this.addMessage(`You found a ${chestType}! Added to inventory.`, 'loot');
                this.addItem(chestType, 1);
                this.playSoundEffect('pickup');
                this.addMessage('Open it from your inventory when ready!', 'system');
                foundInteraction = true;
                this.updateUI();
            }
        }
        
        if (this.currentArea.name === 'Dark Forest') {
            // Check for mushrooms
            const mushroom1X = 180, mushroom1Y = 300;
            const mushroom2X = 320, mushroom2Y = 120;
            
            const distToMushroom1 = Math.sqrt(
                Math.pow(this.player.x - mushroom1X, 2) + 
                Math.pow(this.player.y - mushroom1Y, 2)
            );
            const distToMushroom2 = Math.sqrt(
                Math.pow(this.player.x - mushroom2X, 2) + 
                Math.pow(this.player.y - mushroom2Y, 2)
            );
            
            if (distToMushroom1 < interactDistance || distToMushroom2 < interactDistance) {
                this.addMessage('You examine the glowing mushroom. It pulses with magical energy!', 'system');
                if (Math.random() < 0.6) {
                    this.player.mana = Math.min(this.player.maxMana, this.player.mana + 20);
                    this.addMessage('The mushroom restores your mana!', 'system');
                    this.updateUI();
                }
                foundInteraction = true;
            }
        }
        
        // If no specific interaction found, do general search
        if (!foundInteraction) {
            this.addMessage('You search the area...', 'system');
            
            // Random chance for finding something
            if (Math.random() < 0.3) {
                this.searchForTreasure();
            } else if (Math.random() < 0.2) {
                this.searchForEnemies();
            } else {
                this.addMessage('Nothing interesting here.', 'system');
            }
        }
    }
    
    // UI Updates
    updateUI() {
        document.getElementById('heroName').textContent = this.player.name;
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('characterType').textContent = this.player.characterType;
        
        document.getElementById('currentHP').textContent = this.player.health;
        document.getElementById('maxHP').textContent = this.player.maxHealth;
        document.getElementById('currentMP').textContent = this.player.mana;
        document.getElementById('maxMP').textContent = this.player.maxMana;
        document.getElementById('currentXP').textContent = this.player.xp;
        document.getElementById('nextLevelXP').textContent = this.player.nextLevelXP;
        
        // Update stat bars
        document.getElementById('hpBar').style.width = (this.player.health / this.player.maxHealth) * 100 + '%';
        document.getElementById('mpBar').style.width = (this.player.mana / this.player.maxMana) * 100 + '%';
        document.getElementById('xpBar').style.width = (this.player.xp / this.player.nextLevelXP) * 100 + '%';
        
        // Update stats
        const totalStats = this.calculateTotalStats();
        document.getElementById('strStat').textContent = totalStats.strength;
        document.getElementById('defStat').textContent = totalStats.defense;
        document.getElementById('spdStat').textContent = totalStats.speed;
        document.getElementById('magStat').textContent = totalStats.magic;
        
        document.getElementById('goldCount').textContent = this.player.gold;
        
        // Update area info
        document.getElementById('currentArea').textContent = this.currentArea.name;
        document.getElementById('areaDescription').textContent = this.currentArea.description;
        document.getElementById('dangerLevel').textContent = '★'.repeat(this.currentArea.dangerLevel) + 
                                                           '☆'.repeat(5 - this.currentArea.dangerLevel);
        
        this.updateInventoryDisplay();
        this.updateEquipmentDisplay();
    }
    
    calculateTotalStats() {
        let totalStats = {
            strength: this.player.strength,
            defense: this.player.defense,
            speed: this.player.speed,
            magic: this.player.magic
        };
        
        // Add equipment bonuses
        Object.values(this.equipment).forEach(item => {
            if (item) {
                if (item.strength) totalStats.strength += item.strength;
                if (item.defense) totalStats.defense += item.defense;
                if (item.speed) totalStats.speed += item.speed;
                if (item.magic) totalStats.magic += item.magic;
            }
        });
        
        return totalStats;
    }
    
    updateInventoryDisplay() {
        // Update dialog inventory if it's open
        if (document.getElementById('inventoryDialog').style.display !== 'none') {
            this.updateInventoryDialog();
        }
        
        // Update item count displays
        const itemCount = this.inventory.filter(item => item !== null).length;
        const quickCountElement = document.getElementById('quickItemCount');
        if (quickCountElement) {
            quickCountElement.textContent = itemCount;
        }
        
        const dialogCountElement = document.getElementById('inventoryItemCount');
        if (dialogCountElement) {
            dialogCountElement.textContent = itemCount;
        }
    }
    
    updateInventoryDialog() {
        const grid = document.getElementById('inventoryDialogGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 0; i < this.inventorySize; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            slot.style.width = '60px';
            slot.style.height = '60px';
            
            if (this.inventory[i]) {
                const item = this.inventory[i];
                slot.innerHTML = `
                    <div class="item-icon" style="font-size: 24px;">${item.icon}</div>
                    ${item.quantity > 1 ? `<div class="item-count">${item.quantity}</div>` : ''}
                `;
                slot.title = `${item.name} ${item.quantity > 1 ? `(${item.quantity})` : ''}\nValue: ${item.value} gold\nClick to use/equip`;
                slot.onclick = () => this.useItem(i);
                
                // Add hover effect to show item name prominently
                slot.onmouseenter = () => this.showItemName(item);
                slot.onmouseleave = () => this.hideItemName();
            }
            
            grid.appendChild(slot);
        }
        
        // Update selected item name display
        this.updateSelectedItemName();
        
        // Update equipment display in inventory dialog
        this.updateInventoryEquipmentDisplay();
    }
    
    updateInventoryEquipmentDisplay() {
        const weaponSlot = document.getElementById('inventoryWeaponSlot');
        const shieldSlot = document.getElementById('inventoryShieldSlot');
        const armorSlot = document.getElementById('inventoryArmorSlot');
        
        if (weaponSlot) {
            weaponSlot.innerHTML = this.equipment.weapon ? 
                `<div class="item-icon" style="font-size: 28px;">${this.equipment.weapon.icon}</div><div class="slot-label">Weapon</div>` :
                '<div class="slot-label">Weapon</div>';
        }
            
        if (shieldSlot) {
            shieldSlot.innerHTML = this.equipment.shield ? 
                `<div class="item-icon" style="font-size: 28px;">${this.equipment.shield.icon}</div><div class="slot-label">Shield</div>` :
                '<div class="slot-label">Shield</div>';
        }
            
        if (armorSlot) {
            armorSlot.innerHTML = this.equipment.armor ? 
                `<div class="item-icon" style="font-size: 28px;">${this.equipment.armor.icon}</div><div class="slot-label">Armor</div>` :
                '<div class="slot-label">Armor</div>';
        }
    }
    
    toggleInventory() {
        const dialog = document.getElementById('inventoryDialog');
        if (dialog.style.display === 'none' || dialog.style.display === '') {
            this.openInventory();
        } else {
            this.closeInventory();
        }
    }
    
    openInventory() {
        const dialog = document.getElementById('inventoryDialog');
        dialog.style.display = 'block';
        this.paused = true;  // Pause game when inventory is open
        this.updateInventoryDialog();
        this.addMessage('Game paused - inventory open', 'system');
    }
    
    closeInventory() {
        document.getElementById('inventoryDialog').style.display = 'none';
        this.paused = false;  // Resume game when inventory is closed
        this.addMessage('Game resumed', 'system');
    }
    
    updateEquipmentDisplay() {
        const weaponSlot = document.getElementById('weaponSlot');
        const shieldSlot = document.getElementById('shieldSlot');
        const armorSlot = document.getElementById('armorSlot');
        
        weaponSlot.innerHTML = this.equipment.weapon ? 
            `<div class="item-icon">${this.equipment.weapon.icon}</div><div class="slot-label">Weapon</div>` :
            '<div class="slot-label">Weapon</div>';
            
        shieldSlot.innerHTML = this.equipment.shield ? 
            `<div class="item-icon">${this.equipment.shield.icon}</div><div class="slot-label">Shield</div>` :
            '<div class="slot-label">Shield</div>';
            
        armorSlot.innerHTML = this.equipment.armor ? 
            `<div class="item-icon">${this.equipment.armor.icon}</div><div class="slot-label">Armor</div>` :
            '<div class="slot-label">Armor</div>';
    }
    
    // Inventory Management
    addItem(itemName, quantity = 1) {
        const itemData = this.itemDatabase[itemName];
        if (!itemData) return false;
        
        const existingIndex = this.inventory.findIndex(item => item && item.name === itemName);
        
        if (existingIndex !== -1) {
            this.inventory[existingIndex].quantity += quantity;
        } else {
            for (let i = 0; i < this.inventorySize; i++) {
                if (!this.inventory[i]) {
                    this.inventory[i] = {
                        name: itemName,
                        quantity: quantity,
                        ...itemData
                    };
                    break;
                }
            }
        }
        
        this.updateInventoryDisplay();
        
        // Track weapon collection
        if (itemData.type === 'weapon') {
            this.weaponCollection.add(itemName);
            this.updateBestWeapons();
        }
        
        return true;
    }
    
    showItemName(item) {
        this.selectedItem = item;
        this.updateSelectedItemName();
    }
    
    hideItemName() {
        this.selectedItem = null;
        this.updateSelectedItemName();
    }
    
    updateSelectedItemName() {
        const nameDisplay = document.getElementById('selectedItemName');
        if (nameDisplay) {
            if (this.selectedItem) {
                nameDisplay.innerHTML = `
                    <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px; border: 2px solid #5fb370;">
                        <div style="color: #5fb370; font-weight: bold; font-size: 16px;">${this.selectedItem.name}</div>
                        <div style="color: #fff; font-size: 12px; margin-top: 5px;">
                            ${this.selectedItem.type} ${this.selectedItem.subtype ? `(${this.selectedItem.subtype})` : ''}
                        </div>
                        <div style="color: #ffd700; font-size: 12px;">Value: ${this.selectedItem.value} gold</div>
                        ${this.selectedItem.strength ? `<div style="color: #ff6b6b; font-size: 12px;">⚔️ Strength: +${this.selectedItem.strength}</div>` : ''}
                        ${this.selectedItem.defense ? `<div style="color: #4ecdc4; font-size: 12px;">🛡️ Defense: +${this.selectedItem.defense}</div>` : ''}
                        ${this.selectedItem.range ? `<div style="color: #95a5a6; font-size: 12px;">📏 Range: ${this.selectedItem.range}px</div>` : ''}
                        ${this.selectedItem.quantity > 1 ? `<div style="color: #f39c12; font-size: 12px;">📦 Quantity: ${this.selectedItem.quantity}</div>` : ''}
                    </div>
                `;
            } else {
                nameDisplay.innerHTML = '';
            }
        }
    }
    
    findItemSlot(itemName) {
        return this.inventory.findIndex(item => item && item.name === itemName);
    }
    
    removeItem(slotIndex, quantity = 1) {
        if (!this.inventory[slotIndex]) return false;
        
        this.inventory[slotIndex].quantity -= quantity;
        
        if (this.inventory[slotIndex].quantity <= 0) {
            this.inventory[slotIndex] = null;
        }
        
        this.updateInventoryDisplay();
        return true;
    }
    
    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;
        
        if (item.type === 'weapon' || item.type === 'shield' || item.type === 'armor') {
            this.equipItem(slotIndex);
        } else if (item.type === 'consumable') {
            this.consumeItem(slotIndex);
        } else if (item.type === 'container' && item.openable) {
            this.openChest(slotIndex);
        }
    }
    
    openChest(slotIndex) {
        const chest = this.inventory[slotIndex];
        if (!chest || !chest.openable) return;
        
        // Generate chest contents based on chest type
        const contents = this.generateChestContents(chest.name);
        
        // Remove chest from inventory
        this.removeItem(slotIndex, 1);
        
        // Show chest opening dialog
        this.showChestDialog(contents);
    }
    
    generateChestContents(chestType) {
        let contents = [];
        
        switch(chestType) {
            case 'Small Chest':
                // 1-2 items, basic stuff
                const smallItems = ['Health Potion', 'Mana Potion', 'Food', 'Gold Coin'];
                for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                    const item = smallItems[Math.floor(Math.random() * smallItems.length)];
                    const quantity = item === 'Gold Coin' ? Math.floor(Math.random() * 30) + 10 : 1;
                    contents.push({ name: item, quantity: quantity });
                }
                break;
                
            case 'Treasure Chest':
                // 2-4 items, good stuff
                const treasureItems = ['Steel Blade', 'Hunter Bow', 'Iron Staff', 'Health Potion', 'Mana Potion', 'Gem', 'Gold Coin'];
                for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
                    const item = treasureItems[Math.floor(Math.random() * treasureItems.length)];
                    const quantity = item === 'Gold Coin' ? Math.floor(Math.random() * 100) + 50 : 1;
                    contents.push({ name: item, quantity: quantity });
                }
                break;
                
            case 'Large Chest':
                // 3-5 items, great stuff
                const largeItems = ['Silver Sword', 'Elven Bow', 'Magic Staff', 'Iron Shield', 'Chain Mail', 'Health Potion', 'Gem', 'Gold Coin'];
                for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
                    const item = largeItems[Math.floor(Math.random() * largeItems.length)];
                    const quantity = item === 'Gold Coin' ? Math.floor(Math.random() * 200) + 100 : 1;
                    contents.push({ name: item, quantity: quantity });
                }
                break;
                
            case 'Magic Chest':
                // 4-6 items, legendary stuff
                const magicItems = ['Lightning Edge', 'Phoenix Bow', 'Archmage Staff', 'Magic Shield', 'Mage Robes', 'Dragon Slayer', 'Gem', 'Gold Coin'];
                for (let i = 0; i < Math.floor(Math.random() * 3) + 4; i++) {
                    const item = magicItems[Math.floor(Math.random() * magicItems.length)];
                    const quantity = item === 'Gold Coin' ? Math.floor(Math.random() * 500) + 200 : 1;
                    contents.push({ name: item, quantity: quantity });
                }
                break;
                
            default:
                // Default treasure chest contents
                contents = [
                    { name: 'Health Potion', quantity: 2 },
                    { name: 'Gold Coin', quantity: 50 }
                ];
        }
        
        return contents;
    }
    
    showChestDialog(contents) {
        const dialog = document.getElementById('chestDialog');
        const contentsDiv = document.getElementById('chestContents');
        
        let html = '<h4>You found:</h4>';
        contents.forEach(item => {
            const itemData = this.itemDatabase[item.name];
            html += `<div style="margin: 10px 0;">
                ${itemData.icon} ${item.name} ${item.quantity > 1 ? `x${item.quantity}` : ''}
            </div>`;
        });
        
        contentsDiv.innerHTML = html;
        dialog.style.display = 'block';
        
        // Store contents for when player clicks "Take All"
        this.pendingChestContents = contents;
    }
    
    equipItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || (item.type !== 'weapon' && item.type !== 'shield' && item.type !== 'armor')) return;
        
        // Unequip current item if any
        if (this.equipment[item.type]) {
            this.addItem(this.equipment[item.type].name, 1);
        }
        
        // Equip new item
        this.equipment[item.type] = { ...item };
        this.removeItem(slotIndex, 1);
        
        this.addMessage(`Equipped ${item.name}!`, 'system');
        this.updateUI();
    }
    
    consumeItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item.type !== 'consumable') return;
        
        if (item.heal) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + item.heal);
            this.addMessage(`Used ${item.name}! Restored ${item.heal} HP.`, 'system');
        }
        
        if (item.mana) {
            this.player.mana = Math.min(this.player.maxMana, this.player.mana + item.mana);
            this.addMessage(`Used ${item.name}! Restored ${item.mana} MP.`, 'system');
        }
        
        this.removeItem(slotIndex, 1);
        this.updateUI();
    }
    
    // Game Actions
    searchForEnemies() {
        // Spawn an enemy near the player
        const enemyTypes = this.currentArea.enemies || ['Goblin', 'Slime'];
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Spawn near player but not too close
        let x, y;
        do {
            x = this.player.x + (Math.random() - 0.5) * 200;
            y = this.player.y + (Math.random() - 0.5) * 200;
            x = Math.max(25, Math.min(this.canvas.width - 25, x));
            y = Math.max(25, Math.min(this.canvas.height - 25, y));
        } while (Math.sqrt(Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2)) < 60);
        
        this.enemies.push(new Enemy(x, y, enemyType, this.currentArea.dangerLevel));
        this.addMessage(`A ${enemyType} appears!`, 'combat');
    }
    
    searchForTreasure() {
        const treasures = ['Gold Coin', 'Gem', 'Health Potion', 'Mana Potion', 'Small Chest', 'Treasure Chest'];
        const found = treasures[Math.floor(Math.random() * treasures.length)];
        const quantity = found === 'Gold Coin' ? Math.floor(Math.random() * 50) + 10 : 1;
        
        if (found === 'Gold Coin') {
            this.player.gold += quantity;
            this.addMessage(`Found ${quantity} gold coins!`, 'loot');
        } else if (found.includes('Chest')) {
            this.addItem(found, quantity);
            this.addMessage(`Found a ${found}! Open it from your inventory.`, 'loot');
        } else {
            this.addItem(found, quantity);
            this.addMessage(`Found ${found}!`, 'loot');
        }
        
        this.updateUI();
    }
    
    exploreArea() {
        const events = [
            () => this.searchForTreasure(),
            () => this.searchForEnemies(),
            () => {
                this.player.xp += 10;
                this.addMessage('You explored the area and gained experience!', 'system');
                this.checkLevelUp();
            },
            () => {
                const goldFound = Math.floor(Math.random() * 20) + 5;
                this.player.gold += goldFound;
                this.addMessage(`You found ${goldFound} gold while exploring!`, 'loot');
            }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
        this.updateUI();
    }
    
    rest() {
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.addMessage('You rest and recover your health and mana.', 'system');
        this.updateUI();
    }
    
    useMagic() {
        if (this.player.mana < 10) {
            this.addMessage('Not enough mana!', 'system');
            return;
        }
        
        this.player.mana -= 10;
        
        const magicEffects = [
            'You cast a healing spell and recover some health!',
            'You cast a light spell to illuminate the area!',
            'You cast a detection spell and sense nearby treasures!',
            'You cast a protection spell, increasing your defense temporarily!'
        ];
        
        const effect = magicEffects[Math.floor(Math.random() * magicEffects.length)];
        this.addMessage(effect, 'system');
        
        if (effect.includes('healing')) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        }
        
        this.updateUI();
    }
    
    moveToNewArea() {
        const availableAreas = this.areas.filter(area => area.name !== this.currentArea.name);
        const newArea = availableAreas[Math.floor(Math.random() * availableAreas.length)];
        
        this.currentArea = newArea;
        
        // Clear enemies and effects when changing areas
        this.enemies = [];
        this.projectiles = [];
        this.combatEffects = [];
        
        this.addMessage(`Moved to ${this.currentArea.name}!`, 'system');
        this.updateUI();
        this.renderGameArea();
    }
    
    // Combat is now real-time! See performAttack() method above
    
    checkLevelUp() {
        if (this.player.xp >= this.player.nextLevelXP) {
            this.player.level++;
            this.player.xp -= this.player.nextLevelXP;
            this.player.nextLevelXP = Math.floor(this.player.nextLevelXP * 1.5);
            
            // Level up bonuses
            this.player.maxHealth += 15;
            this.player.health = this.player.maxHealth;
            this.player.maxMana += 5;
            this.player.mana = this.player.maxMana;
            this.player.strength += 2;
            this.player.defense += 1;
            this.player.speed += 1;
            this.player.magic += 1;
            
            this.addMessage(`🎉 Level Up! You are now level ${this.player.level}!`, 'system');
            this.updateUI();
        }
    }
    
    gameOver() {
        this.addMessage('💀 Game Over! You have been defeated...', 'combat');
        
        // Clear all enemies and effects
        this.enemies = [];
        this.projectiles = [];
        this.combatEffects = [];
        
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.player.gold = Math.floor(this.player.gold * 0.8);
        this.currentArea = this.areas[0];
        
        this.addMessage('You wake up in the starting village...', 'system');
        this.updateUI();
    }
    
    // Quick Actions
    useHealthPotion() {
        const potionIndex = this.inventory.findIndex(item => item && item.name === 'Health Potion');
        if (potionIndex !== -1) {
            this.consumeItem(potionIndex);
        } else {
            this.addMessage('No Health Potions in inventory!', 'system');
        }
    }
    
    useManaPotion() {
        const potionIndex = this.inventory.findIndex(item => item && item.name === 'Mana Potion');
        if (potionIndex !== -1) {
            this.consumeItem(potionIndex);
        } else {
            this.addMessage('No Mana Potions in inventory!', 'system');
        }
    }
    
    useFood() {
        const foodIndex = this.inventory.findIndex(item => item && item.name === 'Food');
        if (foodIndex !== -1) {
            this.consumeItem(foodIndex);
        } else {
            this.addMessage('No Food in inventory!', 'system');
        }
    }
    
    openEquipmentMenu(type) {
        this.addMessage(`Click on ${type} in inventory to equip it!`, 'system');
    }
    
    openShop() {
        const dialog = document.getElementById('shopDialog');
        dialog.style.display = 'block';
        this.populateShop();
        this.updateShopDisplay();
    }
    
    populateShop() {
        const shopItems = document.getElementById('shopItems');
        const sellItems = document.getElementById('sellItems');
        
        console.log('Populating shop...');
        console.log('Dragon Slayer in database:', this.itemDatabase['Dragon Slayer']);
        
        // Shop inventory - items for sale
        const forSale = [
            // Consumables
            'Health Potion', 'Mana Potion', 'Food',
            
            // Basic weapons
            'Iron Sword', 'Steel Blade', 'Silver Sword', 'Magic Blade', 'Flame Sword', 'Dragon Slayer',
            'Hunter Bow', 'Composite Bow', 'Elven Bow', 'Magic Bow',
            'Iron Staff', 'Magic Staff', 'Crystal Wand', 'Fire Staff',
            'Steel Dagger', 'Poison Blade', 'Shadow Dagger', 'Flame Blade', 'Ice Blade', 'Lightning Edge',
            'Iron Spear', 'Halberd', 'Trident',
            'War Hammer', 'Thunder Hammer',
            
            // New weapon types
            'Hand Axe', 'Battle Axe', 'Viking Axe',
            'Leather Whip', 'Chain Whip', 'Thorn Whip',
            'Flintlock Pistol', 'Musket', 'Magic Rifle',
            'Throwing Knife', 'Shuriken', 'Chakram', 'Boomerang',
            'Apprentice Katana', 'Master Katana',
            'Farmer Scythe', 'Death Scythe',
            'Nunchucks', 'Kama', 'Tonfa', 'Claws',
            
            // Armor & accessories
            'Iron Shield', 'Magic Shield', 'Chain Mail', 'Plate Armor', 'Mage Robes',
            
            // Special items
            'Small Chest', 'Treasure Chest', 'Large Chest'
        ];
        
        console.log('forSale array:', forSale);
        console.log('Does forSale include Dragon Slayer?', forSale.includes('Dragon Slayer'));
        
        let shopHTML = '';
        forSale.forEach(itemName => {
            const item = this.itemDatabase[itemName];
            console.log(`Checking item: ${itemName}, found:`, item);
            if (item) {
                if (itemName === 'Dragon Slayer') {
                    console.log('Found Dragon Slayer! Adding to shop HTML...');
                }
                shopHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 5px 0; padding: 5px; border: 1px solid #4a7c59; border-radius: 3px;">
                        <span>${item.icon} ${itemName}</span>
                        <button class="combat-btn" onclick="game.buyItem('${itemName}')" style="padding: 5px 10px; font-size: 12px;">
                            Buy ${item.value}💰
                        </button>
                    </div>
                `;
            } else if (itemName === 'Dragon Slayer') {
                console.error('Dragon Slayer not found in itemDatabase!');
            }
        });
        console.log('Final shop HTML length:', shopHTML.length);
        console.log('Shop HTML contains Dragon Slayer?', shopHTML.includes('Dragon Slayer'));
        shopItems.innerHTML = shopHTML;
        
        // Player items for sale
        let sellHTML = '';
        this.inventory.forEach((item, index) => {
            if (item && item.type !== 'container') {
                const sellPrice = Math.floor(item.value * 0.6); // Sell for 60% of value
                sellHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 5px 0; padding: 5px; border: 1px solid #4a7c59; border-radius: 3px;">
                        <span>${item.icon} ${item.name} ${item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        <button class="combat-btn" onclick="game.sellItem(${index})" style="padding: 5px 10px; font-size: 12px;">
                            Sell ${sellPrice}💰
                        </button>
                    </div>
                `;
            }
        });
        sellItems.innerHTML = sellHTML || '<div style="text-align: center; color: #888;">No sellable items</div>';
    }
    
    buyItem(itemName) {
        const item = this.itemDatabase[itemName];
        if (!item) return;
        
        if (this.player.gold >= item.value) {
            this.player.gold -= item.value;
            this.addItem(itemName, 1);
            this.addMessage(`Bought ${itemName} for ${item.value} gold!`, 'loot');
            this.updateShopDisplay();
            this.updateUI();
        } else {
            this.addMessage('Not enough gold!', 'system');
        }
    }
    
    sellItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item) return;
        
        const sellPrice = Math.floor(item.value * 0.6);
        this.player.gold += sellPrice;
        this.removeItem(slotIndex, 1);
        this.addMessage(`Sold ${item.name} for ${sellPrice} gold!`, 'loot');
        
        this.populateShop(); // Refresh shop display
        this.updateShopDisplay();
        this.updateUI();
    }
    
    updateShopDisplay() {
        document.getElementById('shopGoldDisplay').textContent = this.player.gold;
    }
    
    closeShop() {
        document.getElementById('shopDialog').style.display = 'none';
    }
    
    saveGame() {
        const saveData = {
            player: this.player,
            equipment: this.equipment,
            inventory: this.inventory,
            currentArea: this.currentArea,
            selectedCharacter: this.selectedCharacter,
            playerName: this.playerName
        };
        
        localStorage.setItem('rpg_save', JSON.stringify(saveData));
        this.addMessage('Game saved!', 'system');
    }
    
    openSpellbook() {
        const spells = [
            '🔥 Fireball - 15 MP - Damage spell',
            '❄️ Ice Shard - 12 MP - Freezing attack',
            '⚡ Lightning - 18 MP - Shocking damage',
            '💚 Heal - 10 MP - Restore health'
        ];
        
        let spellMessage = '📚 Spellbook:\n';
        spells.forEach(spell => {
            spellMessage += spell + '\n';
        });
        
        this.addMessage(spellMessage, 'system');
    }
    
    // Message System
    addMessage(text, type = 'system') {
        const messageLog = document.getElementById('messageLog');
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        messageLog.appendChild(message);
        messageLog.scrollTop = messageLog.scrollHeight;
        
        // Limit message history
        while (messageLog.children.length > 50) {
            messageLog.removeChild(messageLog.firstChild);
        }
    }
    
    // Render Game Area
    renderGameArea() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply camera translation
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Fill large background area for camera movement
        this.ctx.fillStyle = this.getAreaColor();
        this.ctx.fillRect(0, 0, 2000, 1500);  // Large world background
        
        this.drawAreaBackground();
        this.drawPlayer();
        this.drawAreaElements();
    }
    
    getAreaColor() {
        const colors = {
            'Starting Village': '#90EE90',
            'Dark Forest': '#228B22',
            'Mountain Pass': '#8B7355',
            'Ancient Ruins': '#696969',
            'Dragon\'s Lair': '#8B0000'
        };
        return colors[this.currentArea.name] || '#90EE90';
    }
    
    drawAreaBackground() {
        const tileSize = 50;
        for (let x = 0; x < this.canvas.width; x += tileSize) {
            for (let y = 0; y < this.canvas.height; y += tileSize) {
                if ((x + y) % 100 === 0) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                    this.ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }
    }
    
    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        
        // Add a slight animation effect based on movement
        const animOffset = this.player.isMoving ? Math.sin(Date.now() / 200) * 2 : 0;
        
        if (this.selectedCharacter === 'mommydog') {
            // Mommydog (Husky) - Light blue with darker blue markings
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(x, y + animOffset, this.player.width, this.player.height);
            
            // Blue markings (ears)
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(x + 4, y + 4 + animOffset, 8, 8);
            this.ctx.fillRect(x + 20, y + 4 + animOffset, 8, 8);
            
            // White snout
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(x + 8, y + 16 + animOffset, 16, 12);
            
            // Eyes
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 10, y + 10 + animOffset, 3, 3);
            this.ctx.fillRect(x + 19, y + 10 + animOffset, 3, 3);
            
            // Nose
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 14, y + 20 + animOffset, 4, 2);
        } else {
            // Doug (Panda) - White with black markings
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(x, y + animOffset, this.player.width, this.player.height);
            
            // Black markings (ears and eye patches)
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 4, y + 4 + animOffset, 8, 8); // Left ear
            this.ctx.fillRect(x + 20, y + 4 + animOffset, 8, 8); // Right ear
            this.ctx.fillRect(x + 8, y + 8 + animOffset, 6, 8); // Left eye patch
            this.ctx.fillRect(x + 18, y + 8 + animOffset, 6, 8); // Right eye patch
            
            // White eyes
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(x + 10, y + 10 + animOffset, 3, 3);
            this.ctx.fillRect(x + 19, y + 10 + animOffset, 3, 3);
            
            // Black nose
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(x + 14, y + 20 + animOffset, 4, 2);
        }
        
        // Draw direction indicator (small arrow)
        this.ctx.fillStyle = '#FFD700';
        switch(this.player.direction) {
            case 'up':
                this.ctx.fillRect(x + 14, y - 5 + animOffset, 4, 3);
                break;
            case 'down':
                this.ctx.fillRect(x + 14, y + 35 + animOffset, 4, 3);
                break;
            case 'left':
                this.ctx.fillRect(x - 5, y + 14 + animOffset, 3, 4);
                break;
            case 'right':
                this.ctx.fillRect(x + 35, y + 14 + animOffset, 3, 4);
                break;
        }
    }
    
    drawAreaElements() {
        const elements = {
            'Starting Village': () => {
                // Houses - spread across larger canvas
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(200, 150, 60, 45);
                this.ctx.fillRect(1200, 400, 60, 45);
                this.ctx.fillRect(400, 700, 60, 45);
                
                // Doors
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(220, 175, 15, 20);
                this.ctx.fillRect(1220, 425, 15, 20);
                this.ctx.fillRect(420, 725, 15, 20);
                
                // Well in center
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(790, 490, 30, 30);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(800, 500, 10, 10);
                
                // Trees - spread around
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(300, 100, 20, 40);
                this.ctx.fillRect(1000, 200, 20, 40);
                this.ctx.fillRect(600, 800, 20, 40);
                this.ctx.fillRect(100, 600, 20, 40);
            },
            'Dark Forest': () => {
                // Large trees spread across larger canvas
                this.ctx.fillStyle = '#006400';
                this.ctx.fillRect(200, 100, 30, 80);
                this.ctx.fillRect(600, 300, 30, 80);
                this.ctx.fillRect(1000, 150, 30, 80);
                this.ctx.fillRect(150, 500, 35, 90);
                this.ctx.fillRect(1200, 200, 25, 75);
                this.ctx.fillRect(400, 700, 30, 80);
                this.ctx.fillRect(800, 600, 30, 80);
                
                // Bushes spread around
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(350, 250, 40, 20);
                this.ctx.fillRect(700, 450, 35, 18);
                this.ctx.fillRect(1100, 350, 30, 15);
                
                // Mysterious glowing mushrooms
                this.ctx.fillStyle = '#9370DB';
                this.ctx.fillRect(300, 500, 12, 12);
                this.ctx.fillRect(900, 200, 10, 10);
                this.ctx.fillRect(500, 750, 8, 8);
            },
            'Mountain Pass': () => {
                // Large rocks spread across larger canvas
                this.ctx.fillStyle = '#808080';
                this.ctx.fillRect(200, 300, 50, 35);
                this.ctx.fillRect(700, 150, 45, 45);
                this.ctx.fillRect(400, 500, 40, 30);
                this.ctx.fillRect(1000, 400, 60, 45);
                this.ctx.fillRect(300, 700, 45, 35);
                
                // Smaller rocks
                this.ctx.fillStyle = '#A9A9A9';
                this.ctx.fillRect(300, 250, 20, 18);
                this.ctx.fillRect(600, 300, 18, 15);
                this.ctx.fillRect(200, 600, 25, 20);
                this.ctx.fillRect(1200, 200, 22, 18);
            },
            'Ancient Ruins': () => {
                // Ruined walls spread across larger canvas
                this.ctx.fillStyle = '#696969';
                this.ctx.fillRect(200, 150, 90, 30);
                this.ctx.fillRect(200, 150, 30, 120);
                this.ctx.fillRect(600, 300, 120, 25);
                this.ctx.fillRect(600, 300, 25, 90);
                this.ctx.fillRect(1000, 500, 100, 20);
                this.ctx.fillRect(400, 700, 80, 25);
                
                // Broken pillars
                this.ctx.fillStyle = '#D3D3D3';
                this.ctx.fillRect(350, 200, 18, 60);
                this.ctx.fillRect(750, 180, 20, 50);
                this.ctx.fillRect(900, 600, 15, 45);
                
                // Ancient chest (centered for interaction)
                this.ctx.fillStyle = '#B8860B';
                this.ctx.fillRect(790, 490, 30, 20);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(800, 500, 10, 5);
            },
            'Dragon\'s Lair': () => {
                // Lava pools spread across larger canvas
                this.ctx.fillStyle = '#FF4500';
                this.ctx.fillRect(200, 200, 60, 45);
                this.ctx.fillRect(700, 400, 50, 35);
                this.ctx.fillRect(1200, 300, 55, 40);
                this.ctx.fillRect(400, 700, 45, 30);
                
                // Dark rocks
                this.ctx.fillStyle = '#2F4F4F';
                this.ctx.fillRect(400, 150, 75, 60);
                this.ctx.fillRect(800, 500, 65, 50);
                this.ctx.fillRect(1000, 700, 60, 45);
                
                // Dragon treasure hoard
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(500, 300, 45, 30);
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.fillRect(510, 310, 12, 12);
                this.ctx.fillRect(530, 320, 10, 10);
            }
        };
        
        if (elements[this.currentArea.name]) {
            elements[this.currentArea.name]();
        }
        
        // Draw interactive indicators near player
        this.drawInteractionPrompts();
        
        // Draw enemies with names
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
            this.drawEnemyName(enemy);
        });
        
        // Draw projectiles
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Draw combat effects
        this.combatEffects.forEach(effect => effect.render(this.ctx));
        
        // Draw shrines
        this.drawShrines();
        
        // Draw traders
        this.drawTraders();
        
        // Restore context state (removes camera translation)
        this.ctx.restore();
        
        // Draw boss health bar (after restore to avoid camera translation)
        this.drawBossHealthBar();
    }
    
    drawInteractionPrompts() {
        // Check if player is near interactive objects and show prompts
        const interactDistance = 50;
        
        // Example: Check if near well in starting village
        if (this.currentArea.name === 'Starting Village') {
            const wellX = 790, wellY = 490, wellW = 30, wellH = 30;
            const distToWell = Math.sqrt(
                Math.pow(this.player.x - (wellX + wellW/2), 2) + 
                Math.pow(this.player.y - (wellY + wellH/2), 2)
            );
            
            if (distToWell < interactDistance) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = '14px Courier New';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('Press SPACE to examine', wellX - 40, wellY - 15);
                this.ctx.fillText('Press SPACE to examine', wellX - 40, wellY - 15);
            }
        }
        
        // Check for treasure in Ancient Ruins
        if (this.currentArea.name === 'Ancient Ruins') {
            const chestX = 790, chestY = 490, chestW = 30, chestH = 20;
            const distToChest = Math.sqrt(
                Math.pow(this.player.x - (chestX + chestW/2), 2) + 
                Math.pow(this.player.y - (chestY + chestH/2), 2)
            );
            
            if (distToChest < interactDistance) {
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = '14px Courier New';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText('Press SPACE to open chest', chestX - 50, chestY - 15);
                this.ctx.fillText('Press SPACE to open chest', chestX - 50, chestY - 15);
            }
        }
    }
    
    updateBestWeapons() {
        // Get all collected weapons and sort by strength
        this.bestWeapons = Array.from(this.weaponCollection)
            .map(name => ({ name, ...this.itemDatabase[name] }))
            .filter(item => item.type === 'weapon')
            .sort((a, b) => (b.strength || 0) - (a.strength || 0))
            .slice(0, 10); // Top 10 weapons
    }
    
    showBestWeapons() {
        if (this.bestWeapons.length === 0) {
            this.addMessage('No weapons collected yet! Find weapons to build your collection.', 'system');
            return;
        }
        
        const dialog = document.getElementById('bestWeaponsDialog');
        if (dialog) {
            dialog.style.display = 'block';
            this.updateBestWeaponsDisplay();
        }
    }
    
    updateBestWeaponsDisplay() {
        const container = document.getElementById('bestWeaponsContainer');
        if (!container) return;
        
        container.innerHTML = '<h4>🏆 Your Best Weapons Collection</h4>';
        
        this.bestWeapons.forEach((weapon, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #4a7c59; border-radius: 5px; background: rgba(26, 71, 42, 0.5);';
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">${weapon.icon}</span>
                    <div>
                        <div style="font-weight: bold; color: #5fb370;">#${index + 1} ${weapon.name}</div>
                        <div style="font-size: 12px; color: #ccc;">${weapon.subtype}</div>
                        <div style="font-size: 12px; color: #ff6b6b;">⚔️ ${weapon.strength || 0} ATK</div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
        
        const stats = document.createElement('div');
        stats.style.cssText = 'margin-top: 15px; padding: 10px; border-top: 1px solid #4a7c59; color: #5fb370;';
        stats.innerHTML = `
            <div>📊 Collection Stats:</div>
            <div>Total Weapons Found: ${this.weaponCollection.size}</div>
            <div>Strongest Weapon: ${this.bestWeapons[0]?.name || 'None'}</div>
        `;
        container.appendChild(stats);
    }
    
    showVictoryScreen() {
        const dialog = document.getElementById('victoryDialog');
        if (dialog) {
            dialog.style.display = 'block';
            this.updateVictoryStats();
        }
        this.addMessage('🎉 VICTORY! You have conquered the realm! 🎉', 'combat');
    }
    
    updateVictoryStats() {
        const container = document.getElementById('victoryStatsContainer');
        if (!container) return;
        
        container.innerHTML = `
            <h3>🏆 CONGRATULATIONS! 🏆</h3>
            <div style="margin: 20px 0; font-size: 18px;">You have defeated the Ancient Dragon King!</div>
            
            <div style="margin: 15px 0; padding: 15px; border: 2px solid #ffd700; border-radius: 10px; background: rgba(255, 215, 0, 0.1);">
                <h4>📊 Final Stats:</h4>
                <div>Hero: ${this.player.name} (${this.player.characterType})</div>
                <div>Level: ${this.player.level}</div>
                <div>Gold Earned: ${this.player.gold}</div>
                <div>Weapons Collected: ${this.weaponCollection.size}</div>
                <div>Current Area: ${this.currentArea.name}</div>
            </div>
            
            <div style="margin: 15px 0; color: #5fb370;">
                Thank you for playing Legend of Heroes!<br>
                Your heroic journey is complete! 🗡️✨
            </div>
        `;
    }
    
    spawnBoss() {
        // Only spawn boss once in Dragon's Lair at high level
        if (this.currentArea.name === "Dragon's Lair" && this.player.level >= 5 && !this.bossDefeated && !this.bossSpawned) {
            const boss = new Enemy(1000, 400, 'Ancient Dragon King', 10);
            this.enemies.push(boss);
            this.bossSpawned = true;  // Mark boss as spawned
            this.addMessage('🐉 The Ancient Dragon King has appeared! Defeat it to win! 🐉', 'combat');
        }
    }
    
    drawEnemyName(enemy) {
        // Draw enemy name above the enemy
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        // Add black outline for better visibility
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText(enemy.name, enemy.x + enemy.width/2, enemy.y - 5);
        this.ctx.fillText(enemy.name, enemy.x + enemy.width/2, enemy.y - 5);
        
        // Draw health bar
        const barWidth = enemy.width;
        const barHeight = 4;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Background (red)
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(enemy.x, enemy.y - 15, barWidth, barHeight);
        
        // Health (green)
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(enemy.x, enemy.y - 15, barWidth * healthPercent, barHeight);
        
        // Reset text alignment
        this.ctx.textAlign = 'left';
    }
    
    drawBossHealthBar() {
        const boss = this.enemies.find(enemy => enemy.name === 'Ancient Dragon King');
        if (!boss) return;
        
        const canvas = this.canvas;
        const barWidth = canvas.width * 0.8;
        const barHeight = 40;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 20;
        
        // Boss health bar background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);
        
        // Health bar border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health bar background (red)
        this.ctx.fillStyle = '#8B0000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar fill (gradient red to yellow)
        const healthPercent = Math.max(0, boss.health / boss.maxHealth);
        const fillWidth = barWidth * healthPercent;
        
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(0.5, '#FF6B00');
        gradient.addColorStop(1, '#FFD700');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Boss name and health text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        const text = `🐉 ${boss.name} 🐉`;
        this.ctx.strokeText(text, canvas.width / 2, barY - 15);
        this.ctx.fillText(text, canvas.width / 2, barY - 15);
        
        // Health numbers
        this.ctx.font = 'bold 14px Arial';
        const healthText = `${Math.max(0, Math.floor(boss.health))} / ${boss.maxHealth} HP`;
        this.ctx.strokeText(healthText, canvas.width / 2, barY + 26);
        this.ctx.fillText(healthText, canvas.width / 2, barY + 26);
        
        this.ctx.textAlign = 'left';
    }
    
    drawShrines() {
        this.shrines.forEach(shrine => {
            if (shrine.area === this.currentArea.name) {
                // Shrine base
                this.ctx.fillStyle = shrine.completed ? '#FFD700' : '#708090';
                this.ctx.fillRect(shrine.x - 15, shrine.y - 15, 30, 30);
                
                // Shrine glow effect
                if (shrine.active || shrine.completed) {
                    this.ctx.save();
                    this.ctx.shadowColor = shrine.completed ? '#FFD700' : '#87CEEB';
                    this.ctx.shadowBlur = 20;
                    this.ctx.fillStyle = shrine.completed ? '#FFD700' : '#87CEEB';
                    this.ctx.fillRect(shrine.x - 10, shrine.y - 10, 20, 20);
                    this.ctx.restore();
                }
                
                // Shrine symbol
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(shrine.completed ? '✓' : '⚡', shrine.x, shrine.y + 5);
                this.ctx.textAlign = 'left';
                
                // Show shrine name when nearby
                const distance = Math.sqrt(
                    Math.pow(this.player.x - shrine.x, 2) + 
                    Math.pow(this.player.y - shrine.y, 2)
                );
                
                if (distance < 80) {
                    this.ctx.fillStyle = '#FFFF00';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeText(shrine.name, shrine.x, shrine.y - 25);
                    this.ctx.fillText(shrine.name, shrine.x, shrine.y - 25);
                    
                    if (!shrine.completed) {
                        this.ctx.fillText('Press SPACE to activate', shrine.x, shrine.y + 40);
                        this.ctx.strokeText('Press SPACE to activate', shrine.x, shrine.y + 40);
                    } else {
                        this.ctx.fillText('Press T to teleport', shrine.x, shrine.y + 40);
                        this.ctx.strokeText('Press T to teleport', shrine.x, shrine.y + 40);
                    }
                    this.ctx.textAlign = 'left';
                }
            }
        });
    }
    
    checkShrineInteractions() {
        this.shrines.forEach(shrine => {
            if (shrine.area === this.currentArea.name) {
                const distance = Math.sqrt(
                    Math.pow(this.player.x - shrine.x, 2) + 
                    Math.pow(this.player.y - shrine.y, 2)
                );
                
                if (distance < 50) {
                    if (!shrine.completed && this.keys[' '] && !this.spacePressed) {
                        this.activateShrine(shrine);
                        this.spacePressed = true;
                    } else if (shrine.completed && this.keys['t']) {
                        this.showTeleportDialog();
                    }
                }
            }
        });
    }
    
    activateShrine(shrine) {
        // Shrine challenge - defeat enemies or solve puzzle
        const challenge = this.getShrineChallenge(shrine.name);
        
        if (this.completeShrineChallenge(challenge)) {
            shrine.completed = true;
            shrine.active = true;
            
            // Create visual activation effect
            this.createShrineActivationEffect(shrine);
            
            this.addMessage(`✨ ${shrine.name} has been activated! You can now teleport here.`, 'system');
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth; // Full heal
            this.player.maxMana += 10;
            this.player.mana = this.player.maxMana; // Full mana
            this.addMessage(`🏛️ Shrine blessing: +20 Max HP, +10 Max Mana, fully restored!`, 'combat');
            this.playSoundEffect('pickup');
        } else {
            this.addMessage(`⚡ ${challenge.description}. Come back when ready!`, 'system');
        }
    }
    
    createShrineActivationEffect(shrine) {
        // Create multiple activation effects
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createCombatEffect(
                    shrine.x + (Math.random() - 0.5) * 60,
                    shrine.y + (Math.random() - 0.5) * 60,
                    'shrine_activation'
                );
            }, i * 100);
        }
    }
    
    getShrineChallenge(shrineName) {
        const challenges = {
            'Shrine of Courage': { 
                type: 'level', 
                requirement: 2, 
                description: 'Reach Level 2 to prove your courage' 
            },
            'Shrine of Wisdom': { 
                type: 'gold', 
                requirement: 500, 
                description: 'Collect 500 gold to show your wisdom in trading' 
            },
            'Shrine of Power': { 
                type: 'kills', 
                requirement: 10, 
                description: 'Defeat 10 enemies to demonstrate your power' 
            },
            'Shrine of Balance': { 
                type: 'equipment', 
                requirement: 'all', 
                description: 'Equip weapon, shield, and armor to show balance' 
            }
        };
        return challenges[shrineName] || challenges['Shrine of Courage'];
    }
    
    completeShrineChallenge(challenge) {
        switch(challenge.type) {
            case 'level':
                return this.player.level >= challenge.requirement;
            case 'gold':
                return this.player.gold >= challenge.requirement;
            case 'kills':
                // Track kills in a simple way - use XP as proxy
                return this.player.xp >= challenge.requirement * 15; // Rough estimate
            case 'equipment':
                return this.equipment.weapon && this.equipment.shield && this.equipment.armor;
            default:
                return true;
        }
    }
    
    showTeleportDialog() {
        const completedShrines = this.shrines.filter(s => s.completed);
        if (completedShrines.length === 0) {
            this.addMessage('No shrines activated yet! Activate shrines by completing their challenges.', 'system');
            return;
        }
        
        console.log('Opening teleport dialog with', completedShrines.length, 'completed shrines');
        console.log('Teleport dialog element:', dialog);
        console.log('Teleport options element:', optionsDiv);
        
        // Pause the game
        this.paused = true;
        
        // Show the teleport dialog
        const dialog = document.getElementById('teleportDialog');
        const optionsDiv = document.getElementById('teleportOptions');
        
        if (!dialog) {
            console.error('teleportDialog element not found!');
            this.addMessage('Teleport dialog not found!', 'system');
            return;
        }
        
        if (!optionsDiv) {
            console.error('teleportOptions element not found!');
            this.addMessage('Teleport options not found!', 'system');
            return;
        }
        
        optionsDiv.innerHTML = '';
        
        completedShrines.forEach((shrine, index) => {
            const option = document.createElement('div');
            option.style.cssText = `
                background: #2c3e50; 
                border: 2px solid #4169E1; 
                border-radius: 8px; 
                padding: 15px; 
                margin: 10px 0; 
                cursor: pointer; 
                transition: all 0.3s;
                text-align: center;
            `;
            
            option.innerHTML = `
                <h3 style="margin: 0 0 5px 0; color: #87CEEB;">🏛️ ${shrine.name}</h3>
                <p style="margin: 0; color: #B0C4DE; font-size: 14px;">${shrine.area}</p>
                <p style="margin: 5px 0 0 0; color: #FFD700; font-size: 12px;">Click to teleport</p>
            `;
            
            option.onmouseover = () => {
                option.style.background = '#34495e';
                option.style.borderColor = '#87CEEB';
                option.style.transform = 'scale(1.02)';
            };
            
            option.onmouseout = () => {
                option.style.background = '#2c3e50';
                option.style.borderColor = '#4169E1';
                option.style.transform = 'scale(1)';
            };
            
            option.onclick = () => {
                this.teleportToShrine(shrine);
                this.closeTeleportDialog();
            };
            
            optionsDiv.appendChild(option);
        });
        
        dialog.style.display = 'block';
    }
    
    closeTeleportDialog() {
        document.getElementById('teleportDialog').style.display = 'none';
        this.paused = false;
    }
    
    teleportToShrine(shrine) {
        // Create teleportation effect at current location
        this.createTeleportEffect(this.player.x, this.player.y);
        
        // Change area if needed
        const targetArea = this.areas.find(area => area.name === shrine.area);
        if (targetArea) {
            this.currentArea = targetArea;
            this.player.x = shrine.x + 50; // Spawn near shrine
            this.player.y = shrine.y + 50;
            this.enemies = []; // Clear enemies when teleporting
            
            // Create arrival effect
            setTimeout(() => {
                this.createTeleportEffect(this.player.x, this.player.y);
            }, 500);
            
            this.addMessage(`🌟 Teleported to ${shrine.name} in ${shrine.area}!`, 'system');
            this.playSoundEffect('pickup');
        }
    }
    
    createTeleportEffect(x, y) {
        // Create swirling teleport effect
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const angle = (i / 15) * Math.PI * 2;
                const radius = 30 + (i * 2);
                const effectX = x + Math.cos(angle) * radius;
                const effectY = y + Math.sin(angle) * radius;
                this.createCombatEffect(effectX, effectY, 'teleport');
            }, i * 50);
        }
    }
    
    drawTraders() {
        this.traders.forEach(trader => {
            if (trader.area === this.currentArea.name) {
                // Trader base (friendly NPC)
                this.ctx.fillStyle = '#4169E1';
                this.ctx.fillRect(trader.x - 12, trader.y - 12, 24, 24);
                
                // Trader symbol
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('💰', trader.x, trader.y + 5);
                this.ctx.textAlign = 'left';
                
                // Show trader name when nearby
                const distance = Math.sqrt(
                    Math.pow(this.player.x - trader.x, 2) + 
                    Math.pow(this.player.y - trader.y, 2)
                );
                
                if (distance < 80) {
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = '12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeText(trader.name, trader.x, trader.y - 25);
                    this.ctx.fillText(trader.name, trader.x, trader.y - 25);
                    
                    this.ctx.fillText('Press SPACE to trade', trader.x, trader.y + 40);
                    this.ctx.strokeText('Press SPACE to trade', trader.x, trader.y + 40);
                    this.ctx.textAlign = 'left';
                }
            }
        });
    }
    
    checkTraderInteractions() {
        this.traders.forEach(trader => {
            if (trader.area === this.currentArea.name) {
                const distance = Math.sqrt(
                    Math.pow(this.player.x - trader.x, 2) + 
                    Math.pow(this.player.y - trader.y, 2)
                );
                
                if (distance < 50 && this.keys[' '] && !this.spacePressed) {
                    this.openTradeDialog(trader);
                    this.spacePressed = true;
                }
            }
        });
    }
    
    openTradeDialog(trader) {
        this.currentTrader = trader;
        this.calculateTradeOffers(trader);
        this.showTradeDialog();
    }
    
    calculateTradeOffers(trader) {
        this.tradeOffers = [];
        
        trader.trades.forEach(trade => {
            const hasRequiredItems = this.checkTradeRequirements(trade.wants);
            if (hasRequiredItems.possible) {
                this.tradeOffers.push({
                    ...trade,
                    available: hasRequiredItems.count,
                    trader: trader.name
                });
            }
        });
    }
    
    checkTradeRequirements(wantedItems) {
        let minCount = Infinity;
        let possible = true;
        
        for (const itemName of wantedItems) {
            const count = this.inventory.filter(item => item && item.name === itemName).length;
            if (count === 0) {
                possible = false;
                break;
            }
            minCount = Math.min(minCount, count);
        }
        
        return { possible, count: possible ? minCount : 0 };
    }
    
    showTradeDialog() {
        if (this.tradeOffers.length === 0) {
            alert(`${this.currentTrader.name}: "Sorry, you don't have anything I need right now. Come back later!"`);
            return;
        }
        
        let tradeMenu = `${this.currentTrader.name} offers these trades:\n\n`;
        this.tradeOffers.forEach((offer, index) => {
            const wantsText = offer.wants.join(' + ');
            const offersText = offer.offers.join(' + ');
            tradeMenu += `${index + 1}. ${wantsText} → ${offersText} (${offer.ratio}) [Available: ${offer.available}]\n`;
        });
        tradeMenu += '\nEnter trade number (or cancel):';
        
        const choice = prompt(tradeMenu);
        if (choice && !isNaN(choice)) {
            const tradeIndex = parseInt(choice) - 1;
            if (tradeIndex >= 0 && tradeIndex < this.tradeOffers.length) {
                this.executeTrade(this.tradeOffers[tradeIndex]);
            }
        }
    }
    
    executeTrade(tradeOffer) {
        // Ask how many trades to execute
        const maxTrades = tradeOffer.available;
        let quantity = 1;
        
        if (maxTrades > 1) {
            const input = prompt(`How many trades? (1-${maxTrades}):`);
            if (input && !isNaN(input)) {
                quantity = Math.min(parseInt(input), maxTrades);
            }
        }
        
        // Remove wanted items from inventory
        for (let i = 0; i < quantity; i++) {
            tradeOffer.wants.forEach(itemName => {
                const itemIndex = this.inventory.findIndex(item => item && item.name === itemName);
                if (itemIndex !== -1) {
                    this.inventory[itemIndex] = null;
                }
            });
        }
        
        // Add offered items to inventory
        for (let i = 0; i < quantity; i++) {
            tradeOffer.offers.forEach(itemName => {
                if (this.itemDatabase[itemName]) {
                    this.addItem(this.itemDatabase[itemName]);
                }
            });
        }
        
        // Clean up null entries
        this.inventory = this.inventory.filter(item => item !== null);
        
        const wantsText = tradeOffer.wants.join(' + ');
        const offersText = tradeOffer.offers.join(' + ');
        
        this.addMessage(`🤝 Traded ${quantity}x (${wantsText}) for ${quantity}x (${offersText}) with ${this.currentTrader.name}!`, 'system');
        this.playSoundEffect('pickup');
        this.updateUI();
        
        // Update trade offers after successful trade
        this.calculateTradeOffers(this.currentTrader);
    }
    
    // Audio System
    initializeAudio() {
        this.audio.backgroundMusic = document.getElementById('backgroundMusic');
        this.audio.combatSound = document.getElementById('combatSound');
        this.audio.itemPickup = document.getElementById('itemPickup');
        
        // Set initial volumes
        if (this.audio.backgroundMusic) {
            this.audio.backgroundMusic.volume = this.audio.musicVolume;
        }
        
        // Create programmatic sound effects using Web Audio API
        this.createSoundEffects();
    }
    
    createSoundEffects() {
        // Create simple programmatic sound effects
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            return;
        }
    }
    
    playProgrammaticSound(type) {
        if (!this.audioContext || !this.audio.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (type === 'combat') {
            // Sharp attack sound
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sawtooth';
        } else if (type === 'pickup') {
            // Pleasant pickup sound
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            oscillator.type = 'sine';
        }
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + (type === 'combat' ? 0.1 : 0.2));
    }
    
    playBackgroundMusic() {
        if (this.audio.backgroundMusic && this.audio.musicEnabled) {
            console.log('Attempting to play background music...');
            this.audio.backgroundMusic.play().catch(e => {
                console.log('Audio play failed:', e);
                this.addMessage('Click anywhere to enable audio', 'system');
            });
        } else {
            console.log('Background music not available or disabled');
        }
    }
    
    stopBackgroundMusic() {
        if (this.audio.backgroundMusic) {
            this.audio.backgroundMusic.pause();
            this.audio.backgroundMusic.currentTime = 0;
        }
    }
    
    toggleBackgroundMusic() {
        this.audio.musicEnabled = !this.audio.musicEnabled;
        if (this.audio.musicEnabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        this.addMessage(`Background music ${this.audio.musicEnabled ? 'enabled' : 'disabled'}`, 'system');
    }
    
    playSoundEffect(soundType) {
        if (!this.audio.soundEnabled) return;
        
        // Use programmatic sound effects
        this.playProgrammaticSound(soundType);
    }
    
    toggleSoundEffects() {
        this.audio.soundEnabled = !this.audio.soundEnabled;
        this.addMessage(`Sound effects ${this.audio.soundEnabled ? 'enabled' : 'disabled'}`, 'system');
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type, areaLevel = 1) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.type = type;
        this.name = type;
        
        // Base stats
        const baseStats = {
            'Goblin': { health: 30, strength: 5, defense: 2, speed: 1, xp: 15, gold: 10 },
            'Slime': { health: 20, strength: 3, defense: 1, speed: 0.5, xp: 10, gold: 5 },
            'Wolf': { health: 45, strength: 8, defense: 3, speed: 2, xp: 25, gold: 15 },
            'Orc': { health: 60, strength: 12, defense: 5, speed: 1.5, xp: 35, gold: 25 },
            'Dark Mage': { health: 40, strength: 15, defense: 3, speed: 1, xp: 50, gold: 40 },
            'Troll': { health: 100, strength: 20, defense: 8, speed: 0.8, xp: 75, gold: 50 },
            'Dragon': { health: 200, strength: 35, defense: 15, speed: 1.2, xp: 200, gold: 200 },
            'Giant Spider': { health: 70, strength: 15, defense: 6, speed: 2.5, xp: 60, gold: 35 },
            'Ancient Dragon King': { health: 500, strength: 50, defense: 20, speed: 1.5, xp: 1000, gold: 1000 }
        };
        
        const stats = baseStats[type] || baseStats['Goblin'];
        const multiplier = 1 + (areaLevel - 1) * 0.3;
        
        this.maxHealth = Math.floor(stats.health * multiplier);
        this.health = this.maxHealth;
        this.strength = Math.floor(stats.strength * multiplier);
        this.defense = Math.floor(stats.defense * multiplier);
        this.speed = stats.speed;
        this.xpReward = Math.floor(stats.xp * multiplier);
        this.goldReward = Math.floor(stats.gold * multiplier);
        
        this.direction = Math.random() * Math.PI * 2;
        this.changeDirectionTimer = 0;
        this.attackCooldown = 0;
    }
    
    update(deltaTime, game) {
        // Simple AI: move towards player if close, otherwise wander
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
            // Chase player
            this.direction = Math.atan2(dy, dx);
        } else {
            // Random wandering
            this.changeDirectionTimer += deltaTime;
            if (this.changeDirectionTimer > 2000) {
                this.direction = Math.random() * Math.PI * 2;
                this.changeDirectionTimer = 0;
            }
        }
        
        // Move
        const moveX = Math.cos(this.direction) * this.speed;
        const moveY = Math.sin(this.direction) * this.speed;
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(game.canvas.width - this.width, this.x + moveX));
        this.y = Math.max(0, Math.min(game.canvas.height - this.height, this.y + moveY));
        
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
    
    render(ctx) {
        // Render based on enemy type
        switch(this.type) {
            case 'Goblin':
                ctx.fillStyle = '#228B22';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + 6, this.y + 6, 3, 3);
                ctx.fillRect(this.x + 15, this.y + 6, 3, 3);
                break;
            case 'Slime':
                ctx.fillStyle = '#9932CC';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#8A2BE2';
                ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
                break;
            case 'Wolf':
                ctx.fillStyle = '#696969';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 4, this.y + 4, 4, 4);
                ctx.fillRect(this.x + 16, this.y + 4, 4, 4);
                break;
            case 'Orc':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + 8, this.y + 8, 3, 3);
                ctx.fillRect(this.x + 13, this.y + 8, 3, 3);
                break;
            case 'Dark Mage':
                ctx.fillStyle = '#4B0082';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#8A2BE2';
                ctx.fillRect(this.x + 6, this.y + 6, 12, 12);
                break;
            default:
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#660000';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y - 8, (this.health / this.maxHealth) * this.width, 4);
        }
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, dx, dy, weapon) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 4;
        this.dx = dx * 5; // Speed multiplier
        this.dy = dy * 5;
        this.weapon = weapon;
        this.active = true;
        this.maxDistance = weapon.range || 200;
        this.traveledDistance = 0;
    }
    
    update(deltaTime) {
        this.x += this.dx;
        this.y += this.dy;
        this.traveledDistance += Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        
        // Get canvas dimensions dynamically
        const canvas = document.getElementById('gameCanvas');
        const canvasWidth = canvas ? canvas.width : 1600;
        const canvasHeight = canvas ? canvas.height : 1000;
        
        // Deactivate if out of range or out of bounds
        if (this.traveledDistance > this.maxDistance || 
            this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Render based on weapon type
        if (this.weapon.subtype === 'bow') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.weapon.subtype === 'staff') {
            // Magic projectile
            ctx.fillStyle = this.weapon.icon === '🔥' ? '#ff4500' : 
                           this.weapon.icon === '❄️' ? '#00ffff' : 
                           this.weapon.icon === '⚡' ? '#ffff00' : '#ff00ff';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Combat Effect Class
class CombatEffect {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1.0;
        this.decay = 0.05;
        this.size = 20;
        this.particles = [];
        
        // Create particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0
            });
        }
    }
    
    update(deltaTime) {
        this.life -= this.decay;
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= this.decay;
        });
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                let color;
                switch(this.type) {
                    case 'damage': color = '#ff0000'; break;
                    case 'melee': color = '#ffff00'; break;
                    case 'projectile': color = '#00ff00'; break;
                    case 'special': color = '#9370DB'; break;
                    case 'heal': color = '#00FF7F'; break;
                    case 'fire': color = '#FF4500'; break;
                    case 'ice': color = '#87CEEB'; break;
                    case 'lightning': color = '#FFD700'; break;
                    case 'poison': color = '#8B008B'; break;
                    case 'dragonbane': color = '#FF1493'; break;
                    case 'shrine_activation': color = '#FFD700'; break;
                    case 'teleport': color = '#87CEEB'; break;
                    default: color = '#ffffff';
                }
                
                ctx.fillStyle = color;
                ctx.fillRect(particle.x, particle.y, 3, 3);
            }
        });
        
        ctx.restore();
    }
}

// Close chest dialog and take all items
function closeChest() {
    if (game.pendingChestContents) {
        game.pendingChestContents.forEach(item => {
            if (item.name === 'Gold Coin') {
                game.player.gold += item.quantity;
                game.addMessage(`Found ${item.quantity} gold coins!`, 'loot');
            } else {
                game.addItem(item.name, item.quantity);
                game.addMessage(`Found ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}!`, 'loot');
            }
        });
        
        game.pendingChestContents = null;
        game.updateUI();
    }
    
    document.getElementById('chestDialog').style.display = 'none';
}

function closeShop() {
    game.closeShop();
}

function toggleInventory() {
    game.toggleInventory();
}

function closeInventory() {
    game.closeInventory();
}

// Global functions for HTML onclick events
let game;

function startGame() {
    if (!game) {
        game = new AdvancedRPG();
    }
    game.startGame();
}

function searchForEnemies() { game.searchForEnemies(); }
function searchForTreasure() { game.searchForTreasure(); }
function moveToNewArea() { game.moveToNewArea(); }
function exploreArea() { game.exploreArea(); }
function rest() { game.rest(); }
function useMagic() { game.useMagic(); }
function openShop() { game.openShop(); }
function saveGame() { game.saveGame(); }
function useHealthPotion() { game.useHealthPotion(); }
function useManaPotion() { game.useManaPotion(); }
function useFood() { game.useFood(); }
function openSpellbook() { game.openSpellbook(); }

// Combat is now real-time! Use X or Z to attack!

function openEquipmentMenu(type) { game.openEquipmentMenu(type); }

        // Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game...');
    window.game = new AdvancedRPG();
    console.log('Game created:', window.game);
});

console.log('🎮 Advanced RPG Game Loaded! Choose your character and begin your adventure!');