/* ========================================
   DICTIONARY - Gerenciador de Palavras Fixas
   ======================================== */

import { showMessage } from './utils.js';

const DICT_KEY = "editor-taurus-personal-dict";

/**
 * Carrega a lista de palavras salvas
 */
export function getPersonalDict() {
  try {
    return JSON.parse(localStorage.getItem(DICT_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Salva a lista de palavras
 */
export function savePersonalDict(words) {
  localStorage.setItem(DICT_KEY, JSON.stringify(words));
  renderPersonalDictWords();
}

/**
 * Renderiza os chips de palavras no modal
 */
export function renderPersonalDictWords() {
  const list = document.getElementById("dict-words-list");
  if (!list) return;

  const words = getPersonalDict();
  if (words.length === 0) {
    list.innerHTML = '<span class="text-slate-400 text-sm italic p-2 w-full text-center">Nenhuma palavra adicionada ainda.</span>';
    return;
  }

  list.innerHTML = words.map(w => `
    <button 
      class="dict-chip px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-mono hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
      data-word="${w}" 
      title="Clique para remover"
    >${w}</button>
  `).join('');

  // Evento: remover ao clicar no chip
  list.querySelectorAll('.dict-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const word = btn.dataset.word;
      const filtered = getPersonalDict().filter(w => w !== word);
      savePersonalDict(filtered);
      showMessage(`"${word}" removido do dicionário`, "info");
    });
  });
}

/**
 * Adiciona uma nova palavra
 */
export function addPersonalDictWord() {
  const input = document.getElementById("dict-word-input");
  if (!input) return;

  const word = input.value.trim().toUpperCase();
  if (!word || word.length < 2) {
    showMessage("Palavra muito curta!", "error");
    return;
  }

  const words = getPersonalDict();
  if (!words.includes(word)) {
    words.push(word);
    savePersonalDict(words.sort());
    showMessage(`"${word}" adicionado ao dicionário! ✓`, "success");
    input.value = '';
    input.focus();
  } else {
    showMessage(`"${word}" já existe no dicionário`, "info");
  }
}

/**
 * Inicializa o sistema de dicionário
 */
export function initDictionary() {
  const addBtn = document.getElementById("dict-add-btn");
  const input = document.getElementById("dict-word-input");

  if (addBtn) addBtn.addEventListener("click", addPersonalDictWord);
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPersonalDictWord();
    });
  }
  
  renderPersonalDictWords();
}
