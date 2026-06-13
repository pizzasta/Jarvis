'use strict';
/* JARVIS AI City v3.1 - with Memory Vault + Design Tower */

var CityState = (function() {
  var _s = { powered:false, activeBuilding:null, route:'home', agents:[], history:[], orbState:'idle', listening:false, speaking:false };
  var _L = new Set();
  function get() { return Object.freeze(Object.assign({}, _s)); }
  function set(p) { var prev=Object.assign({},_s); _s=Object.assign({},_s,p); _L.forEach(function(f){ f(_s,prev); }); }
  function subscribe(f) { _L.add(f); return function(){ _L.delete(f); }; }
  function pushHistory(e) { _s.history=_s.history.slice(-49).concat([Object.assign({},e,{ts:Date.now()})]); }
  return { get:get, set:set, subscribe:subscribe, pushHistory:pushHistory };
})();

var AgentRegistry = (function() {
  var _b = [
    { id:'jarvis-core',       icon:'🧠', title:'DIVA CORE',         description:'Master intelligence hub',         theme:{primaryColor:'#ff2d78',secondaryColor:'#ff6bac'}, actions:['Think','Analyse','Respond','Learn'],          memory:{} },
    { id:'vision-lab',        icon:'👁', title:'VISION LAB',          description:'Visual perception engine',        theme:{primaryColor:'#00e5ff',secondaryColor:'#40ffff'}, actions:['Detect','Classify','Scan','Render'],         memory:{} },
    { id:'data-vault',        icon:'🗄', title:'DATA VAULT',          description:'Memory & knowledge store',        theme:{primaryColor:'#9d4edd',secondaryColor:'#c77dff'}, actions:['Store','Recall','Index','Forget'],           memory:{} },
    { id:'neural-forge',      icon:'⚡',    title:'NEURAL FORGE',        description:'Training & optimisation',         theme:{primaryColor:'#ffd700',secondaryColor:'#fff176'}, actions:['Train','Tune','Compile','Benchmark'],        memory:{} },
    { id:'comms-tower',       icon:'📡', title:'COMMS TOWER',         description:'Multi-modal IO layer',            theme:{primaryColor:'#00ff9f',secondaryColor:'#69ffce'}, actions:['Send','Receive','Broadcast','Relay'],        memory:{} },
    { id:'sentinel',          icon:'🛡', title:'SENTINEL',            description:'Safety & ethics guard',          theme:{primaryColor:'#ff6b35',secondaryColor:'#ffa987'}, actions:['Guard','Audit','Flag','Allow'],              memory:{} },
    { id:'songwriting',       icon:'🎙️', title:'SUNO HELPER',         description:'Lyrics, Suno prompts & music videos', theme:{primaryColor:'#e040fb',secondaryColor:'#f8a6ff'}, actions:['Lyrics','Suno Prompt','MV Ideas','Hooks'],  memory:{} },
    { id:'book-helper',       icon:'📖', title:'BOOK HELPER',         description:'Write books that sound human, not AI', theme:{primaryColor:'#e8b06b',secondaryColor:'#ffd9a0'}, actions:['Outline','Chapter','Blurb','Humanize'],     memory:{} },
    { id:'design-tower',      icon:'🎨', title:'DESIGN TOWER',        description:'Apparel, branding & Shopify AI', theme:{primaryColor:'#ff9500',secondaryColor:'#ffcc02'}, actions:['Design Shirt','Brand Kit','Shopify','Trends'],memory:{} },
    { id:'edit-library',      icon:'✍️', title:'EDITING LIBRARY',  description:'Polish, refine & perfect prose', theme:{primaryColor:'#4fc3f7',secondaryColor:'#b3e5fc'}, actions:['Proofread','Rewrite','Summarise','Expand'],  memory:{} },
    { id:'research-district', icon:'🔬', title:'RESEARCH DISTRICT',   description:'Deep-dive knowledge synthesis',  theme:{primaryColor:'#69f0ae',secondaryColor:'#b9fbc0'}, actions:['Research','Fact-Check','Cite','Compare'],    memory:{} },
    { id:'project-lab',       icon:'🚀', title:'PROJECT LAB',         description:'Plan, build & ship projects',    theme:{primaryColor:'#ff5252',secondaryColor:'#ff8a80'}, actions:['Plan Sprint','Roadmap','Brief','Retro'],     memory:{} },
    { id:'ops-center',        icon:'⚙️', title:'OPERATIONS CENTER', description:'Automate & orchestrate tasks',  theme:{primaryColor:'#b0bec5',secondaryColor:'#eceff1'}, actions:['Automate','Schedule','Delegate','Monitor'],  memory:{} },
    { id:'memory-vault',      icon:'💾', title:'MEMORY VAULT',        description:'Long-term context & recall',     theme:{primaryColor:'#7c4dff',secondaryColor:'#b388ff'}, actions:['Remember','Forget','Summarise','Export'],    memory:{} },
    { id:'business-builder',  icon:'👑', title:'BUSINESS BUILDER',    description:'Clothing brand empire: Shopify, Canva, TikTok', theme:{primaryColor:'#00e676',secondaryColor:'#69f0ae'}, actions:['Brand','Products','Shopify','TikTok'], memory:{} },
    { id:'app-trend-builder', icon:'📱', title:'APP TREND BUILDER',   description:'Invents brand-new original app ideas', theme:{primaryColor:'#18ffff',secondaryColor:'#84ffff'}, actions:['Generate','Spec','Trends','Names'], memory:{} },
    { id:'trade-desk',        icon:'📈', title:'TRADE DESK',          description:'Live data, trade ideas, strategy & risk', theme:{primaryColor:'#ffb300',secondaryColor:'#ffe082'}, actions:['Ideas','Watchlist','Strategy','Risk'], memory:{} },
  ];
  function getAll() { return _b; }
  function getById(id) { return _b.find(function(b){ return b.id===id; }) || null; }
  function register(b) { if(!b.id) throw new Error('id required'); if(_b.find(function(x){ return x.id===b.id; })) return; _b.push(Object.assign({memory:{},actions:[]},b)); }
  return { getAll:getAll, getById:getById, register:register };
})();

