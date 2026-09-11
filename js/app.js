/* ========================================
   EDITOR TAURUS - app.js (Módulo Principal)
   ======================================== */

import '../css/main.css';
import * as db from './db.js';


import * as ui from './ui.js';
import * as utils from './utils.js';
import * as core from './editorCore.js';
import * as docs from './documents.js';
import * as tabs from './tabs.js';
import * as auto from './autocomplete.js';
import * as tasks from './tasks.js';
import * as dictionary from './dictionary.js';
import * as shortcuts from './shortcuts.js';
import { navigateSearchMatch, syncHighlightScroll, updateSearchHighlight } from './highlight.js';

import * as backupManager from './backupManager.js';

import { THEMES, applyTheme, initThemeSystem } from './theme.js';
import { createIcons, icons } from 'lucide';

// Versão v17.0: Backup Diário Inteligente & Escudo de Fechamento
const APP_VERSION = "v17.0 Pro - Backup Diário Inteligente";
const AUTOCOMPLETE_SCAN_LIMIT = 100_000;






const state = {
  currentDocId: null,
  openTabs: [],
  contentBeforeEdit: "",
  editorReady: false,
  saveTimeout: null,
  isSaving: false,

  // Referências que serão preenchidas no init
  editor: null,
  lineNumbers: null,
  docSelector: null,
  tabsBar: null,
  tabNewBtn: null,
  rulerLine: null,
  rulerColumnInput: null,

  metrics: {
    fileSize: null,
    wordCount: null,
    charCount: null,
    lineCount: null,
    cursorPos: null
  }
};

export async function init() {
  // Inicializa estado de abas ANTES de trocar de documento para evitar duplicidade
  state.openTabs = tabs.getOpenTabsFromStorage();
  
  console.log(`Iniciando Editor Taurus ${APP_VERSION}...`);




  // Mapeamento de Elementos
  state.editor = document.getElementById("editor");
  state.lineNumbers = document.getElementById("line-numbers");
  state.docSelector = document.getElementById("doc-selector");
  state.tabsBar = document.getElementById("tabs-bar");
  state.tabNewBtn = document.getElementById("tab-new-btn");
  state.rulerLine = document.getElementById("ruler-line");
  state.rulerColumnInput = document.getElementById("ruler-column-input");

  state.metrics.fileSize = document.getElementById("file-size");
  state.metrics.wordCount = document.getElementById("word-count");
  state.metrics.charCount = document.getElementById("char-count");
  state.metrics.lineCount = document.getElementById("line-count");
  state.metrics.cursorPos = document.getElementById("cursor-pos");

  const versionEl = document.getElementById("app-version");
  if (versionEl) versionEl.textContent = APP_VERSION;


  state.openTabs = tabs.getOpenTabsFromStorage();
  const allDocs = await docs.loadDocumentsList(state.docSelector);
  const lastDocId = localStorage.getItem("lastDocId") || (allDocs.length > 0 ? allDocs[0].id : null);

  if (allDocs.length === 0) {
    await docs.createNewDocument("Primeiro Documento", state);
  } else {
    await docs.switchDocument(lastDocId, state);
  }

  initThemeSystem(openThemePicker);
  tasks.initTasksSystem();
  dictionary.initDictionary();
  auto.initAutocomplete();
  ui.initResponsiveSidebar();
  initZenMode();
  await backupManager.initBackupManager();
  
  // Renderiza ícones Lucide (NPM style)
  if (window.lucide) {
    window.lucide.createIcons();
  } else {
    createIcons({ icons });
  }

  core.loadRuler(state.rulerLine, state.rulerColumnInput);
  



  core.loadTypewriterMode(state.editor);

  // A inicialização de atalhos foi movida para o final do setup para garantir que todas as ações estejam prontas

  setupEventListeners();
  state.editorReady = true;

  
}

