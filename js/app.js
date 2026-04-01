/* ========================================
   EDITOR TAURUS - app.js (Módulo Principal)
   ======================================== */

import * as db from './db.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import * as core from './editorCore.js';
import * as docs from './documents.js';
import * as tabs from './tabs.js';
import * as auto from './autocomplete.js';
import * as tasks from './tasks.js';
import * as shortcuts from './shortcuts.js';
import { THEMES, applyTheme, initThemeSystem } from './theme.js';

// Estado Global da Aplicação (Encapsulado para evitar poluição)
const state = {
  currentDocId: null,
  openTabs: tabs.getOpenTabsFromStorage(),
  contentBeforeEdit: "",
  editorReady: false,
  saveTimeout: null,
  isSaving: false,
  
  // Elementos do DOM mantidos no estado para fácil acesso pelos módulos
  editor: document.getElementById("editor"),
  lineNumbers: document.getElementById("line-numbers"),
  docSelector: document.getElementById("doc-selector"),
  tabsBar: document.getElementById("tabs-bar"),
  tabNewBtn: document.getElementById("tab-new-btn"),
  rulerLine: document.getElementById("ruler-line"),
  rulerColumnInput: document.getElementById("ruler-column-input"),
  
  // Métricas do rodapé
  metrics: {
    fileSize: document.getElementById("file-size"),
    wordCount: document.getElementById("word-count"),
    charCount: document.getElementById("char-count"),
    lineCount: document.getElementById("line-count"),
    cursorPos: document.getElementById("cursor-pos")
  }
};

/**
 * Inicialização do Editor
 */
async function init() {
  const APP_VERSION = "v12";
  console.log(`Iniciando Editor Taurus ${APP_VERSION}...`);
  const versionEl = document.getElementById("app-version");
  if (versionEl) versionEl.textContent = APP_VERSION;

  // 1. Banco de Dados e Documentos
  const allDocs = await docs.loadDocumentsList(state.docSelector);
  
  // 2. Recuperar último estado
  const lastDocId = localStorage.getItem("lastDocId") || (allDocs.length > 0 ? allDocs[0].id : null);
  
  // Se não houver nenhum documento no banco, cria o primeiro
  if (allDocs.length === 0) {
    await docs.createNewDocument("Primeiro Documento", state);
  } else {
    await docs.switchDocument(lastDocId, state);
  }

  // 3. Subsistemas
  initThemeSystem(openThemePicker);
  tasks.initTasksSystem();
  auto.initAutocomplete();
  core.loadRulerPosition(state.rulerColumnInput, state.rulerLine);
  core.loadTypewriterMode(state.editor);
  
  // 4. Atalhos e Eventos
  setupEventListeners();
  state.editorReady = true;

  // 5. PWA Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.error(err));
  }
  
  // Finaliza UI
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Configuração de Listeners (Interface principal)
 */
function setupEventListeners() {
  // Mudança de documento (Dropdown)
  state.docSelector.addEventListener("change", (e) => docs.switchDocument(e.target.value, state));
  
  // Botões da Toolbar
  document.getElementById("new-doc-btn").addEventListener("click", () => docs.createNewDocument("Novo Documento", state));
  document.getElementById("rename-doc-btn").addEventListener("click", () => docs.renameCurrentDocument(state.currentDocId, state.docSelector));
  document.getElementById("delete-doc-btn").addEventListener("click", deleteCurrentDoc);
  document.getElementById("typewriter-btn").addEventListener("click", () => core.toggleTypewriterMode(state.editor));
  document.getElementById("ruler-toggle-btn").addEventListener("click", () => state.rulerLine.classList.toggle("hidden"));
  state.rulerColumnInput.addEventListener("input", () => core.updateRulerPosition(state.rulerColumnInput, state.rulerLine));
  
  // Botões de Abas
  state.tabNewBtn.addEventListener("click", () => docs.createNewDocument("Novo Documento", state));
  document.getElementById("empty-state-new-btn").addEventListener("click", () => docs.createNewDocument("Novo Documento", state));

  // Eventos do Editor
  state.editor.addEventListener("input", handleEditorInput);
  state.editor.addEventListener("keydown", handleKeyDown);
  state.editor.addEventListener("scroll", () => {
    state.lineNumbers.scrollTop = state.editor.scrollTop;
  });

  // Atalhos de Teclado
  shortcuts.initShortcuts(state.editor, {
    save: () => saveNow(),
    new: () => docs.createNewDocument("Novo Documento", state),
    find: () => ui.openModal(document.getElementById("find-replace-modal-overlay")),
    isAutocompleteOpen: () => !document.getElementById("autocomplete-popup").classList.contains("hidden")
  });

  // Delegate para fechar abas (evita múltiplos listeners)
  state.tabsBar.addEventListener("click", (e) => {
    const closeBtn = e.target.closest(".tab-close-btn");
    if (closeBtn) {
      e.stopPropagation();
      window.closeTab(closeBtn.dataset.docId);
    }
  });
}

