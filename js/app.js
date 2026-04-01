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
import * as ai from './ai.js';
import { THEMES, applyTheme, initThemeSystem } from './theme.js';

// Estado Global da Aplicação
const state = {
  currentDocId: null,
  openTabs: tabs.getOpenTabsFromStorage(),
  contentBeforeEdit: "",
  editorReady: false,
  saveTimeout: null,
  isSaving: false,
  aiEnabled: false,
  
  // Elementos do DOM
  editor: document.getElementById("editor"),
  lineNumbers: document.getElementById("line-numbers"),
  docSelector: document.getElementById("doc-selector"),
  tabsBar: document.getElementById("tabs-bar"),
  tabNewBtn: document.getElementById("tab-new-btn"),
  rulerLine: document.getElementById("ruler-line"),
  rulerColumnInput: document.getElementById("ruler-column-input"),
  
  metrics: {
    fileSize: document.getElementById("file-size"),
    wordCount: document.getElementById("word-count"),
    charCount: document.getElementById("char-count"),
    lineCount: document.getElementById("line-count"),
    cursorPos: document.getElementById("cursor-pos")
  }
};

/**
 * Inicialização
 */
async function init() {
  const APP_VERSION = "v12.5";
  console.log(`Iniciando Editor Taurus ${APP_VERSION}...`);
  const versionEl = document.getElementById("app-version");
  if (versionEl) versionEl.textContent = APP_VERSION;

  const allDocs = await docs.loadDocumentsList(state.docSelector);
  const lastDocId = localStorage.getItem("lastDocId") || (allDocs.length > 0 ? allDocs[0].id : null);
  
  if (allDocs.length === 0) {
    await docs.createNewDocument("Primeiro Documento", state);
  } else {
    await docs.switchDocument(lastDocId, state);
  }

  initThemeSystem(openThemePicker);
  tasks.initTasksSystem();
  auto.initAutocomplete();
  core.loadRulerPosition(state.rulerColumnInput, state.rulerLine);
  core.loadTypewriterMode(state.editor);
  ui.initFloatingMenu(state.editor, () => state.aiEnabled);
  
  setupEventListeners();
  state.editorReady = true;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => console.error(err));
  }
}

/**
 * Eventos
 */
function setupEventListeners() {
  state.docSelector.addEventListener("change", (e) => docs.switchDocument(e.target.value, state));
  
  // Toolbar AI
  const aiToggle = document.getElementById("ai-toggle-switch");
  const aiActionsBtn = document.getElementById("ai-actions-btn");
  const aiStatusText = aiToggle.parentElement.nextElementSibling;

  aiToggle.addEventListener("change", (e) => {
    state.aiEnabled = e.target.checked;
    aiStatusText.textContent = state.aiEnabled ? "IA ON" : "IA OFF";
    aiStatusText.classList.toggle("text-purple-500", state.aiEnabled);
    aiActionsBtn.disabled = !state.aiEnabled;
    aiActionsBtn.classList.toggle("opacity-50", !state.aiEnabled);
    aiActionsBtn.classList.toggle("cursor-not-allowed", !state.aiEnabled);
    
    if (!state.aiEnabled) {
       document.getElementById("floating-ai-menu").classList.add("hidden");
    }
  });

  document.getElementById("ai-config-btn").addEventListener("click", () => {
    document.getElementById("openai-key-input").value = ai.getApiKey();
    ui.openModal(document.getElementById("ai-config-modal-overlay"));
  });

  document.getElementById("ai-modal-close-btn").addEventListener("click", () => {
    ui.closeModal(document.getElementById("ai-config-modal-overlay"));
  });

  document.getElementById("save-ai-key-btn").addEventListener("click", () => {
    const key = document.getElementById("openai-key-input").value.trim();
    if (key.startsWith("sk-")) {
      ai.setApiKey(key);
      ui.showMessage("Chave OpenAI salva com sucesso!", "success");
      ui.closeModal(document.getElementById("ai-config-modal-overlay"));
    } else {
      ui.showMessage("Chave inválida! Deve começar com 'sk-'", "error");
    }
  });

  // Ações de IA (Event Delegation para Menu Flutuante e Toolbar)
  document.addEventListener("click", async (e) => {
    const actionItem = e.target.closest(".ai-action-item") || (e.target.closest("#ai-actions-btn") ? { dataset: { action: "improve" } } : null);
    
    if (actionItem && state.aiEnabled) {
      const action = actionItem.dataset.action;
      if (action) handleAiAction(action);
      document.getElementById("floating-ai-menu").classList.add("hidden");
    }
  });

  // Outros botões...
  document.getElementById("new-doc-btn").addEventListener("click", () => docs.createNewDocument("Novo Documento", state));
  document.getElementById("rename-doc-btn").addEventListener("click", () => docs.renameCurrentDocument(state.currentDocId, state.docSelector));
  document.getElementById("delete-doc-btn").addEventListener("click", deleteCurrentDoc);
  
  state.editor.addEventListener("input", handleEditorInput);
  state.editor.addEventListener("scroll", () => {
    state.lineNumbers.scrollTop = state.editor.scrollTop;
  });

  shortcuts.initShortcuts(state.editor, {
    save: () => saveNow(),
    new: () => docs.createNewDocument("Novo Documento", state),
    find: () => ui.openModal(document.getElementById("find-replace-modal-overlay")),
    isAutocompleteOpen: () => !document.getElementById("autocomplete-popup").classList.contains("hidden")
  });
}

