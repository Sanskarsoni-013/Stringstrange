import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, SkipForward, X, Flag, Home, Users, Loader2, Wifi, WifiOff, Settings, Lock, HelpCircle, Mail, User, AlertTriangle, CheckCircle, MessageSquare, Grid, Folder, Play, Send } from 'lucide-react';
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
    <div className="otv-container">
      {/* HEADER */}
      <header className="otv-header">
        <div className="otv-header-left">
          <button className="otv-header-icon-btn"><Grid size={18} /></button>
          <div className="otv-header-tab">
            <span className="otv-header-tab-text">OmeTV Video Chat — Omegle: Ra...</span>
            <div className="otv-header-tab-close"><X size={12} /></div>
          </div>
        </div>
        <div className="otv-header-right">
          <div className="otv-header-folder"><Folder size={16} /> All Bookmarks</div>
        </div>
      </header>

      {/* URL BAR (BROWSER STYLE) */}
      <div className="otv-browser-bar">
        <div className="otv-browser-controls">
          <Home size={16} />
          <div className="otv-url-field">https://ome.tv/#app</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="otv-main">
        <div className="otv-video-grid">
          {/* LEFT PANEL: STRANGER OR LOGO */}
          <div className="otv-panel otv-panel-left">
            {isConnected ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="otv-video" />
            ) : (
              <div className="otv-placeholder">
                <div className="otv-logo-section">
                  <div className="otv-logo-tv">
                    <span className="otv-logo-text">Ome</span>
                    <span className="otv-logo-subtext">TV</span>
                  </div>
                  <div className="otv-online-count">
                    <span className="otv-online-dot" />
                    {stats.activeUsers ? stats.activeUsers.toLocaleString() : "280,268"} users online
                  </div>
                </div>
                <div className="otv-app-buttons">
                  <div className="otv-app-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" height="40" />
                  </div>
                  <div className="otv-app-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" height="40" />
                  </div>
                </div>
              </div>
            )}
            {isConnected && <div className="otv-video-tag">Stranger</div>}
          </div>

          {/* RIGHT PANEL: LOCAL VIDEO */}
          <div className="otv-panel otv-panel-right">
            <video ref={localVideoRef} autoPlay muted playsInline className="otv-video" />
            {!isVideoEnabled && <div className="otv-camera-off">Camera is off</div>}
            <div className="otv-video-tag">You</div>
          </div>
        </div>

        {/* BOTTOM CONTROL BAR */}
        <div className="otv-bottom-bar">
          {/* LEFT: CONTROLS */}
          <div className="otv-controls-side">
            <div className="otv-main-buttons">
              <button 
                className={"otv-action-btn start-btn " + (isSearching ? "searching" : "")} 
                onClick={isConnected ? nextPartner : findMatch}
              >
                {isConnected ? "Next" : "Start"}
              </button>
              <button 
                className="otv-action-btn stop-btn" 
                onClick={endChat}
                disabled={!isSearching && !isConnected}
              >
                Stop
              </button>
              <button className="otv-select-btn" onClick={() => setShowGenderSetup(true)}>
                <span className="otv-select-label">Country</span>
                <span className="otv-select-val">🇮🇳</span>
              </button>
              <button className="otv-select-btn" onClick={() => setShowGenderSetup(true)}>
                <span className="otv-select-label">I am</span>
                <span className="otv-select-val">👦</span>
              </button>
            </div>
          </div>

          {/* RIGHT: CHAT area */}
          <div className="otv-chat-side">
            <div className="otv-chat-container">
              {!isConnected && !isSearching && (
                <div className="otv-rules-box">
                  <div className="otv-rules-content">
                    <div className="otv-rules-icon">Ome TV</div>
                    <p>
                      By pressing "Start", you agree to our <u>rules</u>. Rule violators will be banned. Please keep your face visible in the camera frame.
                    </p>
                  </div>
                  <div className="otv-safety-link">
                    <AlertTriangle size={14} color="#f97316" />
                    <span>Safety Reminder</span>
                  </div>
                </div>
              )}
              
              <div className="otv-chat-history" id="chat-messages-container">
                {messages.map((m, i) => (
                  <div key={i} className={"otv-chat-msg " + (m.from === "me" ? "is-me" : "is-them")}>
                    <span className="otv-msg-sender">{m.from === 'me' ? 'You:' : 'Stranger:'}</span>
                    <span className="otv-msg-text">{m.text}</span>
                  </div>
                ))}
              </div>

              <div className="otv-chat-input-wrapper">
                <input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Write a message"
                  className="otv-chat-input"
                />
                <div className="otv-chat-emoji">😊</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* GENDER SETUP MODAL (reusing for preferences) */}
      {showGenderSetup && (
        <div className="vc-modal-overlay">
          <div className="vc-modal vc-gender-modal">
            <h3>Match Preferences</h3>
            <div className="vc-gender-section">
              <label>I am:</label>
              <div className="vc-gender-options">
                <button className={"vc-gender-btn" + (gender === "male" ? " active" : "")} onClick={() => setGender("male")}>Male</button>
                <button className={"vc-gender-btn" + (gender === "female" ? " active" : "")} onClick={() => setGender("female")}>Female</button>
              </div>
            </div>
            <div className="vc-gender-section">
              <label>Match with:</label>
              <div className="vc-gender-options">
                <button className={"vc-gender-btn" + (genderPref === "any" ? " active" : "")} onClick={() => setGenderPref("any")}>Anyone</button>
                <button className={"vc-gender-btn" + (genderPref === "male" ? " active" : "")} onClick={() => setGenderPref("male")}>Male</button>
                <button className={"vc-gender-btn" + (genderPref === "female" ? " active" : "")} onClick={() => setGenderPref("female")}>Female</button>
              </div>
            </div>
            <button className="vc-modal-primary" onClick={() => saveGender(gender, genderPref)}>Save & Close</button>
          </div>
        </div>
      )}

      {/* Styles are applied in index.css or via <style> tag if preferred */}
      <style>{`
        .otv-container { height: 100vh; display: flex; flex-direction: column; background: #332b2b; color: #fff; overflow: hidden; }
        .otv-header { height: 36px; background: #221a1a; display: flex; justify-content: space-between; align-items: center; padding: 0 10px; font-size: 12px; }
        .otv-header-left { display: flex; align-items: center; gap: 10px; height: 100%; }
        .otv-header-tab { background: #332b2b; height: 30px; margin-top: 6px; border-radius: 8px 8px 0 0; padding: 0 12px; display: flex; align-items: center; gap: 8px; font-size: 11px; }
        .otv-header-right { color: #888; display: flex; align-items: center; gap: 6px; }

        .otv-browser-bar { height: 40px; background: #332b2b; display: flex; align-items: center; padding: 0 15px; border-bottom: 1px solid #222; }
        .otv-browser-controls { display: flex; align-items: center; gap: 15px; width: 100%; }
        .otv-url-field { flex: 1; background: #221a1a; border-radius: 20px; padding: 6px 15px; font-size: 12px; color: #aaa; }

        .otv-main { flex: 1; display: flex; flex-direction: column; }
        .otv-video-grid { flex: 1; display: flex; gap: 4px; padding: 4px; background: #111; }
        .otv-panel { flex: 1; background: #000; position: relative; display: flex; align-items: center; justify-content: center; }
        .otv-video { width: 100%; height: 100%; object-fit: cover; }
        .otv-video-tag { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); padding: 2px 10px; border-radius: 4px; font-size: 12px; }

        .otv-placeholder { width: 100%; height: 100%; background: #2c2c2c; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .otv-logo-tv { background: #ff5722; width: 160px; height: 120px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        .otv-logo-text { font-size: 48px; font-weight: 900; color: #fff; }
        .otv-logo-subtext { font-size: 24px; font-weight: 900; color: #2e7d32; background: #fff; padding: 0 8px; border-radius: 4px; margin-top: 4px; }
        .otv-online-count { margin-top: 20px; display: flex; align-items: center; gap: 8px; font-size: 14px; }
        .otv-online-dot { width: 8px; height: 8px; background: #4caf50; border-radius: 50%; }
        .otv-app-buttons { margin-top: 30px; display: flex; gap: 15px; }

        .otv-bottom-bar { height: 180px; background: #fff; color: #333; display: flex; }
        .otv-controls-side { width: 45%; padding: 15px; }
        .otv-main-buttons { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; height: 100%; }
        .otv-action-btn, .otv-select-btn { border: none; border-radius: 12px; font-size: 22px; font-weight: 700; cursor: pointer; transition: transform 0.1s; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .otv-action-btn:active { transform: scale(0.98); }
        .start-btn { background: #66bb6a; color: #fff; }
        .stop-btn { background: #ffab91; color: #fff; }
        .otv-select-btn { background: #f5f5f5; border: 1px solid #eee; }
        .otv-select-label { font-size: 14px; color: #888; font-weight: 400; }
        .otv-select-val { font-size: 20px; }

        .otv-chat-side { flex: 1; padding: 0 5px 5px 0; }
        .otv-chat-container { height: 100%; background: #fff; border-left: 1px solid #eee; display: flex; flex-direction: column; }
        .otv-rules-box { padding: 12px; border-bottom: 1px solid #f5f5f5; }
        .otv-rules-content { display: flex; gap: 10px; align-items: flex-start; }
        .otv-rules-icon { background: #ff5722; color: #fff; padding: 2px 4px; border-radius: 4px; font-size: 10px; font-weight: 900; }
        .otv-rules-content p { font-size: 12px; line-height: 1.4; color: #666; margin: 0; }
        .otv-safety-link { display: flex; align-items: center; gap: 5px; margin-top: 6px; font-size: 11px; font-weight: 600; color: #f97316; }

        .otv-chat-history { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
        .otv-chat-msg { font-size: 13px; }
        .otv-msg-sender { font-weight: 800; margin-right: 5px; }
        .is-me .otv-msg-sender { color: #3b82f6; }
        .is-them .otv-msg-sender { color: #d97706; }

        .otv-chat-input-wrapper { height: 44px; border-top: 1px solid #eee; display: flex; align-items: center; padding: 0 15px; }
        .otv-chat-input { flex: 1; border: none; outline: none; font-size: 14px; color: #333; }
        .otv-chat-emoji { font-size: 18px; color: #ccc; cursor: pointer; }

        @media (max-width: 800px) {
          .otv-bottom-bar { height: auto; flex-direction: column; }
          .otv-controls-side, .otv-chat-side { width: 100%; }
          .otv-controls-side { height: 160px; }
          .otv-chat-side { height: 250px; }
        }

        /* Reusing some existing modal styles */
        .vc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .vc-modal { background: #fff; color: #333; padding: 24px; border-radius: 16px; width: 320px; }
        .vc-gender-section { margin: 15px 0; }
        .vc-gender-options { display: flex; gap: 10px; margin-top: 8px; }
        .vc-gender-btn { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; cursor: pointer; }
        .vc-gender-btn.active { background: #ff5722; color: #fff; border-color: #ff5722; }
        .vc-modal-primary { width: 100%; padding: 12px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 700; margin-top: 10px; cursor: pointer; }
      `}</style>
    </div>
  );
};

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

        .otv-container { height: 100vh; display: flex; flex-direction: column; background: #f4f4f4; color: #333; font-family: "Inter", sans-serif; }
        
        .otv-header { height: 40px; background: #332b2b; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; color: #aaa; border-bottom: 1px solid #222; }
        .otv-header-icon { color: #fff; cursor: pointer; }
        .otv-header-right { font-size: 11px; display: flex; align-items: center; gap: 5px; }

        .otv-main { flex: 1; display: flex; flex-direction: column; background: #332b2b; }
        .otv-video-grid { flex: 1; display: flex; gap: 4px; padding: 4px; background: #222; }
        .otv-panel { flex: 1; background: #000; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .otv-video { width: 100%; height: 100%; object-fit: cover; }

        .otv-placeholder { width: 100%; height: 100%; background: #222 url('https://www.transparenttextures.com/patterns/dark-matter.png'); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
        .otv-logo-section { text-align: center; margin-bottom: 40px; }
        .otv-logo-tv { background: #ff5722; width: 150px; height: 110px; border-radius: 20px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }
        .otv-logo-tv::before, .otv-logo-tv::after { content: ''; position: absolute; top: -20px; width: 4px; height: 30px; background: #ff5722; border-radius: 2px; transform: rotate(-20deg); }
        .otv-logo-tv::after { left: auto; right: 40px; transform: rotate(20deg); }
        .otv-logo-text { color: #fff; font-size: 42px; font-weight: 900; line-height: 1; }
        .otv-logo-subtext { color: #2e7d32; font-size: 24px; font-weight: 900; background: #fff; padding: 2px 8px; border-radius: 4px; margin-top: 4px; }
        
        .otv-online-count { margin-top: 15px; color: #fff; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .otv-online-dot { width: 10px; height: 10px; border-radius: 50%; background: #4caf50; }

        .otv-app-buttons { display: flex; gap: 15px; }
        .otv-app-btn { background: #000; border: 1px solid #444; border-radius: 10px; padding: 8px 15px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .otv-btn-icon { font-size: 24px; color: #fff; }
        .otv-btn-txt { color: #fff; font-size: 10px; line-height: 1.2; text-align: left; }
        .otv-btn-txt span { display: block; font-size: 16px; font-weight: 700; }

        .otv-bottom-bar { height: 240px; background: #f0f0f0; display: flex; border-top: 1px solid #ccc; }
        .otv-buttons-section { width: 50%; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; }
        .otv-action-btn, .otv-select-btn { border: none; border-radius: 12px; font-size: 24px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 0 rgba(0,0,0,0.1); transition: all 0.1s; }
        .otv-action-btn:active { transform: translateY(4px); box-shadow: none; }
        
        .start-btn { background: linear-gradient(to bottom, #66bb6a, #43a047); color: #fff; }
        .stop-btn { background: linear-gradient(to bottom, #ef9a9a, #e57373); color: #fff; }
        .otv-select-btn { background: #fff; color: #555; border: 1px solid #ddd; }

        .otv-chat-section { width: 50%; padding: 0 4px 4px 0; }
        .otv-chat-box { height: 100%; background: #fff; border-left: 1px solid #ddd; display: flex; flex-direction: column; }
        
        .otv-system-box { padding: 15px; border-bottom: 1px solid #eee; }
        .otv-sys-header { display: flex; gap: 12px; align-items: flex-start; }
        .otv-sys-icon { background: #ff5722; padding: 2px 5px; border-radius: 4px; color: #fff; font-size: 10px; font-weight: 900; }
        .otv-sys-header p { font-size: 13px; color: #444; line-height: 1.4; }
        .otv-sys-safety { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: #f97316; font-size: 12px; font-weight: 600; }

        .otv-messages-scroll { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 5px; }
        .otv-msg { font-size: 13px; }
        .otv-msg-sender { font-weight: 800; margin-right: 5px; }
        .is-me .otv-msg-sender { color: #3b82f6; }
        .is-them .otv-msg-sender { color: #d97706; }

        .otv-input-wrapper { height: 50px; border-top: 1px solid #eee; display: flex; align-items: center; padding: 0 15px; }
        .otv-chat-input { flex: 1; border: none; outline: none; font-size: 14px; color: #333; }
        .otv-emoji-btn { font-size: 20px; cursor: pointer; color: #aaa; }

        .otv-camera-off { color: #fff; font-size: 14px; }

        @media (max-width: 900px) {
          .otv-video-grid { flex-direction: column; }
          .otv-bottom-bar { flex-direction: column; height: auto; }
          .otv-buttons-section { width: 100%; height: 200px; }
          .otv-chat-section { width: 100%; height: 300px; }
        }

      `}</style>
    </div>
  );
};

export default VideoChat;
