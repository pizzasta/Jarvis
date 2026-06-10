/**
 * JARVIS AI City — main.js
 * ─────────────────────────────────────────────────────────────
 * Central entry point. Bootstraps all subsystems:
 *   - CityState    : central state management
 *   - AgentRegistry: building/agent definitions
 *   - Router       : navigation system
 *   - CityRenderer : DOM building renderer
 *   - ParticleField: canvas particle system
 *   - HUD          : heads-up display controller
 *   - OrbController: master orb interactions
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. CITY STATE — central reactive state store
═══════════════════════════════════════════════════════════ */
const CityState = (() => {
  let _state = {
    powered: false,
    activeBuilding: null,
    route: 'home',
    agents: [],
    history: [],
  };

  const _listeners = new Set();

  function get() { return Object.freeze({ ..._state }); }

  function set(partial) {
    const prev = { ..._state };
    _state = { ..._state, ...partial };
    _listeners.forEach(fn => fn(_state, prev));
  }

  function subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);  // returns unsub
  }

  function pushHistory(entry) {
    _state.history = [..._state.history.slice(-49), { ...entry, ts: Date.now() }];
  }

  return { get, set, subscribe, pushHistory };
})();


/* ═══════════════════════════════════════════════════════════
   2. AGENT REGISTRY — all building/agent definitions
═══════════════════════════════════════════════════════════ */
const AgentRegistry = (() => {
  /**
   * Building schema:
   *   id          {string}   Unique identifier
   *   icon        {string}   Emoji / SVG string
   *   title       {string}   Display name
   *   description {string}   Short tagline
   *   theme       {object}   primaryColor, secondaryColor (CSS values)
   *   actions     {string[]} Available agent commands
   *   memory      {object}   Persistent key/value store
   */
  const _buildings = [
    {
      id: 'jarvis-core',
      icon: '🧠',
      title: 'JARVIS CORE',
      description: 'Master intelligence hub',
      theme: { primaryColor: '#ff2d78', secondaryColor: '#ff6bac' },
      actions: ['think', 'analyze', 'respond', 'learn'],
      memory: {},
    },
    {
      id: 'vision-lab',
      icon: '👁',
      title: 'VISION LAB',
      description: 'Visual perception engine',
      theme: { primaryColor: '#00e5ff', secondaryColor: '#40ffff' },
      actions: ['detect', 'classify', 'scan', 'render'],
      memory: {},
    },
    {
      id: 'data-vault',
      icon: '🗄',
      title: 'DATA VAULT',
      description: 'Memory & knowledge store',
      theme: { primaryColor: '#9d4edd', secondaryColor: '#c77dff' },
      actions: ['store', 'recall', 'index', 'forget'],
      memory: {},
    },
    {
      id: 'neural-forge',
      icon: '⚡',
      title: 'NEURAL FORGE',
      description: 'Training & optimization',
      theme: { primaryColor: '#ffd700', secondaryColor: '#fff176' },
      actions: ['train', 'tune', 'compile', 'benchmark'],
      memory: {},
    },
    {
      id: 'comms-tower',
      icon: '📡',
      title: 'COMMS TOWER',
      description: 'Multi-modal IO layer',
      theme: { primaryColor: '#00ff9f', secondaryColor: '#69ffce' },
      actions: ['send', 'receive', 'broadcast', 'relay'],
      memory: {},
    },
    {
      id: 'sentinel',
      icon: '🛡',
      title: 'SENTINEL',
      description: 'Safety & ethics guard',
      theme: { primaryColor: '#ff6b35', secondaryColor: '#ffa987' },
      actions: ['guard', 'audit', 'flag', 'allow'],
      memory: {},
    },
  ];

  function getAll() { return _buildings; }
  function getById(id) { return _buildings.find(b => b.id === id) ?? null; }

  /**
   * Register a new building at runtime.
   * Called to add agents later without touching this file.
   */
  function register(building) {
    if (!building.id) throw new Error('Building requires unique id');
    if (_buildings.find(b => b.id === building.id)) {
      console.warn(`[AgentRegistry] Building "${building.id}" already registered`);
      return;
    }
    _buildings.push({ memory: {}, actions: [], ...building });
  }

  return { getAll, getById, register };
})();


