'use strict';
/* Business Builder Workspace - JARVIS AI City
   An all-in-one e-commerce / brand agent: clothing design, Shopify listings,
   Canva templates, printables (POD), TikTok content ideas, branding, niche
   research, pricing, marketing calendars, email & ad copy. */

var BusinessBuilder = (function() {

  // ---- Option banks ----
  var NICHES = ['Streetwear','Cozy Home','Fitness & Gym','Spiritual / Manifestation','Pet Lovers','Cottagecore','Dark Feminine','Gamer Culture','Mom Life','Mental Health','Coffee Addicts','Plant Parents','Travel','Self-Improvement','Anime','Faith-Based'];
  var AUDIENCES = ['Gen Z women 18-24','Millennial creatives','Fitness enthusiasts','New mums','Students','Side-hustlers','Spiritual seekers','Pet owners','Remote workers','Festival-goers'];
  var VIBES = ['Bold & Loud','Soft & Minimal','Luxury & Premium','Playful & Cute','Edgy & Dark','Clean & Modern','Vintage & Retro','Y2K Chrome'];

  var AGENTS = [
    {id:'clothing',  icon:'👕', name:'Clothing Designer',  desc:'Apparel graphics, prints & placement briefs'},
    {id:'shopify',   icon:'🛍', name:'Shopify Agent',      desc:'Product listings, SEO, store names & bundles'},
    {id:'canva',     icon:'🎨', name:'Canva Agent',        desc:'Template & graphic concepts you can build in Canva'},
    {id:'printable', icon:'🖨', name:'Printables Agent',   desc:'POD & digital downloads: planners, wall art, journals'},
    {id:'tiktok',    icon:'📱', name:'TikTok Agent',       desc:'Viral hooks, content series & posting plan'},
    {id:'brand',     icon:'✨',       name:'Brand Kit Agent',    desc:'Name, tagline, palette & voice'},
    {id:'niche',     icon:'🔍', name:'Niche Finder',       desc:'Profitable niche + product + audience match'},
    {id:'pricing',   icon:'💰', name:'Pricing Agent',      desc:'Price points, margins & bundle math'},
    {id:'marketing', icon:'📅', name:'Marketing Planner',  desc:'7-day launch calendar across channels'},
    {id:'email',     icon:'✉️', name:'Email & SMS Agent',  desc:'Welcome flow + abandoned cart sequences'},
    {id:'ads',       icon:'📢', name:'Ad Copy Agent',      desc:'Meta, TikTok & Google ad scripts'}
  ];

  var CONCEPTS = ['cosmic rebellion','soft grunge florals','angel numbers','vintage racing','gothic roses','retro sunset','minimal line art','astrology zodiac','distressed typography','cute mascot','chrome 3D text','collage maximalism'];
  var PLACEMENTS = ['oversized front print','small left-chest','full back print','sleeve hit','all-over print','pocket + back combo'];
  var GARMENTS = ['heavyweight boxy tee','oversized hoodie','baby tee','crewneck sweatshirt','long-sleeve','tote bag','dad cap'];

  var PRINTABLES = ['Digital wall art set (4 prints)','2025 daily planner','Self-care journal','Habit tracker bundle','Budget planner spreadsheet','Affirmation card deck','Sticker sheet pack','Meal planner + grocery list','Wedding invitation template','Resume / CV template'];

  var TIKTOK_HOOKS = [
    'POV: you finally found a brand that gets your {vibe} aesthetic',
    'Things in my {niche} starter pack that just make sense',
    'I can\'t stop wearing this... (slow reveal)',
    'Rating {niche} products so you don\'t waste money',
    'Day 1 of building a {niche} brand from $0',
    'Get ready with me using only my own products',
    'Tell me you\'re into {niche} without telling me',
    'This sold out in 3 hours and here\'s why'
  ];

  // ---- Generators (templated, combinatorial -> feels fresh each run) ----
  function _gen(agent) {
    var n = _state.niche, a = _state.audience, v = _state.vibe, c = _state.concept || _rand(CONCEPTS);
    switch(agent) {
      case 'clothing':
        return ['CLOTHING DESIGN BRIEF — ' + n,
          'Garment: ' + _rand(GARMENTS) + '  |  Placement: ' + _rand(PLACEMENTS),
          'Concept: ' + c + ', styled for a ' + v.toLowerCase() + ' look.',
          '',
          'AI image prompt (Midjourney / Ideogram / DALL·E):',
          '"' + v + ' ' + n + ' apparel graphic: ' + c + '. High-contrast, transparent background, print-ready for DTG, centered composition, no mockup."',
          '',
          '3 variations: 1) minimal line-art  2) maximalist collage  3) bold chrome typography.',
          'Colorways: black / cream / washed ' + _rand(['pink','sage','lilac','sand']) + '.'].join('\n');
      case 'shopify':
        return ['SHOPIFY LISTING — ' + n,
          'Store name ideas: ' + _slug(c)+'Studio  /  The'+_slug(n)+'Label  /  '+_slug(c)+'.co',
          'Product title (SEO): "' + v + ' ' + n + ' Graphic Tee — ' + c + ' Print — Unisex Oversized"',
          'Tags: ' + [n,v,c,'oversized tee','aesthetic clothing','gift'].join(', ').toLowerCase(),
          '',
          'Description:',
          'Made for ' + a.toLowerCase() + '. This ' + v.toLowerCase() + ' piece features ' + c + ' artwork printed on premium 100% cotton. Oversized fit, pre-shrunk, machine washable.',
          '',
          'Bundle: Tee + Hoodie + Tote — "The Full Look" at 15% off.',
          'Homepage banner: "New drop is live. Limited run — don\'t sleep on it."'].join('\n');
      case 'canva':
        return ['CANVA TEMPLATE CONCEPTS — ' + n,
          '1) Product mockup post — ' + v + ' palette, bold headline + price chip.',
          '2) 3-slide carousel — "Problem / Product / Proof" for ' + a + '.',
          '3) Story highlight covers — minimal icons in your brand color.',
          '4) Discount banner — "20% off launch weekend".',
          '5) Pinterest pin — tall 1000x1500, lifestyle image + benefit text.',
          '',
          'Build steps in Canva: pick a 1080x1080 template, swap fonts to a bold display + clean sans, drop in your '+c+' graphic, apply your '+v.toLowerCase()+' color theme, export PNG.'].join('\n');
      case 'printable':
        var p1 = _rand(PRINTABLES), p2 = _rand(PRINTABLES);
        return ['PRINTABLES / DIGITAL PRODUCTS — ' + n,
          'Top pick: ' + p1,
          'Also strong: ' + p2,
          '',
          'Format: A4 + US Letter PDF, 300 DPI, print-ready.',
          'Sell on: Etsy, Shopify (digital), Gumroad, Stan Store.',
          'Price: $4.99 single / $12.99 bundle of 3 (instant download, zero shipping).',
          'POD option: put the ' + c + ' design on mugs, posters & journals via Printful/Printify.',
          'Bonus: offer a free 1-page sample as a lead magnet to grow your email list.'].join('\n');
      case 'tiktok':
        var hooks = _shuffle(TIKTOK_HOOKS).slice(0,4).map(function(h,i){ return (i+1)+') '+_fill(h); });
        return ['TIKTOK CONTENT PLAN — ' + n,
          'Hooks:',
          hooks.join('\n'),
          '',
          'Series idea: "Building a ' + n + ' brand from scratch" — post daily progress, people buy the journey.',
          'Format: raw + authentic beats polished. Trending audio, captions on screen, 7-15s.',
          'Posting: 1-3x/day, 11am & 7pm. CTA: "link in bio" only every 3rd video.',
          'First 3 videos: 1) origin story  2) product reveal  3) behind-the-scenes pack-an-order.'].join('\n');
      case 'brand':
        return ['BRAND KIT — ' + n,
          'Names: ' + [_slug(c), 'Maison '+_slug(n), _slug(n)+' & Co', 'Studio '+_slug(c)].join('  /  '),
          'Tagline options: "Wear the feeling." / "Made for the bold." / "Your aesthetic, on demand."',
          'Palette: a ' + v.toLowerCase() + ' scheme — base '+_rand(['#0d0010','#1a1a2e','#fdf6f0'])+', accent '+_rand(['#ff2d78','#e040fb','#7c4dff','#ff9500'])+'.',
          'Fonts: a bold display (Orbitron / Anton) + clean body (Rajdhani / Inter).',
          'Voice: ' + a + '-friendly, confident, a little playful. Speak to the dream, not the product.'].join('\n');
      case 'niche':
        return ['NICHE OPPORTUNITY — ' + n,
          'Audience: ' + a,
          'Why it works: passionate community, repeat buyers, highly shareable on TikTok.',
          'Best first product: ' + _rand(GARMENTS) + ' OR ' + _rand(PRINTABLES).toLowerCase() + '.',
          'Sub-niches to own: ' + _shuffle(CONCEPTS).slice(0,3).join(', ') + '.',
          'Validation: search the niche on TikTok + Etsy, check 30-day sales on top listings, look for gaps you can do better.',
          'Edge: lean fully into the ' + v.toLowerCase() + ' angle — most competitors play it safe.'].join('\n');
      case 'pricing':
        return ['PRICING & MARGINS — ' + n,
          'Tee: cost ~$9 (blank+print) → sell $32  (margin ~72%).',
          'Hoodie: cost ~$22 → sell $58  (margin ~62%).',
          'Printable: cost ~$0 → sell $9  (margin ~100%, scales infinitely).',
          'Bundle (tee+hoodie+tote): value $99, sell $79 — raises average order value.',
          'Psychology: end in 9 or 7, anchor with a "compare at" price, free shipping over $50.',
          'Launch offer: 20% off first 48h to create urgency + early reviews.'].join('\n');
      case 'marketing':
        return ['7-DAY LAUNCH CALENDAR — ' + n,
          'Day 1: Tease — blurred product + "something\'s coming" story.',
          'Day 2: Story — why you started this brand (TikTok).',
          'Day 3: Product reveal + email to waitlist.',
          'Day 4: Behind-the-scenes / pack-an-order video.',
          'Day 5: LAUNCH — open store, 20% off 48h, post 3x.',
          'Day 6: Social proof — repost buyers, UGC, reviews.',
          'Day 7: "Last chance" urgency + cart-abandon email.',
          '',
          'Channels: TikTok (reach) + Email (convert) + Pinterest (long-tail discovery).'].join('\n');
      case 'email':
        return ['EMAIL & SMS FLOWS — ' + n,
          'Welcome (on signup): "Welcome to the family — here\'s 10% off your first order."',
          'Email 2 (day 2): brand story + best-sellers.',
          'Email 3 (day 4): social proof + a styling tip.',
          'Abandoned cart 1 (1h): "You left something behind… it\'s still yours."',
          'Abandoned cart 2 (24h): "Going fast — here\'s 10% to seal the deal."',
          'SMS: "NEW DROP: ' + c + ' just went live. Shop before it sells out → [link]"'].join('\n');
      case 'ads':
        return ['AD COPY — ' + n,
          'Meta headline: "The ' + n + ' piece everyone\'s asking about"',
          'Meta primary text: "Made for ' + a.toLowerCase() + '. ' + v + ' designs, premium quality, ships in 3 days. Tap to shop the drop."',
          'TikTok script: "POV: you finally found a brand that gets your aesthetic…" — show product, transition to styled fit, end on logo.',
          'Google search ad: "' + v + ' ' + n + ' — Limited Drop | Ships in 3 Days | Shop Now"',
          'CTA tests: "Shop the drop" vs "Get yours" vs "See the collection".'].join('\n');
      default: return 'Select an agent to generate output.';
    }
  }

  // ---- State ----
  var _state = { tab:'agents', niche:NICHES[0], audience:AUDIENCES[0], vibe:VIBES[0], concept:'', agent:'clothing', history:[] };

  // ---- Helpers ----
  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _shuffle(a){ return a.slice().sort(function(){ return Math.random()-0.5; }); }
  function _slug(s){ return String(s).replace(/[^a-z0-9]+/gi,' ').trim().split(' ').map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1); }).join(''); }
  function _fill(t){ return t.replace(/\{niche\}/g,_state.niche).replace(/\{vibe\}/g,_state.vibe.toLowerCase()).replace(/\{audience\}/g,_state.audience); }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _setOutput(text){ var el=document.getElementById('bb-output'); if(!el) return; el.classList.remove('bb-flash'); void el.offsetWidth; el.textContent=text; el.classList.add('bb-flash'); }

  function _save(type,content){
    if(window.CityMemory) CityMemory.add({ category:'business', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.niche,_state.vibe,type], building:'business-builder' });
    _state.history.unshift({ type:type, content:content, ts:Date.now() });
    if(_state.history.length>40) _state.history.pop();
    _renderHistory();
  }

  function _aiPrompt(agent){
    var ctx='Niche: '+_state.niche+'. Audience: '+_state.audience+'. Vibe: '+_state.vibe+(_state.concept?'. Concept: '+_state.concept:'')+'.\n\n';
    var tasks={
      clothing:'Create a clothing design brief plus a copy-paste AI image prompt for a standout apparel graphic.',
      shopify:'Write a full Shopify product listing: SEO title, tags, a persuasive description, a bundle offer and a store-name idea.',
      canva:'Give 5 specific Canva post/design concepts with layout, fonts and colour direction.',
      printable:'Recommend the best printable / print-on-demand products for this niche, with formats, where to sell, and pricing.',
      tiktok:'Write a TikTok content plan: 5 scroll-stopping hooks, a content-series idea, and a posting cadence.',
      brand:'Build a brand kit: 4 name ideas, 3 taglines, a colour palette (hex), font pairing and brand voice.',
      niche:'Validate this niche: why it works, the best first product, sub-niches to own, and how to test demand cheaply.',
      pricing:'Give pricing & margins: price points for the core products, bundle maths, and a launch offer.',
      marketing:'Write a 7-day launch calendar across TikTok, email and Pinterest.',
      email:'Write a welcome email plus a 2-step abandoned-cart flow plus one SMS, all ready to use.',
      ads:'Write ad copy for Meta, TikTok and Google — headlines, primary text and a short script.'
    };
    return ctx + (tasks[agent.id] || ('Help me with '+agent.name+'.'));
  }
  function _run(){
    var agent = AGENTS.find(function(x){ return x.id===_state.agent; }) || AGENTS[0];
    var el = document.getElementById('bb-output');
    if(window.AIClient && AIClient.ready() && el){
      AIClient.toOutput(el, {
        system:'You are an elite e-commerce and brand strategist helping Jess build a real business. Be specific, actionable and original — real names, real numbers, real copy. No fluff, no markdown headers.',
        prompt:_aiPrompt(agent), maxTokens:1600,
        fallback:function(){ return _gen(_state.agent); },
        onDone:function(t){ _save(agent.name, t); }
      });
    } else {
      var out = _gen(_state.agent);
      _setOutput(out);
      _save(agent.name, out);
    }
  }

  function _copy(){ var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return; navigator.clipboard.writeText(el.textContent).then(function(){ var b=document.getElementById('bb-copy'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1400); } }); }
  function _pin(){ var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return; if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: '+_state.niche+' plan', content:el.textContent, tags:[_state.niche,'pinned'], pinned:true, building:'business-builder' }); var b=document.getElementById('bb-pin'); if(b){ b.textContent='⭐ Pinned!'; setTimeout(function(){ b.textContent='⭐ Pin'; },1400); } }
  function _send(){ var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return; if(window.BuildingWorkspace) BuildingWorkspace.open('design-tower',{ prefill:el.textContent }); }

  function _renderHistory(){
    var el=document.getElementById('bb-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="bb-empty">No history yet. Pick an agent and generate.</p>'; return; }
    el.innerHTML=_state.history.slice(0,20).map(function(h){
      return '<div class="bb-hist-item"><span class="bb-hist-type">'+_esc(h.type)+'</span>'+
        '<span class="bb-hist-time">'+new Date(h.ts).toLocaleTimeString()+'</span>'+
        '<div class="bb-hist-prev">'+_esc(h.content.slice(0,80))+'</div>'+
        '<button class="bb-mini-btn" onclick="BusinessBuilder._load('+JSON.stringify(h.content)+')">Reuse</button></div>';
    }).join('');
  }
  function _load(content){ _setOutput(content); }

  function _switchTab(tab){
    _state.tab=tab;
    document.querySelectorAll('.bb-tab-btn').forEach(function(b){ b.classList.toggle('is-active',b.dataset.tab===tab); });
    document.querySelectorAll('.bb-tab-pane').forEach(function(p){ p.classList.toggle('is-active',p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var nicheOpts = NICHES.map(function(s){ return '<option'+(s===_state.niche?' selected':'')+'>'+s+'</option>'; }).join('');
    var audOpts = AUDIENCES.map(function(s){ return '<option'+(s===_state.audience?' selected':'')+'>'+s+'</option>'; }).join('');
    var vibeOpts = VIBES.map(function(s){ return '<option'+(s===_state.vibe?' selected':'')+'>'+s+'</option>'; }).join('');
    var agentCards = AGENTS.map(function(a){
      return '<div class="bb-agent-card" data-agent="'+a.id+'"><div class="bb-agent-icon">'+a.icon+'</div><div class="bb-agent-name">'+a.name+'</div><div class="bb-agent-desc">'+a.desc+'</div></div>';
    }).join('');

    return [
      '<div class="bb-workspace">',
      '<div class="bb-holo-bg" aria-hidden="true">'+Array.from({length:12},function(_,i){ return '<span class="bb-holo-coin" style="--i:'+i+'"></span>'; }).join('')+'</div>',

      '<div class="bb-header">',
      '<div class="bb-hdr-icon">🏬</div>',
      '<div><h2 class="bb-title">BUSINESS BUILDER</h2><p class="bb-subtitle">Clothing · Shopify · Canva · Printables · TikTok — your whole brand, one agent</p></div>',
      '</div>',

      '<div class="bb-selectors">',
      '<div class="bb-sel-group"><label class="bb-label">Niche</label><select class="bb-select" id="bb-niche">'+nicheOpts+'</select></div>',
      '<div class="bb-sel-group"><label class="bb-label">Audience</label><select class="bb-select" id="bb-audience">'+audOpts+'</select></div>',
      '<div class="bb-sel-group"><label class="bb-label">Vibe</label><select class="bb-select" id="bb-vibe">'+vibeOpts+'</select></div>',
      '<div class="bb-sel-group bb-sel-wide"><label class="bb-label">Concept / Keyword (optional)</label><input class="bb-input" id="bb-concept" type="text" placeholder="e.g. angel numbers, vintage racing, gothic roses..." /></div>',
      '</div>',

      '<div class="bb-tabs">',
      '<button class="bb-tab-btn is-active" data-tab="agents">🤖 Agents</button>',
      '<button class="bb-tab-btn" data-tab="history">📂 History</button>',
      '</div>',

      '<div class="bb-tab-pane is-active" data-tab="agents">',
      '<p class="bb-hint">Pick an agent (or hit <strong>Build Everything</strong> for a full brand pack). Each one is tailored to your niche, audience &amp; vibe.</p>',
      '<div class="bb-agent-grid">'+agentCards+'</div>',
      '<div class="bb-controls">',
      '<button class="bb-btn bb-btn--primary" id="bb-run">⚡ Run Agent</button>',
      '<button class="bb-btn bb-btn--gold" id="bb-build-all">🚀 Build Everything</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-surprise">🎲 Surprise Me</button>',
      '</div>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="history">',
      '<div class="bb-scroll-list" id="bb-history-list"><p class="bb-empty">No history yet.</p></div>',
      '</div>',

      '<div class="bb-output-area">',
      '<div class="bb-output-lbl">Output</div>',
      '<div class="bb-output" id="bb-output" aria-live="polite">Choose a niche and run an agent — your business plan appears here.</div>',
      '<div class="bb-output-acts">',
      '<button class="bb-btn bb-btn--ghost" id="bb-copy">Copy</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-pin">⭐ Pin</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-send">➡ Send to Design Tower</button>',
      '</div>',
      '</div>',
      '</div>'
    ].join('\n');
  }

  function _bind(){
    var nicheEl=document.getElementById('bb-niche'), audEl=document.getElementById('bb-audience'), vibeEl=document.getElementById('bb-vibe'), conEl=document.getElementById('bb-concept');
    if(nicheEl) nicheEl.addEventListener('change',function(e){ _state.niche=e.target.value; });
    if(audEl) audEl.addEventListener('change',function(e){ _state.audience=e.target.value; });
    if(vibeEl) vibeEl.addEventListener('change',function(e){ _state.vibe=e.target.value; });
    if(conEl) conEl.addEventListener('input',function(e){ _state.concept=e.target.value; });

    document.querySelectorAll('.bb-tab-btn').forEach(function(b){ b.addEventListener('click',function(){ _switchTab(b.dataset.tab); }); });

    document.querySelectorAll('.bb-agent-card').forEach(function(card){
      card.addEventListener('click',function(){
        _state.agent=card.dataset.agent;
        document.querySelectorAll('.bb-agent-card').forEach(function(c){ c.classList.remove('is-active'); });
        card.classList.add('is-active');
        _run();
      });
    });

    var runBtn=document.getElementById('bb-run'); if(runBtn) runBtn.addEventListener('click',_run);
    var allBtn=document.getElementById('bb-build-all'); if(allBtn) allBtn.addEventListener('click',function(){
      var order=['niche','clothing','shopify','canva','printable','tiktok','brand','pricing','marketing','email','ads'];
      var full=order.map(function(id){ _state.agent=id; return _gen(id); }).join('\n\n────────────────────\n\n');
      _setOutput(full); _save('Full Brand Pack', full);
    });
    var surBtn=document.getElementById('bb-surprise'); if(surBtn) surBtn.addEventListener('click',function(){
      _state.niche=_rand(NICHES); _state.audience=_rand(AUDIENCES); _state.vibe=_rand(VIBES); _state.concept=_rand(CONCEPTS); _state.agent=_rand(AGENTS).id;
      var nE=document.getElementById('bb-niche'); if(nE) nE.value=_state.niche;
      var aE=document.getElementById('bb-audience'); if(aE) aE.value=_state.audience;
      var vE=document.getElementById('bb-vibe'); if(vE) vE.value=_state.vibe;
      var cE=document.getElementById('bb-concept'); if(cE) cE.value=_state.concept;
      document.querySelectorAll('.bb-agent-card').forEach(function(c){ c.classList.toggle('is-active',c.dataset.agent===_state.agent); });
      _run();
    });

    var copyBtn=document.getElementById('bb-copy'); if(copyBtn) copyBtn.addEventListener('click',_copy);
    var pinBtn=document.getElementById('bb-pin'); if(pinBtn) pinBtn.addEventListener('click',_pin);
    var sendBtn=document.getElementById('bb-send'); if(sendBtn) sendBtn.addEventListener('click',_send);
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    _state.tab='agents';
    container.innerHTML=_buildHTML();
    _bind();
    _renderHistory();
    var firstCard=document.querySelector('.bb-agent-card[data-agent="'+_state.agent+'"]');
    if(firstCard) firstCard.classList.add('is-active');
    if(opts.prefill && document.getElementById('bb-concept')){ document.getElementById('bb-concept').value=opts.prefill; _state.concept=opts.prefill; }
  }

  return { mount:mount, _load:_load };
})();

window.BusinessBuilder = BusinessBuilder;