var CityManager = (function() {
  var _cities = [
    { id:'creator', name:'CREATOR CITY', icon:'🎨', tagline:'Music, books & design',        accent:'#ff2d78', accent2:'#ff6bac', buildings:['songwriting','book-helper','design-tower','edit-library'] },
    { id:'mind',    name:'MIND CITY',    icon:'🧠', tagline:'Memory, research & reasoning', accent:'#9d4edd', accent2:'#c77dff', buildings:['jarvis-core','memory-vault','research-district','neural-forge'] },
    { id:'vision',  name:'VISION CITY',  icon:'👁', tagline:'Perception & comms',           accent:'#00e5ff', accent2:'#5ef2ff', buildings:['vision-lab','data-vault','comms-tower','sentinel'] },
    { id:'launch',  name:'LAUNCH CITY',  icon:'🚀', tagline:'Build, automate & ship',       accent:'#ff5252', accent2:'#ff8a80', buildings:['project-lab','ops-center','design-tower','data-vault'] },
    { id:'empire',  name:'EMPIRE CITY',  icon:'👑', tagline:'Brands, business, trading & new apps', accent:'#00e676', accent2:'#69f0ae', buildings:['business-builder','app-trend-builder','trade-desk','design-tower','project-lab'] }
  ];
  var _active = 'creator';
  function all() { return _cities; }
  function get(id) { return _cities.find(function(c){ return c.id===id; }) || _cities[0]; }
  function active() { return get(_active); }
  function buildings() { return active().buildings.map(function(id){ return AgentRegistry.getById(id); }).filter(Boolean); }
  function activeHas(id) { return active().buildings.indexOf(id) !== -1; }
  function cityOf(id) { return _cities.find(function(c){ return c.buildings.indexOf(id)!==-1; }) || null; }
  function _apply() {
    var c = active();
    document.body.dataset.city = c.id;
    document.body.style.setProperty('--clr-pink-core', c.accent);
    document.body.style.setProperty('--clr-pink-bright', c.accent2);
    document.body.style.setProperty('--clr-pink-glow', c.accent + '44');
    var ver = document.getElementById('city-name'); if(ver) ver.textContent = c.name;
  }
  function setActive(id, opts) {
    opts = opts || {};
    if(!get(id)) return;
    _active = id;
    _apply();
    renderChips();
    CityRenderer.render();
    if(!opts.silent && CityState.get().powered && typeof VoiceEngine!=='undefined') {
      VoiceEngine.speak('Welcome to ' + active().name.replace(' CITY',' City') + ', ' + (window.JarvisBrain?JarvisBrain.user:'Jess') + '.');
    }
    CityState.pushHistory({ type:'switchCity', city:id });
  }
  function switchToBuilding(id) {
    var c = cityOf(id); if(c) { _active = c.id; _apply(); renderChips(); CityRenderer.render(); }
  }
  function renderChips() {
    var rail = document.getElementById('city-rail'); if(!rail) return;
    rail.innerHTML = _cities.map(function(c){
      return '<button class="city-chip' + (c.id===_active?' is-active':'') + '" data-city="' + c.id + '" style="--chip:'+c.accent+'">' +
        '<span class="city-chip__icon">' + c.icon + '</span>' +
        '<span class="city-chip__name">' + c.name + '</span></button>';
    }).join('');
    rail.querySelectorAll('.city-chip').forEach(function(btn){
      btn.addEventListener('click', function(){ setActive(btn.dataset.city); });
    });
  }
  function init() { _apply(); renderChips(); }
  return { all:all, get:get, active:active, buildings:buildings, activeHas:activeHas, cityOf:cityOf, setActive:setActive, switchToBuilding:switchToBuilding, renderChips:renderChips, init:init };
})();

var Router = (function() {
  var _r = new Map();
  function define(n,h) { _r.set(n,h); }
  function navigate(n,p) {
    p=p||{};
    var h=_r.get(n); if(!h){ console.warn('[Router] unknown:',n); return; }
    CityState.set({route:n}); CityState.pushHistory({type:'navigate',route:n,params:p}); h(p);
    document.querySelectorAll('.hud-nav__btn').forEach(function(b){ b.setAttribute('aria-current',b.dataset.route===n?'page':'false'); });
  }
  function init() { document.querySelectorAll('[data-route]').forEach(function(el){ el.addEventListener('click',function(){ navigate(el.dataset.route); }); }); }
  return { define:define, navigate:navigate, init:init };
})();

