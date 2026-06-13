'use strict';
/* AIClient — thin bridge to the server-side Claude proxy (server.js).
   Falls back cleanly to DEMO / OFFLINE mode when no backend is present
   (e.g. opened via file://, GitHub Pages, or any plain static host), so the
   UI keeps working and agents respond with template/placeholder output. */

var AIClient = (function() {
  var _available = null;   // null = unknown, true once a live backend answers
  var _model = null;
  var _checked = false;

  // Optional hosted backend (set window.JARVIS_API_BASE in js/config.js).
  function _base() { try { return (window.JARVIS_API_BASE ? String(window.JARVIS_API_BASE) : '').replace(/\/+$/, ''); } catch (e) { return ''; } }

  // A static host (GitHub Pages, file://, *.github.io, codepen, etc.) has no
  // /api backend — don't even probe it, so there is no 404 in the console.
  // EXCEPTION: if a remote backend URL is configured, we use that instead.
  function _isStaticHost() {
    if (_base()) return false;
    try {
      if (location.protocol === 'file:') return true;
      var h = (location.hostname || '').toLowerCase();
      if (!h) return true;
      if (/\.github\.io$/.test(h)) return true;
      if (/\.(pages\.dev|netlify\.app|vercel\.app|surge\.sh)$/.test(h)) return true;
    } catch (e) {}
    return false;
  }

  var _tts = false;        // true when the server has an ElevenLabs key

  function checkHealth() {
    _checked = true;
    if (_isStaticHost()) { _available = false; _model = null; _tts = false; return Promise.resolve(false); }
    // Guard the fetch so a 404 / network error / non-JSON body never throws.
    return fetch(_base()+'/api/health', { method: 'GET' })
      .then(function(r) { return (r && r.ok) ? r.json().catch(function(){ return null; }) : null; })
      .then(function(j) { _available = !!(j && j.ok); _model = (j && j.model) || null; _tts = !!(j && j.tts); return _available; })
      .catch(function() { _available = false; _model = null; _tts = false; return false; });
  }

  function available() { return _available === true; }
  function offline()   { return _available !== true; }   // true in demo mode
  function model()     { return _model; }
  function ttsAvailable() { return _tts === true; }

  // text -> Promise<objectURL> of spoken audio (rejects when TTS is unavailable).
  function tts(text) {
    if (_tts !== true) return Promise.reject(new Error('tts offline'));
    return fetch(_base()+'/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text || '') })
    }).then(function(r) {
      if (!r.ok) throw new Error('tts ' + r.status);
      return r.blob();
    }).then(function(b) { return URL.createObjectURL(b); });
  }

  // opts: { system, prompt, max_tokens } -> Promise<string>
  // Rejects in offline mode; callers should check available() first and show
  // their own demo placeholder, but this guard means a stray call won't 404.
  function generate(opts) {
    if (offline()) {
      return Promise.reject(new Error('AI offline — running in demo mode (no backend). Run "node server.js" with an API key to enable live generation.'));
    }
    return fetch(_base()+'/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: opts.system,
        prompt: opts.prompt,
        max_tokens: opts.max_tokens || 1200
      })
    }).then(function(r) {
      return r.json().catch(function(){ return {}; }).then(function(j) {
        if (!r.ok) throw new Error(j.error || ('AI error ' + r.status));
        return j.text;
      });
    });
  }

  return { checkHealth: checkHealth, available: available, offline: offline, model: model, generate: generate, ttsAvailable: ttsAvailable, tts: tts };
})();

window.AIClient = AIClient;
