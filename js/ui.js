/* ========================================
   UI - Gerenciamento de Interface e Modais
   ======================================== */

/**
 * Abre modal genérico
 */
export function openModal(overlay) {
  if (!overlay) return;
  overlay.classList.add("show");
}

/**
 * Fecha modal genérico
 */
export function closeModal(overlay) {
  if (!overlay) return;
  overlay.classList.remove("show");
}

/**
 * Renderiza o ícone de status de salvamento no rodapé
 */
export function renderSaveStatus(state) {
  const saveStatus = document.getElementById("save-status");
  if (!saveStatus) return;
  
  if (state === 'unsaved') {
    saveStatus.innerHTML = `<i data-lucide="circle-dot" class="w-3 h-3 text-amber-500"></i>`;
  } else if (state === 'saved') {
    saveStatus.innerHTML = `<i data-lucide="check-circle-2" class="w-3 h-3 text-emerald-500 opacity-60"></i>`;
  } else if (state === 'error') {
    saveStatus.innerHTML = `<span class="text-xs text-red-400">Offline</span>`; 
  }
  
  // Recria os ícones apenas para o elemento afetado para performance
  if (window.lucide) {
    window.lucide.createIcons({ root: saveStatus });
  }
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
