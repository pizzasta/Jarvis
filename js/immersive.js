'use strict';
/* Immersive layer - JARVIS AI City
   Cinematic boot sequence, WebAudio sound design (generated, no assets),
   audio-reactive orb, haptics, and screen-flash transitions.

   Fully decoupled: it observes the DOM state the rest of the app already sets
   (body[data-city-state], body[data-orb-state], the workspace modal) and reacts.
   No edits to the core modules are required. */

var Sound = (function() {
  var ctx = null, master = null;
  var enabled = (function(){ try { return localStorage.getItem('jarvis-sound') !== 'off'; } catch(e){ return true; } })();

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.09;          // tasteful, low
    master.connect(ctx.destination);
  }
  function tone(freq, dur, type, gain, slideTo) {
    if (!enabled || !ctx) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function blip()   { tone(660, 0.10, 'triangle', 0.4, 880); }
  function hover()  { tone(520, 0.06, 'sine', 0.25); }
  function whoosh() { tone(180, 0.45, 'sawtooth', 0.3, 720); tone(90, 0.45, 'sine', 0.25, 320); }
  function power()  { tone(120, 0.8, 'sawtooth', 0.5, 540); setTimeout(function(){ tone(880, 0.5, 'sine', 0.4, 1320); }, 120); }
  function listen() { tone(440, 0.18, 'sine', 0.4, 760); }
  function speakCue(){ tone(720, 0.12, 'triangle', 0.3, 600); }
  function chime()  { [523,659,784].forEach(function(f,i){ setTimeout(function(){ tone(f,0.3,'sine',0.4); }, i*90); }); }

  function setEnabled(v) {
    enabled = v;
    try { localStorage.setItem('jarvis-sound', v ? 'on' : 'off'); } catch(e){}
    if (v) ensure();
  }
  function isEnabled(){ return enabled; }

  return { ensure:ensure, blip:blip, hover:hover, whoosh:whoosh, power:power,
           listen:listen, speakCue:speakCue, chime:chime, setEnabled:setEnabled, isEnabled:isEnabled };
})();
window.Sound = Sound;