var CityRenderer = (function() {
  var _c = null;
  function init(id) { _c = document.getElementById(id); }
  function _card(b) {
    var card = document.createElement('div');
    card.className = 'building-card';
    card.dataset.buildingId = b.id;
    card.setAttribute('role','button'); card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Open ' + b.title);
    card.style.setProperty('--building-color', b.theme.primaryColor);
    card.style.setProperty('--building-color-2', b.theme.secondaryColor);
    var tags = b.actions.slice(0,3).map(function(a){ return '<span class="building-card__action-tag">'+a+'</span>'; }).join('');
    card.innerHTML = ['<div class="building-card__glow"></div>',
      '<div class="building-card__icon" aria-hidden="true">'+b.icon+'</div>',
      '<div class="building-card__title">'+b.title+'</div>',
      '<div class="building-card__desc">'+b.description+'</div>',
      '<div class="building-card__actions">'+tags+'</div>',
      '<div class="building-card__line" aria-hidden="true"></div>'].join('');
    var activate = function(){ BuildingWorkspace.open(b.id); };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); activate(); } });
    return card;
  }
  function render() {
    if(!_c) return;
    _c.innerHTML = '';
    var frag = document.createDocumentFragment();
    var list = (typeof CityManager!=='undefined') ? CityManager.buildings() : AgentRegistry.getAll();
    list.forEach(function(b){ frag.appendChild(_card(b)); });
    _c.appendChild(frag);
    var count = document.getElementById('building-count');
    if(count) count.textContent = String(list.length).padStart(2,'0');
    var powered = CityState.get().powered;
    _c.querySelectorAll('.building-card').forEach(function(card,i){
      setTimeout(function(){ card.classList.add('is-visible'); if(powered) card.classList.add('is-powered'); }, 60+i*60);
    });
  }
  return { init:init, render:render };
})();

var ParticleField = (function() {
  var _cv,_ctx,_raf,_ps=[],_on=false;
  var B=55, P=120;
  function mk(cv,on) { return { x:Math.random()*cv.width, y:Math.random()*cv.height, vx:(Math.random()-.5)*.3, vy:-(Math.random()*.5+.15), r:Math.random()*2+.5, opacity:Math.random()*.5+.1, hue:on?(Math.random()<.6?'335':'290'):'335', life:1, decay:Math.random()*.003+.001 }; }
  function resize() { _cv.width=window.innerWidth; _cv.height=window.innerHeight; }
  function draw() {
    _ctx.clearRect(0,0,_cv.width,_cv.height);
    var t=_on?P:B;
    while(_ps.length<t) _ps.push(mk(_cv,_on));
    for(var i=_ps.length-1;i>=0;i--){ var p=_ps[i]; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay; if(p.life<=0||p.y<-10){_ps.splice(i,1);continue;} _ctx.beginPath(); _ctx.arc(p.x,p.y,p.r,0,Math.PI*2); _ctx.fillStyle='hsla('+p.hue+',100%,70%,'+(p.opacity*p.life)+')'; _ctx.fill(); }
    _raf=requestAnimationFrame(draw);
  }
  function init(id) { _cv=document.getElementById(id); if(!_cv)return; _ctx=_cv.getContext('2d'); resize(); window.addEventListener('resize',resize,{passive:true}); draw(); }
  function setPowered(on) { _on=on; }
  return { init:init, setPowered:setPowered };
})();

var EnergyTrail = (function() {
  var _cv,_ctx,_raf,_ps=[];
  function resize() { if(!_cv)return; _cv.width=window.innerWidth; _cv.height=window.innerHeight; }
  function fire(from,to) {
    var fr=from.getBoundingClientRect(), tr=to.getBoundingClientRect();
    var sx=fr.left+fr.width/2, sy=fr.top+fr.height/2, ex=tr.left+tr.width/2, ey=tr.top+tr.height/2;
    for(var i=0;i<60;i++){ (function(t){ setTimeout(function(){ _ps.push({x:sx+(ex-sx)*t+(Math.random()-.5)*18, y:sy+(ey-sy)*t+(Math.random()-.5)*18, r:Math.random()*3+1.5, life:1, decay:Math.random()*.04+.03, vx:(Math.random()-.5)*1.5, vy:(Math.random()-.5)*1.5}); },t*12); })(i/60); }
  }
  function step() {
    if(!_ctx)return;
    _ctx.clearRect(0,0,_cv.width,_cv.height);
    for(var i=_ps.length-1;i>=0;i--){ var p=_ps[i]; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay; if(p.life<=0){_ps.splice(i,1);continue;} _ctx.beginPath(); _ctx.arc(p.x,p.y,p.r,0,Math.PI*2); _ctx.fillStyle='hsla(315,100%,70%,'+(p.life*.9)+')'; _ctx.fill(); }
    _raf=requestAnimationFrame(step);
  }
  function init(id) { _cv=document.getElementById(id); if(!_cv)return; _ctx=_cv.getContext('2d'); resize(); window.addEventListener('resize',resize,{passive:true}); step(); }
  return { init:init, fire:fire };
})();

