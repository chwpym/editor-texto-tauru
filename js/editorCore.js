/* ========================================
   EDITOR CORE - O motor de renderização
   ======================================== */

let currentRenderedLines = 0; // Otimização de performance

/**
 * Atualiza régua de números (O(1) na digitação, O(N) no Enter)
 */
export function updateLineNumbers(editor, lineNumbers) {
  if (!editor || !lineNumbers) return;
  const lines = editor.value.split("\n");
  const count = lines.length;

  // SÓ REPAINT NO DOM SE O NÚMERO DE LINHAS MUDAR
  if (count === currentRenderedLines) return;

  currentRenderedLines = count;
  let html = "";
  for (let i = 1; i <= count; i++) {
    html += `<div class="line-number">${i}</div>`;
  }
  lineNumbers.innerHTML = html;
}

/**
 * Atualiza posição da régua vertical
 */
export function updateRulerPosition(rulerColumnInput, rulerLine) {
  if (!rulerColumnInput || !rulerLine) return;
  const column = parseInt(rulerColumnInput.value) || 80;
  localStorage.setItem("rulerColumn", column);
  rulerLine.style.left = `calc(${column} * 1ch + 48px + 1rem)`;
}

export function loadRulerPosition(rulerColumnInput, rulerLine) {
  const saved = localStorage.getItem("rulerColumn");
  if (saved && rulerColumnInput && rulerLine) {
    rulerColumnInput.value = saved;
    updateRulerPosition(rulerColumnInput, rulerLine);
  }
}

/**
 * Modo Máquina de Escrever (Typewriter)
 */
export function toggleTypewriterMode(editor) {
  if (!editor) return;
  const active = editor.classList.toggle("typewriter-mode");
  localStorage.setItem("typewriterMode", active);
  
  const btn = document.getElementById("typewriter-btn");
  if (btn) {
    btn.classList.toggle("bg-blue-100", active);
    btn.classList.toggle("dark:bg-blue-900", active);
  }
}

export function loadTypewriterMode(editor) {
  if (!editor) return;
  const saved = localStorage.getItem("typewriterMode") === "true";
  if (saved) {
    editor.classList.add("typewriter-mode");
    const btn = document.getElementById("typewriter-btn");
    if (btn) {
      btn.classList.add("bg-blue-100", "dark:bg-blue-900");
    }
  }
}

/**
 * Atualiza métricas no rodapé
 */
export function updateStatusBarMetrics(editor, metrics) {
  if (!editor) return;
  const text = editor.value;
  const lines = text.split("\n");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  if (metrics.fileSize) {
    const bytes = new Blob([text]).size;
    metrics.fileSize.textContent = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (metrics.wordCount) metrics.wordCount.textContent = `${words} palavras`;
  if (metrics.charCount) metrics.charCount.textContent = `${chars} chars`;
  if (metrics.lineCount) metrics.lineCount.textContent = `${lines.length} linhas`;
}

/**
 * Calcula posição do cursor
 */
export function updateCursorPos(editor, cursorPosEl) {
  if (!editor || !cursorPosEl) return;
  const pos = editor.selectionStart;
  const textBefore = editor.value.substring(0, pos);
  const lines = textBefore.split("\n");
  const row = lines.length;
  const col = lines[lines.length - 1].length + 1;
  cursorPosEl.textContent = `Lin ${row}, Col ${col}`;
}
