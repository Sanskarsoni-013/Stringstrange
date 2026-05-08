import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, Bell, UserCircle2, MicOff, RefreshCw, Play, ShieldAlert } from 'lucide-react';
import ConstantinELogo from './ui/Logo';

const LandingPage = () => {
  const [nickname, setNickname] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showNicknameStep, setShowNicknameStep] = useState(false);
  const [onlineCount, setOnlineCount] = useState(10482);
  const [showIntro, setShowIntro] = useState(() => {
    const hasSeenIntro = sessionStorage.getItem('ss_intro_seen') === '1';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !hasSeenIntro && !prefersReducedMotion;
  });
  const navigate = useNavigate();

  // Randomly fluctuate online count for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(n => n + Math.floor(Math.random() * 7) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // One-time cinematic opening intro
  useEffect(() => {
    if (!showIntro) return undefined;
    const timeout = setTimeout(() => setShowIntro(false), 3400);
    return () => clearTimeout(timeout);
  }, [showIntro]);

  useEffect(() => {
    if (!showIntro) {
      sessionStorage.setItem('ss_intro_seen', '1');
    }
  }, [showIntro]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setShowIntro(false);
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  const handleStart = () => {
    if (nickname.trim()) {
      localStorage.setItem('userNickname', nickname.trim());
      navigate('/chat');
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleStart(); };

  return (
    <div className="lp-root">
      {showIntro && (
        <div className="lp-intro">
          <div className="lp-intro-glow lp-intro-glow-1" />
          <div className="lp-intro-glow lp-intro-glow-2" />
          <div className="lp-ninja-wrap">
            <div className="lp-ninja-head" />
            <div className="lp-ninja-body" />
            <div className="lp-ninja-sword" />
            <div className="lp-slash" />
          </div>
          <div className="lp-intro-text">
            <div className="lp-intro-kicker">NEURAL INTRO MODE</div>
            <h2>Enter The Conversation Arena</h2>
            <p>Realtime effects + cinematic match energy</p>
          </div>
          <button className="lp-intro-skip" onClick={() => setShowIntro(false)}>Skip intro</button>
        </div>
      )}

      <div className="lp-bg">
        <div className="lp-orb lp-orb1" />
        <div className="lp-orb lp-orb2" />
        <div className="lp-grid" />
        <svg className="venom-tendrils" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="venomGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a0a1a" stopOpacity="0" />
              <stop offset="50%" stopColor="#4a0a1a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b0000" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="venomGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0a1a" stopOpacity="0" />
              <stop offset="50%" stopColor="#2a0a3a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1a0a2e" stopOpacity="0" />
            </linearGradient>
            <filter id="goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
          </defs>
          <g filter="url(#goo)">
            <path className="venom-tendril vt1" d="M-100,200 C200,180 400,220 600,150 S900,100 1100,180 S1400,250 1600,200 S1900,150 2020,250" />
            <path className="venom-tendril vt2" d="M2020,400 C1800,380 1600,420 1400,350 S1100,300 900,380 S600,450 400,400 S100,350 -100,450" />
            <path className="venom-tendril vt3" d="M-100,600 C150,580 350,620 550,550 S850,500 1050,580 S1350,650 1550,600 S1850,550 2020,650" />
            <path className="venom-tendril vt4" d="M2020,800 C1750,780 1550,820 1350,750 S1050,700 850,780 S550,850 350,800 S50,750 -100,850" />
            <path className="venom-tendril vt5" d="M-100,100 C300,80 500,140 800,60 S1200,0 1500,80 S1800,160 2020,100" />
            <path className="venom-tendril vt6" d="M2020,950 C1700,930 1400,970 1100,900 S700,850 400,930 S100,1000 -100,950" />
            <circle className="venom-blob vb1" cx="300" cy="250" r="40" />
            <circle className="venom-blob vb2" cx="1500" cy="400" r="50" />
            <circle className="venom-blob vb3" cx="800" cy="700" r="35" />
            <circle className="venom-blob vb4" cx="1200" cy="850" r="45" />
            <circle className="venom-blob vb5" cx="500" cy="900" r="30" />
          </g>
        </svg>
      </div>

      <header className="lp-header">
        <div className="lp-logo"><ConstantinELogo size={28} /><div className="lp-logo-text"><span>StringStrange</span><small>by ConstantinE</small></div></div>
        <div className="lp-header-icons">
          <button className="lp-icon-btn"><Bell size={15} /></button>
          <button className="lp-icon-btn"><UserCircle2 size={16} /></button>
        </div>
      </header>

      <main className="lp-main-classic">
        <div className="lp-content-card">
          <div className="lp-brand-header">
            <h1>StringStrange</h1>
            <p>Talk to strangers!</p>
          </div>

          <div className="lp-intro-box">
            <p>StringStrange is a great way to meet new friends. When you use StringStrange, we pick someone else at random so you can have a one-on-one chat.</p>
          </div>

          <div className="lp-interests-section">
            <p>What do you want to talk about?</p>
            <div className="lp-interests-input-wrapper">
              <input 
                type="text" 
                placeholder="Add your interests (optional)" 
                className="lp-interests-input"
              />
            </div>
          </div>

          <div className="lp-start-options">
            <p>Start chatting:</p>
            <div className="lp-button-group">
              <button className="lp-chat-type-btn text-btn" onClick={() => navigate('/chat')}>
                Text
              </button>
              <div className="lp-btn-separator">or</div>
              <button className="lp-chat-type-btn video-btn" onClick={() => navigate('/chat')}>
                Video
              </button>
            </div>
          </div>

          <div className="lp-stats-row">
            <div className="lp-online-stat">
              <span className="lp-pulse-dot" />
              <strong>{onlineCount.toLocaleString()}</strong> online now
            </div>
          </div>
        </div>

        <div className="lp-footer-classic">
          <p>© 2026 StringStrange. All rights reserved.</p>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          background: #05050a;
          color: #e8e8ee;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        
        .lp-intro {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 24px;
          background: radial-gradient(circle at center, rgba(20, 5, 10, 0.95) 0%, rgba(5, 2, 8, 0.98) 65%, #020205 100%);
          animation: intro-fade 3.4s ease forwards;
        }
        @keyframes intro-fade {
          0%, 84% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }
        .lp-intro-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(80px);
          opacity: 0.42;
          animation: intro-float 2.8s ease-in-out infinite alternate;
        }
        .lp-intro-glow-1 {
          width: 360px;
          height: 360px;
          background: #8b0000;
          top: 12%;
          left: 18%;
          opacity: 0.3;
        }
        .lp-intro-glow-2 {
          width: 320px;
          height: 320px;
          background: #2a0a3a;
          right: 14%;
          bottom: 16%;
          animation-delay: 0.5s;
          opacity: 0.3;
        }
        @keyframes intro-float {
          from { transform: translateY(12px) scale(1); }
          to { transform: translateY(-12px) scale(1.08); }
        }
        .lp-ninja-wrap {
          width: 180px;
          height: 180px;
          position: relative;
          filter: drop-shadow(0 0 24px rgba(138, 20, 50, 0.5));
          animation: ninja-pop 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes ninja-pop {
          from { opacity: 0; transform: scale(0.7) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lp-ninja-head {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(145deg, #1a0a10, #0a0508);
          border: 2px solid rgba(255,255,255,0.09);
          position: absolute;
          top: 24px;
          left: 64px;
        }
        .lp-ninja-body {
          width: 88px;
          height: 88px;
          border-radius: 20px 20px 28px 28px;
          background: linear-gradient(150deg, #0f0a0f, #050308);
          border: 2px solid rgba(255,255,255,0.08);
          position: absolute;
          top: 70px;
          left: 46px;
        }
        .lp-ninja-sword {
          width: 124px;
          height: 7px;
          border-radius: 999px;
          position: absolute;
          top: 96px;
          left: 20px;
          background: linear-gradient(90deg, #8b0000 0%, #c5304a 45%, #f8fafc 100%);
          transform-origin: 18px center;
          animation: sword-swing 1.3s ease-in-out infinite alternate;
          box-shadow: 0 0 18px rgba(197, 48, 74, 0.6);
        }
        @keyframes sword-swing {
          0% { transform: rotate(-24deg); }
          100% { transform: rotate(12deg); }
        }
        .lp-slash {
          position: absolute;
          width: 166px;
          height: 3px;
          left: 7px;
          top: 86px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent 0%, #8b0000 20%, #c5304a 75%, transparent 100%);
          transform: rotate(-18deg) scaleX(0.1);
          opacity: 0;
          animation: slash-run 1.2s ease-in-out 0.5s infinite;
        }
        @keyframes slash-run {
          0% { opacity: 0; transform: rotate(-18deg) scaleX(0.1); }
          20% { opacity: 0.95; }
          65% { opacity: 0.65; transform: rotate(-18deg) scaleX(1); }
          100% { opacity: 0; transform: rotate(-18deg) scaleX(1.3); }
        }
        .lp-intro-text {
          text-align: center;
          z-index: 2;
          animation: intro-rise 0.9s ease;
        }
        @keyframes intro-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-intro-kicker {
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #c5304a;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .lp-intro-text h2 {
          font-size: clamp(24px, 3.5vw, 38px);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          background: linear-gradient(130deg, #f0e8e8 0%, #c5304a 42%, #2a0a1a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-intro-text p {
          color: #8a8a96;
          font-size: 15px;
        }
        .lp-intro-skip {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #b0b0bb;
          font-size: 12px;
          font-weight: 600;
          border-radius: 999px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lp-intro-skip:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }

        /* ─── BG ─── */
        .lp-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          animation: float 10s ease-in-out infinite alternate;
        }
        .lp-orb1 { width: 500px; height: 500px; background: #2a0a1a; top: -20%; left: -15%; animation-duration: 12s; opacity: 0.3; }
        .lp-orb2 { width: 420px; height: 420px; background: #0f0a1a; bottom: -16%; right: -8%; animation-duration: 9s; animation-delay: 2s; opacity: 0.3; }
        @keyframes float { 0%{transform:translateY(0) scale(1);} 100%{transform:translateY(-30px) scale(1.05);} }
        .lp-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* ─── HEADER ─── */
        .lp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 26px;
          position: relative; z-index: 10;
          border-bottom: 1px solid rgba(138, 20, 50, 0.35);
          backdrop-filter: blur(8px);
        }
        .lp-logo { display: flex; align-items: center; gap: 10px; color: #991b3a; }
        .lp-logo-text { display: flex; flex-direction: column; line-height: 1.1; }
        .lp-logo-text span { font-size: 24px; font-weight: 800; letter-spacing: 0.04em; }
        .lp-logo-text small { font-size: 11px; font-weight: 500; color: #c5304a; letter-spacing: 0.08em; text-transform: uppercase; }
        .lp-header-icons { display: flex; gap: 10px; }
        .lp-icon-btn {
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(138, 20, 50, 0.3);
          background: rgba(15, 10, 18, 0.5);
          color: #b0b0bb; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .lp-icon-btn:hover {
          border-color: rgba(138, 20, 50, 0.6);
          background: rgba(138, 20, 50, 0.15);
          transform: translateY(-1px);
        }
        .lp-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #c5304a;
          animation: pulse-d 2s infinite;
        }
        @keyframes pulse-d { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(197,48,74,0.4);} 50%{opacity:0.7;box-shadow:0 0 0 5px rgba(197,48,74,0);} }

        /* ─── MAIN ─── */
        .lp-main-classic { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; z-index: 10; position: relative; }
        .lp-content-card { background: rgba(15, 10, 18, 0.85); border: 1px solid rgba(138, 20, 50, 0.3); border-radius: 24px; padding: 40px; width: 100%; max-width: 650px; backdrop-filter: blur(20px); box-shadow: 0 20px 80px rgba(0,0,0,0.6); }
        
        .lp-brand-header { text-align: center; margin-bottom: 30px; }
        .lp-brand-header h1 { font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #f0f0f5, #c5304a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .lp-brand-header p { color: #c5304a; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-size: 14px; }
        
        .lp-intro-box { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #c5304a; }
        .lp-intro-box p { color: #9a9aaa; font-size: 15px; line-height: 1.6; }
        
        .lp-interests-section { margin-bottom: 30px; }
        .lp-interests-section p { color: #fff; font-weight: 600; margin-bottom: 12px; }
        .lp-interests-input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(138,20,50,0.2); border-radius: 10px; padding: 14px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .lp-interests-input:focus { border-color: rgba(138,20,50,0.6); }
        
        .lp-start-options { text-align: center; margin-bottom: 30px; }
        .lp-start-options p { color: #8a8a96; font-size: 13px; margin-bottom: 15px; font-weight: 600; text-transform: uppercase; }
        
        .lp-button-group { display: flex; align-items: center; justify-content: center; gap: 20px; }
        .lp-chat-type-btn { flex: 1; border: none; border-radius: 14px; padding: 18px; font-size: 20px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
        .text-btn { background: #3b82f6; color: #fff; box-shadow: 0 8px 24px rgba(59,130,246,0.3); }
        .video-btn { background: #c5304a; color: #fff; box-shadow: 0 8px 24px rgba(197,48,74,0.3); }
        .lp-chat-type-btn:hover { transform: translateY(-3px); filter: brightness(1.1); }
        .lp-btn-separator { color: #4a4a5a; font-weight: 700; }
        
        .lp-stats-row { display: flex; justify-content: center; margin-top: 20px; }
        .lp-online-stat { display: flex; align-items: center; gap: 10px; color: #9a9aaa; font-size: 14px; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 999px; }
        .lp-pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: lp-pulse 2s infinite; }
        @keyframes lp-pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 100% { box-shadow: 0 0 0 10px rgba(34,197,94,0); } }
        
        .lp-footer-classic { margin-top: 40px; color: #4a4a5a; font-size: 12px; }

        /* Venom tendril animations */
        .venom-tendrils {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          opacity: 0.4;
        }
        .venom-tendril {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          opacity: 0.5;
        }
        .vt1 { stroke: url(#venomGrad1); animation: tendril-flow1 8s ease-in-out infinite; }
        .vt2 { stroke: url(#venomGrad2); animation: tendril-flow2 10s ease-in-out infinite; }
        .vt3 { stroke: url(#venomGrad1); animation: tendril-flow3 9s ease-in-out infinite; }
        .vt4 { stroke: url(#venomGrad2); animation: tendril-flow4 11s ease-in-out infinite; }
        .vt5 { stroke: url(#venomGrad1); animation: tendril-flow5 7s ease-in-out infinite; }
        .vt6 { stroke: url(#venomGrad2); animation: tendril-flow6 12s ease-in-out infinite; }

        .venom-blob {
          fill: #4a0a1a;
          opacity: 0.3;
        }
        .vb1 { animation: blob-move1 6s ease-in-out infinite; }
        .vb2 { animation: blob-move2 8s ease-in-out infinite; }
        .vb3 { animation: blob-move3 7s ease-in-out infinite; }
        .vb4 { animation: blob-move4 9s ease-in-out infinite; }
        .vb5 { animation: blob-move5 5s ease-in-out infinite; }

        @keyframes tendril-flow1 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.5; }
          25% { transform: translateY(-15px) scaleX(1.02); opacity: 0.7; }
          50% { transform: translateY(5px) scaleX(0.98); opacity: 0.4; }
          75% { transform: translateY(-8px) scaleX(1.01); opacity: 0.6; }
        }
        @keyframes tendril-flow2 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.4; }
          30% { transform: translateY(12px) scaleX(1.03); opacity: 0.6; }
          60% { transform: translateY(-10px) scaleX(0.97); opacity: 0.5; }
        }
        @keyframes tendril-flow3 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.5; }
          20% { transform: translateY(-18px) scaleX(1.01); opacity: 0.7; }
          50% { transform: translateY(8px) scaleX(0.99); opacity: 0.4; }
          80% { transform: translateY(-5px) scaleX(1.02); opacity: 0.6; }
        }
        @keyframes tendril-flow4 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.4; }
          25% { transform: translateY(10px) scaleX(0.98); opacity: 0.6; }
          55% { transform: translateY(-12px) scaleX(1.03); opacity: 0.5; }
          85% { transform: translateY(6px) scaleX(0.99); opacity: 0.45; }
        }
        @keyframes tendril-flow5 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.5; }
          33% { transform: translateY(-20px) scaleX(1.02); opacity: 0.7; }
          66% { transform: translateY(15px) scaleX(0.98); opacity: 0.4; }
        }
        @keyframes tendril-flow6 {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.4; }
          20% { transform: translateY(-10px) scaleX(1.01); opacity: 0.5; }
          40% { transform: translateY(12px) scaleX(0.99); opacity: 0.6; }
          70% { transform: translateY(-8px) scaleX(1.02); opacity: 0.45; }
        }

        @keyframes blob-move1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(100px, 50px) scale(1.3); }
        }
        @keyframes blob-move2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-80px, -40px) scale(1.2); }
        }
        @keyframes blob-move3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -60px) scale(1.4); }
        }
        @keyframes blob-move4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.1); }
        }
        @keyframes blob-move5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(70px, -20px) scale(1.3); }
        }

        @media (max-width: 500px) {
          .lp-header { padding: 16px; }
          .lp-logo { gap: 8px; }
          .lp-logo svg { width: 24px; height: 24px; }
          .lp-logo-text span { font-size: 18px; }
          .lp-logo-text small { font-size: 9px; }
          .lp-title { font-size: 36px; }
          .lp-subtitle { font-size: 14px; }
          .lp-start-hero-btn { font-size: 16px; padding: 12px 28px; }
          .lp-input { width: 100%; }
          .lp-stat-card { width: 100%; max-width: 280px; }
          .lp-dock { width: 100%; justify-content: space-between; }
          .lp-intro-skip { bottom: 16px; right: 16px; }
          .venom-tendrils { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;