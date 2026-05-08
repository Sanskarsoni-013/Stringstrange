import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, SkipForward, X, Flag, Home, Users, Loader2, Wifi, WifiOff, Settings, Lock, HelpCircle, Mail, User, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import ConstantinELogo from './ui/Logo';

// Backend URL - check env first, then auto-detect
const getBackendUrl = () => {
  // Use env variable if set (for production/Vercel deployment)
  if (process.env.REACT_APP_BACKEND_URL) {
    console.log('Using env BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    return process.env.REACT_APP_BACKEND_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';

  // ALWAYS use localhost:8001 for local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = `${protocol}//localhost:8001`;
    console.log('Using localhost backend:', url);
    return url;
  }

  // For local network access (192.168.x.x, etc.)
  const url = `${protocol}//${hostname}:8001`;
  console.log('Using network backend:', url);
  return url;
};
const BACKEND_URL = getBackendUrl();
const SUPPORT_EMAIL = 'sanskar05soni@gmail.com';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  // Public TURN servers for NAT traversal across different networks
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
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
  const [showGenderSetup, setShowGenderSetup] = useState(true); // Always show first
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [nudityAlert, setNudityAlert] = useState(false);
  const [toast, setToast] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true); // Show chat by default when connected

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
  const justEndedChatRef = useRef(false);

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
      setConnectionStatus('connecting');
      
      const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
      const fullUrl = `${wsUrl}/ws/${userId}`;
      
      console.log('🔌 Connecting to WebSocket:', fullUrl);
      console.log('📍 Hostname:', window.location.hostname);
      console.log('🔒 Protocol:', window.location.protocol);
      
      const ws = new WebSocket(fullUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected!');
        wsRef.current = ws;
        setWsReady(true);
        setIsWsConnecting(false);
        isWsConnectingRef.current = false;
        setConnectionStatus('ready');
        
        // Send gender info
        ws.send(JSON.stringify({ type: 'set_gender', gender, genderPref }));
        
        // Send pending find_match if waiting
        if (pendingFindMatchRef.current) {
          pendingFindMatchRef.current = false;
          setConnectionStatus('searching');
          ws.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
        }
      };
      
      ws.onmessage = async (event) => { 
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received:', data.type);
          await handleWebSocketMessage(data); 
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        wsRef.current = null;
        setWsReady(false);
        setIsWsConnecting(false);
        isWsConnectingRef.current = false;
        
        if (shouldReconnectRef.current) {
          setConnectionStatus('reconnecting');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting reconnection...');
            connectWebSocket();
          }, 2000);
        } else { 
          setConnectionStatus('idle'); 
        }
      };
      
      ws.onerror = (error) => {
        console.error('⚠️ WebSocket error:', error);
        console.log('Backend URL was:', BACKEND_URL);
        // Don't change status here - let onclose handle it
      };
      
    } catch (e) {
      console.error('💥 WebSocket exception:', e);
      setIsWsConnecting(false);
      isWsConnectingRef.current = false;
      setConnectionStatus('error');
    }
  };

  const handleWebSocketMessage = async (message) => {
    switch (message.type) {
      case 'match_found':
        setPartnerNickname(message.partner_nickname || `Stranger`);
        setPartnerGender(message.partner_gender || '');
        setConnectionStatus('matched');
        setMessages([{
          from: 'system', 
          text: `You're now chatting with a ${message.partner_gender || 'stranger'}. Say hi!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setShowChat(true);
        await createPeerConnection();
        if (message.initiator) await createOffer();
        break;
      case 'waiting_for_match': setConnectionStatus('waiting'); break;
      case 'offer': await handleOffer(message.offer); break;
      case 'answer': await handleAnswer(message.answer); break;
      case 'ice_candidate': await handleIceCandidate(message.candidate); break;
      case 'peer_disconnected': handlePeerDisconnected(); break;
      case 'chat_ended':
        if (justEndedChatRef.current) {
          justEndedChatRef.current = false; // We initiated, just go to ready
          setIsConnected(false);
          setPartnerNickname('');
          setPartnerGender('');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
          setConnectionStatus('ready');
        } else {
          handleChatEnded(); // Other user ended, auto-search
        }
        break;
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
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') handlePeerDisconnected();
    };
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Attempt ICE restart if connection fails
        if (pc.connectionState !== 'closed') {
          console.log('ICE failed, attempting restart...');
        }
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', pc.iceGatheringState);
    };
    peerConnectionRef.current = pc;
  };

  const createOffer = async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Wait for ICE gathering to complete before sending offer
      await new Promise((resolve) => {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            const handler = () => {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', handler);
                resolve();
              }
            };
            pc.addEventListener('icegatheringstatechange', handler);
            // Fallback timeout in case gathering stalls
            setTimeout(resolve, 3000);
          }
        };
        checkState();
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
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

  const handlePeerDisconnected = (shouldAutoSearch = true) => {
    setIsConnected(false);
    setPartnerNickname('');
    setPartnerGender('');
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    // Automatically find next match only for the other user (not the one who clicked End)
    if (shouldAutoSearch) {
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('🔄 Auto-searching after peer disconnect...');
          setConnectionStatus('searching');
          setMessages([]);
          wsRef.current.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
        }
      }, 500);
    }
  };

  const handleChatEnded = () => { handlePeerDisconnected(true); };

  const findMatch = () => {
    // Ensure media is ready
    if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
      console.log('Initializing media first...');
      initializeMedia().then((ok) => { 
        if (ok) findMatch(); 
      });
      return;
    }
    
    const ws = wsRef.current;
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('🔍 Finding match...');
      setConnectionStatus('searching');
      setMessages([]);
      ws.send(JSON.stringify({ type: 'find_match', gender, genderPref }));
    } else {
      console.log('WebSocket not ready, connecting first...');
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
    justEndedChatRef.current = true; // Mark that WE initiated the end
    if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'end_chat' }));
    handlePeerDisconnected(false); // Don't auto-search, user chose to end
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
    if (!g) {
      setToast({ type: 'warning', text: 'Please select your gender' });
      return;
    }
    setGender(g);
    setGenderPref(pref);
    localStorage.setItem('ss_gender', g);
    localStorage.setItem('ss_genderPref', pref);
    setShowGenderSetup(false);
    setToast({ type: 'success', text: 'Preferences saved!' });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_gender', gender: g, genderPref: pref }));
    }
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

      {/* OMETV STYLE LAYOUT */}
      <main className="ometv-main">
        <div className="ometv-video-grid">
          {/* STRANGER VIDEO (LEFT) */}
          <div className="ometv-video-box stranger-box">
            <video ref={remoteVideoRef} autoPlay playsInline className="ometv-video" />
            <div className="ometv-tag stranger-tag">Stranger</div>
            
            {/* IDLE/SEARCHING OVERLAY */}
            {!isConnected && (
              <div className="ometv-overlay-screen">
                {!isSearching ? (
                  <button className="ometv-big-start-btn" onClick={startSearching}>
                    <Play size={48} fill="currentColor" />
                    <span>START</span>
                  </button>
                ) : (
                  <div className="ometv-searching-status">
                    <div className="ometv-spinner-large" />
                    <p>Looking for a stranger...</p>
                    <button className="ometv-cancel-btn" onClick={endChat}>Stop Search</button>
                  </div>
                )}
              </div>
            )}

            {/* CHAT INTERFACE (BOTTOM LEFT) */}
            {(isConnected || isSearching) && (
              <div className="ometv-chat-container">
                <div className="ometv-messages-list" id="chat-messages-container">
                  {messages.map((m, i) => (
                    <div key={i} className={"ometv-message-line " + (m.from === "me" ? "is-me" : "is-them")}>
                      <span className="ometv-sender">{m.from === 'me' ? 'You:' : 'Stranger:'}</span>
                      <span className="ometv-text">{m.text}</span>
                    </div>
                  ))}
                  {messages.length === 0 && isConnected && (
                    <div className="ometv-system-tip">You are now chatting with a stranger. Say hi!</div>
                  )}
                </div>
                <div className="ometv-input-area">
                  <input 
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Type message..."
                    className="ometv-chat-input"
                    disabled={!isConnected}
                  />
                  <button className="ometv-chat-send-btn" onClick={sendMessage} disabled={!isConnected || !chatInput.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* YOUR VIDEO (RIGHT) */}
          <div className="ometv-video-box local-box">
            <video ref={localVideoRef} autoPlay muted playsInline className="ometv-video" />
            {!isVideoEnabled && (
              <div className="ometv-camera-off">
                <VideoOff size={64} strokeWidth={1} />
                <p>Camera is Off</p>
              </div>
            )}
            <div className="ometv-tag local-tag">You</div>
          </div>
        </div>

        {/* OMETV CONTROL BAR */}
        <div className="ometv-footer-bar">
          <div className="ometv-footer-left">
            <button className="ometv-action-btn stop-btn" onClick={endChat} disabled={!isSearching && !isConnected}>
              <div className="ometv-icon-circle"><X size={20} /></div>
              <span>STOP</span>
            </button>
          </div>
          
          <div className="ometv-footer-mid">
            <button className={"ometv-toggle-btn " + (!isVideoEnabled ? "is-off" : "")} onClick={toggleVideo}>
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button className={"ometv-toggle-btn " + (!isAudioEnabled ? "is-off" : "")} onClick={toggleAudio}>
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          </div>

          <div className="ometv-footer-right">
            <button className="ometv-action-btn next-btn" onClick={nextPartner} disabled={!isConnected && !isSearching}>
              <span>NEXT</span>
              <div className="ometv-icon-circle"><SkipForward size={20} /></div>
            </button>
          </div>
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

        .ometv-main { flex: 1; display: flex; flex-direction: column; background: #fff; font-family: "Century Schoolbook", serif; position: relative; }
        .ometv-video-grid { flex: 1; display: flex; background: #000; overflow: hidden; position: relative; }
        
        .ometv-video-box { position: relative; flex: 1; background: #050505; border: 1px solid #111; overflow: hidden; }
        .ometv-video { width: 100%; height: 100%; object-fit: cover; }
        
        .ometv-tag { position: absolute; top: 15px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; z-index: 10; }
        .stranger-tag { left: 15px; }
        .local-tag { right: 15px; }

        .ometv-overlay-screen { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
        .ometv-big-start-btn { width: 160px; height: 160px; border-radius: 50%; border: none; background: #22c55e; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; box-shadow: 0 0 40px rgba(34, 197, 94, 0.4); transition: all 0.2s; }
        .ometv-big-start-btn span { font-size: 20px; font-weight: 900; letter-spacing: 0.1em; }
        .ometv-big-start-btn:hover { transform: scale(1.05); filter: brightness(1.1); }

        .ometv-searching-status { text-align: center; color: #fff; }
        .ometv-spinner-large { width: 60px; height: 60px; border: 6px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }
        .ometv-cancel-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 20px; border-radius: 20px; cursor: pointer; margin-top: 15px; }

        .ometv-chat-container { position: absolute; bottom: 20px; left: 20px; width: 320px; max-height: 40%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden; z-index: 30; }
        .ometv-messages-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .ometv-message-line { font-size: 13px; line-height: 1.4; word-break: break-word; }
        .ometv-sender { font-weight: 800; margin-right: 6px; }
        .is-me .ometv-sender { color: #3b82f6; }
        .is-them .ometv-sender { color: #facc15; }
        .ometv-text { color: #fff; }
        .ometv-system-tip { font-size: 11px; color: #aaa; text-align: center; font-style: italic; margin-top: 5px; }

        .ometv-input-area { display: flex; padding: 8px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1); }
        .ometv-chat-input { flex: 1; background: transparent; border: none; color: #fff; font-size: 13px; padding: 4px 10px; outline: none; }
        .ometv-chat-send-btn { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px; }

        .ometv-camera-off { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0a0a0a; color: #333; gap: 10px; }

        .ometv-footer-bar { height: 90px; background: #fff; border-top: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
        .ometv-action-btn { border: none; background: none; display: flex; align-items: center; gap: 12px; cursor: pointer; font-weight: 900; font-size: 16px; letter-spacing: 0.05em; transition: all 0.2s; }
        .ometv-icon-circle { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; }
        
        .stop-btn { color: #ef4444; }
        .stop-btn .ometv-icon-circle { background: #ef4444; }
        .next-btn { color: #3b82f6; }
        .next-btn .ometv-icon-circle { background: #3b82f6; }
        
        .ometv-action-btn:disabled { opacity: 0.2; cursor: not-allowed; transform: none !important; }
        .ometv-action-btn:hover:not(:disabled) { transform: scale(1.05); }

        .ometv-footer-mid { display: flex; gap: 15px; }
        .ometv-toggle-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #ddd; background: #f5f5f5; color: #333; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .ometv-toggle-btn.is-off { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
        .ometv-toggle-btn:hover { background: #eee; }

        @media (max-width: 900px) {
          .ometv-video-grid { flex-direction: column; }
          .ometv-video-box { width: 100%; height: 50%; }
          .ometv-footer-bar { padding: 0 15px; height: 80px; }
          .ometv-action-btn span { display: none; }
          .ometv-chat-container { width: calc(100% - 40px); bottom: 10px; left: 20px; }
        }

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
