'use strict';
/* CityMemory + MemoryVault Workspace - JARVIS AI City */

var CityMemory = (function() {
  var KEY = 'jarvis_memory_v1';
  function _load() { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch(e){ return []; } }
  function _save(e) { try { localStorage.setItem(KEY,JSON.stringify(e)); } catch(e){ console.warn('[CM] storage full'); } }
  function _uid() { return 'mem_'+Date.now()+'_'+Math.random().toString(36).slice(2,6); }
  function _title(s) { return (s||'').split('\n')[0].slice(0,50).trim() || 'Untitled'; }
  var _subs = [];
  function _notify(d,ev) { _subs.forEach(function(f){ f(d,ev); }); }
  function subscribe(fn) { _subs.push(fn); return function(){ _subs=_subs.filter(function(f){ return f!==fn; }); }; }

  function add(entry) {
    var entries = _load();
    var rec = { id:_uid(), category:entry.category||'prompt', title:entry.title||_title(entry.content||''),
      content:entry.content||'', tags:entry.tags||[], pinned:entry.pinned||false, related:entry.related||[],
      ts:Date.now(), building:entry.building||'unknown', metadata:entry.metadata||{} };
    entries.unshift(rec);
    var p=entries.filter(function(e){ return e.pinned; });
    var u=entries.filter(function(e){ return !e.pinned; }).slice(0,500-p.length);
    _save(p.concat(u));
    _notify(rec,'add');
    return rec;
  }

  function update(id,patch) {
    var entries=_load(), idx=entries.findIndex(function(e){ return e.id===id; });
    if(idx===-1) return null;
    entries[idx]=Object.assign({},entries[idx],patch,{id:id});
    _save(entries); _notify(entries[idx],'update'); return entries[idx];
  }

  function remove(id) { _save(_load().filter(function(e){ return e.id!==id; })); _notify({id:id},'remove'); }
  function get(id) { return _load().find(function(e){ return e.id===id; })||null; }
  function getAll() { return _load(); }
  function pin(id) { return update(id,{pinned:true}); }
  function unpin(id) { return update(id,{pinned:false}); }
  function favorite(id) { return update(id,{category:'favorite',pinned:true}); }

  function search(query,opts) {
    opts=opts||{};
    var q=(query||'').toLowerCase().trim();
    var r=_load();
    if(opts.category) r=r.filter(function(e){ return e.category===opts.category; });
    if(opts.building) r=r.filter(function(e){ return e.building===opts.building; });
    if(opts.pinned)   r=r.filter(function(e){ return e.pinned; });
    if(q) r=r.filter(function(e){
      return e.title.toLowerCase().indexOf(q)!==-1||e.content.toLowerCase().indexOf(q)!==-1||
        (e.tags||[]).some(function(t){ return t.toLowerCase().indexOf(q)!==-1; });
    });
    r.sort(function(a,b){ if(a.pinned&&!b.pinned) return -1; if(!a.pinned&&b.pinned) return 1; return b.ts-a.ts; });
    return r.slice(0,opts.limit||200);
  }

  function linkRelated(id,rid) {
    var e=get(id); if(!e) return;
    var rel=e.related.slice(); if(rel.indexOf(rid)===-1) rel.push(rid);
    return update(id,{related:rel});
  }

  function getRelated(id) {
    var e=get(id); if(!e||!e.related.length) return [];
    var all=_load();
    return e.related.map(function(rid){ return all.find(function(x){ return x.id===rid; }); }).filter(Boolean);
  }

  function getSuggestions(ctx) {
    var entries=_load(); if(!entries.length) return [];
    ctx=(ctx||'').toLowerCase();
    var suggs=[];
    entries.filter(function(e){ return e.pinned; }).slice(0,2).forEach(function(e){
      suggs.push({type:'pinned',entry:e,reason:'Pinned project'});
    });
    if(ctx) {
      ctx.split(/\s+/).filter(function(w){ return w.length>3; }).forEach(function(word){
        entries.filter(function(e){
          return e.content.toLowerCase().indexOf(word)!==-1||e.title.toLowerCase().indexOf(word)!==-1;
        }).slice(0,2).forEach(function(e){
          if(!suggs.find(function(s){ return s.entry.id===e.id; }))
            suggs.push({type:'related',entry:e,reason:'Related: '+word});
        });
      });
    }
    var bldg=window.CityState?CityState.get().activeBuilding:null;
    if(bldg) entries.filter(function(e){ return e.building===bldg; }).slice(0,3).forEach(function(e){
      if(!suggs.find(function(s){ return s.entry.id===e.id; }))
        suggs.push({type:'recent',entry:e,reason:'Recent here'});
    });
    return suggs.slice(0,6);
  }

  function getStats() {
    var e=_load(), cats={};
    e.forEach(function(x){ cats[x.category]=(cats[x.category]||0)+1; });
    return {total:e.length, pinned:e.filter(function(x){ return x.pinned; }).length, categories:cats};
  }

  function exportAll() { return JSON.stringify(_load(),null,2); }
  function importAll(json) {
    try { var d=JSON.parse(json); if(!Array.isArray(d)) return false; _save(d); _notify(null,'import'); return true; }
    catch(e){ return false; }
  }
  function clearAll() { _save([]); _notify(null,'clear'); }

  return {add:add,update:update,remove:remove,get:get,getAll:getAll,pin:pin,unpin:unpin,favorite:favorite,
    search:search,linkRelated:linkRelated,getRelated:getRelated,getSuggestions:getSuggestions,
    getStats:getStats,exportAll:exportAll,importAll:importAll,clearAll:clearAll,subscribe:subscribe};
})();
window.CityMemory=CityMemory;

