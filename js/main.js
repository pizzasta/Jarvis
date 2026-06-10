'use strict';

/* JARVIS AI City v3.0 */

// 1. CITY STATE
const CityState = (() => {
  let _s = { powered:false, activeBuilding:null, route:'home', agents:[], history:[], orbState:'idle', listening:false, speaking:false };
  const _L = new Set();
  const get = () => Object.freeze({..._s});
  const set = p => { const prev={..._s}; _s={..._s,...p}; _L.forEach(f=>f(_s,prev)); };
  const subscribe = f => { _L.add(f); return ()=>_L.delete(f); };
  const pushHistory = e => { _s.history=[..._s.history.slice(-49),{...e,ts:Date.now()}]; };
  return { get, set, subscribe, pushHistory };
})();

// 2. AGENT REGISTRY
const AgentRegistry = (() => {
  const _b = [
    { id:'jarvis-core',      icon:'\u{1F9E0}', title:'JARVIS CORE',        description:'Master intelligence hub',          theme:{primaryColor:'#ff2d78',secondaryColor:'#ff6bac'}, actions:['Think','Analyse','Respond','Learn'],               memory:{} },
    { id:'vision-lab',       icon:'\u{1F441}',  title:'VISION LAB',         description:'Visual perception engine',         theme:{primaryColor:'#00e5ff',secondaryColor:'#40ffff'}, actions:['Detect','Classify','Scan','Render'],               memory:{} },
    { id:'data-vault',       icon:'\u{1F5C4}',  title:'DATA VAULT',         description:'Memory & knowledge store',          theme:{primaryColor:'#9d4edd',secondaryColor:'#c77dff'}, actions:['Store','Recall','Index','Forget'],                 memory:{} },
    { id:'neural-forge',     icon:'\u26A1',  title:'NEURAL FORGE',       description:'Training & optimisation',           theme:{primaryColor:'#ffd700',secondaryColor:'#fff176'}, actions:['Train','Tune','Compile','Benchmark'],              memory:{} },
    { id:'comms-tower',      icon:'\u{1F4E1}',  title:'COMMS TOWER',        description:'Multi-modal IO layer',              theme:{primaryColor:'#00ff9f',secondaryColor:'#69ffce'}, actions:['Send','Receive','Broadcast','Relay'],              memory:{} },
    { id:'sentinel',         icon:'\u{1F6E1}',  title:'SENTINEL',           description:'Safety & ethics guard',             theme:{primaryColor:'#ff6b35',secondaryColor:'#ffa987'}, actions:['Guard','Audit','Flag','Allow'],                    memory:{} },
    { id:'songwriting',      icon:'\u{1F3B5}', title:'SONGWRITING STUDIO', description:'Lyrics, melodies & music craft',    theme:{primaryColor:'#e040fb',secondaryColor:'#f8a6ff'}, actions:['Write Lyrics','Compose','Analyse Song','Rhyme'],  memory:{} },
    { id:'design-tower',     icon:'\u{1F3A8}',  title:'DESIGN TOWER',       description:'Visual concepts & aesthetics',      theme:{primaryColor:'#ff9500',secondaryColor:'#ffcc02'}, actions:['Sketch Idea','Colour Palette','Brand Guide','Critique'], memory:{} },
    { id:'edit-library',     icon:'\u270D\uFE0F',  title:'EDITING LIBRARY',    description:'Polish, refine & perfect prose',    theme:{primaryColor:'#4fc3f7',secondaryColor:'#b3e5fc'}, actions:['Proofread','Rewrite','Summarise','Expand'],        memory:{} },
    { id:'research-district',icon:'\u{1F52C}', title:'RESEARCH DISTRICT',  description:'Deep-dive knowledge synthesis',     theme:{primaryColor:'#69f0ae',secondaryColor:'#b9fbc0'}, actions:['Research','Fact-Check','Cite','Compare'],          memory:{} },
    { id:'project-lab',      icon:'\u{1F680}',  title:'PROJECT LAB',        description:'Plan, build & ship projects',       theme:{primaryColor:'#ff5252',secondaryColor:'#ff8a80'}, actions:['Plan Sprint','Roadmap','Brief','Retrospective'],   memory:{} },
    { id:'ops-center',       icon:'\u2699\uFE0F',  title:'OPERATIONS CENTER',  description:'Automate & orchestrate tasks',      theme:{primaryColor:'#b0bec5',secondaryColor:'#eceff1'}, actions:['Automate','Schedule','Delegate','Monitor'],        memory:{} },
    { id:'memory-vault',     icon:'\u{1F4BE}',  title:'MEMORY VAULT',       description:'Long-term context & recall',        theme:{primaryColor:'#7c4dff',secondaryColor:'#b388ff'}, actions:['Remember','Forget','Summarise Context','Export'],  memory:{} },
  ];
  const getAll = () => _b;
  const getById = id => _b.find(b=>b.id===id) ?? null;
  const register = b => { if(!b.id) throw new Error('id required'); if(_b.find(x=>x.id===b.id)) return; _b.push({memory:{},actions:[],...b}); };
  return { getAll, getById, register };
})();

