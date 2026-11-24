import React, { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import { Volume2, VolumeX, RotateCcw, Zap, Play, Trophy, Shield, Activity } from 'lucide-react';

const SKINS = [
  { id: 'apex', name: 'APEX CYAN', primary: '#00f3ff', secondary: '#0066ff', glow: 'rgba(0, 243, 255, 0.6)' },
  { id: 'solar', name: 'SOLAR CRIMSON', primary: '#ff3366', secondary: '#ffaa00', glow: 'rgba(255, 51, 102, 0.6)' },
  { id: 'void', name: 'VOID PHANTOM', primary: '#b026ff', secondary: '#00ff88', glow: 'rgba(176, 38, 255, 0.6)' },
];

export default function App() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START | PLAYING | PAUSED | GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('chronoflap_highscore') || '0', 10);
  });
  const [overclock, setOverclock] = useState(0); // 0 - 100
  const [isOverclockActive, setIsOverclockActive] = useState(false);
  const [chronoMode, setChronoMode] = useState('NORMAL'); // NORMAL | SLOWMO | OVERCLOCK
  const [selectedSkin, setSelectedSkin] = useState(SKINS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState({ distance: 0, closeCalls: 0, rings: 0, overclocks: 0 });

  // Web Audio Context & Synthesizer Ref
  const audioCtxRef = useRef(null);
  const bgmOscRef = useRef(null);
  const bgmGainRef = useRef(null);

  // Core Game Loop State Ref
  const gameRef = useRef({
    state: 'START',
    drone: {
      x: 140,
      y: 300,
      vy: 0,
      angle: 0,
      width: 44,
      height: 22,
      trail: [],
    },
    isThrusting: false,
    timeScale: 1.0,
    targetTimeScale: 1.0,
    cameraShake: { x: 0, y: 0, intensity: 0 },
    obstacles: [],
    rings: [],
    particles: [],
    floatingTexts: [],
    fragments: [],
    distance: 0,
    score: 0,
    overclock: 0,
    isOverclockActive: false,
    overclockTimer: 0,
    closeCalls: 0,
    ringsCollected: 0,
    overclockCount: 0,
    lastTime: 0,
    nextObstacleDist: 350,
    nextRingDist: 200,
    activeSkin: SKINS[0],
    isMuted: false,
  });

  // Initialize or resume Web Audio
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  // Web Audio Sound Generators
  const playSound = useCallback((type) => {
    if (gameRef.current.isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;

    const now = ctx.currentTime;

    try {
      if (type === 'thrust') {
        // Deep sub 808 kick + white noise puff
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'ring') {
        // Harmonic arpeggio chime (C5 -> G5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5
        osc2.frequency.setValueAtTime(1046.5, now); // C6
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
      } else if (type === 'closeCall') {
        // High-tech laser chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'overclock') {
        // Massive energy surge
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'shatter') {
        // Laser shattering explosion
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'crash') {
        // Deep Game Over explosion impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      }
    } catch (e) {
      // Audio fallback safe
    }
  }, []);

  // Update Game Ref with UI props
  useEffect(() => {
    gameRef.current.activeSkin = selectedSkin;
  }, [selectedSkin]);

  useEffect(() => {
    gameRef.current.isMuted = isMuted;
  }, [isMuted]);

  // Thrust action triggered by Space, Click or Touch
  const handleThrustStart = useCallback(() => {
    initAudio();
    if (gameRef.current.state === 'START' || gameRef.current.state === 'GAMEOVER') {
      startGame();
      return;
    }
    if (gameRef.current.state !== 'PLAYING') return;

    gameRef.current.isThrusting = true;
    gameRef.current.drone.vy = -7.5; // Upward impulse
    playSound('thrust');

    // Trigger thruster particle burst
    const d = gameRef.current.drone;
    for (let i = 0; i < 6; i++) {
      gameRef.current.particles.push({
        x: d.x - 18,
        y: d.y + (Math.random() - 0.5) * 8,
        vx: -Math.random() * 6 - 3,
        vy: (Math.random() - 0.5) * 3,
        color: gameRef.current.activeSkin.primary,
        size: Math.random() * 3 + 2,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03,
      });
    }
  }, [initAudio, playSound]);

  const handleThrustEnd = useCallback(() => {
    gameRef.current.isThrusting = false;
  }, []);

  // Reset and start new run
  const startGame = useCallback(() => {
    initAudio();
    const canvas = canvasRef.current;
    const h = canvas ? canvas.height : 600;

    gameRef.current = {
      ...gameRef.current,
      state: 'PLAYING',
      drone: {
        x: 140,
        y: h / 2,
        vy: -2,
        angle: 0,
        width: 44,
        height: 22,
        trail: [],
      },
      isThrusting: false,
      timeScale: 1.0,
      targetTimeScale: 1.0,
      cameraShake: { x: 0, y: 0, intensity: 0 },
      obstacles: [],
      rings: [],
      particles: [],
      floatingTexts: [],
      fragments: [],
      distance: 0,
      score: 0,
      overclock: 0,
      isOverclockActive: false,
      overclockTimer: 0,
      closeCalls: 0,
      ringsCollected: 0,
      overclockCount: 0,
      lastTime: performance.now(),
      nextObstacleDist: 280,
      nextRingDist: 150,
      activeSkin: selectedSkin,
      isMuted: isMuted,
    };

    setGameState('PLAYING');
    setScore(0);
    setOverclock(0);
    setIsOverclockActive(false);
    setChronoMode('NORMAL');
  }, [initAudio, selectedSkin, isMuted]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle & Fragment spawner helpers
    const spawnLaserShatter = (x, y, h, color) => {
      for (let i = 0; i < 24; i++) {
        gameRef.current.fragments.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + Math.random() * h,
          vx: (Math.random() - 0.5) * 12 + 4,
          vy: (Math.random() - 0.5) * 10,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 8 + 4,
          color: color,
          life: 1.0,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
    };

    const addFloatingText = (text, x, y, color) => {
      gameRef.current.floatingTexts.push({
        text,
        x,
        y,
        color,
        life: 1.0,
        decay: 0.025,
      });
    };

    // Main Update & Render Function
    const render = (timestamp) => {
      const g = gameRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (!g.lastTime) g.lastTime = timestamp;
      const rawDt = Math.min((timestamp - g.lastTime) / 1000, 0.1);
      g.lastTime = timestamp;

      // 1. CHRONO TIME DILATION LOGIC
      if (g.state === 'PLAYING') {
        if (g.isOverclockActive) {
          g.targetTimeScale = 2.4; // Hyperdrive speed
        } else if (g.isThrusting) {
          g.targetTimeScale = 1.0; // Normal active speed
        } else {
          g.targetTimeScale = 0.22; // Bullet-Time Slow Motion
        }
      } else {
        g.targetTimeScale = 0.5;
      }

      // Smooth interpolation of current time scale
      g.timeScale += (g.targetTimeScale - g.timeScale) * 0.18;
      const dt = rawDt * g.timeScale;

      // Sync React UI Chrono Mode
      if (g.isOverclockActive) {
        setChronoMode('OVERCLOCK');
      } else if (g.timeScale < 0.6) {
        setChronoMode('SLOWMO');
      } else {
        setChronoMode('NORMAL');
      }

      // Camera Shake decay
      if (g.cameraShake.intensity > 0) {
        g.cameraShake.x = (Math.random() - 0.5) * g.cameraShake.intensity;
        g.cameraShake.y = (Math.random() - 0.5) * g.cameraShake.intensity;
        g.cameraShake.intensity *= 0.9;
        if (g.cameraShake.intensity < 0.5) g.cameraShake.intensity = 0;
      } else {
        g.cameraShake.x = 0;
        g.cameraShake.y = 0;
      }

      ctx.save();
      ctx.translate(g.cameraShake.x, g.cameraShake.y);

      // 2. BACKGROUND RENDERING (Cyber Grid & Skyline)
      ctx.fillStyle = '#070913';
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Distant stars / dust
      const baseScroll = g.distance * 0.15;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
      for (let i = 0; i < 40; i++) {
        const starX = ((i * 137 - baseScroll * 0.5) % width + width) % width;
        const starY = (i * 97) % height;
        const size = (i % 3) + 1;
        ctx.fillRect(starX, starY, size, size);
      }

      // Horizon Cityscape Parallax
      const cityScroll = (g.distance * 0.3) % width;
      ctx.fillStyle = 'rgba(12, 17, 33, 0.9)';
      for (let i = 0; i < 15; i++) {
        const bWidth = 90 + (i % 5) * 25;
        const bHeight = 120 + ((i * 37) % 180);
        const bX = ((i * 110 - cityScroll) % (width + 200)) - 100;
        ctx.fillRect(bX, height - bHeight - 40, bWidth, bHeight);

        // Neon rooftop beacon
        if (i % 3 === 0) {
          ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
          ctx.fillRect(bX + bWidth / 2 - 2, height - bHeight - 50, 4, 10);
          ctx.fillStyle = 'rgba(12, 17, 33, 0.9)';
        }
      }

      // 3D Perspective Ground Grid
      const groundY = height - 40;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, 'rgba(0, 243, 255, 0.4)');
      groundGrad.addColorStop(1, 'rgba(5, 7, 15, 0.95)');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.lineWidth = 1;
      const gridOffset = (g.distance * 2.5) % 40;
      for (let x = -gridOffset; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 60, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Ceiling Hazard Grid
      const ceilY = 40;
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.2)';
      for (let x = -gridOffset; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, ceilY);
        ctx.lineTo(x - 40, 0);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, ceilY);
      ctx.lineTo(width, ceilY);
      ctx.stroke();

      // 3. GAMEPLAY SIMULATION & UPDATES
      if (g.state === 'PLAYING') {
        const speed = (g.isOverclockActive ? 520 : 280);
        g.distance += speed * dt;

        // Overclock countdown
        if (g.isOverclockActive) {
          g.overclockTimer -= dt;
          setOverclock(Math.max(0, (g.overclockTimer / 4.5) * 100));
          if (g.overclockTimer <= 0) {
            g.isOverclockActive = false;
            setIsOverclockActive(false);
            g.overclock = 0;
            setOverclock(0);
          }
        }

        // Drone Physics
        const gravity = 18.0;
        g.drone.vy += gravity * dt;
        g.drone.y += g.drone.vy * dt * 60;

        // Pitch angle interpolation
        const targetAngle = Math.max(-0.45, Math.min(0.65, g.drone.vy * 0.05));
        g.drone.angle += (targetAngle - g.drone.angle) * 0.15;

        // Boundary collision check
        if (g.drone.y - 12 <= ceilY) {
          g.drone.y = ceilY + 12;
          g.drone.vy = 2;
        }
        if (g.drone.y + 12 >= groundY) {
          triggerGameOver('CRASHED INTO GRID HAZARD');
        }

        // Afterburner trail
        g.drone.trail.unshift({ x: g.drone.x - 14, y: g.drone.y, alpha: 1.0 });
        if (g.drone.trail.length > 16) g.drone.trail.pop();

        // Spawn Laser Pylons
        g.nextObstacleDist -= speed * dt;
        if (g.nextObstacleDist <= 0) {
          const gapSize = Math.max(145, 195 - Math.min(g.distance * 0.005, 45));
          const minY = ceilY + 50;
          const maxY = groundY - gapSize - 50;
          const gapY = Math.random() * (maxY - minY) + minY;

          g.obstacles.push({
            x: width + 50,
            gapY,
            gapSize,
            width: 38,
            passed: false,
            closeCallDone: false,
            shattered: false,
            color: Math.random() > 0.4 ? '#00f3ff' : '#ff0055',
          });
          g.nextObstacleDist = Math.random() * 120 + 260;
        }

        // Spawn Energy Rings
        g.nextRingDist -= speed * dt;
        if (g.nextRingDist <= 0) {
          const ry = Math.random() * (groundY - ceilY - 140) + ceilY + 70;
          g.rings.push({
            x: width + 40,
            y: ry,
            radius: 18,
            angle: 0,
            collected: false,
          });
          g.nextRingDist = Math.random() * 220 + 180;
        }

        // Score accumulation over distance
        g.score += (g.isOverclockActive ? 8 : 2) * dt * 10;
        setScore(Math.floor(g.score));
      }

      // 4. RENDER OBSTACLES (Laser Pylons)
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        if (g.state === 'PLAYING') {
          obs.x -= (g.isOverclockActive ? 520 : 280) * dt;
        }

        if (obs.shattered) {
          // Skip drawing laser if shattered in Overclock
          continue;
        }

        const topHeight = obs.gapY;
        const bottomY = obs.gapY + obs.gapSize;
        const bottomHeight = groundY - bottomY;

        // Top Pylon Housing
        ctx.fillStyle = '#101524';
        ctx.strokeStyle = obs.color;
        ctx.lineWidth = 2;
        ctx.fillRect(obs.x - obs.width / 2, ceilY, obs.width, topHeight - ceilY);
        ctx.strokeRect(obs.x - obs.width / 2, ceilY, obs.width, topHeight - ceilY);

        // Bottom Pylon Housing
        ctx.fillRect(obs.x - obs.width / 2, bottomY, obs.width, bottomHeight);
        ctx.strokeRect(obs.x - obs.width / 2, bottomY, obs.width, bottomHeight);

        // Glowing Laser Emitter Nodes
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 14;
        ctx.fillRect(obs.x - 12, topHeight - 8, 24, 8);
        ctx.fillRect(obs.x - 12, bottomY, 24, 8);

        // Glowing High-Energy Laser Beam
        const laserGrad = ctx.createLinearGradient(obs.x - 8, 0, obs.x + 8, 0);
        laserGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        laserGrad.addColorStop(0.5, obs.color);
        laserGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

        ctx.fillStyle = laserGrad;
        ctx.fillRect(obs.x - 4, topHeight, 8, obs.gapSize);

        // Electric Core Stream
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x - 1.5, topHeight, 3, obs.gapSize);
        ctx.shadowBlur = 0;

        // Laser particle sparks
        if (Math.random() < 0.3) {
          g.particles.push({
            x: obs.x + (Math.random() - 0.5) * 8,
            y: obs.gapY + Math.random() * obs.gapSize,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: obs.color,
            size: Math.random() * 2 + 1,
            life: 1.0,
            decay: 0.05,
          });
        }

        // Collision & Close Call Detection
        if (g.state === 'PLAYING') {
          const dx = Math.abs(g.drone.x - obs.x);
          const dy = g.drone.y;

          if (dx < obs.width / 2 + 14) {
            // Overclock destroys laser gates
            if (g.isOverclockActive) {
              obs.shattered = true;
              g.cameraShake.intensity = 16;
              spawnLaserShatter(obs.x, ceilY, groundY - ceilY, obs.color);
              playSound('shatter');
              addFloatingText('+100 SHATTER!', obs.x, g.drone.y, '#ffaa00');
              g.score += 100;
              continue;
            }

            // Normal Collision
            if (dy - 10 < topHeight || dy + 10 > bottomY) {
              triggerGameOver('VAPORIZED BY HIGH-VOLTAGE LASER');
              return;
            }

            // Close Call Detection (Threaded within 16px of beam)
            if (!obs.closeCallDone && (Math.abs(dy - 10 - topHeight) < 18 || Math.abs(dy + 10 - bottomY) < 18)) {
              obs.closeCallDone = true;
              g.closeCalls++;
              g.overclock = Math.min(100, g.overclock + 18);
              setOverclock(g.overclock);
              g.score += 50;
              g.cameraShake.intensity = 8;
              playSound('closeCall');
              addFloatingText('⚡ CLOSE CALL +50', g.drone.x + 20, g.drone.y - 20, '#00f3ff');
            }
          }

          // Pass laser gate successfully
          if (!obs.passed && g.drone.x > obs.x + obs.width / 2) {
            obs.passed = true;
            g.score += 20;
            g.overclock = Math.min(100, g.overclock + 12);
            setOverclock(g.overclock);

            // Auto-trigger Overclock when reaching 100%
            if (g.overclock >= 100 && !g.isOverclockActive) {
              activateOverclock();
            }
          }
        }

        // Clean up passed obstacles
        if (obs.x < -80) {
          g.obstacles.splice(i, 1);
        }
      }

      // 5. RENDER ENERGY RINGS
      for (let i = g.rings.length - 1; i >= 0; i--) {
        const ring = g.rings[i];
        if (g.state === 'PLAYING') {
          ring.x -= (g.isOverclockActive ? 520 : 280) * dt;
          ring.angle += dt * 4;

          // Pickup check
          const dist = Math.hypot(g.drone.x - ring.x, g.drone.y - ring.y);
          if (dist < ring.radius + 16 && !ring.collected) {
            ring.collected = true;
            g.ringsCollected++;
            g.overclock = Math.min(100, g.overclock + 25);
            setOverclock(g.overclock);
            g.score += 75;
            playSound('ring');
            addFloatingText('+75 ENERGY', ring.x, ring.y, '#00ff88');

            // Ring collect burst
            for (let p = 0; p < 14; p++) {
              const ang = (p / 14) * Math.PI * 2;
              g.particles.push({
                x: ring.x,
                y: ring.y,
                vx: Math.cos(ang) * (Math.random() * 4 + 3),
                vy: Math.sin(ang) * (Math.random() * 4 + 3),
                color: '#00ff88',
                size: Math.random() * 3 + 1,
                life: 1.0,
                decay: 0.035,
              });
            }

            if (g.overclock >= 100 && !g.isOverclockActive) {
              activateOverclock();
            }
          }
        }

        if (!ring.collected) {
          ctx.save();
          ctx.translate(ring.x, ring.y);
          ctx.rotate(ring.angle);

          // Glowing polygonal ring
          ctx.strokeStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let p = 0; p < 6; p++) {
            const rad = (p / 6) * Math.PI * 2;
            const px = Math.cos(rad) * ring.radius;
            const py = Math.sin(rad) * ring.radius;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          // Center pulsing core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (ring.x < -40 || ring.collected) {
          g.rings.splice(i, 1);
        }
      }

      // 6. RENDER PARTICLES & FRAGMENTS
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= p.decay * (g.timeScale < 0.5 ? 0.35 : 1.0);

        if (p.life <= 0) {
          g.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      // Shattered Glass / Polygon Fragments
      for (let i = g.fragments.length - 1; i >= 0; i--) {
        const frag = g.fragments[i];
        frag.x += frag.vx * dt * 60;
        frag.y += frag.vy * dt * 60;
        frag.rotation += frag.rotSpeed * dt * 60;
        frag.life -= frag.decay;

        if (frag.life <= 0) {
          g.fragments.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(frag.x, frag.y);
        ctx.rotate(frag.rotation);
        ctx.strokeStyle = frag.color;
        ctx.fillStyle = frag.color;
        ctx.globalAlpha = frag.life;
        ctx.beginPath();
        ctx.moveTo(-frag.size, -frag.size / 2);
        ctx.lineTo(frag.size, 0);
        ctx.lineTo(0, frag.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;

      // 7. RENDER DRONE (PLAYER)
      const d = g.drone;

      // Afterburner glowing ribbon trail
      if (d.trail.length > 1) {
        ctx.save();
        for (let t = 0; t < d.trail.length - 1; t++) {
          const pt1 = d.trail[t];
          const pt2 = d.trail[t + 1];
          const progress = 1 - t / d.trail.length;

          ctx.strokeStyle = g.isOverclockActive ? '#ffaa00' : g.activeSkin.primary;
          ctx.lineWidth = progress * 7 + (g.isOverclockActive ? 6 : 0);
          ctx.globalAlpha = progress * 0.7;
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);

      // Overclock Radiance Shield
      if (g.isOverclockActive) {
        ctx.strokeStyle = '#ffaa00';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32 + Math.sin(timestamp * 0.02) * 4, 0, Math.PI * 2);
        ctx.stroke();

        // Electric lightning sparks
        for (let l = 0; l < 4; l++) {
          const lAng = Math.random() * Math.PI * 2;
          const lx = Math.cos(lAng) * 32;
          const ly = Math.sin(lAng) * 32;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(lx - 2, ly - 2, 4, 4);
        }
        ctx.shadowBlur = 0;
      }

      // Delta-Wing Stealth Fighter Body
      ctx.fillStyle = '#0f1422';
      ctx.strokeStyle = g.activeSkin.primary;
      ctx.lineWidth = 2;
      ctx.shadowColor = g.activeSkin.primary;
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(24, 0); // Nose tip
      ctx.lineTo(-18, -14); // Left wingtip
      ctx.lineTo(-10, -3); // Inner wing notch
      ctx.lineTo(-20, 0); // Engine exhaust
      ctx.lineTo(-10, 3);
      ctx.lineTo(-18, 14); // Right wingtip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Edge Accent Stripes
      ctx.strokeStyle = g.activeSkin.secondary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-12, -9);
      ctx.moveTo(12, 0);
      ctx.lineTo(-12, 9);
      ctx.stroke();

      // Glowing Cockpit Plasma Core
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = g.activeSkin.primary;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(2, 0, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual Twin Thruster Nozzles
      ctx.fillStyle = g.isOverclockActive ? '#ffaa00' : g.activeSkin.primary;
      ctx.fillRect(-22, -6, 5, 3);
      ctx.fillRect(-22, 3, 5, 3);

      ctx.restore();

      // 8. RENDER FLOATING SCORE LABELS
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
        const ft = g.floatingTexts[i];
        ft.y -= 1.2;
        ft.life -= ft.decay;

        if (ft.life <= 0) {
          g.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = ft.life;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // Trigger Overclock Mode
    const activateOverclock = () => {
      const g = gameRef.current;
      g.isOverclockActive = true;
      setIsOverclockActive(true);
      g.overclockTimer = 4.5;
      g.overclockCount++;
      g.cameraShake.intensity = 22;
      playSound('overclock');
      addFloatingText('⚡ OVERCLOCK HYPERDRIVE!', g.drone.x + 30, g.drone.y - 40, '#ffaa00');
    };

    // Trigger Game Over Sequence
    const triggerGameOver = (reason) => {
      const g = gameRef.current;
      g.state = 'GAMEOVER';
      g.cameraShake.intensity = 25;
      playSound('crash');

      const finalScore = Math.floor(g.score);
      setGameState('GAMEOVER');
      setScore(finalScore);

      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('chronoflap_highscore', finalScore.toString());
      }

      setStats({
        distance: Math.floor(g.distance / 10),
        closeCalls: g.closeCalls,
        rings: g.ringsCollected,
        overclocks: g.overclockCount,
      });
    };

    animationFrameId = requestAnimationFrame(render);

    // Global Keyboard Controls
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleThrustStart();
      } else if (e.code === 'KeyP') {
        togglePause();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleThrustEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleThrustStart, handleThrustEnd, playSound, highScore]);

  // Pause Toggle
  const togglePause = () => {
    if (gameState === 'PLAYING') {
      gameRef.current.state = 'PAUSED';
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      gameRef.current.state = 'PLAYING';
      gameRef.current.lastTime = performance.now();
      setGameState('PLAYING');
    }
  };

  // Rank Evaluator
  const getRank = (sc) => {
    if (sc >= 2000) return { label: 'S+ TITAN', color: '#ffaa00' };
    if (sc >= 1200) return { label: 'S CYBER', color: '#00f3ff' };
    if (sc >= 700) return { label: 'A ACE', color: '#00ff88' };
    if (sc >= 300) return { label: 'B PILOT', color: '#b026ff' };
    return { label: 'C RECRUIT', color: '#94a3b8' };
  };

  return (
    <div
      className="chronoflap-container"
      onMouseDown={handleThrustStart}
      onMouseUp={handleThrustEnd}
      onTouchStart={(e) => {
        e.preventDefault();
        handleThrustStart();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleThrustEnd();
      }}
    >
      {/* 60 FPS Canvas */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Retro CRT Scanlines & Shaders */}
      <div className="crt-overlay" />

      {/* Dynamic Time-Dilation Vignette */}
      <div
        className={`vignette-overlay ${
          chronoMode === 'SLOWMO'
            ? 'vignette-slowmo'
            : chronoMode === 'OVERCLOCK'
            ? 'vignette-overclock'
            : ''
        }`}
      />

      {/* HUD Header Bar */}
      <div className="hud-layer">
        <div className="hud-top">
          {/* Left: Score & Chrono Mode Indicator */}
          <div className="hud-chip hud-chip-left">
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>ALTITUDE RUN</div>
              <div className="hud-title-font" style={{ fontSize: '26px', color: '#ffffff' }}>
                {score}
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)' }} />

            {/* Time Dilation Badge */}
            <div
              className={`badge-chrono ${
                chronoMode === 'SLOWMO' ? 'slowmo' : chronoMode === 'OVERCLOCK' ? 'overclock' : 'normal'
              }`}
            >
              <Activity size={12} />
              {chronoMode === 'SLOWMO'
                ? 'BULLET-TIME (0.2x)'
                : chronoMode === 'OVERCLOCK'
                ? 'OVERCLOCK (2.4x)'
                : '1.0x NORMAL'}
            </div>
          </div>

          {/* Center: Overclock Energy Meter */}
          <div className="hud-chip" style={{ gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ffaa00' }}>
              <Zap size={14} />
              <span style={{ fontWeight: 700 }}>OVERCLOCK</span>
            </div>
            <div className="overclock-meter">
              <div className="overclock-fill" style={{ width: `${overclock}%` }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', minWidth: '32px' }}>
              {Math.floor(overclock)}%
            </span>
          </div>

          {/* Right: Best Record & Audio Controls */}
          <div className="hud-chip hud-chip-right" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
              <Trophy size={16} color="#ffaa00" />
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                RECORD <span style={{ color: '#ffffff', fontWeight: 700, marginLeft: '4px' }}>{highScore}</span>
              </div>
            </div>

            <button
              className="icon-btn"
              onClick={() => setIsMuted((prev) => !prev)}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* START TITLE MODAL */}
      {gameState === 'START' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(5, 7, 15, 0.72)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cyber-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span className="badge-chrono normal">CYBERPUNK FLIGHT SYSTEM</span>
            </div>

            <h1
              className="hud-title-font"
              style={{
                fontSize: '38px',
                margin: '8px 0 4px',
                background: 'linear-gradient(135deg, #00f3ff, #ff0055)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '3px',
              }}
            >
              CHRONOFLAP 2099
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px', letterSpacing: '0.5px' }}>
              Bend time to dodge kinetic laser gates. Charge your reactor and trigger supersonic Overclock.
            </p>

            {/* Drone Skin Selector */}
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', marginBottom: '8px' }}>
                SELECT INTERCEPTOR CHASSIS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {SKINS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSkin(s)}
                    style={{
                      background: selectedSkin.id === s.id ? 'rgba(0, 243, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${selectedSkin.id === s.id ? s.primary : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '8px',
                      padding: '10px 6px',
                      color: selectedSkin.id === s.id ? '#ffffff' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'Orbitron',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: s.primary,
                        boxShadow: `0 0 8px ${s.primary}`,
                      }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* How to Play Guide */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                fontSize: '13px',
                color: '#cbd5e1',
                lineHeight: 1.6,
                textAlign: 'left',
                borderLeft: '2px solid #00f3ff',
              }}
            >
              <div>• <strong>HOLD / TAP:</strong> Upward impulse thrust at full 1.0x velocity.</div>
              <div>• <strong>RELEASE:</strong> Engage <strong>0.2x Bullet-Time Slow-Mo</strong> to steer through tight laser beams.</div>
              <div>• <strong>100% ENERGY:</strong> Activates <strong>Overclock Hyperdrive</strong> — invincible speed burst!</div>
            </div>

            {/* Launch CTA Button */}
            <button className="cyber-btn" onClick={startGame} style={{ width: '100%' }}>
              <Play size={18} /> LAUNCH INTERCEPTOR [SPACE]
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'GAMEOVER' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(5, 7, 15, 0.78)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cyber-card">
            <span
              className="badge-chrono"
              style={{
                background: 'rgba(255, 0, 85, 0.2)',
                color: '#ff0055',
                borderColor: '#ff0055',
                marginBottom: '10px',
              }}
            >
              FLIGHT TERMINATED
            </span>

            <h2 className="hud-title-font" style={{ fontSize: '32px', margin: '4px 0 16px', color: '#ffffff' }}>
              MISSION REPORT
            </h2>

            {/* Score & Rank Display */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>FINAL SCORE</div>
                <div className="hud-title-font" style={{ fontSize: '36px', color: '#00f3ff' }}>
                  {score}
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>PILOT RANK</div>
                <div
                  className="hud-title-font"
                  style={{ fontSize: '20px', color: getRank(score).color, fontWeight: 900 }}
                >
                  {getRank(score).label}
                </div>
              </div>
            </div>

            {/* Detailed Mission Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>DISTANCE FLOWN</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>{stats.distance} m</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>CLOSE CALLS</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#00f3ff' }}>{stats.closeCalls}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>ENERGY RINGS</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#00ff88' }}>{stats.rings}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>OVERCLOCK BURSTS</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffaa00' }}>{stats.overclocks}</div>
              </div>
            </div>

            {/* Retry Button */}
            <button className="cyber-btn" onClick={startGame} style={{ width: '100%' }}>
              <RotateCcw size={18} /> REBOOT INTERCEPTOR [SPACE]
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(5, 7, 15, 0.75)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cyber-card" style={{ maxWidth: '340px' }}>
            <h2 className="hud-title-font" style={{ fontSize: '26px', margin: '0 0 16px', color: '#00f3ff' }}>
              SIMULATION PAUSED
            </h2>
            <button className="cyber-btn" onClick={togglePause} style={{ width: '100%', marginBottom: '12px' }}>
              RESUME [P]
            </button>
            <button className="cyber-btn cyber-btn-secondary" onClick={startGame} style={{ width: '100%' }}>
              RESTART RUN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
