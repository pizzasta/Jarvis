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
  var _markets = false;    // true when the server has a Polygon key

  function checkHealth() {
    _checked = true;
    if (_isStaticHost()) { _available = false; _model = null; _tts = false; _markets = false; return Promise.resolve(false); }
    // Guard the fetch so a 404 / network error / non-JSON body never throws.
    return fetch(_base()+'/api/health', { method: 'GET' })
      .then(function(r) { return (r && r.ok) ? r.json().catch(function(){ return null; }) : null; })
      .then(function(j) { _available = !!(j && j.ok); _model = (j && j.model) || null; _tts = !!(j && j.tts); _markets = !!(j && j.markets); return _available; })
      .catch(function() { _available = false; _model = null; _tts = false; _markets = false; return false; });
  }

  function available() { return _available === true || !!getKey(); }   // server OR browser key
  function offline()   { return !available(); }
  function model()     { return _model || (getKey() ? 'claude-opus-4-8' : null); }
  function ttsAvailable() { return _tts === true; }
  function marketsAvailable() { return _markets === true || !!getPolyKey(); }

  // ---- Bring-your-own Polygon key (browser-direct market data) ----
  var POLY_STORE = 'diva_polygon_key';
  function getPolyKey() { try { return localStorage.getItem(POLY_STORE) || ''; } catch (e) { return ''; } }
  function setPolyKey(k) { try { if (k) localStorage.setItem(POLY_STORE, String(k).trim()); else localStorage.removeItem(POLY_STORE); } catch (e) {} }
  function clearPolyKey() { try { localStorage.removeItem(POLY_STORE); } catch (e) {} }
  function _mapTk(t) {
    return { symbol: t.ticker,
      price: (t.lastTrade && t.lastTrade.p) || (t.day && t.day.c) || (t.prevDay && t.prevDay.c) || null,
      change: (t.todaysChange != null ? t.todaysChange : null),
      changePct: (t.todaysChangePerc != null ? t.todaysChangePerc : null) };
  }
  function _polyDirect(path) {
    var sep = path.indexOf('?') === -1 ? '?' : '&';
    return fetch('https://api.polygon.io' + path + sep + 'apiKey=' + encodeURIComponent(getPolyKey()))
      .then(function(r) { return r.json().then(function(j) { if (!r.ok) throw new Error((j && (j.error || j.message)) || ('Polygon ' + r.status)); return j; }); });
  }

  // Live market data — server proxy when present, else browser-direct with the Polygon key.
  function quote(symbols) {
    if (_markets === true) {
      return fetch(_base() + '/api/quote?symbols=' + encodeURIComponent(symbols))
        .then(function(r) { if (!r.ok) throw new Error('quote ' + r.status); return r.json(); })
        .then(function(j) { return (j && j.quotes) || []; });
    }
    if (getPolyKey()) {
      var clean = String(symbols || '').toUpperCase().replace(/[^A-Z0-9.,]/g, '');
      return _polyDirect('/v2/snapshot/locale/us/markets/stocks/tickers?tickers=' + encodeURIComponent(clean))
        .then(function(j) { return ((j && j.tickers) || []).map(_mapTk); });
    }
    return Promise.reject(new Error('markets offline'));
  }
  function recap() {
    if (_markets === true) {
      return fetch(_base() + '/api/recap').then(function(r) { if (!r.ok) throw new Error('recap ' + r.status); return r.json(); });
    }
    if (getPolyKey()) {
      return Promise.all([
        _polyDirect('/v2/snapshot/locale/us/markets/stocks/tickers?tickers=SPY,QQQ,IWM,DIA').catch(function(){ return {}; }),
        _polyDirect('/v2/snapshot/locale/us/markets/stocks/gainers').catch(function(){ return {}; }),
        _polyDirect('/v2/snapshot/locale/us/markets/stocks/losers').catch(function(){ return {}; })
      ]).then(function(rs) {
        return {
          indices: ((rs[0] && rs[0].tickers) || []).map(_mapTk),
          gainers: ((rs[1] && rs[1].tickers) || []).slice(0, 5).map(_mapTk),
          losers:  ((rs[2] && rs[2].tickers) || []).slice(0, 5).map(_mapTk)
        };
      });
    }
    return Promise.reject(new Error('markets offline'));
  }

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

  // ---- Bring-your-own-key: call Claude DIRECTLY from the browser ----
  // Lets the agents work on the static site (GitHub Pages) with no server.
  // The key is stored only in this browser (localStorage) and sent only to
  // Anthropic. A hosted server proxy, when present, always takes priority.
  var KEY_STORE = 'diva_anthropic_key';
  function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
  function setKey(k) { try { if (k) localStorage.setItem(KEY_STORE, String(k).trim()); else localStorage.removeItem(KEY_STORE); } catch (e) {} }
  function clearKey() { try { localStorage.removeItem(KEY_STORE); } catch (e) {} }
  function _serverOn() { return _available === true; }

  // ---- Real-world actions: fire an automation webhook (Zapier/Make/n8n) ----
  // Browser-direct: agents POST their result to your webhook, which then does
  // the real thing (send email, post, add a row...). No server needed.
  var HOOK_STORE = 'diva_webhook_url';
  function getHook() { try { return localStorage.getItem(HOOK_STORE) || ''; } catch (e) { return ''; } }
  function setHook(u) { try { if (u) localStorage.setItem(HOOK_STORE, String(u).trim()); else localStorage.removeItem(HOOK_STORE); } catch (e) {} }
  function clearHook() { try { localStorage.removeItem(HOOK_STORE); } catch (e) {} }
  function hookAvailable() { return !!getHook(); }
  function trigger(payload) {
    var url = getHook();
    if (!url) return Promise.reject(new Error('No automation webhook set — add one in Connect AI.'));
    var body = JSON.stringify(payload || {});
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
      .then(function(r) { return { ok: true, status: r.status }; })
      .catch(function() {
        // Many catch-hooks block CORS reads — fire-and-forget as a fallback.
        return fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: body })
          .then(function() { return { ok: true, status: 0, opaque: true }; });
      });
  }

  function _direct(opts) {
    var key = getKey();
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: Math.min(parseInt(opts.max_tokens, 10) || 1200, 4000),
        system: opts.system || 'You are DIVA, a sharp, witty British AI assistant.',
        messages: [{ role: 'user', content: String(opts.prompt || '') }]
      })
    }).then(function(r) {
      return r.json().catch(function(){ return {}; }).then(function(j) {
        if (!r.ok) throw new Error((j.error && j.error.message) || ('AI error ' + r.status));
        if (j.stop_reason === 'refusal') return 'I had to decline that one, boss. Let us try a different angle.';
        return (j.content || []).filter(function(b){ return b.type === 'text'; }).map(function(b){ return b.text; }).join('\n').trim();
      });
    });
  }

  // opts: { system, prompt, max_tokens } -> Promise<string>
  function generate(opts) {
    opts = opts || {};
    if (_serverOn()) {
      return fetch(_base()+'/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: opts.system, prompt: opts.prompt, max_tokens: opts.max_tokens || 1200 })
      }).then(function(r) {
        return r.json().catch(function(){ return {}; }).then(function(j) {
          if (!r.ok) throw new Error(j.error || ('AI error ' + r.status));
          return j.text;
        });
      });
    }
    if (getKey()) return _direct(opts);
    return Promise.reject(new Error('AI offline — tap "Connect AI" and paste your Anthropic API key, or run the server.'));
  }

  return { checkHealth: checkHealth, available: available, offline: offline, model: model, generate: generate, ttsAvailable: ttsAvailable, tts: tts, marketsAvailable: marketsAvailable, quote: quote, recap: recap, getKey: getKey, setKey: setKey, clearKey: clearKey, getPolyKey: getPolyKey, setPolyKey: setPolyKey, clearPolyKey: clearPolyKey, getHook: getHook, setHook: setHook, clearHook: clearHook, hookAvailable: hookAvailable, trigger: trigger };
})();

window.AIClient = AIClient;
