import React, { useEffect, useRef, useState, useCallback } from 'react';
import './App.css';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Zap,
  Play,
  Trophy,
  Sun,
  Moon,
  Sunrise,
  Activity,
  Coins,
  Sparkles,
  Award,
  Wallet,
  CheckCircle2,
  Clock,
  Flame,
  User,
  X
} from 'lucide-react';

// Bright, well-lit themes
const THEMES = [
  {
    id: 'lumina',
    name: 'AERO LUMINA',
    icon: Sun,
    skyTop: '#0284c7', // Bright celestial blue
    skyMid: '#38bdf8', // Luminous sky cyan
    skyBottom: '#e0f2fe', // Warm golden/white horizon
    sunColor: '#fef08a',
    sunGlow: 'rgba(254, 240, 138, 0.45)',
    gridColor: 'rgba(2, 132, 199, 0.35)',
    groundColor: '#0369a1',
    laserColor: '#0284c7',
    laserGlow: '#38bdf8',
    dronePrimary: '#ffffff',
    droneAccent: '#0284c7',
    droneFlame: '#f59e0b',
  },
  {
    id: 'sunset',
    name: 'SUNSET HORIZON',
    icon: Sunrise,
    skyTop: '#4c1d95',
    skyMid: '#db2777',
    skyBottom: '#fde047',
    sunColor: '#fbbf24',
    sunGlow: 'rgba(251, 191, 36, 0.55)',
    gridColor: 'rgba(219, 39, 119, 0.4)',
    groundColor: '#831843',
    laserColor: '#f43f5e',
    laserGlow: '#fb7185',
    dronePrimary: '#ffffff',
    droneAccent: '#f59e0b',
    droneFlame: '#ef4444',
  },
  {
    id: 'cyber',
    name: 'CYBER AURORA',
    icon: Moon,
    skyTop: '#0f172a',
    skyMid: '#065f46',
    skyBottom: '#6ee7b7',
    sunColor: '#34d399',
    sunGlow: 'rgba(52, 211, 153, 0.4)',
    gridColor: 'rgba(16, 185, 129, 0.35)',
    groundColor: '#064e3b',
    laserColor: '#10b981',
    laserGlow: '#6ee7b7',
    dronePrimary: '#ffffff',
    droneAccent: '#10b981',
    droneFlame: '#00f3ff',
  },
];

const INITIAL_LEADERBOARD = [
  { rank: 1, name: 'SoniTitan', score: 4120, wallet: '0x71C...a89F', isWinner: true },
  { rank: 2, name: 'ApexValkyrie', score: 3550, wallet: '0x94B...c412' },
  { rank: 3, name: 'NeonDrifter', score: 2980, wallet: '0x32A...f180' },
  { rank: 4, name: 'CyberNova', score: 2410, wallet: '0x58D...99e1' },
  { rank: 5, name: 'ChronoZero', score: 1890, wallet: '0x19F...e3b4' },
];

const MOOD_QUOTES = [
  'Mood Status: 42% (Vibing, not in the mood yet 🧘)',
  'Mood Status: 18% (Currently eating pizza 🍕 - keep practicing)',
  'Mood Status: 65% (Feeling generous soon... maybe tomorrow? 👀)',
  'Mood Status: 33% (Chilling in the metaverse ☕)',
  'Mood Status: 79% (High energy! Payout radar warming up 🔥)',
  'Mood Status: 12% (Taking a nap 😴 - scores are safe)',
];

