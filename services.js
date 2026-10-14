/* KAZEHANA · servicios: base de datos local (IndexedDB con respaldo en localStorage) y sonido sintetizado */
(function (G) {
  'use strict';

  /* ================= Guardado ================= */
  const DB_NAME = 'kazehana-db', STORE = 'saves';
  const mem = {};
  let dbp = null;

  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(null);
        const rq = indexedDB.open(DB_NAME, 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => resolve(null);
        rq.onblocked = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  function lsGet(k) { try { return localStorage.getItem('kazehana:' + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem('kazehana:' + k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem('kazehana:' + k); } catch (e) {} }

  const Storage = (G.Storage = {
    async save(slot, data) {
      const json = JSON.stringify(data);
      const db = await openDB();
      if (db) {
        try {
          await new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(json, slot); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
          return 'idb';
        } catch (e) { /* cae al respaldo */ }
      }
      if (lsSet(slot, json)) return 'ls';
      mem[slot] = json; return 'mem';
    },
    async load(slot) {
      const db = await openDB();
      let json = null;
      if (db) {
        try { json = await new Promise((res, rej) => { const rq = db.transaction(STORE).objectStore(STORE).get(slot); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error); }); } catch (e) {}
      }
      if (!json) json = lsGet(slot);
      if (!json) json = mem[slot] || null;
      try { return json ? JSON.parse(json) : null; } catch (e) { return null; }
    },
    async remove(slot) {
      const db = await openDB();
      if (db) { try { await new Promise((res) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(slot); tx.oncomplete = res; tx.onerror = res; }); } catch (e) {} }
      lsDel(slot); delete mem[slot];
    },
    async summary(slot) {
      const s = await this.load(slot);
      if (!s || !s.player) return null;
      return { slot, name: s.player.name, level: s.player.level, day: s.time.day, ts: s.savedAt || 0, origin: s.player.origin, gold: s.player.gold };
    },
    SLOTS: ['auto', 'slot1', 'slot2', 'slot3'],
    exportFile(state) {
      const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kazehana-' + (state.player.name || 'partida').replace(/\W+/g, '_') + '-dia' + state.time.day + '.json';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },
  });

  /* ================= Ajustes ================= */
  G.Settings = {
    data: { sound: true, vol: 0.5 },
    load() { try { Object.assign(this.data, JSON.parse(lsGet('settings') || '{}')); } catch (e) {} },
    save() { lsSet('settings', JSON.stringify(this.data)); },
  };

  /* ================= Sonido (WebAudio, sin archivos) ================= */
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when, slide) {
    const c = ac(); if (!c || !G.Settings.data.sound) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    const v = (vol || 0.2) * G.Settings.data.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  G.Sfx = {
    play(name) {
      switch (name) {
        case 'click': tone(660, 0.05, 'triangle', 0.15); break;
        case 'step': tone(180, 0.04, 'sine', 0.06); break;
        case 'hit': tone(220, 0.12, 'sawtooth', 0.25, 0, 70); break;
        case 'crit': tone(300, 0.18, 'sawtooth', 0.3, 0, 60); tone(900, 0.1, 'square', 0.15, 0.02); break;
        case 'hurt': tone(140, 0.2, 'square', 0.2, 0, 50); break;
        case 'magic': tone(500, 0.3, 'sine', 0.2, 0, 1200); tone(750, 0.25, 'triangle', 0.1, 0.05, 1500); break;
        case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sine', 0.18, i * 0.08)); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.1)); break;
        case 'lose': [330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.15, i * 0.18)); break;
        case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'square', 0.14, i * 0.09)); break;
        case 'love': tone(784, 0.2, 'sine', 0.18); tone(988, 0.3, 'sine', 0.18, 0.12); break;
        case 'bad': tone(200, 0.2, 'triangle', 0.18, 0, 120); break;
        case 'coin': tone(1200, 0.08, 'square', 0.1); tone(1600, 0.12, 'square', 0.1, 0.07); break;
        case 'page': tone(420, 0.06, 'triangle', 0.1); break;
        default: break;
      }
    },
    toggle() { G.Settings.data.sound = !G.Settings.data.sound; G.Settings.save(); return G.Settings.data.sound; },
  };
})((window.G = window.G || {}));
