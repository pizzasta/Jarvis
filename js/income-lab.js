'use strict';
/* AI Income Lab Workspace - JARVIS AI City
   Generates RICH, AUTOMATED, $0-upfront-cost AI income ideas & playbooks.
   AI-first: uses real Claude when a key is connected, templates otherwise.
   Realistic, not get-rich-quick — results depend on effort & consistency. */

var IncomeLab = (function() {

  var NOTE = '\n\n— Realistic ideas, not guaranteed income. No upfront cost, but they need consistent effort to work.';

  var GOALS = ['First $100 online','$1,000 / month','$100 / day','Fully passive / automated','Replace my 9-5'];
  var TIME = ['1-2 hrs/week','3-5 hrs/week','1 hr/day','Weekends only','Full-time'];
  var INTERESTS = ['No preference — surprise me','Faceless content','Writing','Design','Tech / automation','Finance','Fitness & health','Pets','Spirituality','Education','Local services','AI tools'];

  var TOOLS = [
    {id:'ideas',     icon:'💡', name:'Idea Generator',    desc:'3 automated $0-start AI income plays'},
    {id:'faceless',  icon:'🎬', name:'Faceless Content',  desc:'Faceless YouTube/TikTok with AI'},
    {id:'services',  icon:'🛠', name:'Automation Services',desc:'Sell AI automations, no inventory'},
    {id:'products',  icon:'📦', name:'Digital Products',  desc:'AI-made templates, ebooks, courses'},
    {id:'affiliate', icon:'🔗', name:'Affiliate / SEO',   desc:'AI content that earns commissions'},
    {id:'stack',     icon:'🧰', name:'Free Tool Stack',   desc:'Run it all on free tiers'},
    {id:'plan',      icon:'🗓', name:'30-Day $0 Plan',    desc:'Day-by-day automated launch'},
    {id:'scale',     icon:'🚀', name:'Automation & Scale',desc:'Put it on autopilot, then grow'}
  ];

  var _state = { goal:GOALS[0], time:TIME[1], interest:INTERESTS[0], history:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _setOutput(t){ var el=document.getElementById('il-output'); if(!el) return; el.classList.remove('il-flash'); void el.offsetWidth; el.textContent=t; el.classList.add('il-flash'); }
  function _save(type, content){
    if(window.CityMemory) CityMemory.add({ category:'income', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.goal,type], building:'income-lab' });
    _state.history.unshift({ type:type, content:content, ts:Date.now() });
    if(_state.history.length>50) _state.history.pop();
    _renderHistory();
  }
  function _ai(){ return window.AIClient && AIClient.available && AIClient.available(); }

  // ---- Prompts (for real Claude) ----
  function _aiSystem(){
    return 'You are an expert at building automated, ZERO-upfront-cost online income with AI. Every idea MUST: cost $0 to start, be largely automatable with free AI tools, and be realistic (no scams, no MLM, no hype, no fake guarantees). Be specific and actionable — name real free tools and exact first steps. Plain text, no markdown headers.';
  }
  function _ctx(){ return 'Goal: '+_state.goal+'. Time available: '+_state.time+'. Interest: '+_state.interest+'.\n\n'; }
  function _aiPrompt(id){
    var c=_ctx();
    switch(id){
      case 'ideas':     return c+'Give 3 automated, $0-to-start AI income ideas tailored to this. For EACH: name, how it makes money, the AI/free tools to automate it, the very first step today, and a realistic time-to-first-dollar.';
      case 'faceless':  return c+'Design a faceless content channel (YouTube Shorts or TikTok) run with AI: niche, content format, the exact free AI tools for script/voice/video/editing, a repeatable production workflow, posting cadence, and how it monetizes ($0 upfront).';
      case 'services':  return c+'Lay out an AI automation service business with $0 startup: what to sell (e.g. AI receptionists, lead gen, content systems) to which local businesses, how to deliver it with free/cheap AI tools, how to find the first 3 clients for free, and pricing.';
      case 'products':  return c+'Plan a digital-product income stream made with AI for $0: 3 product ideas (templates/ebook/notion/course), how to create each with AI, free platforms to sell on (Gumroad/Stan/Etsy digital), and how to drive free traffic.';
      case 'affiliate': return c+'Build an affiliate/SEO income system with AI at $0: a profitable niche, free affiliate programs to join, the AI content workflow (blog/SEO/social), where to publish for free, and how it compounds into passive commissions.';
      case 'stack':     return c+'List a complete FREE tool stack to run an automated AI income business: AI writing, image, video, voice, automation/workflow (e.g. free tiers), scheduling, storefront, analytics — with what each free tool is for and its free-tier limits.';
      case 'plan':      return c+'Write a 30-day, $0-cost day-by-day plan to launch ONE automated AI income stream toward the goal — concrete daily actions, what to automate and when, and the milestone for getting the first dollar.';
      case 'scale':     return c+'Explain how to automate and scale this income to run mostly on autopilot: what to systemize, which steps to hand to AI agents/automations, how to reinvest $0-1 of profit, and the 2-3 metrics to watch.';
      default:          return c+'Give me a strong automated, no-cost AI income plan.';
    }
  }

  // ---- Offline templates ----
  function _tpl(id){
    var IDEAS=[
      'Faceless AI Shorts channel — pick a niche, batch-make Shorts with free AI voice + stock clips, post daily, monetize via affiliate links and (later) the creator fund. First step: pick a niche and make 1 Short today.',
      'AI automation freelancing — set up simple AI workflows (auto-replies, content, lead lists) for local businesses on free tiers, find clients in free FB/Reddit groups. First step: DM 5 local businesses an offer.',
      'AI digital products — generate templates/ebooks with AI, sell on Gumroad (free), drive traffic with short-form posts. First step: make one $9 template and list it.'
    ];
    switch(id){
      case 'ideas': return 'AUTOMATED $0-START AI INCOME IDEAS ('+_state.goal+')\n\n1. '+IDEAS[0]+'\n\n2. '+IDEAS[1]+'\n\n3. '+IDEAS[2]+NOTE;
      case 'faceless': return 'FACELESS AI CONTENT PLAN\n\nNiche: pick one you can post about forever (e.g. money tips, motivation, AI tools).\nTools (free): script = ChatGPT/Claude; voice = free TTS; video = CapCut + stock; thumbnails = Canva.\nWorkflow: 1 prompt -> 5 scripts -> batch record -> edit -> schedule a week at once.\nPost: 1-2x/day. Monetize: affiliate links + creator fund once eligible. $0 upfront.'+NOTE;
      case 'services': return 'AI AUTOMATION SERVICE ($0 startup)\n\nSell: AI content systems, auto-reply bots, lead lists to local businesses.\nDeliver: free-tier AI + automation tools.\nFirst clients (free): local FB groups, Reddit, DM 10 businesses/day with a clear offer.\nPricing: $150-500 setup + small monthly retainer.'+NOTE;
      case 'products': return 'DIGITAL PRODUCTS WITH AI ($0)\n\nIdeas: niche Notion template, an AI-written mini-ebook, a Canva template pack.\nMake: generate with AI, polish, export.\nSell: Gumroad / Stan Store (free). Traffic: short-form posts + a free lead magnet.'+NOTE;
      case 'affiliate': return 'AFFILIATE / SEO ENGINE ($0)\n\nNiche: pick one with products people buy (tools, finance, hobbies).\nJoin: free affiliate programs (Amazon, software).\nContent: AI-write helpful blog/social posts targeting buyer questions.\nPublish free: Medium, a free blog, Pinterest, YouTube. Compounds over time.'+NOTE;
      case 'stack': return 'FREE TOOL STACK\n\nWriting: ChatGPT/Claude free.\nImages: Bing/Ideogram free.\nVideo: CapCut.\nVoice: free TTS.\nAutomation: free tiers (Zapier/Make starter).\nStore: Gumroad free.\nScheduling: native app schedulers.\nAnalytics: built-in platform analytics.'+NOTE;
      case 'plan': return '30-DAY $0 LAUNCH PLAN\n\nWeek 1: pick the stream + niche, set up free accounts, make 5 pieces of content/1 product.\nWeek 2: post daily / list product, engage in 3 communities.\nWeek 3: double down on what got the most attention; automate posting.\nWeek 4: add a second offer/affiliate link; collect proof; reinvest $0 of profit into more reach.'+NOTE;
      case 'scale': return 'AUTOMATE & SCALE\n\nSystemize the winning content/offer into a repeatable template.\nHand scripting/editing/replies to AI + schedulers.\nTrack 3 metrics: reach, click-through, conversion.\nReinvest early profit into faster tooling, not ads, until it converts.'+NOTE;
      default: return 'Pick a tool to generate an automated, no-cost AI income plan.'+NOTE;
    }
  }

  function _run(id){
    var tool=TOOLS.filter(function(t){ return t.id===id; })[0]||TOOLS[0];
    if(_ai()){
      _setOutput('✨ DIVA is building your automated income plan…');
      AIClient.generate({ system:_aiSystem(), prompt:_aiPrompt(id), max_tokens:1500 })
        .then(function(t){ var out=((t||'').trim()||_tpl(id)); if(out.indexOf('upfront')===-1) out+=NOTE; _setOutput(out); _save(tool.name, out); })
        .catch(function(){ var r=_tpl(id); _setOutput(r); _save(tool.name, r); });
    } else { var r=_tpl(id); _setOutput(r); _save(tool.name, r); }
  }

  // ---- Income projection calculator ----
  function _calc(){
    function num(id){ var el=document.getElementById(id); return el?(parseFloat(el.value)||0):0; }
    var reach=num('il-reach'), ctr=num('il-ctr'), conv=num('il-conv'), price=num('il-price');
    var clicks=reach*(ctr/100), buyers=clicks*(conv/100), perDay=buyers*price;
    var res='INCOME PROJECTION (rough)\n\n'+
      'Daily reach:        '+reach+'\n'+
      'Click-through:      '+ctr+'%  -> '+Math.round(clicks)+' clicks\n'+
      'Conversion:         '+conv+'%  -> '+buyers.toFixed(1)+' buyers\n'+
      'Price:              $'+price.toFixed(2)+'\n'+
      '-----------------------------\n'+
      'Per day:   ~$'+perDay.toFixed(2)+'\n'+
      'Per month: ~$'+(perDay*30).toFixed(2)+'\n\n'+
      'Levers: grow reach (post more), raise CTR (better hooks), raise conversion (better offer), raise price.'+NOTE;
    var box=document.getElementById('il-calc-result'); if(box) box.textContent=res;
    _setOutput(res); _save('Projection', res);
  }

  // ---- Output actions ----
  function _copy(){ var el=document.getElementById('il-output'); if(!el||!el.textContent.trim()) return; navigator.clipboard.writeText(el.textContent).then(function(){ var b=document.getElementById('il-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1400); } }); }
  function _pin(){ var el=document.getElementById('il-output'); if(!el||!el.textContent.trim()) return; if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: '+_state.goal+' income', content:el.textContent, tags:[_state.goal,'pinned'], pinned:true, building:'income-lab' }); var b=document.getElementById('il-pin-btn'); if(b){ b.textContent='⭐ Pinned!'; setTimeout(function(){ b.textContent='⭐ Pin'; },1400); } }
  function _send(){ var el=document.getElementById('il-output'), m=document.getElementById('il-send-modal'); if(el&&m){ document.getElementById('il-send-content').value=el.textContent; m.classList.add('is-open'); } }
  function _confirmSend(){ var dest=(document.getElementById('il-send-dest')||{}).value, content=(document.getElementById('il-send-content')||{}).value; document.getElementById('il-send-modal').classList.remove('is-open'); if(dest&&window.BuildingWorkspace) BuildingWorkspace.open(dest,{ prefill:content }); }

  function _renderHistory(){
    var el=document.getElementById('il-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="il-empty">No history yet.</p>'; return; }
    el.innerHTML=_state.history.slice(0,20).map(function(h){
      return '<div class="il-hist-item"><span class="il-hist-type">'+_esc(h.type)+'</span><span class="il-hist-time">'+new Date(h.ts).toLocaleTimeString()+'</span>'+
        '<div class="il-hist-prev">'+_esc(h.content.slice(0,70))+'</div>'+
        '<button class="il-mini-btn" onclick="IncomeLab._load('+JSON.stringify(h.content)+')">Reuse</button></div>';
    }).join('');
  }
  function _load(c){ _setOutput(c); }

  function _switchTab(tab){
    document.querySelectorAll('.il-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.il-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var goalOpts=GOALS.map(function(g){ return '<option'+(g===_state.goal?' selected':'')+'>'+_esc(g)+'</option>'; }).join('');
    var timeOpts=TIME.map(function(t){ return '<option'+(t===_state.time?' selected':'')+'>'+_esc(t)+'</option>'; }).join('');
    var intOpts=INTERESTS.map(function(i){ return '<option'+(i===_state.interest?' selected':'')+'>'+_esc(i)+'</option>'; }).join('');
    var destOpts=['business-builder','app-trend-builder','trade-desk','design-tower','memory-vault','project-lab'].map(function(id){ return '<option value="'+id+'">'+id+'</option>'; }).join('');
    var cards=TOOLS.map(function(t){ return '<div class="il-agent-card" data-tool="'+t.id+'"><div class="il-agent-icon">'+t.icon+'</div><div class="il-agent-name">'+_esc(t.name)+'</div><div class="il-agent-desc">'+_esc(t.desc)+'</div></div>'; }).join('');

    return [
      '<div class="il-workspace">',
      '<div class="il-holo-bg" aria-hidden="true">'+Array.from({length:12},function(_,i){ return '<span class="il-spark" style="--i:'+i+'">$</span>'; }).join('')+'</div>',

      '<div class="il-header">',
      '<div class="il-hdr-icon">💸</div>',
      '<div><h2 class="il-title">AI INCOME LAB</h2><p class="il-subtitle">Rich, automated AI income ideas &mdash; $0 upfront</p></div>',
      '</div>',
      '<div class="il-note">⚡ Every idea is zero-cost to start and built to automate. Realistic, not get-rich-quick — it needs consistency.</div>',

      '<div class="il-selectors">',
      '<div class="il-sel-group"><label class="il-label">Goal</label><select class="il-select" id="il-goal">'+goalOpts+'</select></div>',
      '<div class="il-sel-group"><label class="il-label">Time</label><select class="il-select" id="il-time">'+timeOpts+'</select></div>',
      '<div class="il-sel-group il-sel-wide"><label class="il-label">Interest</label><select class="il-select" id="il-interest">'+intOpts+'</select></div>',
      '</div>',

      '<div class="il-tabs">',
      '<button class="il-tab-btn is-active" data-tab="generate">🤖 Generate</button>',
      '<button class="il-tab-btn" data-tab="calc">🧮 Projection</button>',
      '<button class="il-tab-btn" data-tab="history">📂 History</button>',
      '</div>',

      '<div class="il-tab-pane is-active" data-tab="generate">',
      '<p class="il-hint">Pick a play. Connect AI (top bar) for fully tailored, richer plans — or use the built-in ones.</p>',
      '<div class="il-agent-grid">'+cards+'</div>',
      '<button class="il-btn il-btn--primary" id="il-surprise">🎲 Surprise me — pick a play</button>',
      '</div>',

      '<div class="il-tab-pane" data-tab="calc">',
      '<p class="il-hint">Rough income math so a goal feels real. Tweak the levers.</p>',
      '<div class="il-calc-grid">',
      '<label class="il-calc-lbl">Daily reach<input class="il-input" id="il-reach" type="number" value="2000" min="0" step="100"></label>',
      '<label class="il-calc-lbl">Click-through %<input class="il-input" id="il-ctr" type="number" value="3" min="0" step="0.5"></label>',
      '<label class="il-calc-lbl">Conversion %<input class="il-input" id="il-conv" type="number" value="2" min="0" step="0.5"></label>',
      '<label class="il-calc-lbl">Price $<input class="il-input" id="il-price" type="number" value="19" min="0" step="1"></label>',
      '</div>',
      '<button class="il-btn il-btn--primary" id="il-calc-btn">🧮 Project Income</button>',
      '<pre class="il-calc-result" id="il-calc-result"></pre>',
      '</div>',

      '<div class="il-tab-pane" data-tab="history">',
      '<div class="il-scroll-list" id="il-history-list"><p class="il-empty">No history yet.</p></div>',
      '</div>',

      '<div class="il-output-area">',
      '<div class="il-output-lbl">Output</div>',
      '<div class="il-output" id="il-output" aria-live="polite">Pick a play and DIVA builds an automated, $0-cost income plan…</div>',
      '<div class="il-output-acts">',
      '<button class="il-btn il-btn--ghost" id="il-copy-btn">Copy</button>',
      '<button class="il-btn il-btn--ghost" id="il-pin-btn">⭐ Pin</button>',
      '<button class="il-btn il-btn--ghost" id="il-send-out-btn">➡ Send to Building</button>',
      '</div>',
      '</div>',

      '<div class="il-send-modal" id="il-send-modal">',
      '<div class="il-send-inner">',
      '<h3 class="il-send-title">➡ Send to Building</h3>',
      '<label class="il-label">Destination<select class="il-select" id="il-send-dest">'+destOpts+'</select></label>',
      '<textarea class="il-textarea" id="il-send-content" rows="4"></textarea>',
      '<div class="il-send-acts"><button class="il-btn il-btn--primary" id="il-send-confirm">Send</button><button class="il-btn il-btn--ghost" id="il-send-cancel">Cancel</button></div>',
      '</div></div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    var g=document.getElementById('il-goal'); if(g) g.addEventListener('change', function(e){ _state.goal=e.target.value; });
    var t=document.getElementById('il-time'); if(t) t.addEventListener('change', function(e){ _state.time=e.target.value; });
    var i=document.getElementById('il-interest'); if(i) i.addEventListener('change', function(e){ _state.interest=e.target.value; });

    document.querySelectorAll('.il-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });
    document.querySelectorAll('.il-agent-card').forEach(function(card){
      card.addEventListener('click', function(){
        document.querySelectorAll('.il-agent-card').forEach(function(c){ c.classList.remove('is-active'); });
        card.classList.add('is-active'); _run(card.dataset.tool);
      });
    });
    var sur=document.getElementById('il-surprise'); if(sur) sur.addEventListener('click', function(){ _run(_rand(TOOLS).id); });
    var calc=document.getElementById('il-calc-btn'); if(calc) calc.addEventListener('click', _calc);

    var acts={ 'il-copy-btn':_copy,'il-pin-btn':_pin,'il-send-out-btn':_send,'il-send-confirm':_confirmSend };
    Object.keys(acts).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', acts[id]); });
    var cancel=document.getElementById('il-send-cancel'); if(cancel) cancel.addEventListener('click', function(){ document.getElementById('il-send-modal').classList.remove('is-open'); });
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    container.innerHTML=_buildHTML();
    _bind();
    _renderHistory();
    if(opts.prefill){ var i=document.getElementById('il-interest'); /* leave selects; prefill goes to output */ _setOutput(opts.prefill); }
  }

  return { mount:mount, _load:_load };
})();

window.IncomeLab = IncomeLab;
