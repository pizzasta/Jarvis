'use strict';

/* ═══════════════════════════════════════════════════════════
   ECOSPHERE v3 — Voice Reaction System
   Living density: presence, echoes, whispers, room freq,
   capsule countdowns, carrier pulse interactions.
═══════════════════════════════════════════════════════════ */

const EcosphereVR = (() => {

  // ─── CONSTANTS ────────────────────────────────────────────
  const SK_SIGNALS   = 'eco_signals';
  const SK_REACTIONS = 'eco_reactions';
  const SK_UNSENT    = 'eco_unsent';
  const SK_SEEN      = 'eco_onboard_seen';
  const MAX_REC_MS   = 5000;
  const CLR_PINK     = '#ff2d78';
  const CLR_PINK_DIM = 'rgba(255,45,120,0.45)';
  const CLR_CYAN     = '#00e5ff';
  const CLR_VIOLET   = '#9d4edd';

  const GHOST_NAMES = [
    'driftmemory', 'signal_veil', 'anonymous_fade', 'static_echo',
    'hollow_frequency', 'void_tender', 'ambient_ghost', 'soft_carrier',
    'echo_trace', 'null_listener', 'wave_memory', 'lost_pulse',
    'carrier_88', 'deep_static', 'frequency_ghost',
  ];

  const ROOM_DESCS = [
    'gently blooming',
    'deepening — someone lingered',
    'someone\'s breath just caught',
    'shifting inward · quieter now',
    'still — the frequency is holding',
    'resonating outward · new carriers joining',
    'fading at the edges',
    'something passed through recently',
    'a new voice entered',
    'blooming deeper',
  ];

  const PULSE_WORDS = ['felt', 'same', 'still', 'here', '…'];

  // ─── CARRIER STATUS LEGEND ────────────────────────────────
  const CARRIER_STATUS = {
    pulse:      { label: 'pulse',      desc: 'Actively listening right now',         dot: 'pulse' },
    echo:       { label: 'echo',       desc: 'Replaying — has listened 2+ times',    dot: 'echo' },
    lost:       { label: 'lost',       desc: 'Signal dropped, no longer connected',  dot: 'lost' },
    soft_focus: { label: 'soft_focus', desc: 'Background listener — aware but idle', dot: 'soft_focus' },
  };

  // ─── DEMO SIGNALS ─────────────────────────────────────────
  const DEMO_SIGNALS = [
    {
      id: 'sig-1', title: 'Signal 001',
      content: 'something about this moment that doesn\'t translate to words',
      ts: Date.now() - 86400000 * 2,
      resonance: { score: 87, trend: 'up',   context: 'High reach · 14 carriers active' },
      carriers: [
        { id:'c1', name:'Listener', status:'pulse' },
        { id:'c2', name:'Echo',     status:'echo' },
        { id:'c3', name:'Ghost',    status:'lost' },
      ],
      echoes: [
        { id:'e1-1', text:'same.',                       author:'signal_veil',    ts: Date.now() - 3600000 },
        { id:'e1-2', text:'still here',                  author:'anonymous_fade', ts: Date.now() - 5400000 },
        { id:'e1-3', text:'this one stayed with me',     author:'driftmemory',    ts: Date.now() - 7200000 },
        { id:'e1-4', text:'felt it twice',               author:'echo_trace',     ts: Date.now() - 9000000 },
      ],
    },
    {
      id: 'sig-2', title: 'Signal 002',
      content: 'the city breathes differently at 3am',
      ts: Date.now() - 86400000,
      resonance: { score: 79, trend: 'flat', context: 'Stable · 9 carriers passive' },
      carriers: [
        { id:'c4', name:'Listener', status:'soft_focus' },
        { id:'c5', name:'Echo',     status:'echo' },
      ],
      echoes: [
        { id:'e2-1', text:'I was there once',            author:'echo_trace',     ts: Date.now() - 10800000 },
        { id:'e2-2', text:'the air is different',        author:'null_listener',  ts: Date.now() - 18000000 },
      ],
    },
    {
      id: 'sig-3', title: 'Signal 003',
      content: 'patterns that feel too familiar to be coincidence',
      ts: Date.now() - 10800000,
      resonance: { score: 67, trend: 'down', context: 'Fading · signal weakening' },
      carriers: [
        { id:'c6', name:'Listener', status:'pulse' },
        { id:'c7', name:'Ghost',    status:'lost' },
        { id:'c8', name:'Echo',     status:'echo' },
        { id:'c9', name:'Silent',   status:'soft_focus' },
      ],
      echoes: [
        { id:'e3-1', text:'you noticed too',             author:'static_echo',    ts: Date.now() - 900000 },
      ],
    },
    {
      id: 'sig-4', title: 'Signal 004',
      content: 'a frequency nobody asked about but everybody hears',
      ts: Date.now() - 2700000,
      resonance: { score: 54, trend: 'up', context: 'Rising · new carriers joining' },
      carriers: [
        { id:'c10', name:'Listener', status:'pulse' },
      ],
      echoes: [],
    },
    {
      id: 'sig-5', title: 'Signal 005',
      content: 'drift into the static and stay there',
      ts: Date.now() - 300000,
      resonance: { score: 22, trend: 'flat', context: 'New · no carriers yet' },
      carriers: [],
      echoes: [],
    },
  ];

  // ─── DEMO FORMING CAPSULES ────────────────────────────────
  const DEMO_FORMING_CAPSULES = [
    { id: 'forming-1', signalId: 'sig-2', title: 'Unmarked Capsule', openAt: Date.now() + 720000 },
    { id: 'forming-2', signalId: 'sig-4', title: 'Sealed Echo',      openAt: Date.now() + 5400000 },
    { id: 'forming-3', signalId: 'sig-1', title: 'Drift Remnant',    openAt: Date.now() + 86400000 * 2 },
  ];

  // ─── STATE ────────────────────────────────────────────────
  const _s = {
    signals: [], reactions: {},
    activeTab: 'observatory',
    sortMode: 'newest',
    expandedSignals: new Set(),
    unsealedRxns: new Set(),
    // Recording
    recording: false, recordingSignalId: null,
    mediaRecorder: null, audioChunks: [], stream: null,
    analyserNode: null, audioCtx: null, liveMeterRaf: null, recordTimerInterval: null,
    recordedDuration: 0,
    // Preview
    previewBlob: null, previewUrl: null, previewWaveform: [], previewAudio: null,
    previewDurationSec: 0,
    // Unsent
    unsent: [],
    // Options
    pendingAnon: false, pendingFilter: 'none', pendingSeal: false,
    // Playback
    activePlayer: null,
    // UI
    legendOpen: false,
    // v3: living density
    whispers: {},         // signalId -> [{id, text, ts}]
    sentPulses: [],       // [{carrierId, word, ts}]
    roomHz: 36.6,
    roomDescIdx: 0,
    presenceCounts: {},   // signalId -> number
    activePulsePicker: null,
  };

  // ─── LIFECYCLE INTERVALS ──────────────────────────────────
  let _presenceIntervals = {};
  let _roomInterval = null;
  let _capsuleInterval = null;

  // ─── STORAGE ──────────────────────────────────────────────
  const Store = {
    loadSignals()    { try { return JSON.parse(localStorage.getItem(SK_SIGNALS)); }     catch(e) { return null; } },
    saveSignals(s)   { try { localStorage.setItem(SK_SIGNALS,   JSON.stringify(s)); }   catch(e) {} },
    loadReactions()  { try { return JSON.parse(localStorage.getItem(SK_REACTIONS))||{}; } catch(e) { return {}; } },
    saveReactions(r) { try { localStorage.setItem(SK_REACTIONS, JSON.stringify(r)); }   catch(e) {
      const t = {}; Object.keys(r).forEach(k => { t[k] = r[k].slice(0, 8); });
      try { localStorage.setItem(SK_REACTIONS, JSON.stringify(t)); } catch(e2) {}
    }},
    loadUnsent()     { try { return JSON.parse(localStorage.getItem(SK_UNSENT)) || []; } catch(e) { return []; } },
    saveUnsent(u)    { try { localStorage.setItem(SK_UNSENT, JSON.stringify(u)); } catch(e) {} },
    onboardSeen()    { return !!localStorage.getItem(SK_SEEN); },
    markOnboardSeen(){ try { localStorage.setItem(SK_SEEN, '1'); } catch(e) {} },
  };

  // ─── WAVEFORM ENGINE ──────────────────────────────────────
  const Waveform = {
    async analyze(blob, samples = 40) {
      try {
        const buf = await blob.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const audio = await ctx.decodeAudioData(buf);
        const data  = audio.getChannelData(0);
        const block = Math.floor(data.length / samples);
        const peaks = Array.from({ length: samples }, (_, i) => {
          let max = 0;
          for (let j = 0; j < block; j++) { const v = Math.abs(data[i * block + j]); if (v > max) max = v; }
          return max;
        });
        const maxP = Math.max(...peaks, 0.01);
        await ctx.close();
        return peaks.map(p => p / maxP);
      } catch(e) {
        return Array.from({ length: samples }, (_, i) => {
          const env = Math.sin((i / samples) * Math.PI);
          return 0.15 + env * 0.65 + Math.random() * 0.2;
        });
      }
    },

    draw(canvas, data, opts = {}) {
      if (!canvas || !data?.length) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w   = canvas.offsetWidth  || canvas.width  / dpr;
      const h   = canvas.offsetHeight || canvas.height / dpr;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
      const { color = CLR_PINK, activeColor = CLR_CYAN, glowColor = CLR_PINK_DIM, progress = -1 } = opts;
      ctx.clearRect(0, 0, w, h);
      const n    = data.length;
      const barW = Math.max(1.5, (w / n) * 0.55);
      const gap  = (w - barW * n) / Math.max(n - 1, 1);
      for (let i = 0; i < n; i++) {
        const x      = i * (barW + gap);
        const barH   = Math.max(1.5, data[i] * h * 0.82);
        const y      = (h - barH) / 2;
        const played = progress >= 0 && (i / n) <= progress;
        ctx.shadowBlur  = played ? 6 : 3;
        ctx.shadowColor = played ? activeColor : glowColor;
        ctx.fillStyle   = played ? activeColor : color;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, Math.min(barW / 2, 2));
        else ctx.rect(x, y, barW, barH);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    },

    drawMeter(canvas, analyser) {
      if (!canvas || !analyser) return;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      const bars = 20, block = Math.floor(buf.length / bars);
      const peaks = Array.from({ length: bars }, (_, i) => {
        let s = 0; for (let j = 0; j < block; j++) s += buf[i * block + j];
        return (s / block) / 255;
      });
      this.draw(canvas, peaks, { color: CLR_PINK, glowColor: CLR_PINK_DIM });
    },
  };

  // ─── RECORDER ─────────────────────────────────────────────
  const Recorder = {
    _elapsed: 0,
    async start(signalId) {
      if (_s.recording) return;
      if (!navigator.mediaDevices?.getUserMedia) { UI.toast('Microphone not supported in this browser.'); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        _s.stream = stream; _s.audioChunks = [];
        _s.recordingSignalId = signalId; _s.recording = true; this._elapsed = 0;
        _s.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const src = _s.audioCtx.createMediaStreamSource(stream);
        const analyser = _s.audioCtx.createAnalyser(); analyser.fftSize = 256;
        src.connect(analyser); _s.analyserNode = analyser;
        const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg','audio/mp4']
          .find(t => { try { return MediaRecorder.isTypeSupported(t); } catch(e) { return false; } }) || '';
        _s.mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
        _s.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _s.audioChunks.push(e.data); };
        _s.mediaRecorder.onstop = () => this._handleStop();
        _s.mediaRecorder.start(100);
        _s.recordTimerInterval = setInterval(() => this._tickTimer(), 100);
        setTimeout(() => this.stop(), MAX_REC_MS);
        UI.showScreen('recording'); this._startMeter();
      } catch(e) {
        _s.recording = false;
        UI.toast(e.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not start recording.');
      }
    },
    _tickTimer() {
      if (!_s.recording) { clearInterval(_s.recordTimerInterval); return; }
      this._elapsed += 100;
      _s.recordedDuration = this._elapsed;
      const el = document.getElementById('eco-record-timer');
      if (el) el.textContent = (this._elapsed / 1000).toFixed(1) + 's';
    },
    stop() {
      if (!_s.recording) return;
      _s.recording = false; clearInterval(_s.recordTimerInterval);
      if (_s.liveMeterRaf) { cancelAnimationFrame(_s.liveMeterRaf); _s.liveMeterRaf = null; }
      if (_s.mediaRecorder?.state !== 'inactive') _s.mediaRecorder.stop();
    },
    async _handleStop() {
      const mime = _s.mediaRecorder?.mimeType || 'audio/webm';
      const blob = new Blob(_s.audioChunks, { type: mime });
      if (_s.stream) { _s.stream.getTracks().forEach(t => t.stop()); _s.stream = null; }
      if (_s.audioCtx) { try { await _s.audioCtx.close(); } catch(e) {} _s.audioCtx = null; }
      _s.analyserNode = null;
      _s.previewBlob = blob; _s.previewUrl = URL.createObjectURL(blob);
      _s.previewWaveform = await Waveform.analyze(blob);
      _s.previewDurationSec = Math.round(_s.recordedDuration / 100) / 10;
      UI.showScreen('preview');
      const canvas = document.getElementById('eco-preview-waveform');
      if (canvas) Waveform.draw(canvas, _s.previewWaveform, { color: CLR_CYAN, glowColor: 'rgba(0,229,255,0.4)' });
      const durEl = document.getElementById('eco-preview-duration');
      if (durEl) durEl.textContent = _s.previewDurationSec + 's recorded';
    },
    _startMeter() {
      const canvas = document.getElementById('eco-record-meter');
      const tick = () => { if (!_s.recording) return; Waveform.drawMeter(canvas, _s.analyserNode); _s.liveMeterRaf = requestAnimationFrame(tick); };
      tick();
    },
  };

  // ─── PLAYER ───────────────────────────────────────────────
  const Player = {
    play(rxn, signalId) {
      if (_s.activePlayer?.reactionId === rxn.id) { this.stop(); return; }
      this.stop();
      if (!rxn.audioUrl && rxn.audioData) rxn.audioUrl = _base64ToUrl(rxn.audioData);
      if (!rxn.audioUrl) return;
      const audio = new Audio(rxn.audioUrl);
      const tick = () => {
        if (audio.paused) return;
        const prog = audio.currentTime / (audio.duration || 1);
        UI.updateProgress(rxn.id, prog);
        _s.activePlayer.raf = requestAnimationFrame(tick);
      };
      audio.onplay  = () => { UI.setPlayState(rxn.id, true); tick(); };
      audio.onended = () => {
        rxn.replays = (rxn.replays || 0) + 1;
        Store.saveReactions(_s.reactions);
        UI.setPlayState(rxn.id, false); UI.updateProgress(rxn.id, 0);
        cancelAnimationFrame(_s.activePlayer?.raf); _s.activePlayer = null;
        const el = document.querySelector(`#eco-rxn-${rxn.id} .eco-rxn-replays`);
        if (el) el.textContent = `↺ ${rxn.replays} play${rxn.replays !== 1 ? 's' : ''}`;
        else {
          const meta = document.querySelector(`#eco-rxn-${rxn.id} .eco-rxn-meta`);
          if (meta && rxn.replays > 0) {
            const s = document.createElement('span'); s.className = 'eco-rxn-replays';
            s.textContent = `↺ ${rxn.replays} play${rxn.replays !== 1 ? 's' : ''}`;
            meta.insertBefore(s, meta.children[1] || null);
          }
        }
        showNearbySuggestion(signalId);
      };
      audio.onerror = () => { UI.setPlayState(rxn.id, false); _s.activePlayer = null; UI.toast('Could not play this reaction.'); };
      _s.activePlayer = { audio, reactionId: rxn.id, signalId, raf: null };
      audio.play().catch(() => { _s.activePlayer = null; });
    },
    stop() {
      if (!_s.activePlayer) return;
      const { audio, reactionId, raf } = _s.activePlayer;
      cancelAnimationFrame(raf); audio.pause(); audio.src = '';
      UI.setPlayState(reactionId, false); UI.updateProgress(reactionId, 0);
      _s.activePlayer = null;
    },
  };

  // ─── PRESENCE ─────────────────────────────────────────────
  const Presence = {
    start(signalId) {
      if (_presenceIntervals[signalId]) return;
      if (_s.presenceCounts[signalId] === undefined) {
        _s.presenceCounts[signalId] = 1 + Math.floor(Math.random() * 5);
      }
      this._updateDisplay(signalId);
      const tick = () => {
        const delta = Math.random() > 0.42 ? 1 : -1;
        _s.presenceCounts[signalId] = Math.max(0, (_s.presenceCounts[signalId] || 0) + delta);
        this._updateDisplay(signalId);
        if (Math.random() < 0.35) this._showEntry(signalId);
        _presenceIntervals[signalId] = setTimeout(tick, 7000 + Math.random() * 9000);
      };
      _presenceIntervals[signalId] = setTimeout(tick, 3000 + Math.random() * 5000);
    },

    stop(signalId) {
      clearTimeout(_presenceIntervals[signalId]);
      delete _presenceIntervals[signalId];
    },

    stopAll() {
      Object.keys(_presenceIntervals).forEach(sid => this.stop(sid));
    },

    _updateDisplay(signalId) {
      const count = _s.presenceCounts[signalId] || 0;
      const el = document.getElementById(`eco-presence-count-${signalId}`);
      if (!el) return;
      el.textContent = count === 0 ? 'quiet right now'
        : count === 1 ? '1 listening nearby'
        : `${count} listening nearby`;
    },

    _showEntry(signalId) {
      const container = document.getElementById(`eco-presence-feed-${signalId}`);
      if (!container) return;
      const name = GHOST_NAMES[Math.floor(Math.random() * GHOST_NAMES.length)];
      const msgs  = [
        `⋆ ${name} just entered`,
        `· ${name} is listening`,
        `⋆ ${name} felt this`,
        `· someone from ${name.split('_')[0]} is here`,
      ];
      const el = document.createElement('div');
      el.className = 'eco-presence-entry';
      el.textContent = msgs[Math.floor(Math.random() * msgs.length)];
      container.appendChild(el);
      while (container.children.length > 3) container.removeChild(container.firstChild);
      setTimeout(() => el.classList.add('is-fading'), 3200);
      setTimeout(() => el.remove(), 4000);
    },
  };

  // ─── ROOM FREQUENCY ───────────────────────────────────────
  const Room = {
    start() {
      if (_roomInterval) return;
      _roomInterval = setInterval(() => this._update(), 28000);
    },
    stop() {
      if (_roomInterval) { clearInterval(_roomInterval); _roomInterval = null; }
    },
    _update() {
      _s.roomHz = Math.round((_s.roomHz + (Math.random() - 0.5) * 0.6) * 10) / 10;
      _s.roomHz = Math.max(34.0, Math.min(40.0, _s.roomHz));
      _s.roomDescIdx = (_s.roomDescIdx + 1) % ROOM_DESCS.length;
      const hzEl   = document.getElementById('eco-room-hz');
      const descEl = document.getElementById('eco-room-desc');
      if (hzEl)   { hzEl.textContent   = _s.roomHz.toFixed(1) + ' Hz'; hzEl.classList.add('is-updating'); setTimeout(() => hzEl.classList.remove('is-updating'), 600); }
      if (descEl) descEl.textContent = ROOM_DESCS[_s.roomDescIdx];
    },
  };

  // ─── HELPERS ──────────────────────────────────────────────
  function _blobToBase64(blob) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  }
  function _base64ToUrl(b64) {
    try {
      const [hdr, data] = b64.split(',');
      const mime = hdr.match(/:(.*?);/)[1];
      const bytes = atob(data); const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return URL.createObjectURL(new Blob([arr], { type: mime }));
    } catch(e) { return null; }
  }
  function _ago(ts) {
    const d = Date.now() - ts;
    if (d < 60000)    return 'just now';
    if (d < 3600000)  return Math.floor(d / 60000) + 'm ago';
    if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
    return Math.floor(d / 86400000) + 'd ago';
  }
  function _formatCountdown(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }
  function _escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }
  function _sortedRxns(sid) {
    const arr = _s.reactions[sid] || [];
    return _s.sortMode === 'most-replayed'
      ? [...arr].sort((a, b) => (b.replays || 0) - (a.replays || 0))
      : [...arr].sort((a, b) => b.ts - a.ts);
  }
  function _allRxns() { return Object.values(_s.reactions).flat(); }
  function _trendIcon(t) { return t === 'up' ? '↑' : t === 'down' ? '↓' : '→'; }
  function _trendClass(t) { return t === 'up' ? 'up' : t === 'down' ? 'down' : 'flat'; }

  // ─── CAPSULE COUNTDOWN ────────────────────────────────────
  function _startCapsuleCountdown() {
    _stopCapsuleCountdown();
    _capsuleInterval = setInterval(() => {
      DEMO_FORMING_CAPSULES.forEach(cap => {
        const el = document.getElementById(`eco-cap-countdown-${cap.id}`);
        if (!el) return;
        const remaining = cap.openAt - Date.now();
        el.textContent = remaining > 0 ? 'forms in ' + _formatCountdown(remaining) : 'opening now…';
      });
    }, 1000);
  }
  function _stopCapsuleCountdown() {
    if (_capsuleInterval) { clearInterval(_capsuleInterval); _capsuleInterval = null; }
  }

  // ─── WHISPER ──────────────────────────────────────────────
  function postWhisper(signalId, text) {
    if (!text.trim()) return;
    const id = 'wsp-' + Date.now();
    const whisper = { id, text: text.trim(), ts: Date.now() };
    if (!_s.whispers[signalId]) _s.whispers[signalId] = [];
    _s.whispers[signalId].unshift(whisper);
    const list = document.getElementById(`eco-whisper-list-${signalId}`);
    if (!list) return;
    const el = document.createElement('div');
    el.className = 'eco-whisper-item';
    el.id = 'eco-wsp-' + id;
    el.innerHTML = `<span class="eco-whisper-text">${_escapeHtml(whisper.text)}</span><span class="eco-whisper-timer">fades in 2m</span>`;
    list.prepend(el);
    setTimeout(() => { const t = el.querySelector('.eco-whisper-timer'); if (t) t.textContent = 'fading…'; el.classList.add('is-fading'); }, 115000);
    setTimeout(() => { el.remove(); _s.whispers[signalId] = (_s.whispers[signalId] || []).filter(w => w.id !== id); }, 120000);
  }

  // ─── PULSE PICKER ─────────────────────────────────────────
  function openPulsePicker(carrierId, anchorEl) {
    closePulsePicker();
    const picker = document.getElementById('eco-pulse-picker');
    if (!picker) return;
    _s.activePulsePicker = carrierId;
    const ws    = document.getElementById('eco-workspace');
    const rect  = anchorEl.getBoundingClientRect();
    const wsRect = ws ? ws.getBoundingClientRect() : { top: 0, left: 0 };
    picker.style.top  = (rect.bottom - wsRect.top + 8) + 'px';
    picker.style.left = (rect.left - wsRect.left) + 'px';
    picker.classList.add('is-open');
  }
  function closePulsePicker() {
    const picker = document.getElementById('eco-pulse-picker');
    if (picker) picker.classList.remove('is-open');
    _s.activePulsePicker = null;
  }
  function sendPulse(carrierId, word) {
    _s.sentPulses.push({ carrierId, word, ts: Date.now() });
    closePulsePicker();
    const badge = document.querySelector(`.eco-carrier-badge[data-carrier-id="${carrierId}"]`);
    if (badge) {
      badge.classList.add('is-pulsed');
      const dot = document.createElement('span');
      dot.className = 'eco-pulse-sent-dot'; dot.textContent = word;
      badge.appendChild(dot);
      setTimeout(() => { badge.classList.remove('is-pulsed'); dot.remove(); }, 2200);
    }
    UI.toast(`Pulse sent · "${word}"`);
  }

  // ─── NEARBY SUGGESTION ────────────────────────────────────
  function showNearbySuggestion(signalId) {
    const others = _s.signals.filter(s => s.id !== signalId);
    if (!others.length) return;
    const picks = [...others].sort(() => Math.random() - 0.5).slice(0, 2);
    const existing = document.getElementById('eco-nearby-' + signalId);
    if (existing) existing.remove();
    const stack = document.getElementById('eco-stack-' + signalId);
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'eco-nearby-suggestion'; el.id = 'eco-nearby-' + signalId;
    el.innerHTML = `<span class="eco-nearby-label">nearby signals</span>
      <div class="eco-nearby-links">${picks.map(s =>
        `<button class="eco-nearby-link" data-signal-id="${s.id}">${s.title} <span class="eco-nearby-score">${s.resonance.score}%</span></button>`
      ).join('')}</div>`;
    stack.after(el);
    el.querySelectorAll('.eco-nearby-link').forEach(btn => {
      btn.addEventListener('click', () => {
        el.remove();
        const card = document.querySelector(`.eco-signal-card[data-signal-id="${btn.dataset.signalId}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
    setTimeout(() => { if (el.parentNode) { el.classList.add('is-fading'); setTimeout(() => el.remove(), 600); } }, 9000);
  }

  // ─── ACTIONS ──────────────────────────────────────────────
  async function postReaction() {
    if (!_s.previewBlob || !_s.recordingSignalId) return;
    const btn = document.getElementById('eco-post-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Posting…'; }
    const audioData = await _blobToBase64(_s.previewBlob);
    const rxn = {
      id: 'rxn-' + Date.now(),
      signalId: _s.recordingSignalId, audioData, audioUrl: _s.previewUrl,
      waveformData: _s.previewWaveform, ts: Date.now(), replays: 0,
      isAnon: _s.pendingAnon, filter: _s.pendingFilter,
      state: _s.pendingSeal ? 'sealed' : 'open',
      durationSec: _s.previewDurationSec,
      isFavorite: false, sentToDrift: false,
    };
    if (!_s.reactions[_s.recordingSignalId]) _s.reactions[_s.recordingSignalId] = [];
    _s.reactions[_s.recordingSignalId].unshift(rxn);
    Store.saveReactions(_s.reactions);
    const sid = _s.recordingSignalId;
    _s.previewBlob = null; _s.previewUrl = null; _s.previewWaveform = [];
    _s.previewDurationSec = 0; _s.recordingSignalId = null;
    if (btn) { btn.disabled = false; btn.textContent = 'Post Reaction'; }
    UI.closeModal(); _s.expandedSignals.add(sid);
    UI.renderTab('signals'); UI.updateStats(); UI.toast('Reaction posted ✓');
  }

  async function saveDraft() {
    if (!_s.previewBlob || !_s.recordingSignalId) return;
    const btn = document.getElementById('eco-draft-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    const audioData = await _blobToBase64(_s.previewBlob);
    const draft = {
      id: 'draft-' + Date.now(), signalId: _s.recordingSignalId,
      audioData, audioUrl: _s.previewUrl, waveformData: _s.previewWaveform,
      ts: Date.now(), isAnon: _s.pendingAnon, filter: _s.pendingFilter,
      pendingSeal: _s.pendingSeal, durationSec: _s.previewDurationSec,
    };
    _s.unsent.unshift(draft); Store.saveUnsent(_s.unsent);
    _s.previewBlob = null; _s.previewUrl = null; _s.previewWaveform = [];
    _s.previewDurationSec = 0; _s.recordingSignalId = null;
    if (btn) { btn.disabled = false; btn.textContent = 'Save Draft'; }
    UI.closeModal(); UI.toast('Saved to Unsent ✓');
  }

  async function postFromUnsent(draftId) {
    const draft = _s.unsent.find(d => d.id === draftId);
    if (!draft) return;
    const rxn = {
      id: 'rxn-' + Date.now(), signalId: draft.signalId,
      audioData: draft.audioData, audioUrl: draft.audioUrl,
      waveformData: draft.waveformData, ts: Date.now(), replays: 0,
      isAnon: draft.isAnon, filter: draft.filter,
      state: draft.pendingSeal ? 'sealed' : 'open',
      durationSec: draft.durationSec, isFavorite: false, sentToDrift: false,
    };
    if (!_s.reactions[draft.signalId]) _s.reactions[draft.signalId] = [];
    _s.reactions[draft.signalId].unshift(rxn);
    Store.saveReactions(_s.reactions);
    _s.unsent = _s.unsent.filter(d => d.id !== draftId);
    Store.saveUnsent(_s.unsent);
    _s.expandedSignals.add(draft.signalId);
    UI.renderTab('unsent'); UI.updateStats(); UI.toast('Reaction posted from Unsent ✓');
  }

  function deleteUnsent(draftId) {
    _s.unsent = _s.unsent.filter(d => d.id !== draftId);
    Store.saveUnsent(_s.unsent);
    UI.renderTab('unsent');
  }

  function deleteReaction(rxnId, signalId) {
    if (!_s.reactions[signalId]) return;
    _s.reactions[signalId] = _s.reactions[signalId].filter(r => r.id !== rxnId);
    Store.saveReactions(_s.reactions); UI.renderStack(signalId); UI.updateStats();
  }

  function archiveReaction(rxnId, signalId) {
    const rxn = (_s.reactions[signalId] || []).find(r => r.id === rxnId);
    if (!rxn) return;
    rxn.state = rxn.state === 'archived' ? 'open' : 'archived';
    Store.saveReactions(_s.reactions); UI.renderStack(signalId);
    UI.toast(rxn.state === 'archived' ? 'Archived ✓' : 'Restored ✓');
  }

  function unsealReaction(rxnId) {
    _s.unsealedRxns.add(rxnId);
    const pill = document.getElementById('eco-rxn-' + rxnId);
    if (!pill) return;
    pill.classList.add('is-unsealing');
    const overlay = pill.querySelector('.eco-sealed-overlay');
    if (overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 400); }
    const wvf = pill.querySelector('.eco-sealed-waveform');
    if (wvf) { setTimeout(() => wvf.classList.remove('eco-sealed-waveform'), 500); }
  }

  function toggleFavorite(rxnId, signalId) {
    const rxn = (_s.reactions[signalId] || []).find(r => r.id === rxnId);
    if (!rxn) return;
    rxn.isFavorite = !rxn.isFavorite; Store.saveReactions(_s.reactions);
    const btn = document.querySelector(`#eco-rxn-${rxnId} .eco-rxn-fav-btn`);
    if (btn) {
      btn.classList.toggle('is-fav', rxn.isFavorite);
      const path = btn.querySelector('path'); if (path) path.setAttribute('fill', rxn.isFavorite ? 'currentColor' : 'none');
      btn.setAttribute('aria-label', rxn.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    }
  }

  function sendToDrift(rxnId, signalId) {
    const rxn = (_s.reactions[signalId] || []).find(r => r.id === rxnId);
    if (!rxn || rxn.sentToDrift) return;
    rxn.sentToDrift = true; Store.saveReactions(_s.reactions);
    const pill = document.getElementById('eco-rxn-' + rxnId);
    if (pill) { pill.classList.add('is-drifting'); setTimeout(() => UI.renderStack(signalId), 1200); }
    UI.toast('Drifted ↑ into the field');
  }

  // ─── UI ───────────────────────────────────────────────────
  const UI = {
    buildHTML() {
      const pulseWords = PULSE_WORDS.map(w =>
        `<button class="eco-pulse-word" data-word="${w}" aria-label="Send feeling: ${w}">${w}</button>`
      ).join('');

      return `
<div class="eco-workspace" id="eco-workspace">
  <div class="eco-bg-waves" aria-hidden="true">
    ${[1,2,3,4,5,6].map(i => `<div class="eco-wave eco-wave--${i}"></div>`).join('')}
  </div>

  <div class="eco-header">
    <div class="eco-header__icon" aria-hidden="true">🌊</div>
    <div class="eco-header__text">
      <h2 class="eco-title">ECOSPHERE</h2>
      <p class="eco-subtitle">Leave your audio trace in the ecosystem</p>
    </div>
    <div class="eco-header__stats" id="eco-stats"></div>
    <button class="eco-help-btn" id="eco-help-btn" aria-label="Show guide and legend">?</button>
  </div>

  <nav class="eco-tabs" role="tablist" aria-label="Ecosphere sections">
    <button class="eco-tab-btn is-active" data-tab="observatory" role="tab" aria-selected="true"
      data-tip="Resonance + active carriers">OBSERVATORY</button>
    <button class="eco-tab-btn" data-tab="signals" role="tab" aria-selected="false"
      data-tip="React to signals">SIGNALS</button>
    <button class="eco-tab-btn" data-tab="drift" role="tab" aria-selected="false"
      data-tip="Floating audio traces">DRIFT</button>
    <button class="eco-tab-btn" data-tab="unsent" role="tab" aria-selected="false"
      data-tip="Your unposted drafts">UNSENT</button>
    <button class="eco-tab-btn" data-tab="capsules" role="tab" aria-selected="false"
      data-tip="Sealed, archived &amp; lost reactions">CAPSULES</button>
  </nav>

  <div class="eco-controls" id="eco-controls" aria-label="Sort controls">
    <span class="eco-controls__label" id="eco-sort-label">Sort reactions:</span>
    <button class="eco-sort-btn is-active" data-sort="newest" aria-label="Sort by newest first">Newest</button>
    <button class="eco-sort-btn" data-sort="most-replayed" aria-label="Sort by most replayed first">Most Replayed</button>
  </div>

  <div class="eco-tab-pane is-active" data-tab="observatory" role="tabpanel">
    <div class="eco-observatory" id="eco-observatory"></div>
  </div>
  <div class="eco-tab-pane" data-tab="signals" role="tabpanel">
    <div class="eco-feed" id="eco-feed"></div>
  </div>
  <div class="eco-tab-pane" data-tab="drift" role="tabpanel">
    <div class="eco-drift"><div class="eco-drift__field" id="eco-drift-field"></div></div>
  </div>
  <div class="eco-tab-pane" data-tab="unsent" role="tabpanel">
    <div class="eco-unsent" id="eco-unsent"></div>
  </div>
  <div class="eco-tab-pane" data-tab="capsules" role="tabpanel">
    <div class="eco-capsules" id="eco-capsules"></div>
  </div>

  <!-- Pulse picker (singleton, repositioned dynamically) -->
  <div class="eco-pulse-picker" id="eco-pulse-picker" role="dialog" aria-label="Send a pulse to carrier">
    <p class="eco-pulse-picker__label">send a pulse</p>
    <div class="eco-pulse-picker__words">${pulseWords}</div>
  </div>

  <!-- Record Modal -->
  <div class="eco-modal" id="eco-record-modal" role="dialog" aria-modal="true" aria-label="Record voice reaction" hidden>
    <div class="eco-modal__backdrop" id="eco-modal-backdrop"></div>
    <div class="eco-modal__panel" role="document">
      <div class="eco-modal__header">
        <span class="eco-modal__title" id="eco-record-title">REACT</span>
        <button class="eco-modal__close" id="eco-modal-close" aria-label="Close recording panel">&times;</button>
      </div>

      <div class="eco-modal__screen" id="eco-screen-idle">
        <p class="eco-modal__hint">Record a 1–5s voice reaction — laugh, whisper, sigh, anything real.</p>
        <div class="eco-filter-row" role="group" aria-label="Voice filter">
          <span class="eco-filter-label" id="eco-filter-label">Filter:</span>
          <button class="eco-filter-btn is-active" data-filter="none"    aria-pressed="true">Raw</button>
          <button class="eco-filter-btn" data-filter="distort" aria-pressed="false">Distort</button>
          <button class="eco-filter-btn" data-filter="whisper" aria-pressed="false">Whisper</button>
          <button class="eco-filter-btn" data-filter="ambient" aria-pressed="false">Ambient</button>
        </div>
        <div class="eco-options-row">
          <label class="eco-anon-label">
            <input type="checkbox" id="eco-anon-check" class="eco-anon-check" aria-label="Post anonymously" />
            <span>Anonymous</span>
          </label>
          <label class="eco-seal-label">
            <input type="checkbox" id="eco-seal-check" class="eco-seal-check" aria-label="Seal this reaction — others must tap to open" />
            <span>Seal it <span class="eco-seal-label__hint">others tap to break</span></span>
          </label>
        </div>
        <button class="eco-record-btn" id="eco-record-start" aria-label="Start recording voice reaction">
          <div class="eco-record-btn__ring" aria-hidden="true"></div>
          <div class="eco-record-btn__ring eco-record-btn__ring--2" aria-hidden="true"></div>
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/>
            <path d="M24 14a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0v-8a4 4 0 0 0-4-4z" fill="currentColor"/>
            <path d="M16 24v2a8 8 0 0 0 16 0v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="24" y1="34" x2="24" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="19" y1="40" x2="29" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <p class="eco-mic-hint" aria-live="polite">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M8 1a2 2 0 0 0-2 2v5a2 2 0 0 0 4 0V3a2 2 0 0 0-2-2z"/>
            <path d="M3 7v1a5 5 0 0 0 10 0V7" stroke-linecap="round"/>
          </svg>
          Requires microphone access
        </p>
      </div>

      <div class="eco-modal__screen" id="eco-screen-recording" hidden>
        <div class="eco-recording-indicator" role="status" aria-live="polite" aria-label="Recording in progress">
          <div class="eco-recording-dot" aria-hidden="true"></div>
          <span id="eco-record-timer" aria-label="Recording duration">0.0s</span>
          <span class="eco-record-timer-label">recorded &middot; max 5s</span>
        </div>
        <canvas class="eco-record-meter-canvas" id="eco-record-meter" aria-hidden="true" role="img" aria-label="Live audio waveform"></canvas>
        <button class="eco-stop-btn" id="eco-record-stop" aria-label="Stop recording">
          <div class="eco-stop-btn__inner" aria-hidden="true"></div>
        </button>
        <p class="eco-modal__hint eco-modal__hint--sm">Tap to stop</p>
      </div>

      <div class="eco-modal__screen" id="eco-screen-preview" hidden>
        <p class="eco-modal__hint">Preview — sounds right?</p>
        <div class="eco-preview-waveform-wrap">
          <canvas class="eco-preview-waveform-canvas" id="eco-preview-waveform" aria-hidden="true" role="img" aria-label="Preview waveform"></canvas>
          <button class="eco-preview-play-btn" id="eco-preview-play" aria-label="Play back your recording">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <p class="eco-preview-duration" id="eco-preview-duration" aria-live="polite"></p>
        <div class="eco-preview-actions">
          <button class="eco-btn eco-btn--ghost"   id="eco-retry-btn"  aria-label="Discard and re-record">Retry</button>
          <button class="eco-btn eco-btn--draft"   id="eco-draft-btn"  aria-label="Save to Unsent drafts">Save Draft</button>
          <button class="eco-btn eco-btn--primary" id="eco-post-btn"   aria-label="Post reaction to signal">Post</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Onboarding overlay -->
  <div class="eco-onboarding" id="eco-onboarding" role="dialog" aria-modal="true" aria-labelledby="eco-onboard-title" hidden>
    <div class="eco-onboarding__panel">
      <h2 class="eco-onboarding__title" id="eco-onboard-title">ECOSPHERE</h2>
      <p class="eco-onboarding__sub">Leave tiny emotional audio traces throughout the ecosystem.</p>
      <div class="eco-onboarding__legend" role="list">
        <div class="eco-onboard-row" role="listitem">
          <span class="eco-onboard-verb eco-onboard-verb--react">REACT</span>
          <p class="eco-onboard-desc">Record a 1–5s voice reaction to a signal — a laugh, a sigh, a "this one hurts." Raw audio, no editing.</p>
        </div>
        <div class="eco-onboard-row" role="listitem">
          <span class="eco-onboard-verb eco-onboard-verb--seal">SEAL</span>
          <p class="eco-onboard-desc">Optional: seal your reaction before posting. Others see the waveform shape but must tap to break the seal and hear it.</p>
        </div>
        <div class="eco-onboard-row" role="listitem">
          <span class="eco-onboard-verb eco-onboard-verb--drift">DRIFT</span>
          <p class="eco-onboard-desc">Send a reaction into Drift — it floats free in the field, detached from its signal, waiting to be found.</p>
        </div>
        <div class="eco-onboard-row" role="listitem">
          <span class="eco-onboard-verb eco-onboard-verb--capsule">CAPSULE</span>
          <p class="eco-onboard-desc">Archived, private, or lost reactions live here. Archived = stored forever. Private = only you. Lost = corrupted trace.</p>
        </div>
      </div>
      <button class="eco-onboarding__close" id="eco-onboard-close">Got it — enter the ecosystem</button>
    </div>
  </div>

  <div class="eco-toast" id="eco-toast" role="status" aria-live="polite" aria-atomic="true"></div>
</div>`;
    },

    // ── Mount ──────────────────────────────────────────────
    mount(container) {
      container.innerHTML = this.buildHTML();
      this.bindEvents();
      this.renderTab('observatory');
      this.updateStats();
      if (!Store.onboardSeen()) setTimeout(() => this.showOnboarding(), 300);
    },

    // ── Events ────────────────────────────────────────────
    bindEvents() {
      document.querySelectorAll('.eco-tab-btn').forEach(btn =>
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab))
      );
      document.querySelectorAll('.eco-sort-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          document.querySelectorAll('.eco-sort-btn').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
          btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true');
          _s.sortMode = btn.dataset.sort;
          if (_s.activeTab === 'signals') this.renderTab('signals');
        })
      );
      const closeBtn  = document.getElementById('eco-modal-close');
      const backdrop  = document.getElementById('eco-modal-backdrop');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
      if (backdrop) backdrop.addEventListener('click', () => this.closeModal());
      const startBtn    = document.getElementById('eco-record-start');
      const stopBtn     = document.getElementById('eco-record-stop');
      const previewPlay = document.getElementById('eco-preview-play');
      const retryBtn    = document.getElementById('eco-retry-btn');
      const draftBtn    = document.getElementById('eco-draft-btn');
      const postBtn     = document.getElementById('eco-post-btn');
      if (startBtn)    startBtn.addEventListener('click',   () => Recorder.start(_s.recordingSignalId));
      if (stopBtn)     stopBtn.addEventListener('click',    () => Recorder.stop());
      if (previewPlay) previewPlay.addEventListener('click',() => this.previewPlay());
      if (retryBtn)    retryBtn.addEventListener('click',   () => this.retryRecording());
      if (draftBtn)    draftBtn.addEventListener('click',   () => saveDraft());
      if (postBtn)     postBtn.addEventListener('click',    () => postReaction());
      document.querySelectorAll('.eco-filter-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          document.querySelectorAll('.eco-filter-btn').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
          btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true');
          _s.pendingFilter = btn.dataset.filter;
        })
      );
      const anonChk = document.getElementById('eco-anon-check');
      const sealChk = document.getElementById('eco-seal-check');
      if (anonChk) anonChk.addEventListener('change', e => { _s.pendingAnon = e.target.checked; });
      if (sealChk) sealChk.addEventListener('change', e => { _s.pendingSeal = e.target.checked; });
      const helpBtn   = document.getElementById('eco-help-btn');
      const onboardCl = document.getElementById('eco-onboard-close');
      if (helpBtn)   helpBtn.addEventListener('click',   () => this.showOnboarding());
      if (onboardCl) onboardCl.addEventListener('click', () => this.dismissOnboarding());

      // Pulse picker
      const picker = document.getElementById('eco-pulse-picker');
      if (picker) {
        picker.querySelectorAll('.eco-pulse-word').forEach(btn =>
          btn.addEventListener('click', () => {
            if (_s.activePulsePicker) sendPulse(_s.activePulsePicker, btn.dataset.word);
          })
        );
      }

      // Dismiss pulse picker on outside click
      document.addEventListener('click', e => {
        if (_s.activePulsePicker && !e.target.closest('#eco-pulse-picker') && !e.target.closest('.eco-carrier-badge')) {
          closePulsePicker();
        }
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { this.closeModal(); this.dismissOnboarding(); closePulsePicker(); }
      });
    },

    // ── Tabs ──────────────────────────────────────────────
    switchTab(tab) {
      Player.stop();
      if (_s.activeTab === 'signals')  Presence.stopAll();
      if (_s.activeTab === 'capsules') _stopCapsuleCountdown();
      _s.activeTab = tab;
      document.querySelectorAll('.eco-tab-btn').forEach(b => {
        const active = b.dataset.tab === tab;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('.eco-tab-pane').forEach(p =>
        p.classList.toggle('is-active', p.dataset.tab === tab)
      );
      const controls = document.getElementById('eco-controls');
      if (controls) controls.style.display = tab === 'signals' ? '' : 'none';
      if (tab === 'capsules') _startCapsuleCountdown();
      this.renderTab(tab);
    },

    renderTab(tab) {
      if (tab === 'observatory') this.renderObservatory();
      if (tab === 'signals')     this.renderSignals();
      if (tab === 'drift')       this.renderDrift();
      if (tab === 'unsent')      this.renderUnsent();
      if (tab === 'capsules')    this.renderCapsules();
    },

    // ── Observatory ───────────────────────────────────────
    renderObservatory() {
      const el = document.getElementById('eco-observatory');
      if (!el) return;
      const totalRxns  = _allRxns().length;
      const avgScore   = _s.signals.length
        ? Math.round(_s.signals.reduce((s, sig) => s + sig.resonance.score, 0) / _s.signals.length) : 0;
      el.innerHTML = `
        ${this.buildRoomFreq()}
        ${this.buildFrequencyPulse(avgScore, totalRxns)}
        ${this.buildResonanceRow()}
        ${this.buildCarrierBlock()}
        ${this.buildRecentActivity()}
      `;
      document.getElementById('eco-carrier-legend-toggle')?.addEventListener('click', () => {
        const leg = document.getElementById('eco-carrier-legend');
        if (!leg) return; _s.legendOpen = !_s.legendOpen;
        leg.classList.toggle('is-open', _s.legendOpen);
        const btn = document.getElementById('eco-carrier-legend-toggle');
        if (btn) btn.textContent = _s.legendOpen ? 'Hide legend' : 'What are these?';
      });
      // Wire carrier badge clicks → pulse picker
      el.querySelectorAll('.eco-carrier-badge[data-carrier-id]').forEach(badge => {
        badge.addEventListener('click', () => openPulsePicker(badge.dataset.carrierId, badge));
        badge.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') openPulsePicker(badge.dataset.carrierId, badge);
        });
      });
    },

    buildRoomFreq() {
      const hz   = _s.roomHz.toFixed(1);
      const desc = ROOM_DESCS[_s.roomDescIdx];
      return `<div class="eco-room-block">
        <div class="eco-room-block__header">
          <span class="eco-room-block__label">ROOM FREQUENCY</span>
          <span class="eco-room-block__hz" id="eco-room-hz">${hz} Hz</span>
        </div>
        <p class="eco-room-block__desc" id="eco-room-desc">${desc}</p>
        <div class="eco-room-block__bar" aria-hidden="true"></div>
      </div>`;
    },

    buildFrequencyPulse(avgScore, totalRxns) {
      const bars = Array.from({ length: 18 }, (_, i) =>
        `<div class="eco-freq-bar" style="--i:${i};height:${8 + Math.round(Math.sin(i * 0.7) * 8 + Math.random() * 8)}px" aria-hidden="true"></div>`
      ).join('');
      return `<div class="eco-freq-block">
        <div class="eco-freq-block__header">
          <span class="eco-freq-block__label">FREQUENCY PULSE</span>
          <span class="eco-freq-block__hint">${totalRxns} trace${totalRxns !== 1 ? 's' : ''} across ${_s.signals.length} signals</span>
        </div>
        <div class="eco-freq-bars" role="img" aria-label="Frequency activity visualisation">${bars}</div>
      </div>`;
    },

    buildResonanceRow() {
      const items = _s.signals.slice(0, 3).map(sig => {
        const { score, trend, context } = sig.resonance;
        const icon  = _trendIcon(trend);
        const cls   = _trendClass(trend);
        return `<div class="eco-resonance-item">
          <span class="eco-resonance-item__label">${sig.title}</span>
          <div class="eco-resonance-item__bar-wrap" role="progressbar" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100" aria-label="${sig.title} resonance ${score}%">
            <div class="eco-resonance-item__bar" style="--eco-rscore:${score}%"></div>
          </div>
          <div class="eco-resonance-item__score">
            <span class="eco-resonance-item__val">${score}%</span>
            <span class="eco-resonance-item__trend eco-resonance-item__trend--${cls}" aria-label="Trend: ${trend}">${icon}</span>
            <span class="eco-resonance-item__context">${context}</span>
          </div>
        </div>`;
      }).join('');
      return `<div class="eco-freq-block">
        <div class="eco-freq-block__header">
          <span class="eco-freq-block__label">RESONANCE</span>
          <span class="eco-freq-block__hint" title="How widely each signal is reaching active carriers">% of active carriers reached</span>
        </div>
        <div class="eco-resonance-row">${items}</div>
      </div>`;
    },

    buildCarrierBlock() {
      const allCarriers = _s.signals.flatMap(s => s.carriers.map(c => ({ ...c, signalTitle: s.title })));
      const seen = new Set(); const unique = allCarriers.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
      const badges = unique.map(c => {
        const st = CARRIER_STATUS[c.status] || CARRIER_STATUS.soft_focus;
        return `<div class="eco-carrier-badge eco-carrier-badge--${c.status}"
          data-carrier-id="${c.id}"
          role="button" tabindex="0"
          aria-label="${c.name} · ${st.label}: ${st.desc}. Tap to send a pulse.">
          <div class="eco-carrier-badge__dot" aria-hidden="true"></div>
          <span class="eco-carrier-badge__label">${c.name}</span>
          <span class="eco-carrier-badge__status">${st.label}</span>
        </div>`;
      }).join('') || '<p class="eco-empty" style="padding:var(--sp-2)">No active carriers.</p>';

      const legendRows = Object.entries(CARRIER_STATUS).map(([key, val]) => `
        <div class="eco-carrier-legend__row">
          <div class="eco-carrier-legend__dot eco-carrier-legend__dot--${key}" aria-hidden="true"></div>
          <div class="eco-carrier-legend__text">
            <span class="eco-carrier-legend__name">${val.label}</span>
            <span class="eco-carrier-legend__desc">${val.desc}</span>
          </div>
        </div>`).join('');

      return `<div class="eco-carrier-block">
        <div class="eco-carrier-block__header">
          <span class="eco-carrier-block__label">ACTIVE CARRIERS <span class="eco-carrier-block__hint">tap to pulse</span></span>
          <button class="eco-carrier-legend-btn" id="eco-carrier-legend-toggle" aria-expanded="false" aria-controls="eco-carrier-legend">What are these?</button>
        </div>
        <div class="eco-carrier-grid" role="list" aria-label="Active listeners">${badges}</div>
        <div class="eco-carrier-legend" id="eco-carrier-legend" role="region" aria-label="Carrier status legend">
          <p class="eco-carrier-legend__title">CARRIER STATUS LEGEND</p>
          <div class="eco-carrier-legend__rows">${legendRows}</div>
        </div>
      </div>`;
    },

    buildRecentActivity() {
      const rxns = _allRxns().sort((a, b) => b.ts - a.ts).slice(0, 5);
      if (rxns.length === 0) return '<div class="eco-recent-block"><p class="eco-recent-block__label">RECENT ACTIVITY</p><p class="eco-empty" style="padding:var(--sp-3)">No activity yet.</p></div>';
      const items = rxns.map(r => {
        const sig = _s.signals.find(s => s.id === r.signalId);
        return `<div class="eco-recent-item">
          <div class="eco-recent-item__dot" aria-hidden="true"></div>
          <span class="eco-recent-item__text">Reaction on <strong>${sig?.title || r.signalId}</strong>${r.isAnon ? ' · anon' : ''}</span>
          <span class="eco-recent-item__time">${_ago(r.ts)}</span>
        </div>`;
      }).join('');
      return `<div class="eco-recent-block">
        <p class="eco-recent-block__label">RECENT ACTIVITY</p>
        ${items}
      </div>`;
    },

    // ── Signals ───────────────────────────────────────────
    renderSignals() {
      const feed = document.getElementById('eco-feed');
      if (!feed) return;
      if (!_s.signals.length) { feed.innerHTML = '<p class="eco-empty">No signals detected.</p>'; return; }
      feed.innerHTML = _s.signals.map(sig => this.buildSignalCard(sig)).join('');

      // Event delegation for whisper inputs
      feed.addEventListener('keydown', e => {
        if (e.target.classList.contains('eco-whisper-input') && e.key === 'Enter') {
          const sigId = e.target.dataset.signalId;
          postWhisper(sigId, e.target.value);
          e.target.value = '';
        }
      });

      feed.querySelectorAll('.eco-signal-react-btn').forEach(btn =>
        btn.addEventListener('click', () => this.openModal(btn.dataset.signalId))
      );
      feed.querySelectorAll('.eco-signal-expand-btn').forEach(btn =>
        btn.addEventListener('click', () => this.toggleExpand(btn.dataset.signalId))
      );
      _s.expandedSignals.forEach(sid => {
        const stack = document.getElementById('eco-stack-' + sid);
        if (stack) { stack.classList.remove('eco-reaction-stack--collapsed'); this.renderStack(sid); }
      });

      // Start presence simulation for each signal
      _s.signals.forEach(sig => Presence.start(sig.id));
    },

    buildSignalCard(sig) {
      const rxns     = _s.reactions[sig.id] || [];
      const count    = rxns.length;
      const expanded = _s.expandedSignals.has(sig.id);
      const { score, trend, context } = sig.resonance;
      const pills    = count > 0
        ? rxns.slice(0, 4).map(r => `<div class="eco-mini-waveform-pill" style="width:${24 + Math.floor((r.waveformData?.[0] || 0.5) * 22)}px" aria-hidden="true"></div>`).join('')
        : '';

      // Init presence count if needed
      if (_s.presenceCounts[sig.id] === undefined) {
        _s.presenceCounts[sig.id] = 1 + Math.floor(Math.random() * 5);
      }
      const presenceCount = _s.presenceCounts[sig.id];
      const presenceText  = presenceCount === 0 ? 'quiet right now'
        : presenceCount === 1 ? '1 listening nearby'
        : `${presenceCount} listening nearby`;

      return `
<article class="eco-signal-card" data-signal-id="${sig.id}" aria-label="${sig.title}">
  <div class="eco-signal-header">
    <div class="eco-signal-meta">
      <span class="eco-signal-id">${sig.title}</span>
      <span class="eco-signal-time">${_ago(sig.ts)}</span>
    </div>
    <div class="eco-signal-resonance" title="Resonance: ${context}" aria-label="${score}% resonance, ${trend}">
      <span class="eco-signal-resonance__val">${score}%</span>
      <span class="eco-signal-resonance__trend eco-resonance-item__trend--${_trendClass(trend)}" aria-hidden="true">${_trendIcon(trend)}</span>
    </div>
    <div class="eco-signal-pulse" aria-hidden="true"></div>
  </div>

  <p class="eco-signal-content">&ldquo;${sig.content}&rdquo;</p>

  ${this.buildEchoThread(sig)}

  <div class="eco-presence-row" aria-live="polite">
    <div class="eco-presence-dot ${presenceCount > 0 ? 'is-active' : ''}" aria-hidden="true"></div>
    <span class="eco-presence-count" id="eco-presence-count-${sig.id}">${presenceText}</span>
    <div class="eco-presence-feed" id="eco-presence-feed-${sig.id}" aria-live="polite" aria-atomic="false"></div>
  </div>

  <div class="eco-signal-footer">
    <button class="eco-signal-react-btn" data-signal-id="${sig.id}" aria-label="Record a voice reaction to ${sig.title}">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor"/>
        <path d="M5 9v1a5 5 0 0 0 10 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="7" y1="18" x2="13" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      React
    </button>
    ${count > 0 ? `
    <button class="eco-signal-expand-btn ${expanded ? 'is-expanded' : ''}"
      data-signal-id="${sig.id}"
      aria-expanded="${expanded}"
      aria-controls="eco-stack-${sig.id}"
      aria-label="${expanded ? 'Collapse' : 'Show'} ${count} reaction${count !== 1 ? 's' : ''}">
      <div class="eco-reaction-pill-preview" aria-hidden="true">${pills}</div>
      <span class="eco-reaction-count">${count}</span>
      <svg class="eco-chevron ${expanded ? 'is-flipped' : ''}" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>` : ''}
    <div class="eco-whisper-input-wrap">
      <input type="text" class="eco-whisper-input"
        id="eco-whisper-input-${sig.id}"
        data-signal-id="${sig.id}"
        placeholder="whisper…" maxlength="80"
        aria-label="Whisper something — fades in 2 minutes" />
    </div>
  </div>

  <div class="eco-whisper-list" id="eco-whisper-list-${sig.id}" aria-live="polite" aria-atomic="false"></div>

  <div class="eco-reaction-stack eco-reaction-stack--collapsed" id="eco-stack-${sig.id}" aria-label="Voice reactions for ${sig.title}"></div>
</article>`;
    },

    buildEchoThread(sig) {
      const echoes = sig.echoes || [];
      if (!echoes.length) return '';
      const MAX_VISIBLE = 3;
      const shown = echoes.slice(0, MAX_VISIBLE);
      const moreCount = echoes.length - MAX_VISIBLE;
      const items = shown.map((e, idx) => `
        <div class="eco-echo-item" style="--echo-idx:${idx}">
          <span class="eco-echo-text">&ldquo;${_escapeHtml(e.text)}&rdquo;</span>
          <span class="eco-echo-sep" aria-hidden="true">—</span>
          <span class="eco-echo-author">${_escapeHtml(e.author)}</span>
          <span class="eco-echo-time">${_ago(e.ts)}</span>
        </div>`).join('');
      return `<div class="eco-echo-thread" aria-label="Text echoes for ${sig.title}">
        ${items}
        ${moreCount > 0 ? `<span class="eco-echo-more">+${moreCount} more</span>` : ''}
      </div>`;
    },

    toggleExpand(signalId) {
      if (_s.expandedSignals.has(signalId)) {
        _s.expandedSignals.delete(signalId);
        document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"]`)?.classList.remove('is-expanded');
        document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"]`)?.setAttribute('aria-expanded','false');
        document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"] .eco-chevron`)?.classList.remove('is-flipped');
        document.getElementById('eco-stack-' + signalId)?.classList.add('eco-reaction-stack--collapsed');
      } else {
        _s.expandedSignals.add(signalId);
        const btn = document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"]`);
        if (btn) { btn.classList.add('is-expanded'); btn.setAttribute('aria-expanded','true'); btn.querySelector('.eco-chevron')?.classList.add('is-flipped'); }
        const stack = document.getElementById('eco-stack-' + signalId);
        if (stack) { stack.classList.remove('eco-reaction-stack--collapsed'); this.renderStack(signalId); }
      }
    },

    // ── Stack ─────────────────────────────────────────────
    renderStack(signalId) {
      const container = document.getElementById('eco-stack-' + signalId);
      if (!container) return;
      const rxns = _sortedRxns(signalId).filter(r => !r.sentToDrift && r.state !== 'archived' && r.state !== 'private');
      if (!rxns.length) { container.innerHTML = '<p class="eco-stack-empty">No reactions yet — be the first.</p>'; return; }
      container.innerHTML = rxns.map(r => this.buildPill(r, signalId)).join('');
      rxns.forEach(r => {
        const canvas = document.getElementById('eco-wvf-' + r.id);
        if (canvas && r.waveformData?.length) {
          const isSealed = r.state === 'sealed' && !_s.unsealedRxns.has(r.id);
          if (!isSealed) {
            const isPlaying = _s.activePlayer?.reactionId === r.id;
            Waveform.draw(canvas, r.waveformData, {
              color: CLR_PINK, glowColor: CLR_PINK_DIM,
              progress: isPlaying ? (_s.activePlayer?.audio?.currentTime / (_s.activePlayer?.audio?.duration || 1)) : -1,
              activeColor: CLR_CYAN,
            });
          }
        }
      });
      container.querySelectorAll('.eco-rxn-play-btn').forEach(btn => {
        const rxn = rxns.find(r => r.id === btn.dataset.rxnId);
        if (rxn) btn.addEventListener('click', () => Player.play(rxn, signalId));
      });
      container.querySelectorAll('.eco-sealed-overlay').forEach(el => {
        const rxnId = el.dataset.rxnId;
        el.addEventListener('click', () => unsealReaction(rxnId));
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') unsealReaction(rxnId); });
      });
      container.querySelectorAll('.eco-rxn-fav-btn').forEach(btn =>
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.rxnId, signalId))
      );
      container.querySelectorAll('.eco-rxn-drift-btn').forEach(btn =>
        btn.addEventListener('click', () => sendToDrift(btn.dataset.rxnId, signalId))
      );
      container.querySelectorAll('.eco-rxn-archive-btn').forEach(btn =>
        btn.addEventListener('click', () => archiveReaction(btn.dataset.rxnId, signalId))
      );
      container.querySelectorAll('.eco-rxn-delete-btn').forEach(btn =>
        btn.addEventListener('click', () => deleteReaction(btn.dataset.rxnId, signalId))
      );
    },

    buildPill(rxn, signalId) {
      const isPlaying = _s.activePlayer?.reactionId === rxn.id;
      const isSealed  = rxn.state === 'sealed' && !_s.unsealedRxns.has(rxn.id);
      const stateCls  = rxn.state !== 'open' ? ` eco-reaction-pill--${rxn.state}` : '';
      const dur       = rxn.durationSec ? `<span class="eco-rxn-duration" title="Reaction length">${rxn.durationSec}s</span>` : '';
      const replayStr = rxn.replays > 0  ? `<span class="eco-rxn-replays" title="Times played">↺ ${rxn.replays} play${rxn.replays !== 1 ? 's' : ''}</span>` : '';
      const anonTag   = rxn.isAnon   ? '<span class="eco-rxn-tag" title="Posted anonymously">anon</span>' : '';
      const filterTag = rxn.filter !== 'none' ? `<span class="eco-rxn-tag" title="Voice filter applied">${rxn.filter}</span>` : '';
      const playIcon  = isPlaying
        ? `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>`
        : `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l12 6-12 6V4z"/></svg>`;
      const stateTag  = rxn.state !== 'open' ? `<span class="eco-state-tag eco-state-tag--${rxn.state}">${rxn.state.toUpperCase()}</span>` : '';

      return `
<div class="eco-reaction-pill${isPlaying ? ' is-playing' : ''}${stateCls}"
  id="eco-rxn-${rxn.id}" data-rxn-id="${rxn.id}"
  ${rxn.state === 'lost' ? 'aria-label="Lost reaction — audio corrupted"' : ''}>

  ${isSealed ? `
  <div class="eco-sealed-overlay" data-rxn-id="${rxn.id}" role="button" tabindex="0"
    aria-label="Tap to break seal and reveal this voice reaction">
    <span class="eco-sealed-overlay__icon" aria-hidden="true">🔒</span>
    <span class="eco-sealed-overlay__text">TAP TO BREAK SEAL</span>
  </div>` : ''}

  ${rxn.state !== 'lost' ? `
  <button class="eco-rxn-play-btn${isPlaying ? ' is-playing' : ''}"
    data-rxn-id="${rxn.id}" data-signal-id="${signalId}"
    aria-label="${isPlaying ? 'Stop' : 'Play'} voice reaction, recorded ${_ago(rxn.ts)}"
    ${isSealed ? 'tabindex="-1" aria-hidden="true"' : ''}>${playIcon}
  </button>` : ''}

  <div class="eco-rxn-waveform-wrap">
    <canvas class="eco-rxn-waveform${isSealed ? ' eco-sealed-waveform' : ''}"
      id="eco-wvf-${rxn.id}"
      aria-hidden="true"></canvas>
    <div class="eco-rxn-progress-line" id="eco-prog-${rxn.id}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Playback progress"></div>
  </div>

  <div class="eco-rxn-meta">
    <span class="eco-rxn-time">${_ago(rxn.ts)}</span>
    ${dur}${replayStr}${anonTag}${filterTag}
    ${stateTag}
  </div>

  <div class="eco-rxn-actions" ${isSealed ? 'aria-hidden="true"' : ''}>
    <button class="eco-rxn-fav-btn${rxn.isFavorite ? ' is-fav' : ''}"
      data-rxn-id="${rxn.id}" data-signal-id="${signalId}"
      aria-label="${rxn.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
      ${isSealed ? 'tabindex="-1"' : ''}>
      <svg viewBox="0 0 16 16" fill="${rxn.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 13.4C3.5 10.4 1 8 1 5.5A3.5 3.5 0 0 1 7.5 3c.18 0 .35.02.5.04A3.5 3.5 0 0 1 15 5.5C15 8 12.5 10.4 8 13.4z"/></svg>
    </button>
    <button class="eco-rxn-drift-btn" data-rxn-id="${rxn.id}" data-signal-id="${signalId}"
      aria-label="Send to Drift — detach from signal and float free"
      ${isSealed ? 'tabindex="-1"' : ''}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 8l6-6 6 6M8 2v10" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14h8" stroke-linecap="round"/></svg>
    </button>
    <button class="eco-rxn-archive-btn" data-rxn-id="${rxn.id}" data-signal-id="${signalId}"
      aria-label="${rxn.state === 'archived' ? 'Restore from archive' : 'Archive this reaction'}"
      ${isSealed ? 'tabindex="-1"' : ''}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1" y="3" width="14" height="3" rx="1"/><path d="M2 6v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6" stroke-linecap="round"/><path d="M6 10h4" stroke-linecap="round"/></svg>
    </button>
    <button class="eco-rxn-delete-btn" data-rxn-id="${rxn.id}" data-signal-id="${signalId}"
      aria-label="Delete this reaction permanently"
      ${isSealed ? 'tabindex="-1"' : ''}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  ${isPlaying ? '<div class="eco-rxn-glow-pulse" aria-hidden="true"></div>' : ''}
</div>`;
    },

    // ── Play state helpers ─────────────────────────────────
    setPlayState(rxnId, playing) {
      const pill = document.getElementById('eco-rxn-' + rxnId);
      if (!pill) return;
      pill.classList.toggle('is-playing', playing);
      const btn = pill.querySelector('.eco-rxn-play-btn');
      if (btn) {
        btn.classList.toggle('is-playing', playing);
        btn.innerHTML = playing
          ? `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>`
          : `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l12 6-12 6V4z"/></svg>`;
        btn.setAttribute('aria-label', playing ? 'Stop voice reaction' : 'Play voice reaction');
      }
      let glow = pill.querySelector('.eco-rxn-glow-pulse');
      if (playing && !glow) { glow = document.createElement('div'); glow.className = 'eco-rxn-glow-pulse'; glow.setAttribute('aria-hidden','true'); pill.appendChild(glow); }
      else if (!playing && glow) glow.remove();
    },

    updateProgress(rxnId, progress) {
      const bar = document.getElementById('eco-prog-' + rxnId);
      if (bar) { bar.style.width = (progress * 100) + '%'; bar.setAttribute('aria-valuenow', Math.round(progress * 100)); }
      const canvas = document.getElementById('eco-wvf-' + rxnId);
      if (!canvas) return;
      let rxn = null;
      for (const sid of Object.keys(_s.reactions)) { rxn = _s.reactions[sid].find(r => r.id === rxnId); if (rxn) break; }
      if (rxn?.waveformData?.length) Waveform.draw(canvas, rxn.waveformData, { progress, color: CLR_PINK, activeColor: CLR_CYAN, glowColor: CLR_PINK_DIM });
    },

    // ── Modal ─────────────────────────────────────────────
    openModal(signalId) {
      Player.stop(); _s.recordingSignalId = signalId;
      const sig = _s.signals.find(s => s.id === signalId);
      const titleEl = document.getElementById('eco-record-title');
      if (titleEl && sig) titleEl.textContent = `REACT · ${sig.title}`;
      const modal = document.getElementById('eco-record-modal');
      if (!modal) return;
      modal.removeAttribute('hidden');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      this.showScreen('idle');
      document.querySelectorAll('.eco-filter-btn').forEach(b => { b.classList.toggle('is-active', b.dataset.filter === 'none'); b.setAttribute('aria-pressed', String(b.dataset.filter === 'none')); });
      _s.pendingFilter = 'none'; _s.pendingAnon = false; _s.pendingSeal = false;
      const anonChk = document.getElementById('eco-anon-check'); if (anonChk) anonChk.checked = false;
      const sealChk = document.getElementById('eco-seal-check'); if (sealChk) sealChk.checked = false;
    },

    closeModal() {
      if (_s.recording) Recorder.stop();
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      const modal = document.getElementById('eco-record-modal');
      if (!modal) return;
      modal.classList.remove('is-open');
      setTimeout(() => modal.setAttribute('hidden', ''), 360);
      _s.recordingSignalId = null;
    },

    showScreen(name) {
      ['idle','recording','preview'].forEach(s => {
        const el = document.getElementById('eco-screen-' + s);
        if (el) { el.hidden = (s !== name); if (s === name) el.removeAttribute('hidden'); }
      });
    },

    previewPlay() {
      if (!_s.previewUrl) return;
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      const audio = new Audio(_s.previewUrl); _s.previewAudio = audio;
      const canvas = document.getElementById('eco-preview-waveform');
      const btn    = document.getElementById('eco-preview-play');
      const tick = () => {
        if (audio.paused) return;
        const prog = audio.currentTime / (audio.duration || 1);
        if (canvas && _s.previewWaveform.length) Waveform.draw(canvas, _s.previewWaveform, { progress: prog, color: CLR_CYAN, activeColor: CLR_PINK, glowColor: 'rgba(0,229,255,0.4)' });
        requestAnimationFrame(tick);
      };
      audio.onplay  = () => { if (btn) btn.setAttribute('aria-label', 'Stop preview playback'); };
      audio.onended = () => {
        if (btn) btn.setAttribute('aria-label', 'Play back your recording');
        if (canvas && _s.previewWaveform.length) Waveform.draw(canvas, _s.previewWaveform, { color: CLR_CYAN, glowColor: 'rgba(0,229,255,0.4)' });
        _s.previewAudio = null;
      };
      audio.play().then(tick).catch(() => {});
    },

    retryRecording() {
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      _s.previewBlob = null; _s.previewUrl = null; _s.previewWaveform = []; _s.previewDurationSec = 0;
      this.showScreen('idle');
    },

    // ── Drift ─────────────────────────────────────────────
    renderDrift() {
      const field = document.getElementById('eco-drift-field');
      if (!field) return;
      const drifted = _allRxns().filter(r => r.sentToDrift);
      if (!drifted.length) { field.innerHTML = '<p class="eco-empty eco-drift-empty">No reactions have drifted yet.<br>Send one from the Signals tab.</p>'; return; }
      field.innerHTML = drifted.map((r, i) => {
        const x = 5 + (i * 19 + 7) % 82, y = 5 + (i * 31 + 13) % 75;
        return `<div class="eco-drift-fragment" style="left:${x}%;top:${y}%" data-rxn-id="${r.id}" data-signal-id="${r.signalId}" role="button" tabindex="0" aria-label="Play drifted reaction from ${_ago(r.ts)}">
          <canvas class="eco-drift-waveform" id="eco-drift-wvf-${r.id}" width="60" height="20" aria-hidden="true"></canvas>
          <span class="eco-drift-time">${_ago(r.ts)}</span>
        </div>`;
      }).join('');
      drifted.forEach(r => {
        const canvas = document.getElementById('eco-drift-wvf-' + r.id);
        if (canvas && r.waveformData?.length) Waveform.draw(canvas, r.waveformData, { color: CLR_VIOLET, glowColor: 'rgba(157,78,221,0.4)' });
        const frag = document.querySelector(`.eco-drift-fragment[data-rxn-id="${r.id}"]`);
        if (frag) {
          frag.addEventListener('click',   () => Player.play(r, r.signalId));
          frag.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') Player.play(r, r.signalId); });
        }
      });
    },

    // ── Unsent ────────────────────────────────────────────
    renderUnsent() {
      const container = document.getElementById('eco-unsent');
      if (!container) return;
      if (!_s.unsent.length) {
        container.innerHTML = '<p class="eco-empty">No unsent drafts.<br>Record a reaction and choose "Save Draft" to hold it here before posting.</p>'; return;
      }
      container.innerHTML = _s.unsent.map(d => {
        const sig = _s.signals.find(s => s.id === d.signalId);
        return `<div class="eco-unsent-item" id="eco-unsent-${d.id}">
          <div class="eco-unsent-header">
            <span class="eco-unsent-signal">${sig?.title || d.signalId}</span>
            <span class="eco-unsent-time">${_ago(d.ts)}</span>
          </div>
          <span class="eco-unsent-duration">${d.durationSec || '?'}s recorded${d.pendingSeal ? ' · sealed' : ''}${d.isAnon ? ' · anon' : ''}</span>
          <canvas class="eco-unsent-waveform" id="eco-unsent-wvf-${d.id}" aria-hidden="true"></canvas>
          <div class="eco-unsent-actions">
            <button class="eco-btn eco-btn--primary" data-draft-id="${d.id}" aria-label="Post this draft">Post Reaction</button>
            <button class="eco-btn eco-btn--ghost eco-unsent-delete" data-draft-id="${d.id}" aria-label="Discard this draft">Discard</button>
          </div>
        </div>`;
      }).join('');
      _s.unsent.forEach(d => {
        const canvas = document.getElementById('eco-unsent-wvf-' + d.id);
        if (canvas && d.waveformData?.length) Waveform.draw(canvas, d.waveformData, { color: CLR_VIOLET, glowColor: 'rgba(157,78,221,0.4)' });
      });
      container.querySelectorAll('.eco-btn--primary').forEach(btn =>
        btn.addEventListener('click', () => postFromUnsent(btn.dataset.draftId))
      );
      container.querySelectorAll('.eco-unsent-delete').forEach(btn =>
        btn.addEventListener('click', () => deleteUnsent(btn.dataset.draftId))
      );
    },

    // ── Capsules ──────────────────────────────────────────
    renderCapsules() {
      const container = document.getElementById('eco-capsules');
      if (!container) return;
      const all      = _allRxns();
      const archived = all.filter(r => r.state === 'archived');
      const priv     = all.filter(r => r.state === 'private');
      const lost     = all.filter(r => r.state === 'lost');

      const section = (label, rxns) => {
        if (!rxns.length) return '';
        const pills = rxns.map(r => {
          const sig = _s.signals.find(s => s.id === r.signalId);
          return `<div class="eco-reaction-pill eco-reaction-pill--${r.state}" id="eco-rxn-${r.id}" data-rxn-id="${r.id}" aria-label="${r.state} reaction from ${sig?.title || r.signalId}">
            <div class="eco-rxn-waveform-wrap">
              <canvas class="eco-rxn-waveform" id="eco-cap-wvf-${r.id}" aria-hidden="true"></canvas>
            </div>
            <div class="eco-rxn-meta">
              <span class="eco-rxn-time">${_ago(r.ts)}</span>
              ${r.durationSec ? `<span class="eco-rxn-duration">${r.durationSec}s</span>` : ''}
              <span class="eco-state-tag eco-state-tag--${r.state}">${r.state.toUpperCase()}</span>
              <span class="eco-rxn-tag">${sig?.title || r.signalId}</span>
            </div>
            ${r.state === 'archived' ? `<div class="eco-rxn-actions">
              <button class="eco-rxn-archive-btn" data-rxn-id="${r.id}" data-signal-id="${r.signalId}" aria-label="Restore from archive">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 5l7-4 7 4M1 5l7 4 7-4M8 9v6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>` : ''}
          </div>`;
        }).join('');
        return `<p class="eco-capsules-section-label">${label}</p>${pills}`;
      };

      // Forming capsules block
      const now = Date.now();
      const formingHtml = `<p class="eco-capsules-section-label">FORMING — not yet open</p>
        ${DEMO_FORMING_CAPSULES.map(cap => {
          const sig = _s.signals.find(s => s.id === cap.signalId);
          const remaining = cap.openAt - now;
          const pct = Math.max(0, Math.min(100, 100 - (remaining / (cap.openAt - (now - 86400000 * 3))) * 100));
          return `<div class="eco-forming-capsule" aria-label="Forming capsule: ${cap.title}">
            <div class="eco-forming-capsule__header">
              <span class="eco-forming-capsule__title">${cap.title}</span>
              <span class="eco-forming-capsule__signal">${sig?.title || cap.signalId}</span>
            </div>
            <div class="eco-capsule-progress-wrap">
              <div class="eco-capsule-progress-bar" style="width:${pct}%" aria-hidden="true"></div>
            </div>
            <span class="eco-capsule-countdown" id="eco-cap-countdown-${cap.id}">forms in ${_formatCountdown(remaining)}</span>
          </div>`;
        }).join('')}`;

      const hasUserCapsules = archived.length || priv.length || lost.length;

      if (!hasUserCapsules) {
        container.innerHTML = formingHtml + `<p class="eco-empty" style="margin-top:var(--sp-4)">No personal capsules yet.<br>Archive a reaction or it will appear here when lost.</p>`;
      } else {
        container.innerHTML =
          formingHtml +
          section('ARCHIVED — stored, always accessible', archived) +
          section('PRIVATE — only you can hear these', priv) +
          section('LOST — corrupted or expired traces', lost);
      }

      // Draw waveforms
      [...archived, ...priv, ...lost].forEach(r => {
        const canvas = document.getElementById('eco-cap-wvf-' + r.id);
        if (canvas && r.waveformData?.length) {
          const c = r.state === 'archived' ? 'rgba(255,255,255,0.3)' : r.state === 'private' ? 'rgba(255,215,0,0.4)' : 'rgba(255,82,82,0.35)';
          Waveform.draw(canvas, r.waveformData, { color: c, glowColor: c });
        }
      });
      container.querySelectorAll('.eco-rxn-archive-btn').forEach(btn =>
        btn.addEventListener('click', () => archiveReaction(btn.dataset.rxnId, btn.dataset.signalId))
      );
    },

    // ── Stats ─────────────────────────────────────────────
    updateStats() {
      const el = document.getElementById('eco-stats');
      if (!el) return;
      const all    = _allRxns();
      const traces = all.filter(r => !r.sentToDrift && r.state === 'open').length;
      const plays  = all.reduce((s, r) => s + (r.replays || 0), 0);
      const unsent = _s.unsent.length;
      el.innerHTML = `
        <span class="eco-stat"><span class="eco-stat__val">${traces}</span><span class="eco-stat__key">traces</span></span>
        <span class="eco-stat"><span class="eco-stat__val">${plays}</span><span class="eco-stat__key">plays</span></span>
        ${unsent ? `<span class="eco-stat"><span class="eco-stat__val">${unsent}</span><span class="eco-stat__key">unsent</span></span>` : ''}`;
    },

    // ── Onboarding ────────────────────────────────────────
    showOnboarding() {
      const el = document.getElementById('eco-onboarding');
      if (el) { el.removeAttribute('hidden'); el.focus?.(); }
    },
    dismissOnboarding() {
      const el = document.getElementById('eco-onboarding');
      if (el) el.setAttribute('hidden', '');
      Store.markOnboardSeen();
    },

    // ── Toast ─────────────────────────────────────────────
    toast(msg) {
      const el = document.getElementById('eco-toast');
      if (!el) return;
      el.textContent = msg; el.classList.add('is-visible');
      clearTimeout(el._tid); el._tid = setTimeout(() => el.classList.remove('is-visible'), 2800);
    },
  };

  // ─── INIT ─────────────────────────────────────────────────
  function _init() {
    _s.signals   = Store.loadSignals() || DEMO_SIGNALS;
    if (!Store.loadSignals()) Store.saveSignals(_s.signals);
    // Ensure echoes array exists on signals (for legacy stored data)
    _s.signals.forEach(sig => { if (!sig.echoes) sig.echoes = []; });
    _s.reactions = Store.loadReactions();
    _s.unsent    = Store.loadUnsent();
    Object.keys(_s.reactions).forEach(sid => {
      (_s.reactions[sid] || []).forEach(r => {
        if (r.audioData && !r.audioUrl) r.audioUrl = _base64ToUrl(r.audioData);
      });
    });
  }

  function mount(container) {
    if (!container) return;
    _init(); UI.mount(container);
    Room.start();
    const controls = document.getElementById('eco-controls');
    if (controls) controls.style.display = 'none';
  }

  function onClose() {
    Player.stop();
    if (_s.recording) Recorder.stop();
    Presence.stopAll();
    Room.stop();
    _stopCapsuleCountdown();
  }

  return { mount, onClose };
})();

window.EcosphereVR = EcosphereVR;