var Immersive = (function() {
  var _waveRAF = null, _bars = null;

  function haptic(pattern) { if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch(e){} } }

  function flash() {
    var el = document.getElementById('fx-flash'); if (!el) return;
    el.classList.remove('is-firing'); void el.offsetWidth; el.classList.add('is-firing');
  }

  // ---- Reactive orb: drive the existing waveform bars with synthesized amplitude ----
  function startWave(intensity) {
    if (!_bars) _bars = document.querySelectorAll('#orb-waveform span');
    if (!_bars || !_bars.length) return;
    stopWave();
    var phase = 0;
    function step() {
      phase += 0.35;
      for (var i = 0; i < _bars.length; i++) {
        var n = Math.sin(phase + i * 0.7) * 0.5 + 0.5;
        var jitter = Math.random() * 0.35;
        var s = 0.3 + (n * 0.7 + jitter) * intensity;
        _bars[i].style.transform = 'scaleY(' + s.toFixed(3) + ')';
      }
      _waveRAF = requestAnimationFrame(step);
    }
    step();
  }
  function stopWave() {
    if (_waveRAF) { cancelAnimationFrame(_waveRAF); _waveRAF = null; }
    if (_bars) _bars.forEach(function(b){ b.style.transform = ''; });
  }

  function onOrbState(state) {
    if (state === 'speaking') { Sound.speakCue(); startWave(1.0); }
    else if (state === 'listening') { Sound.listen(); haptic(15); startWave(1.3); }
    else if (state === 'thinking') { startWave(0.5); }
    else { stopWave(); }
  }

  function powerOn() {
    Sound.ensure(); Sound.power(); haptic([0, 40, 30, 60]);
    flash();
    document.body.classList.add('fx-kick');
    setTimeout(function(){ document.body.classList.remove('fx-kick'); }, 700);
    dismissBoot();
  }

  // ---- DOM observers (decoupled from core modules) ----
  function watchState() {
    var lastCity = document.body.dataset.cityState;
    var lastOrb = document.body.dataset.orbState;
    new MutationObserver(function() {
      var c = document.body.dataset.cityState, o = document.body.dataset.orbState;
      if (c !== lastCity) { lastCity = c; if (c === 'active') powerOn(); }
      if (o !== lastOrb) { lastOrb = o; onOrbState(o); }
    }).observe(document.body, { attributes: true, attributeFilter: ['data-city-state', 'data-orb-state'] });

    var modal = document.getElementById('workspace-modal');
    if (modal) {
      var open = modal.classList.contains('is-open');
      new MutationObserver(function() {
        var now = modal.classList.contains('is-open');
        if (now && !open) { Sound.ensure(); Sound.whoosh(); haptic(30); flash(); }
        open = now;
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // ---- UI sounds via event delegation ----
  function watchClicks() {
    document.addEventListener('pointerdown', function(){ Sound.ensure(); }, { once: false });
    document.addEventListener('click', function(e) {
      var t = e.target;
      if (t.closest('.city-chip')) { Sound.whoosh(); haptic(20); return; }
      if (t.closest('.hud-nav__btn, .convo-send-btn, .building-card, .bb-btn, .atb-btn, .dt-btn, .ss-btn, .bh-btn, .mv-btn, .bb-tab-btn, .atb-tab-btn, .dt-tab-btn')) {
        Sound.blip();
      }
    }, true);
    document.addEventListener('mouseover', function(e) {
      if (e.target.closest && e.target.closest('.building-card, .city-chip')) Sound.hover();
    }, true);
  }

  // ---- Cinematic boot sequence ----
  var BOOT_LINES = [
    '> booting JARVIS core ............ <span class="ok">OK</span>',
    '> mounting neural modules ........ <span class="ok">OK</span>',
    '> calibrating voice synth ........ <span class="ok">OK</span>',
    '> loading cities: creator · mind · vision · launch · empire',
    '> linking agents (15) ............ <span class="ok">OK</span>',
    '> establishing uplink ............ <span class="ok">OK</span>',
    '> good day, Jess. JARVIS is ready.'
  ];
  function runBoot() {
    var boot = document.getElementById('boot'); if (!boot) return;
    var log = boot.querySelector('.boot__log');
    var bar = boot.querySelector('.boot__bar span');
    var hint = boot.querySelector('.boot__hint');
    var i = 0, done = false;
    function dismiss() { if (done) return; done = true; dismissBoot(); }
    var skip = boot.querySelector('.boot__skip');
    if (skip) skip.addEventListener('click', dismiss);
    function next() {
      if (done) return;
      if (i < BOOT_LINES.length) {
        log.innerHTML += (i ? '\n' : '') + BOOT_LINES[i];
        if (bar) bar.style.width = Math.round(((i + 1) / BOOT_LINES.length) * 100) + '%';
        Sound.ensure(); Sound.blip();
        i++;
        setTimeout(next, 360 + Math.random() * 220);
      } else {
        if (hint) hint.classList.add('show');
        Sound.ensure(); Sound.chime();
        setTimeout(dismiss, 1400);
      }
    }
    // start once a gesture has unlocked audio, or immediately (visuals still run)
    setTimeout(next, 500);
    boot.addEventListener('click', function(e){ if (e.target.closest('.boot__skip')) return; if (i >= BOOT_LINES.length) dismiss(); });
  }
  function dismissBoot() {
    var boot = document.getElementById('boot'); if (!boot || boot.classList.contains('is-done')) return;
    boot.classList.add('is-done');
    setTimeout(function(){ if (boot.parentNode) boot.parentNode.removeChild(boot); }, 900);
  }

  // ---- Sound toggle button ----
  function watchToggle() {
    var btn = document.getElementById('fx-toggle'); if (!btn) return;
    function paint() { btn.textContent = Sound.isEnabled() ? '🔊' : '🔇'; btn.setAttribute('aria-label', Sound.isEnabled() ? 'Mute sound' : 'Unmute sound'); }
    paint();
    btn.addEventListener('click', function(){ Sound.setEnabled(!Sound.isEnabled()); paint(); if (Sound.isEnabled()) Sound.blip(); });
  }

  function init() {
    watchState();
    watchClicks();
    watchToggle();
    runBoot();
  }

  return { init:init, flash:flash, powerOn:powerOn, haptic:haptic };
})();
window.Immersive = Immersive;

document.addEventListener('DOMContentLoaded', function(){ Immersive.init(); });
