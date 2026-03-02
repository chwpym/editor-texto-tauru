/* ========================================
   EDITOR TAURUS - app.js
   Lógica principal do editor de texto
   ======================================== */

/* --- Custom Dialogs (Replace Prompt/Confirm) --- */
function customConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("confirm-modal-overlay");
    const titleEl = document.getElementById("confirm-modal-title");
    const messageEl = document.getElementById("confirm-modal-message");
    const okBtn = document.getElementById("confirm-modal-ok-btn");
    const cancelBtn = document.getElementById("confirm-modal-cancel-btn");

    titleEl.textContent = title;
    messageEl.textContent = message;
    overlay.classList.add("show");

    const handleOk = () => {
      overlay.classList.remove("show");
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      overlay.classList.remove("show");
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
    };

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
  });
}

function customPrompt(title, message, defaultValue = "") {
  return new Promise((resolve) => {
    const overlay = document.getElementById("prompt-modal-overlay");
    const titleEl = document.getElementById("prompt-modal-title");
    const messageEl = document.getElementById("prompt-modal-message");
    const inputEl = document.getElementById("prompt-modal-input");
    const okBtn = document.getElementById("prompt-modal-ok-btn");
    const cancelBtn = document.getElementById("prompt-modal-cancel-btn");

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = defaultValue;
    overlay.classList.add("show");

    // Foco automático no input
    setTimeout(() => inputEl.focus(), 100);

    const handleOk = () => {
      const val = inputEl.value;
      overlay.classList.remove("show");
      cleanup();
      resolve(val);
    };
    const handleCancel = () => {
      overlay.classList.remove("show");
      cleanup();
      resolve(null);
    };
    const cleanup = () => {
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      inputEl.removeEventListener("keydown", handleKey);
    };
    const handleKey = (e) => {
      if (e.key === "Enter") handleOk();
      if (e.key === "Escape") handleCancel();
    };

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    inputEl.addEventListener("keydown", handleKey);
  });
}

/* --- IndexedDB Helper --- */
const DB_NAME = "editor-codigo-db";
const STORE_NAME = "documents";
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function getAllDocs() {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function getDoc(id) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

function saveDoc(doc) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

function deleteDocById(id) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  });
}

/* --- Funções de Tema --- */
function loadTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeBtn = document.getElementById('toggle-mode-btn');
  if (!themeBtn) return;

  const icon = themeBtn.querySelector('i');
  if (!icon) return;

  const isDark = document.documentElement.classList.contains('dark');

  // Atualiza o ícone
  icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  lucide.createIcons();
}

/* --- DOM Elements --- */
const editor = document.getElementById("editor");
const saveStatus = document.getElementById("save-status");
const fileSizeEl = document.getElementById("file-size");
const wordCountEl = document.getElementById("word-count");
const charCountEl = document.getElementById("char-count");
const lineCountEl = document.getElementById("line-count");
const cursorPosEl = document.getElementById("cursor-pos");
const toggleModeBtn = document.getElementById("toggle-mode-btn");
const rulerColumnInput = document.getElementById("ruler-column-input");
const rulerLine = document.getElementById("ruler-line");
const docSelector = document.getElementById("doc-selector");
const newDocBtn = document.getElementById("new-doc-btn");
const deleteDocBtn = document.getElementById("delete-doc-btn");
const downloadBtn = document.getElementById("download-btn");
const userIdDisplay = document.getElementById("user-id-display");
const messageBox = document.getElementById("message-box");
const showShortcutsBtn = document.getElementById("show-shortcuts-btn");
const findReplaceBtn = document.getElementById("find-replace-btn");
const shortcutsModalOverlay = document.getElementById("shortcuts-modal-overlay");
const findReplaceModalOverlay = document.getElementById("find-replace-modal-overlay");
const multiActionsModalOverlay = document.getElementById("multi-actions-modal-overlay");
const multiSelectionIndicator = document.getElementById("multi-selection-indicator");
const multiSelectionText = document.getElementById("multi-selection-text");
const lineNumbers = document.getElementById("line-numbers");

let currentDocId = null;
let saveTimeout = null;
let isSaving = false;
let editorReady = false;

/* --- Document Management --- */
async function loadDocumentsList() {
  const docs = await getAllDocs();
  docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  docSelector.innerHTML = "";
  if (docs.length === 0) {
    await createNewDocument("Primeiro Documento");
    return;
  }
  docs.forEach((docData) => {
    const option = document.createElement("option");
    option.value = docData.id;
    option.textContent = docData.name || `Documento ${docData.id.substring(0, 4)}`;
    docSelector.appendChild(option);
  });
  const lastDocId = localStorage.getItem(`lastDocId`) || docs[0].id;
  if (docs.some((d) => d.id === lastDocId)) {
    docSelector.value = lastDocId;
  }
  await switchDocument(docSelector.value);
}

async function switchDocument(docId) {
  if (currentDocId === docId) return;
  currentDocId = docId;
  localStorage.setItem(`lastDocId`, docId);
  editor.value = "Carregando...";
  editor.disabled = true;
  const doc = await getDoc(currentDocId);
  if (doc) {
    editor.value = doc.content || "";
    updateStatusBar();
    updateLineNumbers();
  } else {
    editor.value = "";
  }
  editor.disabled = false;
}

