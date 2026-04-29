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

let lastRenderKey = "";

export function updateSearchHighlight(editor, term, specificIndices = null) {
  const overlay = document.getElementById("search-highlight-overlay");
  if (!overlay || !editor) return;

  // 🔥 ESCUDO ANTI-DUPLICAÇÃO: evita renderizar 2x a mesma coisa
  // Adicionamos o comprimento do texto na chave para forçar re-render se o texto mudar
  const renderKey = term + "|" + (specificIndices ? specificIndices.join(",") : "") + "|" + editor.value.length;
  if (renderKey === lastRenderKey) return;
  lastRenderKey = renderKey;

  searchHighlightTerm = term;
  
  if ((!term || term.length < 1) && (!specificIndices || specificIndices.length === 0)) {
    overlay.innerHTML = "";
    updateFindMatchCount(0, 0);
    return;
  }

  const text = editor.value;
  let matches = [];

  if (specificIndices && specificIndices.length > 0) {
    // Se passarmos índices específicos (Ctrl+D), destacamos apenas esses
    matches = specificIndices.map(idx => ({ start: idx, end: idx + term.length }));
    matches.sort((a, b) => a.start - b.start);
  } else {
    // Busca padrão por RegExp (Ctrl+F)
    const regex = new RegExp(escapeRegex(term), "gi");
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length });
    }
  }

  updateFindMatchCount(searchMatchIndex + 1, matches.length);
  
  if (matches.length === 0 && (!specificIndices || specificIndices.length === 0)) {
    overlay.innerHTML = "";
    return;
  }
  
  // Caso especial: Multi-cursores sem seleção (termo vazio)
  if (matches.length === 0 && specificIndices && specificIndices.length > 0) {
    matches = specificIndices.map(idx => ({ start: idx, end: idx }));
  }

  // Renderiza texto com marcações
  let html = "";
  let last = 0;
  matches.forEach((match, i) => {
    html += escapeHtml(text.slice(last, match.start));
    const isCurrent = i === searchMatchIndex;
    const cls = isCurrent ? "current-match" : "";
    
    // Renderiza a marcação e um cursor simulado
    html += `<mark class="${cls}">${escapeHtml(text.slice(match.start, match.end))}<span class="fake-cursor"></span></mark>`;
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
