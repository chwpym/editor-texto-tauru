/* ========================================
   SHORTCUTS - Atalhos de Teclado ⌨️
   ======================================== */

import * as auto from './autocomplete.js';
import { updateSearchHighlight } from './highlight.js';

// Estado interno de seleções múltiplas
let multiSelections = [];
let multiSelectTerm = '';
let lastDTime = 0; // Trava para evitar disparos duplos (debounce)

/**
 * Inicializa todos os ouvintes de atalho
 */
export function initShortcuts(editor, actions) {
  if (!editor) return;

  // ── Atalhos Globais (funcionam em qualquer lugar) ──────────────────────
  window.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "s") {
      e.preventDefault();
      if (actions.save) actions.save();
    }
    if (e.altKey && e.key === "n") {
      e.preventDefault();
      if (actions.new) actions.new();
    }
    if (ctrl && (e.key === "f" || (e.shiftKey && e.key === "F"))) {
      e.preventDefault();
      if (actions.find) actions.find();
    }
  });

  // ── Atalhos específicos do Editor ──────────────────────────────────────
  editor.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Autocomplete sempre tem prioridade em certos atalhos
    if (auto.handleAutocompleteKeys(e, editor)) return;

    // TAB → Indentação de 2 espaços
    if (e.key === "Tab" && !actions.isAutocompleteOpen()) {
      e.preventDefault();
      insertText(editor, "  ");
      return;
    }

    // ESC → Cancelar seleções múltiplas
    if (e.key === "Escape") {
      if (multiSelections.length > 0) {
        e.preventDefault();
        clearMultiSelections(editor);
      }
      return;
    }

    // Ctrl + D → Selecionar próxima ocorrência (e.code evita conflito com Favoritos do browser)
    if (ctrl && !e.shiftKey && e.code === "KeyD") {
      e.preventDefault();
      selectNextOccurrence(editor);
      return;
    }

    // Ctrl + Shift + L → Selecionar TODAS as ocorrências
    if (ctrl && e.shiftKey && e.key === "L") {
      e.preventDefault();
      selectAllOccurrences(editor);
      return;
    }

    // Ctrl + Shift + D → Duplicar linha atual
    if (ctrl && e.shiftKey && e.key === "D") {
      e.preventDefault();
      duplicateLine(editor);
      actions.onInput?.();
      return;
    }

    // Ctrl + Shift + U → Alternar MAIÚSCULAS / minúsculas
    if (ctrl && e.shiftKey && e.key === "U") {
      e.preventDefault();
      toggleCase(editor);
      actions.onInput?.();
      return;
    }

    // Ctrl + M → Abrir modal de ações múltiplas
    if (ctrl && e.key === "m") {
      e.preventDefault();
      actions.openMultiActions?.();
      return;
    }

    // Alt + Shift + ↑ → Mover linha para cima
    if (e.altKey && e.shiftKey && e.key === "ArrowUp") {
      e.preventDefault();
      moveLine(editor, -1);
      actions.onInput?.();
      return;
    }

    // Alt + Shift + ↓ → Mover linha para baixo
    if (e.altKey && e.shiftKey && e.key === "ArrowDown") {
      e.preventDefault();
      moveLine(editor, 1);
      actions.onInput?.();
      return;
    }

    // 🔥 NOVO: Movimentação de Multi-Cursor com as setas (Esquerda/Direita)
    if (multiSelections.length > 0 && !ctrl && !e.altKey && !e.metaKey) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveMultiCursors(editor, -1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveMultiCursors(editor, 1);
        return;
      }
    }

    // 🔥 NOVO: Lógica de Multi-Cursor (Digitação Simultânea)
    if (multiSelections.length > 0 && !ctrl && !e.altKey && !e.metaKey) {
      // Caracteres imprimíveis
      if (e.key.length === 1) {
        e.preventDefault();
        applyTextToMultiSelections(editor, e.key);
        return;
      }
      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        applyTextToMultiSelections(editor, "", -1);
        return;
      }
      // Enter
      if (e.key === "Enter") {
        e.preventDefault();
        applyTextToMultiSelections(editor, "\n");
        return;
      }
    }
  });

  // Limpar multi-seleções ao clicar no editor
  editor.addEventListener("mousedown", () => {
    if (multiSelections.length > 0) {
      clearMultiSelections(editor);
    }
  });
}

// ── Operações de Texto ─────────────────────────────────────────────────────

/**
 * Insere texto na posição do cursor
 */
function insertText(editor, text) {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
  editor.selectionStart = editor.selectionEnd = start + text.length;
}

/**
 * Seleciona a próxima ocorrência da palavra/seleção atual (Ctrl+D)
 */