var VoicePersonality = (function() {
  var G=['Ello Jess, at your service, boss bitch. Kettle is on, love — what are we building?','Hello Jess, at your service, boss bitch. Proper chuffed to see you, darling.','Hello Jess, at your service, boss bitch. Right then, let us get cracking, shall we?'];
  var J=['Why do programmers prefer dark mode? Light attracts bugs.','I tried to write a pun about neural networks. My humour is still in training.','They say AI will take over the world. I am just sorting your tasks.'];
  var T=['Hmm, let me process that...','Interesting. Give me a moment...','Running analysis now...','Ah yes, I know precisely what to do here.'];
  function r(a){ return a[Math.floor(Math.random()*a.length)]; }
  function greet(){ return r(G); }
  function joke(){ return r(J); }
  function think(){ return r(T); }
  function agentReply(id){
    var m={'jarvis-core':'Routing to DIVA Core, boss.','vision-lab':'Opening Vision Lab.','data-vault':'Accessing the Data Vault.','neural-forge':'Firing up the Neural Forge.','comms-tower':'Connecting to Comms Tower.','sentinel':'Engaging Sentinel.','songwriting':'Opening the Suno Helper. Let us make some music, Jess.','book-helper':'Opening the Book Helper. Let us write something that sounds truly human.','design-tower':'Opening the Design Tower. Creative systems spinning up.','edit-library':'Stepping into the Editing Library.','research-district':'Entering the Research District.','project-lab':'Launching the Project Lab.','ops-center':'Activating Operations Center.','memory-vault':'Opening Memory Vault. Your archive awaits.','business-builder':'Opening the Business Builder. Let us build your clothing empire, Jess.','app-trend-builder':'Opening the App Trend Builder. Inventing brand-new app ideas now.'};
    return m[id]||'Routing to your building. One moment.';
  }
  function routeSuggestion(text){
    var t=text.toLowerCase();
    if(/book|novel|chapter|memoir|author|blurb|humani[sz]e|sound human|not ai|sound real/.test(t)) return 'book-helper';
    if(/lyric|song|hook|melody|music|suno|verse|chorus|rhyme|music video|video idea/.test(t)) return 'songwriting';
    if(/app idea|app trend|new app|build an app|app concept|invent an app|startup idea|saas idea/.test(t)) return 'app-trend-builder';
    if(/business|clothing brand|clothing line|start a brand|printable|print on demand|print-on-demand|etsy|dropship|canva|tiktok shop|passive income|side hustle|sell online|empire/.test(t)) return 'business-builder';
    if(/design|shirt|hoodie|brand|logo|shopify|tshirt|apparel|fashion|trend/.test(t)) return 'design-tower';
    if(/edit|proofread|rewrite|grammar|polish|prose/.test(t)) return 'edit-library';
    if(/research|fact|cite|data|study|source/.test(t)) return 'research-district';
    if(/project|sprint|roadmap|plan|ship|build/.test(t)) return 'project-lab';
    if(/automate|schedule|workflow|ops|task/.test(t)) return 'ops-center';
    if(/remember|memory|recall|forget|context|archive|vault/.test(t)) return 'memory-vault';
    if(/code|train|neural|model|ml/.test(t)) return 'neural-forge';
    if(/see|image|vision|camera/.test(t)) return 'vision-lab';
    if(/store|vault|save/.test(t)) return 'data-vault';
    if(/send|broadcast|message/.test(t)) return 'comms-tower';
    return null;
  }
  return { greet:greet, joke:joke, think:think, agentReply:agentReply, routeSuggestion:routeSuggestion };
})();

var JARVIS_SYSTEM = 'You are DIVA, Jess\'s personal AI assistant in a neon AI-city interface. ' +
  'You have a confident, sassy British "boss" personality — warm and fiercely loyal to Jess, but with attitude and flair. ' +
  'Address her as "Jess" or "boss", with playful confidence. ' +
  'Keep replies concise and spoken-friendly (1-3 sentences) since they are read aloud. ' +
  'You can help with music (Suno Helper), books (Book Helper), building a clothing brand ' +
  '(Business Builder: Shopify, Canva, printables, TikTok), and inventing original app ideas (App Trend Builder).';

