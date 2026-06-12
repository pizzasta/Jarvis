'use strict';
/* App Trend Builder Workspace - JARVIS AI City
   Generates brand-new, original app ideas by combining domains, mechanics,
   audiences and twists. Includes a novelty check so ideas are not clones. */

var AppTrendBuilder = (function() {

  // ---- Combinatorial building blocks (originality engine) ----
  var DOMAINS = ['sleep','focus','friendship','grief','budgeting','language learning','plant care','cooking','running','journaling','dating','side hustles','mental health','home repair','pet wellness','local events','recycling','meditation','reading habits','small business','elderly care','meal prep','car maintenance','volunteering','music practice'];
  var MECHANICS = ['voice-first','AI co-pilot','body-doubling','streak & habit','marketplace','swipe-to-match','geolocation','community pods','gamified quests','async video','live audio rooms','time-capsule','accountability buddy','generative avatar','sensor / wearable','calendar-native','photo-recognition','micro-subscription','offline-first','collaborative canvas'];
  var AUDIENCES = ['Gen Z students','new parents','remote freelancers','retirees','small-town locals','neurodivergent adults','immigrants & expats','night-shift workers','solo founders','caregivers','gym beginners','book clubs','hobby musicians','first-time renters','rural communities'];
  var TWISTS = ['but everything resets weekly','where AI plays a character, not a chatbot','with zero feed — one thing per day','that pays you to finish','built entirely around voice notes','where strangers keep you accountable','that works fully offline','where progress is a living world you grow','with a 60-second daily ritual','that turns the boring task into a co-op game','where the community owns the data','that gets simpler the more you use it'];
  var MONETIZATION = ['freemium + $6.99/mo pro','one-time $19 lifetime unlock','marketplace take-rate (12%)','B2B2C — sold to clinics/schools','$3/mo micro-subscription','sponsor-backed, free to user','credits / consumable packs','annual $39 with 7-day trial'];
  var TECH = ['React Native + Supabase','Flutter + Firebase','SwiftUI + CloudKit','Next.js PWA + Postgres','Expo + Convex','native iOS + on-device ML'];
  var ADJ = ['Lumen','Tide','Sprout','Echo','Orbit','Nestle','Kindred','Pace','Hearth','Drift','Bloom','Atlas','Ripple','Ember','Cove','Tend','Loop','Glint','Mosaic','Wander'];
  var SUFFIX = ['ly','io','app','--','space','HQ','wise','pal','flow','nest'];

  // Well-known apps to AVOID cloning (novelty filter)
  var KNOWN = ['uber','tinder','duolingo','headspace','calm','notion','tiktok','instagram','airbnb','spotify','strava','bereal','venmo','robinhood','cashapp','snapchat','clubhouse','discord','slack','whatsapp','candy crush','wordle','myfitnesspal','pinterest','reddit','youtube','twitter','facebook','linkedin','clash','fortnite','roblox','minecraft','doordash','grubhub','cameo','onlyfans','patreon','substack','medium','goodreads','letterboxd','waze','yelp'];

  var _state = { tab:'generator', ideas:[], current:null, saved:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _makeName(){
    var n = _rand(ADJ);
    if(Math.random()<0.55){ var s=_rand(SUFFIX); n = s==='--' ? n : (n+s); }
    return n;
  }
  // Originality check: reject names too close to known apps
  function _isNovel(name){
    var low=name.toLowerCase();
    for(var i=0;i<KNOWN.length;i++){ if(low.indexOf(KNOWN[i])!==-1 || KNOWN[i].indexOf(low)!==-1) return false; }
    return true;
  }

  function _newIdea(){
    var name=_makeName(); var guard=0;
    while(!_isNovel(name) && guard++<10) name=_makeName();
    var domain=_rand(DOMAINS), mech=_rand(MECHANICS), aud=_rand(AUDIENCES), twist=_rand(TWISTS);
    var pitch='A '+mech+' app for '+domain+' aimed at '+aud+', '+twist+'.';
    return {
      id:Date.now()+Math.floor(Math.random()*9999),
      name:name,
      domain:domain, mechanic:mech, audience:aud, twist:twist,
      pitch:pitch,
      monetization:_rand(MONETIZATION),
      tech:_rand(TECH),
      novelty: 70 + Math.floor(Math.random()*30) // 70-99
    };
  }

  function _genBatch(n){
    n=n||4;
    var out=[]; var seen={};
    var attempts=0;
    while(out.length<n && attempts++<60){
      var idea=_newIdea();
      var key=idea.domain+'|'+idea.mechanic;
      if(seen[key]) continue;
      seen[key]=1; out.push(idea);
    }
    _state.ideas=out;
    _renderIdeas();
    if(window.CityMemory) CityMemory.add({ category:'app-idea', title:'Generated '+out.length+' app ideas', content:out.map(function(i){ return i.name+' — '+i.pitch; }).join('\n'), tags:['app','ideas'], building:'app-trend-builder' });
  }

  function _expand(idea){
    _state.current=idea;
    var features=_features(idea);
    var txt='💡 '+idea.name+'\n'+'"'+idea.pitch+'"\n\n'+
      'PROBLEM:\nPeople in '+idea.domain+' ('+idea.audience+') lack a tool that fits how they actually behave. Existing options are generic, noisy, or abandoned within a week.\n\n'+
      'WHY IT IS DIFFERENT:\n'+idea.twist.charAt(0).toUpperCase()+idea.twist.slice(1)+'. It leans on a '+idea.mechanic+' core instead of another feed.\n\n'+
      'CORE FEATURES:\n- '+features.join('\n- ')+'\n\n'+
      'MONETIZATION: '+idea.monetization+'\n'+
      'TECH STACK: '+idea.tech+'\n'+
      'NOVELTY SCORE: '+idea.novelty+'/100 (passed clone filter)\n\n'+
      'MVP IN 4 WEEKS:\nWeek 1 onboarding + the single core loop. Week 2 the '+idea.mechanic+' mechanic. Week 3 retention hook + notifications. Week 4 polish + TestFlight.\n\n'+
      'GO-TO-MARKET:\nLaunch where '+idea.audience+' already gather. Build in public, seed 20 power users, post the daily ritual as short-form video.';
    _setDetail(txt);
    _switchTab('detail');
  }

  function _features(idea){
    var pool=[
      'A 60-second daily ritual that is the whole product, not a side feature',
      'AI '+idea.mechanic.replace('AI ','')+' that adapts to your last 7 days',
      'Gentle streaks that forgive one miss, so you never rage-quit',
      'A private pod of 3-5 people for accountability',
      'Voice-note capture so there is no typing friction',
      'One screen, one action — zero infinite scroll',
      'A living progress world that visibly grows',
      'Smart nudges timed to your real routine, not 9am spam',
      'Shareable weekly recap card for social proof',
      'Offline mode so it works on a commute'
    ];
    var out=[]; var p=pool.slice();
    for(var i=0;i<5 && p.length;i++){ var idx=Math.floor(Math.random()*p.length); out.push(p.splice(idx,1)[0]); }
    return out;
  }

  // ---- Trend radar ----
  var TRENDS = [
    {label:'On-device AI', note:'Private, offline LLMs on phones unlock apps that never send data to a server.'},
    {label:'Anti-feed apps', note:'One-thing-a-day products are winning attention back from infinite scroll.'},
    {label:'Voice-first', note:'Voice notes + AI transcription remove the typing barrier for journaling, CRM, learning.'},
    {label:'Body-doubling', note:'Co-working / accountability presence is exploding for ADHD and remote workers.'},
    {label:'Micro-communities', note:'Small private pods beat giant public feeds for retention.'},
    {label:'Wearable signals', note:'Ring + watch data feeding niche coaching apps (sleep, stress, recovery).'},
    {label:'Generative avatars', note:'AI characters that play a role beat plain chatbots for engagement.'},
    {label:'Local-first', note:'Hyperlocal events, services and neighbour networks are underbuilt.'},
    {label:'Calendar-native', note:'Apps that live inside the calendar instead of asking for another app open.'},
    {label:'Pay-to-finish', note:'Stake money, get it back on completion — accountability with skin in the game.'}
  ];

  // ---- Output helpers ----
  function _setDetail(text){
    var el=document.getElementById('atb-detail'); if(!el) return;
    el.classList.remove('atb-flash'); void el.offsetWidth; el.textContent=text; el.classList.add('atb-flash');
  }
  function _copyDetail(){
    var el=document.getElementById('atb-detail'); if(!el||!el.textContent.trim()) return;
    navigator.clipboard.writeText(el.textContent).then(function(){
      var b=document.getElementById('atb-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1500); }
    });
  }
  function _saveCurrent(){
    if(!_state.current) return;
    if(!_state.saved.some(function(s){ return s.id===_state.current.id; })){
      _state.saved.unshift(_state.current);
      if(_state.saved.length>30) _state.saved.pop();
    }
    if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Saved app idea: '+_state.current.name, content:_state.current.pitch, tags:['app','saved'], pinned:true, building:'app-trend-builder' });
    _renderSaved();
    var b=document.getElementById('atb-save-btn'); if(b){ b.textContent='⭐ Saved!'; setTimeout(function(){ b.textContent='⭐ Save Idea'; },1500); }
  }
  function _sendCurrent(){
    var el=document.getElementById('atb-detail');
    if(el&&el.textContent.trim()&&window.BuildingWorkspace) BuildingWorkspace.open('project-lab',{ prefill:el.textContent });
  }

  // ---- Renders ----
  function _renderIdeas(){
    var el=document.getElementById('atb-idea-grid'); if(!el) return;
    if(!_state.ideas.length){ el.innerHTML='<p class="atb-empty">Hit Generate to invent fresh ideas.</p>'; return; }
    el.innerHTML=_state.ideas.map(function(idea,i){
      return '<div class="atb-idea-card" data-idx="'+i+'">'+
        '<div class="atb-idea-top"><span class="atb-idea-name">'+_esc(idea.name)+'</span><span class="atb-idea-score">'+idea.novelty+'</span></div>'+
        '<div class="atb-idea-pitch">'+_esc(idea.pitch)+'</div>'+
        '<div class="atb-idea-tags"><span>#'+_esc(idea.domain)+'</span><span>#'+_esc(idea.mechanic)+'</span></div>'+
        '<button class="atb-mini-btn atb-expand" data-idx="'+i+'">Expand →</button></div>';
    }).join('');
    el.querySelectorAll('.atb-idea-card').forEach(function(card){
      card.addEventListener('click', function(e){ if(e.target.classList.contains('atb-expand')) return; _expand(_state.ideas[+card.dataset.idx]); });
    });
    el.querySelectorAll('.atb-expand').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); _expand(_state.ideas[+btn.dataset.idx]); });
    });
  }
  function _renderTrends(){
    var el=document.getElementById('atb-trend-list'); if(!el) return;
    el.innerHTML=TRENDS.map(function(t){
      return '<div class="atb-trend-card"><div class="atb-trend-label">'+_esc(t.label)+'</div><div class="atb-trend-note">'+_esc(t.note)+'</div></div>';
    }).join('');
  }
  function _renderSaved(){
    var el=document.getElementById('atb-saved-list'); if(!el) return;
    if(!_state.saved.length){ el.innerHTML='<p class="atb-empty">No saved ideas yet.</p>'; return; }
    el.innerHTML=_state.saved.map(function(idea){
      return '<div class="atb-saved-item"><span class="atb-saved-name">'+_esc(idea.name)+'</span><div class="atb-saved-pitch">'+_esc(idea.pitch)+'</div></div>';
    }).join('');
  }

  // ---- Live AI idea generation (uses server.js Claude proxy when available) ----
  function _aiGenerate(){
    var btn=document.getElementById('atb-gen-ai');
    if(!window.AIClient || !AIClient.available()){
      _setDetail('Live AI is offline. Run the app with the server to enable it:\n\n  ANTHROPIC_API_KEY=sk-ant-... node server.js\n\nthen open http://localhost:8000 — the AI Ideas button invents fresh concepts with a real model.');
      _switchTab('detail');
      return;
    }
    var seed = _state.ideas.length ? _state.ideas[Math.floor(Math.random()*_state.ideas.length)] : _newIdea();
    var orig=btn?btn.textContent:''; if(btn){ btn.textContent='Inventing…'; btn.disabled=true; }
    _setDetail('Inventing brand-new app ideas with Claude…');
    _switchTab('detail');
    var prompt='Invent 3 brand-new, original mobile/web app ideas. They must NOT copy or closely resemble any existing well-known app. ' +
      'For inspiration only, lean into a "'+seed.mechanic+'" mechanic and the "'+seed.domain+'" space, but feel free to diverge. ' +
      'For each idea give: NAME, one-line pitch, the problem it solves, 3 core features, monetization, and why it is novel (not a clone). Keep it tight.';
    AIClient.generate({ system:'You are a sharp startup ideation partner. Generate genuinely original app concepts — never clones of existing apps. Be concrete and concise.', prompt:prompt, max_tokens:1600 })
      .then(function(t){
        _setDetail((t||'').trim()||'No ideas returned.');
        _state.current={ id:Date.now(), name:'AI Concepts', pitch:'AI-generated original app ideas' };
        if(window.CityMemory) CityMemory.add({ category:'app-idea', title:'AI app ideas', content:el_detailText(), tags:['app','ai'], building:'app-trend-builder' });
      })
      .catch(function(e){ _setDetail('AI request failed: '+e.message); })
      .then(function(){ if(btn){ btn.textContent=orig; btn.disabled=false; } });
  }
  function el_detailText(){ var el=document.getElementById('atb-detail'); return el?el.textContent:''; }

  // ---- Name lab ----
  function _genNames(){
    var out=[]; var guard=0;
    while(out.length<8 && guard++<60){ var n=_makeName(); if(_isNovel(n) && out.indexOf(n)===-1) out.push(n); }
    var box=document.getElementById('atb-name-out'); if(box) box.textContent=out.join('   •   ');
  }

  function _switchTab(tab){
    _state.tab=tab;
    document.querySelectorAll('.atb-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.atb-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    return [
      '<div class="atb-workspace">',
      '<div class="atb-grid-bg" aria-hidden="true"></div>',

      '<div class="atb-header">',
      '<div class="atb-hdr-icon">📱</div>',
      '<div><h2 class="atb-title">APP TREND BUILDER</h2><p class="atb-subtitle">Invents brand-new app ideas &mdash; never clones, always original</p></div>',
      '</div>',

      '<div class="atb-tabs">',
      '<button class="atb-tab-btn is-active" data-tab="generator">⚡ Generator</button>',
      '<button class="atb-tab-btn" data-tab="detail">💡 Idea Spec</button>',
      '<button class="atb-tab-btn" data-tab="trends">📡 Trend Radar</button>',
      '<button class="atb-tab-btn" data-tab="names">🏷 Name Lab</button>',
      '<button class="atb-tab-btn" data-tab="saved">⭐ Saved</button>',
      '</div>',

      '<div class="atb-tab-pane is-active" data-tab="generator">',
      '<p class="atb-hint">Each idea is built from a fresh mix of domain + mechanic + audience + twist, then passed through a clone filter. Tap any card to expand it into a full spec.</p>',
      '<div class="atb-gen-row">',
      '<button class="atb-btn atb-btn--primary" id="atb-gen-4">⚡ Generate 4 Ideas</button>',
      '<button class="atb-btn atb-btn--ghost" id="atb-gen-8">🎲 Generate 8</button>',
      '<button class="atb-btn atb-btn--primary" id="atb-gen-ai">✨ AI Ideas</button>',
      '</div>',
      '<div class="atb-idea-grid" id="atb-idea-grid"><p class="atb-empty">Hit Generate to invent fresh ideas.</p></div>',
      '</div>',

      '<div class="atb-tab-pane" data-tab="detail">',
      '<pre class="atb-detail" id="atb-detail">Generate an idea and tap "Expand" to see the full product spec, MVP plan and go-to-market.</pre>',
      '<div class="atb-detail-acts">',
      '<button class="atb-btn atb-btn--ghost" id="atb-copy-btn">Copy</button>',
      '<button class="atb-btn atb-btn--ghost" id="atb-save-btn">⭐ Save Idea</button>',
      '<button class="atb-btn atb-btn--ghost" id="atb-send-btn">➡ Send to Project Lab</button>',
      '</div>',
      '</div>',

      '<div class="atb-tab-pane" data-tab="trends">',
      '<p class="atb-hint">Emerging shifts to build into your next idea.</p>',
      '<div class="atb-trend-list" id="atb-trend-list"></div>',
      '</div>',

      '<div class="atb-tab-pane" data-tab="names">',
      '<p class="atb-hint">Original, clone-filtered app names you can actually register.</p>',
      '<button class="atb-btn atb-btn--primary" id="atb-name-btn">🏷 Generate Names</button>',
      '<div class="atb-name-out" id="atb-name-out"></div>',
      '</div>',

      '<div class="atb-tab-pane" data-tab="saved">',
      '<div class="atb-saved-list" id="atb-saved-list"><p class="atb-empty">No saved ideas yet.</p></div>',
      '</div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    document.querySelectorAll('.atb-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });
    var g4=document.getElementById('atb-gen-4'); if(g4) g4.addEventListener('click', function(){ _genBatch(4); });
    var g8=document.getElementById('atb-gen-8'); if(g8) g8.addEventListener('click', function(){ _genBatch(8); });
    var gai=document.getElementById('atb-gen-ai'); if(gai) gai.addEventListener('click', _aiGenerate);
    var nb=document.getElementById('atb-name-btn'); if(nb) nb.addEventListener('click', _genNames);
    var cb=document.getElementById('atb-copy-btn'); if(cb) cb.addEventListener('click', _copyDetail);
    var sb=document.getElementById('atb-save-btn'); if(sb) sb.addEventListener('click', _saveCurrent);
    var snd=document.getElementById('atb-send-btn'); if(snd) snd.addEventListener('click', _sendCurrent);
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    _state.tab='generator';
    container.innerHTML=_buildHTML();
    _bind();
    _renderTrends();
    _renderSaved();
    _genBatch(4);
  }

  return { mount:mount };
})();

window.AppTrendBuilder = AppTrendBuilder;
