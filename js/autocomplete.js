/* ========================================
   AUTOCOMPLETE - Sugestões Inteligentes
   ======================================== */

let autocompletePopup = null;
let currentSuggestions = [];
let selectedIndex = 0;

/**
 * Inicializa Popup
 */
export function initAutocomplete() {
  autocompletePopup = document.getElementById("autocomplete-popup");
  if (!autocompletePopup) {
    autocompletePopup = document.createElement("div");
    autocompletePopup.id = "autocomplete-popup";
    autocompletePopup.className = "hidden absolute z-50 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg rounded-md p-1 min-w-[150px]";
    document.body.appendChild(autocompletePopup);
  }
  return autocompletePopup;
}

/**
 * Filtra e mostra sugestões
 */
export function triggerAutocomplete(editor, keywords) {
  if (!editor || !autocompletePopup) return;
  
  const text = editor.value;
  const pos = editor.selectionStart;
  const lastWord = text.substring(0, pos).split(/[\s\n,.;:()\[\]{}"']/).pop();

  if (lastWord.length < 2) {
    hideAutocompletePopup();
    return;
  }

  currentSuggestions = keywords.filter(w => w.toLowerCase().startsWith(lastWord.toLowerCase()) && w !== lastWord);

  if (currentSuggestions.length === 0) {
    hideAutocompletePopup();
    return;
  }

  showAutocompletePopup(editor, lastWord);
}

function showAutocompletePopup(editor, lastWord) {
  const { top, left, height } = getCursorXY(editor);
  
  autocompletePopup.style.top = `${top + height + 24}px`;
  autocompletePopup.style.left = `${left + 48}px`; 
  autocompletePopup.classList.remove("hidden");

  renderSuggestions();
}

export function hideAutocompletePopup() {
  if (autocompletePopup) {
    autocompletePopup.classList.add("hidden");
  }
}

function renderSuggestions() {
  autocompletePopup.innerHTML = currentSuggestions.map((s, i) => `
    <div class="p-2 cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm ${i === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/50' : ''}" onclick="window.dispatchEvent(new CustomEvent('accept-autocomplete', {detail: '${s}'}))">
      ${s}
    </div>
  `).join("");
}

export function handleAutocompleteKeys(e, editor) {
  if (autocompletePopup.classList.contains("hidden")) return false;

  if (e.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
    renderSuggestions();
    e.preventDefault();
    return true;
  }
  if (e.key === "ArrowUp") {
    selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
    renderSuggestions();
    e.preventDefault();
    return true;
  }
  if (e.key === "Tab" || e.key === "Enter") {
    acceptAutocomplete(editor, currentSuggestions[selectedIndex]);
    e.preventDefault();
    return true;
  }
  if (e.key === "Escape") {
    hideAutocompletePopup();
    e.preventDefault();
    return true;
  }
  return false;
}

export function acceptAutocomplete(editor, suggestion) {
  const text = editor.value;
  const pos = editor.selectionStart;
  
  // Acha o início da palavra atual para substituir
  const textBefore = text.substring(0, pos);
  const wordMatch = textBefore.match(/[\wÀ-ú]+$/);
  const wordStart = wordMatch ? pos - wordMatch[0].length : pos;

  const newText = text.substring(0, wordStart) + suggestion + text.substring(pos);
  editor.value = newText;
  
  const newPos = wordStart + suggestion.length;
  editor.setSelectionRange(newPos, newPos);
  
  hideAutocompletePopup();
}

/**
 * Helpers para coordenadas (Simulado para Textarea)
 */
function getCursorXY(editor) {
  const { offsetLeft: left, offsetTop: top } = editor;
  return { left, top, height: 0 };
}
