// playbookEditor.js — DEPRECATED
// El editor de playbook fue reemplazado por playbook.html
// Este stub existe para evitar errores de referencia en app.js

const PlaybookEditor = (() => {
  function init() {}
  function open() {
    GameManager.autosave();
    window.location.href = 'playbook.html';
  }
  function close() {}
  function loadFromStorage() {}
  function loadDefenseFromStorage() {}
  return { init, open, close, loadFromStorage, loadDefenseFromStorage };
})();
