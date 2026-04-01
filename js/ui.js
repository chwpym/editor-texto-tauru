/* ========================================
   UI - Interface do Usuário (Helpers) 🎨
   ======================================== */

/**
 * Abre um modal com animação
 */
export function openModal(overlay) {
  if (!overlay) return;
  overlay.classList.remove("invisible");
  overlay.style.opacity = "1";
  const content = overlay.querySelector(".modal-content");
  if (content) {
    content.style.transform = "translateY(0)";
  }
}

/**
 * Fecha um modal com animação
 */
export function closeModal(overlay) {
  if (!overlay) return;
  overlay.style.opacity = "0";
  const content = overlay.querySelector(".modal-content");
  if (content) {
    content.style.transform = "translateY(-20px)";
  }
  setTimeout(() => {
    overlay.classList.add("invisible");
  }, 300);
}

/**
 * Renderiza o status de salvamento (ícone e cor)
 */
export function renderSaveStatus(status) {
  const el = document.getElementById("save-status");
  if (!el) return;
  
  if (status === "saving") {
    el.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3 text-blue-500 animate-spin"></i> Salvando...';
  } else if (status === "saved") {
    el.innerHTML = '<i data-lucide="check" class="w-3 h-3 text-emerald-500"></i> Salvo Local';
  } else {
    el.innerHTML = '<i data-lucide="circle-dashed" class="w-3 h-3 text-slate-400"></i> Não Salvo';
  }
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Mostra uma mensagem temporária (Toast)
 */
export function showMessage(msg, type = "info") {
  const box = document.getElementById("message-box");
  if (!box) return;

  box.textContent = msg;
  box.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-2xl z-[100] border transition-all duration-300 opacity-100 pointer-events-auto `;
  
  if (type === "error") {
    box.classList.add("bg-red-600", "text-white", "border-red-500");
  } else if (type === "success") {
    box.classList.add("bg-emerald-600", "text-white", "border-emerald-500");
  } else {
    box.classList.add("bg-slate-800", "text-white", "border-slate-700");
  }

  setTimeout(() => {
    box.style.opacity = "0";
    box.style.pointerEvents = "none";
  }, 3000);
}

/**
 * Lógica do Menu Flutuante de Seleção (IA)
 */
export function initFloatingMenu(editor, aiEnabled) {
  const menu = document.getElementById("floating-ai-menu");
  
  const handleSelection = () => {
    if (!aiEnabled()) {
      menu.classList.add("hidden");
      return;
    }

    const selection = editor.value.substring(editor.selectionStart, editor.selectionEnd).trim();
    if (selection.length > 2) {
      // Pequeno timeout para o textarea processar o cursor
      setTimeout(() => {
        const coords = getCursorXY(editor, editor.selectionEnd);
        menu.style.left = `${coords.x}px`;
        menu.style.top = `${coords.y + 25}px`;
        menu.classList.remove("hidden");
      }, 10);
    } else {
      menu.classList.add("hidden");
    }
  };

  editor.addEventListener("mouseup", handleSelection);
  editor.addEventListener("keyup", handleSelection);
}

/**
 * Helper para pegar coordenadas X/Y do cursor no textarea
 */
function getCursorXY(textarea, selectionEnd) {
  const { offsetLeft, offsetTop } = textarea;
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
  
  const content = textarea.value.substring(0, selectionEnd);
  div.textContent = content;
  
  const span = document.createElement('span');
  span.textContent = textarea.value.substring(selectionEnd) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
  document.body.removeChild(div);
  
  // Ajuste fino para scroll
  return {
    x: Math.min(window.innerWidth - 180, offsetLeft + spanLeft - textarea.scrollLeft),
    y: Math.min(window.innerHeight - 150, offsetTop + spanTop - textarea.scrollTop)
  };
}

/**
 * Controla a visibilidade do Empty State (quando não há abas abertas)
 */
export function updateEmptyState(currentDocId) {
  const emptyStateContainer = document.getElementById("empty-state-container");
  const editorWrapper = document.getElementById("editor-wrapper");
  const lineNumbers = document.getElementById("line-numbers");
  const statusBar = document.querySelector(".status-bar");
  
  if (!currentDocId) {
    if (emptyStateContainer) {
      emptyStateContainer.classList.remove("hidden");
      emptyStateContainer.classList.add("flex");
    }
    if (editorWrapper) editorWrapper.classList.add("hidden");
    if (statusBar) statusBar.classList.add("hidden");
    if (lineNumbers) lineNumbers.classList.add("hidden");
  } else {
    if (emptyStateContainer) {
      emptyStateContainer.classList.add("hidden");
      emptyStateContainer.classList.remove("flex");
    }
    if (editorWrapper) editorWrapper.classList.remove("hidden");
    if (statusBar) statusBar.classList.remove("hidden");
    if (lineNumbers) lineNumbers.classList.remove("hidden");
  }
}