function selectNextOccurrence(editor) {
  // 🔥 DEBOUNCE: Ignora se a tecla foi apertada há menos de 100ms (evita salto de 2 em 2)
  const now = Date.now();
  if (now - lastDTime < 100) return;
  lastDTime = now;

  const val = editor.value;
  let start = editor.selectionStart;
  let end = editor.selectionEnd;

  // Helper interno para evitar duplicações
  const addSelection = (idx) => {
    if (!multiSelections.includes(idx)) {
      multiSelections.push(idx);
    }
  };

  // 1. Se nada estiver selecionado, seleciona a palavra E já registra (Badge "1")
  if (start === end) {
    const textBefore = val.substring(0, start);
    const textAfter = val.substring(start);

    const wordBefore = textBefore.match(/[\wÀ-ÿ]+$/);
    const wordAfter = textAfter.match(/^[\wÀ-ÿ]+/);

    if (wordBefore || wordAfter) {
      const startPos = start - (wordBefore ? wordBefore[0].length : 0);
      const endPos = start + (wordAfter ? wordAfter[0].length : 0);

      editor.setSelectionRange(startPos, endPos);

      // 🔥 RESET TOTAL (não inicia multi ainda)
      multiSelections = [];
      multiSelectTerm = '';

      return;
    } else {
      return;
    }
  }

  const term = val.substring(start, end);
  multiSelectTerm = term;

  // 2. Se for a PRIMEIRA entrada no fluxo de multi-select (Badge "1")
  if (multiSelections.length === 0) {
    multiSelections = [start];
    updateMultiSelectionCount();
    updateSearchHighlight(editor, term, multiSelections);
    return; // 🔥 CHAVE: Para aqui no primeiro Ctrl+D para não pular 2
  }

  // 3. Buscar PRÓXIMA ocorrência (Sempre +1 por vez)
  const last = multiSelections[multiSelections.length - 1];
  let nextIdx = val.indexOf(term, last + term.length);

  if (nextIdx === -1) {
    nextIdx = val.indexOf(term, 0); // Wrap-around
  }

  if (nextIdx === -1 || multiSelections.includes(nextIdx)) return;

  addSelection(nextIdx);
  editor.setSelectionRange(nextIdx, nextIdx + term.length);

  updateMultiSelectionCount();
  updateSearchHighlight(editor, term, multiSelections);
}

/**
 * Seleciona TODAS as ocorrências do termo atual (Ctrl+Shift+L)
 */
function selectAllOccurrences(editor) {
  const val = editor.value;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  let term = val.substring(start, end);
  if (!term) {
    const wordMatch = val.substring(0, end).match(/\w+$/);
    if (!wordMatch) return;
    term = wordMatch[0];
  }

  multiSelectTerm = term;
  multiSelections = [];
  let idx = 0;
  while ((idx = val.indexOf(term, idx)) !== -1) {
    multiSelections.push(idx);
    idx += term.length;
  }

  if (multiSelections.length > 0) {
    const last = multiSelections[multiSelections.length - 1];
    editor.setSelectionRange(last, last + term.length);
  }
  updateMultiSelectionCount();
  updateSearchHighlight(editor, term, multiSelections);
}

/**
 * Duplica a linha atual (Ctrl+Shift+D)
 */
export function duplicateLine(editor) {

  const val = editor.value;
  const pos = editor.selectionStart;
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  const lineEnd = val.indexOf('\n', pos);
  const end = lineEnd === -1 ? val.length : lineEnd;
  const line = val.substring(lineStart, end);

  const newText = val.substring(0, end) + '\n' + line + val.substring(end);
  editor.value = newText;
  const newPos = end + 1 + (pos - lineStart);
  editor.setSelectionRange(newPos, newPos);
}

/**
 * Alterna MAIÚSCULAS / minúsculas (Ctrl+Shift+U)
 */
export function toggleCase(editor) {

  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  if (start === end) return;
  const selected = editor.value.substring(start, end);
  const isUpper = selected === selected.toUpperCase();
  const replaced = isUpper ? selected.toLowerCase() : selected.toUpperCase();
  editor.value = editor.value.substring(0, start) + replaced + editor.value.substring(end);
  editor.setSelectionRange(start, start + replaced.length);
}

/**
 * Move a linha atual para cima ou baixo (Alt+Shift+↑/↓)
 */
export function moveLine(editor, direction) {

  const val = editor.value;
  const pos = editor.selectionStart;
  const lines = val.split('\n');

  const textBefore = val.substring(0, pos);
  const lineIndex = (textBefore.match(/\n/g) || []).length;

  const targetIndex = lineIndex + direction;
  if (targetIndex < 0 || targetIndex >= lines.length) return;

  // Troca as linhas
  [lines[lineIndex], lines[targetIndex]] = [lines[targetIndex], lines[lineIndex]];
  editor.value = lines.join('\n');

  // Reposiciona o cursor na linha movida
  const newTextBefore = lines.slice(0, targetIndex).join('\n');
  const cursorOffset = pos - textBefore.lastIndexOf('\n') - 1;
  const newPos = (newTextBefore ? newTextBefore.length + 1 : 0) + cursorOffset;
  editor.setSelectionRange(Math.max(0, newPos), Math.max(0, newPos));
}

/**
 * Limpa o estado de seleções múltiplas
 */
function clearMultiSelections(editor) {
  multiSelections = [];
  multiSelectTerm = '';
  updateMultiSelectionCount();
  updateSearchHighlight(editor, "");
}