/**
 * Lógica das Ações de IA
 */
async function handleAiAction(action) {
  if (!ai.getApiKey()) {
    ui.showMessage("Configure sua API Key primeiro!", "error");
    return;
  }

  const start = state.editor.selectionStart;
  const end = state.editor.selectionEnd;
  const selectedText = state.editor.value.substring(start, end).trim();

  if (!selectedText) {
    ui.showMessage("Selecione um texto para a magia funcionar! ✨", "info");
    return;
  }

  ui.showMessage("Processando IA... 🪄", "info");
  state.editor.classList.add("animate-pulse", "opacity-70");

  try {
    let result = "";
    if (action === "improve") result = await ai.improveText(selectedText);
    else if (action === "summarize") result = await ai.summarizeText(selectedText);
    else if (action === "tone-formal") result = await ai.changeTone(selectedText, "formal");
    else if (action === "tone-informal") result = await ai.changeTone(selectedText, "informal");

    if (result) {
      const before = state.editor.value.substring(0, start);
      const after = state.editor.value.substring(end);
      state.editor.value = before + result + after;
      state.editor.selectionStart = start;
      state.editor.selectionEnd = start + result.length;
      handleEditorInput();
      ui.showMessage("Magia concluída! ✨", "success");
    }
  } catch (err) {
    ui.showMessage(err.message, "error");
  } finally {
    state.editor.classList.remove("animate-pulse", "opacity-70");
  }
}

function handleEditorInput() {
  core.updateLineNumbers(state.editor, state.lineNumbers);
  core.updateStatusBarMetrics(state.editor, state.metrics);
  clearTimeout(state.saveTimeout);
  ui.renderSaveStatus("unsaved");
  state.saveTimeout = setTimeout(saveNow, 1500);
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

function openThemePicker() {
  // ... (mesmo do app.js anterior)
  const grid = document.getElementById("theme-cards-grid");
  const activeId = localStorage.getItem("selectedTheme") || "taurus";
  grid.innerHTML = THEMES.map(t => `<button class="theme-card ${t.id === activeId ? 'active' : ''} bg-slate-100 dark:bg-slate-700/50 text-left w-full p-2 rounded-md" data-theme-id="${t.id}"><div class="text-xs font-semibold text-center mb-1">${t.name}</div><div class="h-8 rounded" style="background:${t.editorBg}"></div></button>`).join("");
  grid.querySelectorAll(".theme-card").forEach(card => card.addEventListener("click", () => { applyTheme(card.dataset.themeId); ui.closeModal(document.getElementById("theme-modal-overlay")); }));
  ui.openModal(document.getElementById("theme-modal-overlay"));
}

window.closeTab = async function(docId) {
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
