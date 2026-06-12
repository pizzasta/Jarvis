'use strict';
/* AIClient — thin bridge to the server-side Claude proxy (server.js).
   Falls back silently when the proxy is not running (e.g. opened via file://
   or served by a plain static server), so the app still works offline. */

var AIClient = (function() {
  var _available = null;   // null = unknown, true/false once checked
  var _model = null;

  function checkHealth() {
    return fetch('/api/health', { method: 'GET' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(j) { _available = !!(j && j.ok); _model = j && j.model; return _available; })
      .catch(function() { _available = false; return false; });
  }

  function available() { return _available === true; }
  function model() { return _model; }

  // opts: { system, prompt, max_tokens } -> Promise<string>
  function generate(opts) {
    return fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: opts.system,
        prompt: opts.prompt,
        max_tokens: opts.max_tokens || 1200
      })
    }).then(function(r) {
      return r.json().then(function(j) {
        if (!r.ok) throw new Error(j.error || ('AI error ' + r.status));
        return j.text;
      });
    });
  }

  return { checkHealth: checkHealth, available: available, model: model, generate: generate };
})();

window.AIClient = AIClient;