async function createNewDocument(title = "Novo Documento") {
  const newTitle = await customPrompt("Novo Documento", "Digite o título do documento:", title);
  if (!newTitle) return;
  const newDoc = {
    id: crypto.randomUUID(),
    name: newTitle,
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveDoc(newDoc);
  showMessage(`Documento "${newTitle}" criado!`);
  await loadDocumentsList();
  docSelector.value = newDoc.id;
  await switchDocument(newDoc.id);
}

async function deleteCurrentDocument() {
  if (!currentDocId) return;
  const docTitle = docSelector.options[docSelector.selectedIndex].text;
  const confirmed = await customConfirm("Excluir Documento", `Tem certeza que deseja apagar "${docTitle}"? Esta ação é definitiva.`);
  if (confirmed) {
    await deleteDocById(currentDocId);
    showMessage("Documento excluído.");
    currentDocId = null;
    await loadDocumentsList();
  }
}

async function renameDocument() {
  if (!currentDocId) {
    showMessage("Nenhum documento selecionado", 2000);
    return;
  }

  const doc = await getDoc(currentDocId);
  if (!doc) return;

  const newName = await customPrompt("Renomear Documento", "Digite o novo nome:", doc.name);
  if (!newName || newName.trim() === "") {
    if (newName !== null) showMessage("Nome inválido", 2000);
    return;
  }

  if (newName === doc.name) {
    showMessage("Nome não foi alterado", 2000);
    return;
  }

  doc.name = newName.trim();
  doc.updatedAt = Date.now();
  await saveDoc(doc);

  await loadDocumentsList();
  docSelector.value = currentDocId;

  showMessage(`Documento renomeado para "${newName}"`, 2000);
}

function debounceSave() {
  clearTimeout(saveTimeout);
  if (!editorReady || isSaving) return;
  saveStatus.textContent = "Salvando...";
  saveTimeout = setTimeout(async () => {
    if (!currentDocId) {
      saveStatus.textContent = "Nenhum doc ativo.";
      return;
    }
    isSaving = true;
    const doc = await getDoc(currentDocId);
    if (doc) {
      doc.content = editor.value;
      doc.updatedAt = Date.now();
      await saveDoc(doc);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      saveStatus.textContent = `Salvo às ${hh}:${mm}`;
    }
    isSaving = false;
  }, 1500);
}

/* --- Editor Features --- */
function updateStatusBar() {
  const text = editor.value;
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const totalLines = text.split('\n').length;

  const bytes = new Blob([text]).size;
  let sizeText = "";
  if (bytes < 1024) sizeText = `${bytes} B`;
  else if (bytes < 1048576) sizeText = `${(bytes / 1024).toFixed(1)} KB`;
  else sizeText = `${(bytes / 1048576).toFixed(1)} MB`;

  wordCountEl.textContent = `Palavras: ${words}`;
  charCountEl.textContent = `Chars: ${chars}`;
  if (fileSizeEl) fileSizeEl.textContent = `${sizeText}`;
  if (lineCountEl) lineCountEl.textContent = `${totalLines} linhas`;
  updateCursorPosition();
}

function updateCursorPosition() {
  if (!cursorPosEl) return;
  const pos = editor.selectionStart;
  const textBefore = editor.value.slice(0, pos);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  cursorPosEl.textContent = `Ln ${line}, Col ${col}`;
}

function downloadAsTxt() {
  const text = editor.value;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  let docTitle = "documento";
  if (docSelector.selectedIndex !== -1) {
    docTitle = docSelector.options[docSelector.selectedIndex].text
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
  }
  a.download = `${docTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportAllDocuments() {
  const docs = await getAllDocs();
  if (docs.length === 0) {
    showMessage("Nenhum documento para exportar.");
    return;
  }

  const data = JSON.stringify(docs, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_editor_taurus_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showMessage("Backup exportado com sucesso!");
}

async function importDocuments(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const dbConn = await openDB();
  const importPromises = files.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      if (file.name.endsWith('.json')) {
        reader.onload = async (e) => {
          try {
            const docs = JSON.parse(e.target.result);
            if (Array.isArray(docs)) {
              const confirmed = await customConfirm("Importar Backup", `Deseja importar ${docs.length} documentos deste arquivo JSON?`);
              if (!confirmed) {
                resolve();
                return;
              }

              const transaction = dbConn.transaction("documents", "readwrite");
              const store = transaction.objectStore("documents");
              for (const doc of docs) {
                if (!doc.id) doc.id = crypto.randomUUID();
                if (doc.title && !doc.name) doc.name = doc.title;
                store.put(doc);
              }
              transaction.oncomplete = () => resolve();
            } else { resolve(); }
          } catch (err) { resolve(); }
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.txt')) {
        reader.onload = async (e) => {
          const content = e.target.result;
          const name = file.name.replace(/\.[^/.]+$/, "").replace(/__/g, " ").toUpperCase();

          const transaction = dbConn.transaction("documents", "readwrite");
          const store = transaction.objectStore("documents");
          store.add({
            id: crypto.randomUUID(),
            name: name,
            content: content,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => resolve();
        };
        reader.readAsText(file);
      } else {
        resolve();
      }
    });
  });

  await Promise.all(importPromises);
  showMessage(`${files.length} arquivos processados!`);
  await loadDocumentsList();
  event.target.value = '';
}

/* --- UI Management (tema, régua, modais) --- */
function updateRulerPosition() {
  const column = parseInt(rulerColumnInput.value) || 80;
  document.documentElement.style.setProperty("--ruler-column", column);
  localStorage.setItem("rulerColumn", column);
}

function toggleRulerVisibility() {
  const rulerLine = document.getElementById("ruler-line");
  const isVisible = localStorage.getItem("rulerVisible") !== "false";
  const newVisible = !isVisible;
  localStorage.setItem("rulerVisible", newVisible);
  applyRulerVisibility(newVisible);
}

function applyRulerVisibility(visible) {
  const rulerLine = document.getElementById("ruler-line");
  const btn = document.getElementById("ruler-toggle-btn");

  if (visible) {
    rulerLine.style.display = "block";
    btn.classList.add("text-blue-600", "dark:text-blue-400");
    btn.classList.remove("text-slate-600", "dark:text-slate-300");
  } else {
    rulerLine.style.display = "none";
    btn.classList.add("text-slate-600", "dark:text-slate-300");
    btn.classList.remove("text-blue-600", "dark:text-blue-400");
  }
}

function loadRulerPosition() {
  const savedColumn = localStorage.getItem("rulerColumn");
  if (savedColumn) {
    rulerColumnInput.value = savedColumn;
  }
  updateRulerPosition();

  const isVisible = localStorage.getItem("rulerVisible") !== "false";
  applyRulerVisibility(isVisible);
}

function showMessage(message, duration = 3000) {
  messageBox.textContent = message;
  messageBox.classList.add("show");
  setTimeout(() => {
    messageBox.classList.remove("show");
  }, duration);
}

function openModal(overlay) {
  overlay.classList.add("show");
}

function closeModal(overlay) {
  overlay.classList.remove("show");
}

/* --- Event Listeners --- */
function addEventListeners() {
  editor.addEventListener("input", () => {
    if (editorReady) debounceSave();
    updateStatusBar();
    updateLineNumbers();
    checkContentProtection();
  });
  // Atualiza Linha/Coluna ao mover cursor
  editor.addEventListener("keyup", (e) => {
    updateCursorPosition();
    applyTypewriterScroll();
  });
  editor.addEventListener("click", updateCursorPosition);
  editor.addEventListener("scroll", () => {
    rulerLine.style.transform = `translateX(-${editor.scrollLeft}px)`;
    lineNumbers.style.transform = `translateY(-${editor.scrollTop}px)`;
    syncHighlightScroll();
  });
  editor.addEventListener("keydown", (e) => {
    if (multiSelections.length > 1 && e.ctrlKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      openMultiActionsModal();
      return;
    }
    if (e.key === 'Escape' && multiSelections.length > 0) {
      multiSelections = [];
      multiSelectionIndicator.classList.remove("show");
      showMessage("Seleções múltiplas canceladas", 1500);
      return;
    }
    handleKeyboardShortcuts(e);
  });
  toggleModeBtn.addEventListener("click", toggleTheme);
  document.getElementById("ruler-toggle-btn").addEventListener("click", toggleRulerVisibility);
  rulerColumnInput.addEventListener("input", updateRulerPosition);
  docSelector.addEventListener("change", (e) => switchDocument(e.target.value));
  newDocBtn.addEventListener("click", () => createNewDocument());
  deleteDocBtn.addEventListener("click", deleteCurrentDocument);
  document.getElementById("rename-doc-btn").addEventListener("click", renameDocument);
  downloadBtn.addEventListener("click", downloadAsTxt);
  showShortcutsBtn.addEventListener("click", () => openModal(shortcutsModalOverlay));
  document.getElementById("shortcuts-modal-close-btn").addEventListener("click", () => closeModal(shortcutsModalOverlay));

  document.getElementById("export-db-btn").addEventListener("click", exportAllDocuments);
  document.getElementById("import-db-btn").addEventListener("click", () => document.getElementById("import-db-input").click());
  document.getElementById("import-db-input").addEventListener("change", importDocuments);

  // Dicionário Pessoal
  document.getElementById("personal-dict-btn").addEventListener("click", openPersonalDictModal);
  document.getElementById("personal-dict-modal-close-btn").addEventListener("click", () => closeModal(document.getElementById("personal-dict-modal-overlay")));
  document.getElementById("dict-add-btn").addEventListener("click", addPersonalDictWord);
  document.getElementById("dict-word-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addPersonalDictWord(); });

  // Ir para Linha (Ctrl+G)
  const gotoOverlay = document.getElementById("goto-line-modal-overlay");
  document.getElementById("goto-line-modal-close-btn").addEventListener("click", () => closeModal(gotoOverlay));
  document.getElementById("goto-line-ok-btn").addEventListener("click", gotoLine);
  document.getElementById("goto-line-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") gotoLine();
    if (e.key === "Escape") closeModal(gotoOverlay);
  });
  gotoOverlay.addEventListener("click", (e) => e.target === gotoOverlay && closeModal(gotoOverlay));

  shortcutsModalOverlay.addEventListener("click", (e) =>
    e.target === shortcutsModalOverlay && closeModal(shortcutsModalOverlay)
  );

  // Modal de Ajuda
  const helpBtn = document.getElementById("help-btn");
  const helpModalOverlay = document.getElementById("help-modal-overlay");
  helpBtn.addEventListener("click", () => openModal(helpModalOverlay));
  document.getElementById("help-modal-close-btn").addEventListener("click", () => closeModal(helpModalOverlay));
  document.getElementById("help-close-guide-btn").addEventListener("click", () => closeModal(helpModalOverlay));
  helpModalOverlay.addEventListener("click", (e) => e.target === helpModalOverlay && closeModal(helpModalOverlay));

  findReplaceBtn.addEventListener("click", () => openModal(findReplaceModalOverlay));
  document.getElementById("find-replace-modal-close-btn").addEventListener("click", () => closeModal(findReplaceModalOverlay));
  findReplaceModalOverlay.addEventListener("click", (e) =>
    e.target === findReplaceModalOverlay && closeModal(findReplaceModalOverlay)
  );

  // Modal de ações múltiplas
  document.getElementById("multi-actions-modal-close-btn").addEventListener("click", () => closeModal(multiActionsModalOverlay));
  document.getElementById("multi-cancel-btn").addEventListener("click", () => {
    multiSelections = [];
    multiSelectionIndicator.classList.remove("show");
    closeModal(multiActionsModalOverlay);
  });
  multiActionsModalOverlay.addEventListener("click", (e) => {
    if (e.target === multiActionsModalOverlay) {
      multiSelections = [];
      multiSelectionIndicator.classList.remove("show");
      closeModal(multiActionsModalOverlay);
    }
  });

  multiSelectionIndicator.addEventListener("click", () => {
    if (multiSelections.length > 1) {
      openMultiActionsModal();
    }
  });

  document.getElementById("multi-replace-btn").addEventListener("click", () => {
    const replaceValue = document.getElementById("multi-replace-input").value;
    replaceMultiSelections(replaceValue);
    multiSelectionIndicator.classList.remove("show");
    closeModal(multiActionsModalOverlay);
  });

  document.getElementById("multi-uppercase-btn").addEventListener("click", () => {
    convertMultiSelectionsToUpperCase();
    multiSelectionIndicator.classList.remove("show");
    closeModal(multiActionsModalOverlay);
  });

  document.getElementById("multi-lowercase-btn").addEventListener("click", () => {
    convertMultiSelectionsToLowerCase();
    multiSelectionIndicator.classList.remove("show");
    closeModal(multiActionsModalOverlay);
  });

  document.getElementById("multi-delete-btn").addEventListener("click", () => {
    deleteMultiSelections();
    multiSelectionIndicator.classList.remove("show");
    closeModal(multiActionsModalOverlay);
  });

  // Localizar e substituir
  const findInput = document.getElementById("find-input");
  const replaceInput = document.getElementById("replace-input");

  // Highlight de busca ao digitar no campo de busca
  findInput.addEventListener("input", () => updateSearchHighlight(findInput.value));
  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateSearchMatch(e.shiftKey ? -1 : 1);
    }
  });

  document.getElementById("replace-btn").addEventListener("click", () => {
    const findValue = findInput.value;
    const replaceValue = replaceInput.value;
    if (!findValue) return;
    const currentSelection = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (currentSelection.toLowerCase() === findValue.toLowerCase()) {
      editor.setRangeText(replaceValue, editor.selectionStart, editor.selectionEnd, "select");
    } else {
      const nextIndex = editor.value.indexOf(findValue, editor.selectionEnd);
      if (nextIndex !== -1) {
        editor.setSelectionRange(nextIndex, nextIndex + findValue.length);
      } else {
        showMessage("Fim do documento.", 2000);
      }
    }
    editor.focus();
  });
  document.getElementById("replace-all-btn").addEventListener("click", () => {
    const findValue = findInput.value;
    const replaceValue = replaceInput.value;
    if (!findValue) return;
    const originalValue = editor.value;
    const newValue = originalValue.replaceAll(findValue, replaceValue);
    if (originalValue !== newValue) {
      editor.value = newValue;
      showMessage("Todas as ocorrências foram substituídas.", 2000);
      updateSearchHighlight(findValue);
    } else {
      showMessage("Nenhuma ocorrência encontrada.", 2000);
    }
  });

  // Typewriter Mode
  document.getElementById("typewriter-btn").addEventListener("click", toggleTypewriterMode);

  // Proteção de Conteúdo
  document.getElementById("content-undo-btn").addEventListener("click", undoContentDelete);
  document.getElementById("content-save-anyway-btn").addEventListener("click", saveAnywayAfterProtection);

  // Ctrl+P Quick Open
  const quickOpenOverlay = document.getElementById("quickopen-modal-overlay");
  document.getElementById("quickopen-input").addEventListener("input", renderQuickOpenList);
  document.getElementById("quickopen-input").addEventListener("keydown", handleQuickOpenKeydown);
  quickOpenOverlay.addEventListener("click", (e) => e.target === quickOpenOverlay && closeModal(quickOpenOverlay));
}

function handleKeyboardShortcuts(e) {
  const isCtrlOrCmd = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Tab: aceitar autocomplete (se popup visível)
  if (e.key === "Tab" && acSuggestion) {
    if (acceptAutocomplete()) {
      e.preventDefault();
      return;
    }
  }

  // Esc: fechar autocomplete
  if (e.key === "Escape" && acSuggestion) {
    hideAutocompletePopup();
  }

  // Qualquer tecla que quebra o contexto fecha o popup
  if (acSuggestion && (e.key === "Enter" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === " " || e.key === "Backspace")) {
    hideAutocompletePopup();
  }

  // Ctrl + S: Salvar
  if (isCtrlOrCmd && key === "s") {
    e.preventDefault();
    clearTimeout(saveTimeout);
    debounceSave();
    showMessage("Salvando...", 1000);
  }
  // Ctrl + G: Ir para Linha
  if (isCtrlOrCmd && key === "g") {
    e.preventDefault();
    const gotoOverlay = document.getElementById("goto-line-modal-overlay");
    openModal(gotoOverlay);
    setTimeout(() => document.getElementById("goto-line-input").focus(), 100);
    return;
  }
  // Ctrl + P: Quick Open
  if (isCtrlOrCmd && key === "p") {
    e.preventDefault();
    openQuickOpen();
    return;
  }
  // Alt + N: Novo documento
  if (e.altKey && !e.ctrlKey && key === "n") {
    e.preventDefault();
    createNewDocument();
  }
  // Ctrl + Shift + F: Localizar e substituir
  else if (isCtrlOrCmd && e.shiftKey && key === "f") {
    e.preventDefault();
    openModal(findReplaceModalOverlay);
    document.getElementById("find-input").focus();
  }
  // Ctrl + D: Selecionar próxima ocorrência
  else if (isCtrlOrCmd && !e.shiftKey && key === "d") {
    e.preventDefault();
    selectNextOccurrence();
  }
  // Ctrl + Shift + D: Duplicar linha atual
  else if (isCtrlOrCmd && e.shiftKey && key === "d") {
    e.preventDefault();
    duplicateCurrentLine();
  }
  // Ctrl + Shift + U: Converter seleção para maiúsculas
  else if (isCtrlOrCmd && e.shiftKey && key === "u") {
    e.preventDefault();
    convertToUpperCase();
  }
  // Ctrl + Shift + L: Selecionar todas as ocorrências
  else if (isCtrlOrCmd && e.shiftKey && key === "l") {
    e.preventDefault();
    selectAllOccurrences();
  }
  // Alt + Shift + ↑: Mover linha para cima
  else if (e.altKey && e.shiftKey && e.key === "ArrowUp") {
    e.preventDefault();
    moveLineUp();
  }
  // Alt + Shift + ↓: Mover linha para baixo
  else if (e.altKey && e.shiftKey && e.key === "ArrowDown") {
    e.preventDefault();
    moveLineDown();
  }
}

/* --- Funções de Edição Avançada --- */
let multiSelections = [];

function selectNextOccurrence() {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selectedText = editor.value.substring(start, end);

  if (!selectedText) {
    const text = editor.value;
    let wordStart = start;
    let wordEnd = start;

    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) wordStart--;
    while (wordEnd < text.length && /\w/.test(text[wordEnd])) wordEnd++;

    if (wordStart < wordEnd) {
      editor.setSelectionRange(wordStart, wordEnd);
      multiSelections = [{ start: wordStart, end: wordEnd, text: text.substring(wordStart, wordEnd) }];
    }
    return;
  }

  if (multiSelections.length === 0 || multiSelections[multiSelections.length - 1].start !== start) {
    multiSelections.push({ start, end, text: selectedText });
  }

  const nextIndex = editor.value.indexOf(selectedText, end);
  if (nextIndex !== -1) {
    multiSelections.push({ start: nextIndex, end: nextIndex + selectedText.length, text: selectedText });
    editor.setSelectionRange(nextIndex, nextIndex + selectedText.length);
    scrollToSelection(nextIndex);
    editor.focus();
    updateMultiSelectionIndicator();
  } else {
    updateMultiSelectionIndicator();
  }
}

function selectAllOccurrences() {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  let selectedText = editor.value.substring(start, end);

  if (!selectedText) {
    const text = editor.value;
    let wordStart = start;
    let wordEnd = start;

    while (wordStart > 0 && /\w/.test(text[wordStart - 1])) wordStart--;
    while (wordEnd < text.length && /\w/.test(text[wordEnd])) wordEnd++;

    if (wordStart < wordEnd) {
      selectedText = text.substring(wordStart, wordEnd);
    } else {
      showMessage("Nenhuma palavra selecionada", 2000);
      return;
    }
  }

  multiSelections = [];
  const text = editor.value;
  let index = 0;

  while ((index = text.indexOf(selectedText, index)) !== -1) {
    multiSelections.push({ start: index, end: index + selectedText.length, text: selectedText });
    index += selectedText.length;
  }

  if (multiSelections.length > 0) {
    const last = multiSelections[multiSelections.length - 1];
    editor.setSelectionRange(last.start, last.end);
    scrollToSelection(last.start);
    updateMultiSelectionIndicator();
  } else {
    showMessage("Nenhuma ocorrência encontrada", 2000);
  }
}

function updateMultiSelectionIndicator() {
  if (multiSelections.length > 1) {
    multiSelectionText.textContent = `${multiSelections.length} selecionadas`;
    multiSelectionIndicator.classList.add("show");
    highlightSelectedLines();
  } else {
    multiSelectionIndicator.classList.remove("show");
    highlightSelectedLines();
  }
}

function scrollToSelection(position) {
  const textBeforeSelection = editor.value.substring(0, position);
  const lineHeight = 24;
  const lines = textBeforeSelection.split('\n').length;
  const scrollPosition = (lines - 1) * lineHeight;
  editor.scrollTop = Math.max(0, scrollPosition - editor.clientHeight / 2);
}

function updateLineNumbers() {
  const lines = editor.value.split('\n');
  const lineCount = lines.length;

  let html = '';
  for (let i = 1; i <= lineCount; i++) {
    html += `<span class="line-number" data-line="${i}">${i}</span>`;
  }

  lineNumbers.innerHTML = html;
  highlightSelectedLines();
}

function highlightSelectedLines() {
  if (multiSelections.length < 2) return;

  const text = editor.value;
  const highlightedLines = new Set();

  multiSelections.forEach(sel => {
    const textBefore = text.substring(0, sel.start);
    const lineNumber = textBefore.split('\n').length;
    highlightedLines.add(lineNumber);
  });

  const lineNumberElements = lineNumbers.querySelectorAll('.line-number');
  lineNumberElements.forEach((el, index) => {
    const lineNum = index + 1;
    if (highlightedLines.has(lineNum)) {
      el.classList.add('highlighted');
    } else {
      el.classList.remove('highlighted');
    }
  });
}

function openMultiActionsModal() {
  if (multiSelections.length < 2) return;

  const count = multiSelections.length;
  const word = multiSelections[0].text;
  document.getElementById("multi-selection-count").textContent =
    `${count} ocorrências de "${word}" selecionadas`;
  document.getElementById("multi-replace-input").value = "";

  openModal(multiActionsModalOverlay);
  document.getElementById("multi-replace-input").focus();
}

function replaceMultiSelections(newText) {
  if (multiSelections.length < 2) return;

  let text = editor.value;
  const newMultiSelections = [];
  let offset = 0;

  multiSelections.sort((a, b) => a.start - b.start);

  multiSelections.forEach(sel => {
    const adjustedStart = sel.start + offset;
    const adjustedEnd = sel.end + offset;

    text = text.substring(0, adjustedStart) + newText + text.substring(adjustedEnd);

    newMultiSelections.push({
      start: adjustedStart,
      end: adjustedStart + newText.length,
      text: newText
    });

    offset += newText.length - (sel.end - sel.start);
  });

  editor.value = text;
  const count = multiSelections.length;
  multiSelections = newMultiSelections;

  if (newText === "") {
    showMessage(`${count} ocorrências excluídas`, 2000);
    multiSelections = [];
  } else {
    showMessage(`${count} ocorrências substituídas por "${newText}"`, 2000);
  }

  if (editorReady) debounceSave();
  updateMultiSelectionIndicator();
  updateStatusBar();
  updateLineNumbers();
}

function convertMultiSelectionsToUpperCase() {
  if (multiSelections.length < 2) return;

  let text = editor.value;
  let offset = 0;

  multiSelections.sort((a, b) => a.start - b.start);

  multiSelections.forEach(sel => {
    const adjustedStart = sel.start + offset;
    const adjustedEnd = sel.end + offset;
    const upperText = text.substring(adjustedStart, adjustedEnd).toUpperCase();
    text = text.substring(0, adjustedStart) + upperText + text.substring(adjustedEnd);
  });

  editor.value = text;
  const count = multiSelections.length;
  multiSelections = [];
  showMessage(`${count} ocorrências convertidas para MAIÚSCULAS`, 2000);

  if (editorReady) debounceSave();
  updateStatusBar();
}

function convertMultiSelectionsToLowerCase() {
  if (multiSelections.length < 2) return;

  let text = editor.value;
  let offset = 0;

  multiSelections.sort((a, b) => a.start - b.start);

  multiSelections.forEach(sel => {
    const adjustedStart = sel.start + offset;
    const adjustedEnd = sel.end + offset;
    const lowerText = text.substring(adjustedStart, adjustedEnd).toLowerCase();
    text = text.substring(0, adjustedStart) + lowerText + text.substring(adjustedEnd);
  });

  editor.value = text;
  const count = multiSelections.length;
  multiSelections = [];
  showMessage(`${count} ocorrências convertidas para minúsculas`, 2000);

  if (editorReady) debounceSave();
  updateStatusBar();
}

function deleteMultiSelections() {
  if (multiSelections.length < 2) return;

  let text = editor.value;
  let offset = 0;

  multiSelections.sort((a, b) => a.start - b.start);

  multiSelections.forEach(sel => {
    const adjustedStart = sel.start + offset;
    const adjustedEnd = sel.end + offset;
    text = text.substring(0, adjustedStart) + text.substring(adjustedEnd);
    offset -= (sel.end - sel.start);
  });

  editor.value = text;
  const count = multiSelections.length;
  multiSelections = [];
  showMessage(`${count} ocorrências foram excluídas`, 2000);

  if (editorReady) debounceSave();
  updateStatusBar();
}

function duplicateCurrentLine() {
  const start = editor.selectionStart;
  const text = editor.value;

  let lineStart = text.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = text.indexOf("\n", start);
  if (lineEnd === -1) lineEnd = text.length;

  const currentLine = text.substring(lineStart, lineEnd);
  const newText =
    text.substring(0, lineEnd) +
    "\n" +
    currentLine +
    text.substring(lineEnd);

  editor.value = newText;
  editor.setSelectionRange(lineEnd + 1, lineEnd + 1);
  editor.focus();

  if (editorReady) debounceSave();
}

function convertToUpperCase() {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;

  if (start === end) {
    showMessage("Selecione um texto para converter", 2000);
    return;
  }

  const selectedText = editor.value.substring(start, end);
  const upperText = selectedText.toUpperCase();

  editor.setRangeText(upperText, start, end, "select");
  editor.focus();

  if (editorReady) debounceSave();
}

function moveLineUp() {
  const start = editor.selectionStart;
  const text = editor.value;

  if (multiSelections.length > 0) {
    multiSelections = [];
    updateMultiSelectionIndicator();
  }

  let currentLineStart = text.lastIndexOf("\n", start - 1) + 1;
  let currentLineEnd = text.indexOf("\n", start);
  if (currentLineEnd === -1) currentLineEnd = text.length;

  if (currentLineStart === 0) {
    showMessage("Já está na primeira linha", 1500);
    return;
  }

  let prevLineStart = text.lastIndexOf("\n", currentLineStart - 2) + 1;

  const currentLine = text.substring(currentLineStart, currentLineEnd);
  const prevLine = text.substring(prevLineStart, currentLineStart - 1);

  const newText =
    text.substring(0, prevLineStart) +
    currentLine +
    "\n" +
    prevLine +
    text.substring(currentLineEnd);

  editor.value = newText;

  const newCursorPos = start - (currentLineStart - prevLineStart);
  editor.setSelectionRange(newCursorPos, newCursorPos);
  editor.focus();

  if (editorReady) debounceSave();
  updateLineNumbers();
  updateStatusBar();
}

function moveLineDown() {
  const start = editor.selectionStart;
  const text = editor.value;

  if (multiSelections.length > 0) {
    multiSelections = [];
    updateMultiSelectionIndicator();
  }

  let currentLineStart = text.lastIndexOf("\n", start - 1) + 1;
  let currentLineEnd = text.indexOf("\n", start);
  if (currentLineEnd === -1) currentLineEnd = text.length;

  if (currentLineEnd === text.length) {
    showMessage("Já está na última linha", 1500);
    return;
  }

  let nextLineEnd = text.indexOf("\n", currentLineEnd + 1);
  if (nextLineEnd === -1) nextLineEnd = text.length;

  const currentLine = text.substring(currentLineStart, currentLineEnd);
  const nextLine = text.substring(currentLineEnd + 1, nextLineEnd);

  const newText =
    text.substring(0, currentLineStart) +
    nextLine +
    "\n" +
    currentLine +
    text.substring(nextLineEnd);

  editor.value = newText;

  const newCursorPos = start + (nextLineEnd - currentLineEnd);
  editor.setSelectionRange(newCursorPos, newCursorPos);
  editor.focus();

  if (editorReady) debounceSave();
  updateLineNumbers();
  updateStatusBar();
}

/* --- IR PARA LINHA (Ctrl+G) --- */
function gotoLine() {
  const gotoOverlay = document.getElementById("goto-line-modal-overlay");
  const input = document.getElementById("goto-line-input");
  const lineNum = parseInt(input.value);
  if (!lineNum || lineNum < 1) return;

  const lines = editor.value.split('\n');
  const targetLine = Math.min(lineNum, lines.length);

  // Calcula a posição do cursor até o início da linha alvo
  let pos = 0;
  for (let i = 0; i < targetLine - 1; i++) {
    pos += lines[i].length + 1; // +1 pelo \n
  }

  editor.focus();
  editor.setSelectionRange(pos, pos);
  scrollToSelection(pos);
  updateCursorPosition();
  closeModal(gotoOverlay);
  input.value = '';
  showMessage(`Linha ${targetLine}`, 1500);
}

/* --- DICIONÁRIO PESSOAL --- */
const PERSONAL_DICT_KEY = "editor-taurus-personal-dict";

function getPersonalDict() {
  try {
    return JSON.parse(localStorage.getItem(PERSONAL_DICT_KEY)) || [];
  } catch {
    return [];
  }
}

function savePersonalDict(words) {
  localStorage.setItem(PERSONAL_DICT_KEY, JSON.stringify(words));
}

function renderPersonalDictWords() {
  const list = document.getElementById("dict-words-list");
  const words = getPersonalDict();
  if (words.length === 0) {
    list.innerHTML = '<span class="text-slate-400 text-sm italic p-2">Nenhuma palavra adicionada ainda.</span>';
    return;
  }
  list.innerHTML = words.map(w =>
    `<button class="dict-chip px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-mono hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors" data-word="${w}" title="Clique para remover">${w}</button>`
  ).join('');
  // Event: clique para remover
  list.querySelectorAll('.dict-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const word = btn.dataset.word;
      const words = getPersonalDict().filter(w => w !== word);
      savePersonalDict(words);
      renderPersonalDictWords();
      showMessage(`"${word}" removido do dicionário`, 1500);
    });
  });
}

function addPersonalDictWord() {
  const input = document.getElementById("dict-word-input");
  const word = input.value.trim().toUpperCase();
  if (!word || word.length < 2) return;
  const words = getPersonalDict();
  if (!words.includes(word)) {
    words.push(word);
    words.sort();
    savePersonalDict(words);
    showMessage(`"${word}" adicionado ao dicionário! ✓`, 1500);
  } else {
    showMessage(`"${word}" já está no dicionário`, 1500);
  }
  input.value = '';
  input.focus();
  renderPersonalDictWords();
}

function openPersonalDictModal() {
  renderPersonalDictWords();
  openModal(document.getElementById("personal-dict-modal-overlay"));
  setTimeout(() => document.getElementById("dict-word-input").focus(), 100);
}

/* --- AUTOCOMPLETE --- */
const autocompletePopup = document.getElementById("autocomplete-popup");
const acPrefix = autocompletePopup.querySelector(".autocomplete-prefix");
const acSuffix = autocompletePopup.querySelector(".autocomplete-suffix");
let acSuggestion = "";
let acCurrentWord = "";
let acTimeout = null;

function buildWordDictionary(text) {
  const words = text.match(/[A-Za-zÀ-ÿ0-9_-]{4,}/g) || [];
  return [...new Set(words)].sort((a, b) => b.length - a.length);
}

function getCurrentWord(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const match = before.match(/[A-Za-zÀ-ÿ0-9_-]+$/);
  return match ? match[0] : "";
}

function findSuggestion(word, dictionary) {
  if (word.length < 3) return null;
  const upper = word.toUpperCase();
  // Inclui palavras do dicionário pessoal com prioridade
  const personalDict = getPersonalDict();
  const combined = [...new Set([...personalDict, ...dictionary])];
  const exact = combined.find((w) => w.startsWith(word) && w.length > word.length);
  if (exact) return exact;
  return combined.find((w) => w.toUpperCase().startsWith(upper) && w.length > word.length) || null;
}

function showAutocompletePopup() {
  const pos = editor.selectionStart;
  const text = editor.value;
  acCurrentWord = getCurrentWord(text, pos);
  const dictionary = buildWordDictionary(text);
  const suggestion = findSuggestion(acCurrentWord, dictionary);

  if (!suggestion) {
    hideAutocompletePopup();
    return;
  }

  acSuggestion = suggestion;
  const suffix = suggestion.slice(acCurrentWord.length);
  acPrefix.textContent = acCurrentWord;
  acSuffix.textContent = suffix;

  const editorRect = editor.getBoundingClientRect();
  const lineHeight = 24;
  const textBeforeCursor = text.slice(0, pos);
  const lines = textBeforeCursor.split("\n");
  const currentLineIndex = lines.length - 1;
  const currentLineText = lines[currentLineIndex];

  const charWidth = parseFloat(getComputedStyle(editor).fontSize) * 0.6;
  const paddingLeft = 48;
  const scrollLeft = editor.scrollLeft;
  const scrollTop = editor.scrollTop;

  const x = editorRect.left + paddingLeft + currentLineText.length * charWidth - scrollLeft;
  const y = editorRect.top + (currentLineIndex + 1) * lineHeight - scrollTop;

  const popupWidth = 350;
  const finalX = Math.min(x, window.innerWidth - popupWidth - 10);
  const finalY = Math.min(y, window.innerHeight - 50);

  autocompletePopup.style.left = `${finalX}px`;
  autocompletePopup.style.top = `${finalY}px`;
  autocompletePopup.style.display = "block";
}

function hideAutocompletePopup() {
  autocompletePopup.style.display = "none";
  acSuggestion = "";
  acCurrentWord = "";
}

function acceptAutocomplete() {
  if (!acSuggestion) return false;
  const pos = editor.selectionStart;
  const suffix = acSuggestion.slice(acCurrentWord.length);
  const before = editor.value.slice(0, pos);
  const after = editor.value.slice(pos);
  editor.value = before + suffix + after;
  const newPos = pos + suffix.length;
  editor.setSelectionRange(newPos, newPos);
  hideAutocompletePopup();
  debounceSave();
  updateStatusBar();
  updateLineNumbers();
  return true;
}

function triggerAutocomplete() {
  clearTimeout(acTimeout);
  acTimeout = setTimeout(() => {
    showAutocompletePopup();
  }, 180);
}

/* --- SEARCH HIGHLIGHT --- */
let searchHighlightTerm = "";
let searchMatchIndex = 0;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateSearchHighlight(term) {
  const overlay = document.getElementById("search-highlight-overlay");
  searchHighlightTerm = term;
  searchMatchIndex = 0;

  if (!term || term.length < 2) {
    overlay.innerHTML = "";
    updateFindMatchCount(0, 0);
    return;
  }

  const text = editor.value;
  const regex = new RegExp(escapeRegex(term), "gi");
  let matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }

  updateFindMatchCount(searchMatchIndex + 1, matches.length);
  if (matches.length === 0) {
    overlay.innerHTML = "";
    return;
  }

  // Renderiza texto com marcações (sem HTML perigoso)
  let html = "";
  let last = 0;
  matches.forEach((match, i) => {
    // Texto antes do match (escapa)
    html += escapeHtml(text.slice(last, match.start));
    const cls = i === searchMatchIndex ? "current-match" : "";
    html += `<mark class="${cls}">${escapeHtml(text.slice(match.start, match.end))}</mark>`;
    last = match.end;
  });
  html += escapeHtml(text.slice(last));
  overlay.innerHTML = html;

  // Sincroniza scroll
  overlay.scrollTop = editor.scrollTop;
  overlay.scrollLeft = editor.scrollLeft;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function updateFindMatchCount(current, total) {
  let el = document.getElementById("find-match-count");
  if (!el) {
    // Cria o elemento no modal de busca se não existir
    const header = document.getElementById("find-replace-modal-overlay")?.querySelector("h2");
    if (header) {
      el = document.createElement("span");
      el.id = "find-match-count";
      el.className = "ml-2 text-sm font-normal";
      header.appendChild(el);
    }
  }
  if (!el) return;
  if (total === 0) {
    el.textContent = " — Nenhuma ocorrência";
    el.style.color = "#ef4444";
  } else {
    el.textContent = ` ${current}/${total}`;
    el.style.color = "#64748b";
  }
}

function navigateSearchMatch(direction) {
  if (!searchHighlightTerm) return;
  const text = editor.value;
  const regex = new RegExp(escapeRegex(searchHighlightTerm), "gi");
  let matches = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
  }
  if (matches.length === 0) return;

  searchMatchIndex = ((searchMatchIndex + direction) % matches.length + matches.length) % matches.length;
  const match = matches[searchMatchIndex];
  editor.setSelectionRange(match.start, match.end);
  scrollToSelection(match.start);

  updateFindMatchCount(searchMatchIndex + 1, matches.length);
  updateSearchHighlight(searchHighlightTerm);
}

// Sincroniza overlay com scroll do editor
function syncHighlightScroll() {
  const overlay = document.getElementById("search-highlight-overlay");
  if (overlay) {
    overlay.scrollTop = editor.scrollTop;
    overlay.scrollLeft = editor.scrollLeft;
  }
}

/* --- TYPEWRITER MODE --- */
let typewriterActive = false;

function toggleTypewriterMode() {
  typewriterActive = !typewriterActive;
  const btn = document.getElementById("typewriter-btn");
  if (typewriterActive) {
    document.body.classList.add("typewriter-mode");
    btn.classList.add("active");
    btn.title = "Desativar Modo Máquina de Escrever";
    localStorage.setItem("typewriterMode", "true");
    showMessage("✍️ Modo Máquina de Escrever ativado", 2000);
  } else {
    document.body.classList.remove("typewriter-mode");
    btn.classList.remove("active");
    btn.title = "Modo Máquina de Escrever (cursor centralizado)";
    localStorage.setItem("typewriterMode", "false");
    showMessage("Modo Máquina de Escrever desativado", 1500);
  }
}

function applyTypewriterScroll() {
  if (!typewriterActive) return;
  // Calcula posição vertical da linha atual
  const pos = editor.selectionStart;
  const textBefore = editor.value.slice(0, pos);
  const lineIndex = textBefore.split("\n").length - 1;
  const lineHeight = 24;
  const lineY = lineIndex * lineHeight;
  // Centraliza: scroll = lineY - (visível / 2)
  const target = lineY - editor.clientHeight / 2 + lineHeight;
  editor.scrollTop = Math.max(0, target);
}

function loadTypewriterMode() {
  if (localStorage.getItem("typewriterMode") === "true") {
    typewriterActive = false; // Vai ser invertido no toggle
    toggleTypewriterMode();
  }
}

/* --- CONTENT PROTECTION --- */
let contentBeforeEdit = "";
let protectionSaveTimeout = null;

function checkContentProtection() {
  const current = editor.value;
  const before = contentBeforeEdit;
  if (!before || before.length === 0) {
    contentBeforeEdit = current;
    return;
  }
  const deleted = before.length - current.length;
  const pct = deleted / before.length;
  // Dispara alerta se perdeu > 30% E mais de 50 caracteres
  if (pct > 0.30 && deleted > 50) {
    showContentProtectionBanner(before);
  } else {
    hideContentProtectionBanner();
    contentBeforeEdit = current;
  }
}

function showContentProtectionBanner(savedContent) {
  const banner = document.getElementById("content-protection-banner");
  banner.classList.remove("hidden");
  banner.classList.add("flex");
  banner.dataset.savedContent = savedContent;
  // Para o auto-save enquanto o banner está ativo
  clearTimeout(saveTimeout);
  clearTimeout(protectionSaveTimeout);
}

function hideContentProtectionBanner() {
  const banner = document.getElementById("content-protection-banner");
  banner.classList.add("hidden");
  banner.classList.remove("flex");
}

function undoContentDelete() {
  const banner = document.getElementById("content-protection-banner");
  const saved = banner.dataset.savedContent;
  if (saved !== undefined) {
    editor.value = saved;
    contentBeforeEdit = saved;
    updateStatusBar();
    updateLineNumbers();
  }
  hideContentProtectionBanner();
  showMessage("↩ Conteúdo restaurado!", 2000);
}

function saveAnywayAfterProtection() {
  hideContentProtectionBanner();
  contentBeforeEdit = editor.value;
  debounceSave();
}

/* --- QUICKOPEN (Ctrl+P) --- */
let quickOpenDocs = [];
let quickOpenSelectedIndex = 0;

async function openQuickOpen() {
  quickOpenDocs = await getAllDocs();
  quickOpenDocs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const input = document.getElementById("quickopen-input");
  input.value = "";
  quickOpenSelectedIndex = 0;
  renderQuickOpenList();
  openModal(document.getElementById("quickopen-modal-overlay"));
  setTimeout(() => input.focus(), 50);
}

function renderQuickOpenList() {
  const query = document.getElementById("quickopen-input").value.toLowerCase();
  const list = document.getElementById("quickopen-list");
  const count = document.getElementById("quickopen-count");

  const filtered = query
    ? quickOpenDocs.filter(d => d.name.toLowerCase().includes(query))
    : quickOpenDocs;

  count.textContent = `${filtered.length} docs`;
  quickOpenSelectedIndex = Math.min(quickOpenSelectedIndex, filtered.length - 1);

  if (filtered.length === 0) {
    list.innerHTML = `<li class="p-4 text-center text-slate-400 italic">Nenhum documento encontrado</li>`;
    return;
  }

  list.innerHTML = filtered.map((doc, i) => {
    const name = query
      ? doc.name.replace(new RegExp(`(${escapeRegex(query)})`, "gi"), '<span class="doc-match">$1</span>')
      : doc.name;
    const date = doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("pt-BR") : "";
    const active = i === quickOpenSelectedIndex ? "active" : "";
    return `<li class="${active}" data-id="${doc.id}">
      <span class="doc-name">${name}</span>
      <span class="doc-date">${date}</span>
    </li>`;
  }).join("");

  // Click para abrir
  list.querySelectorAll("li[data-id]").forEach((li, i) => {
    li.addEventListener("mouseenter", () => {
      quickOpenSelectedIndex = i;
      renderQuickOpenList();
    });
    li.addEventListener("click", () => {
      selectQuickOpenItem(filtered[i]);
    });
  });

  // Scroll para item ativo
  const activeEl = list.querySelector(".active");
  if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
}

function handleQuickOpenKeydown(e) {
  const input = document.getElementById("quickopen-input");
  const query = input.value.toLowerCase();
  const filtered = query
    ? quickOpenDocs.filter(d => d.name.toLowerCase().includes(query))
    : quickOpenDocs;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    quickOpenSelectedIndex = Math.min(quickOpenSelectedIndex + 1, filtered.length - 1);
    renderQuickOpenList();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    quickOpenSelectedIndex = Math.max(quickOpenSelectedIndex - 1, 0);
    renderQuickOpenList();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (filtered[quickOpenSelectedIndex]) {
      selectQuickOpenItem(filtered[quickOpenSelectedIndex]);
    }
  } else if (e.key === "Escape") {
    closeModal(document.getElementById("quickopen-modal-overlay"));
  }
}

function selectQuickOpenItem(doc) {
  closeModal(document.getElementById("quickopen-modal-overlay"));
  if (doc.id !== currentDocId) {
    docSelector.value = doc.id;
    switchDocument(doc.id);
  }
  editor.focus();
}

/* --- Inicialização --- */
document.addEventListener("DOMContentLoaded", async () => {
  loadTheme();
  lucide.createIcons();
  loadRulerPosition();
  userIdDisplay.textContent = `Local`;
  editor.placeholder = "Carregando documentos...";
  await loadDocumentsList();
  editorReady = true;
  addEventListeners();
  updateStatusBar();
  updateLineNumbers();

  // Registro do Service Worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('Service Worker registrado com sucesso.'))
      .catch(err => console.log('Erro ao registrar Service Worker:', err));
  }

  // Autocomplete: eventos adicionais
  editor.addEventListener("input", () => {
    triggerAutocomplete();
  });
  editor.addEventListener("blur", () => {
    setTimeout(hideAutocompletePopup, 150);
  });
  editor.addEventListener("click", () => {
    hideAutocompletePopup();
  });

  // Inicializar modo typewriter se estava ativo
  loadTypewriterMode();

  // Inicializar proteção de conteúdo com o texto atual
  contentBeforeEdit = editor.value;
});