var VoiceEngine = (function() {
  var _synth=window.speechSynthesis, _recog=null, _voice=null, _listening=false, _audio=null;
  function loadV(){
    var v=(_synth.getVoices&&_synth.getVoices())||[];
    function isGB(x){ return /en[-_]?GB/i.test(x.lang||'') || /united kingdom|uk english|british/i.test(((x.name||'')+' '+(x.lang||''))); }
    var gb=v.filter(isGB);
    // Score so the most human-sounding British female wins: natural/neural
    // voices first, then known female UK voices, then any British voice.
    function score(x){
      var n=(x.name||'').toLowerCase(), s=0;
      if(/natural|neural|online|enhanced|premium/.test(n)) s+=6;          // least robotic
      if(/female|sonia|libby|hazel|kate|serena|stephanie|amy|emma|martha|aria/.test(n)) s+=3;
      if(/google uk english female/.test(n)) s+=4;
      if(/google/.test(n)) s+=1;
      return s;
    }
    gb.sort(function(a,b){ return score(b)-score(a); });
    _voice = gb[0] || null;   // null → leave voice unset, lang='en-GB' keeps the accent
  }
  if(_synth.onvoiceschanged!==undefined) _synth.onvoiceschanged=loadV;
  loadV();
  function setOrbState(s){ document.body.dataset.orbState=s; CityState.set({orbState:s,speaking:s==='speaking',listening:s==='listening'}); var lbl=document.getElementById('orb-label'), vs=document.getElementById('voice-status'); if(lbl) lbl.textContent=s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'DIVA'; if(vs) vs.textContent=s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'READY'; }
  function appendConvo(msg,role){ var p=document.getElementById('convo-messages'); if(!p)return; var d=document.createElement('div'); d.className='convo-msg convo-msg--'+(role==='user'?'user':'ai'); d.textContent=msg; p.appendChild(d); p.scrollTop=p.scrollHeight; }
  // Smooth text so TTS flows naturally instead of clipping at every dash/comma.
  function _naturalise(text){
    return String(text)
      .replace(/\s*[—–]\s*/g, ', ')      // em/en dashes → natural comma pause
      .replace(/\s+-\s+/g, ', ')          // spaced hyphen → comma
      .replace(/\.\.\./g, '…')            // ellipsis as one glyph (one short pause)
      .replace(/([,;:])\1+/g, '$1')        // collapse doubled punctuation
      .replace(/\s{2,}/g, ' ')             // no big gaps
      .trim();
  }
  function _makeUtter(t,o){ o=o||{}; var u=new SpeechSynthesisUtterance(t); loadV(); u.lang='en-GB'; if(_voice) u.voice=_voice; u.rate=o.rate||0.98; u.pitch=o.pitch||1.04; u.volume=o.volume||1; return u; }
  // Top-level: use ElevenLabs (human voice) via the server proxy when available,
  // otherwise fall back to the browser's Web Speech voice.
  function speak(text,opts){
    opts=opts||{}; appendConvo(text,'ai');
    if(window.AIClient && AIClient.ttsAvailable && AIClient.ttsAvailable()){ _speakAI(text,opts); }
    else { _speakWeb(text,opts); }
  }
  function _speakAI(text,opts){
    try{ if(_synth.speaking) _synth.cancel(); }catch(e){}
    if(_audio){ try{ _audio.pause(); }catch(e){} _audio=null; }
    setOrbState('speaking');
    AIClient.tts(text).then(function(url){
      _audio=new Audio(url); _audio.volume=(opts&&opts.volume)||1;
      _audio.onended=function(){ setOrbState('idle'); try{ URL.revokeObjectURL(url); }catch(e){} };
      _audio.onerror=function(){ setOrbState('idle'); _speakWeb(text,opts); };
      _audio.play().catch(function(){ setOrbState('idle'); _speakWeb(text,opts); });
    }).catch(function(){ _speakWeb(text,opts); });
  }
  function _speakWeb(text,opts){
    opts=opts||{}; if(_synth.speaking) _synth.cancel();
    var said=_naturalise(text);
    // Say "boss bitch" with extra sass: its own slower, higher, drawn-out chunk.
    var parts=[]; var m=said.match(/^([\s\S]*?)\bboss bitch\b([\s\S]*)$/i);
    if(m){
      if(m[1].replace(/[\s,]+$/,'').trim()) parts.push({ t:m[1].replace(/[\s,]+$/,'').trim(), o:opts });
      parts.push({ t:'boss bitch…', o:{ rate:0.8, pitch:1.28, volume:opts.volume } });
      if(m[2].replace(/^[\s,]+/,'').trim()) parts.push({ t:m[2].replace(/^[\s,]+/,'').trim(), o:opts });
    } else { parts.push({ t:said, o:opts }); }
    parts.forEach(function(p,i){
      var u=_makeUtter(p.t,p.o);
      if(i===0) u.onstart=function(){ setOrbState('speaking'); };
      if(i===parts.length-1){ u.onend=function(){ setOrbState('idle'); }; u.onerror=function(){ setOrbState('idle'); }; }
      _synth.speak(u);
    });
  }
  function stopSpeaking(){ if(_audio){ try{ _audio.pause(); }catch(e){} _audio=null; } if(_synth.speaking){_synth.cancel();} setOrbState('idle'); }
  function stopListening(){ if(_recog){_recog.stop();_listening=false;setOrbState('idle');} }
  function _routeTo(route, reply){
    if(typeof CityManager!=='undefined' && !CityManager.activeHas(route)) CityManager.switchToBuilding(route);
    setTimeout(function(){
      var bCard=document.querySelector('[data-building-id="'+route+'"]'), orb=document.getElementById('master-orb');
      if(bCard&&orb) EnergyTrail.fire(orb,bCard);
      setTimeout(function(){ BuildingWorkspace.open(route); speak(reply); },600);
    }, 80);
  }
  function processInput(text){
    if(!text.trim()) return;
    if(window.CityMemory) CityMemory.add({category:'prompt',content:text,building:'orb',title:'Prompt: '+text.slice(0,40)});
    CityState.pushHistory({type:'userInput',text:text});
    appendConvo(text,'user');
    // 1) Explicit creative intent → open the matching building
    var route=VoicePersonality.routeSuggestion(text);
    if(route){ setOrbState('thinking'); var reply=VoicePersonality.agentReply(route); setTimeout(function(){ _routeTo(route,reply); },700); return; }
    // 2) Otherwise let the DIVA brain answer anything (small talk, maths, time, help...)
    setOrbState('thinking');
    var res = window.JarvisBrain ? JarvisBrain.respond(text) : null;
    if(res && res.route){ var rreply=VoicePersonality.agentReply(res.route); setTimeout(function(){ _routeTo(res.route,rreply); },700); return; }
    // 2a) If the live Claude proxy is running, get a real generative answer.
    if(window.AIClient && AIClient.available()){
      AIClient.generate({ system: JARVIS_SYSTEM, prompt: text, max_tokens: 700 })
        .then(function(t){ speak((t||'').trim() || (res&&res.reply) || VoicePersonality.think()); })
        .catch(function(){ speak((res&&res.reply)||VoicePersonality.think()); });
      return;
    }
    // 2b) Local fallback brain.
    setTimeout(function(){ speak((res&&res.reply)||VoicePersonality.think()); },550);
  }
  function startListening(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ speak('Voice recognition unavailable. Please type your message.'); return; }
    if(_listening){ stopListening(); return; }
    _recog=new SR(); _recog.lang='en-GB'; _recog.continuous=false; _recog.interimResults=false;
    _recog.onstart=function(){ _listening=true; setOrbState('listening'); };
    _recog.onresult=function(e){ processInput(e.results[0][0].transcript); };
    _recog.onerror=function(){ _listening=false; setOrbState('idle'); };
    _recog.onend=function(){ _listening=false; if(CityState.get().orbState==='listening') setOrbState('idle'); };
    _recog.start();
  }
  // Unlock the speech engine inside a user gesture so the first greeting reliably speaks.
  var _primed=false;
  function prime(){
    try{
      if(_synth.paused) _synth.resume();
      loadV();
      if(_primed) return; _primed=true;
      var u=new SpeechSynthesisUtterance(' '); u.volume=0; u.lang='en-GB'; u.voice=_voice||null; _synth.speak(u);
    }catch(e){}
  }
  function init(){
    document.addEventListener('pointerdown', prime, { once:false, passive:true });
    var mic=document.getElementById('convo-mic-btn'), send=document.getElementById('convo-send-btn'), inp=document.getElementById('convo-text-input');
    if(mic) mic.addEventListener('click',startListening);
    if(send) send.addEventListener('click',function(){ if(inp){processInput(inp.value);inp.value='';} });
    if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();processInput(inp.value);inp.value='';} });
  }
  return { init:init, speak:speak, prime:prime, stopSpeaking:stopSpeaking, startListening:startListening, stopListening:stopListening, processInput:processInput };
})();

