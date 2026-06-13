'use strict';
/* Trade Desk Workspace - JARVIS AI City
   A markets agent: trade ideas, watchlists, strategy, risk/position sizing,
   options plays, market recaps and a Polygon.io live-data setup helper.
   EDUCATIONAL ONLY — nothing here is financial advice. */

var TradeDesk = (function() {

  var DISCLAIMER = '\n\n— Educational only. Not financial advice. Markets are risky; never trade money you cannot afford to lose.';

  var TICKERS = {
    'Stocks / ETFs': ['AAPL','NVDA','TSLA','MSFT','AMD','META','AMZN','GOOGL','SPY','QQQ','IWM','NFLX','PLTR','SMCI','AVGO'],
    'Options': ['SPY','QQQ','NVDA','TSLA','AAPL','AMD','META','COIN','SMCI'],
    'Crypto': ['BTC','ETH','SOL','XRP','DOGE','AVAX','LINK','MATIC'],
    'Forex': ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD'],
    'Futures': ['ES (S&P)','NQ (Nasdaq)','CL (Oil)','GC (Gold)','MES','MNQ']
  };
  var SETUPS = ['opening-range breakout','VWAP reclaim','pullback to the 9 EMA','bull flag continuation','gap-and-go','prior-day-high break','support bounce','RSI bullish divergence','liquidity sweep + reclaim','trend pullback to 20 EMA','double-bottom reversal','breakout-and-retest'];
  var CATALYSTS = ['earnings this week','unusual options flow','sector momentum','CPI / inflation print','FOMC / rate decision','product launch','analyst upgrade','breaking news gap','high relative volume'];
  var STYLES = ['Day trade','Scalp','Swing (days-weeks)','Position (weeks-months)','Long-term investing'];
  var RISKS = ['Conservative','Balanced','Aggressive'];
  var TOOLS = [
    {icon:'💡', name:'Idea Generator', desc:'Setups, levels-as-rules & R:R'},
    {icon:'👁', name:'Watchlist Builder', desc:'Tickers + why they are in play'},
    {icon:'🧭', name:'Strategy Coach', desc:'Rules for your trading style'},
    {icon:'🛡', name:'Risk Manager', desc:'Position sizing & the 1% rule'},
    {icon:'🎯', name:'Options Strategist', desc:'Spreads & defined-risk plays'},
    {icon:'📰', name:'Market Recap', desc:'Indices, sectors & tomorrow'},
    {icon:'📅', name:'Earnings Playbook', desc:'Trade earnings without gambling'},
    {icon:'🛰', name:'Live Data Setup', desc:'Wire a Polygon.io live feed'},
    {icon:'📓', name:'Trade Journal', desc:'Log & review your trades'},
    {icon:'🧠', name:'Psychology Coach', desc:'Discipline & tilt control'}
  ];

  var _state = { tab:'ideas', asset:'Stocks / ETFs', tickers:'', style:STYLES[0], risk:'Balanced', history:[], journal:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _syms(n){ var manual=_state.tickers.split(/[\s,]+/).filter(Boolean); var pool=manual.length?manual:_shuffle(TICKERS[_state.asset]||TICKERS['Stocks / ETFs']); return pool.slice(0,n); }

  function _setOutput(text){ var el=document.getElementById('td-output'); if(!el) return; el.classList.remove('td-flash'); void el.offsetWidth; el.textContent=text; el.classList.add('td-flash'); }
  function _save(type, content){
    if(window.CityMemory) CityMemory.add({ category:'markets', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.asset,_state.style,type], building:'trade-desk' });
    _state.history.unshift({ type:type, content:content, ts:Date.now() });
    if(_state.history.length>50) _state.history.pop();
    _renderHistory();
  }

  // ---- Generators (rules & education, not predictions) ----
  function _genIdeas(){
    var syms=_syms(3); if(!syms.length) syms=_shuffle(TICKERS[_state.asset]).slice(0,3);
    var lines=syms.map(function(s,i){
      var setup=_rand(SETUPS), cat=_rand(CATALYSTS);
      return (i+1)+'. '+s+' — '+setup+' ('+cat+')\n'+
        '   Plan: wait for confirmation of the '+setup+'. Enter on the trigger, NOT on a guess.\n'+
        '   Stop: just beyond the level that invalidates the idea (below support / structure low).\n'+
        '   Target: scale at 1R and 2R; trail the rest. Skip it if R:R is under 2:1.';
    });
    var txt='TRADE IDEAS — '+_state.asset+' / '+_state.style+' / '+_state.risk+' risk\n\n'+lines.join('\n\n')+
      '\n\nProcess > prediction: only take the trade if your entry trigger fires and your risk is defined first.'+DISCLAIMER;
    _setOutput(txt); _save('Trade ideas', txt);
  }
  function _genWatchlist(){
    var syms=_syms(6); if(!syms.length) syms=_shuffle(TICKERS[_state.asset]).slice(0,6);
    var lines=syms.map(function(s){ return '• '+s+' — '+_rand(SETUPS)+' setting up; watching for '+_rand(CATALYSTS)+'.'; });
    var txt='WATCHLIST — '+_state.asset+'\n\n'+lines.join('\n')+
      '\n\nRule: a watchlist is a list of conditions, not a buy list. Nothing is a trade until the trigger hits.'+DISCLAIMER;
    _setOutput(txt); _save('Watchlist', txt);
  }
  function _genStrategy(){
    var s=_state.style;
    var body;
    if(/Day|Scalp/.test(s)){
      body='Timeframe: 1-5 min entries, 15 min for context.\nFocus: 2-3 liquid names (e.g. SPY/QQQ/NVDA). Trade the open + the first 90 minutes.\nEntry: opening-range break or VWAP reclaim WITH relative volume.\nExit: hard stop on the other side of the level; take profits into strength.\nMax: 3 trades, 2 losses = done for the day.';
    } else if(/Swing/.test(s)){
      body='Timeframe: daily chart, 4h for timing.\nFocus: stocks in clear uptrends pulling back to the 20/50 EMA, or bases breaking out on volume.\nEntry: on the reclaim/breakout; stop under the base.\nHold: days to weeks; trail under higher lows.\nNever average down a losing swing.';
    } else if(/Position/.test(s)){
      body='Timeframe: daily/weekly.\nFocus: leaders with strong fundamentals + a technical base.\nEntry: stage in on breakouts/pullbacks; stop on a weekly close below structure.\nManage: add to winners, cut laggards, review monthly.';
    } else {
      body='Approach: dollar-cost average into broad ETFs (e.g. an index fund) on a schedule.\nIgnore noise; rebalance once or twice a year.\nTime in the market beats timing the market for most people.';
    }
    var txt='STRATEGY — '+s+' ('+_state.risk+')\n\n'+body+'\n\nGolden rule: define risk BEFORE entry. If you cannot state your stop, you do not have a trade.'+DISCLAIMER;
    _setOutput(txt); _save('Strategy', txt);
  }
  function _genOptions(){
    var s=_syms(1)[0]||'SPY';
    var bias=_rand(['bullish','bearish']);
    var play = bias==='bullish'
      ? 'Bull call (debit) spread: buy a near-the-money call, sell a higher-strike call in the same expiry. Defined risk = the debit paid; defined reward = strike width minus debit.'
      : 'Bear put (debit) spread: buy a near-the-money put, sell a lower-strike put same expiry. Defined risk = debit paid.';
    var txt='OPTIONS PLAY — '+s+' ('+bias+')\n\n'+play+
      '\n\nWhy a spread: caps your risk and lowers cost vs a naked option. Avoid selling naked options as a beginner.\nExpiry: give the thesis room — avoid 0DTE unless you are experienced.\nSize: risk only what you are 100% willing to lose; spreads can go to zero.'+DISCLAIMER;
    _setOutput(txt); _save('Options play', txt);
  }
  function _genRecap(){
    var txt='MARKET RECAP TEMPLATE (fill with the day\'s data)\n\n'+
      'Indices: SPY ___ | QQQ ___ | IWM ___ (trend: up/down/chop)\n'+
      'Breadth: advancers vs decliners ___ ; VIX ___\n'+
      'Leading sectors: ___ , ___  | Lagging: ___\n'+
      'Big movers: ___ (catalyst: ___)\n'+
      'Tomorrow: economic events (CPI/FOMC/jobs?) ___ ; earnings ___\n'+
      'My plan: bias ___ , levels to watch ___ , names on watch ___\n\n'+
      'Tip: wire the Live Data Setup (Polygon.io) to auto-fill indices, movers and volume.'+DISCLAIMER;
    _setOutput(txt); _save('Market recap', txt);
  }
  function _genEarnings(){
    var s=_syms(1)[0]||'AAPL';
    var txt='EARNINGS PLAYBOOK — '+s+'\n\n'+
      '1. Know the date + time (BMO/AMC) and the implied move (from option prices).\n'+
      '2. Decide BEFORE: are you holding through (gamble) or trading the reaction (safer)?\n'+
      '3. Through-earnings = defined-risk options only (spreads), tiny size.\n'+
      '4. Post-earnings: let the dust settle, then trade the trend off the gap with a clear stop.\n'+
      '5. Most blow-ups come from oversizing into a binary event. Size for the worst case.'+DISCLAIMER;
    _setOutput(txt); _save('Earnings playbook', txt);
  }
  function _genPsych(){
    var txt='TRADING PSYCHOLOGY\n\n'+
      '• One good trade = followed your plan, win or lose. One bad trade = broke your rules, win or lose.\n'+
      '• Set a daily max loss and walk away when you hit it. No revenge trades.\n'+
      '• Trade smaller until you are consistent. Confidence is earned, not forced.\n'+
      '• Journal every trade: setup, risk, emotion, result. Patterns live in the data.\n'+
      '• Boredom and FOMO lose more accounts than bad analysis.'+DISCLAIMER;
    _setOutput(txt); _save('Psychology', txt);
  }
  function _genLiveData(){
    var txt='LIVE MARKET DATA — Polygon.io setup\n\n'+
      'Polygon.io gives reliable live + historical market data (stocks, options, crypto, forex).\n\n'+
      'STEPS:\n'+
      '1. Create an account at polygon.io and copy your API key.\n'+
      '2. Keep the key on the SERVER (never in the browser). Add to your backend env:\n'+
      '     POLYGON_API_KEY=your_key_here\n'+
      '3. Example (Node) — last trade for a ticker:\n'+
      '     const r = await fetch(`https://api.polygon.io/v2/last/trade/AAPL?apiKey=${process.env.POLYGON_API_KEY}`);\n'+
      '     const { results } = await r.json();  // results.p = last price\n'+
      '4. For live streaming use Polygon\'s WebSocket (wss://socket.polygon.io) on the server and push updates to the app.\n\n'+
      'Note: a static site (GitHub Pages) cannot hold the key — run the included server.js (or your own backend) and proxy Polygon through it, exactly like the Claude/ElevenLabs proxy.'+DISCLAIMER;
    _setOutput(txt); _save('Live data setup', txt);
  }

  // ---- Risk / position-size calculator ----
  function _calcRisk(){
    function num(id){ var el=document.getElementById(id); return el?(parseFloat(el.value)||0):0; }
    var acct=num('td-acct'), riskPct=num('td-riskpct'), entry=num('td-entry'), stop=num('td-stop');
    var riskAmt = acct*(riskPct/100);
    var perShare = Math.abs(entry-stop);
    var shares = perShare>0 ? Math.floor(riskAmt/perShare) : 0;
    var posValue = shares*entry;
    var res='POSITION SIZING (the 1% rule)\n\n'+
      'Account:           $'+acct.toFixed(2)+'\n'+
      'Risk per trade:    '+riskPct+'%  =  $'+riskAmt.toFixed(2)+'\n'+
      'Entry:             $'+entry.toFixed(2)+'\n'+
      'Stop:              $'+stop.toFixed(2)+'\n'+
      'Risk per share:    $'+perShare.toFixed(2)+'\n'+
      '-----------------------------\n'+
      'Position size:     '+shares+' shares\n'+
      'Position value:    $'+posValue.toFixed(2)+'\n'+
      'Max loss if stopped: $'+(shares*perShare).toFixed(2)+'\n\n'+
      (riskPct>2 ? 'WARNING: risking over 2% per trade can blow up an account fast. Most pros risk 0.5-1%.' : 'Good discipline. Keep risk small and consistent.')+DISCLAIMER;
    var box=document.getElementById('td-calc-result'); if(box) box.textContent=res;
    _setOutput(res); _save('Position size', res);
  }

  function _runTool(name){
    var map={
      'Idea Generator':_genIdeas,'Watchlist Builder':_genWatchlist,'Strategy Coach':_genStrategy,
      'Risk Manager':function(){ _switchTab('risk'); },'Options Strategist':_genOptions,'Market Recap':_genRecap,
      'Earnings Playbook':_genEarnings,'Live Data Setup':_genLiveData,'Trade Journal':function(){ _switchTab('journal'); },
      'Psychology Coach':_genPsych
    };
    (map[name]||_genIdeas)();
  }

  // ---- Trade journal ----
  function _addJournal(){
    var t=document.getElementById('td-j-ticker'), s=document.getElementById('td-j-setup'), r=document.getElementById('td-j-result'), n=document.getElementById('td-j-notes');
    var entry={ ticker:(t&&t.value||'').toUpperCase()||'—', setup:(s&&s.value)||'', result:(r&&r.value)||'', notes:(n&&n.value)||'', ts:Date.now() };
    if(!entry.ticker && !entry.notes) return;
    _state.journal.unshift(entry);
    try{ localStorage.setItem('td_journal', JSON.stringify(_state.journal.slice(0,200))); }catch(e){}
    if(window.CityMemory) CityMemory.add({ category:'trade-journal', title:'Trade: '+entry.ticker+' ('+entry.result+')', content:entry.setup+' — '+entry.notes, building:'trade-desk', tags:['journal',entry.ticker] });
    if(t)t.value='';if(n)n.value='';
    _renderJournal();
  }
  function _renderJournal(){
    var el=document.getElementById('td-journal-list'); if(!el) return;
    if(!_state.journal.length){ el.innerHTML='<p class="td-empty">No trades logged yet. Log every trade — review weekly.</p>'; return; }
    var wins=_state.journal.filter(function(j){ return j.result==='Win'; }).length;
    var rate=Math.round(wins/_state.journal.length*100);
    el.innerHTML='<div class="td-jstats">'+_state.journal.length+' trades · '+rate+'% win rate</div>'+
      _state.journal.slice(0,40).map(function(j){
        var cls=j.result==='Win'?'td-win':(j.result==='Loss'?'td-loss':'');
        return '<div class="td-j-item '+cls+'"><span class="td-j-tk">'+_esc(j.ticker)+'</span><span class="td-j-res">'+_esc(j.result||'')+'</span>'+
          '<div class="td-j-prev">'+_esc((j.setup?j.setup+' — ':'')+(j.notes||''))+'</div></div>';
      }).join('');
  }

  // ---- Live AI boost (uses server.js Claude proxy when available) ----
  function _aiBoost(){
    var el=document.getElementById('td-output'); var btn=document.getElementById('td-ai-btn');
    var current=(el&&el.textContent.trim())||'';
    if(!window.AIClient || !AIClient.available()){
      _setOutput('Live AI is offline. Run the app with the server to enable it:\n\n  ANTHROPIC_API_KEY=sk-ant-... node server.js\n\nthen open http://localhost:8000 — AI Boost turns the template into a sharper, tailored plan.'+DISCLAIMER);
      return;
    }
    var orig=btn?btn.textContent:''; if(btn){ btn.textContent='Thinking…'; btn.disabled=true; }
    var prompt='Asset class: '+_state.asset+'. Style: '+_state.style+'. Risk: '+_state.risk+'. Tickers: '+(_state.tickers||'(my watchlist)')+
      '.\n\nImprove the markets/trading draft below: make it clearer, more specific and process-driven. Express entries/stops as RULES and conditions, never as guaranteed predictions or guaranteed prices. Always keep risk management central.\n\nDRAFT:\n'+(current||'Give me a disciplined plan for today.');
    AIClient.generate({ system:'You are a disciplined trading coach and markets educator. Teach process, risk management and defined-risk setups. You are NOT a financial advisor — never promise returns, always note risk. Return clean, copy-ready text.', prompt:prompt, max_tokens:1400 })
      .then(function(t){ var out=((t||'').trim()||current); if(out.indexOf('Not financial advice')===-1) out+=DISCLAIMER; _setOutput(out); _save('AI Boost', out); })
      .catch(function(e){ _setOutput('AI request failed: '+e.message+'\n\n(Your template output stands above.)'); })
      .then(function(){ if(btn){ btn.textContent=orig; btn.disabled=false; } });
  }

  // ---- Output actions ----
  function _copyOutput(){ var el=document.getElementById('td-output'); if(!el||!el.textContent.trim()) return; navigator.clipboard.writeText(el.textContent).then(function(){ var b=document.getElementById('td-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1500); } }); }
  function _pinOutput(){ var el=document.getElementById('td-output'); if(!el||!el.textContent.trim()) return; if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: '+_state.asset+' plan', content:el.textContent, tags:[_state.asset,'pinned'], pinned:true, building:'trade-desk' }); var b=document.getElementById('td-pin-btn'); if(b){ b.textContent='⭐ Pinned!'; setTimeout(function(){ b.textContent='⭐ Pin'; },1500); } }
  function _sendToBuilding(){ var el=document.getElementById('td-output'), modal=document.getElementById('td-send-modal'); if(el&&modal){ document.getElementById('td-send-content').value=el.textContent; modal.classList.add('is-open'); } }
  function _confirmSend(){ var dest=(document.getElementById('td-send-dest')||{}).value; var content=(document.getElementById('td-send-content')||{}).value; document.getElementById('td-send-modal').classList.remove('is-open'); if(dest&&window.BuildingWorkspace) BuildingWorkspace.open(dest,{ prefill:content }); }

  function _renderHistory(){
    var el=document.getElementById('td-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="td-empty">No history yet.</p>'; return; }
    el.innerHTML=_state.history.slice(0,20).map(function(h){
      return '<div class="td-hist-item"><span class="td-hist-type">'+_esc(h.type)+'</span><span class="td-hist-time">'+new Date(h.ts).toLocaleTimeString()+'</span>'+
        '<div class="td-hist-prev">'+_esc(h.content.slice(0,70))+'</div>'+
        '<button class="td-mini-btn" onclick="TradeDesk._load('+JSON.stringify(h.content)+')">Reuse</button></div>';
    }).join('');
  }
  function _load(c){ _setOutput(c); }

  function _switchTab(tab){
    _state.tab=tab;
    document.querySelectorAll('.td-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.td-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var assetOpts=Object.keys(TICKERS).map(function(a){ return '<option value="'+_esc(a)+'"'+(a===_state.asset?' selected':'')+'>'+_esc(a)+'</option>'; }).join('');
    var styleOpts=STYLES.map(function(s){ return '<option'+(s===_state.style?' selected':'')+'>'+_esc(s)+'</option>'; }).join('');
    var riskOpts=RISKS.map(function(r){ return '<option'+(r===_state.risk?' selected':'')+'>'+_esc(r)+'</option>'; }).join('');
    var destOpts=['business-builder','app-trend-builder','memory-vault','project-lab','ops-center','design-tower'].map(function(id){ return '<option value="'+id+'">'+id+'</option>'; }).join('');
    var toolCards=TOOLS.map(function(t){ return '<div class="td-agent-card" data-tool="'+_esc(t.name)+'"><div class="td-agent-icon">'+t.icon+'</div><div class="td-agent-name">'+_esc(t.name)+'</div><div class="td-agent-desc">'+_esc(t.desc)+'</div></div>'; }).join('');

    return [
      '<div class="td-workspace">',
      '<div class="td-holo-bg" aria-hidden="true">'+Array.from({length:14},function(_,i){ return '<span class="td-tick" style="--i:'+i+'">'+(i%2?'▲':'▼')+'</span>'; }).join('')+'</div>',

      '<div class="td-header">',
      '<div class="td-hdr-icon">📈</div>',
      '<div><h2 class="td-title">TRADE DESK</h2><p class="td-subtitle">Live data, trade ideas, strategy &amp; risk &mdash; built on discipline</p></div>',
      '</div>',
      '<div class="td-disclaimer">⚠ Educational only — not financial advice. Trading is risky.</div>',

      '<div class="td-selectors">',
      '<div class="td-sel-group"><label class="td-label">Market</label><select class="td-select" id="td-asset">'+assetOpts+'</select></div>',
      '<div class="td-sel-group"><label class="td-label">Style</label><select class="td-select" id="td-style">'+styleOpts+'</select></div>',
      '<div class="td-sel-group"><label class="td-label">Risk</label><select class="td-select" id="td-risk">'+riskOpts+'</select></div>',
      '<div class="td-sel-group td-sel-wide"><label class="td-label">Tickers (optional)</label><input class="td-input" id="td-tickers" type="text" placeholder="e.g. NVDA TSLA SPY — blank = auto" /></div>',
      '</div>',

      '<div class="td-tabs">',
      '<button class="td-tab-btn is-active" data-tab="ideas">💡 Ideas</button>',
      '<button class="td-tab-btn" data-tab="watchlist">👁 Watchlist</button>',
      '<button class="td-tab-btn" data-tab="strategy">🧭 Strategy</button>',
      '<button class="td-tab-btn" data-tab="options">🎯 Options</button>',
      '<button class="td-tab-btn" data-tab="risk">🛡 Risk</button>',
      '<button class="td-tab-btn" data-tab="recap">📰 Recap</button>',
      '<button class="td-tab-btn" data-tab="livedata">🛰 Live Data</button>',
      '<button class="td-tab-btn" data-tab="journal">📓 Journal</button>',
      '<button class="td-tab-btn" data-tab="agents">🤖 Tools</button>',
      '<button class="td-tab-btn" data-tab="history">📂 History</button>',
      '</div>',

      '<div class="td-tab-pane is-active" data-tab="ideas">',
      '<p class="td-hint">Setups as rules with defined risk and R:R — process over prediction.</p>',
      '<button class="td-btn td-btn--primary" id="td-gen-ideas">💡 Generate Trade Ideas</button>',
      '</div>',
      '<div class="td-tab-pane" data-tab="watchlist">',
      '<p class="td-hint">A list of conditions to watch — nothing is a trade until the trigger fires.</p>',
      '<button class="td-btn td-btn--primary" id="td-gen-watch">👁 Build Watchlist</button>',
      '</div>',
      '<div class="td-tab-pane" data-tab="strategy">',
      '<p class="td-hint">A rule set tailored to your trading style and risk tolerance.</p>',
      '<button class="td-btn td-btn--primary" id="td-gen-strat">🧭 Generate Strategy</button>',
      '</div>',
      '<div class="td-tab-pane" data-tab="options">',
      '<p class="td-hint">Defined-risk options structures (spreads) — caps your downside.</p>',
      '<button class="td-btn td-btn--primary" id="td-gen-opt">🎯 Generate Options Play</button>',
      '</div>',
      '<div class="td-tab-pane" data-tab="risk">',
      '<p class="td-hint">Position sizing with the 1% rule — the single biggest edge most traders ignore.</p>',
      '<div class="td-calc-grid">',
      '<label class="td-calc-lbl">Account $<input class="td-input" id="td-acct" type="number" value="5000" min="0" step="100"></label>',
      '<label class="td-calc-lbl">Risk %<input class="td-input" id="td-riskpct" type="number" value="1" min="0" step="0.25"></label>',
      '<label class="td-calc-lbl">Entry $<input class="td-input" id="td-entry" type="number" value="100" min="0" step="0.01"></label>',
      '<label class="td-calc-lbl">Stop $<input class="td-input" id="td-stop" type="number" value="97" min="0" step="0.01"></label>',
      '</div>',
      '<button class="td-btn td-btn--primary" id="td-calc-btn">🛡 Calculate Position Size</button>',
      '<pre class="td-calc-result" id="td-calc-result"></pre>',
      '</div>',
      '<div class="td-tab-pane" data-tab="recap">',
      '<p class="td-hint">A market-recap template to fill in nightly (wire Live Data to auto-fill).</p>',
      '<div class="td-btn-row"><button class="td-btn td-btn--primary" id="td-gen-recap">📰 Market Recap</button><button class="td-btn td-btn--ghost" id="td-gen-earn">📅 Earnings Playbook</button></div>',
      '</div>',
      '<div class="td-tab-pane" data-tab="livedata">',
      '<p class="td-hint">Wire reliable live market data with Polygon.io (key stays on the server).</p>',
      '<button class="td-btn td-btn--primary" id="td-gen-data">🛰 Polygon Live Data Setup</button>',
      '</div>',
      '<div class="td-tab-pane" data-tab="journal">',
      '<p class="td-hint">Log every trade. Reviewing your own data is how you actually improve.</p>',
      '<div class="td-jform">',
      '<input class="td-input" id="td-j-ticker" type="text" placeholder="Ticker" />',
      '<input class="td-input" id="td-j-setup" type="text" placeholder="Setup" />',
      '<select class="td-select" id="td-j-result"><option value="">Result</option><option>Win</option><option>Loss</option><option>Break-even</option></select>',
      '</div>',
      '<textarea class="td-input td-j-notes" id="td-j-notes" rows="2" placeholder="What happened? Did you follow your plan?"></textarea>',
      '<button class="td-btn td-btn--primary" id="td-j-add">📓 Log Trade</button>',
      '<div class="td-scroll-list" id="td-journal-list"></div>',
      '</div>',
      '<div class="td-tab-pane" data-tab="agents">',
      '<p class="td-hint">Every tool in one place. Click to run.</p>',
      '<div class="td-agent-grid">'+toolCards+'</div>',
      '</div>',
      '<div class="td-tab-pane" data-tab="history">',
      '<div class="td-scroll-list" id="td-history-list"><p class="td-empty">No history yet.</p></div>',
      '</div>',

      '<div class="td-output-area">',
      '<div class="td-output-lbl">Output</div>',
      '<div class="td-output" id="td-output" aria-live="polite">Pick a market and generate a disciplined plan…</div>',
      '<div class="td-output-acts">',
      '<button class="td-btn td-btn--primary" id="td-ai-btn">✨ AI Boost</button>',
      '<button class="td-btn td-btn--ghost" id="td-copy-btn">Copy</button>',
      '<button class="td-btn td-btn--ghost" id="td-pin-btn">⭐ Pin</button>',
      '<button class="td-btn td-btn--ghost" id="td-send-out-btn">➡ Send to Building</button>',
      '</div>',
      '</div>',

      '<div class="td-send-modal" id="td-send-modal">',
      '<div class="td-send-inner">',
      '<h3 class="td-send-title">➡ Send to Building</h3>',
      '<label class="td-label">Destination<select class="td-select" id="td-send-dest">'+destOpts+'</select></label>',
      '<textarea class="td-textarea" id="td-send-content" rows="4"></textarea>',
      '<div class="td-send-acts"><button class="td-btn td-btn--primary" id="td-send-confirm">Send</button><button class="td-btn td-btn--ghost" id="td-send-cancel">Cancel</button></div>',
      '</div></div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    var a=document.getElementById('td-asset'); if(a) a.addEventListener('change', function(e){ _state.asset=e.target.value; });
    var s=document.getElementById('td-style'); if(s) s.addEventListener('change', function(e){ _state.style=e.target.value; });
    var r=document.getElementById('td-risk'); if(r) r.addEventListener('change', function(e){ _state.risk=e.target.value; });
    var t=document.getElementById('td-tickers'); if(t) t.addEventListener('input', function(e){ _state.tickers=e.target.value; });

    document.querySelectorAll('.td-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });

    var map={ 'td-gen-ideas':_genIdeas,'td-gen-watch':_genWatchlist,'td-gen-strat':_genStrategy,'td-gen-opt':_genOptions,
      'td-calc-btn':_calcRisk,'td-gen-recap':_genRecap,'td-gen-earn':_genEarnings,'td-gen-data':_genLiveData,'td-j-add':_addJournal };
    Object.keys(map).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', map[id]); });

    document.querySelectorAll('.td-agent-card').forEach(function(card){
      card.addEventListener('click', function(){
        document.querySelectorAll('.td-agent-card').forEach(function(c){ c.classList.remove('is-active'); });
        card.classList.add('is-active'); _runTool(card.dataset.tool);
      });
    });

    var acts={ 'td-ai-btn':_aiBoost,'td-copy-btn':_copyOutput,'td-pin-btn':_pinOutput,'td-send-out-btn':_sendToBuilding,'td-send-confirm':_confirmSend };
    Object.keys(acts).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', acts[id]); });
    var cancel=document.getElementById('td-send-cancel'); if(cancel) cancel.addEventListener('click', function(){ document.getElementById('td-send-modal').classList.remove('is-open'); });
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    _state.tab='ideas';
    try{ _state.journal=JSON.parse(localStorage.getItem('td_journal')||'[]'); }catch(e){ _state.journal=[]; }
    container.innerHTML=_buildHTML();
    _bind();
    _renderHistory();
    _renderJournal();
    if(opts.prefill){ var ti=document.getElementById('td-tickers'); if(ti){ ti.value=opts.prefill; _state.tickers=opts.prefill; } }
  }

  return { mount:mount, _load:_load };
})();

window.TradeDesk = TradeDesk;