/* ---- MemoryVault Workspace ---- */
var MemoryVault = (function() {
  var CATS = [
    {id:'all',label:'All',icon:'\uD83D\uDDC2'},
    {id:'prompt',label:'Prompts',icon:'\uD83D\uDCAC'},
    {id:'favorite',label:'Favorites',icon:'\u2B50'},
    {id:'songwriting',label:'Songs',icon:'\uD83C\uDFB5'},
    {id:'design',label:'Design',icon:'\uD83C\uDFA8'},
    {id:'editing',label:'Editing',icon:'\u270D'},
    {id:'project',label:'Projects',icon:'\uD83D\uDE80'},
    {id:'session',label:'Sessions',icon:'\u23F1'}
  ];
  var _st = {category:'all',query:'',pinned:false};

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _renderStats() {
    var s=CityMemory.getStats();
    var t=document.getElementById('mv-stat-total'), p=document.getElementById('mv-stat-pinned');
    if(t) t.textContent=s.total; if(p) p.textContent=s.pinned;
  }

  function _renderSuggestions() {
    var el=document.getElementById('mv-suggestions'); if(!el) return;
    var suggs=CityMemory.getSuggestions(_st.query);
    if(!suggs.length){el.innerHTML='';return;}
    el.innerHTML='<span class="mv-sugg-label">&#9889; Suggestions:</span>'+
      suggs.map(function(s){
        return '<button class="mv-sugg-chip" data-id="'+s.entry.id+'" title="'+_esc(s.reason)+'">'+_esc(s.entry.title.slice(0,28))+'</button>';
      }).join('');
    el.querySelectorAll('.mv-sugg-chip').forEach(function(c){
      c.addEventListener('click',function(){ _openDetail(c.dataset.id); });
    });
  }

  function _cardHTML(e) {
    var cat=CATS.find(function(c){ return c.id===e.category; })||CATS[0];
    var date=new Date(e.ts).toLocaleDateString();
    var preview=_esc(e.content.slice(0,110).replace(/\n/g,' '));
    var tags=(e.tags||[]).map(function(t){ return '<span class="mv-tag">'+_esc(t)+'</span>'; }).join('');
    var pinIco=e.pinned?'\uD83D\uDCCC':'\uD83D\uDCCD';
    return [
      '<div class="mv-card mv-card--'+e.category+(e.pinned?' is-pinned':'')+'" data-id="'+e.id+'" role="listitem">',
      '<div class="mv-card__hdr"><span class="mv-card__cat">'+cat.icon+'</span>',
      '<span class="mv-card__ttl">'+_esc(e.title)+'</span>',
      '<span class="mv-card__date">'+date+'</span></div>',
      '<div class="mv-card__prev">'+preview+(e.content.length>110?'...':'')+'</div>',
      '<div class="mv-card__tags">'+tags+'</div>',
      '<div class="mv-card__acts">',
      '<button class="mv-cbtn mv-open" title="Open">Open</button>',
      '<button class="mv-cbtn mv-pin" title="Pin">'+pinIco+'</button>',
      '<button class="mv-cbtn mv-fav" title="Favourite">&#11088;</button>',
      '<button class="mv-cbtn mv-del" title="Delete">&#128465;</button>',
      '</div></div>'
    ].join('\n');
  }

  function _renderArchive() {
    var con=document.getElementById('mv-archive'), emp=document.getElementById('mv-empty');
    if(!con) return;
    var opts={category:_st.category==='all'?undefined:_st.category, pinned:_st.pinned||undefined};
    var entries=CityMemory.search(_st.query,opts);
    if(!entries.length){con.innerHTML='';if(emp)emp.style.display='flex';return;}
    if(emp) emp.style.display='none';
    con.innerHTML=entries.map(function(e){ return _cardHTML(e); }).join('');
    con.querySelectorAll('.mv-card').forEach(function(card){
      var id=card.dataset.id;
      var o=card.querySelector('.mv-open'), pi=card.querySelector('.mv-pin');
      var f=card.querySelector('.mv-fav'), d=card.querySelector('.mv-del');
      if(o) o.addEventListener('click',function(){ _openDetail(id); });
      if(pi) pi.addEventListener('click',function(ev){
        ev.stopPropagation();
        var e=CityMemory.get(id); if(e){ e.pinned?CityMemory.unpin(id):CityMemory.pin(id); _renderArchive(); _renderStats(); }
      });
      if(f) f.addEventListener('click',function(ev){
        ev.stopPropagation(); CityMemory.favorite(id); _renderArchive(); _renderStats();
      });
      if(d) d.addEventListener('click',function(ev){
        ev.stopPropagation();
        if(confirm('Delete this memory?')){ CityMemory.remove(id); _renderArchive(); _renderStats(); }
      });
    });
  }

  function _openDetail(id) {
    var entry=CityMemory.get(id); if(!entry) return;
    var panel=document.getElementById('mv-detail'), inner=document.getElementById('mv-detail-inner');
    if(!panel||!inner) return;
    var cat=CATS.find(function(c){ return c.id===entry.category; })||CATS[0];
    var related=CityMemory.getRelated(id);
    var all=CityMemory.getAll().filter(function(e){ return e.id!==id; });
    var linkOpts=all.slice(0,15).map(function(e){
      return '<option value="'+e.id+'">'+_esc(e.title.slice(0,40))+'</option>';
    }).join('');
    var relHTML=related.length?related.map(function(r){
      return '<span class="mv-rel-chip" data-id="'+r.id+'">'+_esc(r.title.slice(0,28))+'</span>';
    }).join(''):'<span class="mv-muted">None yet.</span>';
    inner.innerHTML=[
      '<button class="mv-detail-close" id="mv-detail-close">&times;</button>',
      '<div class="mv-detail-cat">'+cat.icon+' '+cat.label.toUpperCase()+'</div>',
      '<div contenteditable="true" class="mv-detail-title" id="mv-det-title">'+_esc(entry.title)+'</div>',
      '<div class="mv-detail-meta">'+new Date(entry.ts).toLocaleString()+' &mdash; '+_esc(entry.building)+'</div>',
      '<div contenteditable="true" class="mv-detail-content" id="mv-det-content">'+_esc(entry.content)+'</div>',
      '<label class="mv-label">Tags<input class="mv-input" id="mv-det-tags" value="'+_esc((entry.tags||[]).join(', '))+'" /></label>',
      '<div class="mv-section-lbl">Related Projects</div>',
      '<div class="mv-rel-list" id="mv-rel-list">'+relHTML+'</div>',
      '<div class="mv-link-row"><select class="mv-select" id="mv-link-sel"><option value="">Link a project...</option>'+linkOpts+'</select>',
      '<button class="mv-btn mv-btn--ghost" id="mv-link-btn">+ Link</button></div>',
      '<div class="mv-det-acts">',
      '<button class="mv-btn mv-btn--primary" id="mv-det-save">Save Changes</button>',
      '<button class="mv-btn mv-btn--ghost" id="mv-det-fav">&#11088; Favourite</button>',
      '<button class="mv-btn mv-btn--danger" id="mv-det-del">&#128465; Delete</button>',
      '</div>'
    ].join('\n');
    panel.classList.add('is-open');
    document.getElementById('mv-detail-close').addEventListener('click',function(){ panel.classList.remove('is-open'); });
    document.getElementById('mv-det-save').addEventListener('click',function(){
      var t=(document.getElementById('mv-det-title')||{}).innerText||entry.title;
      var co=(document.getElementById('mv-det-content')||{}).innerText||entry.content;
      var tg=(document.getElementById('mv-det-tags')||{}).value||'';
      CityMemory.update(id,{title:t,content:co,tags:tg.split(',').map(function(x){ return x.trim(); }).filter(Boolean)});
      _renderArchive(); _renderStats(); panel.classList.remove('is-open');
    });
    document.getElementById('mv-det-fav').addEventListener('click',function(){ CityMemory.favorite(id); _renderArchive(); _renderStats(); panel.classList.remove('is-open'); });
    document.getElementById('mv-det-del').addEventListener('click',function(){
      if(confirm('Delete permanently?')){ CityMemory.remove(id); _renderArchive(); _renderStats(); panel.classList.remove('is-open'); }
    });
    document.getElementById('mv-link-btn').addEventListener('click',function(){
      var sel=document.getElementById('mv-link-sel');
      if(sel&&sel.value){
        CityMemory.linkRelated(id,sel.value);
        var rl=document.getElementById('mv-rel-list');
        if(rl){ var linked=CityMemory.getRelated(id); rl.innerHTML=linked.map(function(r){ return '<span class="mv-rel-chip">'+_esc(r.title.slice(0,28))+'</span>'; }).join(''); }
      }
    });
    inner.querySelectorAll('.mv-rel-chip[data-id]').forEach(function(c){
      c.addEventListener('click',function(){ _openDetail(c.dataset.id); });
    });
  }

  function _buildHTML() {
    var stats=CityMemory.getStats();
    var catTabs=CATS.map(function(c){
      return '<button class="mv-cat-btn'+(c.id==='all'?' is-active':'')+'" data-cat="'+c.id+'">'+c.icon+' '+c.label+'</button>';
    }).join('');
    var newCatOpts=CATS.filter(function(c){ return c.id!=='all'; }).map(function(c){
      return '<option value="'+c.id+'">'+c.icon+' '+c.label+'</option>';
    }).join('');
    return [
      '<div class="mv-workspace" id="mv-workspace">',
      '<div class="mv-holo-bg" aria-hidden="true">'+Array.from({length:18},function(_,i){ return '<span class="mv-holo-dot" style="--i:'+i+'"></span>'; }).join('')+'</div>',
      '<div class="mv-header">',
      '<div class="mv-hdr-icon">\uD83D\uDCBE</div>',
      '<div><h2 class="mv-title">MEMORY VAULT</h2><p class="mv-subtitle">Long-term context, recall &amp; project archive</p></div>',
      '<div class="mv-stats-bar">',
      '<span class="mv-stat"><strong id="mv-stat-total">'+stats.total+'</strong> entries</span>',
      '<span class="mv-stat"><strong id="mv-stat-pinned">'+stats.pinned+'</strong> pinned</span>',
      '</div></div>',
      '<div class="mv-search-row">',
      '<div class="mv-search-wrap"><span class="mv-search-icon">\uD83D\uDD0D</span>',
      '<input class="mv-search" id="mv-search" type="text" placeholder="Search memories..." autocomplete="off" />',
      '<button class="mv-search-clear" id="mv-search-clear">&times;</button></div>',
      '<button class="mv-btn mv-btn--ghost" id="mv-pin-toggle">\uD83D\uDCCC Pinned</button>',
      '<button class="mv-btn mv-btn--ghost" id="mv-export-btn">&#11015; Export</button>',
      '<button class="mv-btn mv-btn--primary" id="mv-add-btn">+ New</button>',
      '</div>',
      '<div class="mv-cat-tabs">'+catTabs+'</div>',
      '<div class="mv-suggestions" id="mv-suggestions"></div>',
      '<div class="mv-archive" id="mv-archive" role="list"></div>',
      '<div class="mv-empty" id="mv-empty" style="display:none"><div class="mv-empty-icon">\uD83D\uDCBE</div>',
      '<p>No memories yet. Generate content in any building to start building your archive.</p></div>',
      '<div class="mv-detail" id="mv-detail"><div class="mv-detail-inner" id="mv-detail-inner"></div></div>',
      '<div class="mv-new-form" id="mv-new-form"><div class="mv-new-inner">',
      '<h3 class="mv-new-title">+ New Memory</h3>',
      '<label class="mv-label">Category<select class="mv-select" id="mv-new-cat">'+newCatOpts+'</select></label>',
      '<label class="mv-label">Title<input class="mv-input" id="mv-new-ttl" type="text" placeholder="Name this memory..." /></label>',
      '<label class="mv-label">Content<textarea class="mv-textarea" id="mv-new-con" rows="5" placeholder="Paste or type your content..."></textarea></label>',
      '<label class="mv-label">Tags<input class="mv-input" id="mv-new-tags" type="text" placeholder="tag1, tag2" /></label>',
      '<div class="mv-new-acts">',
      '<button class="mv-btn mv-btn--primary" id="mv-new-save">\uD83D\uDCBE Save to Vault</button>',
      '<button class="mv-btn mv-btn--ghost" id="mv-new-cancel">Cancel</button>',
      '</div></div></div>',
      '</div>'
    ].join('\n');
  }

  function _bind() {
    var se=document.getElementById('mv-search');
    if(se) se.addEventListener('input',function(e){ _st.query=e.target.value; _renderArchive(); _renderSuggestions(); });
    var sc=document.getElementById('mv-search-clear');
    if(sc) sc.addEventListener('click',function(){ _st.query=''; if(se) se.value=''; _renderArchive(); _renderSuggestions(); });
    var pt=document.getElementById('mv-pin-toggle');
    if(pt) pt.addEventListener('click',function(){ _st.pinned=!_st.pinned; pt.classList.toggle('is-active',_st.pinned); _renderArchive(); });
    document.querySelectorAll('.mv-cat-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        _st.category=btn.dataset.cat;
        document.querySelectorAll('.mv-cat-btn').forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active'); _renderArchive();
      });
    });
    var eb=document.getElementById('mv-export-btn');
    if(eb) eb.addEventListener('click',function(){
      var blob=new Blob([CityMemory.exportAll()],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='jarvis-memory.json'; a.click(); URL.revokeObjectURL(url);
    });
    var ab=document.getElementById('mv-add-btn'), nf=document.getElementById('mv-new-form');
    if(ab) ab.addEventListener('click',function(){ if(nf) nf.classList.add('is-open'); });
    var cb=document.getElementById('mv-new-cancel');
    if(cb) cb.addEventListener('click',function(){ if(nf) nf.classList.remove('is-open'); });
    var sb=document.getElementById('mv-new-save');
    if(sb) sb.addEventListener('click',function(){
      var cat=(document.getElementById('mv-new-cat')||{}).value||'prompt';
      var ttl=((document.getElementById('mv-new-ttl')||{}).value||'').trim();
      var con=((document.getElementById('mv-new-con')||{}).value||'').trim();
      var tgs=((document.getElementById('mv-new-tags')||{}).value||'');
      if(!con){alert('Please enter some content.');return;}
      CityMemory.add({category:cat,title:ttl,content:con,tags:tgs.split(',').map(function(t){ return t.trim(); }).filter(Boolean),building:'memory-vault'});
      if(nf) nf.classList.remove('is-open');
      document.getElementById('mv-new-ttl').value='';
      document.getElementById('mv-new-con').value='';
      document.getElementById('mv-new-tags').value='';
      _renderArchive(); _renderStats(); _renderSuggestions();
    });
  }

  function mount(container) {
    if(!container) return;
    _st={category:'all',query:'',pinned:false};
    container.innerHTML=_buildHTML();
    _bind(); _renderArchive(); _renderSuggestions();
    CityMemory.subscribe(function(){
      if(document.getElementById('mv-workspace')){ _renderArchive(); _renderStats(); _renderSuggestions(); }
    });
  }

  return {mount:mount};
})();
window.MemoryVault=MemoryVault;