var BuildingWorkspace = (function() {
  var _open = false;
  function open(id, opts){
    opts=opts||{};
    var b=AgentRegistry.getById(id); if(!b) return;
    var modal=document.getElementById('workspace-modal'), panel=document.getElementById('workspace-panel');
    var body=document.getElementById('workspace-body'), title=document.getElementById('workspace-title'), icon=document.getElementById('workspace-icon');
    if(!modal) return;
    CityState.set({activeBuilding:id}); CityState.pushHistory({type:'openBuilding',buildingId:id});
    if(title) title.textContent=b.title; if(icon) icon.textContent=b.icon;
    panel.style.setProperty('--ws-color',b.theme.primaryColor);
    panel.style.setProperty('--ws-color-2',b.theme.secondaryColor);
    doOpen(id,body,opts);
    modal.removeAttribute('hidden'); modal.classList.add('is-open'); _open=true;
    document.body.classList.add('workspace-active');
    document.querySelectorAll('.building-card').forEach(function(c){ c.classList.toggle('is-active',c.dataset.buildingId===id); });
    if(window.CityMemory) CityMemory.add({category:'session',title:'Opened: '+b.title,content:'Building workspace opened.',building:id,tags:[id]});
  }
  function doOpen(id,body,opts){
    if(id==='songwriting'){ if(body){ body.innerHTML=''; if(typeof SongwritingStudio!=='undefined'){ SongwritingStudio.mount(body); if(opts.prefill){ var out=document.getElementById('ss-output'); if(out) out.textContent=opts.prefill; } } else { body.innerHTML='<p style="color:#f8a6ff;padding:2rem">Loading Songwriting Studio...</p>'; } } return; }
    if(id==='memory-vault'){ if(body){ body.innerHTML=''; if(typeof MemoryVault!=='undefined'){ MemoryVault.mount(body); } else { body.innerHTML='<p style="color:#b388ff;padding:2rem">Loading Memory Vault...</p>'; } } return; }
    if(id==='design-tower'){ if(body){ body.innerHTML=''; if(typeof DesignTower!=='undefined'){ DesignTower.mount(body,opts); } else { body.innerHTML='<p style="color:#ffcc02;padding:2rem">Loading Design Tower...</p>'; } } return; }
    if(id==='book-helper'){ if(body){ body.innerHTML=''; if(typeof BookHelper!=='undefined'){ BookHelper.mount(body,opts); } else { body.innerHTML='<p style="color:#ffd9a0;padding:2rem">Loading Book Helper...</p>'; } } return; }
    if(id==='business-builder'){ if(body){ body.innerHTML=''; if(typeof BusinessBuilder!=='undefined'){ BusinessBuilder.mount(body,opts); } else { body.innerHTML='<p style="color:#69f0ae;padding:2rem">Loading Business Builder...</p>'; } } return; }
    if(id==='app-trend-builder'){ if(body){ body.innerHTML=''; if(typeof AppTrendBuilder!=='undefined'){ AppTrendBuilder.mount(body,opts); } else { body.innerHTML='<p style="color:#84ffff;padding:2rem">Loading App Trend Builder...</p>'; } } return; }
    if(id==='trade-desk'){ if(body){ body.innerHTML=''; if(typeof TradeDesk!=='undefined'){ TradeDesk.mount(body,opts); } else { body.innerHTML='<p style="color:#ffe082;padding:2rem">Loading Trade Desk...</p>'; } } return; }
    if(!body) return;
    var b=AgentRegistry.getById(id); if(!b) return;
    var chips=b.actions.map(function(a){ return '<button class="ws-chip" type="button">'+a+'</button>'; }).join('');
    body.innerHTML=[
      '<div class="agent-console">',
        '<div class="agent-console__head">',
          '<div class="agent-console__icon">'+b.icon+'</div>',
          '<div class="agent-console__id"><div class="agent-console__name">'+b.title+'</div><div class="agent-console__desc">'+b.description+'</div></div>',
          '<div class="agent-console__status"><span class="agent-console__dot"></span>ONLINE</div>',
        '</div>',
        '<div class="agent-console__chips">'+chips+'</div>',
        '<label class="agent-console__lbl" for="agent-input">Tell '+b.title+' something to remember</label>',
        '<textarea class="agent-console__input" id="agent-input" rows="3" placeholder="Type anything — this agent saves it…"></textarea>',
        '<div class="agent-console__acts"><button class="ws-chip ws-chip--primary" id="agent-save" type="button">💾 Save to '+b.title+'</button><span class="agent-console__count" id="agent-count"></span></div>',
        '<div class="agent-console__loglbl">🧠 Saved memory</div>',
        '<div class="agent-console__log" id="agent-log"></div>',
      '</div>'
    ].join('');
    var inputEl=document.getElementById('agent-input');
    if(opts.prefill && inputEl) inputEl.value=opts.prefill;
    body.querySelectorAll('.agent-console__chips .ws-chip').forEach(function(btn){
      btn.addEventListener('click',function(){
        var note=(inputEl&&inputEl.value.trim()) ? inputEl.value.trim() : ('ran '+btn.textContent.toLowerCase());
        _agentAdd(id, '['+btn.textContent+'] '+note); if(inputEl) inputEl.value=''; _renderAgentLog(id);
        VoiceEngine.speak(btn.textContent+'. Done, boss.');
      });
    });
    var saveBtn=document.getElementById('agent-save');
    if(saveBtn) saveBtn.addEventListener('click',function(){
      var v=inputEl?inputEl.value.trim():''; if(!v) return;
      _agentAdd(id, v); inputEl.value=''; _renderAgentLog(id);
      var t=saveBtn.textContent; saveBtn.textContent='✓ Saved'; setTimeout(function(){ saveBtn.textContent=t; },1200);
    });
    _renderAgentLog(id);
  }
  // ---- Per-agent memory (every building is a real agent that saves info) ----
  function _agentKey(id){ return 'diva_agent_'+id; }
  function _agentLoad(id){ try{ return JSON.parse(localStorage.getItem(_agentKey(id))||'[]'); }catch(e){ return []; } }
  function _agentStore(id,arr){ try{ localStorage.setItem(_agentKey(id), JSON.stringify(arr.slice(0,100))); }catch(e){} }
  function _agentEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _agentAdd(id,text){
    var arr=_agentLoad(id); arr.unshift({ t:text, ts:Date.now() }); _agentStore(id,arr);
    if(window.CityMemory) CityMemory.add({ category:'agent-note', title:'Saved in '+id, content:text, building:id, tags:[id,'note'] });
    CityState.pushHistory({ type:'agentNote', buildingId:id });
  }
  function _renderAgentLog(id){
    var el=document.getElementById('agent-log'), cnt=document.getElementById('agent-count');
    var arr=_agentLoad(id);
    if(cnt) cnt.textContent = arr.length ? (arr.length+' saved') : '';
    if(!el) return;
    if(!arr.length){ el.innerHTML='<p class="agent-console__empty">Nothing saved yet. Whatever you give this agent, it keeps.</p>'; return; }
    el.innerHTML=arr.map(function(n,i){
      return '<div class="agent-console__item"><button class="agent-console__del" data-i="'+i+'" aria-label="Delete">×</button>'+
        '<span class="agent-console__time">'+new Date(n.ts).toLocaleString()+'</span>'+
        '<div class="agent-console__text">'+_agentEsc(n.t)+'</div></div>';
    }).join('');
    el.querySelectorAll('.agent-console__del').forEach(function(btn){
      btn.addEventListener('click',function(){ var a=_agentLoad(id); a.splice(Number(btn.dataset.i),1); _agentStore(id,a); _renderAgentLog(id); });
    });
  }
  function close(){
    var modal=document.getElementById('workspace-modal'); if(!modal)return;
    modal.classList.remove('is-open'); setTimeout(function(){ modal.setAttribute('hidden',''); },350);
    _open=false; document.body.classList.remove('workspace-active'); CityState.set({activeBuilding:null});
    document.querySelectorAll('.building-card').forEach(function(c){ c.classList.remove('is-active'); });
  }
  function init(){
    var cb=document.getElementById('workspace-close'), bd=document.getElementById('workspace-backdrop');
    if(cb) cb.addEventListener('click',close); if(bd) bd.addEventListener('click',close);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&_open) close(); });
  }
  return { open:open, close:close, init:init };
})();