function setupEventListeners() {
  state.docSelector.addEventListener("change", async (e) => {
    if (state.saveTimeout) {
      clearTimeout(state.saveTimeout);
      await saveNow();
    }
    await docs.switchDocument(e.target.value, state);
  });

  const createNew = () => docs.createNewDocument("Novo Documento", state);

  document.getElementById("new-doc-btn").addEventListener("click", createNew);
  if (state.tabNewBtn) state.tabNewBtn.addEventListener("click", createNew);

  const emptyNewBtn = document.getElementById("empty-state-new-btn");
  if (emptyNewBtn) emptyNewBtn.addEventListener("click", createNew);

  // Tabs Events Delegation
  state.tabsBar.addEventListener("click", async (e) => {
    const tab = e.target.closest(".document-tab");
    const closeBtn = e.target.closest(".tab-close-btn");

    if (closeBtn) {
      e.stopPropagation();
      window.closeTab(closeBtn.dataset.docId);
      return;
    }

    if (tab) {
      if (state.saveTimeout) {
        clearTimeout(state.saveTimeout);
        state.saveTimeout = null;
      }
      // Força o salvamento antes de trocar, caso o editor não esteja bloqueado
      if (state.currentDocId && !state.editor.disabled && state.editor.value !== "Carregando...") {
      await docs.updateDocument(state.currentDocId, state.editor.value);
      }
      
      await docs.switchDocument(tab.dataset.docId, state);
    }
  });

  document.getElementById("rename-doc-btn").addEventListener("click", () => docs.renameCurrentDocument(state.currentDocId, state.docSelector));
  document.getElementById("delete-doc-btn").addEventListener("click", deleteCurrentDoc);

  document.getElementById("theme-picker-btn").addEventListener("click", openThemePicker);

  document.getElementById("tasks-close-btn").addEventListener("click", () => tasks.toggleTasksDrawer());


  document.getElementById("tasks-drawer-overlay").addEventListener("click", () => document.getElementById("tasks-close-btn").click());

  document.getElementById("find-replace-btn").addEventListener("click", () => ui.openModal(document.getElementById("find-replace-modal-overlay")));
  document.getElementById("find-replace-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("find-replace-modal-overlay")));
  const findInput = document.getElementById("find-input");
  findInput.addEventListener("input", () => updateSearchHighlight(state.editor, findInput.value));
  findInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") navigateSearchMatch(state.editor, event.shiftKey ? -1 : 1);
  });
  document.getElementById("replace-btn").addEventListener("click", () => replaceNextMatch());
  document.getElementById("replace-all-btn").addEventListener("click", () => replaceAllMatches());

  document.getElementById("goto-line-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("goto-line-modal-overlay")));
  document.getElementById("goto-line-ok-btn").addEventListener("click", () => goToLine());

  document.getElementById("show-shortcuts-btn").addEventListener("click", () => ui.openModal(document.getElementById("shortcuts-modal-overlay")));
  document.getElementById("shortcuts-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("shortcuts-modal-overlay")));

  document.getElementById("help-btn").addEventListener("click", () => ui.openModal(document.getElementById("help-modal-overlay")));
  document.getElementById("guide-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("help-modal-overlay")));
  document.getElementById("help-close-guide-btn").addEventListener("click", () => ui.closeModal(document.getElementById("help-modal-overlay")));

  document.getElementById("personal-dict-btn").addEventListener("click", () => {
    dictionary.renderPersonalDictWords();
    ui.openModal(document.getElementById("personal-dict-modal-overlay"));
  });
  document.getElementById("personal-dict-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("personal-dict-modal-overlay")));


  document.getElementById("theme-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("theme-modal-overlay")));

  // Eventos do Modal de Ações Múltiplas (Ctrl+M)
  document.getElementById("multi-actions-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("multi-actions-modal-overlay")));
  document.getElementById("multi-cancel-btn").addEventListener("click", () => ui.closeModal(document.getElementById("multi-actions-modal-overlay")));

  document.getElementById("multi-replace-btn").addEventListener("click", () => applyMultiAction("replace"));
  document.getElementById("multi-uppercase-btn").addEventListener("click", () => applyMultiAction("uppercase"));
  document.getElementById("multi-lowercase-btn").addEventListener("click", () => applyMultiAction("lowercase"));
  document.getElementById("multi-delete-btn").addEventListener("click", () => applyMultiAction("delete"));

  // Clique no Badge Azul para abrir ações múltiplas
  document.getElementById("multi-selection-indicator")?.addEventListener("click", () => {
    const { selections } = shortcuts.getMultiSelections();
    if (selections.length > 0) {
      document.getElementById("multi-selection-count").textContent = `${selections.length} selecionadas`;
      ui.openModal(document.getElementById("multi-actions-modal-overlay"));
    }
  });


  // Eventos do Modal de Backup Diário
  document.getElementById("daily-backup-btn")?.addEventListener("click", () => {
    backupManager.updateBackupUI();
    ui.openModal(document.getElementById("daily-backup-modal-overlay"));
  });
  document.getElementById("daily-backup-modal-close-btn")?.addEventListener("click", () => ui.closeModal(document.getElementById("daily-backup-modal-overlay")));
  document.getElementById("select-backup-folder-btn")?.addEventListener("click", async () => {
    await backupManager.selectBackupFolder();
    const { folderName } = backupManager.getBackupStatus();
    const folderEl = document.getElementById("modal-backup-folder-path");
    if (folderEl) folderEl.textContent = folderName;
  });
  document.getElementById("run-daily-backup-btn")?.addEventListener("click", async () => {
    const success = await backupManager.performDailyBackup();
    if (success) {
      ui.closeModal(document.getElementById("daily-backup-modal-overlay"));
    }
  });

  document.getElementById("export-db-btn").addEventListener("click", () => db.exportAllDocs());

  const importInput = document.getElementById("import-db-input");
  document.getElementById("import-db-btn").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (e) => {
    if (e.target.files.length > 0) {
      try {
        const count = await db.importDocs(e.target.files[0]);
        ui.showMessage(`${count} documentos restaurados com sucesso!`, "success");
        await docs.loadDocumentsList(state.docSelector);
      } catch (err) {
        ui.showMessage("Erro ao importar backup: " + err.message, "error");
      }
      e.target.value = "";
    }
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    if (!state.currentDocId) return;
    const text = state.editor.value;
    const btn = document.getElementById("doc-selector");
    const name = btn.options[btn.selectedIndex]?.text || "documento";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("tasks-btn")?.addEventListener("click", () => tasks.toggleTasksDrawer());
  document.getElementById("typewriter-btn").addEventListener("click", () => core.toggleTypewriterMode(state.editor));
  document.getElementById("ruler-toggle-btn").addEventListener("click", () => core.toggleRuler(state.rulerLine));
  
  state.rulerColumnInput.addEventListener("change", () => core.updateRulerPosition(state.rulerColumnInput, state.rulerLine));

  state.editor.addEventListener("input", handleEditorInput);
  state.editor.addEventListener("scroll", () => {
    state.lineNumbers.scrollTop = state.editor.scrollTop;
    syncHighlightScroll(state.editor);
  });

  shortcuts.initShortcuts(state.editor, {
    save: () => saveNow(),
    new: () => docs.createNewDocument("Novo Documento", state),
    find: () => ui.openModal(document.getElementById("find-replace-modal-overlay")),
    goto: () => ui.openModal(document.getElementById("goto-line-modal-overlay")),
    zen: () => toggleZenMode(),
    isAutocompleteOpen: () => !document.getElementById("autocomplete-popup").classList.contains("hidden"),
    openMultiActions: () => {
      const { selections } = shortcuts.getMultiSelections();
      document.getElementById("multi-selection-count").textContent = `${selections.length} selecionadas`;
      ui.openModal(document.getElementById("multi-actions-modal-overlay"));
    },
    onInput: () => handleEditorInput()
  });

  // Aceitar sugestão do autocomplete via evento customizado
  window.addEventListener('accept-autocomplete', (e) => {
    auto.acceptAutocomplete(state.editor, e.detail);
    handleEditorInput();
  });
}

function replaceNextMatch() {
  const findInput = document.getElementById("find-input");
  const replaceInput = document.getElementById("replace-input");
  const term = findInput.value;
  if (!term) return;

  const text = state.editor.value;
  let index = text.indexOf(term, state.editor.selectionEnd);
  if (index === -1) index = text.indexOf(term);
  if (index === -1) return;

  state.editor.value = text.slice(0, index) + replaceInput.value + text.slice(index + term.length);
  state.editor.setSelectionRange(index, index + replaceInput.value.length);
  handleEditorInput();
  updateSearchHighlight(state.editor, term);
}

function replaceAllMatches() {
  const findInput = document.getElementById("find-input");
  const replaceInput = document.getElementById("replace-input");
  const term = findInput.value;
  if (!term || !state.editor.value.includes(term)) return;

  state.editor.value = state.editor.value.split(term).join(replaceInput.value);
  handleEditorInput();
  updateSearchHighlight(state.editor, term);
}

function goToLine() {
  const input = document.getElementById("goto-line-input");
  const requestedLine = Math.max(1, Number.parseInt(input.value, 10) || 1);
  const text = state.editor.value;
  let position = 0;
  let currentLine = 1;

  while (currentLine < requestedLine) {
    const nextBreak = text.indexOf("\n", position);
    if (nextBreak === -1) break;
    position = nextBreak + 1;
    currentLine++;
  }

  state.editor.focus();
  state.editor.setSelectionRange(position, position);
  core.updateCursorPos(state.editor, state.metrics.cursorPos);
  ui.closeModal(document.getElementById("goto-line-modal-overlay"));
}

function handleEditorInput() {
  backupManager.markEditPerformed();

  core.updateLineNumbers(state.editor, state.lineNumbers);
  core.updateCursorPos(state.editor, state.metrics.cursorPos);
  clearTimeout(state.metricsTimeout);
  state.metricsTimeout = setTimeout(() => {
    core.updateStatusBarMetrics(state.editor, state.metrics);
  }, 150);
  
  // Debounce de Salvamento: Aguarda 1s de inatividade para salvar
  ui.renderSaveStatus("unsaved");
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(saveNow, 1000);

  // Limita a varredura para manter a digitação responsiva em arquivos grandes.
  clearTimeout(state.autoTimeout);
  state.autoTimeout = setTimeout(() => {
    const text = state.editor.value;
    const cursor = state.editor.selectionStart;
    const start = Math.max(0, cursor - AUTOCOMPLETE_SCAN_LIMIT);
    const end = Math.min(text.length, cursor + AUTOCOMPLETE_SCAN_LIMIT);
    const documentWords = [...new Set(text.slice(start, end).match(/[\wÀ-ú]{2,}/g) || [])];
    const personalDict = dictionary.getPersonalDict();
    const keywords = [...new Set([...personalDict, ...documentWords])];
    auto.triggerAutocomplete(state.editor, keywords);
  }, 200);
}






/**
 * Alterna o Modo Zen (Esconde Barra de Ferramentas)
 */
function toggleZenMode() {
  const isZen = document.body.classList.toggle("zen-mode");
  
  // Atualiza ícones do botão flutuante e do botão da toolbar
  const maxIcon = document.getElementById("zen-icon-maximize");
  const minIcon = document.getElementById("zen-icon-minimize");
  
  if (maxIcon && minIcon) {
    if (isZen) {
      maxIcon.classList.add("hidden");
      minIcon.classList.remove("hidden");
    } else {
      maxIcon.classList.remove("hidden");
      minIcon.classList.add("hidden");
    }
  }

  if (isZen) {
    ui.showMessage("Modo Zen: Alt+Z para voltar", "info");
  } else {
    ui.showMessage("Barra de Ferramentas Restaurada", "info");
  }
}


function initZenMode() {
  const floatingBtn = document.getElementById("zen-floating-btn");
  const toolbarBtn = document.getElementById("zen-mode-btn");
  
  if (floatingBtn) {
    floatingBtn.addEventListener("click", (e) => {
      // Se houve movimento significativo, não dispara o clique (apenas arrastou)
      if (floatingBtn.dataset.dragged === "true") {
        floatingBtn.dataset.dragged = "false";
        return;
      }
      toggleZenMode();
    });
    
    // Recupera posição salva
    const savedPos = JSON.parse(localStorage.getItem("zen-btn-pos") || "null");
    if (savedPos) {
      floatingBtn.style.left = savedPos.x + "px";
      floatingBtn.style.top = savedPos.y + "px";
      floatingBtn.style.bottom = "auto";
      floatingBtn.style.right = "auto";
    }

    makeDraggable(floatingBtn);
  }
  if (toolbarBtn) toolbarBtn.addEventListener("click", toggleZenMode);
}

/**
 * Torna um elemento arrastável de forma fluida
 */
function makeDraggable(el) {
  let offsetX = 0, offsetY = 0;
  
  el.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Calcula onde o mouse clicou dentro do botão
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    el.dataset.dragged = "false";
    el.dataset.startX = e.clientX;
    el.dataset.startY = e.clientY;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    
    // Verifica se houve movimento para não disparar o clique acidentalmente
    const startX = parseFloat(el.dataset.startX);
    const startY = parseFloat(el.dataset.startY);
    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
      el.dataset.dragged = "true";
    }

    // Posiciona o botão exatamente onde o mouse está
    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;
    
    // Mantém dentro dos limites da tela
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    
    el.style.left = Math.max(0, Math.min(newLeft, maxX)) + "px";
    el.style.top = Math.max(0, Math.min(newTop, maxY)) + "px";
    el.style.bottom = "auto";
    el.style.right = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    
    // Salva a posição final
    localStorage.setItem("zen-btn-pos", JSON.stringify({
      x: el.offsetLeft,
      y: el.offsetTop
    }));
  }
}


async function saveNow() {
  if (!state.currentDocId || !state.editorReady) return;

  // 🛡️ TRAVA DE SEGURANÇA: Não salvar se o editor estiver carregando ou desabilitado
  if (state.editor.disabled || state.editor.value === "Carregando...") {
    console.warn("Salvamento abortado: Editor em estado de transição.");
    return;
  }

  ui.renderSaveStatus("saving");

  const contentToSave = state.editor.value;
  await docs.updateDocument(state.currentDocId, contentToSave);
  state.isSaving = false;
  ui.renderSaveStatus("saved");
}

/**
 * Aplica uma ação (Substituir, Upper, Lower, Delete) em todas as seleções múltiplas
 */
function applyMultiAction(type) {
  const { selections, term } = shortcuts.getMultiSelections();
  if (selections.length === 0) {
    ui.showMessage("Nenhuma seleção ativa!", "info");
    return;
  }

  let text = state.editor.value;
  const newTextVal = document.getElementById("multi-replace-input").value || "";

  // Ordena do fim para o início para não quebrar os índices conforme substitui
  const sortedSeqs = [...selections].sort((a, b) => b - a);

  sortedSeqs.forEach(idx => {
    let replacement = "";
    if (type === "replace") replacement = newTextVal;
    else if (type === "uppercase") replacement = term.toUpperCase();
    else if (type === "lowercase") replacement = term.toLowerCase();
    else if (type === "delete") replacement = "";

    text = text.substring(0, idx) + replacement + text.substring(idx + term.length);
  });

  state.editor.value = text;
  shortcuts.clearMultiSelectionsPublic(state.editor);
  ui.closeModal(document.getElementById("multi-actions-modal-overlay"));
  handleEditorInput();
  ui.showMessage(`${sortedSeqs.length} ocorrências processadas!`, "success");
}

function openThemePicker() {
  const grid = document.getElementById("theme-cards-grid");
  const activeId = localStorage.getItem("selectedTheme") || "taurus";
  grid.innerHTML = THEMES.map(t => `<button class="theme-card ${t.id === activeId ? 'active' : ''} bg-slate-100 dark:bg-slate-700/50 text-left w-full p-2 rounded-md" data-theme-id="${t.id}"><div class="text-xs font-semibold text-center mb-1">${t.name}</div><div class="h-8 rounded" style="background:${t.editorBg}"></div></button>`).join("");
  grid.querySelectorAll(".theme-card").forEach(card => card.addEventListener("click", () => { applyTheme(card.dataset.themeId); ui.closeModal(document.getElementById("theme-modal-overlay")); }));
  ui.openModal(document.getElementById("theme-modal-overlay"));
}

window.closeTab = async function (docId) {
  if (state.currentDocId === docId && state.saveTimeout) { clearTimeout(state.saveTimeout); await saveNow(); }
  state.openTabs = state.openTabs.filter(id => id !== docId);
  tabs.saveOpenTabs(state.openTabs);
  if (state.currentDocId === docId) { if (state.openTabs.length > 0) docs.switchDocument(state.openTabs[state.openTabs.length - 1], state); else docs.switchDocument(null, state); }
  else { tabs.renderTabs(state.tabsBar, state.openTabs, state.currentDocId, db, state.tabNewBtn); }
};

async function deleteCurrentDoc() {
  if (!state.currentDocId) return;
  const confirmed = await utils.customConfirm("Excluir", "Apagar este documento?");
  if (confirmed) { const id = state.currentDocId; await db.deleteDocById(id); window.closeTab(id); docs.loadDocumentsList(state.docSelector); }
}

document.addEventListener("DOMContentLoaded", init);
