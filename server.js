'use strict';
/*
 * JARVIS AI City - tiny zero-dependency server + Claude API proxy.
 *
 * Serves the static app AND exposes:
 *   GET  /api/health   -> { ok, model }  (ok:true only when an API key is set)
 *   POST /api/generate -> { text }       (forwards a prompt to the Claude API)
 *
 * The browser never sees the API key — it stays on the server.
 *
 * Run:
 *   ANTHROPIC_API_KEY=sk-ant-... node server.js
 *   # then open http://localhost:8000
 */

var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 8000;
var API_KEY = process.env.ANTHROPIC_API_KEY || '';
var MODEL = process.env.JARVIS_MODEL || 'claude-opus-4-8';
// ElevenLabs (human-level TTS). Default voice = "Alice" (British female).
var ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || '';
var ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';
var ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5';
// Polygon.io live market data (key stays server-side).
var POLYGON_KEY = process.env.POLYGON_API_KEY || '';
var ROOT = __dirname;

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
};

function sendJSON(res, status, obj) {
  var body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

// ---- Claude API call ----
function callClaude(opts, cb) {
  var payload = JSON.stringify({
    model: MODEL,
    max_tokens: Math.min(Math.max(parseInt(opts.max_tokens, 10) || 1200, 64), 4000),
    system: opts.system || 'You are JARVIS, a sharp, witty British AI assistant.',
    messages: [{ role: 'user', content: String(opts.prompt || '') }]
  });
  var req = https.request({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, function(r) {
    var chunks = '';
    r.on('data', function(d) { chunks += d; });
    r.on('end', function() {
      try {
        var json = JSON.parse(chunks);
        if (r.statusCode >= 400) {
          return cb(new Error((json.error && json.error.message) || ('API error ' + r.statusCode)));
        }
        if (json.stop_reason === 'refusal') {
          return cb(null, 'I had to decline that one. Let us try a different angle.');
        }
        var text = (json.content || [])
          .filter(function(b) { return b.type === 'text'; })
          .map(function(b) { return b.text; })
          .join('\n')
          .trim();
        cb(null, text || '(no content)');
      } catch (e) {
        cb(e);
      }
    });
  });
  req.on('error', cb);
  req.write(payload);
  req.end();
}

// ---- ElevenLabs TTS (streams audio straight back to the browser) ----
function callEleven(text, voiceId, res) {
  var vid = (voiceId && /^[A-Za-z0-9]{16,}$/.test(voiceId)) ? voiceId : ELEVEN_VOICE;
  var payload = JSON.stringify({
    text: String(text || '').slice(0, 800),
    model_id: ELEVEN_MODEL,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.55, use_speaker_boost: true }
  });
  var req = https.request({
    hostname: 'api.elevenlabs.io',
    path: '/v1/text-to-speech/' + vid + '?output_format=mp3_44100_128',
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json',
      'accept': 'audio/mpeg',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, function(r) {
    if (r.statusCode >= 400) {
      var ec = '';
      r.on('data', function(d) { ec += d; });
      r.on('end', function() { sendJSON(res, 502, { error: 'TTS error ' + r.statusCode }); });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' });
    r.pipe(res);
  });
  req.on('error', function(e) { sendJSON(res, 502, { error: e.message }); });
  req.write(payload);
  req.end();
}

// ---- Polygon.io live market data ----
function polyGet(pathWithQuery, cb) {
  var sep = pathWithQuery.indexOf('?') === -1 ? '?' : '&';
  var p = pathWithQuery + sep + 'apiKey=' + encodeURIComponent(POLYGON_KEY);
  https.get({ hostname: 'api.polygon.io', path: p, headers: { 'Accept': 'application/json' } }, function(r) {
    var c = '';
    r.on('data', function(d) { c += d; });
    r.on('end', function() {
      try {
        var j = JSON.parse(c);
        if (r.statusCode >= 400) return cb(new Error((j && (j.error || j.message)) || ('Polygon ' + r.statusCode)));
        cb(null, j);
      } catch (e) { cb(e); }
    });
  }).on('error', cb);
}
function mapTk(t) {
  return {
    symbol: t.ticker,
    price: (t.lastTrade && t.lastTrade.p) || (t.day && t.day.c) || (t.prevDay && t.prevDay.c) || null,
    change: (t.todaysChange != null ? t.todaysChange : null),
    changePct: (t.todaysChangePerc != null ? t.todaysChangePerc : null)
  };
}
function qparam(u, key) {
  var qs = (u.split('?')[1] || '');
  var parts = qs.split('&');
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].indexOf(key + '=') === 0) return decodeURIComponent(parts[i].slice(key.length + 1));
  }
  return '';
}
function handleQuote(symbols, res) {
  var clean = String(symbols || '').toUpperCase().replace(/[^A-Z0-9.,]/g, '').slice(0, 200);
  if (!clean) return sendJSON(res, 400, { error: 'No symbols' });
  polyGet('/v2/snapshot/locale/us/markets/stocks/tickers?tickers=' + encodeURIComponent(clean), function(e, j) {
    if (e) return sendJSON(res, 502, { error: e.message });
    sendJSON(res, 200, { quotes: ((j && j.tickers) || []).map(mapTk) });
  });
}
function handleRecap(res) {
  var out = { indices: [], gainers: [], losers: [] };
  var pending = 3;
  function done() { if (--pending === 0) sendJSON(res, 200, out); }
  polyGet('/v2/snapshot/locale/us/markets/stocks/tickers?tickers=SPY,QQQ,IWM,DIA', function(e, j) { if (!e && j && j.tickers) out.indices = j.tickers.map(mapTk); done(); });
  polyGet('/v2/snapshot/locale/us/markets/stocks/gainers', function(e, j) { if (!e && j && j.tickers) out.gainers = j.tickers.slice(0, 5).map(mapTk); done(); });
  polyGet('/v2/snapshot/locale/us/markets/stocks/losers', function(e, j) { if (!e && j && j.tickers) out.losers = j.tickers.slice(0, 5).map(mapTk); done(); });
}

