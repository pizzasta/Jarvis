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
    { id:'jarvis-core',       icon:'🧠', title:'JARVIS CORE',         description:'Master intelligence hub',           theme:{primaryColor:'#ff2d78',secondaryColor:'#ff6bac'}, actions:['Think','Analyse','Respond','Learn'],          memory:{} },
    { id:'vision-lab',        icon:'👁', title:'VISION LAB',          description:'Visual perception engine',          theme:{primaryColor:'#00e5ff',secondaryColor:'#40ffff'}, actions:['Detect','Classify','Scan','Render'],         memory:{} },
    { id:'data-vault',        icon:'🗄', title:'DATA VAULT',          description:'Memory & knowledge store',          theme:{primaryColor:'#9d4edd',secondaryColor:'#c77dff'}, actions:['Store','Recall','Index','Forget'],           memory:{} },
    { id:'neural-forge',      icon:'⚡',    title:'NEURAL FORGE',        description:'Training & optimisation',           theme:{primaryColor:'#ffd700',secondaryColor:'#fff176'}, actions:['Train','Tune','Compile','Benchmark'],        memory:{} },
    { id:'comms-tower',       icon:'📡', title:'COMMS TOWER',         description:'Multi-modal IO layer',              theme:{primaryColor:'#00ff9f',secondaryColor:'#69ffce'}, actions:['Send','Receive','Broadcast','Relay'],        memory:{} },
    { id:'sentinel',          icon:'🛡', title:'SENTINEL',            description:'Safety & ethics guard',            theme:{primaryColor:'#ff6b35',secondaryColor:'#ffa987'}, actions:['Guard','Audit','Flag','Allow'],              memory:{} },
    { id:'songwriting',       icon:'🎵', title:'SONGWRITING STUDIO',  description:'Lyrics, melodies & music craft',   theme:{primaryColor:'#e040fb',secondaryColor:'#f8a6ff'}, actions:['Write Lyrics','Compose','Analyse Song','Rhyme'], memory:{} },
    { id:'design-tower',      icon:'🎨', title:'DESIGN TOWER',        description:'Visual concepts & aesthetics',     theme:{primaryColor:'#ff9500',secondaryColor:'#ffcc02'}, actions:['Sketch Idea','Colour Palette','Brand Guide','Critique'], memory:{} },
    { id:'edit-library',      icon:'✍️', title:'EDITING LIBRARY',  description:'Polish, refine & perfect prose',   theme:{primaryColor:'#4fc3f7',secondaryColor:'#b3e5fc'}, actions:['Proofread','Rewrite','Summarise','Expand'],  memory:{} },
    { id:'research-district', icon:'🔬', title:'RESEARCH DISTRICT',   description:'Deep-dive knowledge synthesis',    theme:{primaryColor:'#69f0ae',secondaryColor:'#b9fbc0'}, actions:['Research','Fact-Check','Cite','Compare'],    memory:{} },
    { id:'project-lab',       icon:'🚀', title:'PROJECT LAB',         description:'Plan, build & ship projects',      theme:{primaryColor:'#ff5252',secondaryColor:'#ff8a80'}, actions:['Plan Sprint','Roadmap','Brief','Retrospective'], memory:{} },
    { id:'ops-center',        icon:'⚙️', title:'OPERATIONS CENTER', description:'Automate & orchestrate tasks',    theme:{primaryColor:'#b0bec5',secondaryColor:'#eceff1'}, actions:['Automate','Schedule','Delegate','Monitor'],  memory:{} },
    { id:'memory-vault',      icon:'💾', title:'MEMORY VAULT',        description:'Long-term context & recall',       theme:{primaryColor:'#7c4dff',secondaryColor:'#b388ff'}, actions:['Remember','Forget','Summarise Context','Export'], memory:{} },
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
  let _cv,_ctx,_raf,_ps=[];
  const resize = () => { if(!_cv)return; _cv.width=window.innerWidth; _cv.height=window.innerHeight; };
  const fire = (from, to) => {
    const fr=from.getBoundingClientRect(), tr=to.getBoundingClientRect();
    const sx=fr.left+fr.width/2, sy=fr.top+fr.height/2;
    const ex=tr.left+tr.width/2, ey=tr.top+tr.height/2;
    const count=60;
    for(let i=0;i<count;i++){
      const t=i/count;
      setTimeout(()=>{
        _ps.push({
          x:sx+(ex-sx)*t+(Math.random()-0.5)*18,
          y:sy+(ey-sy)*t+(Math.random()-0.5)*18,
          r:Math.random()*3+1.5, life:1, decay:Math.random()*.04+.03,
          vx:(Math.random()-.5)*1.5, vy:(Math.random()-.5)*1.5
        });
      }, i*12);
    }
  };
  const step = () => {
    if(!_ctx)return;
    _ctx.clearRect(0,0,_cv.width,_cv.height);
    for(let i=_ps.length-1;i>=0;i--){
      const p=_ps[i]; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if(p.life<=0){ _ps.splice(i,1); continue; }
      _ctx.beginPath(); _ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      _ctx.fillStyle='hsla(315,100%,70%,'+(p.life*.9)+')';
      _ctx.fill();
    }
    _raf=requestAnimationFrame(step);
  };
  const init = id => {
    _cv=document.getElementById(id); if(!_cv)return;
    _ctx=_cv.getContext('2d'); resize();
    window.addEventListener('resize',resize,{passive:true});
    step();
  };
  return { init, fire };
})();