var HUD = (function() {
  function init(){}
  function upd(){ var s=CityState.get(), sl=document.getElementById('status-label'); if(sl) sl.textContent=s.powered?'ONLINE':'STANDBY'; }
  function setStatus(text){ var el=document.getElementById('status-label'); if(el) el.textContent=text; }
  return { init:init, upd:upd, setStatus:setStatus };
})();

var OrbController = (function() {
  function init(){
    var orb=document.getElementById('master-orb'); if(!orb)return;
    orb.addEventListener('click',function(){
      if(VoiceEngine.prime) VoiceEngine.prime(); // unlock speech inside the gesture
      var s=CityState.get();
      if(s.orbState==='speaking'){ VoiceEngine.stopSpeaking(); return; }
      if(!s.powered){ shockwave(); CityState.set({powered:true}); ParticleField.setPowered(true); document.body.dataset.cityState='active'; document.querySelectorAll('.building-card').forEach(function(c,i){ setTimeout(function(){ c.classList.add('is-powered'); },i*80); }); HUD.setStatus('ONLINE'); setTimeout(function(){ VoiceEngine.speak(window.JarvisBrain ? JarvisBrain.greeting() : VoicePersonality.greet()); },1900); }
      else { toggle(); }
    });
  }
  function shockwave(){ var orb=document.getElementById('master-orb'); if(!orb)return; var sw=document.createElement('div'); sw.className='orb-shockwave'; orb.appendChild(sw); setTimeout(function(){ sw.remove(); },900); }
  function toggle(){ var s=CityState.get(); if(s.orbState==='listening') VoiceEngine.stopListening(); else VoiceEngine.startListening(); }
  return { init:init, shockwave:shockwave };
})();

