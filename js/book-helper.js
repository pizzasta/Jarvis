'use strict';
/* JARVIS AI City — Book Helper v1.0
   Generate books (outlines, chapters, blurbs, characters, titles)
   and a Humanizer that rewrites text to sound real, not AI. */

var BookHelper = (function() {

  var GENRES = ['Fiction','Thriller','Romance','Fantasy','Sci-Fi','Mystery','Memoir','Self-Help','Horror','Young Adult','Historical','Literary'];
  var TONES  = ['Warm','Gritty','Witty','Dark','Hopeful','Tense','Reflective','Punchy','Lyrical','Conversational'];
  var POV     = ['First person','Third person','Second person'];

  var _state = {
    tab:'outline', genre:'Fiction', tone:'Warm', pov:'First person', premise:'',
    drafts: JSON.parse(localStorage.getItem('bh_drafts')||'[]'),
    history: JSON.parse(localStorage.getItem('bh_history')||'[]'),
    recording:false, mediaRecorder:null, audioChunks:[], voiceNotes:[]
  };

  // ---- Generators ----
  var TITLE_PARTS_A = ['The Weight of','Where the','When We','A House of','The Last','Salt and','The Quiet','Ashes of','The Shape of','Before the'];
  var TITLE_PARTS_B = ['Small Hours','Light Falls','Were Brave','Paper Birds','Honest Thing','Smoke','Almost','the River','Water','Storm Breaks'];

  function _titles(){
    var out = [];
    for(var i=0;i<5;i++){ out.push(_rand(TITLE_PARTS_A)+' '+_rand(TITLE_PARTS_B)); }
    return 'Title ideas for your '+_state.genre.toLowerCase()+':\n\n• '+out.join('\n• ');
  }

  function _outline(){
    var p = _state.premise || 'a character who must choose between safety and the life they actually want';
    var beats = [
      'Chapter 1 — Ordinary world. We meet the lead inside '+p+'. Show the small ache they keep ignoring.',
      'Chapter 2 — The spark. Something tips the balance and the old routine stops working.',
      'Chapter 3 — Crossing over. They commit, half-reluctant, and there is no easy way back.',
      'Chapter 4 — Rising cost. New allies, new friction. The first real loss lands.',
      'Chapter 5 — Midpoint mirror. A truth surfaces that reframes everything before it.',
      'Chapter 6 — The squeeze. Pressure from every side; the plan cracks.',
      'Chapter 7 — Lowest point. They lose the thing they were protecting.',
      'Chapter 8 — The reckoning. A hard, human choice — not clever, just honest.',
      'Chapter 9 — Climax. The choice is tested in the open.',
      'Chapter 10 — After. Quieter. What did it actually cost, and was it worth it?'
    ];
    return _state.genre.toUpperCase()+' OUTLINE — '+_state.tone+' tone, '+_state.pov+'\n\nPremise: '+p+'\n\n'+beats.join('\n\n');
  }

  function _chapter(){
    var voice = _state.pov === 'First person' ? 'I' : (_state.pov === 'Second person' ? 'You' : 'She');
    var open = {
      'I':[ 'I told myself I wasn\'t going back. I went back.',
            'The kettle hadn\'t even boiled before the whole day went sideways.',
            'Nobody warns you that the worst news arrives on ordinary afternoons.'],
      'You':[ 'You stand in the doorway longer than you mean to.',
              'You knew, the second the phone buzzed, that you\'d answer it anyway.'],
      'She':[ 'She kept the receipt for three years. She wasn\'t sure why.',
              'The house was quiet in the way that meant someone had just left it.']
    }[voice];
    var body = [
      'It was a small thing, the kind you\'d miss if you blinked. But small things have a way of arriving in pairs.',
      'I made tea I didn\'t drink. Outside, a neighbour\'s dog argued with the wind.',
      'There\'s a particular silence after a decision is made — not peace, exactly. More like the floor settling.',
      'Later I would call it a mistake. Right then it just felt like breathing.'
    ];
    return 'CHAPTER DRAFT — '+_state.genre+', '+_state.tone+' tone\n\n'+_rand(open)+'\n\n'+_rand(body)+'\n\n'+_rand(body)+'\n\n(Keep going from here — the door is open.)';
  }

  function _blurb(){
    var p = _state.premise || 'an ordinary life cracked open by one impossible choice';
    return 'BACK-COVER BLURB\n\nWhen '+p+', everything '+( _state.genre==='Romance'?'they thought they wanted':'they were sure of')+' starts to come apart.\n\nA '+_state.tone.toLowerCase()+' '+_state.genre.toLowerCase()+' about love, nerve, and the cost of telling the truth — perfect for readers who like their stories close to the bone.\n\n"You won\'t put it down. You won\'t want to."';
  }

  function _characters(){
    return 'CHARACTER PROFILES\n\nLEAD\n• Wants: '+(_state.premise||'to stop running from the obvious')+'\n• Needs (different thing): to forgive themselves\n• Flaw: says yes to keep the peace\n• Voice: '+_state.tone.toLowerCase()+', dry under pressure\n\nFOIL\n• Wants the opposite, for good reasons\n• Pushes the lead toward the choice they\'re avoiding\n\nLOVE/ALLY\n• Sees the lead clearly — and stays anyway\n• Carries one secret that lands at the worst possible moment';
  }

  // ---- HUMANIZER: make text sound real, not AI ----
  var AI_TELLS = [
    [/\bin today's fast[- ]paced world\b/gi, 'these days'],
    [/\bit('s| is) important to note that\b/gi, ''],
    [/\bit('s| is) worth noting that\b/gi, ''],
    [/\bin conclusion\b/gi, 'So'],
    [/\bfurthermore\b/gi, 'And'],
    [/\bmoreover\b/gi, 'Plus'],
    [/\bhowever,\b/gi, 'But'],
    [/\badditionally,\b/gi, 'Also,'],
    [/\bin order to\b/gi, 'to'],
    [/\butilize\b/gi, 'use'],
    [/\bleverage\b/gi, 'use'],
    [/\bdelve into\b/gi, 'get into'],
    [/\bnavigate the complexities of\b/gi, 'deal with'],
    [/\ba testament to\b/gi, 'proof of'],
    [/\bunderscore(s)?\b/gi, 'show$1'],
    [/\btapestry\b/gi, 'mix'],
    [/\brealm\b/gi, 'world'],
    [/\bplethora\b/gi, 'plenty'],
    [/\bmyriad\b/gi, 'countless'],
    [/\bin the realm of\b/gi, 'in'],
    [/\bembark on a journey\b/gi, 'start'],
    [/\bunlock the (potential|power)\b/gi, 'get the most out'],
    [/\bgame[- ]changer\b/gi, 'big deal'],
    [/\bcutting[- ]edge\b/gi, 'new'],
    [/\bseamless(ly)?\b/gi, 'smooth$1'],
    [/\brobust\b/gi, 'solid'],
    [/\bvibrant\b/gi, 'lively']
  ];
  var CONTRACTIONS = [
    [/\bdo not\b/gi,"don't"],[/\bdoes not\b/gi,"doesn't"],[/\bdid not\b/gi,"didn't"],
    [/\bit is\b/gi,"it's"],[/\bit has\b/gi,"it's"],[/\bthat is\b/gi,"that's"],
    [/\byou are\b/gi,"you're"],[/\bwe are\b/gi,"we're"],[/\bthey are\b/gi,"they're"],
    [/\bi am\b/gi,"I'm"],[/\bcannot\b/gi,"can't"],[/\bwill not\b/gi,"won't"],
    [/\bis not\b/gi,"isn't"],[/\bare not\b/gi,"aren't"],[/\bwould not\b/gi,"wouldn't"],
    [/\bcould not\b/gi,"couldn't"],[/\bshould not\b/gi,"shouldn't"],[/\bhave not\b/gi,"haven't"],
    [/\bwhat is\b/gi,"what's"],[/\bthere is\b/gi,"there's"],[/\bhere is\b/gi,"here's"],
    [/\blet us\b/gi,"let's"]
  ];

  function humanize(text){
    if(!text || !text.trim()) return text;
    var t = text;
    AI_TELLS.forEach(function(p){ t = t.replace(p[0], p[1]); });
    CONTRACTIONS.forEach(function(p){ t = t.replace(p[0], p[1]); });
    // tidy doubled spaces / orphaned punctuation from removals
    t = t.replace(/\s{2,}/g,' ').replace(/\s+([,.;:!?])/g,'$1').replace(/^\s*[,.;:]\s*/gm,'');
    // re-capitalise sentence starts
    t = t.replace(/(^|[.!?]\s+)([a-z])/g, function(m,a,b){ return a+b.toUpperCase(); });
    // break up the longest sentence with a short human beat
    var sents = t.split(/(?<=[.!?])\s+/);
    if(sents.length){
      var li = 0, lmax = 0;
      sents.forEach(function(s,i){ if(s.split(' ').length > lmax){ lmax = s.split(' ').length; li = i; } });
      if(lmax > 22){
        var beat = _rand([' Honestly? It works.',' That part matters.',' No fluff.',' Simple as that.']);
        sents[li] = sents[li].replace(/[.!?]$/, '.') + beat;
      }
    }
    return sents.join(' ').trim();
  }

  function _humanScore(text){
    if(!text || !text.trim()) return null;
    var words = text.trim().split(/\s+/).length;
    var tells = 0;
    AI_TELLS.forEach(function(p){ var m = text.match(p[0]); if(m) tells += m.length; });
    var contractions = (text.match(/'(t|s|re|ve|ll|m|d)\b/gi)||[]).length;
    var sentences = text.split(/[.!?]+/).filter(function(s){ return s.trim(); });
    var avgLen = sentences.length ? words/sentences.length : words;
    var lenVar = 0;
    if(sentences.length > 1){
      var lens = sentences.map(function(s){ return s.trim().split(/\s+/).length; });
      var mean = lens.reduce(function(a,b){return a+b;},0)/lens.length;
      lenVar = Math.sqrt(lens.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/lens.length);
    }
    // higher = more human
    var score = 70;
    score -= tells * 12;                    // AI tells hurt
    score += Math.min(contractions*3, 18);  // contractions help
    score -= Math.max(0, avgLen-24)*2;       // very long sentences hurt
    score += Math.min(lenVar*2, 16);         // varied rhythm helps
    score = Math.max(2, Math.min(99, Math.round(score)));
    return { score:score, tells:tells };
  }

  // ---- Output plumbing ----
  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function _setOutput(text){
    var el = document.getElementById('bh-output');
    if(!el) return;
    el.classList.remove('bh-flash'); void el.offsetWidth;
    el.textContent = text; el.classList.add('bh-flash');
    _updateScore(text);
  }
  function _updateScore(text){
    var bar = document.getElementById('bh-score-fill');
    var lbl = document.getElementById('bh-score-val');
    var s = _humanScore(text);
    if(!bar||!lbl) return;
    if(!s){ bar.style.width='0%'; lbl.textContent='—'; return; }
    bar.style.width = s.score+'%';
    bar.style.background = s.score>70 ? 'linear-gradient(90deg,#69f0ae,#b9fbc0)' : s.score>45 ? 'linear-gradient(90deg,#ffd700,#fff176)' : 'linear-gradient(90deg,#ff5252,#ff8a80)';
    lbl.textContent = s.score+'% human' + (s.tells? ' · '+s.tells+' AI tell'+(s.tells>1?'s':''):'');
  }

  function _save(type, content){
    if(window.CityMemory) CityMemory.add({ category:'book', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.genre,_state.tone,type], building:'book-helper' });
    _state.history.unshift({ type:type, content:content, genre:_state.genre, ts:Date.now() });
    if(_state.history.length>60) _state.history.pop();
    localStorage.setItem('bh_history', JSON.stringify(_state.history.slice(0,80)));
    _renderHistory();
  }

  function _copyOutput(){
    var el = document.getElementById('bh-output');
    if(!el||!el.textContent.trim()) return;
    navigator.clipboard.writeText(el.textContent).then(function(){
      var b = document.getElementById('bh-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1500); }
    });
  }
  function _saveDraft(){
    var el = document.getElementById('bh-output');
    if(!el||!el.textContent.trim()) return;
    _state.drafts.unshift({ id:Date.now(), content:el.textContent, genre:_state.genre, tone:_state.tone, ts:Date.now() });
    if(_state.drafts.length>40) _state.drafts.pop();
    localStorage.setItem('bh_drafts', JSON.stringify(_state.drafts));
    _renderDrafts();
    var b = document.getElementById('bh-save-btn'); if(b){ b.textContent='Saved!'; setTimeout(function(){ b.textContent='Save Draft'; },1500); }
  }
  function _delDraft(id){ _state.drafts = _state.drafts.filter(function(d){ return d.id!==id; }); localStorage.setItem('bh_drafts', JSON.stringify(_state.drafts)); _renderDrafts(); }
  function _loadContent(c){ _setOutput(c); }

  function _renderDrafts(){
    var el = document.getElementById('bh-drafts-list'); if(!el) return;
    if(!_state.drafts.length){ el.innerHTML='<p class="bh-empty">No saved drafts yet.</p>'; return; }
    el.innerHTML = _state.drafts.map(function(d){
      return '<div class="bh-item"><div class="bh-item-meta"><span class="bh-tag">'+_esc(d.genre)+'</span><span class="bh-tag bh-tag--tone">'+_esc(d.tone)+'</span><span class="bh-time">'+new Date(d.ts).toLocaleDateString()+'</span></div>'+
        '<div class="bh-prev">'+_esc(d.content.slice(0,80))+'…</div>'+
        '<div class="bh-item-acts"><button class="bh-mini bh-load" data-id="'+d.id+'">Load</button><button class="bh-mini bh-del" data-id="'+d.id+'">Delete</button></div></div>';
    }).join('');
    el.querySelectorAll('.bh-load').forEach(function(b){ b.addEventListener('click', function(){ var d=_state.drafts.find(function(x){return x.id===Number(b.dataset.id);}); if(d) _setOutput(d.content); }); });
    el.querySelectorAll('.bh-del').forEach(function(b){ b.addEventListener('click', function(){ _delDraft(Number(b.dataset.id)); }); });
  }

  function _renderHistory(){
    var el = document.getElementById('bh-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="bh-empty">No history yet.</p>'; return; }
    el.innerHTML = _state.history.slice(0,25).map(function(h){
      return '<div class="bh-item"><div class="bh-item-meta"><span class="bh-tag">'+_esc(h.type)+'</span><span class="bh-time">'+new Date(h.ts).toLocaleTimeString()+'</span></div>'+
        '<div class="bh-prev">'+_esc(h.content.slice(0,80))+'…</div>'+
        '<button class="bh-mini bh-reuse" data-c="'+encodeURIComponent(h.content)+'">Reuse</button></div>';
    }).join('');
    el.querySelectorAll('.bh-reuse').forEach(function(b){ b.addEventListener('click', function(){ _setOutput(decodeURIComponent(b.dataset.c)); }); });
  }

  // ---- Voice notes ----
  async function _toggleVoice(){
    if(_state.recording){
      if(_state.mediaRecorder) _state.mediaRecorder.stop();
      _state.recording=false; var b=document.getElementById('bh-voice-btn'); if(b){ b.textContent='🎤 Voice Note'; b.classList.remove('bh-btn--rec'); }
      return;
    }
    if(!navigator.mediaDevices){ alert('Voice recording not supported here.'); return; }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      _state.audioChunks=[]; _state.mediaRecorder = new MediaRecorder(stream);
      _state.mediaRecorder.ondataavailable = function(e){ _state.audioChunks.push(e.data); };
      _state.mediaRecorder.onstop = function(){
        var url = URL.createObjectURL(new Blob(_state.audioChunks,{type:'audio/webm'}));
        _state.voiceNotes.unshift({ id:Date.now(), url:url, ts:Date.now() });
        _renderVoice(); stream.getTracks().forEach(function(t){ t.stop(); });
      };
      _state.mediaRecorder.start(); _state.recording=true;
      var b=document.getElementById('bh-voice-btn'); if(b){ b.textContent='⏹ Stop'; b.classList.add('bh-btn--rec'); }
    } catch(e){ alert('Microphone access denied.'); }
  }
  function _renderVoice(){
    var el=document.getElementById('bh-voice-list'); if(!el) return;
    if(!_state.voiceNotes.length){ el.innerHTML='<p class="bh-empty">No voice notes yet.</p>'; return; }
    el.innerHTML=_state.voiceNotes.map(function(n,i){ return '<div class="bh-item"><span class="bh-tag">Note '+(i+1)+'</span><audio controls src="'+n.url+'" class="bh-audio"></audio></div>'; }).join('');
  }

  // ---- Send to building ----
  function _sendToBuilding(){
    var el=document.getElementById('bh-output'), modal=document.getElementById('bh-send-modal');
    if(el&&modal){ document.getElementById('bh-send-content').value=el.textContent; modal.classList.add('is-open'); }
  }
  function _confirmSend(){
    var dest=(document.getElementById('bh-send-dest')||{}).value;
    var content=(document.getElementById('bh-send-content')||{}).value;
    document.getElementById('bh-send-modal').classList.remove('is-open');
    if(dest && window.BuildingWorkspace) BuildingWorkspace.open(dest,{ prefill:content });
    if(window.CityState) CityState.pushHistory({ type:'send-to-building', from:'book-helper', to:dest, content:content });
  }

  function _switchTab(tab){
    _state.tab=tab;
    document.querySelectorAll('.bh-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.bh-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var g = GENRES.map(function(x){ return '<option'+(x===_state.genre?' selected':'')+'>'+x+'</option>'; }).join('');
    var to = TONES.map(function(x){ return '<option'+(x===_state.tone?' selected':'')+'>'+x+'</option>'; }).join('');
    var pv = POV.map(function(x){ return '<option'+(x===_state.pov?' selected':'')+'>'+x+'</option>'; }).join('');
    var dest = ['edit-library','songwriting','research-district','memory-vault','design-tower'].map(function(id){ return '<option value="'+id+'">'+id+'</option>'; }).join('');

    return [
      '<div class="bh-workspace">',
      '<div class="bh-pages" aria-hidden="true">'+Array.from({length:8},function(_,i){ return '<span class="bh-page" style="--i:'+i+'"></span>'; }).join('')+'</div>',

      '<div class="bh-header"><div class="bh-hdr-icon">📖</div><div><h2 class="bh-title">BOOK HELPER</h2><p class="bh-subtitle">Write books that read human — not AI</p></div></div>',

      '<div class="bh-selectors">',
      '<div class="bh-sel"><label class="bh-label">Genre</label><select class="bh-select" id="bh-genre">'+g+'</select></div>',
      '<div class="bh-sel"><label class="bh-label">Tone</label><select class="bh-select" id="bh-tone">'+to+'</select></div>',
      '<div class="bh-sel"><label class="bh-label">Point of view</label><select class="bh-select" id="bh-pov">'+pv+'</select></div>',
      '</div>',
      '<div class="bh-premise"><label class="bh-label">Premise / idea</label><input class="bh-input" id="bh-premise" type="text" placeholder="e.g. a nurse inherits a lighthouse and a secret she was never meant to find" /></div>',

      '<div class="bh-tabs">',
      '<button class="bh-tab-btn is-active" data-tab="outline">📑 Outline</button>',
      '<button class="bh-tab-btn" data-tab="chapter">✍️ Chapter</button>',
      '<button class="bh-tab-btn" data-tab="blurb">📕 Blurb</button>',
      '<button class="bh-tab-btn" data-tab="characters">👥 Characters</button>',
      '<button class="bh-tab-btn" data-tab="titles">🏷️ Titles</button>',
      '<button class="bh-tab-btn" data-tab="humanize">🫶 Humanizer</button>',
      '<button class="bh-tab-btn" data-tab="drafts">💾 Drafts</button>',
      '<button class="bh-tab-btn" data-tab="voice">🎤 Voice</button>',
      '<button class="bh-tab-btn" data-tab="history">🕓 History</button>',
      '</div>',

      '<div class="bh-tab-pane is-active" data-tab="outline"><p class="bh-hint">Generate a full chapter-by-chapter outline from your premise.</p><button class="bh-btn bh-btn--primary" id="bh-outline-btn">Generate Outline</button></div>',
      '<div class="bh-tab-pane" data-tab="chapter"><p class="bh-hint">Draft an opening chapter in a real, human voice.</p><button class="bh-btn bh-btn--primary" id="bh-chapter-btn">Draft a Chapter</button></div>',
      '<div class="bh-tab-pane" data-tab="blurb"><p class="bh-hint">Write a back-cover blurb that sells the book.</p><button class="bh-btn bh-btn--primary" id="bh-blurb-btn">Generate Blurb</button></div>',
      '<div class="bh-tab-pane" data-tab="characters"><p class="bh-hint">Build out your lead, foil and ally.</p><button class="bh-btn bh-btn--primary" id="bh-char-btn">Generate Characters</button></div>',
      '<div class="bh-tab-pane" data-tab="titles"><p class="bh-hint">Five title ideas to choose from.</p><button class="bh-btn bh-btn--primary" id="bh-title-btn">Generate Titles</button></div>',

      '<div class="bh-tab-pane" data-tab="humanize">',
      '<p class="bh-hint">Paste AI-sounding text. I will strip the tells, add natural rhythm and contractions, and score how human it reads.</p>',
      '<textarea class="bh-textarea" id="bh-human-input" rows="6" placeholder="Paste text here..."></textarea>',
      '<button class="bh-btn bh-btn--primary" id="bh-human-btn">🫶 Humanize Text</button>',
      '</div>',

      '<div class="bh-tab-pane" data-tab="drafts"><div id="bh-drafts-list" class="bh-list"></div></div>',
      '<div class="bh-tab-pane" data-tab="voice"><p class="bh-hint">Capture ideas out loud while you write.</p><button class="bh-btn bh-btn--primary" id="bh-voice-btn">🎤 Voice Note</button><div id="bh-voice-list" class="bh-list"></div></div>',
      '<div class="bh-tab-pane" data-tab="history"><div id="bh-history-list" class="bh-list"></div></div>',

      '<div class="bh-output-area">',
      '<div class="bh-output-top"><span class="bh-output-lbl">Output</span>',
      '<div class="bh-score"><div class="bh-score-bar"><div class="bh-score-fill" id="bh-score-fill"></div></div><span class="bh-score-val" id="bh-score-val">—</span></div></div>',
      '<div class="bh-output" id="bh-output" aria-live="polite">Your generated writing will appear here...</div>',
      '<div class="bh-output-acts">',
      '<button class="bh-btn bh-btn--ghost" id="bh-humanize-out">🫶 Humanize this</button>',
      '<button class="bh-btn bh-btn--ghost" id="bh-copy-btn">Copy</button>',
      '<button class="bh-btn bh-btn--ghost" id="bh-save-btn">Save Draft</button>',
      '<button class="bh-btn bh-btn--ghost" id="bh-send-btn">➡️ Send to Building</button>',
      '</div></div>',

      '<div class="bh-send-modal" id="bh-send-modal" role="dialog" aria-modal="true">',
      '<div class="bh-send-inner"><h3 class="bh-send-title">➡️ Send to Building</h3>',
      '<label class="bh-label">Destination</label><select class="bh-select" id="bh-send-dest">'+dest+'</select>',
      '<textarea class="bh-textarea" id="bh-send-content" rows="4"></textarea>',
      '<div class="bh-send-acts"><button class="bh-btn bh-btn--primary" id="bh-send-confirm">Send</button><button class="bh-btn bh-btn--ghost" id="bh-send-cancel">Cancel</button></div>',
      '</div></div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    var ge=document.getElementById('bh-genre'), te=document.getElementById('bh-tone'), pe=document.getElementById('bh-pov'), pr=document.getElementById('bh-premise');
    if(ge) ge.addEventListener('change', function(e){ _state.genre=e.target.value; });
    if(te) te.addEventListener('change', function(e){ _state.tone=e.target.value; });
    if(pe) pe.addEventListener('change', function(e){ _state.pov=e.target.value; });
    if(pr) pr.addEventListener('input', function(e){ _state.premise=e.target.value; });

    document.querySelectorAll('.bh-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });

    var gen = function(id, fn, type){ var b=document.getElementById(id); if(b) b.addEventListener('click', function(){ var r=fn(); _setOutput(r); _save(type,r); }); };
    gen('bh-outline-btn', _outline, 'Outline');
    gen('bh-chapter-btn', _chapter, 'Chapter');
    gen('bh-blurb-btn', _blurb, 'Blurb');
    gen('bh-char-btn', _characters, 'Characters');
    gen('bh-title-btn', _titles, 'Titles');

    var hb=document.getElementById('bh-human-btn');
    if(hb) hb.addEventListener('click', function(){ var inp=document.getElementById('bh-human-input'); var src=inp?inp.value:''; if(!src.trim()){ _setOutput('Paste some text above first, then I will humanize it.'); return; } var out=humanize(src); _setOutput(out); _save('Humanized', out); });

    var ho=document.getElementById('bh-humanize-out');
    if(ho) ho.addEventListener('click', function(){ var el=document.getElementById('bh-output'); if(el&&el.textContent.trim()){ var out=humanize(el.textContent); _setOutput(out); _save('Humanized', out); } });

    var cp=document.getElementById('bh-copy-btn'); if(cp) cp.addEventListener('click', _copyOutput);
    var sv=document.getElementById('bh-save-btn'); if(sv) sv.addEventListener('click', _saveDraft);
    var sb=document.getElementById('bh-send-btn'); if(sb) sb.addEventListener('click', _sendToBuilding);
    var sc=document.getElementById('bh-send-confirm'); if(sc) sc.addEventListener('click', _confirmSend);
    var sx=document.getElementById('bh-send-cancel'); if(sx) sx.addEventListener('click', function(){ document.getElementById('bh-send-modal').classList.remove('is-open'); });
    var vb=document.getElementById('bh-voice-btn'); if(vb) vb.addEventListener('click', _toggleVoice);
  }

  function mount(container, opts){
    if(!container) return;
    opts = opts||{};
    _state.tab='outline';
    container.innerHTML = _buildHTML();
    _bind(); _renderDrafts(); _renderHistory(); _renderVoice();
    if(opts.prefill){
      var pe=document.getElementById('bh-premise'); if(pe){ pe.value=opts.prefill; _state.premise=opts.prefill; }
      var hi=document.getElementById('bh-human-input'); if(hi){ hi.value=opts.prefill; }
    }
  }

  return { mount:mount, humanize:humanize };
})();

window.BookHelper = BookHelper;
