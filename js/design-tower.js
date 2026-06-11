'use strict';
/* Design Tower Workspace - JARVIS AI City */

var DesignTower = (function() {

  // ---- Constants ----
  var STYLES = ['Streetwear','Y2K','Luxury','Gymwear','Minimal','Dark Feminine','Oversized Graphic','Baby Tee','Chrome Type','Vintage Distressed'];
  var COLORS = ['Black','White','Pink','Purple','Navy','Cream','Charcoal','Coral','Forest Green','Cobalt'];
  var TRENDS = [
    {label:'Mob Wife Aesthetic',tag:'dark feminine luxury'},
    {label:'Chrome & Metallic',tag:'chrome typography silver'},
    {label:'Y2K Butterfly',tag:'Y2K pastel butterfly print'},
    {label:'Quiet Luxury',tag:'minimal neutral tones serif'},
    {label:'Old Money Sport',tag:'premium athletic crest logo'},
    {label:'Gorpcore',tag:'outdoor technical utility'},
    {label:'Coquette Pink',tag:'pink bow ribbon feminine'},
    {label:'Street Goth',tag:'dark cross chains oversized'},
    {label:'Clean Girl',tag:'minimal white fresh sans-serif'},
    {label:'Coastal Cowgirl',tag:'western denim turquoise fringe'}
  ];
  var AGENTS = [
    {id:'branding',    icon:'\uD83C\uDFA8', name:'Branding Agent',      desc:'Logo, colour palette & brand identity'},
    {id:'product',     icon:'\uD83D\uDC55', name:'Product Design Agent', desc:'T-shirts, hoodies & apparel graphics'},
    {id:'shopify',     icon:'\uD83D\uDECD', name:'Shopify Agent',        desc:'Store builder, product listings & SEO'},
    {id:'social',      icon:'\uD83D\uDCF8', name:'Social Media Agent',   desc:'Instagram, TikTok & Pinterest content'},
    {id:'adcopy',      icon:'\uD83D\uDCDD', name:'Ad Copy Agent',        desc:'Headlines, captions & ad scripts'},
    {id:'trend',       icon:'\uD83D\uDCC8', name:'Trend Research Agent', desc:'Viral aesthetics & market intelligence'}
  ];
  var SHIRT_PROMPTS = [
    '{style} t-shirt graphic: {concept}. High-contrast print, transparent background, ready for DTG printing.',
    'Front-print {style} tee design: {concept}. Bold typography, street-ready aesthetic.',
    '{style} oversized hoodie graphic: {concept}. Layered illustration, vintage wash texture.',
    'Baby tee {style} design: {concept}. Cute, minimal, feminine. 2-color print.',
    'Back-print {style} shirt: {concept}. Large statement graphic, distressed texture overlay.'
  ];
  var BRAND_RESULTS = {
    branding: ['Brand Concept: A premium {style} label rooted in {concept}. Primary colour: #e040fb, secondary: #0d0010. Font pairing: Orbitron (headers) + Rajdhani (body). Visual direction: holographic foil, clean margins, editorial photography.',
               'Logo Direction: Wordmark in modified sans-serif with a small icon mark. Icon concept: {concept} abstracted into geometric form. Works on dark and light.',
               'Tagline options: "Wear the frequency." / "Built different." / "Designed in the future."'],
    product:  ['Product Design: {style} graphic tee. Placement: oversized chest print. Colour: {color} base. Print method: DTG or screen print. Art direction: {concept}.',
               'Design Variation A: Minimalist. Single-colour line art. Clean, editorial.',
               'Design Variation B: Maximalist. Dense collage, distressed overlays, neon accent.',
               'Design Variation C: Typography-led. Chrome or gradient lettering, bold statement.'],
    shopify:  ['Store Name Ideas: {concept}Studio / The{concept}Label / {concept}.co / Wear{concept}',
               'Product Title (SEO): "{style} Graphic Tee - {concept} Print - Unisex Oversized Fit"',
               'Product Description: Crafted for those who move with intention. This {style} tee features {concept} artwork printed directly onto premium 100% cotton. Oversized fit. Pre-shrunk. Machine washable.',
               'Upsell Bundle: Tee + Hoodie + Tote Bag - "The Full Look" bundle at 15% discount.',
               'Homepage Banner Copy: "Drop Season. New arrivals now live."'],
    social:   ['TikTok Hook: "I can't stop wearing this... (show shirt)" → reveal, transition to styled outfit.',
               'Instagram Caption: "The piece that does all the talking. {concept} drop now live. Link in bio."',
               'Pinterest Board Title: "{style} Aesthetic Lookbook | {concept} Vibes"',
               'Reel Concept: Morning routine GRWM wearing the new drop. Aesthetic lighting, trending audio.',
               'Story Sequence: Teaser → Behind the scenes → Product reveal → Countdown → Live drop.'],
    adcopy:   ['Facebook Ad Headline: "The shirt everyone's asking about"',
               'Google Ad: "{style} graphic tees — limited drop. Ships in 3 days."',
               'Email Subject Line: "This just dropped and it's already selling out..."',
               'SMS Copy: "NEW DROP: {concept} tee just went live. Grab yours before it's gone. [link]"',
               'TikTok Script: "POV: you finally found a brand that gets your aesthetic..."'],
    trend:    ['Trending Now: {style} with {concept} elements is peaking on TikTok (+340% searches this week)',
               'Color Forecast: Deep plum, chrome silver, and off-white dominate next season.',
               'Phrase Trends: "I was built for this" / "Main character energy" / "That girl era"',
               'Silhouette Trend: Boxy crop tops and oversized fits continue to dominate. Fitted is returning in 2025.',
               'Platform Intel: Instagram favours clean editorial. TikTok rewards raw/authentic. Pinterest drives discovery.']
  };

  var _state = { tab: 'designer', style: 'Streetwear', color: 'Black', concept: '', agent: 'branding', history: [], versions: [], canvas: { layers: [] } };

  function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function _fill(tpl) {
    return tpl.replace(/\{style\}/g, _state.style).replace(/\{concept\}/g, _state.concept || 'creative vision').replace(/\{color\}/g, _state.color);
  }
  function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _save(type, content) {
    if(window.CityMemory) CityMemory.add({ category:'design', title: type + ': ' + (content||'').slice(0,40), content: content, tags:[_state.style, _state.color, type], building:'design-tower' });
    _state.history.unshift({ type: type, content: content, ts: Date.now() });
    if(_state.history.length > 50) _state.history.pop();
    _renderHistory();
  }

  // ---- Output ----
  function _setOutput(text) {
    var el = document.getElementById('dt-output');
    if(!el) return;
    el.classList.remove('dt-flash');
    void el.offsetWidth;
    el.textContent = text;
    el.classList.add('dt-flash');
  }

  function _copyOutput() {
    var el = document.getElementById('dt-output');
    if(!el || !el.textContent.trim()) return;
    navigator.clipboard.writeText(el.textContent).then(function() {
      var btn = document.getElementById('dt-copy-btn');
      if(btn) { btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = 'Copy'; }, 1500); }
    });
  }

  function _sendToBuilding() {
    var el = document.getElementById('dt-output');
    var modal = document.getElementById('dt-send-modal');
    if(el && modal) { document.getElementById('dt-send-content').value = el.textContent; modal.classList.add('is-open'); }
  }

  function _confirmSend() {
    var dest = (document.getElementById('dt-send-dest') || {}).value;
    var content = (document.getElementById('dt-send-content') || {}).value;
    document.getElementById('dt-send-modal').classList.remove('is-open');
    if(dest && window.BuildingWorkspace) BuildingWorkspace.open(dest, { prefill: content });
    if(window.CityState) CityState.pushHistory({ type:'send-to-building', from:'design-tower', to:dest, content:content });
  }

  // ---- Generators ----
  function _genShirt() {
    var prompt = _fill(_rand(SHIRT_PROMPTS));
    _setOutput(prompt);
    _save('Shirt Prompt', prompt);
  }

  function _genAgent() {
    var results = BRAND_RESULTS[_state.agent] || [];
    var text = results.map(function(r){ return _fill(r); }).join('\n\n');
    _setOutput(text);
    _save(_state.agent + ' output', text);
  }

  function _genSunoPrompt() {
    var text = _state.style + ' brand theme music — ' + (_state.concept||'fashion launch') + ' energy, cinematic, 120bpm, building hype, no lyrics, produced by A$AP Mob x Kanye West style.';
    _setOutput(text); _save('Brand Music Prompt', text);
  }

  function _saveVersion() {
    var el = document.getElementById('dt-output');
    if(!el || !el.textContent.trim()) return;
    var v = { id: Date.now(), label: 'v' + (_state.versions.length + 1), content: el.textContent, style: _state.style, ts: Date.now() };
    _state.versions.unshift(v);
    if(_state.versions.length > 20) _state.versions.pop();
    _renderVersions();
    var btn = document.getElementById('dt-ver-btn');
    if(btn) { btn.textContent = 'Saved!'; setTimeout(function(){ btn.textContent = 'Save Version'; }, 1500); }
  }

  function _pinOutput() {
    var el = document.getElementById('dt-output');
    if(!el || !el.textContent.trim()) return;
    if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: ' + _state.style + ' design', content: el.textContent, tags:[_state.style,'pinned'], pinned:true, building:'design-tower' });
    var btn = document.getElementById('dt-pin-btn');
    if(btn) { btn.textContent = '\u2B50 Pinned!'; setTimeout(function(){ btn.textContent = '\u2B50 Pin'; }, 1500); }
  }

  // ---- Renders ----
  function _renderHistory() {
    var el = document.getElementById('dt-history-list');
    if(!el) return;
    if(!_state.history.length) { el.innerHTML = '<p class="dt-empty">No history yet.</p>'; return; }
    el.innerHTML = _state.history.slice(0, 20).map(function(h) {
      var d = new Date(h.ts).toLocaleTimeString();
      return '<div class="dt-hist-item"><span class="dt-hist-type">' + _esc(h.type) + '</span><span class="dt-hist-time">' + d + '</span>' +
        '<div class="dt-hist-prev">' + _esc(h.content.slice(0, 70)) + '</div>' +
        '<button class="dt-mini-btn" onclick="DesignTower._loadHistory(' + JSON.stringify(h.content) + ')">Reuse</button></div>';
    }).join('');
  }

  function _renderVersions() {
    var el = document.getElementById('dt-versions-list');
    if(!el) return;
    if(!_state.versions.length) { el.innerHTML = '<p class="dt-empty">No saved versions.</p>'; return; }
    el.innerHTML = _state.versions.map(function(v) {
      return '<div class="dt-ver-item"><span class="dt-ver-label">' + v.label + '</span><span class="dt-ver-style">' + _esc(v.style) + '</span>' +
        '<div class="dt-ver-prev">' + _esc(v.content.slice(0, 60)) + '</div>' +
        '<button class="dt-mini-btn" onclick="DesignTower._loadHistory(' + JSON.stringify(v.content) + ')">Load</button></div>';
    }).join('');
  }

  function _loadHistory(content) { _setOutput(content); }

  function _switchTab(tab) {
    _state.tab = tab;
    document.querySelectorAll('.dt-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab === tab); });
    document.querySelectorAll('.dt-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab === tab); });
  }

  function _buildHTML() {
    var styleOpts = STYLES.map(function(s){ return '<option value="'+s+'"'+(s===_state.style?' selected':'')+'>'+s+'</option>'; }).join('');
    var colorOpts = COLORS.map(function(c){ return '<option value="'+c+'"'+(c===_state.color?' selected':'')+'>'+c+'</option>'; }).join('');
    var agentOpts = AGENTS.map(function(a){ return '<option value="'+a.id+'"'+(a.id===_state.agent?' selected':'')+'>'+a.icon+' '+a.name+'</option>'; }).join('');
    var destOpts = ['memory-vault','edit-library','research-district','project-lab','ops-center','songwriting'].map(function(id){
      return '<option value="'+id+'">'+id+'</option>';
    }).join('');
    var agentCards = AGENTS.map(function(a){
      return '<div class="dt-agent-card" data-agent="'+a.id+'">'+'<div class="dt-agent-icon">'+a.icon+'</div>'+'<div class="dt-agent-name">'+a.name+'</div>'+'<div class="dt-agent-desc">'+a.desc+'</div>'+'</div>';
    }).join('');
    var trendCards = TRENDS.map(function(t){
      return '<div class="dt-trend-card"><div class="dt-trend-label">'+_esc(t.label)+'</div><div class="dt-trend-tag">#'+_esc(t.tag)+'</div><button class="dt-mini-btn" data-tag="'+_esc(t.tag)+'">Use Prompt</button></div>';
    }).join('');

    return [
      '<div class="dt-workspace" id="dt-workspace">',

      '<!-- Holo BG -->',
      '<div class="dt-holo-bg" aria-hidden="true">'+Array.from({length:14},function(_,i){ return '<span class="dt-holo-board" style="--i:'+i+'"></span>'; }).join('')+'</div>',

      '<!-- Header -->',
      '<div class="dt-header">',
      '<div class="dt-hdr-icon">\uD83C\uDFA8</div>',
      '<div><h2 class="dt-title">DESIGN TOWER</h2><p class="dt-subtitle">AI Creative Studio &mdash; Apparel, Branding &amp; Shopify</p></div>',
      '</div>',

      '<!-- Selectors -->',
      '<div class="dt-selectors">',
      '<div class="dt-sel-group"><label class="dt-label">Style</label><select class="dt-select" id="dt-style">'+styleOpts+'</select></div>',
      '<div class="dt-sel-group"><label class="dt-label">Base Color</label><select class="dt-select" id="dt-color">'+colorOpts+'</select></div>',
      '<div class="dt-sel-group dt-sel-wide"><label class="dt-label">Concept / Keyword</label><input class="dt-input" id="dt-concept" type="text" placeholder="e.g. cosmic rebellion, angel wings, gothic roses..." /></div>',
      '</div>',

      '<!-- Tabs -->',
      '<div class="dt-tabs">',
      '<button class="dt-tab-btn is-active" data-tab="designer">\uD83D\uDC55 T-Shirt</button>',
      '<button class="dt-tab-btn" data-tab="agents">\uD83E\uDD16 Agents</button>',
      '<button class="dt-tab-btn" data-tab="shopify">\uD83D\uDECD Shopify</button>',
      '<button class="dt-tab-btn" data-tab="canvas">\uD83C\uDFE2 Canvas</button>',
      '<button class="dt-tab-btn" data-tab="trends">\uD83D\uDCC8 Trends</button>',
      '<button class="dt-tab-btn" data-tab="history">\uD83D\uDCC2 History</button>',
      '<button class="dt-tab-btn" data-tab="versions">\uD83D\uDD16 Versions</button>',
      '</div>',

      '<!-- Tab: T-Shirt Designer -->',
      '<div class="dt-tab-pane is-active" data-tab="designer">',
      '<div class="dt-shirt-preview" id="dt-shirt-preview">',
      '<div class="dt-shirt-svg" id="dt-shirt-svg">',
      '<svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" class="dt-shirt-shape">',
      '<path d="M40 30 L10 70 L40 80 L40 190 L160 190 L160 80 L190 70 L160 30 L130 20 Q100 10 70 20 Z" fill="#1a001f" stroke="#e040fb" stroke-width="1.5"/>',
      '<text x="100" y="110" text-anchor="middle" fill="#e040fb" font-size="10" font-family="Orbitron">DESIGN</text>',
      '<text x="100" y="125" text-anchor="middle" fill="#e040fb" font-size="8" font-family="Orbitron">PREVIEW</text>',
      '</svg>',
      '<div class="dt-shirt-overlay" id="dt-shirt-overlay"></div>',
      '</div>',
      '<div class="dt-shirt-controls">',
      '<p class="dt-hint">Generate a prompt to brief an AI image tool (Midjourney, DALL-E, Ideogram) for your design.</p>',
      '<button class="dt-btn dt-btn--primary" id="dt-gen-shirt">\uD83C\uDFB4 Generate Shirt Prompt</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-gen-vars">\uD83D\uDD04 3 Variations</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-music-btn">\uD83C\uDFB5 Brand Music Prompt</button>',
      '</div>',
      '</div>',
      '</div>',

      '<!-- Tab: AI Agents -->',
      '<div class="dt-tab-pane" data-tab="agents">',
      '<p class="dt-hint">Select an AI agent, then activate it to generate tailored creative output.</p>',
      '<div class="dt-agent-grid">'+agentCards+'</div>',
      '<div class="dt-agent-controls">',
      '<select class="dt-select" id="dt-agent-select">'+agentOpts+'</select>',
      '<button class="dt-btn dt-btn--primary" id="dt-agent-run">\u26A1 Activate Agent</button>',
      '</div>',
      '</div>',

      '<!-- Tab: Shopify -->',
      '<div class="dt-tab-pane" data-tab="shopify">',
      '<p class="dt-hint">Build a complete Shopify product listing, store name, and homepage copy.</p>',
      '<button class="dt-btn dt-btn--primary" id="dt-shopify-btn">\uD83D\uDECD Generate Shopify Assets</button>',
      '</div>',

      '<!-- Tab: Canvas Editor -->',
      '<div class="dt-tab-pane" data-tab="canvas">',
      '<div class="dt-canvas-area" id="dt-canvas">',
      '<div class="dt-canvas-toolbar">',
      '<button class="dt-mini-btn" id="dt-add-text">+ Text</button>',
      '<button class="dt-mini-btn" id="dt-add-shape">+ Shape</button>',
      '<button class="dt-mini-btn" id="dt-canvas-clear">Clear</button>',
      '<select class="dt-select dt-font-sel" id="dt-font-sel"><option>Orbitron</option><option>Rajdhani</option><option>Impact</option><option>Georgia</option></select>',
      '<input class="dt-color-inp" id="dt-text-color" type="color" value="#e040fb" title="Text color" />',
      '</div>',
      '<div class="dt-canvas-board" id="dt-canvas-board" contenteditable="false">',
      '<div class="dt-canvas-element dt-text-el" contenteditable="true" style="top:80px;left:60px;font-family:Orbitron;color:#e040fb;">YOUR TEXT HERE</div>',
      '<div class="dt-canvas-element dt-shape-el" style="top:140px;left:80px;width:80px;height:80px;background:rgba(224,64,251,.15);border:2px solid #e040fb;"></div>',
      '</div>',
      '</div>',
      '<p class="dt-hint" style="margin-top:.5rem;">Click elements to edit. Drag to reposition. Use the toolbar to add new elements.</p>',
      '</div>',

      '<!-- Tab: Trends -->',
      '<div class="dt-tab-pane" data-tab="trends">',
      '<p class="dt-hint">Live trend intelligence for apparel and streetwear aesthetics.</p>',
      '<div class="dt-trend-grid">'+trendCards+'</div>',
      '</div>',

      '<!-- Tab: History -->',
      '<div class="dt-tab-pane" data-tab="history">',
      '<div class="dt-scroll-list" id="dt-history-list"><p class="dt-empty">No history yet.</p></div>',
      '</div>',

      '<!-- Tab: Versions -->',
      '<div class="dt-tab-pane" data-tab="versions">',
      '<div class="dt-scroll-list" id="dt-versions-list"><p class="dt-empty">No saved versions.</p></div>',
      '</div>',

      '<!-- Output -->',
      '<div class="dt-output-area">',
      '<div class="dt-output-lbl">Output</div>',
      '<div class="dt-output" id="dt-output" aria-live="polite">Your generated content will appear here...</div>',
      '<div class="dt-output-acts">',
      '<button class="dt-btn dt-btn--ghost" id="dt-copy-btn">Copy</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-ver-btn">Save Version</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-pin-btn">\u2B50 Pin</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-send-out-btn">\u27A1 Send to Building</button>',
      '</div>',
      '</div>',

      '<!-- Send modal -->',
      '<div class="dt-send-modal" id="dt-send-modal">',
      '<div class="dt-send-inner">',
      '<h3 class="dt-send-title">\u27A1 Send to Building</h3>',
      '<label class="dt-label">Destination<select class="dt-select" id="dt-send-dest">'+destOpts+'</select></label>',
      '<textarea class="dt-textarea" id="dt-send-content" rows="4"></textarea>',
      '<div class="dt-send-acts">',
      '<button class="dt-btn dt-btn--primary" id="dt-send-confirm">Send</button>',
      '<button class="dt-btn dt-btn--ghost" id="dt-send-cancel">Cancel</button>',
      '</div></div></div>',

      '</div>'
    ].join('\n');
  }

  function _bindCanvas() {
    var board = document.getElementById('dt-canvas-board');
    if(!board) return;
    board.querySelectorAll('.dt-canvas-element').forEach(function(el) {
      el.addEventListener('mousedown', function(e) {
        if(el.contentEditable === 'true') return;
        var sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop;
        function onMove(ev) { el.style.left = (ev.clientX - sx) + 'px'; el.style.top = (ev.clientY - sy) + 'px'; }
        function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
    var addText = document.getElementById('dt-add-text');
    if(addText) addText.addEventListener('click', function() {
      var el = document.createElement('div');
      el.className = 'dt-canvas-element dt-text-el';
      el.contentEditable = 'true';
      el.style.top = Math.random()*100+40+'px';
      el.style.left = Math.random()*120+20+'px';
      var font = (document.getElementById('dt-font-sel')||{}).value||'Orbitron';
      var color = (document.getElementById('dt-text-color')||{}).value||'#e040fb';
      el.style.fontFamily = font; el.style.color = color;
      el.textContent = 'Edit me';
      board.appendChild(el);
    });
    var addShape = document.getElementById('dt-add-shape');
    if(addShape) addShape.addEventListener('click', function() {
      var el = document.createElement('div');
      el.className = 'dt-canvas-element dt-shape-el';
      el.style.top = '60px'; el.style.left = '60px';
      var sz = (Math.floor(Math.random()*3)+1)*30;
      el.style.width = sz+'px'; el.style.height = sz+'px';
      var color = (document.getElementById('dt-text-color')||{}).value||'#e040fb';
      el.style.background = color+'33'; el.style.border = '2px solid '+color;
      board.appendChild(el);
    });
    var clr = document.getElementById('dt-canvas-clear');
    if(clr) clr.addEventListener('click', function(){
      board.innerHTML = '';
    });
  }

  function _bind() {
    // Selectors
    var styleEl = document.getElementById('dt-style');
    var colorEl = document.getElementById('dt-color');
    var conceptEl = document.getElementById('dt-concept');
    if(styleEl) styleEl.addEventListener('change', function(e){ _state.style = e.target.value; });
    if(colorEl) colorEl.addEventListener('change', function(e){ _state.color = e.target.value; });
    if(conceptEl) conceptEl.addEventListener('input', function(e){ _state.concept = e.target.value; });

    // Tabs
    document.querySelectorAll('.dt-tab-btn').forEach(function(btn){
      btn.addEventListener('click', function(){ _switchTab(btn.dataset.tab); });
    });

    // T-Shirt tab
    var genShirt = document.getElementById('dt-gen-shirt');
    if(genShirt) genShirt.addEventListener('click', _genShirt);
    var genVars = document.getElementById('dt-gen-vars');
    if(genVars) genVars.addEventListener('click', function(){
      var all = SHIRT_PROMPTS.map(function(p){ return _fill(p); }).join('\n\n---\n\n');
      _setOutput(all); _save('3 Shirt Variations', all);
    });
    var musicBtn = document.getElementById('dt-music-btn');
    if(musicBtn) musicBtn.addEventListener('click', _genSunoPrompt);

    // Agents tab
    var agentSel = document.getElementById('dt-agent-select');
    if(agentSel) agentSel.addEventListener('change', function(e){ _state.agent = e.target.value; });
    var agentRun = document.getElementById('dt-agent-run');
    if(agentRun) agentRun.addEventListener('click', _genAgent);
    document.querySelectorAll('.dt-agent-card').forEach(function(card){
      card.addEventListener('click', function(){
        _state.agent = card.dataset.agent;
        if(agentSel) agentSel.value = _state.agent;
        document.querySelectorAll('.dt-agent-card').forEach(function(c){ c.classList.remove('is-active'); });
        card.classList.add('is-active');
        _genAgent();
        _switchTab('agents');
      });
    });

    // Shopify tab
    var shopBtn = document.getElementById('dt-shopify-btn');
    if(shopBtn) shopBtn.addEventListener('click', function(){
      _state.agent = 'shopify'; _genAgent();
    });

    // Output actions
    var copyBtn = document.getElementById('dt-copy-btn');
    var verBtn  = document.getElementById('dt-ver-btn');
    var pinBtn  = document.getElementById('dt-pin-btn');
    var sendBtn = document.getElementById('dt-send-out-btn');
    if(copyBtn) copyBtn.addEventListener('click', _copyOutput);
    if(verBtn)  verBtn.addEventListener('click', _saveVersion);
    if(pinBtn)  pinBtn.addEventListener('click', _pinOutput);
    if(sendBtn) sendBtn.addEventListener('click', _sendToBuilding);

    // Send modal
    var confirmBtn = document.getElementById('dt-send-confirm');
    var cancelBtn  = document.getElementById('dt-send-cancel');
    if(confirmBtn) confirmBtn.addEventListener('click', _confirmSend);
    if(cancelBtn)  cancelBtn.addEventListener('click', function(){ document.getElementById('dt-send-modal').classList.remove('is-open'); });

    // Trends
    document.querySelectorAll('.dt-trend-card .dt-mini-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tag = btn.dataset.tag;
        var conceptInput = document.getElementById('dt-concept');
        if(conceptInput){ conceptInput.value = tag; _state.concept = tag; }
        _genShirt();
        _switchTab('designer');
      });
    });

    _bindCanvas();
  }

  function mount(container, opts) {
    if(!container) return;
    opts = opts || {};
    _state.tab = 'designer';
    container.innerHTML = _buildHTML();
    _bind();
    _renderHistory();
    _renderVersions();
    if(opts.prefill && document.getElementById('dt-concept')) {
      document.getElementById('dt-concept').value = opts.prefill;
      _state.concept = opts.prefill;
    }
  }

  return { mount: mount, _loadHistory: _loadHistory };
})();

window.DesignTower = DesignTower;
