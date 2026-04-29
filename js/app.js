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
import { syncHighlightScroll } from './highlight.js';

import * as ai from './ai.js';
import { THEMES, applyTheme, initThemeSystem } from './theme.js';
import { createIcons, icons } from 'lucide';

// Versão v12.7: Estabilização de Contraste e Abas
const APP_VERSION = "v15.3 Blindada Total";






const state = {
  currentDocId: null,
  openTabs: [],
  contentBeforeEdit: "",
  editorReady: false,
  saveTimeout: null,
  isSaving: false,
  aiEnabled: false,

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
  
  // Renderiza ícones Lucide (NPM style)
  if (window.lucide) {
    window.lucide.createIcons();
  } else {
    createIcons({ icons });
  }

  core.loadRuler(state.rulerLine, state.rulerColumnInput);
  



  core.loadTypewriterMode(state.editor);
  ui.initFloatingMenu(state.editor, () => state.aiEnabled);

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
    docs.switchDocument(e.target.value, state);
  });

  const aiToggle = document.getElementById("ai-toggle-switch");
  const aiActionsBtn = document.getElementById("ai-actions-btn");
  const aiStatusText = aiToggle?.parentElement?.nextElementSibling;

  if (aiToggle) {
    aiToggle.addEventListener("change", (e) => {
      state.aiEnabled = e.target.checked;
      if (aiStatusText) {
        aiStatusText.textContent = state.aiEnabled ? "IA ON" : "IA OFF";
        aiStatusText.classList.toggle("text-purple-500", state.aiEnabled);
      }
      aiActionsBtn.disabled = !state.aiEnabled;
      aiActionsBtn.classList.toggle("opacity-50", !state.aiEnabled);
      aiActionsBtn.classList.toggle("cursor-not-allowed", !state.aiEnabled);

      if (!state.aiEnabled) {
        document.getElementById("floating-ai-menu").classList.add("hidden");
      }
    });
  }


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

  document.addEventListener("click", async (e) => {
    const actionItem = e.target.closest(".ai-action-item") || (e.target.closest("#ai-actions-btn") ? { dataset: { action: "improve" } } : null);

    if (actionItem && state.aiEnabled) {
      const action = actionItem.dataset.action;
      if (action) handleAiAction(action);
      document.getElementById("floating-ai-menu").classList.add("hidden");
    }
  });

  const createNew = () => docs.createNewDocument("Novo Documento", state);

  document.getElementById("new-doc-btn").addEventListener("click", createNew);
  if (state.tabNewBtn) state.tabNewBtn.addEventListener("click", createNew);

  const emptyNewBtn = document.getElementById("empty-state-new-btn");
  if (emptyNewBtn) emptyNewBtn.addEventListener("click", createNew);

  // Tabs Events Delegation
  state.tabsBar.addEventListener("click", (e) => {
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
        saveNow();
      }
      docs.switchDocument(tab.dataset.docId, state);
    }
  });

  document.getElementById("rename-doc-btn").addEventListener("click", () => docs.renameCurrentDocument(state.currentDocId, state.docSelector));
  document.getElementById("delete-doc-btn").addEventListener("click", deleteCurrentDoc);

  document.getElementById("theme-picker-btn").addEventListener("click", openThemePicker);

  document.getElementById("tasks-close-btn").addEventListener("click", () => tasks.toggleTasksDrawer());


  document.getElementById("tasks-drawer-overlay").addEventListener("click", () => document.getElementById("tasks-close-btn").click());

  document.getElementById("find-replace-btn").addEventListener("click", () => ui.openModal(document.getElementById("find-replace-modal-overlay")));
  document.getElementById("find-replace-modal-close-btn").addEventListener("click", () => ui.closeModal(document.getElementById("find-replace-modal-overlay")));

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


  // Modais de Confirmação e Prompt
  document.getElementById("confirm-modal-cancel-btn").addEventListener("click", () => ui.closeModal(document.getElementById("confirm-modal-overlay")));
  document.getElementById("prompt-modal-cancel-btn").addEventListener("click", () => ui.closeModal(document.getElementById("prompt-modal-overlay")));

  // Submissão do Formulário de Tarefas
  const taskForm = document.getElementById("new-task-form");
  if (taskForm) {
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("new-task-input");
      if (input && input.value.trim()) {
        window.addNewTask(input.value.trim());
        input.value = "";
      }

    });
  }


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
  document.getElementById("tasks-drawer-overlay")?.addEventListener("click", () => tasks.toggleTasksDrawer());
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
  core.updateCursorPos(state.editor, state.metrics.cursorPos);
  core.updateStatusBarMetrics(state.editor, state.metrics);
  
  // Debounce de Salvamento: Aguarda 1s de inatividade para salvar
  ui.renderSaveStatus("unsaved");
  clearTimeout(state.saveTimeout);
  state.saveTimeout = setTimeout(saveNow, 1000);

  // Dispara o autocomplete com as palavras do documento + dicionário pessoal
  const text = state.editor.value;
  // Regex aprimorada: pega palavras alfanuméricas com 2+ caracteres (incluindo acentuação)
  const documentWords = [...new Set(text.match(/[\wÀ-ú]{2,}/g) || [])];
  const personalDict = dictionary.getPersonalDict();
  // Combina, remove duplicatas e remove a própria palavra que está sendo digitada (lógica interna do auto.js cuidará do resto)
  const keywords = [...new Set([...personalDict, ...documentWords])];
  auto.triggerAutocomplete(state.editor, keywords);
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
