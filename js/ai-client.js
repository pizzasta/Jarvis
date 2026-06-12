'use strict';
/* AIClient — real Claude intelligence for JARVIS, straight from the browser.

   Jess connects her own Anthropic API key (stored only in this browser's
   localStorage). When connected, the buildings and the orb call Claude
   (claude-opus-4-8) directly and stream the answer. When not connected,
   every feature falls back to its built-in offline generator, so the app
   always works. */

var AIClient = (function() {

  var MODEL = 'claude-opus-4-8';
  var ENDPOINT = 'https://api.anthropic.com/v1/messages';
  var KEY_STORE = 'jarvis_anthropic_key';

  function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch(e){ return ''; } }
  function setKey(k) { try { localStorage.setItem(KEY_STORE, (k||'').trim()); } catch(e){} }
  function clearKey() { try { localStorage.removeItem(KEY_STORE); } catch(e){} }
  function ready() { return !!getKey(); }

  // Low-level streaming call. Resolves with the full text; calls onText(delta,full) per chunk.
  function stream(opts) {
    opts = opts || {};
    var key = getKey();
    if(!key) return Promise.reject(new Error('no-key'));
    var body = {
      model: MODEL,
      max_tokens: opts.maxTokens || 2000,
      messages: [{ role: 'user', content: opts.prompt || '' }],
      stream: true
    };
    if(opts.system) body.system = opts.system;

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body),
      signal: opts.signal
    }).then(function(res) {
      if(!res.ok) {
        return res.text().then(function(t) {
          var msg = 'API error ' + res.status;
          try { var j = JSON.parse(t); if(j.error && j.error.message) msg = j.error.message; } catch(e){}
          throw new Error(msg);
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var full = '';
      var buf = '';
      function pump() {
        return reader.read().then(function(r) {
          if(r.done) return full;
          buf += decoder.decode(r.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for(var i=0;i<lines.length;i++) {
            var line = lines[i].trim();
            if(line.indexOf('data:') !== 0) continue;
            var data = line.slice(5).trim();
            if(!data || data === '[DONE]') continue;
            try {
              var evt = JSON.parse(data);
              if(evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
                full += evt.delta.text;
                if(opts.onText) opts.onText(evt.delta.text, full);
              } else if(evt.type === 'message_delta' && evt.delta && evt.delta.stop_reason === 'refusal') {
                throw new Error('Claude declined that request.');
              }
            } catch(e) { if(e.message && e.message.indexOf('declined')>=0) throw e; }
          }
          return pump();
        });
      }
      return pump();
    });
  }

  // High-level: stream Claude's answer into an output element. Falls back to
  // the offline generator (fallback()) on any error or when no key is set.
  // Returns a Promise that resolves with the final text.
  function toOutput(el, opts) {
    opts = opts || {};
    var fallback = opts.fallback || function(){ return ''; };
    var onDone = opts.onDone || function(){};

    if(!ready()) {
      var t = fallback();
      if(el) el.textContent = t;
      onDone(t, false);
      return Promise.resolve(t);
    }

    if(el) { el.textContent = '✨ Claude is thinking…'; el.classList.add('ai-streaming'); }
    var first = true;
    return stream({
      system: opts.system,
      prompt: opts.prompt,
      maxTokens: opts.maxTokens,
      onText: function(delta, full) {
        if(el) {
          if(first) { el.textContent = ''; first = false; }
          el.textContent = full;
          if(el.scrollTo) el.scrollTop = el.scrollHeight;
        }
      }
    }).then(function(full) {
      if(el) el.classList.remove('ai-streaming');
      onDone(full, true);
      return full;
    }).catch(function(err) {
      if(el) el.classList.remove('ai-streaming');
      var t = fallback();
      var note = '⚠ ' + (err && err.message ? err.message : 'AI unavailable') + ' — showing offline version.\n\n';
      if(el) el.textContent = note + t;
      onDone(t, false);
      return t;
    });
  }

  return { MODEL:MODEL, ready:ready, getKey:getKey, setKey:setKey, clearKey:clearKey, stream:stream, toOutput:toOutput };
})();

window.AIClient = AIClient;
