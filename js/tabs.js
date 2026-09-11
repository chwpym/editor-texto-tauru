import { createIcons, icons } from 'lucide';

/**
 * Inicializa lista de abas abertas
 */
export function getOpenTabsFromStorage() {
  try {
    const openTabs = JSON.parse(localStorage.getItem("openTabs") || "[]");
    return Array.isArray(openTabs) ? openTabs : [];
  } catch {
    return [];
  }
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
    const title = document.createElement("span");
    title.className = "tab-title-text";
    title.textContent = doc.name;

    const closeButton = document.createElement("button");
    closeButton.className = "tab-close-btn";
    closeButton.dataset.docId = docId;
    closeButton.innerHTML = '<i data-lucide="x" class="w-3 h-3"></i>';

    tab.append(title, closeButton);
    
    // Anexar via data-doc-id e delegate para simplificar o app.js
    tab.dataset.docId = docId;
    tabsBar.insertBefore(tab, tabNewBtn);
  });

  createIcons({ icons, nameAttr: 'data-lucide', root: tabsBar });
}