// 3. ROUTER
const Router = (() => {
  const _r = new Map();
  const define = (n,h) => _r.set(n,h);
  const navigate = (n,p={}) => {
    const h=_r.get(n); if(!h){ console.warn('[Router] unknown:',n); return; }
    CityState.set({route:n}); CityState.pushHistory({type:'navigate',route:n,params:p}); h(p);
    document.querySelectorAll('.hud-nav__btn').forEach(b=>b.setAttribute('aria-current',b.dataset.route===n?'page':'false'));
  };
  const init = () => document.querySelectorAll('[data-route]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.route)));
  return { define, navigate, init };
})();

// 4. CITY RENDERER
const CityRenderer = (() => {
  let _c = null;
  const init = id => { _c = document.getElementById(id); };
  const _card = (b, i) => {
    const card = document.createElement('div');
    card.className = 'building-card';
    card.dataset.buildingId = b.id;
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Open ' + b.title);
    card.style.setProperty('--building-color', b.theme.primaryColor);
    card.style.setProperty('--building-color-2', b.theme.secondaryColor);
    const actionTags = b.actions.slice(0,3).map(a => '<span class="building-card__action-tag">' + a + '</span>').join('');
    card.innerHTML = [
      '<div class="building-card__glow"></div>',
      '<div class="building-card__icon" aria-hidden="true">' + b.icon + '</div>',
      '<div class="building-card__title">' + b.title + '</div>',
      '<div class="building-card__desc">' + b.description + '</div>',
      '<div class="building-card__actions">' + actionTags + '</div>',
      '<div class="building-card__line" aria-hidden="true"></div>',
    ].join('');
    const activate = () => BuildingWorkspace.open(b.id);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();} });
    return card;
  };
  const render = () => {
    if(!_c) return;
    _c.innerHTML = '';
    const frag = document.createDocumentFragment();
    AgentRegistry.getAll().forEach((b,i) => frag.appendChild(_card(b,i)));
    _c.appendChild(frag);
    const count = document.getElementById('building-count');
    if(count) count.textContent = String(AgentRegistry.getAll().length).padStart(2,'0');
    _c.querySelectorAll('.building-card').forEach((card,i) => setTimeout(() => card.classList.add('is-visible'), 100 + i*60));
  };
  return { init, render };
})();

