'use strict';

/* JARVIS AI City - Songwriting Studio v1.0 */

const SongwritingStudio = (() => {
  // ---- State ----
  let _state = {
    genre: 'Pop',
    mood: 'Uplifting',
    drafts: JSON.parse(localStorage.getItem('ss_drafts') || '[]'),
    history: JSON.parse(localStorage.getItem('ss_history') || '[]'),
    voiceNotes: [],
    activeTab: 'lyric',
    recording: false,
    mediaRecorder: null,
    audioChunks: []
  };

  const GENRES = ['Pop','Hip-Hop','R&B','Electronic','Rock','Jazz','Country','Soul','Indie','Lo-fi','Afrobeats','K-Pop'];
  const MOODS  = ['Uplifting','Melancholic','Romantic','Angry','Dreamy','Dark','Playful','Nostalgic','Empowering','Chill','Euphoric','Mysterious'];

  // ---- Templates ----
  const LYRIC_TEMPLATES = [
    'In the city of neon lights\nWhere {mood} meets the night\nI find myself searching for\nSomething worth fighting for',
    'Every sunrise tells a story\nOf hearts that dare to dream\nIn shades of {mood} glory\nNothing is what it seems',
    'Verse 1:\nI woke up to a {mood} sky\nThe world was moving fast\nBut I was standing still\nHolding onto things that last'
  ];

  const HOOK_TEMPLATES = [
    'Oh-oh-oh, I feel it in my bones\nThis {mood} feeling I call home',
    'We were {mood}, we were fire\nBurning higher, never tired',
    'Baby you are everything\n{mood} like a diamond ring'
  ];

  const SUNO_TEMPLATES = [
    '{genre} song, {mood} vibes, female vocalist, lush production, radio-ready hook, 128bpm',
    '{genre} track with {mood} energy, melodic chorus, trap hi-hats, 808 bass, cinematic bridge',
    'Dreamy {genre}, {mood} atmosphere, layered harmonies, reverb-heavy guitars, emotional breakdown'
  ];

  const ALBUM_TEMPLATES = [
    'A journey through {mood} landscapes — 10 tracks exploring love lost and rediscovered in a {genre} soundscape.',
    'The {mood} Chronicles: An album that blends raw {genre} energy with cinematic storytelling across 12 chapters.',
    'Songs from the {mood} Hour — a midnight collection of {genre} confessions, whispered truths and neon dreams.'
  ];

  const MV_TEMPLATES = [
    'MUSIC VIDEO TREATMENT — {genre}, {mood}\n\nConcept: One continuous night, shot in neon-soaked single takes.\n• Open: artist alone in an empty city, rain on glass, slow push-in.\n• Verse: walking through a {mood} crowd that moves in reverse around them.\n• Chorus: rooftop, the skyline lights up on every downbeat.\n• Bridge: everything cuts to black-and-white, then floods back to colour.\n• End: sunrise, the artist finally smiles.\nPalette: pink + cyan haze. Shot on anamorphic, lots of practical lights.',
    'MUSIC VIDEO IDEA — {genre}, {mood}\n\nConcept: A performance video that slowly falls apart and rebuilds.\n• Static studio set, single key light.\n• As the {mood} energy builds, the set physically reacts — walls peel, neon ignites.\n• Choreographed silhouettes appear behind a scrim on the hook.\n• Final chorus: the room is fully alive, lights chasing the beat.\nShot list: 12 setups, mix of locked-off + handheld. Trending TikTok-ready vertical alts for each section.',
    'MUSIC VIDEO STORYBOARD — {genre}, {mood}\n\nNarrative: two people, one phone, a love story told entirely in screen-recordings and reflections.\n• Intro: a missed call.\n• Verse 1: texts floating in {mood} city air.\n• Chorus: they finally meet in a car park lit like a stage.\n• Twist: the whole thing was a memory.\nVibe references: A24 colour grade, lens flares, 35mm grain. Cut fast on the chorus, let the verses breathe.'
  ];

  // ---- Helpers ----
  function _fill(template) {
    return template
      .replace(/\{genre\}/g, _state.genre)
      .replace(/\{mood\}/g, _state.mood.toLowerCase());
  }

  function _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function _saveDrafts() { localStorage.setItem('ss_drafts', JSON.stringify(_state.drafts)); }
  function _saveHistory() { localStorage.setItem('ss_history', JSON.stringify(_state.history.slice(-100))); }

  function _pushHistory(type, content) {
    _state.history.unshift({ type, content, genre: _state.genre, mood: _state.mood, ts: Date.now() });
    _saveHistory();
    _renderHistory();
  }

  // ---- Generators ----
  function generateLyric()  { return _fill(_rand(LYRIC_TEMPLATES)); }
  function generateHook()   { return _fill(_rand(HOOK_TEMPLATES)); }
  function generateSuno()   { return _fill(_rand(SUNO_TEMPLATES)); }
  function generateAlbum()  { return _fill(_rand(ALBUM_TEMPLATES)); }
  function generateMV()     { return _fill(_rand(MV_TEMPLATES)); }

  // ---- Render helpers ----
  function _setOutput(text) {
    const el = document.getElementById('ss-output');
    if (!el) return;
    el.classList.remove('ss-flash');
    void el.offsetWidth; // reflow
    el.textContent = text;
    el.classList.add('ss-flash');
  }

  function _copyOutput() {
    const el = document.getElementById('ss-output');
    if (!el || !el.textContent.trim()) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
      const btn = document.getElementById('ss-copy-btn');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 1500); }
    });
  }

  function _saveDraft() {
    const el = document.getElementById('ss-output');
    if (!el || !el.textContent.trim()) return;
    const draft = { id: Date.now(), content: el.textContent, genre: _state.genre, mood: _state.mood, ts: Date.now() };
    _state.drafts.unshift(draft);
    if (_state.drafts.length > 50) _state.drafts.pop();
    _saveDrafts();
    _renderDrafts();
    const btn = document.getElementById('ss-save-btn');
    if (btn) { btn.textContent = 'Saved!'; setTimeout(() => { btn.textContent = 'Save Draft'; }, 1500); }
  }

  function _deleteDraft(id) {
    _state.drafts = _state.drafts.filter(d => d.id !== id);
    _saveDrafts();
    _renderDrafts();
  }

  function _loadDraft(id) {
    const d = _state.drafts.find(x => x.id === id);
    if (!d) return;
    _setOutput(d.content);
    document.getElementById('ss-genre').value = d.genre;
    document.getElementById('ss-mood').value = d.mood;
    _state.genre = d.genre;
    _state.mood = d.mood;
  }

  function _renderDrafts() {
    const list = document.getElementById('ss-drafts-list');
    if (!list) return;
    if (_state.drafts.length === 0) {
      list.innerHTML = '<p class="ss-empty">No saved drafts yet.</p>';
      return;
    }
    list.innerHTML = _state.drafts.map(d => {
      const date = new Date(d.ts).toLocaleDateString();
      const preview = d.content.slice(0, 60) + (d.content.length > 60 ? '...' : '');
      return '<div class="ss-draft-item" data-id="' + d.id + '">' +
        '<div class="ss-draft-meta"><span class="ss-draft-genre">' + d.genre + '</span><span class="ss-draft-mood">' + d.mood + '</span><span class="ss-draft-date">' + date + '</span></div>' +
        '<div class="ss-draft-preview">' + preview + '</div>' +
        '<div class="ss-draft-actions">' +
        '<button class="ss-btn ss-btn--ghost ss-draft-load" data-id="' + d.id + '">Load</button>' +
        '<button class="ss-btn ss-btn--ghost ss-draft-del" data-id="' + d.id + '">Delete</button>' +
        '</div></div>';
    }).join('');
    list.querySelectorAll('.ss-draft-load').forEach(b => b.addEventListener('click', () => _loadDraft(Number(b.dataset.id))));
    list.querySelectorAll('.ss-draft-del').forEach(b => b.addEventListener('click', () => _deleteDraft(Number(b.dataset.id))));
  }

  function _renderHistory() {
    const list = document.getElementById('ss-history-list');
    if (!list) return;
    if (_state.history.length === 0) {
      list.innerHTML = '<p class="ss-empty">No prompt history yet.</p>';
      return;
    }
    list.innerHTML = _state.history.slice(0, 30).map(h => {
      const date = new Date(h.ts).toLocaleTimeString();
      return '<div class="ss-history-item">' +
        '<div class="ss-history-meta"><span class="ss-tag">' + h.type + '</span><span class="ss-tag ss-tag--mood">' + h.mood + '</span><span class="ss-history-time">' + date + '</span></div>' +
        '<div class="ss-history-content">' + h.content.slice(0, 80) + '</div>' +
        '<button class="ss-btn ss-btn--ghost ss-hist-reuse" data-content="' + encodeURIComponent(h.content) + '">Reuse</button>' +
        '</div>';
    }).join('');
    list.querySelectorAll('.ss-hist-reuse').forEach(b => {
      b.addEventListener('click', () => { _setOutput(decodeURIComponent(b.dataset.content)); });
    });
  }

  // ---- Voice Notes ----
  async function _startVoiceNote() {
    if (!navigator.mediaDevices) {
      alert('Voice recording not supported in this browser.'); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _state.audioChunks = [];
      _state.mediaRecorder = new MediaRecorder(stream);
      _state.mediaRecorder.ondataavailable = e => _state.audioChunks.push(e.data);
      _state.mediaRecorder.onstop = () => {
        const blob = new Blob(_state.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const note = { id: Date.now(), url, ts: Date.now() };
        _state.voiceNotes.unshift(note);
        _renderVoiceNotes();
        stream.getTracks().forEach(t => t.stop());
      };
      _state.mediaRecorder.start();
      _state.recording = true;
      const btn = document.getElementById('ss-voice-btn');
      if (btn) { btn.textContent = 'Stop Recording'; btn.classList.add('ss-btn--recording'); }
    } catch(e) { alert('Microphone access denied.'); }
  }

  function _stopVoiceNote() {
    if (_state.mediaRecorder && _state.recording) {
      _state.mediaRecorder.stop();
      _state.recording = false;
      const btn = document.getElementById('ss-voice-btn');
      if (btn) { btn.textContent = 'Voice Note'; btn.classList.remove('ss-btn--recording'); }
    }
  }

  function _renderVoiceNotes() {
    const list = document.getElementById('ss-voice-list');
    if (!list) return;
    if (_state.voiceNotes.length === 0) {
      list.innerHTML = '<p class="ss-empty">No voice notes yet.</p>'; return;
    }
    list.innerHTML = _state.voiceNotes.map((n, i) => {
      const date = new Date(n.ts).toLocaleTimeString();
      return '<div class="ss-voice-item">' +
        '<span class="ss-voice-label">Note ' + (i+1) + ' &mdash; ' + date + '</span>' +
        '<audio controls src="' + n.url + '" class="ss-audio"></audio>' +
        '<button class="ss-btn ss-btn--ghost" onclick="SongwritingStudio._delVoice(' + n.id + ')">Delete</button>' +
        '</div>';
    }).join('');
  }

  function _delVoice(id) {
    _state.voiceNotes = _state.voiceNotes.filter(n => n.id !== id);
    _renderVoiceNotes();
  }

  // ---- Send to Building ----
  function _sendToBuilding(content) {
    const modal = document.getElementById('ss-send-modal');
    if (modal) {
      document.getElementById('ss-send-content').value = content;
      modal.classList.add('is-open');
    }
  }

  function _confirmSend() {
    const dest = document.getElementById('ss-send-dest').value;
    const content = document.getElementById('ss-send-content').value;
    const modal = document.getElementById('ss-send-modal');
    if (modal) modal.classList.remove('is-open');
    if (typeof BuildingWorkspace !== 'undefined') {
      BuildingWorkspace.open(dest, { prefill: content });
    }
    if (typeof CityState !== 'undefined') {
      CityState.pushHistory({ type: 'send-to-building', from: 'songwriting', to: dest, content });
    }
  }

  // ---- Tab switching ----
  function _switchTab(tab) {
    _state.activeTab = tab;
    document.querySelectorAll('.ss-tab-btn').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tab));
    document.querySelectorAll('.ss-tab-pane').forEach(p => p.classList.toggle('is-active', p.dataset.tab === tab));
  }

  // ---- HTML Template ----
  function buildHTML() {
    const genreOpts = GENRES.map(g => '<option value="' + g + '"' + (g === _state.genre ? ' selected' : '') + '>' + g + '</option>').join('');
    const moodOpts  = MOODS.map(m => '<option value="' + m + '"' + (m === _state.mood ? ' selected' : '') + '>' + m + '</option>').join('');
    const buildingOpts = [
      ['edit-library','Editing Library'],['research-district','Research District'],
      ['project-lab','Project Lab'],['design-tower','Design Tower'],
      ['ops-center','Operations Center'],['memory-vault','Memory Vault']
    ].map(b => '<option value="' + b[0] + '">' + b[1] + '</option>').join('');

    return [
      '<div class="ss-workspace" id="ss-workspace">',

      '<!-- EQ Bars -->',
      '<div class="ss-eq" aria-hidden="true">',
      Array.from({length:16}, (_,i) => '<span class="ss-eq__bar" style="--i:' + i + '"></span>').join(''),
      '</div>',

      '<!-- Floating lyrics decoration -->',
      '<div class="ss-lyrics-float" aria-hidden="true">',
      '<span>verse</span><span>chorus</span><span>bridge</span><span>hook</span><span>melody</span>',
      '</div>',

      '<!-- Header -->',
      '<div class="ss-header">',
      '<div class="ss-header__icon">🎵</div>',
      '<div class="ss-header__text">',
      '<h2 class="ss-title">SUNO HELPER</h2>',
      '<p class="ss-subtitle">Lyrics, hooks, Suno prompts & music video ideas</p>',
      '</div>',
      '</div>',

      '<!-- Selectors -->',
      '<div class="ss-selectors">',
      '<div class="ss-selector-group">',
      '<label class="ss-label" for="ss-genre">Genre</label>',
      '<select class="ss-select" id="ss-genre">' + genreOpts + '</select>',
      '</div>',
      '<div class="ss-selector-group">',
      '<label class="ss-label" for="ss-mood">Mood</label>',
      '<select class="ss-select" id="ss-mood">' + moodOpts + '</select>',
      '</div>',
      '</div>',

      '<!-- Tabs -->',
      '<div class="ss-tabs" role="tablist">',
      '<button class="ss-tab-btn is-active" data-tab="lyric" role="tab">Lyrics</button>',
      '<button class="ss-tab-btn" data-tab="hook" role="tab">Hook</button>',
      '<button class="ss-tab-btn" data-tab="suno" role="tab">Suno</button>',
      '<button class="ss-tab-btn" data-tab="mv" role="tab">MV Ideas</button>',
      '<button class="ss-tab-btn" data-tab="album" role="tab">Album</button>',
      '<button class="ss-tab-btn" data-tab="drafts" role="tab">Drafts</button>',
      '<button class="ss-tab-btn" data-tab="voice" role="tab">Voice</button>',
      '<button class="ss-tab-btn" data-tab="history" role="tab">History</button>',
      '</div>',

      '<!-- Tab: Lyric Generator -->',
      '<div class="ss-tab-pane is-active" data-tab="lyric" role="tabpanel">',
      '<p class="ss-hint">Generate a full verse or lyric idea based on your genre & mood.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-lyric-btn">🎶 Generate Lyrics</button>',
      '</div>',

      '<!-- Tab: Hook Generator -->',
      '<div class="ss-tab-pane" data-tab="hook" role="tabpanel">',
      '<p class="ss-hint">Generate a catchy chorus hook to anchor your song.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-hook-btn">🎤 Generate Hook</button>',
      '</div>',

      '<!-- Tab: Suno Prompt Builder -->',
      '<div class="ss-tab-pane" data-tab="suno" role="tabpanel">',
      '<p class="ss-hint">Build an AI-ready Suno prompt for your track.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-suno-btn">⚙️ Build Suno Prompt</button>',
      '</div>',

      '<!-- Tab: Music Video Ideas -->',
      '<div class="ss-tab-pane" data-tab="mv" role="tabpanel">',
      '<p class="ss-hint">Generate a full music video treatment, storyboard or concept for your track.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-mv-btn">🎬 Generate Music Video Idea</button>',
      '</div>',

      '<!-- Tab: Album Concept -->',
      '<div class="ss-tab-pane" data-tab="album" role="tabpanel">',
      '<p class="ss-hint">Generate a full album concept and narrative arc.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-album-btn">💿 Generate Album Concept</button>',
      '</div>',

      '<!-- Tab: Drafts -->',
      '<div class="ss-tab-pane" data-tab="drafts" role="tabpanel">',
      '<div id="ss-drafts-list" class="ss-list"></div>',
      '</div>',

      '<!-- Tab: Voice Notes -->',
      '<div class="ss-tab-pane" data-tab="voice" role="tabpanel">',
      '<p class="ss-hint">Record voice notes to capture melodies and ideas on the fly.</p>',
      '<button class="ss-btn ss-btn--primary" id="ss-voice-btn">🎤 Voice Note</button>',
      '<div id="ss-voice-list" class="ss-list"></div>',
      '</div>',

      '<!-- Tab: Prompt History -->',
      '<div class="ss-tab-pane" data-tab="history" role="tabpanel">',
      '<div id="ss-history-list" class="ss-list"></div>',
      '</div>',

      '<!-- Output Area -->',
      '<div class="ss-output-area">',
      '<div class="ss-output-label">Output</div>',
      '<div class="ss-output" id="ss-output" aria-live="polite">Your generated content will appear here...</div>',
      '<div class="ss-output-actions">',
      '<button class="ss-btn ss-btn--ghost" id="ss-copy-btn">Copy</button>',
      '<button class="ss-btn ss-btn--ghost" id="ss-save-btn">Save Draft</button>',
      '<button class="ss-btn ss-btn--ghost" id="ss-send-btn">➡️ Send to Building</button>',
      '</div>',
      '</div>',

      '<!-- Send to Building Modal -->',
      '<div class="ss-send-modal" id="ss-send-modal" role="dialog" aria-modal="true" aria-label="Send to another building">',
      '<div class="ss-send-modal__inner">',
      '<h3 class="ss-send-modal__title">➡️ Send to Building</h3>',
      '<label class="ss-label" for="ss-send-dest">Destination Building</label>',
      '<select class="ss-select" id="ss-send-dest">' + buildingOpts + '</select>',
      '<textarea class="ss-textarea" id="ss-send-content" rows="4" placeholder="Content to send..."></textarea>',
      '<div class="ss-send-modal__actions">',
      '<button class="ss-btn ss-btn--primary" id="ss-send-confirm">Send</button>',
      '<button class="ss-btn ss-btn--ghost" id="ss-send-cancel">Cancel</button>',
      '</div>',
      '</div>',
      '</div>',

      '</div>'
    ].join('\n');
  }

  // ---- Mount ----
  function mount(container) {
    if (!container) return;
    container.innerHTML = buildHTML();
    _bindEvents();
    _renderDrafts();
    _renderHistory();
    _renderVoiceNotes();
  }

  function _bindEvents() {
    // Genre / mood
    const genreEl = document.getElementById('ss-genre');
    const moodEl  = document.getElementById('ss-mood');
    if (genreEl) genreEl.addEventListener('change', e => { _state.genre = e.target.value; });
    if (moodEl)  moodEl.addEventListener('change',  e => { _state.mood  = e.target.value; });

    // Generator buttons
    const _gen = (btnId, fn, type) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.addEventListener('click', () => {
        const result = fn();
        _setOutput(result);
        _pushHistory(type, result);
      });
    };
    _gen('ss-lyric-btn', generateLyric, 'Lyrics');
    _gen('ss-hook-btn',  generateHook,  'Hook');
    _gen('ss-suno-btn',  generateSuno,  'Suno');
    _gen('ss-mv-btn',    generateMV,    'Music Video');
    _gen('ss-album-btn', generateAlbum, 'Album');

    // Output actions
    const copyBtn = document.getElementById('ss-copy-btn');
    const saveBtn = document.getElementById('ss-save-btn');
    const sendBtn = document.getElementById('ss-send-btn');
    if (copyBtn) copyBtn.addEventListener('click', _copyOutput);
    if (saveBtn) saveBtn.addEventListener('click', _saveDraft);
    if (sendBtn) sendBtn.addEventListener('click', () => {
      const el = document.getElementById('ss-output');
      if (el) _sendToBuilding(el.textContent);
    });

    // Send modal
    const confirmBtn = document.getElementById('ss-send-confirm');
    const cancelBtn  = document.getElementById('ss-send-cancel');
    if (confirmBtn) confirmBtn.addEventListener('click', _confirmSend);
    if (cancelBtn)  cancelBtn.addEventListener('click', () => {
      document.getElementById('ss-send-modal').classList.remove('is-open');
    });

    // Tabs
    document.querySelectorAll('.ss-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
    });

    // Voice note
    const voiceBtn = document.getElementById('ss-voice-btn');
    if (voiceBtn) voiceBtn.addEventListener('click', () => {
      if (_state.recording) _stopVoiceNote(); else _startVoiceNote();
    });
  }

  return {
    mount,
    generateLyric,
    generateHook,
    generateSuno,
    generateAlbum,
    generateMV,
    _delVoice
  };
})();

// Expose globally
window.SongwritingStudio = SongwritingStudio;