/**
 * Lógica de Input do Editor (Auto-save e UI)
 */
function handleEditorInput() {
  core.updateLineNumbers(state.editor, state.lineNumbers);
  core.updateStatusBarMetrics(state.editor, state.metrics);
  auto.triggerAutocomplete(state.editor, []); // Array de keywords vazio por enquanto
  
  // Debounce do Auto-Save
  clearTimeout(state.saveTimeout);
  ui.renderSaveStatus("unsaved");
  state.saveTimeout = setTimeout(saveNow, 1500);
}

function handleKeyDown(e) {
  // Deixa o autocomplete lidar com as teclas dele primeiro
  if (auto.handleAutocompleteKeys(e, state.editor)) return;
  core.updateCursorPos(state.editor, state.metrics.cursorPos);
}

async function saveNow() {
  if (!state.currentDocId || state.isSaving) return;
  state.isSaving = true;
  
  const doc = await db.getDoc(state.currentDocId);
  if (doc) {
    doc.content = state.editor.value;
    doc.updatedAt = Date.now();
    await db.saveDoc(doc);
    ui.renderSaveStatus("saved");
  }
  state.isSaving = false;
}

// Funções expostas globalmente para compatibilidade com botões HTML legados ou dinâmicos
window.closeTab = async function(docId) {
  if (state.currentDocId === docId && state.saveTimeout) {
    clearTimeout(state.saveTimeout);
    await saveNow();
  }
  state.openTabs = state.openTabs.filter(id => id !== docId);
  tabs.saveOpenTabs(state.openTabs);
  
  if (state.currentDocId === docId) {
    if (state.openTabs.length > 0) {
      docs.switchDocument(state.openTabs[state.openTabs.length - 1], state);
    } else {
      docs.switchDocument(null, state);
    }
  } else {
    tabs.renderTabs(state.tabsBar, state.openTabs, state.currentDocId, db, state.tabNewBtn);
  }
};

async function deleteCurrentDoc() {
  if (!state.currentDocId) return;
  const confirmed = await utils.customConfirm("Excluir", "Apagar este documento?");
  if (confirmed) {
    const id = state.currentDocId;
    await db.deleteDocById(id);
    window.closeTab(id);
    docs.loadDocumentsList(state.docSelector);
  }
}

function openThemePicker() {
  const grid = document.getElementById("theme-cards-grid");
  const activeId = localStorage.getItem("selectedTheme") || "taurus";
  
  grid.innerHTML = THEMES.map(t => {
    const isActive = t.id === activeId;
    return `
      <button class="theme-card ${isActive ? 'active' : ''} bg-slate-100 dark:bg-slate-700/50 text-left w-full p-2 rounded-md" data-theme-id="${t.id}">
        <div class="text-xs font-semibold text-center mb-1">${t.name}</div>
        <div class="h-8 rounded" style="background:${t.editorBg}"></div>
      </button>`;
  }).join("");

  grid.querySelectorAll(".theme-card").forEach(card => {
    card.addEventListener("click", () => {
      applyTheme(card.dataset.themeId);
      ui.closeModal(document.getElementById("theme-modal-overlay"));
    });
  });

  ui.openModal(document.getElementById("theme-modal-overlay"));
}

// Inicia aplicação
document.addEventListener("DOMContentLoaded", init);