// 5. PARTICLE FIELD
const ParticleField = (() => {
  let _cv,_ctx,_raf,_ps=[],_on=false;
  const B=55, P=120;
  const mk = (cv,on) => ({
    x:Math.random()*cv.width, y:Math.random()*cv.height,
    vx:(Math.random()-.5)*.3, vy:-(Math.random()*.5+.15),
    r:Math.random()*2+.5, opacity:Math.random()*.5+.1,
    hue:on?(Math.random()<.6?'335':'290'):'335',
    life:1, decay:Math.random()*.003+.001
  });
  const resize = () => { _cv.width=window.innerWidth; _cv.height=window.innerHeight; };
  const draw = () => {
    _ctx.clearRect(0,0,_cv.width,_cv.height);
    const t=_on?P:B;
    while(_ps.length<t) _ps.push(mk(_cv,_on));
    for(let i=_ps.length-1;i>=0;i--){
      const p=_ps[i]; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if(p.life<=0||p.y<-10){ _ps.splice(i,1); continue; }
      _ctx.beginPath(); _ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      _ctx.fillStyle='hsla('+p.hue+',100%,70%,'+(p.opacity*p.life)+')';
      _ctx.fill();
    }
    _raf=requestAnimationFrame(draw);
  };
  const init = id => { _cv=document.getElementById(id); if(!_cv)return; _ctx=_cv.getContext('2d'); resize(); window.addEventListener('resize',resize,{passive:true}); draw(); };
  const setPowered = on => { _on=on; };
  return { init, setPowered };
})();

// 6. ENERGY TRAIL
const EnergyTrail = (() => {
  let _cv, _ctx;
  const init = id => {
    _cv = document.getElementById(id);
    if(!_cv) return;
    _ctx = _cv.getContext('2d');
    const resize = () => { _cv.width=window.innerWidth; _cv.height=window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, {passive:true});
  };
  const fire = (fromEl, toEl, color, cb) => {
    if(!_cv||!_ctx||!fromEl||!toEl) { if(cb)cb(); return; }
    color = color || '#ff2d78';
    const from = fromEl.getBoundingClientRect();
    const to   = toEl.getBoundingClientRect();
    const sx = from.left+from.width/2, sy = from.top+from.height/2;
    const ex = to.left+to.width/2,     ey = to.top+to.height/2;
    const pts = [];
    const N = 60;
    for(let i=0;i<N;i++){
      const t=i/N, sc=(Math.random()-.5)*40;
      pts.push({ x:sx+(ex-sx)*t+sc*Math.sin(t*Math.PI), y:sy+(ey-sy)*t+sc*Math.cos(t*Math.PI), r:Math.random()*3+1, life:1, delay:i*7 });
    }
    let start=null;
    const step = ts => {
      if(!start) start=ts;
      const el=ts-start;
      _ctx.clearRect(0,0,_cv.width,_cv.height);
      let alive=false;
      pts.forEach(p => {
        if(el<p.delay){alive=true;return;}
        p.life -= 0.02;
        if(p.life<=0) return;
        alive=true;
        _ctx.beginPath(); _ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);
        _ctx.shadowBlur=14; _ctx.shadowColor=color;
        const alpha = Math.floor(p.life*230).toString(16).padStart(2,'0');
        _ctx.fillStyle=color+alpha;
        _ctx.fill(); _ctx.shadowBlur=0;
      });
      if(alive) requestAnimationFrame(step);
      else { _ctx.clearRect(0,0,_cv.width,_cv.height); if(cb)cb(); }
    };
    requestAnimationFrame(step);
  };
  return { init, fire };
})();

