'use strict';

/* ═══════════════════════════════════════════════════════════
   ECOSPHERE — Voice Reaction System v1.0
   Audio-first reactions: waveform pills, live recording,
   playback engine, drift field, localStorage store.
═══════════════════════════════════════════════════════════ */

const EcosphereVR = (() => {

  // ─── CONSTANTS ────────────────────────────────────────────
  const SK_SIGNALS   = 'eco_signals';
  const SK_REACTIONS = 'eco_reactions';
  const MAX_REC_MS   = 5000;
  const CLR_PINK     = '#ff2d78';
  const CLR_PINK_DIM = 'rgba(255,45,120,0.45)';
  const CLR_CYAN     = '#00e5ff';
  const CLR_VIOLET   = '#9d4edd';

  // ─── DEMO SIGNALS ─────────────────────────────────────────
  const DEMO_SIGNALS = [
    { id:'sig-1', title:'Signal 001', content:'something about this moment that doesn\'t translate to words', ts: Date.now() - 86400000 * 2 },
    { id:'sig-2', title:'Signal 002', content:'the city breathes differently at 3am', ts: Date.now() - 86400000 },
    { id:'sig-3', title:'Signal 003', content:'patterns that feel too familiar to be coincidence', ts: Date.now() - 10800000 },
    { id:'sig-4', title:'Signal 004', content:'a frequency nobody asked about but everybody hears', ts: Date.now() - 2700000 },
    { id:'sig-5', title:'Signal 005', content:'drift into the static and stay there', ts: Date.now() - 300000 },
  ];

  // ─── STATE ────────────────────────────────────────────────
  const _s = {
    signals: [],
    reactions: {},        // { [signalId]: Reaction[] }
    activeTab: 'feed',
    sortMode: 'newest',   // 'newest' | 'most-replayed'
    expandedSignals: new Set(),
    // Recording
    recording: false,
    recordingSignalId: null,
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    analyserNode: null,
    audioCtx: null,
    liveMeterRaf: null,
    recordTimerInterval: null,
    // Preview
    previewBlob: null,
    previewUrl: null,
    previewWaveform: [],
    previewAudio: null,
    // Options
    pendingAnon: false,
    pendingFilter: 'none',
    // Playback
    activePlayer: null,   // { audio, reactionId, raf }
  };

  // ─── STORAGE ──────────────────────────────────────────────
  const Store = {
    loadSignals() {
      try { return JSON.parse(localStorage.getItem(SK_SIGNALS)); } catch(e) { return null; }
    },
    saveSignals(sigs) {
      try { localStorage.setItem(SK_SIGNALS, JSON.stringify(sigs)); } catch(e) {}
    },
    loadReactions() {
      try { return JSON.parse(localStorage.getItem(SK_REACTIONS)) || {}; } catch(e) { return {}; }
    },
    saveReactions(rxns) {
      try {
        localStorage.setItem(SK_REACTIONS, JSON.stringify(rxns));
      } catch(e) {
        // Storage full: keep last 8 per signal
        const trimmed = {};
        Object.keys(rxns).forEach(sid => { trimmed[sid] = rxns[sid].slice(0, 8); });
        try { localStorage.setItem(SK_REACTIONS, JSON.stringify(trimmed)); } catch(e2) {}
      }
    },
  };

  // ─── WAVEFORM ENGINE ──────────────────────────────────────
  const Waveform = {
    async analyze(blob, samples = 40) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = await ctx.decodeAudioData(arrayBuffer);
        const data = buf.getChannelData(0);
        const block = Math.floor(data.length / samples);
        const peaks = Array.from({ length: samples }, (_, i) => {
          let max = 0;
          for (let j = 0; j < block; j++) {
            const v = Math.abs(data[i * block + j]);
            if (v > max) max = v;
          }
          return max;
        });
        const maxP = Math.max(...peaks, 0.01);
        await ctx.close();
        return peaks.map(p => p / maxP);
      } catch(e) {
        // Fallback: shaped random waveform (voice-like envelope)
        return Array.from({ length: samples }, (_, i) => {
          const env = Math.sin((i / samples) * Math.PI); // bell shape
          return (0.15 + env * 0.65 + Math.random() * 0.2);
        });
      }
    },

    draw(canvas, data, opts = {}) {
      if (!canvas || !data || data.length === 0) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth  || canvas.width  / dpr;
      const h = canvas.offsetHeight || canvas.height / dpr;
      // Set logical canvas size
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);

      const {
        color       = CLR_PINK,
        activeColor = CLR_CYAN,
        glowColor   = CLR_PINK_DIM,
        progress    = -1,
      } = opts;

      ctx.clearRect(0, 0, w, h);
      const n = data.length;
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
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barW, barH, Math.min(barW / 2, 2));
        } else {
          ctx.rect(x, y, barW, barH);
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    },

    drawMeter(canvas, analyser) {
      if (!canvas || !analyser) return;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      const bars = 20;
      const block = Math.floor(buf.length / bars);
      const peaks = Array.from({ length: bars }, (_, i) => {
        let s = 0;
        for (let j = 0; j < block; j++) s += buf[i * block + j];
        return (s / block) / 255;
      });
      this.draw(canvas, peaks, { color: CLR_PINK, glowColor: CLR_PINK_DIM });
    },
  };

  // ─── RECORDER ─────────────────────────────────────────────
  const Recorder = {
    async start(signalId) {
      if (_s.recording) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        UI.toast('Microphone not supported in this browser.'); return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        _s.stream = stream;
        _s.audioChunks = [];
        _s.recordingSignalId = signalId;
        _s.recording = true;

        // Live analyser for meter
        _s.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const src = _s.audioCtx.createMediaStreamSource(stream);
        const analyser = _s.audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        _s.analyserNode = analyser;

        const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg','audio/mp4']
          .find(t => { try { return MediaRecorder.isTypeSupported(t); } catch(e) { return false; } }) || '';

        _s.mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
        _s.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) _s.audioChunks.push(e.data); };
        _s.mediaRecorder.onstop = () => this._handleStop();
        _s.mediaRecorder.start(100);

        // Auto-stop timer
        _s.recordTimerInterval = setInterval(() => this._tickTimer(), 100);
        setTimeout(() => this.stop(), MAX_REC_MS);

        UI.showScreen('recording');
        this._startMeter();
      } catch(e) {
        _s.recording = false;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          UI.toast('Microphone access denied.');
        } else {
          UI.toast('Could not start recording. Check microphone.');
        }
      }
    },

    _elapsed: 0,
    _tickTimer() {
      if (!_s.recording) { clearInterval(_s.recordTimerInterval); return; }
      this._elapsed += 100;
      const timerEl = document.getElementById('eco-record-timer');
      if (timerEl) timerEl.textContent = (this._elapsed / 1000).toFixed(1) + 's';
    },

    stop() {
      if (!_s.recording) return;
      _s.recording = false;
      clearInterval(_s.recordTimerInterval);
      this._elapsed = 0;
      if (_s.liveMeterRaf) { cancelAnimationFrame(_s.liveMeterRaf); _s.liveMeterRaf = null; }
      if (_s.mediaRecorder?.state !== 'inactive') _s.mediaRecorder.stop();
    },

    async _handleStop() {
      const mime = _s.mediaRecorder?.mimeType || 'audio/webm';
      const blob = new Blob(_s.audioChunks, { type: mime });
      if (_s.stream) { _s.stream.getTracks().forEach(t => t.stop()); _s.stream = null; }
      if (_s.audioCtx) { try { await _s.audioCtx.close(); } catch(e) {} _s.audioCtx = null; }
      _s.analyserNode = null;

      _s.previewBlob = blob;
      _s.previewUrl  = URL.createObjectURL(blob);
      _s.previewWaveform = await Waveform.analyze(blob);

      UI.showScreen('preview');
      const canvas = document.getElementById('eco-preview-waveform');
      if (canvas) Waveform.draw(canvas, _s.previewWaveform, { color: CLR_CYAN, glowColor: 'rgba(0,229,255,0.4)' });
    },

    _startMeter() {
      const canvas = document.getElementById('eco-record-meter');
      const tick = () => {
        if (!_s.recording) return;
        Waveform.drawMeter(canvas, _s.analyserNode);
        _s.liveMeterRaf = requestAnimationFrame(tick);
      };
      tick();
    },
  };

  // ─── PLAYER ───────────────────────────────────────────────
  const Player = {
    play(rxn, signalId) {
      // Toggle if same reaction
      if (_s.activePlayer?.reactionId === rxn.id) { this.stop(); return; }
      this.stop();

      // Reconstruct URL if only audioData
      if (!rxn.audioUrl && rxn.audioData) {
        rxn.audioUrl = _base64ToUrl(rxn.audioData);
      }
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
        UI.setPlayState(rxn.id, false);
        UI.updateProgress(rxn.id, 0);
        cancelAnimationFrame(_s.activePlayer?.raf);
        _s.activePlayer = null;
        // Refresh replay count in meta
        const replayEl = document.querySelector(`#eco-rxn-${rxn.id} .eco-rxn-replays`);
        if (replayEl) replayEl.textContent = `↺ ${rxn.replays}`;
        else {
          const meta = document.querySelector(`#eco-rxn-${rxn.id} .eco-rxn-meta`);
          if (meta && rxn.replays > 0) {
            const span = document.createElement('span');
            span.className = 'eco-rxn-replays';
            span.textContent = `↺ ${rxn.replays}`;
            meta.insertBefore(span, meta.children[1]);
          }
        }
      };
      audio.onerror = () => {
        UI.setPlayState(rxn.id, false);
        _s.activePlayer = null;
        UI.toast('Could not play this reaction.');
      };

      _s.activePlayer = { audio, reactionId: rxn.id, signalId, raf: null };
      audio.play().catch(() => { _s.activePlayer = null; });
    },

    stop() {
      if (!_s.activePlayer) return;
      const { audio, reactionId, raf } = _s.activePlayer;
      cancelAnimationFrame(raf);
      audio.pause();
      audio.src = '';
      UI.setPlayState(reactionId, false);
      UI.updateProgress(reactionId, 0);
      _s.activePlayer = null;
    },

    stopOnRouteChange() {
      this.stop();
    },
  };

  // ─── HELPERS ──────────────────────────────────────────────
  function _blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  function _base64ToUrl(b64) {
    try {
      const [header, data] = b64.split(',');
      const mime = header.match(/:(.*?);/)[1];
      const bytes = atob(data);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return URL.createObjectURL(new Blob([arr], { type: mime }));
    } catch(e) { return null; }
  }

  function _ago(ts) {
    const d = Date.now() - ts;
    if (d < 60000)     return 'just now';
    if (d < 3600000)   return Math.floor(d / 60000) + 'm';
    if (d < 86400000)  return Math.floor(d / 3600000) + 'h';
    return Math.floor(d / 86400000) + 'd';
  }

  function _sortedRxns(signalId) {
    const arr = _s.reactions[signalId] || [];
    if (_s.sortMode === 'most-replayed') {
      return [...arr].sort((a, b) => (b.replays || 0) - (a.replays || 0));
    }
    return [...arr].sort((a, b) => b.ts - a.ts);
  }

  // ─── ACTIONS ──────────────────────────────────────────────
  async function postReaction() {
    if (!_s.previewBlob || !_s.recordingSignalId) return;
    const postBtn = document.getElementById('eco-post-btn');
    if (postBtn) { postBtn.disabled = true; postBtn.textContent = 'Posting…'; }

    const audioData = await _blobToBase64(_s.previewBlob);
    const rxn = {
      id:          'rxn-' + Date.now(),
      signalId:    _s.recordingSignalId,
      audioData,
      audioUrl:    _s.previewUrl,
      waveformData: _s.previewWaveform,
      ts:          Date.now(),
      replays:     0,
      isAnon:      _s.pendingAnon,
      filter:      _s.pendingFilter,
      isFavorite:  false,
      sentToDrift: false,
    };

    if (!_s.reactions[_s.recordingSignalId]) _s.reactions[_s.recordingSignalId] = [];
    _s.reactions[_s.recordingSignalId].unshift(rxn);
    Store.saveReactions(_s.reactions);

    const sid = _s.recordingSignalId;
    _s.previewBlob = null; _s.previewUrl = null; _s.previewWaveform = []; _s.recordingSignalId = null;
    if (postBtn) { postBtn.disabled = false; postBtn.textContent = 'Post Reaction'; }

    UI.closeModal();
    _s.expandedSignals.add(sid);
    UI.renderFeed();
    UI.updateStats();
    UI.toast('Reaction posted ✓');
  }

  function deleteReaction(rxnId, signalId) {
    if (!_s.reactions[signalId]) return;
    _s.reactions[signalId] = _s.reactions[signalId].filter(r => r.id !== rxnId);
    Store.saveReactions(_s.reactions);
    UI.renderStack(signalId);
    UI.updateStats();
  }

  function toggleFavorite(rxnId, signalId) {
    const rxn = (_s.reactions[signalId] || []).find(r => r.id === rxnId);
    if (!rxn) return;
    rxn.isFavorite = !rxn.isFavorite;
    Store.saveReactions(_s.reactions);
    // Update fav button
    const btn = document.querySelector(`#eco-rxn-${rxnId} .eco-rxn-fav-btn`);
    if (btn) {
      btn.classList.toggle('is-fav', rxn.isFavorite);
      const path = btn.querySelector('path');
      if (path) path.setAttribute('fill', rxn.isFavorite ? 'currentColor' : 'none');
      btn.setAttribute('aria-label', rxn.isFavorite ? 'Unfavorite' : 'Favorite');
    }
  }

  function sendToDrift(rxnId, signalId) {
    const rxn = (_s.reactions[signalId] || []).find(r => r.id === rxnId);
    if (!rxn || rxn.sentToDrift) return;
    rxn.sentToDrift = true;
    Store.saveReactions(_s.reactions);
    const pill = document.getElementById('eco-rxn-' + rxnId);
    if (pill) {
      pill.classList.add('is-drifting');
      setTimeout(() => UI.renderStack(signalId), 1200);
    }
    UI.toast('Drifted ↑ into the field');
  }

  // ─── UI ───────────────────────────────────────────────────
  const UI = {
    // ── Build HTML ────────────────────────────────────────
    buildHTML() {
      return `
<div class="eco-workspace" id="eco-workspace">
  <div class="eco-bg-waves" aria-hidden="true">
    ${[1,2,3,4,5,6].map(i => `<div class="eco-wave eco-wave--${i}"></div>`).join('')}
  </div>

  <div class="eco-header">
    <div class="eco-header__icon">🌊</div>
    <div class="eco-header__text">
      <h2 class="eco-title">ECOSPHERE</h2>
      <p class="eco-subtitle">Leave your audio trace</p>
    </div>
    <div class="eco-header__stats" id="eco-stats"></div>
  </div>

  <div class="eco-tabs" role="tablist">
    <button class="eco-tab-btn is-active" data-tab="feed" role="tab" aria-selected="true">Feed</button>
    <button class="eco-tab-btn" data-tab="favorites" role="tab" aria-selected="false">Favorites</button>
    <button class="eco-tab-btn" data-tab="drift" role="tab" aria-selected="false">Drift</button>
  </div>

  <div class="eco-controls" id="eco-controls">
    <span class="eco-controls__label">Sort:</span>
    <button class="eco-sort-btn is-active" data-sort="newest">Newest</button>
    <button class="eco-sort-btn" data-sort="most-replayed">Most Replayed</button>
  </div>

  <div class="eco-tab-pane is-active" data-tab="feed">
    <div class="eco-feed" id="eco-feed"></div>
  </div>
  <div class="eco-tab-pane" data-tab="favorites">
    <div class="eco-favorites" id="eco-favorites"></div>
  </div>
  <div class="eco-tab-pane" data-tab="drift">
    <div class="eco-drift"><div class="eco-drift__field" id="eco-drift-field"></div></div>
  </div>

  <div class="eco-modal" id="eco-record-modal" role="dialog" aria-modal="true" aria-label="Record voice reaction" hidden>
    <div class="eco-modal__backdrop" id="eco-modal-backdrop"></div>
    <div class="eco-modal__panel">
      <div class="eco-modal__header">
        <span class="eco-modal__title" id="eco-record-title">REACT</span>
        <button class="eco-modal__close" id="eco-modal-close" aria-label="Close">&times;</button>
      </div>

      <div class="eco-modal__screen" id="eco-screen-idle">
        <p class="eco-modal__hint">Tap to leave a voice trace</p>
        <div class="eco-filter-row">
          <span class="eco-filter-label">Filter:</span>
          <button class="eco-filter-btn is-active" data-filter="none">Raw</button>
          <button class="eco-filter-btn" data-filter="distort">Distort</button>
          <button class="eco-filter-btn" data-filter="whisper">Whisper</button>
          <button class="eco-filter-btn" data-filter="ambient">Ambient</button>
        </div>
        <label class="eco-anon-label">
          <input type="checkbox" id="eco-anon-check" class="eco-anon-check" />
          <span>Anonymous</span>
        </label>
        <button class="eco-record-btn" id="eco-record-start" aria-label="Start recording">
          <div class="eco-record-btn__ring"></div>
          <div class="eco-record-btn__ring eco-record-btn__ring--2"></div>
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2"/>
            <path d="M24 14a4 4 0 0 0-4 4v8a4 4 0 0 0 8 0v-8a4 4 0 0 0-4-4z" fill="currentColor"/>
            <path d="M16 24v2a8 8 0 0 0 16 0v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="24" y1="34" x2="24" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="19" y1="40" x2="29" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="eco-modal__screen" id="eco-screen-recording" hidden>
        <div class="eco-recording-indicator">
          <div class="eco-recording-dot"></div>
          <span id="eco-record-timer">0.0s</span>
        </div>
        <canvas class="eco-record-meter-canvas" id="eco-record-meter" aria-hidden="true"></canvas>
        <button class="eco-stop-btn" id="eco-record-stop" aria-label="Stop recording">
          <div class="eco-stop-btn__inner"></div>
        </button>
        <p class="eco-modal__hint eco-modal__hint--sm">Tap to stop &middot; max 5s</p>
      </div>

      <div class="eco-modal__screen" id="eco-screen-preview" hidden>
        <p class="eco-modal__hint">Preview your trace</p>
        <div class="eco-preview-waveform-wrap">
          <canvas class="eco-preview-waveform-canvas" id="eco-preview-waveform" aria-hidden="true"></canvas>
          <button class="eco-preview-play-btn" id="eco-preview-play" aria-label="Play preview">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div class="eco-preview-actions">
          <button class="eco-btn eco-btn--ghost" id="eco-retry-btn">Retry</button>
          <button class="eco-btn eco-btn--primary" id="eco-post-btn">Post Reaction</button>
        </div>
      </div>
    </div>
  </div>

  <div class="eco-toast" id="eco-toast" aria-live="polite" aria-atomic="true"></div>
</div>`;
    },

    // ── Mount ──────────────────────────────────────────────
    mount(container) {
      container.innerHTML = this.buildHTML();
      this.bindEvents();
      this.renderFeed();
      this.updateStats();
    },

    // ── Events ────────────────────────────────────────────
    bindEvents() {
      // Tabs
      document.querySelectorAll('.eco-tab-btn').forEach(btn =>
        btn.addEventListener('click', () => this.switchTab(btn.dataset.tab))
      );
      // Sort
      document.querySelectorAll('.eco-sort-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          document.querySelectorAll('.eco-sort-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          _s.sortMode = btn.dataset.sort;
          this.renderFeed();
        })
      );
      // Modal
      const closeBtn  = document.getElementById('eco-modal-close');
      const backdrop  = document.getElementById('eco-modal-backdrop');
      if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
      if (backdrop) backdrop.addEventListener('click', () => this.closeModal());

      // Record start
      const startBtn  = document.getElementById('eco-record-start');
      if (startBtn) startBtn.addEventListener('click', () => Recorder.start(_s.recordingSignalId));

      // Record stop
      const stopBtn   = document.getElementById('eco-record-stop');
      if (stopBtn) stopBtn.addEventListener('click', () => Recorder.stop());

      // Preview play
      const previewPlay = document.getElementById('eco-preview-play');
      if (previewPlay) previewPlay.addEventListener('click', () => this.previewPlay());

      // Retry
      const retryBtn  = document.getElementById('eco-retry-btn');
      if (retryBtn) retryBtn.addEventListener('click', () => this.retryRecording());

      // Post
      const postBtn   = document.getElementById('eco-post-btn');
      if (postBtn) postBtn.addEventListener('click', () => postReaction());

      // Filters
      document.querySelectorAll('.eco-filter-btn').forEach(btn =>
        btn.addEventListener('click', () => {
          document.querySelectorAll('.eco-filter-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          _s.pendingFilter = btn.dataset.filter;
        })
      );

      // Anon
      const anonCheck = document.getElementById('eco-anon-check');
      if (anonCheck) anonCheck.addEventListener('change', e => { _s.pendingAnon = e.target.checked; });

      // Keyboard: Escape closes modal
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') this.closeModal();
      });
    },

    // ── Tabs ──────────────────────────────────────────────
    switchTab(tab) {
      Player.stop();
      _s.activeTab = tab;
      document.querySelectorAll('.eco-tab-btn').forEach(b => {
        b.classList.toggle('is-active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', String(b.dataset.tab === tab));
      });
      document.querySelectorAll('.eco-tab-pane').forEach(p =>
        p.classList.toggle('is-active', p.dataset.tab === tab)
      );
      const controls = document.getElementById('eco-controls');
      if (controls) controls.style.display = tab === 'feed' ? '' : 'none';
      if (tab === 'favorites') this.renderFavorites();
      if (tab === 'drift')     this.renderDrift();
    },

    // ── Feed ──────────────────────────────────────────────
    renderFeed() {
      const feed = document.getElementById('eco-feed');
      if (!feed) return;
      if (_s.signals.length === 0) { feed.innerHTML = '<p class="eco-empty">No signals detected.</p>'; return; }
      feed.innerHTML = _s.signals.map(sig => this.buildSignalCard(sig)).join('');

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
    },

    buildSignalCard(sig) {
      const rxns    = _s.reactions[sig.id] || [];
      const count   = rxns.length;
      const expanded = _s.expandedSignals.has(sig.id);
      const pillsHTML = count > 0
        ? rxns.slice(0, 4).map(r => {
            const w = 24 + Math.floor((r.waveformData?.[0] || 0.5) * 22);
            return `<div class="eco-mini-waveform-pill" style="width:${w}px" aria-hidden="true"></div>`;
          }).join('')
        : '';

      return `
<div class="eco-signal-card" data-signal-id="${sig.id}">
  <div class="eco-signal-header">
    <div class="eco-signal-meta">
      <span class="eco-signal-id">${sig.title}</span>
      <span class="eco-signal-time">${_ago(sig.ts)} ago</span>
    </div>
    <div class="eco-signal-pulse" aria-hidden="true"></div>
  </div>
  <div class="eco-signal-content">&ldquo;${sig.content}&rdquo;</div>
  <div class="eco-signal-footer">
    <button class="eco-signal-react-btn" data-signal-id="${sig.id}" aria-label="Record voice reaction for ${sig.title}">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M10 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor"/>
        <path d="M5 9v1a5 5 0 0 0 10 0V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="7" y1="18" x2="13" y2="18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      React
    </button>
    ${count > 0 ? `
    <button class="eco-signal-expand-btn ${expanded ? 'is-expanded' : ''}" data-signal-id="${sig.id}" aria-expanded="${expanded}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${count} reaction${count !== 1 ? 's' : ''}">
      <div class="eco-reaction-pill-preview">${pillsHTML}</div>
      <span class="eco-reaction-count">${count}</span>
      <svg class="eco-chevron ${expanded ? 'is-flipped' : ''}" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>` : ''}
  </div>
  <div class="eco-reaction-stack eco-reaction-stack--collapsed" id="eco-stack-${sig.id}" aria-label="Voice reactions"></div>
</div>`;
    },

    toggleExpand(signalId) {
      if (_s.expandedSignals.has(signalId)) {
        _s.expandedSignals.delete(signalId);
        const btn   = document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"]`);
        const stack = document.getElementById('eco-stack-' + signalId);
        if (btn)   { btn.classList.remove('is-expanded'); btn.querySelector('.eco-chevron')?.classList.remove('is-flipped'); btn.setAttribute('aria-expanded', 'false'); }
        if (stack) stack.classList.add('eco-reaction-stack--collapsed');
      } else {
        _s.expandedSignals.add(signalId);
        const btn   = document.querySelector(`.eco-signal-expand-btn[data-signal-id="${signalId}"]`);
        const stack = document.getElementById('eco-stack-' + signalId);
        if (btn)   { btn.classList.add('is-expanded'); btn.querySelector('.eco-chevron')?.classList.add('is-flipped'); btn.setAttribute('aria-expanded', 'true'); }
        if (stack) { stack.classList.remove('eco-reaction-stack--collapsed'); this.renderStack(signalId); }
      }
    },

    // ── Stack ─────────────────────────────────────────────
    renderStack(signalId) {
      const container = document.getElementById('eco-stack-' + signalId);
      if (!container) return;
      const rxns = _sortedRxns(signalId);
      if (rxns.length === 0) { container.innerHTML = '<p class="eco-stack-empty">no reactions yet</p>'; return; }

      container.innerHTML = rxns.map(r => this.buildPill(r, signalId)).join('');

      // Draw waveforms
      rxns.forEach(r => {
        const canvas = document.getElementById('eco-wvf-' + r.id);
        if (canvas && r.waveformData?.length) {
          const isPlaying = _s.activePlayer?.reactionId === r.id;
          Waveform.draw(canvas, r.waveformData, { color: CLR_PINK, glowColor: CLR_PINK_DIM,
            progress: isPlaying ? (_s.activePlayer?.audio?.currentTime / (_s.activePlayer?.audio?.duration || 1)) : -1,
            activeColor: CLR_CYAN });
        }
      });

      // Attach events
      container.querySelectorAll('.eco-rxn-play-btn').forEach(btn => {
        const rxn = rxns.find(r => r.id === btn.dataset.rxnId);
        if (rxn) btn.addEventListener('click', () => Player.play(rxn, signalId));
      });
      container.querySelectorAll('.eco-rxn-fav-btn').forEach(btn =>
        btn.addEventListener('click', () => toggleFavorite(btn.dataset.rxnId, signalId))
      );
      container.querySelectorAll('.eco-rxn-drift-btn').forEach(btn =>
        btn.addEventListener('click', () => sendToDrift(btn.dataset.rxnId, signalId))
      );
      container.querySelectorAll('.eco-rxn-delete-btn').forEach(btn =>
        btn.addEventListener('click', () => deleteReaction(btn.dataset.rxnId, signalId))
      );
    },

    buildPill(rxn, signalId) {
      const isPlaying  = _s.activePlayer?.reactionId === rxn.id;
      const anonTag    = rxn.isAnon   ? '<span class="eco-rxn-tag">anon</span>' : '';
      const filterTag  = rxn.filter !== 'none' ? `<span class="eco-rxn-tag">${rxn.filter}</span>` : '';
      const replaySpan = rxn.replays > 0 ? `<span class="eco-rxn-replays">↺ ${rxn.replays}</span>` : '';
      const driftedCls = rxn.sentToDrift ? ' is-drifted' : '';
      const playIcon   = isPlaying
        ? `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1"/><rect x="12" y="3" width="4" height="14" rx="1"/></svg>`
        : `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 4l12 6-12 6V4z"/></svg>`;

      return `
<div class="eco-reaction-pill${isPlaying ? ' is-playing' : ''}${driftedCls}" id="eco-rxn-${rxn.id}" data-rxn-id="${rxn.id}">
  <button class="eco-rxn-play-btn${isPlaying ? ' is-playing' : ''}" data-rxn-id="${rxn.id}" data-signal-id="${signalId}" aria-label="${isPlaying ? 'Stop' : 'Play'} voice reaction">
    ${playIcon}
  </button>
  <div class="eco-rxn-waveform-wrap">
    <canvas class="eco-rxn-waveform" id="eco-wvf-${rxn.id}" aria-hidden="true"></canvas>
    <div class="eco-rxn-progress-line" id="eco-prog-${rxn.id}"></div>
  </div>
  <div class="eco-rxn-meta">
    <span class="eco-rxn-time">${_ago(rxn.ts)}</span>
    ${replaySpan}${anonTag}${filterTag}
  </div>
  <div class="eco-rxn-actions">
    <button class="eco-rxn-fav-btn${rxn.isFavorite ? ' is-fav' : ''}" data-rxn-id="${rxn.id}" data-signal-id="${signalId}" aria-label="${rxn.isFavorite ? 'Unfavorite' : 'Favorite'}">
      <svg viewBox="0 0 16 16" fill="${rxn.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 13.4C3.5 10.4 1 8 1 5.5A3.5 3.5 0 0 1 7.5 3c.18 0 .35.02.5.04A3.5 3.5 0 0 1 15 5.5C15 8 12.5 10.4 8 13.4z"/></svg>
    </button>
    <button class="eco-rxn-drift-btn${rxn.sentToDrift ? ' is-drifted' : ''}" data-rxn-id="${rxn.id}" data-signal-id="${signalId}" aria-label="Send to Drift" title="Send to Drift">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 8l6-6 6 6M8 2v10" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 14h8" stroke-linecap="round"/></svg>
    </button>
    <button class="eco-rxn-delete-btn" data-rxn-id="${rxn.id}" data-signal-id="${signalId}" aria-label="Delete reaction">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>
  ${isPlaying ? '<div class="eco-rxn-glow-pulse" aria-hidden="true"></div>' : ''}
</div>`;
    },

    // ── Playback state helpers ────────────────────────────
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
      let glowEl = pill.querySelector('.eco-rxn-glow-pulse');
      if (playing && !glowEl) {
        glowEl = document.createElement('div');
        glowEl.className = 'eco-rxn-glow-pulse';
        glowEl.setAttribute('aria-hidden', 'true');
        pill.appendChild(glowEl);
      } else if (!playing && glowEl) {
        glowEl.remove();
      }
    },

    updateProgress(rxnId, progress) {
      const bar = document.getElementById('eco-prog-' + rxnId);
      if (bar) bar.style.width = (progress * 100) + '%';
      // Redraw waveform with progress color
      const canvas = document.getElementById('eco-wvf-' + rxnId);
      if (!canvas) return;
      let rxn = null;
      for (const sid of Object.keys(_s.reactions)) {
        rxn = _s.reactions[sid].find(r => r.id === rxnId);
        if (rxn) break;
      }
      if (rxn?.waveformData?.length) {
        Waveform.draw(canvas, rxn.waveformData, { progress, color: CLR_PINK, activeColor: CLR_CYAN, glowColor: CLR_PINK_DIM });
      }
    },

    // ── Modal ─────────────────────────────────────────────
    openModal(signalId) {
      Player.stop();
      _s.recordingSignalId = signalId;
      const sig = _s.signals.find(s => s.id === signalId);
      const titleEl = document.getElementById('eco-record-title');
      if (titleEl && sig) titleEl.textContent = `REACT · ${sig.title}`;
      const modal = document.getElementById('eco-record-modal');
      if (!modal) return;
      modal.removeAttribute('hidden');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      this.showScreen('idle');
      // Reset filter/anon
      document.querySelectorAll('.eco-filter-btn').forEach(b => b.classList.toggle('is-active', b.dataset.filter === 'none'));
      _s.pendingFilter = 'none';
      const anonCheck = document.getElementById('eco-anon-check');
      if (anonCheck) { anonCheck.checked = false; _s.pendingAnon = false; }
    },

    closeModal() {
      if (_s.recording) Recorder.stop();
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      const modal = document.getElementById('eco-record-modal');
      if (!modal) return;
      modal.classList.remove('is-open');
      setTimeout(() => { modal.setAttribute('hidden', ''); }, 360);
      _s.recordingSignalId = null;
    },

    showScreen(name) {
      ['idle','recording','preview'].forEach(s => {
        const el = document.getElementById('eco-screen-' + s);
        if (el) el.hidden = (s !== name);
      });
    },

    previewPlay() {
      if (!_s.previewUrl) return;
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      const audio  = new Audio(_s.previewUrl);
      _s.previewAudio = audio;
      const canvas = document.getElementById('eco-preview-waveform');
      const btn    = document.getElementById('eco-preview-play');

      const tick = () => {
        if (audio.paused) return;
        const prog = audio.currentTime / (audio.duration || 1);
        if (canvas && _s.previewWaveform.length) {
          Waveform.draw(canvas, _s.previewWaveform, { progress: prog, color: CLR_CYAN, activeColor: CLR_PINK, glowColor: 'rgba(0,229,255,0.4)' });
        }
        requestAnimationFrame(tick);
      };

      audio.onplay  = () => { if (btn) { btn.querySelector('path').setAttribute('d', 'M6 5h4v14H6zM14 5h4v14h-4z'); } };
      audio.onended = () => {
        if (btn) btn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
        if (canvas && _s.previewWaveform.length) {
          Waveform.draw(canvas, _s.previewWaveform, { color: CLR_CYAN, glowColor: 'rgba(0,229,255,0.4)' });
        }
        _s.previewAudio = null;
      };
      audio.play().then(tick).catch(() => {});
    },

    retryRecording() {
      if (_s.previewAudio) { _s.previewAudio.pause(); _s.previewAudio = null; }
      _s.previewBlob = null; _s.previewUrl = null; _s.previewWaveform = [];
      this.showScreen('idle');
    },

    // ── Favorites ─────────────────────────────────────────
    renderFavorites() {
      const container = document.getElementById('eco-favorites');
      if (!container) return;
      const favs = [];
      Object.keys(_s.reactions).forEach(sid => {
        (_s.reactions[sid] || []).filter(r => r.isFavorite).forEach(r => favs.push({ ...r, signalId: sid }));
      });
      if (favs.length === 0) {
        container.innerHTML = '<p class="eco-empty">No favorites yet &mdash; ♥ a reaction to save it here.</p>'; return;
      }
      favs.sort((a, b) => b.ts - a.ts);
      container.innerHTML = favs.map(r => this.buildPill(r, r.signalId)).join('');
      favs.forEach(r => {
        const canvas = document.getElementById('eco-wvf-' + r.id);
        if (canvas && r.waveformData?.length) Waveform.draw(canvas, r.waveformData, { color: CLR_PINK });
        const playBtn = document.querySelector(`#eco-rxn-${r.id} .eco-rxn-play-btn`);
        if (playBtn) playBtn.addEventListener('click', () => Player.play(r, r.signalId));
        const favBtn = document.querySelector(`#eco-rxn-${r.id} .eco-rxn-fav-btn`);
        if (favBtn) favBtn.addEventListener('click', () => toggleFavorite(r.id, r.signalId));
        const delBtn = document.querySelector(`#eco-rxn-${r.id} .eco-rxn-delete-btn`);
        if (delBtn) delBtn.addEventListener('click', () => deleteReaction(r.id, r.signalId));
        const driftBtn = document.querySelector(`#eco-rxn-${r.id} .eco-rxn-drift-btn`);
        if (driftBtn) driftBtn.addEventListener('click', () => sendToDrift(r.id, r.signalId));
      });
    },

    // ── Drift ─────────────────────────────────────────────
    renderDrift() {
      const field = document.getElementById('eco-drift-field');
      if (!field) return;
      const drifted = [];
      Object.keys(_s.reactions).forEach(sid => {
        (_s.reactions[sid] || []).filter(r => r.sentToDrift).forEach(r => drifted.push({ ...r, signalId: sid }));
      });
      if (drifted.length === 0) {
        field.innerHTML = '<p class="eco-empty eco-drift-empty">No reactions have drifted yet.</p>'; return;
      }
      field.innerHTML = drifted.map((r, i) => {
        const x = 5 + (i * 19 + 7) % 82;
        const y = 5 + (i * 31 + 13) % 75;
        return `<div class="eco-drift-fragment" style="left:${x}%;top:${y}%" data-rxn-id="${r.id}" data-signal-id="${r.signalId}" role="button" tabindex="0" aria-label="Play drifted reaction">
          <canvas class="eco-drift-waveform" id="eco-drift-wvf-${r.id}" width="60" height="20" aria-hidden="true"></canvas>
          <span class="eco-drift-time">${_ago(r.ts)}</span>
        </div>`;
      }).join('');
      drifted.forEach(r => {
        const canvas = document.getElementById('eco-drift-wvf-' + r.id);
        if (canvas && r.waveformData?.length) {
          Waveform.draw(canvas, r.waveformData, { color: CLR_VIOLET, glowColor: 'rgba(157,78,221,0.4)' });
        }
        const frag = document.querySelector(`.eco-drift-fragment[data-rxn-id="${r.id}"]`);
        if (frag) {
          frag.addEventListener('click',   () => Player.play(r, r.signalId));
          frag.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') Player.play(r, r.signalId); });
        }
      });
    },

    // ── Stats ─────────────────────────────────────────────
    updateStats() {
      const stats = document.getElementById('eco-stats');
      if (!stats) return;
      const allRxns    = Object.values(_s.reactions).flat();
      const totalRxns  = allRxns.length;
      const totalPlays = allRxns.reduce((s, r) => s + (r.replays || 0), 0);
      stats.innerHTML = `
        <span class="eco-stat"><span class="eco-stat__val">${totalRxns}</span><span class="eco-stat__key">traces</span></span>
        <span class="eco-stat"><span class="eco-stat__val">${totalPlays}</span><span class="eco-stat__key">plays</span></span>`;
    },

    // ── Toast ─────────────────────────────────────────────
    toast(msg) {
      const el = document.getElementById('eco-toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('is-visible');
      clearTimeout(el._tid);
      el._tid = setTimeout(() => el.classList.remove('is-visible'), 2800);
    },
  };

  // ─── INIT ─────────────────────────────────────────────────
  function _init() {
    const saved = Store.loadSignals();
    _s.signals = saved || DEMO_SIGNALS;
    if (!saved) Store.saveSignals(_s.signals);
    _s.reactions = Store.loadReactions();
    // Restore audioUrls from base64 for existing reactions
    Object.keys(_s.reactions).forEach(sid => {
      (_s.reactions[sid] || []).forEach(r => {
        if (r.audioData && !r.audioUrl) r.audioUrl = _base64ToUrl(r.audioData);
      });
    });
  }

  function mount(container) {
    if (!container) return;
    _init();
    UI.mount(container);
  }

  // Stop playback when workspace is closed (called by BuildingWorkspace)
  function onClose() {
    Player.stop();
    if (_s.recording) Recorder.stop();
  }

  return { mount, onClose };
})();

window.EcosphereVR = EcosphereVR;
