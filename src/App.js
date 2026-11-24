import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Trophy, Sparkles, Moon, Sun, Sunset, Play, Pause, Smartphone } from 'lucide-react';

// SOUND SYNTHESIS USING WEB AUDIO API (Zero external MP3 dependencies)
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  playPoint() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.16);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playDie() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
}

const audio = new RetroAudio();

// THEMES CONFIGURATION
const THEMES = {
  day: {
    id: 'day',
    name: 'Daylight Classic',
    skyTop: '#4ec0ca',
    skyBottom: '#86e3ce',
    cloudColor: 'rgba(255, 255, 255, 0.75)',
    cityColor: '#5bb896',
    pipeTop: '#73bf2e',
    pipeBody: '#559c1c',
    pipeRim: '#2d6108',
    groundLight: '#ded895',
    groundDark: '#75bf2f',
    groundStripe: '#d0c878'
  },
  night: {
    id: 'night',
    name: 'Midnight Cyber',
    skyTop: '#0b132b',
    skyBottom: '#1c2541',
    cloudColor: 'rgba(91, 105, 140, 0.3)',
    cityColor: '#090e1f',
    pipeTop: '#00f5d4',
    pipeBody: '#00bbf9',
    pipeRim: '#7209b7',
    groundLight: '#1f2937',
    groundDark: '#111827',
    groundStripe: '#374151'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Synth',
    skyTop: '#2b1055',
    skyBottom: '#b83b5e',
    cloudColor: 'rgba(240, 147, 197, 0.4)',
    cityColor: '#1d0b33',
    pipeTop: '#f08a5d',
    pipeBody: '#ee5253',
    pipeRim: '#6c1537',
    groundLight: '#6a097d',
    groundDark: '#39064f',
    groundStripe: '#8b0c9e'
  }
};

// SKINS CONFIGURATION
const SKINS = [
  { id: 'classic', name: 'Classic Goldie', color: '#facc15', belly: '#fef08a', eye: '#ffffff', beak: '#ea580c' },
  { id: 'cyber', name: 'Cyber Blue', color: '#38bdf8', belly: '#bae6fd', eye: '#ffffff', beak: '#0284c7' },
  { id: 'phoenix', name: 'Fire Phoenix', color: '#f87171', belly: '#fecaca', eye: '#ffffff', beak: '#dc2626' }
];

