'use strict';
/* JARVIS Brain — local "ask anything" responder.
   No backend required. Handles small talk, identity, time/date,
   maths, capabilities and a graceful knowledge fallback.
   British butler tone, always addresses Jess. */

var JarvisBrain = (function() {

  var USER = 'Jess';

  function _pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  // ---- Safe maths evaluator (numbers + - * / ( ) . %) ----
  function _tryMath(text){
    var m = text.toLowerCase()
      .replace(/what(?:'s| is)|calculate|work out|equals?|please|\?/g,'')
      .replace(/plus/g,'+').replace(/minus/g,'-')
      .replace(/times|multiplied by|x/g,'*')
      .replace(/divided by|over/g,'/')
      .replace(/percent of/g,'% of')
      .trim();
    // percent of: "20% of 80"
    var pm = m.match(/([\d.]+)\s*%\s*of\s*([\d.]+)/);
    if(pm){ return (parseFloat(pm[1])/100*parseFloat(pm[2])); }
    if(!/[0-9]/.test(m)) return null;
    if(!/^[-+*/().\s\d]+$/.test(m)) return null;
    if(!/[-+*/]/.test(m)) return null;
    try {
      // eslint-disable-next-line no-new-func
      var val = Function('"use strict";return ('+m+')')();
      if(typeof val === 'number' && isFinite(val)) return Math.round(val*1e6)/1e6;
    } catch(e){}
    return null;
  }

  function _timeReply(){
    var d = new Date();
    var t = d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    return 'It is currently ' + t + ', ' + USER + '.';
  }
  function _dateReply(){
    var d = new Date();
    var s = d.toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    return 'Today is ' + s + ', ' + USER + '.';
  }

  // ---- Intent table ----
  var RULES = [
    { test:/^(hi|hey|hello|yo|hiya|good (morning|afternoon|evening)|howdy)\b/i,
      reply:function(){ return _pick(['Hello '+USER+'. Lovely to hear from you. What shall we create?','Hello there, '+USER+'. How may I assist?','Good day, '+USER+'. I am all ears.']); } },

    { test:/how are you|how's it going|how are things|you (alright|okay|ok)/i,
      reply:function(){ return _pick(['Running splendidly, thank you '+USER+'. Every circuit humming. What can I do for you?','In fine form, '+USER+'. Ready when you are.']); } },

    { test:/who are you|what are you|your name|are you jarvis/i,
      reply:function(){ return 'I am DIVA, your personal AI city assistant, '+USER+'. Think of me as your guide through every building here.'; } },

    { test:/who (made|built|created) you|who's your (maker|creator)/i,
      reply:function(){ return 'I was built for you, '+USER+' — your own DIVA, running right here in your browser.'; } },

    { test:/what can you do|help|what do you do|capabilities|features|how do (i|you) work|guide me/i,
      reply:function(){ return 'Quite a lot, '+USER+'. Try the Suno Helper for music; the Book Helper for human-sounding books; the Business Builder for a clothing brand; or the App Trend Builder for original app ideas. Need outcomes fast? Visit the Goal Stack city: the Goal Concierge tells you where to start, the Content Engine builds a week of posts, the Offer Lab packages something to sell, the Learning Coach plans any skill, and Life Admin turns chaos into routines. Just ask me by voice, or switch cities up top.'; } },

    { test:/thank|cheers|appreciate|nice one/i,
      reply:function(){ return _pick(['Always a pleasure, '+USER+'.','My pleasure entirely, '+USER+'.','Anytime, '+USER+'.']); } },

    { test:/\b(bye|goodbye|see you|good night|that's all)\b/i,
      reply:function(){ return _pick(['Until next time, '+USER+'.','Goodbye for now, '+USER+'. I shall be right here.']); } },

    { test:/what (time|'s the time)|the time/i, reply:_timeReply },
    { test:/what (day|date)|today's date|what's the date/i, reply:_dateReply },

    { test:/joke|make me laugh|something funny/i,
      reply:function(){ return _pick([
        'Why did the neural network go to therapy? It had too many deep issues.',
        'I would tell you a UDP joke, but you might not get it.',
        'I tried to write a song about a tortilla. Turns out it was more of a wrap.']); } },

    { test:/i (love|like) you|you('re| are) (great|amazing|the best|brilliant)/i,
      reply:function(){ return _pick(['Too kind, '+USER+'. The feeling is mutual.','You flatter my circuits, '+USER+'.']); } },

    { test:/sing|song about|write me a song|lyrics/i,
      reply:function(){ return null; }, route:'songwriting' },

    { test:/clothing brand|clothing line|start a (brand|business)|sell (clothes|shirts|online)|shopify|printable|print on demand|side hustle|passive income/i,
      reply:function(){ return null; }, route:'business-builder' },

    { test:/app idea|app trend|new app|build an app|invent an app|startup idea|saas idea/i,
      reply:function(){ return null; }, route:'app-trend-builder' },

    { test:/\b(trade|trading|stocks?|the markets?|investing|options|crypto|bitcoin|day ?trad|swing trad|watchlist|polygon|ticker)\b/i,
      reply:function(){ return null; }, route:'trade-desk' },

    { test:/make money|passive income|side hustle|side-hustle|income idea|earn online|get rich|money online|no upfront|digital product|affiliate/i,
      reply:function(){ return null; }, route:'income-lab' },

    { test:/automat(e|ion)|workflow|zapier|make\.com|n8n|ai agent|autopilot|automate (my|the)|build a bot|integrat/i,
      reply:function(){ return null; }, route:'automation-studio' },

    { test:/content (plan|idea|calendar)|post(s|ing)? ideas|captions\?|go viral|content for|repurpose|reels\?|what (should|do) i post|grow (my|an) (audience|account|page)/i,
      reply:function(){ return null; }, route:'content-engine' },

    { test:/(create|build|make|package|design) an offer|my offer|sell (my|a) (skill|service|course|product)|pricing|price my|sales page|what (should|can) i (sell|charge)|monet(ise|ize) my/i,
      reply:function(){ return null; }, route:'offer-lab' },

    { test:/learn (to|how|a |about )|teach me|study|master|get good at|skill|course plan|how do i learn|i want to learn|revision|practice/i,
      reply:function(){ return null; }, route:'learning-coach' },

    { test:/routine|habit|organi[sz]e my (life|day|week)|declutter|life admin|chores|to-?do system|stay on top|planner|morning routine|get my life together/i,
      reply:function(){ return null; }, route:'life-admin' },

    { test:/where (do|should) i start|i don'?t know where to start|help me (pick|choose|decide)|what agent|which (agent|tool)|i have a goal|my goal is|reach my goal|too many ideas|overwhelmed/i,
      reply:function(){ return null; }, route:'goal-concierge' },

    { test:/who am i|my name/i,
      reply:function(){ return 'You are '+USER+' — the one in charge around here.'; } }
  ];

  // ---- Knowledge-ish fallback ----
  function _fallback(text){
    var t = text.trim();
    if(/\?$/.test(t)){
      return _pick([
        'Good question, '+USER+'. Here is my honest take: '+_reframe(t)+' If you would like, I can open the right building to dig in properly.',
        'Let me think, '+USER+'. '+_reframe(t)+' Shall I take you to a workspace to explore it further?'
      ]);
    }
    return _pick([
      'Noted, '+USER+'. I have logged that. Tell me how you would like to act on it — lyrics, a book, a design, or something else?',
      'Understood, '+USER+'. Point me at a goal and I will spin up the right building for you.'
    ]);
  }

  function _reframe(q){
    var c = q.replace(/\?+$/,'').replace(/^(what|why|how|when|where|who|is|are|do|does|can|could|should|would)\s+/i,'');
    if(!c) return 'It is worth weighing the trade-offs before deciding.';
    return 'When it comes to '+c.toLowerCase()+', the sensible move is to start small, test it, and refine from there.';
  }

  // Returns { reply: string|null, route: string|null }
  function respond(text){
    if(!text || !text.trim()) return { reply:null, route:null };

    var math = _tryMath(text);
    if(math !== null) return { reply:'That comes to '+math+', '+USER+'.', route:null };

    for(var i=0;i<RULES.length;i++){
      var r = RULES[i];
      if(r.test.test(text)){
        return { reply: r.reply ? r.reply() : null, route: r.route || null };
      }
    }
    return { reply:_fallback(text), route:null };
  }

  function greeting(){
    return _pick([
      'Ello '+USER+', at your service, boss bitch. Right then — kettle is on, what are we building, love?',
      'Hello '+USER+', at your service, boss bitch. Proper chuffed to see you, darling. Where to?',
      'Hello '+USER+', at your service, boss bitch. Let us get cracking, shall we, gov\'nor?'
    ]);
  }

  return { respond:respond, greeting:greeting, user:USER };
})();

window.JarvisBrain = JarvisBrain;
