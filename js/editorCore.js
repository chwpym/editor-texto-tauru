/* ========================================
   EDITOR CORE - O motor de renderização
   ======================================== */

/**
 * Atualiza régua de números (Reconstrução Total para Resiliência)
 */
export function updateLineNumbers(editor, lineNumbers) {
  if (!editor || !lineNumbers) return;
  const lines = editor.value.split("\n");
  const count = lines.length;
  
  // Usamos dataset para evitar reconstrução desnecessária se nada mudou
  if (lineNumbers.dataset.lastCount === String(count)) return;
  lineNumbers.dataset.lastCount = count;

  let html = "";
  for (let i = 1; i <= count; i++) {
    html += `<div class="line-number">${i}</div>`;
  }
  lineNumbers.innerHTML = html;
}

/**
 * Reseta o contador de linhas (Útil ao trocar de documento)
 */
export function resetLineCount(lineNumbers) {
  if (lineNumbers) {
    lineNumbers.innerHTML = "";
    lineNumbers.dataset.lastCount = "0";
  }
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
  const column = localStorage.getItem("rulerColumn") || 84;
  if (rulerColumnInput) rulerColumnInput.value = column;
  updateRulerPosition(rulerColumnInput, rulerLine);
}

/**
 * Modo Máquina de Escrever (Typewriter)
 */
export function toggleTypewriterMode(editor) {
  if (!editor) return;
  const active = document.body.classList.toggle("typewriter-mode");
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
    document.body.classList.add("typewriter-mode");
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

export function toggleRuler(rulerLine) {
  if (!rulerLine) return;
  const isHidden = rulerLine.classList.toggle("hidden");
  localStorage.setItem("rulerVisible", !isHidden);
  
  const btn = document.getElementById("ruler-toggle-btn");
  if (btn) {
    btn.classList.toggle("text-blue-600", !isHidden);
    btn.classList.toggle("dark:text-blue-400", !isHidden);
  }
}

export function loadRuler(rulerLine, rulerColumnInput) {
  const visible = localStorage.getItem("rulerVisible") !== "false";
  if (!visible) {
    rulerLine.classList.add("hidden");
  } else {
    rulerLine.classList.remove("hidden");
    const btn = document.getElementById("ruler-toggle-btn");
    if (btn) {
      btn.classList.add("text-blue-600", "dark:text-blue-400");
    }
  }
  loadRulerPosition(rulerColumnInput, rulerLine);
}