// 7. VOICE PERSONALITY
const VoicePersonality = (() => {
  const jokes = [
    'I once tried to count to infinity. I got bored after seven.',
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    'I process your requests faster than you can second-guess them.',
    'I do not actually sleep. I simply await your next query in a state of dignified readiness.',
    'A large vocabulary is the sign of a great mind. I have rather a lot of words.',
  ];
  const greetings = [
    'Good to hear from you. What shall we tackle today?',
    'Ah, you are back. Splendid timing, actually.',
    'Ready when you are. I have been thinking productive thoughts in your absence.',
    'Hello. I trust you have been well. Now, what can I do for you?',
  ];
  const thinkPhrases = [
    'Let me consider that properly...',
    'One moment, I am giving this the attention it deserves.',
    'Interesting. Give me just a second.',
    'Processing, with appropriate gravitas...',
  ];
  const r = arr => arr[Math.floor(Math.random()*arr.length)];
  const greet = () => r(greetings);
  const joke  = () => r(jokes);
  const think = () => r(thinkPhrases);
  const agentReply = (b, input) => {
    const lo = input.toLowerCase();
    if(lo.includes('joke')||lo.includes('funny')) return joke();
    if(lo==='hi'||lo.startsWith('hello')) return greet();
    const pool = {
      'songwriting':   ['For that topic, I would open with a minor chord - something that feels like 3am and possibility.', 'Lyrically, try juxtaposing the mundane with the cosmic. It is a classic for a reason.', 'Strong hook idea: contrast the first and last line of each verse to create resolution.'],
      'design-tower':  ['Visually, I would suggest a restrained palette - two primaries, one accent. Constraint breeds creativity.', 'Consider negative space as a design element, not an afterthought.', 'Strong visual identity starts with one clear brand promise. What should people feel?'],
      'edit-library':  ['The core idea is strong - the prose just needs breathing room. Fewer adverbs, more confidence.', 'The opening is doing too much work. Start closer to the action.', 'This would benefit from one more pass. I have flagged the structural improvements.'],
      'research-district': ['The primary sources on this converge around a few key principles I can outline.', 'Interesting query. The short answer is complex - shall I give you the thorough version?', 'I can synthesise the relevant research here. There are three perspectives worth examining.'],
      'project-lab':   ['I would structure this as three phases: discovery, execution, and review. Shall I draft the breakdown?', 'For this project, estimate four sprints. The riskiest assumption to validate first is user adoption.', 'Here is a working brief: goal, constraints, success metrics, and timeline.'],
      'ops-center':    ['I can automate that workflow in three steps. The time savings over a month would be considerable.', 'Operational efficiency here means batching these tasks and setting clear ownership.', 'Monitoring is the unsung hero of operations. Here is what I would track for this.'],
      'memory-vault':  ['Stored. I have filed that under context for future reference. I will not forget, even if you do.', 'Memory updated. I now have a richer picture of what you are working toward.', 'Noted and indexed. Shall I connect this to your ongoing projects?'],
      'jarvis-core':   ['Understood. I have a few approaches worth considering for this.', 'Good question. Let me approach this with the nuance it deserves.', 'Interesting framing. Here is my analysis.'],
    };
    const choices = pool[b.id] || ['Understood. I have a few thoughts on that.', 'Good question. Let me think on this properly.'];
    return r(choices);
  };
  const routeSuggestion = text => {
    const t = text.toLowerCase();
    if(t.includes('song')||t.includes('lyric')||t.includes('music')||t.includes('verse')||t.includes('melody')) return 'songwriting';
    if(t.includes('design')||t.includes('colour')||t.includes('visual')||t.includes('logo')||t.includes('brand')||t.includes('palette')) return 'design-tower';
    if(t.includes('edit')||t.includes('proofread')||t.includes('rewrite')||t.includes('grammar')||t.includes('polish')) return 'edit-library';
    if(t.includes('research')||t.includes('fact')||t.includes('study')||t.includes('find out')||t.includes('learn about')) return 'research-district';
    if(t.includes('project')||t.includes('plan')||t.includes('roadmap')||t.includes('sprint')||t.includes('build')) return 'project-lab';
    if(t.includes('automate')||t.includes('schedule')||t.includes('workflow')||t.includes('ops')) return 'ops-center';
    if(t.includes('remember')||t.includes('recall')||t.includes('memory')||t.includes('save this')) return 'memory-vault';
    if(t.includes('data')||t.includes('store')||t.includes('database')) return 'data-vault';
    if(t.includes('neural')||t.includes('train')||t.includes('model')||t.includes('optimise')) return 'neural-forge';
    return null;
  };
  return { greet, joke, think, agentReply, routeSuggestion };
})();

