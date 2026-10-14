/* KAZEHANA · arranque */
(function (G) {
  'use strict';
  function boot() {
    G.UI.init();
    const f = document.getElementById('file-import');
    if (f) f.addEventListener('change', (e) => { if (e.target.files[0]) G.UI.importFile(e.target.files[0]); e.target.value = ''; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.G);
