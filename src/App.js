import React, { useState, useEffect, useRef, useCallback } from 'react';

// SOUND SYNTHESIZER USING NATIVE WEB AUDIO API
class FlappySound {
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

  flap() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.09);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  score() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659, t);
      osc.frequency.setValueAtTime(880, t + 0.08);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  hit() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.16);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  }

  die() {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(390, t);
      osc.frequency.linearRampToValueAtTime(110, t + 0.32);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    } catch (e) {}
  }
}

const sfx = new FlappySound();

// PRECISE SPRITE CO-ORDINATES IN ATLAS
const ATLAS = {
  bg: { x: 4, y: 4, w: 1440, h: 2560 },
  cityline: { x: 2568, y: 4, w: 1440, h: 1100 },
  ground: { x: 1012, y: 2572, w: 1440, h: 530 },
  bird0: { x: 3624, y: 1112, w: 220, h: 150 },
  bird1: { x: 3852, y: 1112, w: 220, h: 150 },
  bird2: { x: 3865, y: 1310, w: 220, h: 232 },
  pipe: { x: 1452, y: 1310, w: 206, h: 1024 },
  tapHint: { x: 3400, y: 1310, w: 457, h: 256 },
  scoreboard: { x: 1666, y: 1310, w: 1446, h: 738 },
  gameOver: { x: 2136, y: 2342, w: 1089, h: 199 },
  medalBronze: { x: 3616, y: 2056, w: 220, h: 220 },
  medalSilver: { x: 1908, y: 2342, w: 220, h: 220 },
  medalGold: { x: 1452, y: 2342, w: 220, h: 220 },
  medalPlatinum: { x: 1680, y: 2342, w: 220, h: 220 },
  newBadge: { x: 3262, y: 2572, w: 206, h: 92 },
  buttonGreen: { x: 3120, y: 1856, w: 520, h: 168 },
  buttonYellow: { x: 3233, y: 2342, w: 520, h: 168 }
};

