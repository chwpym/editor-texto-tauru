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
  
  // Posicionamento dinâmico baseado no cursor real
  autocompletePopup.style.top = `${top + height + 24}px`;
  autocompletePopup.style.left = `${left}px`; 
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
  if (!suggestion) return;

  // Dispara evento global para que outros módulos (como shortcuts) possam reagir
  window.dispatchEvent(new CustomEvent('accept-autocomplete-internal', { 
    detail: { suggestion, editor } 
  }));
  
  hideAutocompletePopup();
}

/**
 * Calcula a posição X,Y (pixel) do cursor no textarea
 */
export function getCursorXY(textarea) {

  const { offsetLeft: left, offsetTop: top, selectionEnd } = textarea;
  
  // Criar elemento espelho
  const div = document.createElement('div');
  const copyStyle = getComputedStyle(textarea);
  for (const prop of copyStyle) {
    div.style[prop] = copyStyle[prop];
  }
  
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.width = textarea.clientWidth + 'px';
  div.style.height = textarea.clientHeight + 'px';
  
  // Corta o texto até o cursor
  const content = textarea.value.substring(0, selectionEnd);
  div.textContent = content;
  
  // Adiciona um marcador no final
  const span = document.createElement('span');
  span.textContent = textarea.value.substring(selectionEnd) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
  document.body.removeChild(div);
  
  return { 
    left: left + spanLeft - textarea.scrollLeft, 
    top: top + spanTop - textarea.scrollTop,
    height: 18 
  };
}

