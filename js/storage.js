/**
 * storage.js — Persistencia: localStorage (principal) + IndexedDB (copia de respaldo).
 * Ranuras: "auto", "1", "2", "3".
 */
const PREFIX = 'yukine_save_';
const DB_NAME = 'yukine_db';
const STORE = 'saves';
export const SLOTS = ['auto', '1', '2', '3'];

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('Sin IndexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSlot(slot, data) {
  const payload = { ...data, savedAt: Date.now() };
  try { localStorage.setItem(PREFIX + slot, JSON.stringify(payload)); }
  catch (e) { console.warn('localStorage falló', e); }
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(payload, slot);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch (e) { /* IndexedDB es opcional */ }
  return payload;
}

export async function loadSlot(slot) {
  const raw = localStorage.getItem(PREFIX + slot);
  if (raw) { try { return JSON.parse(raw); } catch (e) { /* cae a IndexedDB */ } }
  try {
    const db = await openDB();
    return await new Promise((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).get(slot);
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => rej(r.error);
    });
  } catch (e) { return null; }
}

export async function deleteSlot(slot) {
  localStorage.removeItem(PREFIX + slot);
  try {
    const db = await openDB();
    db.transaction(STORE, 'readwrite').objectStore(STORE).delete(slot);
  } catch (e) { /* ignorar */ }
}

export async function listSlots() {
  const out = [];
  for (const slot of SLOTS) out.push({ slot, data: await loadSlot(slot) });
  return out;
}