export default function App() {
  const canvasRef = useRef(null);

  // GAME STATES: 'IDLE' | 'PLAYING' | 'GAMEOVER'
  const [gameState, setGameState] = useState('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('skyflap_high_score') || '0', 10);
  });
  const [muted, setMuted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('day');
  const [currentSkin, setCurrentSkin] = useState(SKINS[0]);
  const [flashScreen, setFlashScreen] = useState(false);

  // MUTABLE GAME REFS (Avoid React re-render lag during 60 FPS animation loop)
  const gameRef = useRef({
    state: 'IDLE',
    score: 0,
    bird: {
      x: 80,
      y: 240,
      radius: 13,
      velocity: 0,
      gravity: 0.28,
      jump: -5.8,
      rotation: 0,
      wingCycle: 0
    },
    pipes: [],
    groundOffset: 0,
    clouds: [
      { x: 30, y: 70, size: 45, speed: 0.35 },
      { x: 190, y: 110, size: 60, speed: 0.25 },
      { x: 340, y: 55, size: 40, speed: 0.4 }
    ],
    particles: [],
    frame: 0,
    pipeGap: 105,
    pipeWidth: 54,
    pipeSpeed: 2.1
  });

  // Toggle Mute
  const toggleMute = () => {
    audio.muted = !muted;
    setMuted(!muted);
  };

  // Trigger Flap
  const triggerFlap = useCallback(() => {
    audio.init();
    const g = gameRef.current;

    if (g.state === 'IDLE') {
      g.state = 'PLAYING';
      g.bird.velocity = g.bird.jump;
      audio.playFlap();
      setGameState('PLAYING');
    } else if (g.state === 'PLAYING') {
      g.bird.velocity = g.bird.jump;
      audio.playFlap();

      // Spawn Feather Particles
      for (let i = 0; i < 3; i++) {
        g.particles.push({
          x: g.bird.x - 10,
          y: g.bird.y + (Math.random() * 10 - 5),
          vx: -(Math.random() * 2 + 1),
          vy: Math.random() * 2 - 1,
          size: Math.random() * 3 + 2,
          life: 1.0,
          color: currentSkin.belly
        });
      }
    } else if (g.state === 'GAMEOVER') {
      // Reset Game
      resetGame();
    }
  }, [currentSkin]);

  // Reset Game
  const resetGame = () => {
    const g = gameRef.current;
    g.state = 'IDLE';
    g.score = 0;
    g.bird.x = 80;
    g.bird.y = 240;
    g.bird.velocity = 0;
    g.bird.rotation = 0;
    g.pipes = [];
    g.particles = [];
    setScore(0);
    setGameState('IDLE');
  };

  // Keyboard and Touch Bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFlap]);

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const groundHeight = 85;
    const ceiling = 0;
    const floor = height - groundHeight;

    let animationFrameId;

    const gameLoop = () => {
      const g = gameRef.current;
      const theme = THEMES[currentTheme];
      g.frame++;

      // 1. CLEAR & DRAW SKY GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, floor);
      skyGrad.addColorStop(0, theme.skyTop);
      skyGrad.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. DRAW BACKGROUND CLOUDS (Parallax Layer 1)
      ctx.fillStyle = theme.cloudColor;
      g.clouds.forEach(c => {
        if (g.state === 'PLAYING') {
          c.x -= c.speed;
          if (c.x + c.size * 2 < 0) c.x = width + 40;
        }
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size * 0.45, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.35, c.y - c.size * 0.2, c.size * 0.5, 0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.7, c.y, c.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. DRAW CITY SKYLINE SILHOUETTE (Parallax Layer 2)
      ctx.fillStyle = theme.cityColor;
      const cityBuildings = [
        { x: 10, w: 35, h: 65 },
        { x: 55, w: 25, h: 90 },
        { x: 90, w: 40, h: 50 },
        { x: 140, w: 30, h: 75 },
        { x: 180, w: 45, h: 60 },
        { x: 235, w: 35, h: 85 },
        { x: 280, w: 30, h: 55 },
        { x: 320, w: 40, h: 70 }
      ];
      cityBuildings.forEach(b => {
        const drawX = (b.x - (g.groundOffset * 0.3)) % (width + 60);
        ctx.fillRect(drawX > -50 ? drawX : drawX + width + 60, floor - b.h, b.w, b.h);
      });

      // 4. UPDATE & DRAW PIPES
      if (g.state === 'PLAYING') {
        // Spawn Pipes
        if (g.frame % 95 === 0) {
          const minPipe = 50;
          const maxPipe = floor - g.pipeGap - minPipe;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;
          g.pipes.push({
            x: width,
            topHeight: topHeight,
            passed: false
          });
        }

        // Move Pipes & Check Collision
        for (let i = g.pipes.length - 1; i >= 0; i--) {
          const p = g.pipes[i];
          p.x -= g.pipeSpeed;

          const bottomY = p.topHeight + g.pipeGap;
          const bottomHeight = floor - bottomY;

          // Score check
          if (!p.passed && p.x + g.pipeWidth < g.bird.x) {
            p.passed = true;
            g.score++;
            setScore(g.score);
            audio.playPoint();

            // High Score Check
            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem('skyflap_high_score', g.score.toString());
            }

            // Sparkle Particle Burst on Score
            for (let s = 0; s < 6; s++) {
              g.particles.push({
                x: g.bird.x,
                y: g.bird.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 2,
                life: 1.0,
                color: '#facc15'
              });
            }
          }

          // AABB Collision Detection against Bird circle
          const birdBox = {
            left: g.bird.x - g.bird.radius + 2,
            right: g.bird.x + g.bird.radius - 2,
            top: g.bird.y - g.bird.radius + 2,
            bottom: g.bird.y + g.bird.radius - 2
          };

          // Collision with Top Pipe
          const collideTop = birdBox.right > p.x && birdBox.left < p.x + g.pipeWidth && birdBox.top < p.topHeight;
          // Collision with Bottom Pipe
          const collideBottom = birdBox.right > p.x && birdBox.left < p.x + g.pipeWidth && birdBox.bottom > bottomY;

          if (collideTop || collideBottom) {
            // Trigger Death
            triggerGameOver();
          }

          // Remove off-screen pipes
          if (p.x + g.pipeWidth < -10) {
            g.pipes.splice(i, 1);
          }
        }
      }

      // Draw Pipes
      g.pipes.forEach(p => {
        const bottomY = p.topHeight + g.pipeGap;
        const bottomHeight = floor - bottomY;

        // TOP PIPE BODY
        ctx.fillStyle = theme.pipeBody;
        ctx.fillRect(p.x, 0, g.pipeWidth, p.topHeight);
        // Highlight stripe
        ctx.fillStyle = theme.pipeTop;
        ctx.fillRect(p.x + 4, 0, 7, p.topHeight);

        // TOP PIPE CAP
        ctx.fillStyle = theme.pipeBody;
        ctx.fillRect(p.x - 3, p.topHeight - 24, g.pipeWidth + 6, 24);
        ctx.fillStyle = theme.pipeTop;
        ctx.fillRect(p.x + 1, p.topHeight - 24, 7, 24);
        ctx.strokeStyle = theme.pipeRim;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 3, p.topHeight - 24, g.pipeWidth + 6, 24);

        // BOTTOM PIPE BODY
        ctx.fillStyle = theme.pipeBody;
        ctx.fillRect(p.x, bottomY, g.pipeWidth, bottomHeight);
        // Highlight stripe
        ctx.fillStyle = theme.pipeTop;
        ctx.fillRect(p.x + 4, bottomY, 7, bottomHeight);

        // BOTTOM PIPE CAP
        ctx.fillStyle = theme.pipeBody;
        ctx.fillRect(p.x - 3, bottomY, g.pipeWidth + 6, 24);
        ctx.fillStyle = theme.pipeTop;
        ctx.fillRect(p.x + 1, bottomY, 7, 24);
        ctx.strokeStyle = theme.pipeRim;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 3, bottomY, g.pipeWidth + 6, 24);
      });

      // 5. UPDATE BIRD PHYSICS
      if (g.state === 'IDLE') {
        // Gentle bobbing motion on title screen
        g.bird.y = 230 + Math.sin(g.frame * 0.08) * 8;
        g.bird.rotation = 0;
      } else if (g.state === 'PLAYING') {
        g.bird.velocity += g.bird.gravity;
        g.bird.y += g.bird.velocity;

        // Upward/Downward Tilt Rotation
        if (g.bird.velocity < 0) {
          g.bird.rotation = Math.max(-0.4, g.bird.velocity * 0.08);
        } else {
          g.bird.rotation = Math.min(1.2, g.bird.rotation + 0.04);
        }

        // Ceiling collision
        if (g.bird.y - g.bird.radius <= ceiling) {
          g.bird.y = ceiling + g.bird.radius;
          g.bird.velocity = 0;
        }

        // Floor collision
        if (g.bird.y + g.bird.radius >= floor) {
          g.bird.y = floor - g.bird.radius;
          triggerGameOver();
        }
      } else if (g.state === 'GAMEOVER') {
        // Fall down until ground
        if (g.bird.y + g.bird.radius < floor) {
          g.bird.velocity += g.bird.gravity * 1.5;
          g.bird.y += g.bird.velocity;
          g.bird.rotation = Math.min(1.5, g.bird.rotation + 0.1);
        } else {
          g.bird.y = floor - g.bird.radius;
        }
      }

      // 6. DRAW PARTICLES
      for (let pIdx = g.particles.length - 1; pIdx >= 0; pIdx--) {
        const pt = g.particles[pIdx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.04;
        if (pt.life <= 0) {
          g.particles.splice(pIdx, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. DRAW BIRD SPRITE (Crisp procedural pixel-art style)
      ctx.save();
      ctx.translate(g.bird.x, g.bird.y);
      ctx.rotate(g.bird.rotation);

      // Flapping Wing Offset
      g.bird.wingCycle = (g.bird.wingCycle + 0.25) % (Math.PI * 2);
      const wingOffset = Math.sin(g.bird.wingCycle) * 4;

      // Bird Main Body
      ctx.fillStyle = currentSkin.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Belly / Wing
      ctx.fillStyle = currentSkin.belly;
      ctx.beginPath();
      ctx.ellipse(-4, 3, 9, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Wing Flapper
      ctx.fillStyle = currentSkin.color;
      ctx.beginPath();
      ctx.ellipse(-5, wingOffset, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eye (Big Expressive Cartoon Eye)
      ctx.fillStyle = currentSkin.eye;
      ctx.beginPath();
      ctx.arc(7, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(9, -4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, -5.5, 1, 0, Math.PI * 2);
      ctx.fill();

      // Beak (Orange)
      ctx.fillStyle = currentSkin.beak;
      ctx.beginPath();
      ctx.moveTo(11, -1);
      ctx.lineTo(21, 2);
      ctx.lineTo(11, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // 8. DRAW SCROLLING GROUND
      if (g.state === 'PLAYING') {
        g.groundOffset = (g.groundOffset + g.pipeSpeed) % 24;
      }

      // Ground Top Border (Grass/Ledge)
      ctx.fillStyle = theme.groundDark;
      ctx.fillRect(0, floor, width, 14);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, floor, width, 3);

      // Ground Dirt Base
      ctx.fillStyle = theme.groundLight;
      ctx.fillRect(0, floor + 14, width, groundHeight - 14);

      // Scrolling Slanted Grass Pattern
      ctx.fillStyle = theme.groundStripe;
      for (let gx = -24; gx < width + 24; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx - g.groundOffset, floor + 3);
        ctx.lineTo(gx - g.groundOffset + 10, floor + 3);
        ctx.lineTo(gx - g.groundOffset + 4, floor + 14);
        ctx.lineTo(gx - g.groundOffset - 6, floor + 14);
        ctx.fill();
      }

      // 9. DRAW SCORE ON CANVAS DURING GAMEPLAY
      if (g.state === 'PLAYING') {
        ctx.font = 'bold 38px monospace';
        ctx.textAlign = 'center';
        // Black text shadow
        ctx.fillStyle = '#0f172a';
        ctx.fillText(g.score.toString(), width / 2 + 2, 72);
        // White foreground
        ctx.fillStyle = '#ffffff';
        ctx.fillText(g.score.toString(), width / 2, 70);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const triggerGameOver = () => {
      const g = gameRef.current;
      if (g.state === 'GAMEOVER') return;
      g.state = 'GAMEOVER';
      setGameState('GAMEOVER');
      audio.playHit();
      setTimeout(() => audio.playDie(), 120);

      // Screen Flash White
      setFlashScreen(true);
      setTimeout(() => setFlashScreen(false), 80);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentTheme, currentSkin, highScore]);

  // Determine Medal on Game Over
  const getMedal = (s) => {
    if (s >= 40) return { title: 'PLATINUM', color: 'from-cyan-300 to-blue-500', icon: '💎' };
    if (s >= 30) return { title: 'GOLD', color: 'from-amber-300 to-yellow-600', icon: '🥇' };
    if (s >= 20) return { title: 'SILVER', color: 'from-slate-200 to-slate-400', icon: '🥈' };
    if (s >= 10) return { title: 'BRONZE', color: 'from-amber-600 to-amber-800', icon: '🥉' };
    return null;
  };

  const medal = getMedal(score);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col items-center justify-between font-sans selection:bg-amber-500 selection:text-white p-2 sm:p-4 select-none">
      
      {/* HEADER / NAVIGATION BAR */}
      <header className="w-full max-w-md flex justify-between items-center py-2 px-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-slate-950 text-sm shadow">
            🪶
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide text-white">SkyFlap <span className="text-amber-400">Airborne</span></h1>
            <p className="text-[10px] text-slate-400 font-mono">stringstrange.online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* GAME CABINET CONTAINER */}
      <div className="relative w-full max-w-[380px] aspect-[9/16] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black flex flex-col items-center justify-center">
        
        {/* Flash Screen Overlay on Crash */}
        {flashScreen && (
          <div className="absolute inset-0 bg-white z-30 pointer-events-none opacity-90 animate-fade-out"></div>
        )}

        {/* The 60FPS Game Canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={600}
          onClick={triggerFlap}
          onTouchStart={(e) => { e.preventDefault(); triggerFlap(); }}
          className="w-full h-full cursor-pointer block touch-none"
        />

        {/* OVERLAY: GET READY (IDLE STATE) */}
        {gameState === 'IDLE' && (
          <div
            onClick={triggerFlap}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[2px] cursor-pointer"
          >
            <div className="text-center space-y-3 animate-bounce">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/90 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                <Sparkles className="w-3.5 h-3.5" /> Tap or Press Space
              </div>
              <div className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-mono">
                GET READY!
              </div>
            </div>

            <div className="mt-8 p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center max-w-[240px] text-xs text-slate-300 space-y-1 shadow-xl">
              <div className="flex items-center justify-center gap-1.5 font-bold text-amber-400">
                <Smartphone className="w-4 h-4" /> Controls
              </div>
              <p>Desktop: <strong>Spacebar</strong> or <strong>Click</strong></p>
              <p>Mobile: <strong>Tap Screen</strong></p>
            </div>
          </div>
        )}

        {/* OVERLAY: GAME OVER SCOREBOARD */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            
            {/* Scorecard Box */}
            <div className="w-full max-w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
              
              <div className="text-2xl font-black text-rose-400 font-mono tracking-wider drop-shadow">
                GAME OVER
              </div>

              {/* Scores Display */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex justify-around items-center">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">SCORE</div>
                  <div className="text-2xl font-black font-mono text-white">{score}</div>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3" /> BEST
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-400">{highScore}</div>
                </div>
              </div>

              {/* Medal Reward Badge */}
              {medal ? (
                <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-xl">{medal.icon}</span>
                  <div>
                    <div className="font-extrabold text-white text-[11px]">{medal.title} MEDAL</div>
                    <div className="text-[9px] text-emerald-400 font-mono">Achievement Unlocked!</div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-mono">
                  Score 10+ to unlock Bronze Medal!
                </div>
              )}

              {/* Restart Button */}
              <button
                onClick={resetGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>

            </div>

          </div>
        )}

      </div>

      {/* CUSTOMIZATION BAR: THEMES & SKINS */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-3 mt-3 flex flex-col gap-2.5">
        
        {/* Theme Toggles */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Environment
          </span>
          <div className="flex gap-1.5">
            {[
              { id: 'day', icon: Sun, label: 'Day' },
              { id: 'night', icon: Moon, label: 'Night' },
              { id: 'sunset', icon: Sunset, label: 'Sunset' }
            ].map(th => {
              const Icon = th.icon;
              return (
                <button
                  key={th.id}
                  onClick={() => setCurrentTheme(th.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    currentTheme === th.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {th.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skin Selector */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Character
          </span>
          <div className="flex gap-1.5">
            {SKINS.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentSkin(s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  currentSkin.id === s.id
                    ? 'bg-slate-700 text-white ring-1 ring-amber-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                {s.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer className="py-2 text-center text-[11px] text-slate-500">
        SkyFlap Airborne • Hosted at <a href="https://www.stringstrange.online" className="text-amber-400 hover:underline">stringstrange.online</a>
      </footer>

    </div>
  );
}
