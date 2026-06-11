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
      reply:function(){ return 'I am JARVIS, your personal AI city assistant, '+USER+'. Think of me as your guide through every building here.'; } },

    { test:/who (made|built|created) you|who's your (maker|creator)/i,
      reply:function(){ return 'I was built for you, '+USER+' — your own JARVIS, running right here in your browser.'; } },

    { test:/what can you do|help|what do you do|capabilities|features|how do (i|you) work|guide me/i,
      reply:function(){ return 'Quite a lot, '+USER+'. Try the Suno Helper for lyrics, music video ideas and Suno prompts; the Book Helper to write books that sound genuinely human; or just ask me anything by voice. You can also switch cities up top to explore different buildings.'; } },

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
      'Hello '+USER+'. JARVIS online and at your service. How may I help you today?',
      'Hello '+USER+'. All systems are live. What shall we build first?',
      'Hello '+USER+'. Welcome back to your city. Where would you like to begin?'
    ]);
  }

  return { respond:respond, greeting:greeting, user:USER };
})();

window.JarvisBrain = JarvisBrain;