export default function App() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START | PLAYING | PAUSED | GAMEOVER
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('chronoflap_highscore') || '0', 10);
  });
  const [overclock, setOverclock] = useState(0);
  const [isOverclockActive, setIsOverclockActive] = useState(false);
  const [chronoMode, setChronoMode] = useState('NORMAL');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState({ distance: 0, closeCalls: 0, rings: 0, overclocks: 0 });

  // Leaderboard & Prize System States
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [pilotName, setPilotName] = useState(() => localStorage.getItem('chronoflap_pilot_name') || '');
  const [walletAddress, setWalletAddress] = useState(() => localStorage.getItem('chronoflap_pilot_wallet') || '');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [moodIndex, setMoodIndex] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState(() => {
    const saved = localStorage.getItem('chronoflap_leaderboard_custom');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_LEADERBOARD;
      }
    }
    return INITIAL_LEADERBOARD;
  });

  // Web Audio Context Ref
  const audioCtxRef = useRef(null);

  // Main Game Loop Engine Reference
  const gameRef = useRef({
    state: 'START',
    drone: {
      x: 160,
      y: 350,
      vy: 0,
      angle: 0,
      width: 46,
      height: 24,
      trail: [],
    },
    isThrusting: false,
    timeScale: 1.0,
    targetTimeScale: 1.0,
    graceTimer: 0,
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
    nextObstacleDist: 400,
    nextRingDist: 220,
    activeTheme: THEMES[0],
    isMuted: false,
  });

  // Sound Engine
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

  const playSound = useCallback((type) => {
    if (gameRef.current.isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state !== 'running') return;
    const now = ctx.currentTime;

    try {
      if (type === 'flap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'ring') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        osc2.frequency.setValueAtTime(1174.66, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.22);
      } else if (type === 'closeCall') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.09);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'overclock') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'shatter') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'crash') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Sync state props with engine
  useEffect(() => {
    gameRef.current.activeTheme = selectedTheme;
  }, [selectedTheme]);

  useEffect(() => {
    gameRef.current.isMuted = isMuted;
  }, [isMuted]);

  // Crisp Flap & Thrust Logic
  const handleFlap = useCallback(() => {
    initAudio();
    const g = gameRef.current;

    if (isLeaderboardOpen) return;

    if (g.state === 'START' || g.state === 'GAMEOVER') {
      startGame();
      return;
    }
    if (g.state !== 'PLAYING') return;

    g.drone.vy = -8.2;
    g.isThrusting = true;
    playSound('flap');

    const d = g.drone;
    for (let i = 0; i < 7; i++) {
      g.particles.push({
        x: d.x - 22,
        y: d.y + (Math.random() - 0.5) * 6,
        vx: -Math.random() * 7 - 3,
        vy: (Math.random() - 0.5) * 3,
        color: g.activeTheme.droneFlame,
        size: Math.random() * 3.5 + 2,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.03,
      });
    }
  }, [initAudio, playSound, isLeaderboardOpen]);

  const handleThrustEnd = useCallback(() => {
    gameRef.current.isThrusting = false;
  }, []);

  // Start fresh game run
  const startGame = useCallback(() => {
    initAudio();
    setIsLeaderboardOpen(false);
    const logicalHeight = window.innerHeight;

    gameRef.current = {
      ...gameRef.current,
      state: 'PLAYING',
      drone: {
        x: 160,
        y: Math.max(150, logicalHeight * 0.45),
        vy: -3.0,
        angle: 0,
        width: 46,
        height: 24,
        trail: [],
      },
      isThrusting: false,
      timeScale: 1.0,
      targetTimeScale: 1.0,
      graceTimer: 1.2,
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
      nextObstacleDist: 480,
      nextRingDist: 240,
      activeTheme: selectedTheme,
      isMuted: isMuted,
    };

    setGameState('PLAYING');
    setScore(0);
    setOverclock(0);
    setIsOverclockActive(false);
    setChronoMode('NORMAL');
  }, [initAudio, selectedTheme, isMuted]);

  // Main 60-120 FPS Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const spawnLaserShatter = (x, y, h, color) => {
      for (let i = 0; i < 28; i++) {
        gameRef.current.fragments.push({
          x: x + (Math.random() - 0.5) * 24,
          y: y + Math.random() * h,
          vx: (Math.random() - 0.5) * 14 + 5,
          vy: (Math.random() - 0.5) * 12,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 9 + 4,
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
        decay: 0.022,
      });
    };

    const render = (timestamp) => {
      animationFrameId = requestAnimationFrame(render);

      const g = gameRef.current;
      const theme = g.activeTheme;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!g.lastTime) g.lastTime = timestamp;
      const rawDt = Math.min((timestamp - g.lastTime) / 1000, 0.06);
      g.lastTime = timestamp;

      if (g.graceTimer > 0) {
        g.graceTimer -= rawDt;
      }

      // 1. CHRONO TIME DILATION
      if (g.state === 'PLAYING') {
        if (g.isOverclockActive) {
          g.targetTimeScale = 2.2;
        } else if (g.isThrusting) {
          g.targetTimeScale = 1.0;
        } else {
          g.targetTimeScale = 0.45;
        }
      } else {
        g.targetTimeScale = 0.5;
      }

      g.timeScale += (g.targetTimeScale - g.timeScale) * 0.2;
      const dt = rawDt * g.timeScale;

      if (g.isOverclockActive) {
        setChronoMode('OVERCLOCK');
      } else if (g.timeScale < 0.65) {
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

      // 2. BRIGHT, ILLUMINATED SKY & ENVIRONMENT RENDERING
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, theme.skyTop);
      skyGrad.addColorStop(0.55, theme.skyMid);
      skyGrad.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Radiant Sun / Light Flare
      const sunX = width * 0.75;
      const sunY = height * 0.22;
      const sunGlowGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
      sunGlowGrad.addColorStop(0, theme.sunColor);
      sunGlowGrad.addColorStop(0.3, theme.sunGlow);
      sunGlowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunGlowGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric Luminous Clouds
      const baseScroll = g.distance * 0.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 20; i++) {
        const cx = ((i * 180 - baseScroll * 0.4) % (width + 300) + width + 300) % (width + 300) - 150;
        const cy = ((i * 53) % (height * 0.45)) + 40;
        const cRad = 35 + (i % 4) * 15;
        ctx.beginPath();
        ctx.arc(cx, cy, cRad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Parallax Luminous City Skyline
      const cityScroll = (g.distance * 0.35) % (width + 300);
      for (let i = 0; i < 16; i++) {
        const bWidth = 85 + (i % 5) * 30;
        const bHeight = 110 + ((i * 47) % 200);
        const bX = ((i * 125 - cityScroll) % (width + 300) + width + 300) % (width + 300) - 150;

        const bGrad = ctx.createLinearGradient(0, height - bHeight - 50, 0, height);
        bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        bGrad.addColorStop(1, 'rgba(224, 242, 254, 0.95)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(bX, height - bHeight - 50, bWidth, bHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bX, height - bHeight - 50, bWidth, bHeight);

        ctx.fillStyle = theme.laserGlow;
        ctx.fillRect(bX + bWidth / 2 - 2, height - bHeight - 65, 4, 15);
      }

      // Ground Luminous Runway & Perspective Grid
      const groundY = height - 45;
      const ceilY = 45;

      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      groundGrad.addColorStop(0, theme.groundColor);
      groundGrad.addColorStop(1, '#02182b');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.laserGlow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 1.5;
      const gridOffset = (g.distance * 3) % 45;
      for (let x = -gridOffset; x < width + 60; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 70, height);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, ceilY);
      ctx.lineTo(width, ceilY);
      ctx.stroke();

      // 3. GAMEPLAY SIMULATION
      if (g.state === 'PLAYING') {
        const speed = (g.isOverclockActive ? 560 : 300);
        g.distance += speed * dt;

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

        const gravity = 20.0;
        g.drone.vy += gravity * dt;
        g.drone.y += g.drone.vy * dt * 60;

        const targetAngle = Math.max(-0.4, Math.min(0.55, g.drone.vy * 0.05));
        g.drone.angle += (targetAngle - g.drone.angle) * 0.18;

        if (g.drone.y - 12 <= ceilY) {
          g.drone.y = ceilY + 12;
          g.drone.vy = 2;
        }

        if (g.drone.y + 12 >= groundY && g.graceTimer <= 0) {
          triggerGameOver('COLLIDED WITH SURFACE RUNWAY');
        }

        g.drone.trail.unshift({ x: g.drone.x - 16, y: g.drone.y, alpha: 1.0 });
        if (g.drone.trail.length > 18) g.drone.trail.pop();

        g.nextObstacleDist -= speed * dt;
        if (g.nextObstacleDist <= 0) {
          const gapSize = Math.max(160, 210 - Math.min(g.distance * 0.004, 50));
          const minY = ceilY + 60;
          const maxY = groundY - gapSize - 60;
          const gapY = Math.random() * Math.max(20, maxY - minY) + minY;

          g.obstacles.push({
            x: width + 60,
            gapY,
            gapSize,
            width: 44,
            passed: false,
            closeCallDone: false,
            shattered: false,
          });
          g.nextObstacleDist = Math.random() * 140 + 280;
        }

        g.nextRingDist -= speed * dt;
        if (g.nextRingDist <= 0) {
          const ry = Math.random() * (groundY - ceilY - 160) + ceilY + 80;
          g.rings.push({
            x: width + 50,
            y: ry,
            radius: 20,
            angle: 0,
            collected: false,
          });
          g.nextRingDist = Math.random() * 200 + 190;
        }

        g.score += (g.isOverclockActive ? 8 : 2) * dt * 10;
        setScore(Math.floor(g.score));
      }

      // 4. RENDER OBSTACLES (Bright Laser Pylons)
      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const obs = g.obstacles[i];
        if (g.state === 'PLAYING') {
          obs.x -= (g.isOverclockActive ? 560 : 300) * dt;
        }

        if (obs.shattered) continue;

        const topHeight = obs.gapY;
        const bottomY = obs.gapY + obs.gapSize;
        const bottomHeight = groundY - bottomY;

        const pylonGrad = ctx.createLinearGradient(obs.x - 22, 0, obs.x + 22, 0);
        pylonGrad.addColorStop(0, '#ffffff');
        pylonGrad.addColorStop(0.5, '#e2e8f0');
        pylonGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = pylonGrad;
        ctx.strokeStyle = theme.laserColor;
        ctx.lineWidth = 2.5;

        ctx.fillRect(obs.x - obs.width / 2, ceilY, obs.width, topHeight - ceilY);
        ctx.strokeRect(obs.x - obs.width / 2, ceilY, obs.width, topHeight - ceilY);

        ctx.fillRect(obs.x - obs.width / 2, bottomY, obs.width, bottomHeight);
        ctx.strokeRect(obs.x - obs.width / 2, bottomY, obs.width, bottomHeight);

        ctx.fillStyle = theme.laserGlow;
        ctx.shadowColor = theme.laserGlow;
        ctx.shadowBlur = 16;
        ctx.fillRect(obs.x - 16, topHeight - 10, 32, 10);
        ctx.fillRect(obs.x - 16, bottomY, 32, 10);

        const beamGrad = ctx.createLinearGradient(obs.x - 10, 0, obs.x + 10, 0);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        beamGrad.addColorStop(0.5, theme.laserGlow);
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(obs.x - 6, topHeight, 12, obs.gapSize);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x - 2, topHeight, 4, obs.gapSize);
        ctx.shadowBlur = 0;

        if (g.state === 'PLAYING') {
          const dx = Math.abs(g.drone.x - obs.x);
          const dy = g.drone.y;

          if (dx < obs.width / 2 + 16) {
            if (g.isOverclockActive) {
              obs.shattered = true;
              g.cameraShake.intensity = 18;
              spawnLaserShatter(obs.x, ceilY, groundY - ceilY, theme.laserGlow);
              playSound('shatter');
              addFloatingText('+100 SHATTER!', obs.x, g.drone.y, '#f59e0b');
              g.score += 100;
              continue;
            }

            if (g.graceTimer <= 0) {
              if (dy - 12 < topHeight || dy + 12 > bottomY) {
                triggerGameOver('VAPORIZED BY LASER PYLON');
              }
            }

            if (!obs.closeCallDone && (Math.abs(dy - 12 - topHeight) < 22 || Math.abs(dy + 12 - bottomY) < 22)) {
              obs.closeCallDone = true;
              g.closeCalls++;
              g.overclock = Math.min(100, g.overclock + 20);
              setOverclock(g.overclock);
              g.score += 50;
              g.cameraShake.intensity = 8;
              playSound('closeCall');
              addFloatingText('⚡ CLOSE CALL +50', g.drone.x + 20, g.drone.y - 20, '#0284c7');
            }
          }

          if (!obs.passed && g.drone.x > obs.x + obs.width / 2) {
            obs.passed = true;
            g.score += 25;
            g.overclock = Math.min(100, g.overclock + 14);
            setOverclock(g.overclock);

            if (g.overclock >= 100 && !g.isOverclockActive) {
              activateOverclock();
            }
          }
        }

        if (obs.x < -100) {
          g.obstacles.splice(i, 1);
        }
      }

      // 5. RENDER ENERGY RINGS
      for (let i = g.rings.length - 1; i >= 0; i--) {
        const ring = g.rings[i];
        if (g.state === 'PLAYING') {
          ring.x -= (g.isOverclockActive ? 560 : 300) * dt;
          ring.angle += dt * 4;

          const dist = Math.hypot(g.drone.x - ring.x, g.drone.y - ring.y);
          if (dist < ring.radius + 18 && !ring.collected) {
            ring.collected = true;
            g.ringsCollected++;
            g.overclock = Math.min(100, g.overclock + 25);
            setOverclock(g.overclock);
            g.score += 75;
            playSound('ring');
            addFloatingText('+75 ENERGY', ring.x, ring.y, '#10b981');

            for (let p = 0; p < 12; p++) {
              const ang = (p / 12) * Math.PI * 2;
              g.particles.push({
                x: ring.x,
                y: ring.y,
                vx: Math.cos(ang) * (Math.random() * 4 + 3),
                vy: Math.sin(ang) * (Math.random() * 4 + 3),
                color: '#10b981',
                size: Math.random() * 3 + 1.5,
                life: 1.0,
                decay: 0.04,
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

          ctx.strokeStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 3;
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

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (ring.x < -50 || ring.collected) {
          g.rings.splice(i, 1);
        }
      }

      // 6. RENDER PARTICLES & FRAGMENTS
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.life -= p.decay;

        if (p.life <= 0) {
          g.particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

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
        ctx.fillStyle = frag.color;
        ctx.globalAlpha = frag.life;
        ctx.fillRect(-frag.size / 2, -frag.size / 2, frag.size, frag.size);
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;

      // 7. RENDER DRONE (PLAYER)
      const d = g.drone;

      if (d.trail.length > 1) {
        ctx.save();
        for (let t = 0; t < d.trail.length - 1; t++) {
          const pt1 = d.trail[t];
          const pt2 = d.trail[t + 1];
          const progress = 1 - t / d.trail.length;

          ctx.strokeStyle = g.isOverclockActive ? '#f59e0b' : theme.droneAccent;
          ctx.lineWidth = progress * 8 + (g.isOverclockActive ? 6 : 0);
          ctx.globalAlpha = progress * 0.75;
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

      if (g.graceTimer > 0 && Math.floor(timestamp / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      if (g.isOverclockActive) {
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, 36 + Math.sin(timestamp * 0.02) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const droneGrad = ctx.createLinearGradient(26, 0, -20, 0);
      droneGrad.addColorStop(0, '#ffffff');
      droneGrad.addColorStop(0.5, '#f1f5f9');
      droneGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = droneGrad;
      ctx.strokeStyle = theme.droneAccent;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(26, 0);
      ctx.lineTo(-18, -15);
      ctx.lineTo(-10, -4);
      ctx.lineTo(-22, 0);
      ctx.lineTo(-10, 4);
      ctx.lineTo(-18, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = theme.droneAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-12, -10);
      ctx.moveTo(14, 0);
      ctx.lineTo(-12, 10);
      ctx.stroke();

      const cockpitGrad = ctx.createLinearGradient(0, -4, 0, 4);
      cockpitGrad.addColorStop(0, theme.droneAccent);
      cockpitGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = cockpitGrad;
      ctx.beginPath();
      ctx.ellipse(4, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = g.isOverclockActive ? '#f59e0b' : theme.droneFlame;
      ctx.fillRect(-24, -6, 6, 3.5);
      ctx.fillRect(-24, 2.5, 6, 3.5);

      ctx.restore();
      ctx.globalAlpha = 1.0;

      // 8. RENDER FLOATING SCORES
      for (let i = g.floatingTexts.length - 1; i >= 0; i--) {
        const ft = g.floatingTexts[i];
        ft.y -= 1.4;
        ft.life -= ft.decay;

        if (ft.life <= 0) {
          g.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.font = 'bold 17px "Orbitron", sans-serif';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 8;
        ctx.globalAlpha = ft.life;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    const activateOverclock = () => {
      const g = gameRef.current;
      g.isOverclockActive = true;
      setIsOverclockActive(true);
      g.overclockTimer = 4.5;
      g.overclockCount++;
      g.cameraShake.intensity = 20;
      playSound('overclock');
      addFloatingText('⚡ OVERCLOCK HYPERDRIVE!', g.drone.x + 30, g.drone.y - 40, '#f59e0b');
    };

    const triggerGameOver = (reason) => {
      const g = gameRef.current;
      if (g.state === 'GAMEOVER') return;
      g.state = 'GAMEOVER';
      g.cameraShake.intensity = 24;
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

    const handleKeyDown = (e) => {
      if (isLeaderboardOpen) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleFlap();
      } else if (e.code === 'KeyP') {
        togglePause();
      }
    };

    const handleKeyUp = (e) => {
      if (isLeaderboardOpen) return;
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
  }, [handleFlap, handleThrustEnd, playSound, highScore, isLeaderboardOpen]);

  // Pause Handler
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

  // Rank Calculation
  const getRank = (sc) => {
    if (sc >= 2000) return { label: 'S+ GRAND TITAN', color: '#f59e0b' };
    if (sc >= 1200) return { label: 'S AERO ACE', color: '#0284c7' };
    if (sc >= 700) return { label: 'A SKY PILOT', color: '#10b981' };
    if (sc >= 300) return { label: 'B CADET', color: '#a855f7' };
    return { label: 'C ROOKIE', color: '#64748b' };
  };

  // Leaderboard Score Submission Handler
  const handleScoreSubmit = (e) => {
    e.preventDefault();
    if (!pilotName.trim()) return;

    localStorage.setItem('chronoflap_pilot_name', pilotName.trim());
    if (walletAddress.trim()) {
      localStorage.setItem('chronoflap_pilot_wallet', walletAddress.trim());
    }

    const currentScore = Math.max(score, highScore);
    const maskedWallet = walletAddress.trim()
      ? walletAddress.trim().length > 10
        ? `${walletAddress.trim().slice(0, 5)}...${walletAddress.trim().slice(-4)}`
        : walletAddress.trim()
      : '0x...UNSET';

    // Insert user into leaderboard
    const newEntry = {
      name: pilotName.trim(),
      score: currentScore,
      wallet: maskedWallet,
      isUser: true,
    };

    const existingFiltered = leaderboardData.filter((item) => !item.isUser);
    const combined = [...existingFiltered, newEntry].sort((a, b) => b.score - a.score);

    // Re-rank
    const updated = combined.slice(0, 10).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isWinner: idx === 0,
    }));

    setLeaderboardData(updated);
    localStorage.setItem('chronoflap_leaderboard_custom', JSON.stringify(updated));
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  return (
    <div
      className="chronoflap-container"
      onMouseDown={handleFlap}
      onMouseUp={handleThrustEnd}
      onTouchStart={(e) => {
        e.preventDefault();
        handleFlap();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleThrustEnd();
      }}
    >
      {/* 60-120 FPS High-DPI Canvas */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Subtle Light Scanlines */}
      <div className="subtle-scanlines" />

      {/* Dynamic Light Vignette */}
      <div
        className={`light-vignette ${
          chronoMode === 'SLOWMO'
            ? 'vignette-slowmo'
            : chronoMode === 'OVERCLOCK'
            ? 'vignette-overclock'
            : ''
        }`}
      />

      {/* High-Brightness HUD Header */}
      <div className="hud-layer">
        <div className="hud-top">
          {/* Left: Score & Chrono Mode Indicator */}
          <div className="hud-chip hud-chip-left">
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '1px' }}>
                SCORE
              </div>
              <div className="hud-title-font" style={{ fontSize: '26px', color: '#0284c7' }}>
                {score}
              </div>
            </div>

            <div style={{ width: '1px', height: '28px', background: '#cbd5e1' }} />

            {/* Time Dilation Badge */}
            <div
              className={`badge-chrono ${
                chronoMode === 'SLOWMO' ? 'slowmo' : chronoMode === 'OVERCLOCK' ? 'overclock' : 'normal'
              }`}
            >
              <Activity size={12} />
              {chronoMode === 'SLOWMO'
                ? 'BULLET-TIME'
                : chronoMode === 'OVERCLOCK'
                ? '⚡ OVERCLOCK'
                : '1.0x NORMAL'}
            </div>
          </div>

          {/* Center: $1,000 USDT Leaderboard Prize Button */}
          <div
            className="hud-chip hud-chip-center"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button className="prize-hud-btn" onClick={() => setIsLeaderboardOpen(true)}>
              <Trophy size={14} />
              <span>$1,000 USDT LEADERBOARD</span>
              <Sparkles size={12} />
            </button>
          </div>

          {/* Center-Right: Overclock Energy Meter */}
          <div className="hud-chip" style={{ gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#f59e0b' }}>
              <Zap size={14} />
              <span style={{ fontWeight: 800 }}>ENERGY</span>
            </div>
            <div className="overclock-meter">
              <div className="overclock-fill" style={{ width: `${overclock}%` }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', minWidth: '32px' }}>
              {Math.floor(overclock)}%
            </span>
          </div>

          {/* Right: Best Record & Audio Controls */}
          <div
            className="hud-chip hud-chip-right"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
              <Award size={16} color="#f59e0b" />
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                RECORD <span style={{ color: '#0f172a', fontWeight: 800, marginLeft: '4px' }}>{highScore}</span>
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

      {/* START TITLE SCREEN */}
      {gameState === 'START' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(2, 44, 94, 0.45)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="cyber-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span className="badge-chrono normal">AERO LIGHT EDITION</span>
            </div>

            <h1
              className="hud-title-font"
              style={{
                fontSize: '34px',
                margin: '4px 0 2px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '2px',
              }}
            >
              CHRONOFLAP 2099
            </h1>

            {/* $1000 USDT Tournament Banner on Start */}
            <div
              className="prize-hero-banner"
              onClick={() => setIsLeaderboardOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', letterSpacing: '1px' }}>
                  🏆 ALL-TIME FLIGHT CHAMPIONSHIP
                </div>
                <div className="hud-title-font" style={{ fontSize: '20px', color: '#78350f', fontWeight: 900 }}>
                  WIN $1,000 USDT PRIZE
                </div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                  Click to view Leaderboard & Mood Status →
                </div>
              </div>
              <Coins size={36} color="#d97706" />
            </div>

            {/* Bright Theme Selector */}
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, letterSpacing: '1px', marginBottom: '6px' }}>
                SELECT ILLUMINATED THEME
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {THEMES.map((th) => {
                  const Icon = th.icon;
                  const isSelected = selectedTheme.id === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setSelectedTheme(th)}
                      style={{
                        background: isSelected ? '#e0f2fe' : '#f8fafc',
                        border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '8px 4px',
                        color: isSelected ? '#0369a1' : '#64748b',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800,
                        fontFamily: 'Orbitron',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={15} color={isSelected ? '#0284c7' : '#94a3b8'} />
                      {th.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Controls Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '12px',
                color: '#334155',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              <div>• <strong>CLICK / SPACE / TAP:</strong> Crisp upward impulse flap.</div>
              <div>• <strong>TACTICAL GLIDE:</strong> Release to slow down and thread laser gates.</div>
              <div>• <strong>100% ENERGY:</strong> Invincible <strong>Overclock Hyperdrive</strong> speed burst!</div>
            </div>

            {/* Launch & Leaderboard Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="cyber-btn" onClick={startGame} style={{ width: '100%' }}>
                <Play size={18} /> LAUNCH FLIGHT [SPACE]
              </button>
              <button
                className="cyber-btn cyber-btn-gold"
                onClick={() => setIsLeaderboardOpen(true)}
                style={{ width: '100%' }}
              >
                <Trophy size={16} /> VIEW $1,000 USDT LEADERBOARD
              </button>
            </div>
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
            background: 'rgba(2, 44, 94, 0.55)',
            backdropFilter: 'blur(10px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="cyber-card">
            <span
              className="badge-chrono"
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                marginBottom: '8px',
              }}
            >
              FLIGHT TERMINATED
            </span>

            <h2 className="hud-title-font" style={{ fontSize: '28px', margin: '2px 0 12px', color: '#0f172a' }}>
              MISSION REPORT
            </h2>

            {/* Score & Rank */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>FINAL SCORE</div>
                <div className="hud-title-font" style={{ fontSize: '34px', color: '#0284c7' }}>
                  {score}
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: '#cbd5e1' }} />

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>RANK</div>
                <div
                  className="hud-title-font"
                  style={{ fontSize: '17px', color: getRank(score).color, fontWeight: 900 }}
                >
                  {getRank(score).label}
                </div>
              </div>
            </div>

            {/* Flight Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                marginBottom: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>DISTANCE</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{stats.distance} m</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>CLOSE CALLS</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>{stats.closeCalls}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ENERGY RINGS</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>{stats.rings}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>OVERCLOCK BURSTS</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b' }}>{stats.overclocks}</div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="cyber-btn" onClick={startGame} style={{ width: '100%' }}>
                <RotateCcw size={16} /> REBOOT FLIGHT [SPACE]
              </button>
              <button
                className="cyber-btn cyber-btn-gold"
                onClick={() => setIsLeaderboardOpen(true)}
                style={{ width: '100%' }}
              >
                <Trophy size={16} /> SUBMIT TO $1,000 LEADERBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* $1,000 USDT ALL-TIME LEADERBOARD MODAL */}
      {isLeaderboardOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            background: 'rgba(2, 44, 94, 0.65)',
            backdropFilter: 'blur(12px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="cyber-card" style={{ maxWidth: '580px' }}>
            {/* Modal Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge-chrono overclock">CHAMPIONSHIP POOL</span>
              </div>
              <button
                className="icon-btn"
                onClick={() => setIsLeaderboardOpen(false)}
                style={{ border: 'none', background: '#f1f5f9' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grand Prize Header */}
            <div className="prize-hero-banner">
              <div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#92400e', letterSpacing: '1.5px' }}>
                  GRAND PRIZE POOL
                </div>
                <div className="hud-title-font" style={{ fontSize: '26px', color: '#78350f', fontWeight: 900 }}>
                  1,000 $USDT
                </div>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                  Awarded directly to the #1 All-Time Pilot!
                </div>
              </div>
              <Coins size={44} color="#d97706" />
            </div>

            {/* The Viral Mood Schedule Rule Banner */}
            <div className="mood-rule-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 800, fontSize: '13px' }}>
                <Clock size={16} />
                <span>OFFICIAL PAYOUT SCHEDULE</span>
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#0f172a',
                  margin: '6px 0 4px',
                  fontFamily: 'Orbitron',
                }}
              >
                "A result will announce when my mood hits to give."
              </div>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                No corporate deadlines. When the creator feels the vibe, 1,000 USDT is transferred to whoever holds the #1 spot on this leaderboard.
              </div>

              {/* Dynamic Creator Mood Meter */}
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                  <span style={{ color: '#0284c7' }}>{MOOD_QUOTES[moodIndex]}</span>
                  <button
                    onClick={() => setMoodIndex((prev) => (prev + 1) % MOOD_QUOTES.length)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0369a1',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 800,
                      textDecoration: 'underline',
                    }}
                  >
                    Check Vibe 🔄
                  </button>
                </div>
                <div className="mood-meter-bar">
                  <div
                    className="mood-meter-fill"
                    style={{ width: `${((moodIndex + 1) / MOOD_QUOTES.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pilot Registration / Score Submission Form */}
            <form onSubmit={handleScoreSubmit} style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#0284c7" />
                <span>SUBMIT YOUR SCORE (HIGH SCORE: {Math.max(score, highScore)})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr auto', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Pilot Call Sign"
                  className="input-field"
                  value={pilotName}
                  onChange={(e) => setPilotName(e.target.value)}
                  maxLength={18}
                  required
                />
                <input
                  type="text"
                  placeholder="USDT Wallet (TRC20/ERC20)"
                  className="input-field"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
                <button type="submit" className="cyber-btn" style={{ padding: '10px 16px', fontSize: '12px', height: '100%' }}>
                  SUBMIT
                </button>
              </div>
              {submitSuccess && (
                <div style={{ color: '#16a34a', fontSize: '12px', fontWeight: 800, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Score submitted! You are registered on the global board.
                </div>
              )}
            </form>

            {/* All-Time Leaderboard Ranks */}
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>
                ALL-TIME TOP PILOTS
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {leaderboardData.map((item) => (
                  <div
                    key={`${item.rank}-${item.name}`}
                    className={`leaderboard-table-row ${item.rank === 1 ? 'rank-1' : ''} ${item.isUser ? 'current-user' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        className="hud-title-font"
                        style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          minWidth: '24px',
                          color: item.rank === 1 ? '#d97706' : item.rank === 2 ? '#64748b' : item.rank === 3 ? '#b45309' : '#0f172a',
                        }}
                      >
                        #{item.rank}
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.name}
                          {item.rank === 1 && (
                            <span style={{ fontSize: '10px', background: '#f59e0b', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              👑 1,000 USDT LEAD
                            </span>
                          )}
                          {item.isUser && (
                            <span style={{ fontSize: '10px', background: '#0284c7', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          Wallet: {item.wallet}
                        </div>
                      </div>
                    </div>

                    <div className="hud-title-font" style={{ fontSize: '18px', fontWeight: 900, color: '#0284c7' }}>
                      {item.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close / Resume Button */}
            <button
              className="cyber-btn cyber-btn-secondary"
              onClick={() => setIsLeaderboardOpen(false)}
              style={{ width: '100%' }}
            >
              CLOSE LEADERBOARD
            </button>
          </div>
        </div>
      )}

      {/* PAUSE SCREEN */}
      {gameState === 'PAUSED' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            background: 'rgba(2, 44, 94, 0.45)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="cyber-card" style={{ maxWidth: '340px' }}>
            <h2 className="hud-title-font" style={{ fontSize: '24px', margin: '0 0 16px', color: '#0284c7' }}>
              SIMULATION PAUSED
            </h2>
            <button className="cyber-btn" onClick={togglePause} style={{ width: '100%', marginBottom: '10px' }}>
              RESUME [P]
            </button>
            <button className="cyber-btn cyber-btn-secondary" onClick={startGame} style={{ width: '100%' }}>
              RESTART
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