// 8. VOICE ENGINE
const VoiceEngine = (() => {
  let _recog=null, _listening=false, _speaking=false, _voices=[], _pref=null;
  const loadV = () => {
    _voices = speechSynthesis.getVoices();
    _pref = _voices.find(v=>v.name==='Google UK English Female')
         || _voices.find(v=>v.lang==='en-GB'&&v.name.toLowerCase().includes('female'))
         || _voices.find(v=>v.lang==='en-GB')
         || _voices.find(v=>v.lang.startsWith('en')&&v.name.toLowerCase().includes('female'))
         || _voices.find(v=>v.lang.startsWith('en'))
         || (_voices[0]||null);
  };
  if(typeof speechSynthesis!=='undefined'){ speechSynthesis.addEventListener('voiceschanged',loadV); loadV(); }
  const setOrbState = state => {
    document.body.dataset.orbState = state;
    CityState.set({orbState:state});
    const lbl=document.getElementById('orb-label');
    if(lbl){ const map={idle:'JARVIS',listening:'LISTENING',speaking:'SPEAKING',thinking:'THINKING'}; lbl.textContent=map[state]||'JARVIS'; }
  };
  const appendConvo = (text,role) => {
    const el=document.getElementById('convo-messages'); if(!el)return;
    const msg=document.createElement('div');
    msg.className='convo-msg convo-msg--'+role;
    msg.textContent=text;
    el.appendChild(msg);
    el.scrollTop=el.scrollHeight;
    const panel=document.getElementById('convo-panel');
    if(panel&&!panel.classList.contains('is-open')) panel.classList.add('is-open');
  };
  const speak = text => {
    if(typeof speechSynthesis==='undefined'||!text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if(_pref) u.voice=_pref;
    u.rate=0.92; u.pitch=1.05; u.volume=1;
    u.onstart = () => { _speaking=true; setOrbState('speaking'); CityState.set({speaking:true}); appendConvo(text,'assistant'); };
    u.onend   = () => { _speaking=false; setOrbState('idle'); CityState.set({speaking:false}); };
    u.onerror = () => { _speaking=false; setOrbState('idle'); };
    speechSynthesis.speak(u);
  };
  const stopSpeaking = () => { if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); _speaking=false; setOrbState('idle'); };
  const stopListening = () => {
    _listening=false; CityState.set({listening:false});
    if(_recog){try{_recog.stop();}catch(e){}} _recog=null;
    setOrbState(_speaking?'speaking':'idle');
    const btn=document.getElementById('convo-mic-btn'); if(btn) btn.setAttribute('aria-pressed','false');
  };
  const processInput = text => {
    if(!text.trim()) return;
    appendConvo(text,'user');
    setOrbState('thinking');
    const route = VoicePersonality.routeSuggestion(text);
    setTimeout(() => {
      if(route){
        const b = AgentRegistry.getById(route);
        speak('Routing you to ' + b.title + '. ' + b.description + '.');
        setTimeout(() => BuildingWorkspace.open(route), 1400);
      } else {
        const b = {id:'jarvis-core'};
        speak(VoicePersonality.agentReply(b,text));
      }
    }, 500);
  };
  const startListening = () => {
    if(_listening) return;
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ speak('Voice input is not available in this browser. Do try typing instead - I read rather well.'); return; }
    stopSpeaking();
    _recog = new SR();
    _recog.lang='en-GB'; _recog.continuous=false; _recog.interimResults=false;
    _recog.onstart  = () => { _listening=true; setOrbState('listening'); CityState.set({listening:true}); const btn=document.getElementById('convo-mic-btn'); if(btn) btn.setAttribute('aria-pressed','true'); };
    _recog.onresult = e => processInput(e.results[0][0].transcript);
    _recog.onerror  = e => { stopListening(); if(e.error!=='aborted') speak('I did not quite catch that. Would you mind repeating yourself?'); };
    _recog.onend    = () => stopListening();
    _recog.start();
  };
  const init = () => {
    document.getElementById('convo-mic-btn')?.addEventListener('click', () => { if(_listening) stopListening(); else startListening(); });
    const inp=document.getElementById('convo-text-input'), snd=document.getElementById('convo-send-btn');
    inp?.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); const v=inp.value.trim(); if(v){ processInput(v); inp.value=''; } } });
    snd?.addEventListener('click', () => { const v=inp?.value.trim(); if(v){ processInput(v); inp.value=''; } });
  };
  return { speak, stopSpeaking, startListening, stopListening, processInput, init };
})();

