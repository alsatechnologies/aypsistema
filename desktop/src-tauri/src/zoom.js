// Zoom con Ctrl + / Ctrl - / Ctrl 0 y Ctrl + rueda del mouse (Windows).
// Se inyecta en cada carga de página; el nivel se guarda para mantenerlo
// al navegar y al volver a abrir la app.
(function () {
  if (window.__aypZoom) return;
  window.__aypZoom = true;

  var PASO = 0.1, MIN = 0.5, MAX = 2;
  var nivel = 1;
  try { nivel = parseFloat(localStorage.getItem('ayp-zoom')) || 1; } catch (e) {}

  function aplicar(nuevo) {
    nivel = Math.round(Math.min(Math.max(nuevo, MIN), MAX) * 10) / 10;
    try { localStorage.setItem('ayp-zoom', String(nivel)); } catch (e) {}
    var ipc = window.__TAURI_INTERNALS__;
    if (ipc) ipc.invoke('plugin:webview|set_webview_zoom', { value: nivel });
  }

  window.addEventListener('keydown', function (e) {
    if (!e.ctrlKey || e.altKey) return;
    var k = e.key, c = e.code;
    if (k === '-' || c === 'NumpadSubtract' || c === 'Minus') aplicar(nivel - PASO);
    else if (k === '+' || k === '=' || c === 'NumpadAdd' || c === 'Equal') aplicar(nivel + PASO);
    else if (k === '0' || c === 'Digit0' || c === 'Numpad0') aplicar(1);
    else return;
    e.preventDefault();
  }, true);

  window.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    aplicar(nivel + (e.deltaY < 0 ? PASO : -PASO));
  }, { passive: false, capture: true });

  if (nivel !== 1) aplicar(nivel);
})();
