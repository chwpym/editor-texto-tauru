/* ========================================
   UI - Interface do Usuário (Helpers) 🎨
   ======================================== */

import { createIcons, icons } from 'lucide';

/**
 * Abre um modal com animação
 */
export function openModal(overlay) {
  if (!overlay) return;
  overlay.classList.add("show");
}

/**
 * Fecha um modal com animação
 */
export function closeModal(overlay) {
  if (!overlay) return;
  overlay.classList.remove("show");
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
  createIcons({ icons, nameAttr: 'data-lucide' });
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
  
  const essentialStyles = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch',
    'lineHeight', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
    'borderLeftWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
    'boxSizing', 'width', 'height', 'textIndent', 'textTransform', 'letterSpacing', 
    'wordSpacing', 'textAlign', 'whiteSpace', 'wordBreak', 'overflowWrap'
  ];

  essentialStyles.forEach(prop => {
    div.style[prop] = copyStyle[prop];
  });
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
  const statusBar = document.querySelector(".status-bar");
  
  if (!currentDocId) {
    if (emptyStateContainer) {
      emptyStateContainer.classList.remove("hidden");
      emptyStateContainer.style.display = "flex";
      emptyStateContainer.style.height = "100%"; // Ocupa todo o espaço
    }
    if (editorWrapper) editorWrapper.style.display = "none";
    if (statusBar) statusBar.style.display = "none";
  } else {
    if (emptyStateContainer) {
      emptyStateContainer.classList.add("hidden");
      emptyStateContainer.style.display = "none";
    }
    if (editorWrapper) {
      editorWrapper.style.display = "flex";
      editorWrapper.classList.remove("hidden");
    }
    if (statusBar) {
      statusBar.style.display = "flex";
      statusBar.classList.remove("hidden");
    }
  }
}


/**
 * Inicializa o comportamento da Sidebar Responsiva
 */
export function initResponsiveSidebar() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const closeSidebarBtn = document.getElementById("close-sidebar-btn");
  const sidebar = document.getElementById("mobile-sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  const sidebarContent = document.getElementById("sidebar-content");
  const secondaryGroups = document.querySelectorAll(".toolbar-group-secondary");

  if (!mobileMenuBtn || !sidebar) return;

  const toggleSidebar = () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("hidden");
    overlay.classList.toggle("active");
    
    // Popula a sidebar se estiver vazia
    if (sidebar.classList.contains("open") && sidebarContent.children.length === 0) {
      secondaryGroups.forEach(group => {
        const items = group.querySelectorAll("button, .ruler-input-group");
        items.forEach(item => {
          const clone = item.cloneNode(true);
          // Adiciona label baseado no title para ficar legível na lista vertical
          const label = document.createElement("span");
          label.className = "text-sm font-medium";
          label.textContent = item.title || "Ação";
          
          const row = document.createElement("div");
          row.className = "flex-row-mobile flex items-center gap-3 p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer";
          
          // Se for o grupo de régua, precisamos tratar o input
          if (item.classList.contains("ruler-input-group")) {
             row.innerHTML = item.innerHTML;
             row.classList.add("justify-between");
          } else {
             // Tenta pegar o ícone (pode ser <i> ou <svg> se já renderizado)
             const icon = item.querySelector("i, svg");
             if (icon) {
               const iconClone = icon.cloneNode(true);
               iconClone.style.width = "20px";
               iconClone.style.height = "20px";
               row.appendChild(iconClone);
             } else {
               row.appendChild(document.createElement("div"));
             }
             
             row.appendChild(label);
             
             // Vincula o clique do clone ao clique do original
             row.onclick = () => {
               item.click();
               toggleSidebar();
             };
          }
          
          sidebarContent.appendChild(row);
        });
      });
      createIcons({ icons, nameAttr: 'data-lucide' });
    }
  };

  mobileMenuBtn.addEventListener("click", toggleSidebar);
  closeSidebarBtn.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);
}