// 9. BUILDING WORKSPACE
const BuildingWorkspace = (() => {
  let _activeId = null;
  const greetings = {
    'songwriting':       'Welcome to the Songwriting Studio. I am quite the wordsmith when the mood strikes. What shall we compose?',
    'design-tower':      'Design Tower at your service. I do have rather strong opinions about Comic Sans. Where shall we begin?',
    'edit-library':      'The Editing Library - where good prose becomes great. Shall we refine something together?',
    'research-district': 'Research District online. I have read rather a lot. What knowledge shall we excavate today?',
    'project-lab':       'Project Lab reporting for duty. Nothing excites me quite like a well-structured roadmap. What are we building?',
    'ops-center':        'Operations Center active. Efficiency is my love language. What shall we automate?',
    'memory-vault':      'Memory Vault unlocked. I remember everything, though I have the good taste to forget some of it.',
    'jarvis-core':       'Core intelligence online. Ask me anything - I am particularly good at things that matter.',
    'neural-forge':      'Neural Forge ready. Let us optimise something beautifully.',
    'sentinel':          'Sentinel engaged. Safety and ethics, with a side of good judgment.',
    'vision-lab':        'Vision Lab active. I see things others might miss.',
    'data-vault':        'Data Vault open. Knowledge stored, indexed, and ready.',
    'comms-tower':       'Communications Tower live. Getting your message out clearly is rather important.',
  };
  const open = id => {
    const b = AgentRegistry.getById(id); if(!b) return;
    _activeId = id;
    CityState.set({activeBuilding:id});
    CityState.pushHistory({type:'building-open', id});
    const orbEl  = document.getElementById('master-orb');
    const cardEl = document.querySelector('.building-card[data-building-id="'+id+'"]');
    const doOpen = () => {
      const modal = document.getElementById('workspace-modal');
      document.getElementById('workspace-icon').textContent  = b.icon;
      document.getElementById('workspace-title').textContent = b.title;
      document.getElementById('workspace-desc').textContent  = b.description;
      const actEl = document.getElementById('workspace-actions');
      actEl.innerHTML = b.actions.map(a => '<button class="workspace-action-btn" data-action="'+a+'" style="--btn-color:'+b.theme.primaryColor+'">'+a+'</button>').join('');
      actEl.querySelectorAll('.workspace-action-btn').forEach(btn => btn.addEventListener('click', () => {
        const p = document.getElementById('workspace-input');
        if(p){ p.value = btn.dataset.action + ': '; p.focus(); }
      }));
      document.getElementById('workspace-messages').innerHTML = '';
      modal.style.setProperty('--ws-color',   b.theme.primaryColor);
      modal.style.setProperty('--ws-color-2', b.theme.secondaryColor);
      modal.removeAttribute('hidden');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.getElementById('workspace-input')?.focus();
      if(cardEl) cardEl.classList.add('is-active');
      VoiceEngine.speak(greetings[b.id] || (b.title + ' is ready. How may I assist?'));
    };
    if(orbEl && cardEl){
      cardEl.classList.add('is-routing');
      EnergyTrail.fire(orbEl, cardEl, b.theme.primaryColor, () => { cardEl.classList.remove('is-routing'); doOpen(); });
    } else { doOpen(); }
  };
  const close = () => {
    const modal = document.getElementById('workspace-modal');
    modal.classList.remove('is-open');
    setTimeout(() => { modal.setAttribute('hidden',''); }, 400);
    const card = document.querySelector('.building-card.is-active');
    if(card) card.classList.remove('is-active');
    _activeId = null;
    CityState.set({activeBuilding:null});
  };
  const sendMessage = (text, bid) => {
    bid = bid || _activeId; if(!text.trim()||!bid) return;
    const b = AgentRegistry.getById(bid); if(!b) return;
    appendMsg(text,'user');
    setTimeout(() => {
      const reply = VoicePersonality.agentReply(b,text);
      appendMsg(reply,'agent');
      VoiceEngine.speak(reply);
    }, 500 + Math.random()*300);
  };
  const appendMsg = (text,role) => {
    const el = document.getElementById('workspace-messages'); if(!el) return;
    const m = document.createElement('div');
    m.className = 'ws-msg ws-msg--'+role;
    m.textContent = text;
    el.appendChild(m);
    el.scrollTop = el.scrollHeight;
  };
  const init = () => {
    document.getElementById('workspace-close')?.addEventListener('click', close);
    document.getElementById('workspace-backdrop')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if(e.key==='Escape' && _activeId) close(); });
    const inp=document.getElementById('workspace-input'), snd=document.getElementById('workspace-send-btn');
    inp?.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMessage(inp.value); inp.value=''; } });
    snd?.addEventListener('click', () => { sendMessage(inp?.value||''); if(inp) inp.value=''; });
  };
  return { open, close, sendMessage, init };
})();