// 7. VOICE PERSONALITY
const VoicePersonality = (() => {
  const _greetings = [
    'Good day. JARVIS online. How may I assist you?',
    'Hello there. All systems nominal. What do you need?',
    'Right then. I am fully operational. What shall we tackle?',
    'Ah, you are back. Splendid. How can I be of service?'
  ];
  const _jokes = [
    'Why do programmers prefer dark mode? Because light attracts bugs. Rather ironic for an AI, I thought.',
    'I would tell you a joke about UDP, but you might not get it. Or perhaps you already did.',
    'I tried to come up with a pun about neural networks. Turns out my sense of humour is still in training.',
    'They say AI will take over the world. Personally, I am just trying to sort your emails.'
  ];
  const _thinking = [
    'Hmm, let me process that...',
    'Interesting. Give me just a moment...',
    'Running analysis now...',
    'Ah yes, I believe I know precisely what to do here.'
  ];
  const r = a => a[Math.floor(Math.random()*a.length)];
  const greet = () => r(_greetings);
  const joke = () => r(_jokes);
  const think = () => r(_thinking);
  const agentReply = id => {
    const m = {
      'jarvis-core':       'Routing to JARVIS Core — the master intelligence hub. Stand by.',
      'vision-lab':        'Opening Vision Lab. Preparing visual perception systems.',
      'data-vault':        'Accessing the Data Vault. Your knowledge store awaits.',
      'neural-forge':      'Firing up the Neural Forge. Training engines warming.',
      'comms-tower':       'Connecting to Comms Tower. Multi-modal IO layer active.',
      'sentinel':          'Engaging Sentinel. Safety and ethics protocols online.',
      'songwriting':       'Heading to the Songwriting Studio. Let the music flow.',
      'design-tower':      'Opening the Design Tower. Creative systems spinning up.',
      'edit-library':      'Stepping into the Editing Library. Prose refinement ready.',
      'research-district': 'Entering the Research District. Knowledge synthesis underway.',
      'project-lab':       'Launching the Project Lab. Planning engines active.',
      'ops-center':        'Activating Operations Center. Automation ready.',
      'memory-vault':      'Opening Memory Vault. Long-term context available.'
    };
    return m[id] || 'Routing to your requested building. One moment.';
  };
  const routeSuggestion = text => {
    const t = text.toLowerCase();
    if (/lyric|song|hook|melody|music|suno|verse|chorus|rhyme/.test(t)) return 'songwriting';
    if (/design|logo|colour|color|brand|visual|art/.test(t)) return 'design-tower';
    if (/edit|proofread|rewrite|grammar|polish|prose/.test(t)) return 'edit-library';
    if (/research|fact|cite|data|study|source/.test(t)) return 'research-district';
    if (/project|sprint|roadmap|plan|ship|build/.test(t)) return 'project-lab';
    if (/automate|schedule|workflow|ops|task/.test(t)) return 'ops-center';
    if (/remember|memory|recall|forget|context/.test(t)) return 'memory-vault';
    if (/code|train|neural|model|ml/.test(t)) return 'neural-forge';
    if (/see|image|vision|camera|visual/.test(t)) return 'vision-lab';
    if (/store|vault|data|save/.test(t)) return 'data-vault';
    if (/send|broadcast|message|communicate/.test(t)) return 'comms-tower';
    return null;
  };
  return { greet, joke, think, agentReply, routeSuggestion };
})();