/* ═══════════════════════════════════════════════════════════
   3. ROUTER — minimal client-side navigation
═══════════════════════════════════════════════════════════ */
const Router = (() => {
  const _routes = new Map();

  function define(name, handler) { _routes.set(name, handler); }

  function navigate(name, params = {}) {
    const handler = _routes.get(name);
    if (!handler) { console.warn('[Router] Unknown route:', name); return; }
    CityState.set({ route: name });
    CityState.pushHistory({ type: 'navigate', route: name, params });
    handler(params);
    // Sync nav buttons
    document.querySelectorAll('.hud-nav__btn').forEach(btn => {
      btn.setAttribute('aria-current', btn.dataset.route === name ? 'page' : 'false');
    });
  }

  function init() {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.route));
    });
  }

  return { define, navigate, init };
})();


/* ═══════════════════════════════════════════════════════════
   4. CITY RENDERER — builds DOM for buildings
═══════════════════════════════════════════════════════════ */
const CityRenderer = (() => {
  let _container = null;
  let _staggerTimer = null;

  function init(containerId) {
    _container = document.getElementById(containerId);
    if (!_container) console.error('[CityRenderer] Container not found:', containerId);
  }

  function _buildCard(building, index) {
    const card = document.createElement('div');
    card.className = 'building-card';
    card.dataset.buildingId = building.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${building.title}`);
    card.style.setProperty('--building-color', building.theme.primaryColor);
    card.style.animationDelay = `${index * 80}ms`;

    card.innerHTML = `
      <div class="building-card__glow"></div>
      <div class="building-card__icon" aria-hidden="true">${building.icon}</div>
      <div class="building-card__title">${building.title}</div>
      <div class="building-card__desc">${building.description}</div>
      <div class="building-card__line" aria-hidden="true"></div>
    `;

    // Interaction
    const activate = () => {
      CityState.set({ activeBuilding: building.id });
      CityState.pushHistory({ type: 'building-select', buildingId: building.id });
      Router.navigate('agents', { buildingId: building.id });
    };

    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return card;
  }

  function render() {
    if (!_container) return;
    _container.innerHTML = '';
    clearTimeout(_staggerTimer);

    const buildings = AgentRegistry.getAll();
    const fragment = document.createDocumentFragment();
    buildings.forEach((b, i) => fragment.appendChild(_buildCard(b, i)));
    _container.appendChild(fragment);

    // Update building count HUD
    const countEl = document.getElementById('building-count');
    if (countEl) countEl.textContent = String(buildings.length).padStart(2, '0');

    // Stagger visibility
    const cards = _container.querySelectorAll('.building-card');
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('is-visible'), 100 + i * 80);
    });
  }

  return { init, render };
})();


/* ═══════════════════════════════════════════════════════════
   5. PARTICLE FIELD — canvas-based ambient particles
═══════════════════════════════════════════════════════════ */
const ParticleField = (() => {
  let _canvas, _ctx, _raf;
  let _particles = [];
  let _powered = false;

  const BASE_COUNT  = 55;
  const POWER_COUNT = 120;

  function _mkParticle(canvas, powered) {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.15),
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      hue: powered
        ? (Math.random() < 0.6 ? '335' : '290')  // pink or violet
        : '335',
      life: 1,
      decay: Math.random() * 0.003 + 0.001,
    };
  }

  function _resize() {
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
  }

  function _draw() {
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    const target = _powered ? POWER_COUNT : BASE_COUNT;

    // Spawn if needed
    while (_particles.length < target) {
      _particles.push(_mkParticle(_canvas, _powered));
    }

    for (let i = _particles.length - 1; i >= 0; i--) {
      const p = _particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0 || p.y < -10) {
        _particles.splice(i, 1);
        continue;
      }

      const alpha = p.opacity * p.life;
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      _ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
      _ctx.fill();
    }

    _raf = requestAnimationFrame(_draw);
  }

  function init(canvasId) {
    _canvas = document.getElementById(canvasId);
    if (!_canvas) return;
    _ctx = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize, { passive: true });
    _draw();
  }

  function setPowered(on) { _powered = on; }

  return { init, setPowered };
})();


/* ═══════════════════════════════════════════════════════════
   6. HUD CONTROLLER — clock, status label, waveform
═══════════════════════════════════════════════════════════ */
const HUD = (() => {
  let _clockInterval;

  const STATES = {
    idle:   { label: 'STANDBY',  dot: 'pink' },
    active: { label: 'ONLINE',   dot: 'cyan' },
    busy:   { label: 'THINKING', dot: 'pulse' },
  };

  function _updateClock() {
    const el = document.getElementById('sys-time');
    if (!el) return;
    const now = new Date();
    el.textContent = [
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ].map(n => String(n).padStart(2, '0')).join(':');
  }

  function setStatus(key) {
    const s = STATES[key] ?? STATES.idle;
    const label = document.getElementById('status-label');
    if (label) label.textContent = s.label;
  }

  function init() {
    _updateClock();
    _clockInterval = setInterval(_updateClock, 1000);

    CityState.subscribe((state, prev) => {
      if (state.powered !== prev.powered) {
        setStatus(state.powered ? 'active' : 'idle');
      }
    });
  }

  return { init, setStatus };
})();


/* ═══════════════════════════════════════════════════════════
   7. ORB CONTROLLER — master orb button behavior
═══════════════════════════════════════════════════════════ */
const OrbController = (() => {
  function _fireShockwave() {
    const overlay = document.getElementById('activation-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-firing');
    void overlay.offsetWidth;  // reflow to restart animation
    overlay.classList.add('is-firing');
    setTimeout(() => overlay.classList.remove('is-firing'), 1400);
  }

  function _togglePower() {
    const state = CityState.get();
    const on = !state.powered;

    CityState.set({ powered: on });
    CityState.pushHistory({ type: 'power', powered: on });

    const body = document.body;
    body.dataset.cityState = on ? 'active' : 'idle';

    const orb = document.getElementById('master-orb');
    if (orb) orb.setAttribute('aria-pressed', String(on));

    ParticleField.setPowered(on);

    if (on) _fireShockwave();
  }

  function init() {
    const orb = document.getElementById('master-orb');
    if (!orb) return;

    orb.addEventListener('click', _togglePower);
    orb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); _togglePower(); }
    });
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
   8. ROUTE DEFINITIONS
═══════════════════════════════════════════════════════════ */
Router.define('home', () => {
  // Home route — just the city view (default)
  console.log('[Router] → home');
});

Router.define('city', () => {
  console.log('[Router] → city');
});

Router.define('agents', ({ buildingId } = {}) => {
  const building = buildingId ? AgentRegistry.getById(buildingId) : null;
  console.log('[Router] → agents', building?.title ?? 'all');
  // Future: navigate to building detail page
});


/* ═══════════════════════════════════════════════════════════
   9. BOOTSTRAP
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Push initial agents into state
  CityState.set({ agents: AgentRegistry.getAll().map(b => b.id) });

  // Init all subsystems
  ParticleField.init('particle-canvas');
  HUD.init();
  OrbController.init();
  CityRenderer.init('city-grid');
  CityRenderer.render();
  Router.init();

  // Set initial body state
  document.body.dataset.cityState = 'idle';

  console.log(
    '%c JARVIS AI City %c online ',
    'background:#ff2d78;color:#fff;padding:4px 8px;font-weight:bold;border-radius:4px 0 0 4px;',
    'background:#0a0414;color:#ff6bac;padding:4px 8px;border-radius:0 4px 4px 0;border:1px solid #ff2d7844'
  );
});