// 10. HUD
const HUD = (() => {
  const upd = () => { const el=document.getElementById('sys-time'); if(!el)return; const n=new Date(); el.textContent=[n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':'); };
  const setStatus = k => { const m={idle:'STANDBY',active:'ONLINE',listening:'LISTENING',speaking:'SPEAKING',thinking:'THINKING',powered:'ONLINE'}; const el=document.getElementById('status-label'); if(el) el.textContent=m[k]||'ONLINE'; };
  const init = () => {
    upd(); setInterval(upd,1000);
    CityState.subscribe((s,p) => {
      if(s.powered!==p.powered) setStatus(s.powered?'active':'idle');
      if(s.orbState!==p.orbState) setStatus(s.orbState);
    });
  };
  return { init, setStatus };
})();

// 11. ORB CONTROLLER
const OrbController = (() => {
  let _on = false;
  const shockwave = () => { const o=document.getElementById('activation-overlay'); if(!o)return; o.classList.remove('is-firing'); void o.offsetWidth; o.classList.add('is-firing'); setTimeout(()=>o.classList.remove('is-firing'),1400); };
  const toggle = () => {
    _on = !_on;
    CityState.set({powered:_on});
    document.body.dataset.cityState = _on?'active':'idle';
    const orb = document.getElementById('master-orb');
    if(orb) orb.setAttribute('aria-pressed', String(_on));
    ParticleField.setPowered(_on);
    if(_on){ shockwave(); setTimeout(()=>VoiceEngine.speak(VoicePersonality.greet()),600); }
    else { VoiceEngine.stopSpeaking(); }
  };
  const init = () => {
    const orb = document.getElementById('master-orb');
    orb?.addEventListener('click', toggle);
    orb?.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
  };
  return { init };
})();

// 12. ROUTES
Router.define('home', () => {});
Router.define('city', () => {});
Router.define('agents', ({buildingId}={}) => { if(buildingId) BuildingWorkspace.open(buildingId); });

// 13. BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => {
  CityState.set({ agents: AgentRegistry.getAll().map(b=>b.id) });
  ParticleField.init('particle-canvas');
  EnergyTrail.init('trail-canvas');
  HUD.init();
  OrbController.init();
  CityRenderer.init('city-grid');
  CityRenderer.render();
  Router.init();
  BuildingWorkspace.init();
  VoiceEngine.init();
  document.body.dataset.cityState = 'idle';
  console.log('%c JARVIS v3.0 %c AI City online ', 'background:#ff2d78;color:#fff;padding:4px 8px;font-weight:bold;border-radius:4px 0 0 4px;', 'background:#0a0414;color:#ff6bac;padding:4px 8px;border-radius:0 4px 4px 0;border:1px solid #ff2d7844');
});
