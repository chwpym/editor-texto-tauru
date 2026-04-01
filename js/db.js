// ========================================
// INDEXEDDB - GERENCIAMENTO DE BANCO DE DADOS
// ========================================

const DB_NAME = "editor-codigo-db";
const STORE_NAME = "documents";
let db = null;

/**
 * Abre conexão com IndexedDB
 */
export function openDB() {
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

/**
 * Retorna todos os documentos
 */
export function getAllDocs() {
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

/**
 * Retorna um documento por ID
 */
export function getDoc(id) {
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

/**
 * Salva ou atualiza um documento
 */
export function saveDoc(doc) {
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

/**
 * Deleta um documento por ID
 */
export function deleteDocById(id) {
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

/**
 * Exporta todos os documentos para JSON
 */
export async function exportAllDocs() {
  const docs = await getAllDocs();
  const blob = new Blob([JSON.stringify(docs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_taurus_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa documentos a partir de um arquivo JSON
 */
export async function importDocs(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const docs = JSON.parse(e.target.result);
        if (!Array.isArray(docs)) throw new Error("Formato de backup inválido");
        for (const doc of docs) {
          if (doc.id && doc.name) await saveDoc(doc);
        }
        resolve(docs.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
