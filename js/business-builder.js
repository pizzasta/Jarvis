'use strict';
/* Business Builder Workspace - JARVIS AI City
   A full clothing-brand business agent: brand, products, Shopify, Canva,
   printables / print-on-demand, TikTok content, pricing and launch ops. */

var BusinessBuilder = (function() {

  // ---- Data ----
  var NICHES = ['Streetwear','Gymwear / Activewear','Faith-based apparel','Dark feminine','Y2K nostalgia','Cozy / loungewear','Pet lovers','Mom life','Mental health / affirmations','Anime & gaming','Coastal / western','Plus-size luxe'];
  var BRAND_WORDS_A = ['Velvet','Iron','Halo','Riot','Aura','Saint','Nova','Ember','Echo','Vandal','Lush','Wild','Noir','Gilded','Frost','Cobra','Atlas','Muse','Reverie','Phantom'];
  var BRAND_WORDS_B = ['Theory','Society','Collective','Atelier','Label','Studio','House','Threads','Culture','Department','Garments','Co','Supply','Standard','Union','Empire','Avenue','Department'];
  var GARMENTS = ['Oversized tee','Boxy crop tee','Heavyweight hoodie','Zip-up hoodie','Sweat shorts','Joggers','Baby tee','Long-sleeve','Bomber jacket','Beanie','Trucker hat','Tote bag','Socks','Ringer tee'];
  var FABRICS = ['240gsm heavyweight cotton','Tri-blend soft-touch','100% organic cotton','French terry fleece','Bamboo-cotton blend','Garment-dyed cotton'];
  var TIKTOK_FORMATS = [
    'GRWM styling the new drop with trending audio',
    'Packing orders ASMR — satisfying, no talking',
    'POV: the piece that gets the most compliments',
    '"Rate my fit" duet bait — invite stitches',
    'Day in the life of a small clothing brand founder',
    'Unboxing your own sample for the first time',
    'Behind the design: sketch -> mockup -> final',
    'Restock-in-progress countdown teaser',
    'Customer review screen-record + reaction',
    '3 ways to style one tee',
    'Studio tour / where the magic happens',
    'Honest "what it really costs to make a hoodie"',
    'Founder story — why I started this brand',
    'Trend forecast: what is about to blow up',
    'Sneak peek of the next colorway (blurred)'
  ];
  var TIKTOK_HOOKS = [
    'I cannot believe this is handmade by one person...',
    'POV: you finally found a brand that gets your aesthetic',
    'This sold out in 4 minutes last time',
    'Tell me your style and I will tell you the fit',
    'The comment section made me design this',
    'Stop scrolling if you love oversized fits',
    'Things nobody tells you about starting a clothing brand',
    'Watch me turn $0 into a clothing brand',
    'My most-asked-about piece is finally back',
    'Green flags in a small business owner'
  ];
  var CANVA_TEMPLATES = [
    'Product launch carousel (1080x1350) — 6 slides, bold serif + soft gradient',
    'Drop announcement story (1080x1920) — countdown sticker + product hero',
    'Discount code banner for Shopify hero (1920x1080)',
    'Size guide graphic — clean table, brand colors',
    'Linktree-style link-in-bio page graphic',
    'Thank-you insert card for packages (4x6 print)',
    'TikTok cover thumbnails set — consistent typography',
    'Email header — new arrivals (600px wide)',
    'Lookbook PDF cover — editorial photo + wordmark',
    'Pinterest pin pack (1000x1500) — 5 variations'
  ];
  var PRINTABLE_IDEAS = [
    'Affirmation wall-art bundle (set of 6, 8x10 + 11x14)',
    'Minimalist daily planner / habit tracker PDF',
    'Digital sticker pack for Goodnotes / iPad',
    'Niche coloring pages bundle (POD on Etsy)',
    'Quote phone wallpaper pack (matching the brand)',
    'Printable gift tags + thank-you cards',
    'Wedding / event signage template kit',
    'Budget + savings tracker printable',
    'Meal-plan + grocery list printable set',
    'Kids learning worksheets bundle'
  ];
  var LAUNCH_STEPS = [
    'Lock the niche + brand name + handle (check it is free on IG/TikTok/.com)',
    'Design 3 hero pieces (do not launch with 1)',
    'Order samples — never sell what you have not touched',
    'Shoot content: flat-lays, on-model, detail, lifestyle',
    'Build Shopify: theme, product pages, policies, shipping rates',
    'Set up email (Klaviyo): welcome flow + abandoned cart',
    'Post 7-10 TikToks BEFORE the drop to warm the algorithm',
    'Build a waitlist / early-access list for the launch',
    'Launch with scarcity: limited qty or 72-hour window',
    'Collect reviews + UGC, then restock the winners'
  ];
  var SUB_AGENTS = [
    {icon:'👑', name:'Brand Strategist', desc:'Name, niche, positioning & tagline'},
    {icon:'👕', name:'Product Designer', desc:'Apparel line, fabrics & mockup briefs'},
    {icon:'🛍', name:'Shopify Builder', desc:'Listings, SEO, pricing & store copy'},
    {icon:'🎨', name:'Canva Creator', desc:'Graphics, carousels & template kits'},
    {icon:'🖨', name:'Printables Maker', desc:'POD & digital download products'},
    {icon:'🎵', name:'TikTok Strategist', desc:'Hooks, 30-day calendar & viral formats'},
    {icon:'💰', name:'Pricing Analyst', desc:'Margins, profit & break-even'},
    {icon:'📧', name:'Email Marketer', desc:'Flows, campaigns & subject lines'},
    {icon:'🚀', name:'Launch Manager', desc:'Checklist, timeline & go-to-market'},
    {icon:'📈', name:'Growth Analyst', desc:'Trends, KPIs & scaling plays'}
  ];

  var _state = { tab:'brand', niche:NICHES[0], brand:'', history:[], versions:[] };

  function _rand(a){ return a[Math.floor(Math.random()*a.length)]; }
  function _shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function _esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _setOutput(text){
    var el=document.getElementById('bb-output'); if(!el) return;
    el.classList.remove('bb-flash'); void el.offsetWidth; el.textContent=text; el.classList.add('bb-flash');
  }
  function _save(type, content){
    if(window.CityMemory) CityMemory.add({ category:'business', title:type+': '+(content||'').slice(0,40), content:content, tags:[_state.niche,type], building:'business-builder' });
    _state.history.unshift({ type:type, content:content, ts:Date.now() });
    if(_state.history.length>50) _state.history.pop();
    _renderHistory();
  }

  // ---- Generators ----
  function _genBrand(){
    var names=[];
    for(var i=0;i<5;i++){ names.push(_rand(BRAND_WORDS_A)+' '+_rand(BRAND_WORDS_B)); }
    names = names.filter(function(v,i,a){ return a.indexOf(v)===i; });
    var tag=[
      'Wear the version of you that already won.',
      'For the ones who were built different.',
      'Not for everyone. On purpose.',
      'Quality you feel. Designs you remember.',
      'Made in small batches, worn on big days.'
    ];
    var txt='NICHE: '+_state.niche+'\n\nBRAND NAME IDEAS:\n- '+names.join('\n- ')+
      '\n\nTAGLINE OPTIONS:\n- '+_shuffle(tag).slice(0,3).join('\n- ')+
      '\n\nHANDLE TIP: pick a name where @name is free on TikTok + Instagram and the .com is available. Avoid numbers/underscores.';
    _state.brand=names[0];
    var bi=document.getElementById('bb-brand'); if(bi) bi.value=_state.brand;
    _setOutput(txt); _save('Brand kit', txt);
  }

  function _genProducts(){
    var picks=_shuffle(GARMENTS).slice(0,4);
    var lines=picks.map(function(g,i){
      return (i+1)+'. '+g+' — '+_rand(FABRICS)+'. Print: '+_rand(['front chest','large back','small embroidered','full-bleed sublimation','sleeve hit'])+'. Concept: '+_state.niche.toLowerCase()+' energy.';
    });
    var brand=_state.brand||'your brand';
    var txt='PRODUCT LINE for '+brand+' ('+_state.niche+'):\n\n'+lines.join('\n\n')+
      '\n\nMOCKUP BRIEF (paste into Midjourney / Ideogram / Canva):\n"'+_state.niche+' apparel flat-lay, '+picks[0].toLowerCase()+', minimal studio lighting, neutral background, premium streetwear catalog look --ar 4:5"';
    _setOutput(txt); _save('Product line', txt);
  }

  function _genShopify(){
    var brand=_state.brand||'Your Brand';
    var item=_rand(GARMENTS);
    var txt='SHOPIFY LISTING\n\nProduct Title (SEO): "'+item+' — '+_state.niche+' Unisex '+_rand(['Oversized','Relaxed','Premium'])+' Fit"\n\n'+
      'Description:\nMeet your new favourite. This '+item.toLowerCase()+' is cut for '+_state.niche.toLowerCase()+' and built from '+_rand(FABRICS).toLowerCase()+' so it keeps its shape wash after wash. Designed in-house by '+brand+'. Unisex fit — size down for fitted, true to size for relaxed.\n\n'+
      'Bullet points:\n- Premium heavyweight feel, not see-through\n- Pre-shrunk & garment-tested\n- Ethically printed, small-batch\n- Ships in 2-4 business days\n\n'+
      'SEO tags: '+_state.niche.toLowerCase()+', '+item.toLowerCase()+', unisex, aesthetic clothing, small business\n\n'+
      'Collections: New Arrivals, Best Sellers, The '+(_state.niche.split(' ')[0])+' Edit\n\n'+
      'Homepage hero copy: "New drop is live. Limited run — when it is gone, it is gone."';
    _setOutput(txt); _save('Shopify listing', txt);
  }

  function _genCanva(){
    var picks=_shuffle(CANVA_TEMPLATES).slice(0,5);
    var txt='CANVA TEMPLATE PLAN for '+(_state.brand||'your brand')+':\n\n- '+picks.join('\n- ')+
      '\n\nBRAND KIT IN CANVA:\nFonts: a bold display (headlines) + a clean sans (body). Colors: one dark base, one accent, one cream. Save these as a Canva Brand Kit so every graphic stays consistent.';
    _setOutput(txt); _save('Canva plan', txt);
  }

  function _genPrintables(){
    var picks=_shuffle(PRINTABLE_IDEAS).slice(0,5);
    var txt='PRINTABLE / PRINT-ON-DEMAND PRODUCTS ('+_state.niche+'):\n\n- '+picks.join('\n- ')+
      '\n\nWHERE TO SELL:\nEtsy (digital downloads = no inventory), Shopify Digital Downloads app, Gumroad, or Printful/Printify for physical POD.\n\nPRICING TIP: digital printables = pure margin. Price $4-12, bundle for $15-25, and let customers print at home.';
    _setOutput(txt); _save('Printables', txt);
  }

  function _genTikTokCalendar(){
    var days=_shuffle(TIKTOK_FORMATS);
    var lines=[];
    for(var d=1; d<=14; d++){ lines.push('Day '+d+': '+days[(d-1)%days.length]); }
    var txt='14-DAY TIKTOK CONTENT CALENDAR ('+_state.niche+'):\n\n'+lines.join('\n')+
      '\n\nPOST 1-2x/day. Hook in the first 1.5s. Keep it raw, not polished. Reply to every comment in the first hour.';
    _setOutput(txt); _save('TikTok calendar', txt);
  }
  function _genTikTokHooks(){
    var txt='VIRAL TIKTOK HOOKS:\n\n- '+_shuffle(TIKTOK_HOOKS).slice(0,6).join('\n- ')+
      '\n\nFORMULA: [bold claim or POV] + [show the product fast] + [reason to stay]. Put text on screen AND say it out loud.';
    _setOutput(txt); _save('TikTok hooks', txt);
  }

  function _genLaunch(){
    var txt='LAUNCH CHECKLIST for '+(_state.brand||'your brand')+':\n\n'+LAUNCH_STEPS.map(function(s,i){ return '[ ] '+(i+1)+'. '+s; }).join('\n')+
      '\n\nTIMELINE: weeks 1-2 design+samples, week 3 content, week 4 build store + warm-up, week 5 LAUNCH.';
    _setOutput(txt); _save('Launch plan', txt);
  }

  // ---- Pricing calculator ----
  function _calcPricing(){
    function num(id){ var el=document.getElementById(id); return el? (parseFloat(el.value)||0):0; }
    var cost=num('bb-cost'), ship=num('bb-ship'), fees=num('bb-fees'), price=num('bb-price'), qty=num('bb-qty')||1;
    var feeAmt = price*(fees/100);
    var profitEach = price - cost - ship - feeAmt;
    var margin = price>0 ? (profitEach/price*100) : 0;
    var total = profitEach*qty;
    var be = profitEach>0 ? Math.ceil((cost? 0:0)) : 0;
    var res='PROFIT BREAKDOWN (per unit):\n\n'+
      'Sale price:      $'+price.toFixed(2)+'\n'+
      'Product cost:   -$'+cost.toFixed(2)+'\n'+
      'Shipping cost:  -$'+ship.toFixed(2)+'\n'+
      'Platform fees:  -$'+feeAmt.toFixed(2)+' ('+fees+'%)\n'+
      '-----------------------------\n'+
      'Profit / unit:   $'+profitEach.toFixed(2)+'\n'+
      'Margin:          '+margin.toFixed(1)+'%\n\n'+
      'At '+qty+' units sold: $'+total.toFixed(2)+' profit.\n\n'+
      (margin<40 ? 'WARNING: margin under 40% is thin for apparel. Raise price or cut COGS.' : 'Healthy margin. Reinvest profit into ads + restocks.');
    var box=document.getElementById('bb-calc-result'); if(box){ box.textContent=res; }
    _setOutput(res); _save('Pricing', res);
  }

  function _runSubAgent(name){
    var map={
      'Brand Strategist':_genBrand,'Product Designer':_genProducts,'Shopify Builder':_genShopify,
      'Canva Creator':_genCanva,'Printables Maker':_genPrintables,'TikTok Strategist':_genTikTokCalendar,
      'Pricing Analyst':function(){ _switchTab('pricing'); },'Launch Manager':_genLaunch,
      'Email Marketer':_genEmail,'Growth Analyst':_genGrowth
    };
    (map[name]||_genBrand)();
  }
  function _genEmail(){
    var brand=_state.brand||'your brand';
    var txt='EMAIL FLOW for '+brand+':\n\nWELCOME (sent instantly):\nSubject: "Welcome to '+brand+' — here is 10% off"\nBody: Thanks for being early. Here is code WELCOME10. New drops hit your inbox first.\n\nABANDONED CART (1h later):\nSubject: "You left something behind..."\nBody: Your size is still in stock — but not for long. Finish checkout.\n\nLAUNCH CAMPAIGN:\nSubject: "It is live. Limited run."\nBody: The new drop just went live. Limited quantities. Shop before it sells out.';
    _setOutput(txt); _save('Email flow', txt);
  }
  function _genGrowth(){
    var txt='GROWTH PLAYBOOK ('+_state.niche+'):\n\n- Double down on the 1 product + 1 TikTok format that works; ignore the rest.\n- Reinvest 20-30% of revenue into restocks before ads.\n- Seed 5-10 micro-creators (1-20k) with free product monthly.\n- Add an upsell + a bundle to lift average order value.\n- Track: CTR, conversion %, AOV, return customer rate.\n- Restock winners FAST; retire losers without guilt.';
    _setOutput(txt); _save('Growth plan', txt);
  }

  // ---- Output actions ----
  function _copyOutput(){
    var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return;
    navigator.clipboard.writeText(el.textContent).then(function(){
      var b=document.getElementById('bb-copy-btn'); if(b){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1500); }
    });
  }
  function _pinOutput(){
    var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return;
    if(window.CityMemory) CityMemory.add({ category:'favorite', title:'Pinned: '+_state.niche+' business', content:el.textContent, tags:[_state.niche,'pinned'], pinned:true, building:'business-builder' });
    var b=document.getElementById('bb-pin-btn'); if(b){ b.textContent='⭐ Pinned!'; setTimeout(function(){ b.textContent='⭐ Pin'; },1500); }
  }
  function _saveVersion(){
    var el=document.getElementById('bb-output'); if(!el||!el.textContent.trim()) return;
    _state.versions.unshift({ label:'v'+(_state.versions.length+1), content:el.textContent, ts:Date.now() });
    if(_state.versions.length>20) _state.versions.pop();
    _renderVersions();
    var b=document.getElementById('bb-ver-btn'); if(b){ b.textContent='Saved!'; setTimeout(function(){ b.textContent='Save Version'; },1500); }
  }
  function _sendToBuilding(){
    var el=document.getElementById('bb-output'); var modal=document.getElementById('bb-send-modal');
    if(el&&modal){ document.getElementById('bb-send-content').value=el.textContent; modal.classList.add('is-open'); }
  }
  function _confirmSend(){
    var dest=(document.getElementById('bb-send-dest')||{}).value;
    var content=(document.getElementById('bb-send-content')||{}).value;
    document.getElementById('bb-send-modal').classList.remove('is-open');
    if(dest&&window.BuildingWorkspace) BuildingWorkspace.open(dest,{ prefill:content });
  }

  // ---- Renders ----
  function _renderHistory(){
    var el=document.getElementById('bb-history-list'); if(!el) return;
    if(!_state.history.length){ el.innerHTML='<p class="bb-empty">No history yet.</p>'; return; }
    el.innerHTML=_state.history.slice(0,20).map(function(h){
      return '<div class="bb-hist-item"><span class="bb-hist-type">'+_esc(h.type)+'</span><span class="bb-hist-time">'+new Date(h.ts).toLocaleTimeString()+'</span>'+
        '<div class="bb-hist-prev">'+_esc(h.content.slice(0,70))+'</div>'+
        '<button class="bb-mini-btn" onclick="BusinessBuilder._load('+JSON.stringify(h.content)+')">Reuse</button></div>';
    }).join('');
  }
  function _renderVersions(){
    var el=document.getElementById('bb-versions-list'); if(!el) return;
    if(!_state.versions.length){ el.innerHTML='<p class="bb-empty">No saved versions.</p>'; return; }
    el.innerHTML=_state.versions.map(function(v){
      return '<div class="bb-ver-item"><span class="bb-ver-label">'+v.label+'</span>'+
        '<div class="bb-ver-prev">'+_esc(v.content.slice(0,60))+'</div>'+
        '<button class="bb-mini-btn" onclick="BusinessBuilder._load('+JSON.stringify(v.content)+')">Load</button></div>';
    }).join('');
  }
  function _load(c){ _setOutput(c); }

  function _switchTab(tab){
    _state.tab=tab;
    document.querySelectorAll('.bb-tab-btn').forEach(function(b){ b.classList.toggle('is-active', b.dataset.tab===tab); });
    document.querySelectorAll('.bb-tab-pane').forEach(function(p){ p.classList.toggle('is-active', p.dataset.tab===tab); });
  }

  function _buildHTML(){
    var nicheOpts=NICHES.map(function(n){ return '<option value="'+_esc(n)+'"'+(n===_state.niche?' selected':'')+'>'+_esc(n)+'</option>'; }).join('');
    var destOpts=['design-tower','memory-vault','songwriting','project-lab','ops-center','app-trend-builder'].map(function(id){ return '<option value="'+id+'">'+id+'</option>'; }).join('');
    var agentCards=SUB_AGENTS.map(function(a){
      return '<div class="bb-agent-card" data-agent="'+_esc(a.name)+'"><div class="bb-agent-icon">'+a.icon+'</div><div class="bb-agent-name">'+_esc(a.name)+'</div><div class="bb-agent-desc">'+_esc(a.desc)+'</div></div>';
    }).join('');

    return [
      '<div class="bb-workspace">',
      '<div class="bb-holo-bg" aria-hidden="true">'+Array.from({length:12},function(_,i){ return '<span class="bb-coin" style="--i:'+i+'">$</span>'; }).join('')+'</div>',

      '<div class="bb-header">',
      '<div class="bb-hdr-icon">👑</div>',
      '<div><h2 class="bb-title">BUSINESS BUILDER</h2><p class="bb-subtitle">Clothing brand empire &mdash; Shopify, Canva, Printables &amp; TikTok</p></div>',
      '</div>',

      '<div class="bb-selectors">',
      '<div class="bb-sel-group"><label class="bb-label">Niche</label><select class="bb-select" id="bb-niche">'+nicheOpts+'</select></div>',
      '<div class="bb-sel-group bb-sel-wide"><label class="bb-label">Brand name</label><input class="bb-input" id="bb-brand" type="text" placeholder="Auto-generated, or type your own..." /></div>',
      '</div>',

      '<div class="bb-tabs">',
      '<button class="bb-tab-btn is-active" data-tab="brand">👑 Brand</button>',
      '<button class="bb-tab-btn" data-tab="products">👕 Products</button>',
      '<button class="bb-tab-btn" data-tab="shopify">🛍 Shopify</button>',
      '<button class="bb-tab-btn" data-tab="canva">🎨 Canva</button>',
      '<button class="bb-tab-btn" data-tab="printables">🖨 Printables</button>',
      '<button class="bb-tab-btn" data-tab="tiktok">🎵 TikTok</button>',
      '<button class="bb-tab-btn" data-tab="pricing">💰 Pricing</button>',
      '<button class="bb-tab-btn" data-tab="launch">🚀 Launch</button>',
      '<button class="bb-tab-btn" data-tab="agents">🤖 Agents</button>',
      '<button class="bb-tab-btn" data-tab="history">📂 History</button>',
      '<button class="bb-tab-btn" data-tab="versions">🔖 Saved</button>',
      '</div>',

      '<div class="bb-tab-pane is-active" data-tab="brand">',
      '<p class="bb-hint">Generate a brand identity: name ideas, taglines and a handle strategy for your niche.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-brand">👑 Generate Brand Kit</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="products">',
      '<p class="bb-hint">Build a starter product line with fabrics, print placement and an AI mockup brief.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-products">👕 Generate Product Line</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="shopify">',
      '<p class="bb-hint">Generate a full Shopify product listing: title, SEO description, bullets and collections.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-shopify">🛍 Generate Shopify Listing</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="canva">',
      '<p class="bb-hint">A Canva template plan + brand kit so every graphic stays on-brand.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-canva">🎨 Generate Canva Plan</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="printables">',
      '<p class="bb-hint">Add a digital / print-on-demand product line for passive income.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-printables">🖨 Generate Printables</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="tiktok">',
      '<p class="bb-hint">A 14-day content calendar and a stack of scroll-stopping hooks.</p>',
      '<div class="bb-btn-row"><button class="bb-btn bb-btn--primary" id="bb-gen-cal">📅 14-Day Calendar</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-gen-hooks">🪝 Viral Hooks</button></div>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="pricing">',
      '<p class="bb-hint">Know your numbers before you sell. Enter costs to see margin and profit.</p>',
      '<div class="bb-calc-grid">',
      '<label class="bb-calc-lbl">Sale price $<input class="bb-input" id="bb-price" type="number" value="40" min="0" step="0.5"></label>',
      '<label class="bb-calc-lbl">Product cost $<input class="bb-input" id="bb-cost" type="number" value="14" min="0" step="0.5"></label>',
      '<label class="bb-calc-lbl">Shipping $<input class="bb-input" id="bb-ship" type="number" value="4" min="0" step="0.5"></label>',
      '<label class="bb-calc-lbl">Platform fee %<input class="bb-input" id="bb-fees" type="number" value="5" min="0" step="0.5"></label>',
      '<label class="bb-calc-lbl">Units sold<input class="bb-input" id="bb-qty" type="number" value="100" min="1" step="1"></label>',
      '</div>',
      '<button class="bb-btn bb-btn--primary" id="bb-calc-btn">💰 Calculate Profit</button>',
      '<pre class="bb-calc-result" id="bb-calc-result"></pre>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="launch">',
      '<p class="bb-hint">Your step-by-step launch checklist and 5-week timeline.</p>',
      '<button class="bb-btn bb-btn--primary" id="bb-gen-launch">🚀 Generate Launch Plan</button>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="agents">',
      '<p class="bb-hint">Every tool in one place. Click an agent to run it.</p>',
      '<div class="bb-agent-grid">'+agentCards+'</div>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="history">',
      '<div class="bb-scroll-list" id="bb-history-list"><p class="bb-empty">No history yet.</p></div>',
      '</div>',

      '<div class="bb-tab-pane" data-tab="versions">',
      '<div class="bb-scroll-list" id="bb-versions-list"><p class="bb-empty">No saved versions.</p></div>',
      '</div>',

      '<div class="bb-output-area">',
      '<div class="bb-output-lbl">Output</div>',
      '<div class="bb-output" id="bb-output" aria-live="polite">Your generated content will appear here...</div>',
      '<div class="bb-output-acts">',
      '<button class="bb-btn bb-btn--ghost" id="bb-copy-btn">Copy</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-ver-btn">Save Version</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-pin-btn">⭐ Pin</button>',
      '<button class="bb-btn bb-btn--ghost" id="bb-send-out-btn">➡ Send to Building</button>',
      '</div>',
      '</div>',

      '<div class="bb-send-modal" id="bb-send-modal">',
      '<div class="bb-send-inner">',
      '<h3 class="bb-send-title">➡ Send to Building</h3>',
      '<label class="bb-label">Destination<select class="bb-select" id="bb-send-dest">'+destOpts+'</select></label>',
      '<textarea class="bb-textarea" id="bb-send-content" rows="4"></textarea>',
      '<div class="bb-send-acts"><button class="bb-btn bb-btn--primary" id="bb-send-confirm">Send</button><button class="bb-btn bb-btn--ghost" id="bb-send-cancel">Cancel</button></div>',
      '</div></div>',

      '</div>'
    ].join('\n');
  }

  function _bind(){
    var nicheEl=document.getElementById('bb-niche'); if(nicheEl) nicheEl.addEventListener('change', function(e){ _state.niche=e.target.value; });
    var brandEl=document.getElementById('bb-brand'); if(brandEl) brandEl.addEventListener('input', function(e){ _state.brand=e.target.value; });

    document.querySelectorAll('.bb-tab-btn').forEach(function(b){ b.addEventListener('click', function(){ _switchTab(b.dataset.tab); }); });

    var map={ 'bb-gen-brand':_genBrand,'bb-gen-products':_genProducts,'bb-gen-shopify':_genShopify,'bb-gen-canva':_genCanva,
      'bb-gen-printables':_genPrintables,'bb-gen-cal':_genTikTokCalendar,'bb-gen-hooks':_genTikTokHooks,'bb-gen-launch':_genLaunch,'bb-calc-btn':_calcPricing };
    Object.keys(map).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', map[id]); });

    document.querySelectorAll('.bb-agent-card').forEach(function(card){
      card.addEventListener('click', function(){
        document.querySelectorAll('.bb-agent-card').forEach(function(c){ c.classList.remove('is-active'); });
        card.classList.add('is-active');
        _runSubAgent(card.dataset.agent);
      });
    });

    var acts={ 'bb-copy-btn':_copyOutput,'bb-ver-btn':_saveVersion,'bb-pin-btn':_pinOutput,'bb-send-out-btn':_sendToBuilding,'bb-send-confirm':_confirmSend };
    Object.keys(acts).forEach(function(id){ var el=document.getElementById(id); if(el) el.addEventListener('click', acts[id]); });
    var cancel=document.getElementById('bb-send-cancel'); if(cancel) cancel.addEventListener('click', function(){ document.getElementById('bb-send-modal').classList.remove('is-open'); });
  }

  function mount(container, opts){
    if(!container) return;
    opts=opts||{};
    _state.tab='brand';
    container.innerHTML=_buildHTML();
    _bind();
    _renderHistory();
    _renderVersions();
    if(opts.prefill){ var bi=document.getElementById('bb-brand'); if(bi){ bi.value=opts.prefill; _state.brand=opts.prefill; } }
  }

  return { mount:mount, _load:_load };
})();

window.BusinessBuilder = BusinessBuilder;
