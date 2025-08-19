/* --- IndexedDB Helper --- */
const DB_NAME = 'editor-codigo-db';
const STORE_NAME = 'documents';
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
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

function getAllDocs() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

function getDoc(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

function saveDoc(doc) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(doc);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}

function deleteDocById(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}

/* --- DOM Elements --- */
const editor = document.getElementById('editor');
const saveStatus = document.getElementById('save-status');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const rulerColumnInput = document.getElementById('ruler-column-input');
const rulerLine = document.getElementById('ruler-line');
const docSelector = document.getElementById('doc-selector');
const newDocBtn = document.getElementById('new-doc-btn');
const deleteDocBtn = document.getElementById('delete-doc-btn');
const downloadBtn = document.getElementById('download-btn');
const userIdDisplay = document.getElementById('user-id-display');
const messageBox = document.getElementById('message-box');
const showShortcutsBtn = document.getElementById('show-shortcuts-btn');
const findReplaceBtn = document.getElementById('find-replace-btn');
const shortcutsModalOverlay = document.getElementById('shortcuts-modal-overlay');
const findReplaceModalOverlay = document.getElementById('find-replace-modal-overlay');

let currentDocId = null;
let saveTimeout = null;
let isSaving = false;
let editorReady = false;

/* --- Document Management --- */
async function loadDocumentsList() {
    const docs = await getAllDocs();
    docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    docSelector.innerHTML = '';
    if (docs.length === 0) {
        await createNewDocument("Primeiro Documento");
        return;
    }
    docs.forEach(docData => {
        const option = document.createElement('option');
        option.value = docData.id;
        option.textContent = docData.title || `Documento ${docData.id.substring(0, 4)}`;
        docSelector.appendChild(option);
    });
    const lastDocId = localStorage.getItem(`lastDocId`) || docs[0].id;
    if (docs.some(d => d.id === lastDocId)) {
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
        editor.value = doc.content || '';
        updateStatusBar();
    } else {
        editor.value = '';
    }
    editor.disabled = false;
}

