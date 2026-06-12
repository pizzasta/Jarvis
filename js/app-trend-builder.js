'use strict';
/* App Trend Builder Workspace - JARVIS AI City
   Auto-generates brand-new app ideas by combining unrelated domains, audiences,
   emerging tech and mechanics — so every idea is original, not a clone. */

var AppTrendBuilder = (function() {

  // ---- Combinatorial idea banks ----
  var DOMAINS = ['fitness','journaling','dating','budgeting','cooking','language learning','mental health','productivity','music','travel','gardening','pet care','sleep','parenting','study','fashion','gaming','meditation','dog training','side-hustles'];
  var AUDIENCES = ['Gen Z students','new parents','remote workers','solo travelers','gym beginners','indie creators','night-shift workers','retirees','small-business owners','neurodivergent adults','language learners','busy mums'];
  var TECH = ['on-device AI','AR camera','voice-first','offline-first','wearable sync','live collaboration','generative video','spatial audio','computer vision','real-time translation','blockchain-light proof','LLM coaching'];
  var MECHANICS = ['streaks & rewards','social accountability','AI companion','5-minute daily ritual','community challenges','progress photos','anonymous matching','gamified levels','auto-generated plans','duet/remix content','time-capsule messages','reverse auctions'];
  var VIBES = ['calm & minimal','bold & gamified','cozy & friendly','premium & sleek','playful & loud','focused & pro'];

  var PREFIX = ['Lumi','Nova','Sora','Drift','Bloom','Echo','Pulse','Halo','Zephyr','Kindle','Orbit','Wisp','Ember','Flux','Vela','Mosaic','Tonic','Sprout','Quill','Reverie'];
  var SUFFIX = ['ly','io','app','loop','hub','space','flow','nest','kit','wave','mind','path','deck','verse','pal','lab'];

  var MONETIZE = ['Freemium + $7.99/mo Pro','One-time $29 unlock','$4.99/mo with 7-day trial','Free + in-app marketplace (15% fee)','B2B teams plan $12/seat','Ad-free $3.99/mo + cosmetics'];

  var _state = { ideas:[], category:'surprise', vibe:'surprise', pinned:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  // Build a fresh, original concept by fusing two unrelated domains.
  function _makeIdea(){
    var d1 = _state.category!=='surprise' ? _state.category : _rand(DOMAINS);
    var d2 = _rand(DOMAINS); while(d2===d1) d2=_rand(DOMAINS);
    var aud = _rand(AUDIENCES), tech = _rand(TECH), mech = _rand(MECHANICS);
    var vibe = _state.vibe!=='surprise' ? _state.vibe : _rand(VIBES);
    var name = _rand(PREFIX) + _rand(SUFFIX);

    var oneLiner = _cap(d1) + ' meets ' + d2 + ' — a ' + tech + ' app for ' + aud + '.';
    var problem = _cap(aud) + ' struggle to stay consistent with ' + d1 + ', and existing apps feel generic and lonely.';
    var solution = name + ' blends ' + d1 + ' with ' + d2 + ' using ' + tech + ', built around ' + mech + ' so it actually sticks.';
    var differ = 'No one is combining ' + d1 + ' + ' + d2 + ' with ' + mech + ' for this exact crowd — that fusion is the moat.';

    var features = [
      tech.charAt(0).toUpperCase()+tech.slice(1)+' core that adapts to the user',
      _cap(mech) + ' to drive daily return',
      'Auto-generated ' + d1 + ' plan personalised in onboarding',
      'A ' + d2 + '-inspired twist that makes it shareable',
      'Progress dashboard with a weekly recap reel'
    ];

    var viral = 'Growth hook: a shareable weekly "' + name + ' recap" card built for TikTok/Stories — every user becomes a billboard.';
    var stack = 'MVP stack: React Native or Flutter, Supabase/Firebase backend, ' + (/AI|LLM|vision|video/.test(tech)?'on-device + cloud AI':'lightweight cloud') + ', RevenueCat for subscriptions.';
    var mvp = 'MVP scope (4-6 weeks): onboarding + the core ' + mech.split(' ')[0] + ' loop + one ' + d1 + ' flow + the share card. Cut everything else.';

    return {
      id: Date.now()+Math.floor(Math.random()*9999),
      name: name,
      category: _cap(d1),
      vibe: vibe,
      oneLiner: oneLiner,
      problem: problem,
      solution: solution,
      differ: differ,
      features: features,
      monetize: _rand(MONETIZE),
      viral: viral,
      stack: stack,
      mvp: mvp,
      ts: Date.now()
    };
  }

  function _ideaText(idea){
    return [
      '📱 ' + idea.name + '  —  ' + idea.category + ' · ' + idea.vibe,
      idea.oneLiner,
      '',
      'PROBLEM: ' + idea.problem,
      'SOLUTION: ' + idea.solution,
      'WHY IT\'S NEW: ' + idea.differ,
      '',
      'CORE FEATURES:',
      idea.features.map(function(f,i){ return '  '+(i+1)+'. '+f; }).join('\n'),
      '',
      'MONETIZATION: ' + idea.monetize,
      idea.viral,
      idea.stack,
      idea.mvp
    ].join('\n');
  }

  function _commit(fresh){
    _state.ideas = fresh.concat(_state.ideas).slice(0,30);
    _render();
    fresh.forEach(function(idea){
      if(window.CityMemory) CityMemory.add({ category:'app-idea', title:'App idea: '+idea.name, content:_ideaText(idea), tags:[idea.category,idea.vibe,'app-idea'], building:'app-trend-builder' });
    });
  }
  function _generateLocal(n){
    n = n||1;
    var fresh=[]; for(var i=0;i<n;i++) fresh.push(_makeIdea());
    _commit(fresh);
  }
  function _parseIdeas(text){
    if(!text) return [];
    var s=text.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
    var a=s.indexOf('['), b=s.lastIndexOf(']');
    if(a>=0 && b>a) s=s.slice(a,b+1);
    var arr; try{ arr=JSON.parse(s); }catch(e){ return []; }
    if(!Array.isArray(arr)) return [];
    return arr.map(function(o){
      o=o||{};
      var feats=Array.isArray(o.features)?o.features.slice(0,5):[];
      while(feats.length<3) feats.push('Personalised onboarding');
      return {
        id: Date.now()+Math.floor(Math.random()*99999),
        name:String(o.name||'Untitled'),
        category:String(o.category||(_state.category!=='surprise'?_cap(_state.category):'App')),
        vibe:String(o.vibe||(_state.vibe!=='surprise'?_state.vibe:'fresh')),
        oneLiner:String(o.oneLiner||o.one_liner||''),
        problem:String(o.problem||''),
        solution:String(o.solution||''),
        differ:String(o.differ||o.why||''),
        features:feats.map(String),
        monetize:String(o.monetize||o.monetization||''),
        viral:String(o.viral||''),
        stack:String(o.stack||''),
        mvp:String(o.mvp||''),
        ts:Date.now()
      };
    });
  }
  function _generate(n){
    n = n||1;
    if(!(window.AIClient && AIClient.ready())) return _generateLocal(n);
    var el=document.getElementById('atb-list');
    if(el) el.innerHTML='<p class="atb-empty ai-streaming">✨ Claude is inventing '+n+' brand-new app idea'+(n>1?'s':'')+'…</p>';
    var catLine = _state.category!=='surprise' ? ('Category focus: '+_state.category+'. ') : 'Pick surprising, varied categories. ';
    var vibeLine = _state.vibe!=='surprise' ? ('Vibe: '+_state.vibe+'. ') : '';
    AIClient.stream({
      system:'You are a world-class startup ideator. Invent brand-new, original app ideas that are NOT clones of existing apps. Respond with ONLY a JSON array — no prose, no code fences.',
      prompt:'Invent '+n+' original mobile/web app idea'+(n>1?'s':'')+'. '+catLine+vibeLine+
        'Return a JSON array where each item has exactly these string fields: name, category, vibe, oneLiner, problem, solution, differ (why it is genuinely new and not a copy), monetize, viral (a growth hook), stack (MVP tech stack), mvp (4-6 week MVP scope), and features (an array of 4-5 short strings). Make each idea novel and specific.',
      maxTokens: Math.min(1500*n+500, 8000)
    }).then(function(text){
      var fresh=_parseIdeas(text);
      if(!fresh.length){ _generateLocal(n); return; }
      _commit(fresh);
    }).catch(function(){ _generateLocal(n); });
  }

  function _render(){
    var el=document.getElementById('atb-list'); if(!el) return;
    if(!_state.ideas.length){ el.innerHTML='<p class="atb-empty">Hit Generate to invent brand-new app ideas.</p>'; return; }
    el.innerHTML=_state.ideas.map(function(idea){
      var feats=idea.features.map(function(f){ return '<li>'+_esc(f)+'</li>'; }).join('');
      return ['<div class="atb-card" data-id="'+idea.id+'">',
        '<div class="atb-card-top">',
        '<div class="atb-name">'+_esc(idea.name)+'</div>',
        '<div class="atb-badges"><span class="atb-badge">'+_esc(idea.category)+'</span><span class="atb-badge atb-badge--vibe">'+_esc(idea.vibe)+'</span></div>',
        '</div>',
        '<div class="atb-oneliner">'+_esc(idea.oneLiner)+'</div>',
        '<div class="atb-row"><span class="atb-key">Problem</span>'+_esc(idea.problem)+'</div>',
        '<div class="atb-row"><span class="atb-key">Solution</span>'+_esc(idea.solution)+'</div>',
        '<div class="atb-row atb-row--new"><span class="atb-key">Why it\'s new</span>'+_esc(idea.differ)+'</div>',
        '<div class="atb-feat-lbl">Core features</div><ul class="atb-feats">'+feats+'</ul>',
        '<div class="atb-meta"><span class="atb-key">💰</span>'+_esc(idea.monetize)+'</div>',
        '<div class="atb-meta">'+_esc(idea.viral)+'</div>',
        '<div class="atb-meta atb-mono">'+_esc(idea.stack)+'</div>',
        '<div class="atb-meta atb-mono">'+_esc(idea.mvp)+'</div>',
        '<div class="atb-card-acts">',
        '<button class="atb-mini-btn" data-act="pin" data-id="'+idea.id+'">⭐ Pin</button>',
        '<button class="atb-mini-btn" data-act="copy" data-id="'+idea.id+'">Copy</button>',
        '<button class="atb-mini-btn" data-act="build" data-id="'+idea.id+'">➡ Send to Project Lab</button>',
        '</div>',
        '</div>'].join('');
    }).join('');
    _bindCards();
  }

  function _find(id){ return _state.ideas.find(function(x){ return String(x.id)===String(id); }); }

  function _bindCards(){
    document.querySelectorAll('.atb-mini-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        var idea=_find(btn.dataset.id); if(!idea) return;
        var act=btn.dataset.act;
        if(act==='copy'){ navigator.clipboard.writeText(_ideaText(idea)).then(function(){ btn.textContent='Copied!'; setTimeout(function(){ btn.textContent='Copy'; },1300); }); }
        else if(act==='pin'){ if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned app: '+idea.name, content:_ideaText(idea), tags:[idea.category,'pinned','app-idea'], pinned:true, building:'app-trend-builder' }); btn.textContent='⭐ Pinned!'; setTimeout(function(){ btn.textContent='⭐ Pin'; },1300); }
        else if(act==='build'){ if(window.BuildingWorkspace) BuildingWorkspace.open('project-lab',{ prefill:_ideaText(idea) }); }
      });
    });
  }

  function _buildHTML(){
    var catOpts=['<option value="surprise">🎲 Surprise me</option>'].concat(DOMAINS.map(function(d){ return '<option value="'+d+'">'+_cap(d)+'</option>'; })).join('');
    var vibeOpts=['<option value="surprise">🎲 Any vibe</option>'].concat(VIBES.map(function(v){ return '<option value="'+v+'">'+_cap(v)+'</option>'; })).join('');
    return [
      '<div class="atb-workspace">',
      '<div class="atb-grid-bg" aria-hidden="true"></div>',
      '<div class="atb-header">',
      '<div class="atb-hdr-icon">💡</div>',
      '<div><h2 class="atb-title">APP TREND BUILDER</h2><p class="atb-subtitle">Brand-new app ideas, invented on demand — never copied</p></div>',
      '</div>',
      '<div class="atb-controls">',
      '<div class="atb-sel-group"><label class="atb-label">Category</label><select class="atb-select" id="atb-cat">'+catOpts+'</select></div>',
      '<div class="atb-sel-group"><label class="atb-label">Vibe</label><select class="atb-select" id="atb-vibe">'+vibeOpts+'</select></div>',
      '<button class="atb-btn atb-btn--primary" id="atb-gen">⚡ Generate Idea</button>',
      '<button class="atb-btn atb-btn--gold" id="atb-gen5">🚀 Generate 5</button>',
      '<button class="atb-btn atb-btn--ghost" id="atb-clear">Clear</button>',
      '</div>',
      '<p class="atb-hint">Each idea fuses two unrelated domains with emerging tech and a retention mechanic — that fusion is what keeps them original. Pin the winners to your Memory Vault.</p>',
      '<div class="atb-list" id="atb-list"><p class="atb-empty">Hit Generate to invent brand-new app ideas.</p></div>',
      '</div>'
    ].join('\n');
  }

  function _bind(){
    var catEl=document.getElementById('atb-cat'); if(catEl) catEl.addEventListener('change',function(e){ _state.category=e.target.value; });
    var vibeEl=document.getElementById('atb-vibe'); if(vibeEl) vibeEl.addEventListener('change',function(e){ _state.vibe=e.target.value; });
    var gen=document.getElementById('atb-gen'); if(gen) gen.addEventListener('click',function(){ _generate(1); });
    var gen5=document.getElementById('atb-gen5'); if(gen5) gen5.addEventListener('click',function(){ _generate(5); });
    var clr=document.getElementById('atb-clear'); if(clr) clr.addEventListener('click',function(){ _state.ideas=[]; _render(); });
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    container.innerHTML=_buildHTML();
    _bind();
    if(!_state.ideas.length) _generateLocal(3); // instant seed; AI runs on Generate
    else _render();
  }

  return { mount:mount };
})();

window.AppTrendBuilder = AppTrendBuilder;