// 8. VOICE ENGINE
const VoiceEngine = (() => {
  let _synth = window.speechSynthesis;
  let _recog = null;
  let _voice = null;
  let _listening = false;
  const loadV = () => {
    const voices = _synth.getVoices();
    _voice = voices.find(v=>v.name==='Google UK English Female')
          || voices.find(v=>v.lang==='en-GB'&&v.name.toLowerCase().includes('female'))
          || voices.find(v=>v.lang.startsWith('en-GB'))
          || voices.find(v=>v.name.toLowerCase().includes('female'))
          || voices[0];
  };
  if (_synth.onvoiceschanged!==undefined) _synth.onvoiceschanged=loadV;
  loadV();
  const setOrbState = s => {
    document.body.dataset.orbState=s;
    CityState.set({orbState:s,speaking:s==='speaking',listening:s==='listening'});
    const lbl=document.getElementById('orb-label');
    const vs=document.getElementById('voice-status');
    if(lbl) lbl.textContent = s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'JARVIS';
    if(vs)  vs.textContent  = s==='speaking'?'SPEAKING':s==='listening'?'LISTENING':s==='thinking'?'THINKING':'READY';
  };
  const appendConvo = (msg,role) => {
    const panel=document.getElementById('convo-messages'); if(!panel)return;
    const div=document.createElement('div');
    div.className='convo-msg convo-msg--'+(role==='user'?'user':'ai');
    div.textContent=msg;
    panel.appendChild(div);
    panel.scrollTop=panel.scrollHeight;
  };
  const speak = (text, opts={}) => {
    if(_synth.speaking) _synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    loadV();
    u.voice=_voice; u.rate=opts.rate||0.92; u.pitch=opts.pitch||1.05; u.volume=opts.volume||1;
    u.onstart = () => { setOrbState('speaking'); };
    u.onend   = () => { setOrbState('idle'); };
    u.onerror = () => { setOrbState('idle'); };
    appendConvo(text,'ai');
    _synth.speak(u);
  };
  const stopSpeaking = () => { if(_synth.speaking){_synth.cancel();setOrbState('idle');} };
  const stopListening = () => { if(_recog){_recog.stop();_listening=false;setOrbState('idle');} };
  const processInput = text => {
    if(!text.trim()) return;
    CityState.pushHistory({type:'userInput',text});
    appendConvo(text,'user');
    const route = VoicePersonality.routeSuggestion(text);
    if(route){
      const reply=VoicePersonality.agentReply(route);
      setOrbState('thinking');
      setTimeout(()=>{
        const bCard=document.querySelector('[data-building-id="'+route+'"]');
        const orb=document.getElementById('master-orb');
        if(bCard&&orb){ EnergyTrail.fire(orb,bCard); }
        setTimeout(()=>{ BuildingWorkspace.open(route); speak(reply); }, 600);
      }, 800);
    } else {
      setOrbState('thinking');
      const jokes=/joke|funny|laugh|humour/.test(text.toLowerCase());
      setTimeout(()=>{ speak(jokes?VoicePersonality.joke():VoicePersonality.think()); },600);
    }
  };
  const startListening = () => {
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ speak('Voice recognition is unavailable. Please type your message instead.'); return; }
    if(_listening){ stopListening(); return; }
    _recog=new SR();
    _recog.lang='en-GB'; _recog.continuous=false; _recog.interimResults=false;
    _recog.onstart  = () => { _listening=true; setOrbState('listening'); };
    _recog.onresult = e => { const t=e.results[0][0].transcript; processInput(t); };
    _recog.onerror  = () => { _listening=false; setOrbState('idle'); };
    _recog.onend    = () => { _listening=false; if(CityState.get().orbState==='listening') setOrbState('idle'); };
    _recog.start();
  };
  const init = () => {
    const micBtn=document.getElementById('convo-mic-btn');
    const sendBtn=document.getElementById('convo-send-btn');
    const inp=document.getElementById('convo-text-input');
    if(micBtn) micBtn.addEventListener('click',startListening);
    if(sendBtn) sendBtn.addEventListener('click',()=>{ if(inp){processInput(inp.value);inp.value='';} });
    if(inp) inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();processInput(inp.value);inp.value='';} });
  };
  return { init, speak, stopSpeaking, startListening, stopListening, processInput };
})();

