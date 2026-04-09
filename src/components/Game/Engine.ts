import { Character, GameState } from "../../types";
import { GAME_CONSTANTS } from "../../constants";

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private character: Character;
  private gameState: GameState;
  private player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    grounded: boolean;
    jumps: number;
  };
  private keys: { [key: string]: boolean } = {};
  private platforms: { x: number; y: number; width: number; height: number }[] = [];
  private coins: { x: number; y: number; collected: boolean }[] = [];
  private obstacles: { x: number; y: number; width: number; height: number; type: 'spike' }[] = [];
  private door: { x: number; y: number; width: number; height: number } | null = null;
  private animationFrameId: number | null = null;
  private onCoinCollect: (count: number) => void;
  private onGameOver: () => void;
  private onLevelComplete: (level: number) => void;
  private currentLevel: number;

  constructor(
    canvas: HTMLCanvasElement,
    character: Character,
    initialLevel: number,
    onCoinCollect: (count: number) => void,
    onGameOver: () => void,
    onLevelComplete: (level: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.character = character;
    this.onCoinCollect = onCoinCollect;
    this.onGameOver = onGameOver;
    this.onLevelComplete = onLevelComplete;
    this.currentLevel = initialLevel;

    this.player = {
      x: 50,
      y: 300,
      vx: 0,
      vy: 0,
      width: this.character.id === 'juhi' ? 20 : 30,
      height: this.character.id === 'juhi' ? 20 : 40,
      grounded: false,
      jumps: 0
    };

    this.gameState = {
      score: 0,
      lives: 3,
      coins: 0,
      level: 1,
      currentLevel: initialLevel,
      isGameOver: false,
      isPaused: false
    };

    this.initLevel(this.currentLevel);
    this.setupControls();
  }

  private initLevel(level: number) {
    // Procedural level generation based on level number
    const levelWidth = 2000 + (level * 200);
    this.platforms = [
      { x: 0, y: 550, width: levelWidth, height: 50 }, // Ground
    ];

    // Add random platforms based on difficulty (level)
    const platformCount = 10 + Math.floor(level / 2);
    for (let i = 0; i < platformCount; i++) {
      this.platforms.push({
        x: 300 + (i * 250),
        y: 450 - (Math.sin(i * 0.5) * 150),
        width: Math.max(80, 150 - (level / 2)),
        height: 20
      });
    }

    // Add obstacles (spikes) - more as level increases
    this.obstacles = [];
    const spikeCount = 5 + Math.floor(level / 3);
    for (let i = 0; i < spikeCount; i++) {
      this.obstacles.push({
        x: 500 + (i * 400) + (Math.random() * 200),
        y: 530,
        width: 32,
        height: 20,
        type: 'spike'
      });
    }

    // Add coins
    this.coins = [];
    const coinCount = 10 + Math.floor(level / 2);
    for (let i = 0; i < coinCount; i++) {
      this.coins.push({
        x: 400 + (i * 200),
        y: 300 + (Math.cos(i) * 100),
        collected: false
      });
    }

    // Add Door at the end
    this.door = {
      x: levelWidth - 100,
      y: 470,
      width: 40,
      height: 80
    };

    // Reset player
    this.player.x = 50;
    this.player.y = 300;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = false;
  }

  private setupControls() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
  }

  public start() {
    this.loop();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private loop = () => {
    if (this.gameState.isGameOver || this.gameState.isPaused) return;

    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    const { speed, jump } = this.character.stats;

    // Horizontal movement
    if (this.keys['ArrowLeft']) {
      this.player.vx -= 0.8;
    }
    if (this.keys['ArrowRight']) {
      this.player.vx += 0.8;
    }

    // Ability: Dash (Praveen)
    if (this.keys['ShiftLeft'] && this.character.id === 'praveen' && Math.abs(this.player.vx) < 15) {
        this.player.vx *= 1.5;
    }

    this.player.vx *= GAME_CONSTANTS.FRICTION;

    // Gravity
    this.player.vy += GAME_CONSTANTS.GRAVITY;

    // Ability: Float (Suprya)
    if (this.keys['Space'] && this.player.vy > 0 && this.character.id === 'suprya') {
        this.player.vy = 1;
    }

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Collision with obstacles
    for (const obstacle of this.obstacles) {
      if (
        this.player.x < obstacle.x + obstacle.width &&
        this.player.x + this.player.width > obstacle.x &&
        this.player.y < obstacle.y + obstacle.height &&
        this.player.y + this.player.height > obstacle.y
      ) {
        this.gameState.isGameOver = true;
        this.onGameOver();
        return;
      }
    }

    // Collision with door
    if (this.door &&
        this.player.x < this.door.x + this.door.width &&
        this.player.x + this.player.width > this.door.x &&
        this.player.y < this.door.y + this.door.height &&
        this.player.y + this.player.height > this.door.y
    ) {
      this.onLevelComplete(this.currentLevel + 1);
      this.stop();
      return;
    }

    // Jump
    if (this.keys['Space'] && this.player.grounded) {
      this.player.vy = -jump;
      this.player.grounded = false;
      this.player.jumps = 1;
    } else if (this.keys['Space'] && !this.player.grounded && this.character.id === 'vishnu' && this.player.jumps < 2) {
        // Double Jump for Vishnu
        this.player.vy = -jump;
        this.player.jumps = 2;
        this.keys['Space'] = false; // Prevent multi-trigger
    }

    this.player.grounded = false;

    // Collision with platforms
    for (const platform of this.platforms) {
      if (
        this.player.x < platform.x + platform.width &&
        this.player.x + this.player.width > platform.x &&
        this.player.y < platform.y + platform.height &&
        this.player.y + this.player.height > platform.y
      ) {
        // Simple collision resolution
        if (this.player.vy > 0 && this.player.y + this.player.height - this.player.vy <= platform.y) {
          this.player.y = platform.y - this.player.height;
          this.player.vy = 0;
          this.player.grounded = true;
          this.player.jumps = 0;
        }
      }
    }

    // Coin collection
    for (const coin of this.coins) {
      if (!coin.collected) {
        const dx = (this.player.x + this.player.width / 2) - (coin.x + 10);
        const dy = (this.player.y + this.player.height / 2) - (coin.y + 10);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Ability: Magnet (Sonali)
        if (this.character.id === 'sonali' && distance < 100) {
            coin.x += (this.player.x - coin.x) * 0.1;
            coin.y += (this.player.y - coin.y) * 0.1;
        }

        if (distance < 25) {
          coin.collected = true;
          this.gameState.coins++;
          this.onCoinCollect(this.gameState.coins);
        }
      }
    }

    // Screen bounds
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.y > GAME_CONSTANTS.CANVAS_HEIGHT) {
      this.gameState.isGameOver = true;
      this.onGameOver();
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera follow (simple offset)
    const offsetX = Math.max(0, this.player.x - this.canvas.width / 2);
    this.ctx.save();
    this.ctx.translate(-offsetX, 0);

    // Draw platforms (Pixelated style)
    for (const platform of this.platforms) {
      this.ctx.fillStyle = '#4b5563';
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add "brick" texture
      this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let x = platform.x; x < platform.x + platform.width; x += 32) {
        for (let y = platform.y; y < platform.y + platform.height; y += 16) {
          this.ctx.strokeRect(x, y, 32, 16);
        }
      }
    }

    // Draw coins (Pixelated style)
    this.ctx.fillStyle = '#fbbf24';
    for (const coin of this.coins) {
      if (!coin.collected) {
        this.ctx.fillRect(coin.x + 4, coin.y + 4, 12, 12);
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(coin.x + 6, coin.y + 6, 8, 8);
        this.ctx.fillStyle = '#fbbf24';
      }
    }

    // Draw obstacles (Spikes)
    for (const obstacle of this.obstacles) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
      this.ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
      this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
      this.ctx.fill();
    }

    // Draw Door
    if (this.door) {
      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(this.door.x, this.door.y, this.door.width, this.door.height);
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(this.door.x, this.door.y, this.door.width, this.door.height);
      
      // Door handle
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillRect(this.door.x + this.door.width - 10, this.door.y + this.door.height / 2, 5, 5);
    }

    // Draw player (8-bit blocky style)
    this.ctx.fillStyle = this.character.color;
    const p = this.player;
    
    // Body
    this.ctx.fillRect(p.x, p.y, p.width, p.height);
    
    // Outline
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(p.x, p.y, p.width, p.height);

    // Eyes (Pixel style)
    this.ctx.fillStyle = 'white';
    const eyeX = this.player.vx >= 0 ? this.player.x + this.player.width - 12 : this.player.x + 4;
    this.ctx.fillRect(eyeX, this.player.y + 8, 8, 8);
    this.ctx.fillStyle = 'black';
    const pupilX = this.player.vx >= 0 ? eyeX + 4 : eyeX;
    this.ctx.fillRect(pupilX, this.player.y + 10, 4, 4);

    // Hat or detail based on gender/character
    if (this.character.gender === 'female') {
        this.ctx.fillStyle = '#f472b6';
        this.ctx.fillRect(p.x + 5, p.y - 5, p.width - 10, 5);
    }

    this.ctx.restore();

    // HUD (Retro style)
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px "Press Start 2P"';
    this.ctx.fillText(`COINS: ${this.gameState.coins}`, 20, 40);
    this.ctx.fillText(`CHAR: ${this.character.name.toUpperCase()}`, 20, 70);
    this.ctx.fillText(`LEVEL: ${this.currentLevel}`, 20, 100);
  }
}
