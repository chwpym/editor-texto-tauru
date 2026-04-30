/* ========================================
   DOCUMENTS - Gerenciamento de Arquivos
   ======================================== */

import * as db from './db.js';
import * as ui from './ui.js';
import * as utils from './utils.js';
import * as core from './editorCore.js';
import * as tabs from './tabs.js';

/**
 * Troca o documento ativo
 */
export async function switchDocument(docId, state) {
  if (!docId) {
    state.currentDocId = null;
    const editor = document.getElementById("editor");
    const lineNumbers = document.getElementById("line-numbers");
    if (editor) {
      editor.value = "";
      editor.disabled = true;
      core.resetLineCount(lineNumbers);
      core.updateStatusBarMetrics(editor, state.metrics);
      core.updateLineNumbers(editor, lineNumbers);
    }
    ui.updateEmptyState(null);
    return;
  }


  // Adiciona aba
  if (!state.openTabs.includes(docId)) {
    state.openTabs.push(docId);
    tabs.saveOpenTabs(state.openTabs);
  }

  state.currentDocId = docId;
  localStorage.setItem(`lastDocId`, docId);
  
  ui.updateEmptyState(docId);
  tabs.renderTabs(state.tabsBar, state.openTabs, docId, db, state.tabNewBtn);

  const editor = document.getElementById("editor");
  const docSelector = document.getElementById("doc-selector");
  const lineNumbers = document.getElementById("line-numbers");

  editor.value = "Carregando...";
  editor.disabled = true;
  
  const doc = await db.getDoc(docId);
  if (doc) {
    editor.value = doc.content || "";
    state.contentBeforeEdit = editor.value;
    
    core.resetLineCount(lineNumbers);
    core.updateStatusBarMetrics(editor, state.metrics);
    core.updateLineNumbers(editor, lineNumbers);
    
    if (docSelector.value !== docId) {
      docSelector.value = docId;
    }
  } else {
    // Caso de erro: documento sumiu do banco
    window.closeTab(docId);
    return;
  }
  
  editor.disabled = false;
  ui.renderSaveStatus("saved");
}

/**
 * Cria novo documento
 */
export async function createNewDocument(defaultTitle = "Novo Documento", state) {
  const newTitle = await utils.customPrompt("Novo Documento", "Digite o título do documento:", defaultTitle);
  if (!newTitle) return;
  
  const newDoc = {
    id: crypto.randomUUID(),
    name: newTitle.trim(),
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await db.saveDoc(newDoc);
  utils.showMessage(`Documento "${newTitle}" criado!`);
  
  await loadDocumentsList(state.docSelector);
  await switchDocument(newDoc.id, state);
  state.contentBeforeEdit = "";
}

/**
 * Lista documentos salvos no seletor
 */
export async function loadDocumentsList(docSelector) {
  const docs = await db.getAllDocs();
  docs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  
  if (!docSelector) return;
  
  docSelector.innerHTML = "";
  if (docs.length === 0) return [];
  
  docs.forEach((docData) => {
    const option = document.createElement("option");
    option.value = docData.id;
    option.textContent = docData.name || `Sem título`;
    docSelector.appendChild(option);
  });
  
  return docs;
}

/**
 * Renomear documento ativo
 */
export async function renameCurrentDocument(currentDocId, docSelector) {
  if (!currentDocId) {
    utils.showMessage("Nenhum documento selecionado", 2000);
    return;
  }

  const doc = await db.getDoc(currentDocId);
  if (!doc) return;

  const newName = await utils.customPrompt("Renomear Documento", "Digite o novo nome:", doc.name);
  if (!newName || newName.trim() === "" || newName === doc.name) return;

  doc.name = newName.trim();
  doc.updatedAt = Date.now();
  await db.saveDoc(doc);

  await loadDocumentsList(docSelector);
  docSelector.value = currentDocId;
  utils.showMessage(`Renomeado para "${newName}"`, 2000);
}

/**
 * Atualiza o conteúdo de um documento
 */
export async function updateDocument(docId, content) {
  if (!docId) return;
  const doc = await db.getDoc(docId);
  if (!doc) return;
  
  doc.content = content;
  doc.updatedAt = Date.now();
  await db.saveDoc(doc);
}
