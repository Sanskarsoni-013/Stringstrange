import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, SkipForward, X, Flag, Home, Users, Loader2, Wifi, WifiOff, Settings, Lock, HelpCircle, Mail, User, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import ConstantinELogo from './ui/Logo';

// Backend URL - use environment variable or default to production domain
const getBackendUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8001';
  }
  // For production - use your domain
  return 'https://stringstrange.online:8001';
};
const BACKEND_URL = getBackendUrl();
const SUPPORT_EMAIL = 'sanskar05soni@gmail.com';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

const detectNudity = (videoElement) => {
  if (!videoElement || videoElement.readyState < 2) return { detected: false };
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, 64, 48);
    const data = ctx.getImageData(0, 0, 64, 48).data;
    let skinPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 80 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 10 && (r - g) < 80) skinPixels++;
    }
    const ratio = skinPixels / (data.length / 4);
    return { detected: ratio > 0.55, confidence: ratio };
  } catch (e) { return { detected: false }; }
};

const VideoChat = () => {
  const navigate = useNavigate();
  const [nickname] = useState(localStorage.getItem('userNickname') || '');
  const [gender, setGender] = useState(localStorage.getItem('ss_gender') || '');
  const [genderPref, setGenderPref] = useState(localStorage.getItem('ss_genderPref') || 'any');
  const [userId] = useState(() => Math.random().toString(36).substring(2, 15));
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [partnerNickname, setPartnerNickname] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [wsReady, setWsReady] = useState(false);
  const [stats, setStats] = useState({ activeUsers: 0 });
  const [searchDots, setSearchDots] = useState('');
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGenderSetup, setShowGenderSetup] = useState(!localStorage.getItem('ss_gender'));
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [nudityAlert, setNudityAlert] = useState(false);
  const [toast, setToast] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const isWsConnectingRef = useRef(false);
  const nudityIntervalRef = useRef(null);
  const pendingFindMatchRef = useRef(false);

  useEffect(() => { if (!nickname) navigate('/'); }, [nickname, navigate]);

  useEffect(() => {
    if (connectionStatus === 'searching' || connectionStatus === 'waiting') {
      const interval = setInterval(() => { setSearchDots(d => d.length >= 3 ? '' : d + '.'); }, 500);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (!nickname) return;
    shouldReconnectRef.current = true;
    initializeMedia();
    connectWebSocket();
    fetchStats();
    return () => cleanup();
  }, [nickname]);

  useEffect(() => {
    if (isConnected && remoteVideoRef.current) {
      nudityIntervalRef.current = setInterval(() => {
        const result = detectNudity(remoteVideoRef.current);
        if (result.detected && result.confidence > 0.6) {
          setNudityAlert(true);
          setToast({ type: 'warning', text: 'Inappropriate content detected. Auto-disconnecting...' });
          setTimeout(() => { handleAutoBan(); }, 2000);
        }
      }, 2000);
    }
    return () => { if (nudityIntervalRef.current) clearInterval(nudityIntervalRef.current); };
  }, [isConnected]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }
  }, [toast]);

  const handleAutoBan = () => {
    nextPartner();
    setNudityAlert(false);
    setToast({ type: 'success', text: 'Disconnected for safety. Finding a new match...' });
  };

  const syncLocalTracksToPeerConnection = (stream) => {
    const pc = peerConnectionRef.current;
    if (!pc || !stream) return;
    const senders = pc.getSenders();
    stream.getTracks().forEach((track) => {
      const existing = senders.find(s => s.track && s.track.kind === track.kind);
      if (existing) { existing.replaceTrack(track).catch(err => console.warn(err)); }
      else { pc.addTrack(track, stream); }
    });
  };

  const initializeMedia = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Camera/mic not supported.');
      setConnectionStatus('media_error');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      syncLocalTracksToPeerConnection(stream);
      if (stream.getVideoTracks().length === 0) {
        setMediaError('Camera not detected. Allow access.');
      }
      setIsVideoEnabled(stream.getVideoTracks().some(t => t.enabled));
      setIsAudioEnabled(stream.getAudioTracks().some(t => t.enabled));
      if (stream.getVideoTracks().length > 0) setMediaError('');
      if (connectionStatus === 'media_error') setConnectionStatus(wsReady ? 'connected' : 'idle');
      return true;
    } catch (error) {
      const msg = error?.name === 'NotAllowedError' ? 'Permission denied. Allow camera/mic.' : 'Unable to access camera/mic.';
      setMediaError(msg);
      setConnectionStatus('media_error');
      return false;
    }
  };

  const connectWebSocket = () => {
    if (isWsConnectingRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      isWsConnectingRef.current = true;
      setIsWsConnecting(true);
      const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
      ws.onopen = () => {
        wsRef.current = ws;
        setWsReady(true);
        setIsWsConnecting(false);
        isWsConnectingRef.current = false;
        setConnectionStatus('connected');
        ws.send(JSON.stringify({ type: 'set_gender', gender, genderPref }));
        // Send pending find_match if waiting
        if (pendingFindMatchRef.current) {
          pendingFindMatchRef.current = false;
          setConnectionStatus('searching');
          ws.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
        }
      };
      ws.onmessage = async (event) => { await handleWebSocketMessage(JSON.parse(event.data)); };
      ws.onclose = () => {
        wsRef.current = null;
        setWsReady(false);
        setIsWsConnecting(false);
        isWsConnectingRef.current = false;
        if (shouldReconnectRef.current) {
          setConnectionStatus('reconnecting');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), 1200);
        } else { setConnectionStatus('idle'); }
      };
      ws.onerror = () => {
        setConnectionStatus('reconnecting');
        setIsWsConnecting(false);
        isWsConnectingRef.current = false;
      };
    } catch (e) {
      setIsWsConnecting(false);
      isWsConnectingRef.current = false;
    }
  };

  const handleWebSocketMessage = async (message) => {
    switch (message.type) {
      case 'match_found':
        setPartnerNickname(message.partner_nickname || `User ${message.partner_id?.substring(0, 6)}`);
        setPartnerGender(message.partner_gender || '');
        setConnectionStatus('matched');
        setMessages([]);
        await createPeerConnection();
        if (message.initiator) await createOffer();
        break;
      case 'waiting_for_match': setConnectionStatus('waiting'); break;
      case 'offer': await handleOffer(message.offer); break;
      case 'answer': await handleAnswer(message.answer); break;
      case 'ice_candidate': await handleIceCandidate(message.candidate); break;
      case 'peer_disconnected': handlePeerDisconnected(); break;
      case 'chat_ended': handleChatEnded(); break;
      case 'chat_message':
        setMessages(prev => [...prev, {
          from: 'partner', text: message.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        break;
      default: break;
    }
  };

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection({ iceServers });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = (event) => {
      const [remote] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
        remoteVideoRef.current.play().catch(err => console.warn('Autoplay blocked:', err));
      }
      setIsConnected(true);
      setConnectionStatus('video_connected');
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'ice_candidate', candidate: event.candidate }));
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') handlePeerDisconnected();
    };
    peerConnectionRef.current = pc;
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'offer', offer }));
    } catch (e) { console.error('Offer error:', e); }
  };

  const handleOffer = async (offer) => {
    try {
      if (!peerConnectionRef.current) await createPeerConnection();
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'answer', answer }));
    } catch (e) { console.error('Offer handle error:', e); }
  };

  const handleAnswer = async (answer) => {
    try { await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer)); }
    catch (e) { console.error('Answer error:', e); }
  };

  const handleIceCandidate = async (candidate) => {
    try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (e) { console.error('ICE error:', e); }
  };

  const handlePeerDisconnected = () => {
    setIsConnected(false);
    setPartnerNickname('');
    setPartnerGender('');
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    // Automatically find next match
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setConnectionStatus('searching');
        setMessages([]);
        wsRef.current.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
      }
    }, 500);
  };

  const handleChatEnded = () => { handlePeerDisconnected(); };

  const findMatch = () => {
    if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
      initializeMedia().then((ok) => { if (ok) findMatch(); });
      return;
    }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setConnectionStatus('searching');
      setMessages([]);
      ws.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
    } else {
      setConnectionStatus('connecting');
      pendingFindMatchRef.current = true;
      connectWebSocket();
    }
  };

  const nextPartner = () => {
    if (wsRef.current) {
      if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setIsConnected(false);
      setConnectionStatus('searching');
      setMessages([]);
      wsRef.current.send(JSON.stringify({ type: 'next_partner', genderPref }));
    }
  };

  const endChat = () => {
    if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'end_chat' }));
    handleChatEnded();
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !wsRef.current) return;
    const text = chatInput.trim();
    setMessages(prev => [...prev, {
      from: 'me', text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    wsRef.current.send(JSON.stringify({ type: 'chat_message', text }));
    setChatInput('');
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) { initializeMedia(); return; }
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoEnabled(track.enabled); }
  };

  const toggleAudio = () => {
    if (!localStreamRef.current) { initializeMedia(); return; }
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioEnabled(track.enabled); }
  };

  const submitReport = () => {
    if (!reportReason) return;
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'report_user', reason: reportReason, reported_user: partnerNickname }));
    }
    setShowReport(false);
    setReportReason('');
    setToast({ type: 'success', text: 'Report submitted. Keeping the community safe.' });
    nextPartner();
  };

  const saveGender = (g, pref) => {
    setGender(g);
    setGenderPref(pref);
    localStorage.setItem('ss_gender', g);
    localStorage.setItem('ss_genderPref', pref);
    setShowGenderSetup(false);
    setToast({ type: 'success', text: 'Preferences saved!' });
    if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'set_gender', gender: g, genderPref: pref }));
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) { /* silently fail */ }
  };

  const cleanup = () => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    isWsConnectingRef.current = false;
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (wsRef.current) wsRef.current.close();
    if (nudityIntervalRef.current) clearInterval(nudityIntervalRef.current);
  };

  const isSearching = connectionStatus === 'searching' || connectionStatus === 'waiting' || connectionStatus === 'matched';
  const isPreStartState = !isConnected && !isSearching;

  if (!nickname) return null;

  return (
    <div className="videochat-root">
      {/* GENDER SETUP MODAL */}
      {showGenderSetup && (
        <div className="vc-modal-overlay">
          <div className="vc-modal vc-gender-modal">
            <h3>Welcome to StringStrange</h3>
            <p style={{fontSize:'12px',color:'#9a9aaa',marginTop:'-4px'}}>by ConstantinE</p>
            <p>Tell us about yourself to find better matches.</p>
            <div className="vc-gender-section">
              <label>I am:</label>
              <div className="vc-gender-options">
                <button className={"vc-gender-btn" + (gender === "male" ? " active" : "")} onClick={() => setGender("male")}><User size={16}/> Male</button>
                <button className={"vc-gender-btn" + (gender === "female" ? " active" : "")} onClick={() => setGender("female")}><User size={16}/> Female</button>
              </div>
            </div>
            <div className="vc-gender-section">
              <label>I want to chat with:</label>
              <div className="vc-gender-options">
                <button className={"vc-gender-btn" + (genderPref === "any" ? " active" : "")} onClick={() => setGenderPref("any")}>Anyone</button>
                <button className={"vc-gender-btn" + (genderPref === "male" ? " active" : "")} onClick={() => setGenderPref("male")}><User size={16}/> Male</button>
                <button className={"vc-gender-btn" + (genderPref === "female" ? " active" : "")} onClick={() => setGenderPref("female")}><User size={16}/> Female</button>
              </div>
            </div>
            <button className="vc-modal-primary" onClick={() => saveGender(gender, genderPref)} disabled={!gender}>Start Matching</button>
          </div>
        </div>
      )}

      {/* NUDITY ALERT */}
      {nudityAlert && (
        <div className="vc-nudity-overlay">
          <AlertTriangle size={48} />
          <h3>Inappropriate Content Detected</h3>
          <p>Auto-disconnecting for your safety.</p>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={"vc-toast vc-toast-" + toast.type}>
          {toast.type === "success" ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          {toast.text}
        </div>
      )}

      {/* HEADER */}
      <header className="vc-header">
        <div className="vc-header-left">
          <button className="vc-back-btn" onClick={() => navigate("/")}><Home size={18} /><span>Home</span></button>
          <div className="vc-logo-small"><ConstantinELogo size={22} /><div className="vc-logo-text"><span>StringStrange</span><small>by ConstantinE</small></div></div>
        </div>
        <div className="vc-header-right">
          <div className="vc-online-count"><span className="vc-online-dot" /><Users size={14} /><span>{stats.activeUsers || "--"} online</span></div>
          <div className={"vc-status-badge " + (isConnected ? "vc-status-live" : wsReady ? "vc-status-ready" : isSearching ? "vc-status-searching" : connectionStatus === "connecting" ? "vc-status-connecting" : "")}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? "Live" : isSearching ? "Searching..." : connectionStatus === "connecting" ? "Connecting..." : wsReady ? "Ready" : isWsConnecting || connectionStatus === "reconnecting" ? "Connecting..." : "Offline"}
          </div>
          <button className="vc-settings-btn" onClick={() => setShowGenderSetup(true)} title="Preferences"><Settings size={15} /></button>
          <button className="vc-settings-btn" onClick={() => setShowHelp(true)} title="Help"><HelpCircle size={15} /></button>
        </div>
      </header>

      {/* MAIN VIDEO */}
      <main className="vc-main">
        <div className="vc-video-primary">
          <video ref={remoteVideoRef} autoPlay playsInline className="vc-video" data-testid="remote-video" />

          {!isConnected && (
            <div className="vc-overlay">
              {isSearching ? (
                <div className="vc-searching">
                  <div className="vc-pulse-ring" />
                  <div className="vc-pulse-ring vc-pulse-ring-2" />
                  <div className="vc-pulse-ring vc-pulse-ring-3" />
                  <div className="vc-search-icon"><Loader2 size={32} className="vc-spin" /></div>
                  <p className="vc-search-text">Looking for someone{searchDots}</p>
                  <p className="vc-search-sub">Connecting you to a stranger worldwide</p>
                  {genderPref !== "any" && <p className="vc-search-pref">Preference: {genderPref === "male" ? "Male" : "Female"}</p>}
                </div>
              ) : connectionStatus === "media_error" ? (
                <div className="vc-idle-state">
                  <div className="vc-idle-icon"><VideoOff size={44} /></div>
                  <p className="vc-idle-text">Camera / Mic required</p>
                  <p className="vc-idle-sub">{mediaError || "Enable camera and microphone."}</p>
                  <button className="vc-enable-media-btn" onClick={initializeMedia}>Enable Camera & Mic</button>
                </div>
              ) : (
                <div className="vc-idle-state">
                  <div className="vc-idle-icon"><Video size={48} /></div>
                  <p className="vc-idle-text">Stranger's video</p>
                  <p className="vc-idle-sub">Press <strong>Start</strong> to meet someone new</p>
                </div>
              )}
            </div>
          )}

          {isConnected && partnerNickname && (
            <div className="vc-partner-label">
              <span className="vc-live-dot" />
              {partnerNickname} {partnerGender && <span className="vc-partner-gender">({partnerGender})</span>}
            </div>
          )}

          {isConnected && (
            <button className="vc-next-overlay-btn" onClick={nextPartner}><SkipForward size={16} /> Next</button>
          )}

          {isConnected && (
            <button className="vc-chat-toggle" onClick={() => setShowChat(s => !s)}>
              <MessageSquare size={18} />
              {messages.filter(m => m.from === "partner").length > 0 && <span className="vc-chat-badge">{messages.filter(m => m.from === "partner").length}</span>}
            </button>
          )}

          {showChat && isConnected && (
            <div className="vc-chat-panel">
              <div className="vc-chat-head"><span>Chat with {partnerNickname || "Stranger"}</span><button onClick={() => setShowChat(false)}><X size={14}/></button></div>
              <div className="vc-chat-messages">
                {messages.length === 0 && <p className="vc-chat-empty">Say hello!</p>}
                {messages.map((m, i) => (
                  <div key={i} className={"vc-chat-msg " + (m.from === "me" ? "vc-chat-me" : "vc-chat-them")}>
                    <span>{m.text}</span><small>{m.time}</small>
                  </div>
                ))}
              </div>
              <div className="vc-chat-input-row">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="vc-chat-input" />
                <button className="vc-chat-send" onClick={sendMessage}>Send</button>
              </div>
            </div>
          )}
        </div>

        <div className="vc-video-pip">
          <video ref={localVideoRef} autoPlay muted playsInline className="vc-video" data-testid="local-video" />
          {!isVideoEnabled && <div className="vc-pip-off"><VideoOff size={28} /></div>}
          <div className="vc-pip-label">You{gender ? " (" + gender + ")" : ""}</div>
        </div>
      </main>

      {/* HELP MODAL */}
      {showHelp && (
        <div className="vc-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="vc-modal" onClick={e => e.stopPropagation()}>
            <div className="vc-modal-head"><h3><HelpCircle size={20}/> Help & Support</h3><button className="vc-modal-close" onClick={() => setShowHelp(false)}><X size={16}/></button></div>
            <div className="vc-modal-body">
              <p><strong>Need help?</strong> Contact our support team:</p>
              <a href={"mailto:" + SUPPORT_EMAIL} className="vc-email-link"><Mail size={16}/> {SUPPORT_EMAIL}</a>
              <div className="vc-help-section"><h4>Quick Tips</h4>
                <ul><li>Click <strong>Start</strong> to find a random stranger</li><li>Click <strong>Next</strong> to skip to a new person</li><li>Toggle mic/camera with the buttons</li><li>Report inappropriate behavior</li><li>Set gender preferences for better matching</li></ul>
              </div>
              <div className="vc-help-section"><h4>Safety</h4>
                <ul><li>Never share personal info with strangers</li><li>Auto-ban is active for inappropriate content</li><li>Report users who violate guidelines</li></ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY MODAL */}
      {showPrivacy && (
        <div className="vc-modal-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="vc-modal" onClick={e => e.stopPropagation()}>
            <div className="vc-modal-head"><h3><Lock size={20}/> Privacy Policy</h3><button className="vc-modal-close" onClick={() => setShowPrivacy(false)}><X size={16}/></button></div>
            <div className="vc-modal-body vc-privacy-body">
              <p><strong>StringStrange by ConstantinE</strong> values your privacy.</p>
              <h4>Data We Collect</h4>
              <ul><li>Nickname (local only)</li><li>Gender preference (local only, for matching)</li><li>Connection ID (temporary, per session)</li></ul>
              <h4>What We Don't Do</h4>
              <ul><li>We don't store video/audio conversations</li><li>We don't sell your data</li><li>We don't require real names</li></ul>
              <h4>Auto-Ban System</h4>
              <p>Our system detects inappropriate content and auto-disconnects for safety.</p>
              <p className="vc-privacy-contact">Questions? <a href={"mailto:" + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a></p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReport && (
        <div className="vc-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="vc-modal" onClick={e => e.stopPropagation()}>
            <div className="vc-modal-head"><h3><Flag size={20}/> Report User</h3><button className="vc-modal-close" onClick={() => setShowReport(false)}><X size={16}/></button></div>
            <div className="vc-modal-body">
              <p>Reporting: <strong>{partnerNickname || "Current user"}</strong></p>
              <label>Reason:</label>
              <select className="vc-report-select" value={reportReason} onChange={e => setReportReason(e.target.value)}>
                <option value="">Select a reason...</option>
                <option value="nudity">Nudity / Sexual content</option>
                <option value="harassment">Harassment / Bullying</option>
                <option value="spam">Spam / Advertising</option>
                <option value="hate">Hate speech</option>
                <option value="violence">Violence / Threats</option>
                <option value="other">Other</option>
              </select>
              <button className="vc-modal-primary" onClick={submitReport} disabled={!reportReason}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <footer className="vc-controls">
        {isPreStartState ? (
          <div className="vc-controls-prompt">
            <button className={"vc-mini-btn" + (!isVideoEnabled ? " vc-ctrl-danger" : "")} onClick={toggleVideo} title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}>
              {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button className={"vc-mini-btn" + (!isAudioEnabled ? " vc-ctrl-danger" : "")} onClick={toggleAudio} title={isAudioEnabled ? "Mute" : "Unmute"}>
              {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button className="vc-start-pill-btn" onClick={findMatch} data-testid="find-match-button">Start</button>
            <button className="vc-mini-btn" onClick={() => setShowPrivacy(true)} title="Privacy"><Lock size={18}/></button>
            <button className="vc-mini-btn" onClick={() => setShowHelp(true)} title="Help"><HelpCircle size={18}/></button>
          </div>
        ) : (
          <div className="vc-controls-inner">
            <div className="vc-ctrl-group">
              <button className={"vc-ctrl-btn" + (!isVideoEnabled ? " vc-ctrl-danger" : "")} onClick={toggleVideo} title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}>
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button className={"vc-ctrl-btn" + (!isAudioEnabled ? " vc-ctrl-danger" : "")} onClick={toggleAudio} title={isAudioEnabled ? "Mute" : "Unmute"}>
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
            <div className="vc-ctrl-center">
              {isSearching && (
                <button className="vc-stop-btn" onClick={endChat}><X size={18} /><span>Stop</span></button>
              )}
              {isConnected && (
                <button className="vc-next-btn" onClick={nextPartner} data-testid="next-partner-button"><SkipForward size={18} /><span>Next</span></button>
              )}
            </div>
            <div className="vc-ctrl-group">
              {isConnected && (
                <>
                  <button className="vc-ctrl-btn vc-ctrl-warn" onClick={() => setShowReport(true)} title="Report" data-testid="report-button"><Flag size={20} /></button>
                  <button className="vc-ctrl-btn vc-ctrl-chat" onClick={() => setShowChat(s => !s)} title="Chat"><MessageSquare size={20} /></button>
                  <button className="vc-ctrl-btn vc-ctrl-danger" onClick={endChat} title="End Chat" data-testid="end-chat-button"><X size={20} /></button>
                </>
              )}
              {!isConnected && (
                <>
                  <button className="vc-ctrl-btn" onClick={() => setShowPrivacy(true)} title="Privacy"><Lock size={20}/></button>
                  <button className="vc-ctrl-btn" onClick={() => setShowHelp(true)} title="Help"><HelpCircle size={20}/></button>
                </>
              )}
            </div>
          </div>
        )}
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .videochat-root { display: flex; flex-direction: column; height: 100vh; background: #05050a; color: #e8e8ee; font-family: 'Inter',sans-serif; overflow: hidden; }

        .vc-toast { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); z-index: 100; display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; animation: toast-in 0.3s ease; backdrop-filter: blur(10px); }
        .vc-toast-success { background: rgba(20,80,40,0.85); border: 1px solid rgba(74,222,128,0.3); color: #86efac; }
        .vc-toast-warning { background: rgba(120,30,30,0.85); border: 1px solid rgba(248,113,113,0.3); color: #fca5a5; }
        @keyframes toast-in { from { opacity:0; transform:translateX(-50%) translateY(-10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

        .vc-modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); padding: 20px; }
        .vc-modal { background: linear-gradient(180deg, #120810, #0a050a); border: 1px solid rgba(138,20,50,0.4); border-radius: 18px; padding: 22px; width: 100%; max-width: 420px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .vc-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .vc-modal-head h3 { display: flex; align-items: center; gap: 8px; font-size: 18px; color: #c5304a; }
        .vc-modal-close { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #b0b0bb; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .vc-modal-body { display: flex; flex-direction: column; gap: 12px; }
        .vc-modal-body p { color: #9a9aaa; font-size: 14px; line-height: 1.5; }
        .vc-modal-body h4 { color: #e8e8ee; font-size: 14px; margin-top: 8px; }
        .vc-modal-body ul { padding-left: 18px; color: #9a9aaa; font-size: 13px; }
        .vc-modal-body li { margin-bottom: 4px; }
        .vc-modal-primary { margin-top: 10px; border: none; border-radius: 999px; background: linear-gradient(135deg, #991b3a, #4a0a1a); color: white; font-size: 15px; font-weight: 700; padding: 12px 24px; cursor: pointer; box-shadow: 0 6px 24px rgba(138,20,50,0.4); transition: all 0.2s; }
        .vc-modal-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(138,20,50,0.55); }
        .vc-modal-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .vc-gender-modal h3 { color: #c5304a; font-size: 22px; margin-bottom: 8px; }
        .vc-gender-section { margin-top: 16px; }
        .vc-gender-section label { display: block; color: #b0b0bb; font-size: 13px; margin-bottom: 8px; font-weight: 600; }
        .vc-gender-options { display: flex; gap: 10px; flex-wrap: wrap; }
        .vc-gender-btn { display: flex; align-items: center; gap: 6px; border: 1px solid rgba(138,20,50,0.3); background: rgba(15,10,18,0.6); color: #9a9aaa; font-size: 14px; padding: 10px 18px; border-radius: 999px; cursor: pointer; transition: all 0.2s; }
        .vc-gender-btn:hover { border-color: rgba(138,20,50,0.6); background: rgba(138,20,50,0.1); color: #ddd; }
        .vc-gender-btn.active { border-color: rgba(138,20,50,0.8); background: rgba(138,20,50,0.25); color: #fff; }

        .vc-nudity-overlay { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: rgba(80,10,20,0.85); backdrop-filter: blur(8px); color: #fca5a5; animation: nudity-pulse 1s ease infinite; }
        .vc-nudity-overlay h3 { font-size: 24px; color: #fff; }
        .vc-nudity-overlay p { font-size: 15px; }
        @keyframes nudity-pulse { 0%,100% { background: rgba(80,10,20,0.85); } 50% { background: rgba(120,20,30,0.9); } }

        .vc-email-link { display: inline-flex; align-items: center; gap: 8px; color: #c5304a; font-size: 14px; font-weight: 600; text-decoration: none; padding: 10px 14px; background: rgba(138,20,50,0.1); border-radius: 10px; border: 1px solid rgba(138,20,50,0.25); transition: all 0.2s; }
        .vc-email-link:hover { background: rgba(138,20,50,0.2); }
        .vc-help-section { margin-top: 8px; }
        .vc-privacy-contact { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .vc-privacy-contact a { color: #c5304a; text-decoration: none; }

        .vc-report-select { width: 100%; padding: 10px 12px; background: rgba(15,10,18,0.6); border: 1px solid rgba(138,20,50,0.3); border-radius: 10px; color: #e8e8ee; font-size: 14px; outline: none; }
        .vc-report-select option { background: #0a050a; }

        .vc-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; background: rgba(15,10,18,0.7); border-bottom: 1px solid rgba(138,20,50,0.25); backdrop-filter: blur(10px); flex-shrink: 0; z-index: 10; }
        .vc-header-left, .vc-header-right { display: flex; align-items: center; gap: 12px; }
        .vc-settings-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(138,20,50,0.3); background: rgba(15,10,18,0.5); color: #b0b0bb; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .vc-settings-btn:hover { border-color: rgba(138,20,50,0.6); background: rgba(138,20,50,0.15); }
        .vc-back-btn { display: flex; align-items: center; gap: 6px; background: rgba(15,10,18,0.6); border: 1px solid rgba(138,20,50,0.3); color: #e8e8ee; border-radius: 8px; padding: 7px 12px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .vc-back-btn:hover { background: rgba(138,20,50,0.15); border-color: rgba(138,20,50,0.5); }
        .vc-logo-small { display: flex; align-items: center; gap: 6px; color: #991b3a; }
        .vc-logo-text { display: flex; flex-direction: column; line-height: 1.05; }
        .vc-logo-text span { font-weight: 700; font-size: 15px; }
        .vc-logo-text small { font-size: 9px; font-weight: 500; color: #c5304a; letter-spacing: 0.06em; text-transform: uppercase; }
        .vc-online-count { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #8a8a96; }
        .vc-online-dot { width: 7px; height: 7px; border-radius: 50%; background: #c5304a; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .vc-status-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(15,10,18,0.6); border: 1px solid rgba(138,20,50,0.25); color: #8a8a96; }
        .vc-status-live { background: rgba(138,20,50,0.15); border-color: rgba(138,20,50,0.35); color: #c5304a; }
        .vc-status-searching, .vc-status-waiting { background: rgba(180,130,30,0.12); border-color: rgba(200,160,50,0.25); color: #d4a843; }
        .vc-status-ready { background: rgba(30,80,150,0.12); border-color: rgba(50,100,180,0.25); color: #6b8fc7; }
        .vc-status-connecting { background: rgba(80,180,200,0.12); border-color: rgba(100,200,220,0.25); color: #4db8d9; }

        .vc-main { flex: 1; position: relative; overflow: hidden; background: #05050a; }
        .vc-video-primary { width: 100%; height: 100%; position: relative; }
        .vc-video { width: 100%; height: 100%; object-fit: cover; display: block; background: #05050a; }

        .vc-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, #0d0a10 0%, #05050a 100%); }

        .vc-searching { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; }
        .vc-pulse-ring { position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 2px solid rgba(138,20,50,0.4); animation: expand-ring 2s ease-out infinite; }
        .vc-pulse-ring-2 { animation-delay: 0.6s; }
        .vc-pulse-ring-3 { animation-delay: 1.2s; }
        @keyframes expand-ring { 0%{transform:scale(0.5);opacity:1;} 100%{transform:scale(2.5);opacity:0;} }
        .vc-search-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(138,20,50,0.1); border: 1px solid rgba(138,20,50,0.3); display: flex; align-items: center; justify-content: center; color: #c5304a; position: relative; z-index: 2; }
        .vc-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .vc-search-text { color: #f0f0f5; font-size: 18px; font-weight: 600; z-index: 2; }
        .vc-search-sub { color: #6a6a7a; font-size: 13px; z-index: 2; }
        .vc-search-pref { color: #c5304a; font-size: 12px; z-index: 2; font-weight: 600; }

        .vc-idle-state { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .vc-idle-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(15,10,18,0.8); border: 1px solid rgba(138,20,50,0.15); display: flex; align-items: center; justify-content: center; color: #4a4a5a; }
        .vc-idle-text { color: #5a5a6a; font-size: 16px; font-weight: 500; }
        .vc-idle-sub { color: #4a4a5a; font-size: 13px; }
        .vc-enable-media-btn { margin-top: 10px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #991b3a, #4a0a1a); border: none; color: white; font-size: 14px; font-weight: 700; padding: 11px 20px; border-radius: 999px; cursor: pointer; box-shadow: 0 0 20px rgba(138,20,50,0.25); transition: all 0.2s; }
        .vc-enable-media-btn:hover { filter: brightness(1.1); }

        .vc-partner-label { position: absolute; bottom: 16px; left: 16px; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(138,20,50,0.25); padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; color: #e8e8ee; }
        .vc-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #c5304a; animation: pulse-dot 1.5s infinite; }
        .vc-partner-gender { color: #9a9aaa; font-size: 11px; }

        .vc-next-overlay-btn { position: absolute; top: 16px; right: 16px; display: flex; align-items: center; gap: 6px; background: rgba(15,10,18,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(138,20,50,0.3); color: #e8e8ee; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .vc-next-overlay-btn:hover { background: rgba(138,20,50,0.25); border-color: rgba(138,20,50,0.5); }

        .vc-chat-toggle { position: absolute; top: 16px; left: 16px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15,10,18,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(138,20,50,0.3); color: #b0b0bb; cursor: pointer; z-index: 5; transition: all 0.2s; }
        .vc-chat-toggle:hover { background: rgba(138,20,50,0.2); border-color: rgba(138,20,50,0.5); }
        .vc-chat-badge { position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: #c5304a; color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; }

        .vc-chat-panel { position: absolute; top: 64px; left: 16px; bottom: 80px; width: 280px; background: rgba(15,10,18,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(138,20,50,0.25); border-radius: 14px; display: flex; flex-direction: column; overflow: hidden; z-index: 5; }
        .vc-chat-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid rgba(138,20,50,0.2); font-size: 13px; font-weight: 600; color: #b0b0bb; }
        .vc-chat-head button { background: none; border: none; color: #8a8a96; cursor: pointer; }
        .vc-chat-messages { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
        .vc-chat-empty { color: #5a5a6a; font-size: 12px; text-align: center; margin-top: 20px; }
        .vc-chat-msg { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 10px; max-width: 90%; word-break: break-word; }
        .vc-chat-msg span { font-size: 13px; }
        .vc-chat-msg small { font-size: 10px; color: #6a6a7a; }
        .vc-chat-me { align-self: flex-end; background: rgba(138,20,50,0.25); border: 1px solid rgba(138,20,50,0.35); }
        .vc-chat-them { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
        .vc-chat-input-row { display: flex; gap: 8px; padding: 8px 10px; border-top: 1px solid rgba(138,20,50,0.2); }
        .vc-chat-input { flex: 1; border: 1px solid rgba(138,20,50,0.3); background: rgba(15,10,18,0.6); border-radius: 999px; padding: 8px 12px; color: #e8e8ee; font-size: 13px; outline: none; }
        .vc-chat-send { border: none; border-radius: 999px; background: linear-gradient(135deg, #991b3a, #4a0a1a); color: white; font-size: 12px; font-weight: 700; padding: 8px 14px; cursor: pointer; }

        .vc-video-pip { position: absolute; bottom: 80px; right: 16px; width: 180px; height: 120px; border-radius: 12px; overflow: hidden; border: 2px solid rgba(138,20,50,0.3); box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 5; background: #111; transition: transform 0.2s; }
        .vc-video-pip:hover { transform: scale(1.03); }
        .vc-pip-off { position: absolute; inset: 0; background: rgba(10,10,15,0.9); display: flex; align-items: center; justify-content: center; color: #475569; }
        .vc-pip-label { position: absolute; bottom: 6px; left: 8px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); text-shadow: 0 1px 3px rgba(0,0,0,0.8); }

        .vc-controls { flex-shrink: 0; background: rgba(10,10,15,0.95); border-top: 1px solid rgba(138,20,50,0.2); backdrop-filter: blur(20px); padding: 12px 20px; }
        .vc-controls-prompt { display: flex; align-items: center; justify-content: center; gap: 14px; max-width: 520px; margin: 0 auto; }
        .vc-mini-btn { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(138,20,50,0.3); background: rgba(15,10,18,0.5); color: #f4f4f5; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease; }
        .vc-mini-btn:hover { transform: translateY(-1px); background: rgba(138,20,50,0.15); }
        .vc-start-pill-btn { border: none; border-radius: 999px; min-width: 170px; height: 44px; padding: 0 24px; background: linear-gradient(135deg, #991b3a, #4a0a1a); color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: 0.01em; box-shadow: 0 10px 28px rgba(138,20,50,0.35); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .vc-start-pill-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(138,20,50,0.48); }
        .vc-controls-inner { display: flex; align-items: center; justify-content: space-between; max-width: 700px; margin: 0 auto; gap: 12px; }
        .vc-ctrl-group { display: flex; gap: 10px; align-items: center; }
        .vc-ctrl-btn { width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(15,10,18,0.5); border: 1px solid rgba(138,20,50,0.3); color: white; cursor: pointer; transition: all 0.2s; }
        .vc-ctrl-btn:hover { background: rgba(138,20,50,0.2); border-color: rgba(138,20,50,0.5); transform: scale(1.08); }
        .vc-ctrl-danger { background: rgba(120,20,30,0.3); border-color: rgba(180,40,50,0.4); color: #f87171; }
        .vc-ctrl-danger:hover { background: rgba(180,40,50,0.35); }
        .vc-ctrl-warn { background: rgba(180,130,30,0.15); border-color: rgba(200,160,50,0.3); color: #fbbf24; }
        .vc-ctrl-warn:hover { background: rgba(200,160,50,0.25); }
        .vc-ctrl-chat { background: rgba(50,80,150,0.15); border-color: rgba(80,120,200,0.3); color: #6b8fc7; }
        .vc-ctrl-chat:hover { background: rgba(80,120,200,0.25); }
        .vc-ctrl-center { display: flex; gap: 10px; }

        .vc-next-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #991b3a, #4a0a1a); border: none; color: white; font-size: 16px; font-weight: 700; padding: 14px 40px; border-radius: 50px; cursor: pointer; box-shadow: 0 0 20px rgba(138,20,50,0.3); transition: all 0.2s; }
        .vc-next-btn:hover { transform: translateY(-2px); box-shadow: 0 0 32px rgba(138,20,50,0.5); }

        .vc-stop-btn { display: flex; align-items: center; gap: 8px; background: rgba(120,20,30,0.3); border: 1px solid rgba(180,40,50,0.4); color: #f87171; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 50px; cursor: pointer; transition: all 0.2s; }
        .vc-stop-btn:hover { background: rgba(180,40,50,0.35); }

        @media (max-width: 600px) {
          .vc-video-pip { width: 110px; height: 75px; bottom: 76px; right: 10px; }
          .vc-logo-text span { display: none; }
          .vc-nickname-tag { display: none; }
          .vc-start-pill-btn { min-width: 140px; height: 40px; font-size: 16px; }
          .vc-chat-panel { width: 220px; top: 56px; left: 8px; bottom: 76px; }
          .vc-next-btn, .vc-stop-btn { padding: 12px 28px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
};

export default VideoChat;