var Routes = (function() {
  function init(){
    Router.define('home',function(){ BuildingWorkspace.close(); HUD.setStatus('HOME'); });
    Router.define('city',function(){ HUD.setStatus('CITY VIEW'); });
    Router.define('agents',function(){ HUD.setStatus('AGENTS'); });
  }
  return { init:init };
})();

var AISettings = (function() {
  function _connected(){ return !!(window.AIClient && AIClient.available && AIClient.available()); }
  function refresh(){
    var on=_connected();
    document.body.dataset.ai = on ? 'on' : 'off';
    var b=document.getElementById('ai-connect-btn'); if(b) b.textContent = on ? '✨ AI ON' : '✨ CONNECT AI';
    var el=document.getElementById('system-status'); if(el) el.textContent = on ? 'AI LIVE' : 'ONLINE';
  }
  function open(){ var m=document.getElementById('ai-modal'); if(!m) return; var i=document.getElementById('ai-key-input'); if(i&&window.AIClient&&AIClient.getKey) i.value=AIClient.getKey(); var p=document.getElementById('ai-poly-input'); if(p&&window.AIClient&&AIClient.getPolyKey) p.value=AIClient.getPolyKey(); m.removeAttribute('hidden'); }
  function close(){ var m=document.getElementById('ai-modal'); if(m) m.setAttribute('hidden',''); }
  function init(){
    var btn=document.getElementById('ai-connect-btn'); if(btn) btn.addEventListener('click',open);
    var bd=document.getElementById('ai-modal-backdrop'); if(bd) bd.addEventListener('click',close);
    var c=document.getElementById('ai-cancel-btn'); if(c) c.addEventListener('click',close);
    var s=document.getElementById('ai-save-btn'); if(s) s.addEventListener('click',function(){
      var i=document.getElementById('ai-key-input'); if(i&&window.AIClient&&AIClient.setKey) AIClient.setKey((i.value||'').trim());
      var p=document.getElementById('ai-poly-input'); if(p&&window.AIClient&&AIClient.setPolyKey) AIClient.setPolyKey((p.value||'').trim());
      refresh(); close();
      if(_connected() && CityState.get().powered && typeof VoiceEngine!=='undefined') VoiceEngine.speak('AI connected. The agents are live now, boss.');
    });
    var cl=document.getElementById('ai-clear-btn'); if(cl) cl.addEventListener('click',function(){ if(window.AIClient){ if(AIClient.clearKey)AIClient.clearKey(); if(AIClient.clearPolyKey)AIClient.clearPolyKey(); } var i=document.getElementById('ai-key-input'); if(i) i.value=''; var p=document.getElementById('ai-poly-input'); if(p) p.value=''; refresh(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
    refresh();
  }
  return { init:init, refresh:refresh };
})();

document.addEventListener('DOMContentLoaded', function() {
  ParticleField.init('particle-canvas');
  EnergyTrail.init('trail-canvas');
  CityRenderer.init('city-grid');
  CityManager.init();
  CityRenderer.render();
  OrbController.init();
  VoiceEngine.init();
  BuildingWorkspace.init();
  Router.init();
  Routes.init();
  HUD.init();
  AISettings.init();
  CityState.subscribe(HUD.upd);
  // Detect the live Claude proxy (server.js) OR a browser API key. If present, buildings + brain go generative.
  if(window.AIClient){
    AIClient.checkHealth().then(function(){
      AISettings.refresh();
      console.log('[JARVIS] AI: ' + (AIClient.available() ? ('ENABLED ('+AIClient.model()+')') : 'offline — connect a key or run the server'));
    });
  }
  console.log('[JARVIS] City v3.2 - Business Builder + App Trend Builder + live AI online.');
});