async function createNewDocument(title = "Novo Documento") {
    const newTitle = prompt("Digite o título do novo documento:", title);
    if (!newTitle) return;
    const newDoc = {
        id: crypto.randomUUID(),
        title: newTitle,
        content: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
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
    if (confirm(`Tem certeza que deseja excluir o documento "${docTitle}"? Esta ação não pode ser desfeita.`)) {
        await deleteDocById(currentDocId);
        showMessage("Documento excluído.");
        currentDocId = null;
        await loadDocumentsList();
    }
}

function debounceSave() {
    clearTimeout(saveTimeout);
    if (!editorReady || isSaving) return;
    saveStatus.textContent = 'Salvando...';
    saveTimeout = setTimeout(async () => {
        if (!currentDocId) {
            saveStatus.textContent = "Nenhum documento ativo para salvar.";
            return;
        }
        isSaving = true;
        const doc = await getDoc(currentDocId);
        if (doc) {
            doc.content = editor.value;
            doc.updatedAt = Date.now();
            await saveDoc(doc);
            saveStatus.textContent = 'Salvo localmente';
        }
        isSaving = false;
    }, 1500);
}

/* --- Editor Features (mantém igual) --- */
function updateStatusBar() {
    const text = editor.value;
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    wordCountEl.textContent = `Palavras: ${words}`;
    charCountEl.textContent = `Caracteres: ${chars}`;
}

function downloadAsTxt() {
    const text = editor.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let docTitle = 'documento';
    if (docSelector.selectedIndex !== -1) {
        docTitle = docSelector.options[docSelector.selectedIndex].text.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    }
    a.download = `${docTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* --- UI Management (tema, régua, modais) --- */
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        toggleModeBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        document.documentElement.classList.remove('dark');
        toggleModeBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
}
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    loadTheme();
    lucide.createIcons();
}
function updateRulerPosition() {
    const column = parseInt(rulerColumnInput.value) || 80;
    document.documentElement.style.setProperty('--ruler-column', column);
    localStorage.setItem('rulerColumn', column);
}
function loadRulerPosition() {
    const savedColumn = localStorage.getItem('rulerColumn');
    if (savedColumn) {
        rulerColumnInput.value = savedColumn;
    }
    updateRulerPosition();
}
function showMessage(message, duration = 3000) {
    messageBox.textContent = message;
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}
function openModal(overlay) { overlay.classList.add('show'); }
function closeModal(overlay) { overlay.classList.remove('show'); }

/* --- Event Listeners --- */
function addEventListeners() {
    editor.addEventListener('input', () => {
        if (editorReady) debounceSave();
        updateStatusBar();
    });
    editor.addEventListener('scroll', () => {
        rulerLine.style.transform = `translateX(-${editor.scrollLeft}px)`;
    });
    editor.addEventListener('keydown', handleKeyboardShortcuts);
    toggleModeBtn.addEventListener('click', toggleTheme);
    rulerColumnInput.addEventListener('input', updateRulerPosition);
    docSelector.addEventListener('change', (e) => switchDocument(e.target.value));
    newDocBtn.addEventListener('click', () => createNewDocument());
    deleteDocBtn.addEventListener('click', deleteCurrentDocument);
    downloadBtn.addEventListener('click', downloadAsTxt);
    showShortcutsBtn.addEventListener('click', () => openModal(shortcutsModalOverlay));
    document.getElementById('shortcuts-modal-close-btn').addEventListener('click', () => closeModal(shortcutsModalOverlay));
    shortcutsModalOverlay.addEventListener('click', (e) => e.target === shortcutsModalOverlay && closeModal(shortcutsModalOverlay));
    findReplaceBtn.addEventListener('click', () => openModal(findReplaceModalOverlay));
    document.getElementById('find-replace-modal-close-btn').addEventListener('click', () => closeModal(findReplaceModalOverlay));
    findReplaceModalOverlay.addEventListener('click', (e) => e.target === findReplaceModalOverlay && closeModal(findReplaceModalOverlay));
    // Localizar e substituir
    const findInput = document.getElementById('find-input');
    const replaceInput = document.getElementById('replace-input');
    document.getElementById('replace-btn').addEventListener('click', () => {
        const findValue = findInput.value;
        const replaceValue = replaceInput.value;
        if (!findValue) return;
        const currentSelection = editor.value.substring(editor.selectionStart, editor.selectionEnd);
        if(currentSelection.toLowerCase() === findValue.toLowerCase()) {
            editor.setRangeText(replaceValue, editor.selectionStart, editor.selectionEnd, 'select');
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
    document.getElementById('replace-all-btn').addEventListener('click', () => {
        const findValue = findInput.value;
        const replaceValue = replaceInput.value;
        if (!findValue) return;
        const originalValue = editor.value;
        const newValue = originalValue.replaceAll(findValue, replaceValue);
        if(originalValue !== newValue){
            editor.value = newValue;
            showMessage("Todas as ocorrências foram substituídas.", 2000);
        } else {
            showMessage("Nenhuma ocorrência encontrada.", 2000);
        }
    });
    document.addEventListener('keydown', handleKeyboardShortcuts);
}
function handleKeyboardShortcuts(e) {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const key = e.key.toLowerCase();

    if (isCtrlOrCmd && key === 's') {
        e.preventDefault();
        clearTimeout(saveTimeout);
        debounceSave();
        showMessage("Salvando...", 1000);
        return;
    }

    if (isCtrlOrCmd && key === 'n') {
        e.preventDefault();
        createNewDocument();
        return;
    }

    if (isCtrlOrCmd && key === 'f') {
        e.preventDefault();
        openModal(findReplaceModalOverlay);
        document.getElementById('find-input').focus();
        return;
    }

    // Converter para maiúsculas
    if (isCtrlOrCmd && key === 'u') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (start === end) return;
        const selectedText = editor.value.substring(start, end);
        const upperText = selectedText.toUpperCase();
        editor.setRangeText(upperText, start, end, 'select');
        debounceSave();
        return;
    }

    // Duplicar linha
    if (isCtrlOrCmd && isShift && key === 'd') {
        e.preventDefault();
        const { value, selectionStart, selectionEnd } = editor;
        const lines = value.split('\n');
        const startLine = value.substring(0, selectionStart).split('\n').length - 1;
        const endLine = value.substring(0, selectionEnd).split('\n').length - 1;

        const linesToDuplicate = lines.slice(startLine, endLine + 1);
        const duplicatedText = linesToDuplicate.join('\n');

        lines.splice(endLine + 1, 0, duplicatedText);
        const newValue = lines.join('\n');
        editor.value = newValue;

        const newCursorPos = selectionEnd + duplicatedText.length + 1;
        editor.setSelectionRange(newCursorPos, newCursorPos);
        debounceSave();
        return;
    }

    // Mover linha para cima/baixo
    if (isAlt && isShift && (key === 'arrowup' || key === 'arrowdown')) {
        e.preventDefault();
        const { value, selectionStart, selectionEnd } = editor;
        const lines = value.split('\n');
        let startLine = value.substring(0, selectionStart).split('\n').length - 1;
        let endLine = value.substring(0, selectionEnd).split('\n').length - 1;

        // Corrige o cálculo da linha final se a seleção terminar no início de uma nova linha
        if (selectionEnd > 0 && value[selectionEnd-1] === '\n') {
            endLine--;
        }

        if (key === 'arrowup') {
            if (startLine === 0) return;
            const block = lines.splice(startLine, endLine - startLine + 1);
            lines.splice(startLine - 1, 0, ...block);
            editor.value = lines.join('\n');

            const newStart = value.substring(0, selectionStart).lastIndexOf('\n', selectionStart - 2) + 1;
            editor.setSelectionRange(newStart, newStart + (selectionEnd - selectionStart));

        } else { // arrowdown
            if (endLine >= lines.length - 1) return;
            const block = lines.splice(startLine, endLine - startLine + 1);
            lines.splice(startLine + 1, 0, ...block);
            editor.value = lines.join('\n');

            const newStart = value.indexOf('\n', selectionStart) + 1;
            editor.setSelectionRange(newStart, newStart + (selectionEnd - selectionStart));
        }
        debounceSave();
        return;
    }
}

/* --- Inicialização --- */
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    lucide.createIcons();
    loadRulerPosition();
    userIdDisplay.textContent = `Local`;
    editor.placeholder = "Carregando documentos...";
    await loadDocumentsList();
    editorReady = true;
    addEventListeners();
    updateStatusBar();
});