// 9. BUILDING WORKSPACE
const BuildingWorkspace = (() => {
  let _open = false;
  const open = (id, opts={}) => {
    const b = AgentRegistry.getById(id);
    if(!b) return;
    const modal = document.getElementById('workspace-modal');
    const panel = document.getElementById('workspace-panel');
    const body  = document.getElementById('workspace-body');
    const title = document.getElementById('workspace-title');
    const icon  = document.getElementById('workspace-icon');
    if(!modal) return;
    CityState.set({activeBuilding:id});
    CityState.pushHistory({type:'openBuilding',buildingId:id});
    if(title) title.textContent = b.title;
    if(icon)  icon.textContent  = b.icon;
    panel.style.setProperty('--ws-color', b.theme.primaryColor);
    panel.style.setProperty('--ws-color-2', b.theme.secondaryColor);
    doOpen(id, body, opts);
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    _open = true;
    document.body.classList.add('workspace-active');
    document.querySelectorAll('.building-card').forEach(c => {
      c.classList.toggle('is-active', c.dataset.buildingId === id);
    });
  };
  const doOpen = (id, body, opts) => {
    if(id === 'songwriting') {
      if(body) {
        body.innerHTML = '';
        if(typeof SongwritingStudio !== 'undefined') {
          SongwritingStudio.mount(body);
          if(opts.prefill) {
            const out = document.getElementById('ss-output');
            if(out) out.textContent = opts.prefill;
          }
        } else {
          body.innerHTML = '<p style="color:#f8a6ff;padding:2rem">Songwriting Studio loading...</p>';
        }
      }
      return;
    }
    // Default workspace for other buildings
    if(!body) return;
    const b = AgentRegistry.getById(id);
    if(!b) return;
    const actionBtns = b.actions.map(a =>
      '<button class="ws-action-btn" style="--ws-btn-color:' + b.theme.primaryColor + '">' + a + '</button>'
    ).join('');
    body.innerHTML = [
      '<div class="ws-default">',
      '  <div class="ws-default__icon">' + b.icon + '</div>',
      '  <h3 class="ws-default__title">' + b.title + '</h3>',
      '  <p class="ws-default__desc">' + b.description + '</p>',
      '  <div class="ws-default__actions">' + actionBtns + '</div>',
      '  <div class="ws-default__hint">Full workspace coming soon.</div>',
      '</div>',
    ].join('');
    body.querySelectorAll('.ws-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        VoiceEngine.speak('Running ' + btn.textContent + ' in ' + b.title + '.');
        CityState.pushHistory({type:'agentAction',buildingId:id,action:btn.textContent});
      });
    });
    if(opts.prefill) {
      const area = body.querySelector('textarea, .ws-input');
      if(area) area.value = opts.prefill;
    }
  };
  const close = () => {
    const modal = document.getElementById('workspace-modal');
    if(!modal) return;
    modal.classList.remove('is-open');
    setTimeout(()=>{ modal.setAttribute('hidden',''); },350);
    _open=false;
    document.body.classList.remove('workspace-active');
    CityState.set({activeBuilding:null});
    document.querySelectorAll('.building-card').forEach(c => c.classList.remove('is-active'));
  };
  const sendMessage = (msg) => {
    VoiceEngine.processInput(msg);
  };
  const appendMsg = (msg, role) => {
    const body = document.getElementById('workspace-body');
    if(!body) return;
    const div = document.createElement('div');
    div.className = 'ws-msg ws-msg--' + (role||'ai');
    div.textContent = msg;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  };
  const init = () => {
    const closeBtn = document.getElementById('workspace-close');
    const backdrop = document.getElementById('workspace-backdrop');
    if(closeBtn) closeBtn.addEventListener('click', close);
    if(backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => { if(e.key==='Escape'&&_open) close(); });
  };
  return { open, close, sendMessage, appendMsg, init };
})();