export default function App() {
  const canvasRef = useRef(null);
  const atlasImgRef = useRef(null);
  const [atlasLoaded, setAtlasLoaded] = useState(false);

  // GAME STATE
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('flappy_best_score') || '0', 10);
  });

  // MUTABLE GAME RUNTIME (60 FPS)
  const g = useRef({
    state: 'READY', // 'READY' | 'PLAYING' | 'OVER'
    score: 0,
    highScore: parseInt(localStorage.getItem('flappy_best_score') || '0', 10),
    isNewHigh: false,
    flashOpacity: 0,
    ticks: 0,
    bird: {
      x: 100,
      y: 290,
      w: 48,
      h: 34,
      radius: 14,
      vy: 0,
      gravity: 0.32,
      jump: -6.4,
      rotation: 0,
      frameIdx: 0
    },
    pipes: [],
    groundOffset: 0,
    cityOffset: 0,
    pipeGap: 140,
    pipeWidth: 68,
    speed: 2.5,
    groundY: 575,
    gameW: 400,
    gameH: 700
  });

  // Load Atlas Image
  useEffect(() => {
    const img = new Image();
    img.src = '/atlas.webp';
    img.onload = () => {
      atlasImgRef.current = img;
      setAtlasLoaded(true);
    };
  }, []);

  // Flap Action Trigger
  const handleFlap = useCallback(() => {
    sfx.init();
    const game = g.current;

    if (game.state === 'READY') {
      game.state = 'PLAYING';
      game.bird.vy = game.bird.jump;
      game.bird.rotation = -0.38;
      sfx.flap();
    } else if (game.state === 'PLAYING') {
      game.bird.vy = game.bird.jump;
      game.bird.rotation = -0.38;
      sfx.flap();
    } else if (game.state === 'OVER') {
      // If bird has reached ground, allow restart
      if (game.bird.y >= game.groundY - game.bird.h / 2 - 2) {
        restartGame();
      }
    }
  }, []);

  const restartGame = () => {
    const game = g.current;
    game.state = 'READY';
    game.score = 0;
    game.isNewHigh = false;
    game.bird.x = 100;
    game.bird.y = 290;
    game.bird.vy = 0;
    game.bird.rotation = 0;
    game.pipes = [];
    game.flashOpacity = 0;
  };

  // Keyboard Bindings
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFlap]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    if (!atlasLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const atlas = atlasImgRef.current;
    let animId;

    const loop = () => {
      const game = g.current;
      game.ticks++;
      const { gameW, gameH, groundY } = game;

      // 1. DRAW BACKGROUND SKY
      const bg = ATLAS.bg;
      ctx.drawImage(atlas, bg.x, bg.y, bg.w, bg.h, 0, 0, gameW, groundY);

      // 2. DRAW CITYLINE (Slow Parallax)
      if (game.state === 'PLAYING') {
        game.cityOffset = (game.cityOffset + 0.45) % gameW;
      }
      const city = ATLAS.cityline;
      const cityH = 150;
      const cityY = groundY - cityH;
      ctx.drawImage(atlas, city.x, city.y, city.w, city.h, -game.cityOffset, cityY, gameW, cityH);
      ctx.drawImage(atlas, city.x, city.y, city.w, city.h, gameW - game.cityOffset, cityY, gameW, cityH);

      // 3. PIPES LOGIC & RENDERING
      if (game.state === 'PLAYING') {
        // Spawn pipe every 95 frames
        if (game.ticks % 95 === 0) {
          const minH = 60;
          const maxH = groundY - game.pipeGap - minH;
          const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
          game.pipes.push({
            x: gameW,
            topH: topH,
            scored: false
          });
        }

        // Move Pipes & Check Collisions
        for (let i = game.pipes.length - 1; i >= 0; i--) {
          const p = game.pipes[i];
          p.x -= game.speed;

          const bottomY = p.topH + game.pipeGap;
          const bottomH = groundY - bottomY;

          // Score check
          if (!p.scored && p.x + game.pipeWidth < game.bird.x) {
            p.scored = true;
            game.score++;
            sfx.score();

            if (game.score > game.highScore) {
              game.highScore = game.score;
              game.isNewHigh = true;
              setHighScore(game.score);
              localStorage.setItem('flappy_best_score', game.score.toString());
            }
          }

          // AABB Collision Check
          const birdLeft = game.bird.x - game.bird.radius + 3;
          const birdRight = game.bird.x + game.bird.radius - 3;
          const birdTop = game.bird.y - game.bird.radius + 3;
          const birdBottom = game.bird.y + game.bird.radius - 3;

          const collideTop = birdRight > p.x && birdLeft < p.x + game.pipeWidth && birdTop < p.topH;
          const collideBottom = birdRight > p.x && birdLeft < p.x + game.pipeWidth && birdBottom > bottomY;

          if (collideTop || collideBottom) {
            triggerHit();
          }

          // Remove off-screen pipes
          if (p.x + game.pipeWidth < -20) {
            game.pipes.splice(i, 1);
          }
        }
      }

      // Draw Pipes
      game.pipes.forEach(p => {
        const pipeSprite = ATLAS.pipe;
        const bottomY = p.topH + game.pipeGap;
        const bottomH = groundY - bottomY;

        // TOP PIPE (Flipped upside down so collar cap is at bottom)
        ctx.save();
        ctx.translate(p.x + game.pipeWidth / 2, p.topH);
        ctx.scale(1, -1);
        ctx.drawImage(
          atlas,
          pipeSprite.x,
          pipeSprite.y,
          pipeSprite.w,
          pipeSprite.h,
          -game.pipeWidth / 2,
          0,
          game.pipeWidth,
          p.topH
        );
        ctx.restore();

        // BOTTOM PIPE (Normal upright with collar cap at top)
        ctx.drawImage(
          atlas,
          pipeSprite.x,
          pipeSprite.y,
          pipeSprite.w,
          pipeSprite.h,
          p.x,
          bottomY,
          game.pipeWidth,
          bottomH
        );
      });

      // 4. BIRD PHYSICS & ANIMATION
      const birdFrames = [ATLAS.bird0, ATLAS.bird1, ATLAS.bird2, ATLAS.bird1];
      if (game.state === 'READY') {
        // Floating sine wave animation
        game.bird.y = 290 + Math.sin(game.ticks * 0.08) * 8;
        game.bird.rotation = 0;
        game.bird.frameIdx = Math.floor((game.ticks / 6) % 4);
      } else if (game.state === 'PLAYING') {
        game.bird.vy += game.bird.gravity;
        game.bird.y += game.bird.vy;

        // Wing flap speed
        if (game.bird.vy < 3) {
          game.bird.frameIdx = Math.floor((game.ticks / 4) % 4);
        } else {
          game.bird.frameIdx = 1; // Gliding frame when falling
        }

        // Tilt rotation interpolation
        if (game.bird.vy < 0) {
          game.bird.rotation = -0.38; // 22 degrees up
        } else if (game.bird.vy > 3) {
          game.bird.rotation = Math.min(1.57, game.bird.rotation + 0.06); // Dives up to 90 degrees down
        }

        // Ceiling collision
        if (game.bird.y - game.bird.radius <= 0) {
          game.bird.y = game.bird.radius;
          game.bird.vy = 0;
        }

        // Ground collision
        if (game.bird.y + game.bird.radius >= groundY) {
          game.bird.y = groundY - game.bird.radius;
          triggerHit();
        }
      } else if (game.state === 'OVER') {
        // Fall directly to the ground
        if (game.bird.y + game.bird.radius < groundY) {
          game.bird.vy += game.bird.gravity * 1.5;
          game.bird.y += game.bird.vy;
          game.bird.rotation = Math.min(1.57, game.bird.rotation + 0.12);
        } else {
          game.bird.y = groundY - game.bird.radius;
        }
      }

      // Draw Bird
      const curFrame = birdFrames[game.bird.frameIdx];
      ctx.save();
      ctx.translate(game.bird.x, game.bird.y);
      ctx.rotate(game.bird.rotation);
      ctx.drawImage(
        atlas,
        curFrame.x,
        curFrame.y,
        curFrame.w,
        curFrame.h,
        -game.bird.w / 2,
        -game.bird.h / 2,
        game.bird.w,
        game.bird.h
      );
      ctx.restore();

      // 5. DRAW SCROLLING GROUND (Drawn over bottom of pipes)
      if (game.state !== 'OVER') {
        game.groundOffset = (game.groundOffset + game.speed) % gameW;
      }
      const gr = ATLAS.ground;
      const grH = gameH - groundY;
      ctx.drawImage(atlas, gr.x, gr.y, gr.w, gr.h, -game.groundOffset, groundY, gameW, grH);
      ctx.drawImage(atlas, gr.x, gr.y, gr.w, gr.h, gameW - game.groundOffset, groundY, gameW, grH);

      // 6. DRAW GAME STATES OVERLAYS
      if (game.state === 'READY') {
        // "GET READY" / GAME TITLE
        ctx.textAlign = 'center';
        ctx.font = 'bold 50px "Jersey10", "Press Start 2P", sans-serif';
        // 3D Shadow
        ctx.fillStyle = '#000000';
        ctx.fillText('SKY FLAP', gameW / 2 + 3, 183);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('SKY FLAP', gameW / 2 + 1, 181);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SKY FLAP', gameW / 2, 180);

        // Tap Hint Tutorial Sprite
        const th = ATLAS.tapHint;
        const thW = 120;
        const thH = (th.h / th.w) * thW;
        ctx.drawImage(atlas, th.x, th.y, th.w, th.h, (gameW - thW) / 2, 380, thW, thH);

        // Instructions Text
        ctx.font = 'bold 22px "Jersey10", sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText('TAP OR PRESS SPACE', gameW / 2 + 1, 481);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TAP OR PRESS SPACE', gameW / 2, 480);
      } else if (game.state === 'PLAYING') {
        // Bright, Crisp Top Score Counter
        ctx.textAlign = 'center';
        ctx.font = 'bold 56px "Jersey10", monospace';
        // Thick Black Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 2;
        ctx.strokeText(game.score.toString(), gameW / 2, 90);
        // Pure White Fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.score.toString(), gameW / 2, 90);
      } else if (game.state === 'OVER') {
        // GAME OVER BANNER
        const go = ATLAS.gameOver;
        const goW = 230;
        const goH = (go.h / go.w) * goW;
        ctx.drawImage(atlas, go.x, go.y, go.w, go.h, (gameW - goW) / 2, 120, goW, goH);

        // SCOREBOARD BRASS PANEL
        const sb = ATLAS.scoreboard;
        const sbW = 310;
        const sbH = (sb.h / sb.w) * sbW;
        const sbX = (gameW - sbW) / 2;
        const sbY = 195;
        ctx.drawImage(atlas, sb.x, sb.y, sb.w, sb.h, sbX, sbY, sbW, sbH);

        // MEDAL IN SLOT
        let medalSprite = null;
        if (game.score >= 40) medalSprite = ATLAS.medalPlatinum;
        else if (game.score >= 30) medalSprite = ATLAS.medalGold;
        else if (game.score >= 20) medalSprite = ATLAS.medalSilver;
        else if (game.score >= 10) medalSprite = ATLAS.medalBronze;

        if (medalSprite) {
          const mW = 54;
          const mH = 54;
          const mX = sbX + 38;
          const mY = sbY + 54;
          ctx.drawImage(atlas, medalSprite.x, medalSprite.y, medalSprite.w, medalSprite.h, mX, mY, mW, mH);
        }

        // NEW BEST BADGE
        if (game.isNewHigh) {
          const nb = ATLAS.newBadge;
          const nbW = 42;
          const nbH = (nb.h / nb.w) * nbW;
          ctx.drawImage(atlas, nb.x, nb.y, nb.w, nb.h, sbX + 175, sbY + 76, nbW, nbH);
        }

        // SCORES ON SCOREBOARD (Right-aligned inside the number slots)
        ctx.textAlign = 'right';
        ctx.font = 'bold 36px "Jersey10", monospace';

        // Current Score
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(game.score.toString(), sbX + 275, sbY + 68);
        ctx.fillText(game.score.toString(), sbX + 275, sbY + 68);

        // Best High Score
        ctx.strokeText(game.highScore.toString(), sbX + 275, sbY + 122);
        ctx.fillText(game.highScore.toString(), sbX + 275, sbY + 122);

        // RESTART "OK / PLAY" BUTTON
        const btn = ATLAS.buttonGreen;
        const btnW = 145;
        const btnH = (btn.h / btn.w) * btnW;
        const btnX = (gameW - btnW) / 2;
        const btnY = 380;
        ctx.drawImage(atlas, btn.x, btn.y, btn.w, btn.h, btnX, btnY, btnW, btnH);

        // Button label
        ctx.textAlign = 'center';
        ctx.font = 'bold 28px "Jersey10", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('PLAY AGAIN', gameW / 2, btnY + 32);
        ctx.fillText('PLAY AGAIN', gameW / 2, btnY + 32);
      }

      // 7. SCREEN FLASH EFFECT ON COLLISION
      if (game.flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${game.flashOpacity})`;
        ctx.fillRect(0, 0, gameW, gameH);
        game.flashOpacity -= 0.08;
      }

      animId = requestAnimationFrame(loop);
    };

    const triggerHit = () => {
      const game = g.current;
      if (game.state === 'OVER') return;
      game.state = 'OVER';
      game.flashOpacity = 0.85;
      sfx.hit();
      setTimeout(() => sfx.die(), 120);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [atlasLoaded]);

  return (
    <div className="w-full h-full min-h-screen flex justify-center items-center bg-[#0a0e17] overflow-hidden">
      {/* PERFECTLY CENTERED GAME CABINET */}
      <div
        className="game-container relative cursor-pointer"
        onClick={handleFlap}
        onTouchStart={(e) => {
          e.preventDefault();
          handleFlap();
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={700}
          className="w-full h-full"
        />

        {/* LOADING SPINNER UNTIL ATLAS IS READY */}
        {!atlasLoaded && (
          <div className="absolute inset-0 bg-[#4ec0ca] flex flex-col justify-center items-center text-white z-50">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="font-bold text-lg font-mono tracking-wider">LOADING SKY FLAP...</div>
          </div>
        )}
      </div>
    </div>
  );
}
