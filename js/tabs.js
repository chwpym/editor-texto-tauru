/* ========================================
   TABS - Gerenciamento de Abas/Guias
   ======================================== */

/**
 * Inicializa lista de abas abertas
 */
export function getOpenTabsFromStorage() {
  return JSON.parse(localStorage.getItem("openTabs") || "[]");
}

/**
 * Persiste abas
 */
export function saveOpenTabs(openTabs) {
  localStorage.setItem("openTabs", JSON.stringify(openTabs));
}

/**
 * Renderiza barra de abas
 */
export async function renderTabs(tabsBar, openTabs, currentDocId, dbFuncs, tabNewBtn) {
  if (!tabsBar) return;
  
  const existingTabs = tabsBar.querySelectorAll('.document-tab');
  existingTabs.forEach(t => t.remove());

  const docs = await dbFuncs.getAllDocs();
  
  openTabs.forEach(docId => {
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;

    const tab = document.createElement("div");
    tab.className = `document-tab ${currentDocId === docId ? 'active' : ''}`;
    const escapedName = doc.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    tab.innerHTML = `
      <span class="tab-title-text">${escapedName}</span>
      <button class="tab-close-btn" data-doc-id="${docId}">
        <i data-lucide="x" class="w-3 h-3"></i>
      </button>
    `;
    
    // Anexar via data-doc-id e delegate para simplificar o app.js
    tab.dataset.docId = docId;
    tabsBar.insertBefore(tab, tabNewBtn);
  });

  if (window.lucide) window.lucide.createIcons({ root: tabsBar });
}
