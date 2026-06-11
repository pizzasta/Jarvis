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
    { id:'jarvis-core',       icon:'🧠', title:'JARVIS CORE',         description:'Master intelligence hub',         theme:{primaryColor:'#ff2d78',secondaryColor:'#ff6bac'}, actions:['Think','Analyse','Respond','Learn'],          memory:{} },
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
    { id:'launch',  name:'LAUNCH CITY',  icon:'🚀', tagline:'Build, automate & ship',       accent:'#ff5252', accent2:'#ff8a80', buildings:['project-lab','ops-center','design-tower','data-vault'] }
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
  var G=['Good day. JARVIS online. How may I assist?','Hello there. All systems nominal. What do you need?','Right then. Fully operational. What shall we tackle?'];
  var J=['Why do programmers prefer dark mode? Light attracts bugs.','I tried to write a pun about neural networks. My humour is still in training.','They say AI will take over the world. I am just sorting your tasks.'];
  var T=['Hmm, let me process that...','Interesting. Give me a moment...','Running analysis now...','Ah yes, I know precisely what to do here.'];
  function r(a){ return a[Math.floor(Math.random()*a.length)]; }
  function greet(){ return r(G); }
  function joke(){ return r(J); }
  function think(){ return r(T); }
  function agentReply(id){
    var m={'jarvis-core':'Routing to JARVIS Core.','vision-lab':'Opening Vision Lab.','data-vault':'Accessing the Data Vault.','neural-forge':'Firing up the Neural Forge.','comms-tower':'Connecting to Comms Tower.','sentinel':'Engaging Sentinel.','songwriting':'Opening the Suno Helper. Let us make some music, Jess.','book-helper':'Opening the Book Helper. Let us write something that sounds truly human.','design-tower':'Opening the Design Tower. Creative systems spinning up.','edit-library':'Stepping into the Editing Library.','research-district':'Entering the Research District.','project-lab':'Launching the Project Lab.','ops-center':'Activating Operations Center.','memory-vault':'Opening Memory Vault. Your archive awaits.'};
    return m[id]||'Routing to your building. One moment.';
  }
  function routeSuggestion(text){
    var t=text.toLowerCase();
    if(/book|novel|chapter|memoir|author|blurb|humani[sz]e|sound human|not ai|sound real/.test(t)) return 'book-helper';
    if(/lyric|song|hook|melody|music|suno|verse|chorus|rhyme|music video|video idea/.test(t)) return 'songwriting';
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

var VoiceEngine = (function() {
  var _synth=window.speechSynthesis, _recog=null, _voice=null, _listening=false;
  function loadV(){ var v=_synth.getVoices(); _voice=v.find(function(x){ return x.name==='Google UK English Female'; })||v.find(function(x){ return x.lang==='en-GB'&&x.name.toLowerCase().includes('female'); })||v.find(function(x){ return x.lang.startsWith('en-GB'); })||v.find(function(x){ return x.name.toLowerCase().includes('female'); })||v[0]; }
  if(_synth.onvoiceschanged!==undefined) _synth.onvoiceschanged=loadV;
  loadV();
  function setOrbState(s){ document.body.dataset.orbState=s; CityState.set({orbState:s,speaking:s==='speaking',listening:s==='listening'}); var lbl=document.getElementById('orb-label'), vs=document.getElementById('voice-status'); if(lbl) lbl.textContent=s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'JARVIS'; if(vs) vs.textContent=s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'READY'; }
  function appendConvo(msg,role){ var p=document.getElementById('convo-messages'); if(!p)return; var d=document.createElement('div'); d.className='convo-msg convo-msg--'+(role==='user'?'user':'ai'); d.textContent=msg; p.appendChild(d); p.scrollTop=p.scrollHeight; }
  function speak(text,opts){ opts=opts||{}; if(_synth.speaking) _synth.cancel(); var u=new SpeechSynthesisUtterance(text); loadV(); u.voice=_voice; u.rate=opts.rate||0.92; u.pitch=opts.pitch||1.05; u.volume=opts.volume||1; u.onstart=function(){ setOrbState('speaking'); }; u.onend=function(){ setOrbState('idle'); }; u.onerror=function(){ setOrbState('idle'); }; appendConvo(text,'ai'); _synth.speak(u); }
  function stopSpeaking(){ if(_synth.speaking){_synth.cancel();setOrbState('idle');} }
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
    // 2) Otherwise let the JARVIS brain answer anything (small talk, maths, time, help...)
    setOrbState('thinking');
    var res = window.JarvisBrain ? JarvisBrain.respond(text) : null;
    if(res && res.route){ var rreply=VoicePersonality.agentReply(res.route); setTimeout(function(){ _routeTo(res.route,rreply); },700); return; }
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
  function init(){
    var mic=document.getElementById('convo-mic-btn'), send=document.getElementById('convo-send-btn'), inp=document.getElementById('convo-text-input');
    if(mic) mic.addEventListener('click',startListening);
    if(send) send.addEventListener('click',function(){ if(inp){processInput(inp.value);inp.value='';} });
    if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();processInput(inp.value);inp.value='';} });
  }
  return { init:init, speak:speak, stopSpeaking:stopSpeaking, startListening:startListening, stopListening:stopListening, processInput:processInput };
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
    if(!body) return;
    var b=AgentRegistry.getById(id); if(!b) return;
    var actionBtns=b.actions.map(function(a){ return '<button class="ws-action-btn" style="--ws-btn-color:'+b.theme.primaryColor+'">'+a+'</button>'; }).join('');
    body.innerHTML=['<div class="ws-default">','<div class="ws-default__icon">'+b.icon+'</div>','<h3 class="ws-default__title">'+b.title+'</h3>','<p class="ws-default__desc">'+b.description+'</p>','<div class="ws-default__actions">'+actionBtns+'</div>','<div class="ws-default__hint">Full workspace coming soon.</div>','</div>'].join('');
    body.querySelectorAll('.ws-action-btn').forEach(function(btn){ btn.addEventListener('click',function(){ VoiceEngine.speak('Running '+btn.textContent+' in '+b.title+'.'); CityState.pushHistory({type:'agentAction',buildingId:id,action:btn.textContent}); if(window.CityMemory) CityMemory.add({category:'session',title:'Action: '+btn.textContent,content:btn.textContent+' in '+b.title,building:id,tags:[id,btn.textContent]}); }); });
    if(opts.prefill){ var area=body.querySelector('textarea,.ws-input'); if(area) area.value=opts.prefill; }
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
      var s=CityState.get();
      if(s.orbState==='speaking'){ VoiceEngine.stopSpeaking(); return; }
      if(!s.powered){ shockwave(); CityState.set({powered:true}); ParticleField.setPowered(true); document.body.dataset.cityState='active'; document.querySelectorAll('.building-card').forEach(function(c,i){ setTimeout(function(){ c.classList.add('is-powered'); },i*80); }); HUD.setStatus('ONLINE'); setTimeout(function(){ VoiceEngine.speak(window.JarvisBrain ? JarvisBrain.greeting() : VoicePersonality.greet()); },400); }
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
  CityState.subscribe(HUD.upd);
  console.log('[JARVIS] City v3.1 - Memory Vault + Design Tower online.');
});