// ---- Static file serving ----
function serveStatic(req, res) {
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  // Prevent path traversal
  var safe = path.normalize(path.join(ROOT, urlPath));
  if (safe.indexOf(ROOT) !== 0) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(safe, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    var ext = path.extname(safe).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

var ALLOW_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

var server = http.createServer(function(req, res) {
  // CORS so a hosted backend can serve the static (GitHub Pages) site.
  if (req.url.indexOf('/api/') === 0) {
    res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  }
  if (req.url === '/api/health') {
    return sendJSON(res, 200, { ok: !!API_KEY, model: API_KEY ? MODEL : null, tts: !!ELEVEN_KEY, voice: ELEVEN_KEY ? ELEVEN_VOICE : null, markets: !!POLYGON_KEY });
  }
  if (req.url.split('?')[0] === '/api/quote') {
    if (!POLYGON_KEY) return sendJSON(res, 503, { error: 'No POLYGON_API_KEY set on the server.' });
    return handleQuote(qparam(req.url, 'symbols'), res);
  }
  if (req.url.split('?')[0] === '/api/recap') {
    if (!POLYGON_KEY) return sendJSON(res, 503, { error: 'No POLYGON_API_KEY set on the server.' });
    return handleRecap(res);
  }
  if (req.url.split('?')[0] === '/api/tts' && req.method === 'POST') {
    if (!ELEVEN_KEY) return sendJSON(res, 503, { error: 'No ELEVENLABS_API_KEY set on the server.' });
    var tb = '';
    req.on('data', function(d) { tb += d; if (tb.length > 1e5) req.destroy(); });
    req.on('end', function() {
      var o; try { o = JSON.parse(tb || '{}'); } catch (e) { return sendJSON(res, 400, { error: 'Bad JSON' }); }
      callEleven(o.text, o.voiceId, res);
    });
    return;
  }
  if (req.url === '/api/generate' && req.method === 'POST') {
    if (!API_KEY) return sendJSON(res, 503, { error: 'No ANTHROPIC_API_KEY set on the server.' });
    var body = '';
    req.on('data', function(d) { body += d; if (body.length > 1e6) req.destroy(); });
    req.on('end', function() {
      var opts;
      try { opts = JSON.parse(body || '{}'); } catch (e) { return sendJSON(res, 400, { error: 'Bad JSON' }); }
      callClaude(opts, function(err, text) {
        if (err) return sendJSON(res, 502, { error: err.message });
        sendJSON(res, 200, { text: text });
      });
    });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, function() {
  console.log('[JARVIS] Serving on http://localhost:' + PORT);
  console.log('[JARVIS] Claude API: ' + (API_KEY ? ('ENABLED (' + MODEL + ')') : 'DISABLED — set ANTHROPIC_API_KEY to enable live generation'));
  console.log('[JARVIS] ElevenLabs voice: ' + (ELEVEN_KEY ? ('ENABLED (voice ' + ELEVEN_VOICE + ')') : 'DISABLED — set ELEVENLABS_API_KEY for human-level DIVA voice'));
  console.log('[JARVIS] Polygon market data: ' + (POLYGON_KEY ? 'ENABLED' : 'DISABLED — set POLYGON_API_KEY for live quotes in Trade Desk'));
});
