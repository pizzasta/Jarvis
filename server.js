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

var server = http.createServer(function(req, res) {
  if (req.url === '/api/health') {
    return sendJSON(res, 200, { ok: !!API_KEY, model: API_KEY ? MODEL : null });
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
});
