/* ========================================
   HIGHLIGHT - Realce de Texto e Busca 🔍
   ======================================== */

import { escapeHtml } from './utils.js';

let searchHighlightTerm = "";
let searchMatchIndex = 0;

/**
 * Escapa strings para uso em RegExp
 */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Atualiza o realce de busca no overlay
 */
export function updateSearchHighlight(editor, term) {
  const overlay = document.getElementById("search-highlight-overlay");
  if (!overlay || !editor) return;

  searchHighlightTerm = term;
  
  if (!term || term.length < 1) {
    overlay.innerHTML = "";
    updateFindMatchCount(0, 0);
    return;
  }

  const text = editor.value;
  const regex = new RegExp(escapeRegex(term), "gi");
  let matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }

  updateFindMatchCount(searchMatchIndex + 1, matches.length);
  
  if (matches.length === 0) {
    overlay.innerHTML = "";
    return;
  }

  // Renderiza texto com marcações
  let html = "";
  let last = 0;
  matches.forEach((match, i) => {
    html += escapeHtml(text.slice(last, match.start));
    const cls = i === searchMatchIndex ? "current-match" : "";
    html += `<mark class="${cls}">${escapeHtml(text.slice(match.start, match.end))}</mark>`;
    last = match.end;
  });
  html += escapeHtml(text.slice(last));
  overlay.innerHTML = html;

  syncHighlightScroll(editor);
}

/**
 * Sincroniza o scroll do overlay com o editor
 */
export function syncHighlightScroll(editor) {
  const overlay = document.getElementById("search-highlight-overlay");
  if (overlay && editor) {
    overlay.scrollTop = editor.scrollTop;
    overlay.scrollLeft = editor.scrollLeft;
  }
}

/**
 * Navega entre os resultados da busca
 */
export function navigateSearchMatch(editor, direction) {
  if (!searchHighlightTerm) return;
  const text = editor.value;
  const regex = new RegExp(escapeRegex(searchHighlightTerm), "gi");
  let matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }
  if (matches.length === 0) return;

  searchMatchIndex = ((searchMatchIndex + direction) % matches.length + matches.length) % matches.length;
  const match = matches[searchMatchIndex];
  
  editor.setSelectionRange(match.start, match.end);
  scrollToSelection(editor, match.start);

  updateFindMatchCount(searchMatchIndex + 1, matches.length);
  updateSearchHighlight(editor, searchHighlightTerm);
}

/**
 * Atualiza o contador de matches na UI
 */
function updateFindMatchCount(current, total) {
  const el = document.getElementById("find-match-count");
  if (!el) return;
  
  if (total === 0) {
    el.textContent = " — Nenhuma ocorrência";
    el.style.color = "#ef4444";
  } else {
    el.textContent = ` ${current}/${total}`;
    el.style.color = "#64748b";
  }
}

/**
 * Scroll suave para a seleção
 */
function scrollToSelection(editor, pos) {
  const textBefore = editor.value.substring(0, pos);
  const lines = textBefore.split("\n");
  const lineIndex = lines.length - 1;
  const lineHeight = 24; 
  const targetScroll = (lineIndex * lineHeight) - (editor.clientHeight / 2);
  editor.scrollTop = Math.max(0, targetScroll);
}
