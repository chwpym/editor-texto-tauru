/* ========================================
   SHORTCUTS - Atalhos de Teclado ⌨️
   ======================================== */

/**
 * Atrela os ouvintes de evento globais
 */
export function initShortcuts(editor, actions) {
  if (!editor) return;

  // Atalhos Globais (Ctrl+...)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      actions.save();
    }
    if ((e.altKey) && e.key === "n") {
      e.preventDefault();
      actions.new();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "p") {
      e.preventDefault();
      window.print();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      actions.find();
    }
  });

  // Atalhos específicos do Editor
  editor.addEventListener("keydown", (e) => {
    // Suporte ao TAB
    if (e.key === "Tab") {
      // Se o autocomplete estiver aberto, ele lida com isso. 
      // Caso contrário, insere 2 espaços (identação simples)
      if (actions.isAutocompleteOpen()) return;
      
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
    }
  });
}