/**
 * Aplica um texto (ou deleção) em todas as seleções múltiplas simultaneamente
 */
function applyTextToMultiSelections(editor, text, offset = 0) {
  let val = editor.value;
  const termLen = multiSelectTerm.length;
  
  // Ordenamos do fim para o início para que a substituição não mude os índices dos próximos
  const sorted = [...multiSelections].sort((a, b) => b - a);
  
  sorted.forEach(idx => {
    let start, end;
    if (termLen > 0) {
      start = idx;
      end = idx + termLen;
    } else {
      start = Math.max(0, idx + (offset < 0 ? offset : 0));
      end = idx;
    }
    val = val.substring(0, start) + text + val.substring(end);
  });

  editor.value = val;

  // Cálculo de deslocamento para os cursores
  const addedLen = text.length;
  const removedLen = termLen > 0 ? termLen : (offset < 0 ? -offset : 0);
  const diffPerCursor = addedLen - removedLen;

  // Atualiza os índices dos cursores
  multiSelections.sort((a, b) => a - b);
  multiSelections = multiSelections.map((idx, i) => {
    // Cada cursor é deslocado pelo que ele mesmo adicionou/removeu 
    // MAIS o que os cursores anteriores a ele adicionaram/removeram
    const myChange = (offset < 0 && termLen === 0) ? offset : 0;
    const previousChanges = i * diffPerCursor;
    const currentCursorMovement = termLen > 0 ? addedLen : addedLen; // Se havia seleção, cursor vai pro fim do novo texto
    
    // Se havia seleção ("RANGER"), e digitei "r", o novo índice deve ser o início + 1
    if (termLen > 0) {
        return idx + previousChanges + addedLen;
    }
    // Se era apenas cursor e digitei "r", o novo índice deve ser o antigo + 1
    return idx + previousChanges + addedLen + myChange;
  });
  
  // 🔥 IMPORTANTE: Após a primeira digitação, não há mais "termo selecionado"
  // Transformamos as seleções em apenas cursores (comprimento 0)
  multiSelectTerm = "";

  // Move o cursor nativo para a última posição
  const lastIdx = multiSelections[multiSelections.length - 1];
  editor.setSelectionRange(lastIdx, lastIdx);

  updateMultiSelectionCount();
  updateSearchHighlight(editor, multiSelectTerm, multiSelections);
  
  // Dispara evento de input para o app.js salvar
  editor.dispatchEvent(new Event('input'));
}

/**
 * Move todos os multi-cursores para a esquerda ou direita
 */
function moveMultiCursors(editor, direction) {
  const termLen = multiSelectTerm.length;
  
  multiSelections = multiSelections.map(idx => {
    if (termLen > 0) {
      // Se havia seleção, a seta "colapsa" o cursor para o início ou fim
      return direction > 0 ? idx + termLen : idx;
    }
    // Se era apenas um cursor, move 1 posição
    return Math.max(0, Math.min(editor.value.length, idx + direction));
  });

  // Após mover com a seta, a seleção vira apenas cursores (comprimento 0)
  multiSelectTerm = "";
  
  // Sincroniza o cursor nativo com o último multi-cursor
  const lastIdx = multiSelections[multiSelections.length - 1];
  editor.setSelectionRange(lastIdx, lastIdx);

  updateMultiSelectionCount();
  updateSearchHighlight(editor, multiSelectTerm, multiSelections);
}

/**
 * Atualiza o indicador de seleções múltiplas no rodapé
 */
function updateMultiSelectionCount() {
  const indicator = document.getElementById('multi-selection-indicator');
  const text = document.getElementById('multi-selection-text');
  if (!indicator || !text) return;

  if (multiSelections.length > 0) {
    text.textContent = `${multiSelections.length} selecionadas`;
    indicator.classList.add('show');
  } else {
    indicator.classList.remove('show');
  }
}

/**
 * Retorna as seleções múltiplas ativas (para o modal de ações)
 */
export function getMultiSelections() {
  return { selections: multiSelections, term: multiSelectTerm };
}

export function clearMultiSelectionsPublic(editor) {
  multiSelections = [];
  multiSelectTerm = '';
  updateMultiSelectionCount();
  if (editor) {
    updateSearchHighlight(editor, "");
  }
}

/**
 * Aplica uma sugestão do autocomplete em todos os multi-cursores
 */
export function applySuggestionToMultiCursors(editor, suggestion) {
  if (!editor || multiSelections.length === 0) return false;

  // Achar o que está sendo digitado em cada cursor (prefixo)
  // Como assumimos que todos os cursores estão digitando a mesma coisa:
  const text = editor.value;
  const lastPos = multiSelections[multiSelections.length - 1];
  const textBefore = text.substring(0, lastPos);
  const wordMatch = textBefore.match(/[\wÀ-ú]+$/);
  
  if (!wordMatch) return false;
  
  const prefixLen = wordMatch[0].length;
  const remainingText = suggestion.substring(prefixLen);

  // Aplicamos apenas o RESTO da sugestão para cada cursor
  applyTextToMultiSelections(editor, remainingText);
  return true;
}