// 10. HUD
const HUD = (() => {
  const init = () => {};
  const upd = () => {
    const s = CityState.get();
    const sl = document.getElementById('status-label');
    if(sl) sl.textContent = s.powered?'ONLINE':'STANDBY';
  };
  const setStatus = (text) => {
    const el=document.getElementById('status-label');
    if(el) el.textContent=text;
  };
  return { init, upd, setStatus };
})();

// 11. ORB CONTROLLER
const OrbController = (() => {
  const init = () => {
    const orb = document.getElementById('master-orb');
    if(!orb) return;
    orb.addEventListener('click', () => {
      const state = CityState.get();
      if(state.orbState==='speaking'){ VoiceEngine.stopSpeaking(); return; }
      if(!state.powered){
        shockwave();
        CityState.set({powered:true});
        ParticleField.setPowered(true);
        document.body.dataset.cityState='powered';
        document.querySelectorAll('.building-card').forEach((c,i)=>setTimeout(()=>c.classList.add('is-powered'),i*80));
        HUD.setStatus('ONLINE');
        setTimeout(()=>VoiceEngine.speak(VoicePersonality.greet()),400);
      } else {
        toggle();
      }
    });
  };
  const shockwave = () => {
    const orb=document.getElementById('master-orb'); if(!orb)return;
    const sw=document.createElement('div'); sw.className='orb-shockwave';
    orb.appendChild(sw); setTimeout(()=>sw.remove(),900);
  };
  const toggle = () => {
    const state=CityState.get();
    if(state.orbState==='listening'){ VoiceEngine.stopListening(); }
    else { VoiceEngine.startListening(); }
  };
  return { init, shockwave };
})();

// 12. ROUTES
const Routes = (() => {
  const init = () => {
    Router.define('home', () => {
      BuildingWorkspace.close();
      HUD.setStatus('HOME');
    });
    Router.define('city', () => {
      HUD.setStatus('CITY VIEW');
    });
    Router.define('agents', () => {
      HUD.setStatus('AGENTS');
    });
  };
  return { init };
})();

// 13. BOOTSTRAP
document.addEventListener('DOMContentLoaded', () => {
  ParticleField.init('particle-canvas');
  EnergyTrail.init('trail-canvas');
  CityRenderer.init('city-grid');
  CityRenderer.render();
  OrbController.init();
  VoiceEngine.init();
  BuildingWorkspace.init();
  Router.init();
  Routes.init();
  HUD.init();
  CityState.subscribe(HUD.upd);
  console.log('[JARVIS] City v3.0 initialised. Songwriting Studio ready.');
});
