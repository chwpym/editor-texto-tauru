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

  // 🔥 REMOVIDO ESCUDO PARA DEPURAR: Força renderização total
  // const renderKey = term + "|" + (specificIndices ? specificIndices.length : "0") + "|" + (specificIndices ? specificIndices.join(",") : "") + "|" + editor.value.length;
  // if (renderKey === lastRenderKey) return;
  // lastRenderKey = renderKey;

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
    matches = specificIndices.map(idx => ({ start: idx, end: idx + (term ? term.length : 0) }));
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
  
  if (matches.length === 0) {
    overlay.innerHTML = "";
    return;
  }
  
  // Renderiza texto com marcações
  let html = "";
  let cursor = 0;
  
  const isMulti = specificIndices && specificIndices.length > 0;

  if (isMulti) {
    // 🛡️ MODO MULTI-CURSOR: Renderização ultra-segura
    const uniqueIndices = [...new Set(specificIndices)].sort((a, b) => a - b);
    const termLength = term ? term.length : 0;

    uniqueIndices.forEach((idx) => {
      // Pula índices inválidos ou sobrepostos
      if (idx < cursor) return;

      // Adiciona o texto ANTES do highlight
      if (idx > cursor) {
        html += escapeHtml(text.slice(cursor, idx));
      }

      // Adiciona a marcação AZUL
      html += `<mark class="current-match">${escapeHtml(text.slice(idx, idx + termLength))}<span class="fake-cursor"></span></mark>`;
      cursor = idx + termLength;
    });

    // Adiciona o restante do texto do arquivo
    if (cursor < text.length) {
      html += escapeHtml(text.slice(cursor));
    }
  } else {
    // 🔍 MODO BUSCA NORMAL (Ctrl+F)
    matches.forEach((match, i) => {
      html += escapeHtml(text.slice(cursor, match.start));
      const isCurrent = i === searchMatchIndex;
      const cls = isCurrent ? "current-match" : "";
      html += `<mark class="${cls}">${escapeHtml(text.slice(match.start, match.end))}<span class="fake-cursor"></span></mark>`;
      cursor = match.end;
    });
    if (cursor < text.length) {
      html += escapeHtml(text.slice(cursor));
    }
  }

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
