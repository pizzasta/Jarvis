'use strict';
/* Automation Studio Workspace - JARVIS AI City
   Designs AI workflows & autonomous agents to run businesses on autopilot.
   AI-first: real Claude when a key is connected, templates otherwise. */

var AutomationStudio = (function() {

  var PLATFORMS = ['Make.com','Zapier','n8n (self-host)','Pure AI agent','No-code + AI APIs'];
  var GOALS = ['Save hours every week','Run content on autopilot','Auto-generate & follow up leads','24/7 customer support','Scale a service business','Personal life admin'];
  var TOOLS = [
    {id:'workflow', icon:'🧩', name:'Workflow Builder',  desc:'End-to-end trigger → action blueprint'},
    {id:'agent',    icon:'🤖', name:'AI Agent Designer',  desc:'Autonomous agent: role, tools, steps'},
    {id:'content',  icon:'🎬', name:'Content Autopilot',  desc:'Create + schedule content hands-free'},
    {id:'leads',    icon:'📥', name:'Lead-Gen Pipeline',  desc:'Capture → enrich → outreach → follow-up'},
    {id:'support',  icon:'💬', name:'Support Bot',        desc:'AI FAQ / customer support automation'},
    {id:'recipe',   icon:'🔁', name:'Zap / Scenario',     desc:'Concrete step-by-step recipe'},
    {id:'sop',      icon:'📋', name:'SOP → Automation',   desc:'Turn a task into an automatable SOP'},
    {id:'stack',    icon:'🧰', name:'Free Tool Stack',    desc:'Run it all on free tiers'}
  ];

  var _state = { platform:PLATFORMS[0], goal:GOALS[0], context:'', history:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _setOutput(t){ var el=document.getElementById('as-output'); if(!el) return; el.classList.remove('as-flash'); void el.offsetWidth; el.textContent=t; el.classList.add('as-flash'); }
  function _save(type, content){
    if(window.CityMemory) CityMemory.add({ category:'automation', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.platform,type], building:'automation-studio' });
    _state.history.unshift({ type:type, content:content, ts:Date.now() });
    if(_state.history.length>50) _state.history.pop();
    _renderHistory();
  }
  function _ai(){ return window.AIClient && AIClient.available && AIClient.available(); }

  function _aiSystem(){ return 'You are an automation architect. Design clear, practical AI workflows and autonomous agents using real, mostly-free tools (Make, Zapier, n8n, AI APIs, webhooks). Be concrete: name triggers, actions, the data passed between steps, and any AI prompt used inside the flow. Plain text, numbered steps, no markdown headers.'; }
  function _ctx(){ return 'Platform: '+_state.platform+'. Goal: '+_state.goal+(_state.context?('. Context: '+_state.context):'')+'.\n\n'; }
  function _aiPrompt(id){
    var c=_ctx();
    switch(id){
      case 'workflow': return c+'Design an end-to-end automation as a numbered trigger→action blueprint. For each step: the app/tool, what it does, and the data passed to the next step. Add one place where an AI step (with its prompt) makes it smart, and note the free-tier limits.';
      case 'agent':    return c+'Design an autonomous AI agent for this goal: its role/persona, the exact tools/APIs it can call, its step-by-step loop, guardrails, and how a human stays in the loop. Include the system prompt you would give the agent.';
      case 'content':  return c+'Build a content autopilot: how an idea becomes a finished, scheduled post with minimal human touch — the trigger, the AI generation step (with prompt), asset creation, approval gate, and auto-scheduling. Name the tools.';
      case 'leads':    return c+'Design a lead-gen pipeline: capture → enrich → qualify (AI) → personalized outreach → automated follow-up → handoff. Specify each tool, the AI qualifying/personalization prompts, and timing.';
      case 'support':  return c+'Design an AI customer-support automation: knowledge source, the bot’s instructions, how it answers, when it escalates to a human, and how it logs/learns. Name free tools to build it.';
      case 'recipe':   return c+'Write a concrete, copy-along recipe to build this on '+_state.platform+': exact modules/steps in order, the trigger, each action, field mappings, and a test step.';
      case 'sop':      return c+'Turn the goal into a documented SOP, then mark which steps to automate vs keep human, and how to automate each (tool + trigger). Output the SOP as numbered steps with an Automate/Human tag per step.';
      case 'stack':    return c+'List a complete FREE automation tool stack for this: automation platform, AI APIs, storage/sheets, scheduling, forms/webhooks, and notifications — what each is for and its free-tier limits.';
      default:         return c+'Design a practical automation for this goal.';
    }
  }

  function _tpl(id){
    switch(id){
      case 'workflow': return 'AUTOMATION BLUEPRINT ('+_state.goal+')\n\n1. TRIGGER: a new row/form/email arrives ('+_state.platform+' watches it).\n2. AI STEP: send the content to an AI module — prompt: "Summarise + classify this and draft the next action."\n3. ACTION: route by the AI result (e.g. create task, reply, add to sheet).\n4. NOTIFY: post a Slack/email summary.\n5. LOG: append the run to a Google Sheet for review.\nFree tiers: Make 1k ops/mo, Sheets free, an AI API free trial.';
      case 'agent': return 'AI AGENT DESIGN\n\nRole: an autonomous assistant for "'+_state.goal+'".\nTools: web fetch, a sheet/db, send-message, and one domain action.\nLoop: perceive input → plan → call a tool → check result → repeat until done → report.\nGuardrails: spending/scope limits, human approval before anything irreversible.\nSystem prompt: "You are a careful operations agent. Use tools to accomplish the task, confirm before destructive actions, and report what you did."';
      case 'content': return 'CONTENT AUTOPILOT\n\nTrigger: a new idea added to a sheet/Notion.\nAI generate: script + caption + hashtags (one prompt).\nAssets: auto-create image/video (AI tool) or pull stock.\nApproval: a quick yes/no message gate.\nSchedule: push to the platform scheduler. Result: ideas in, posts out — minimal touch.';
      case 'leads': return 'LEAD-GEN PIPELINE\n\nCapture: form/landing → row.\nEnrich: lookup company/role.\nQualify (AI): score fit + intent.\nOutreach: AI writes a personalised first message.\nFollow-up: auto-sequence over 7 days if no reply.\nHandoff: hot leads → your inbox + CRM.';
      case 'support': return 'AI SUPPORT BOT\n\nKnowledge: your FAQ/docs as the source.\nInstructions: answer only from the docs; be concise and kind.\nEscalate: if unsure or angry customer → human + transcript.\nLog: every chat to a sheet to spot gaps and improve.\nBuild with: a free chatbot builder + an AI API.';
      case 'recipe': return 'RECIPE ('+_state.platform+')\n\n1. Add a Trigger module (watch source).\n2. Add an AI module; map the trigger text into its prompt.\n3. Add a Router to branch on the AI output.\n4. Add Action modules per branch (create/reply/store).\n5. Add a Notify module.\n6. Run a test with sample data, then turn it on.';
      case 'sop': return 'SOP → AUTOMATION\n\n1. Receive request — [Human]\n2. Gather info — [Automate: form/webhook]\n3. Draft response — [Automate: AI]\n4. Review/approve — [Human]\n5. Send + record — [Automate]\n6. Follow up — [Automate: scheduler]\nStart by automating steps 2,3,5,6; keep 1,4 human until trusted.';
      case 'stack': return 'FREE AUTOMATION STACK\n\nPlatform: Make (1k ops/mo) or n8n (self-host free).\nAI: an LLM API free trial / Open-source model.\nData: Google Sheets / Airtable free.\nForms: Tally / Google Forms.\nScheduling: native platform schedulers.\nNotify: Slack/Email/Telegram free.';
      default: return 'Pick a tool to design an automation.';
    }
  }

  function _run(id){
    var tool=TOOLS.filter(function(t){ return t.id===id; })[0]||TOOLS[0];
    if(_ai()){
      _setOutput('✨ DIVA is architecting your automation…');
      AIClient.generate({ system:_aiSystem(), prompt:_aiPrompt(id), max_tokens:1500 })
        .then(function(t){ var out=((t||'').trim()||_tpl(id)); _setOutput(out); _save(tool.name, out); })
        .catch(function(){ var r=_tpl(id); _setOutput(r); _save(tool.name, r); });
    } else { var r=_tpl(id); _setOutput(r); _save(tool.name, r); }
  }

  function _copy(){ var el=document.getElementById('as-output'); if(!el||!el.textContent.trim()) return; navigator.clipboard.writeText(el.textContent).then(function(){ var b=document.getElementById('as-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1400); } }); }
  function _pin(){ var el=document.getElementById('as-output'); if(!el||!el.textContent.trim()) return; if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: '+_state.goal+' automation', content:el.textContent, tags:[_state.platform,'pinned'], pinned:true, building:'automation-studio' }); var b=document.getElementById('as-pin-btn'); if(b){ b.textContent='⭐ Pinned!'; setTimeout(function(){ b.textContent='⭐ Pin'; },1400); } }
  function _send(){ var el=document.getElementById('as-output'), m=document.getElementById('as-send-modal'); if(el&&m){ document.getElementById('as-send-content').value=el.textContent; m.classList.add('is-open'); } }
  function _confirmSend(){ var dest=(document.getElementById('as-send-dest')||{}).value, content=(document.getElementById('as-send-content')||{}).value; document.getElementById('as-send-modal').classList.remove('is-open'); if(dest&&window.BuildingWorkspace) BuildingWorkspace.open(dest,{ prefill:content }); }

  function _renderHistory(){
    var el=document.getElementById('as-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="as-empty">No history yet.</p>'; return; }
    el.innerHTML=_state.history.slice(0,20).map(function(h){
      return '<div class="as-hist-item"><span class="as-hist-type">'+_esc(h.type)+'</span><span class="as-hist-time">'+new Date(h.ts).toLocaleTimeString()+'</span>'+
        '<div class="as-hist-prev">'+_esc(h.content.slice(0,70))+'</div>'+
        '<button class="as-mini-btn" onclick="AutomationStudio._load('+JSON.stringify(h.content)+')">Reuse</button></div>';
    }).join('');
  }
  function _load(c){ _setOutput(c); }

  function _switchTab(tab){
    document.querySelectorAll('.as-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.as-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var platOpts=PLATFORMS.map(function(p){ return '<option'+(p===_state.platform?' selected':'')+'>'+_esc(p)+'</option>'; }).join('');
    var goalOpts=GOALS.map(function(g){ return '<option'+(g===_state.goal?' selected':'')+'>'+_esc(g)+'</option>'; }).join('');
    var destOpts=['income-lab','business-builder','app-trend-builder','project-lab','ops-center','memory-vault'].map(function(id){ return '<option value="'+id+'">'+id+'</option>'; }).join('');
    var cards=TOOLS.map(function(t){ return '<div class="as-agent-card" data-tool="'+t.id+'"><div class="as-agent-icon">'+t.icon+'</div><div class="as-agent-name">'+_esc(t.name)+'</div><div class="as-agent-desc">'+_esc(t.desc)+'</div></div>'; }).join('');

    return [
      '<div class="as-workspace">',
      '<div class="as-grid-bg" aria-hidden="true"></div>',

      '<div class="as-header">',
      '<div class="as-hdr-icon">🤖</div>',
      '<div><h2 class="as-title">AUTOMATION STUDIO</h2><p class="as-subtitle">Design AI workflows &amp; agents to run it on autopilot</p></div>',
      '</div>',

      '<div class="as-selectors">',
      '<div class="as-sel-group"><label class="as-label">Platform</label><select class="as-select" id="as-platform">'+platOpts+'</select></div>',
      '<div class="as-sel-group"><label class="as-label">Goal</label><select class="as-select" id="as-goal">'+goalOpts+'</select></div>',
      '<div class="as-sel-group as-sel-wide"><label class="as-label">Context (optional)</label><input class="as-input" id="as-context" type="text" placeholder="e.g. for my Etsy store, my coaching biz, my inbox..." /></div>',
      '</div>',

      '<div class="as-tabs">',
      '<button class="as-tab-btn is-active" data-tab="build">🧩 Build</button>',
      '<button class="as-tab-btn" data-tab="history">📂 History</button>',
      '</div>',

      '<div class="as-tab-pane is-active" data-tab="build">',
      '<p class="as-hint">Pick what to automate. Connect AI (top bar) for fully tailored, tool-specific blueprints — or use the built-in ones.</p>',
      '<div class="as-agent-grid">'+cards+'</div>',
      '<button class="as-btn as-btn--primary" id="as-surprise">🎲 Surprise me — design one</button>',
      '</div>',

      '<div class="as-tab-pane" data-tab="history">',
      '<div class="as-scroll-list" id="as-history-list"><p class="as-empty">No history yet.</p></div>',
      '</div>',

      '<div class="as-output-area">',
      '<div class="as-output-lbl">Blueprint</div>',
      '<div class="as-output" id="as-output" aria-live="polite">Pick a tool and DIVA designs the automation…</div>',
      '<div class="as-output-acts">',
      '<button class="as-btn as-btn--ghost" id="as-copy-btn">Copy</button>',
      '<button class="as-btn as-btn--ghost" id="as-pin-btn">⭐ Pin</button>',
      '<button class="as-btn as-btn--ghost" id="as-send-out-btn">➡ Send to Building</button>',
      '</div>',
      '</div>',

      '<div class="as-send-modal" id="as-send-modal">',
      '<div class="as-send-inner">',
      '<h3 class="as-send-title">➡ Send to Building</h3>',
      '<label class="as-label">Destination<select class="as-select" id="as-send-dest">'+destOpts+'</select></label>',
      '<textarea class="as-textarea" id="as-send-content" rows="4"></textarea>',
      '<div class="as-send-acts"><button class="as-btn as-btn--primary" id="as-send-confirm">Send</button><button class="as-btn as-btn--ghost" id="as-send-cancel">Cancel</button></div>',
      '</div></div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    var p=document.getElementById('as-platform'); if(p) p.addEventListener('change', function(e){ _state.platform=e.target.value; });
    var g=document.getElementById('as-goal'); if(g) g.addEventListener('change', function(e){ _state.goal=e.target.value; });
    var c=document.getElementById('as-context'); if(c) c.addEventListener('input', function(e){ _state.context=e.target.value; });

    document.querySelectorAll('.as-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });
    document.querySelectorAll('.as-agent-card').forEach(function(card){
      card.addEventListener('click', function(){
        document.querySelectorAll('.as-agent-card').forEach(function(x){ x.classList.remove('is-active'); });
        card.classList.add('is-active'); _run(card.dataset.tool);
      });
    });
    var sur=document.getElementById('as-surprise'); if(sur) sur.addEventListener('click', function(){ _run(_rand(TOOLS).id); });

    var acts={ 'as-copy-btn':_copy,'as-pin-btn':_pin,'as-send-out-btn':_send,'as-send-confirm':_confirmSend };
    Object.keys(acts).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', acts[id]); });
    var cancel=document.getElementById('as-send-cancel'); if(cancel) cancel.addEventListener('click', function(){ document.getElementById('as-send-modal').classList.remove('is-open'); });
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    container.innerHTML=_buildHTML();
    _bind();
    _renderHistory();
    if(opts.prefill){ var c=document.getElementById('as-context'); if(c){ c.value=opts.prefill; _state.context=opts.prefill; } }
  }

  return { mount:mount, _load:_load };
})();

window.AutomationStudio = AutomationStudio;
