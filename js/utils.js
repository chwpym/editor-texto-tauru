/* ========================================
   UTILS - Diálogos e Helpers Genéricos
   ======================================== */

import * as ui from './ui.js';

/**
 * Caixa de confirmação customizada (substitui confirm() nativo)
 */
export function customConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("confirm-modal-overlay");
    const titleEl = document.getElementById("confirm-modal-title");
    const messageEl = document.getElementById("confirm-modal-message");
    const okBtn = document.getElementById("confirm-modal-ok-btn");
    const cancelBtn = document.getElementById("confirm-modal-cancel-btn");

    titleEl.textContent = title;
    messageEl.textContent = message;
    ui.openModal(overlay);

    const handleOk = () => {
      ui.closeModal(overlay);
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      ui.closeModal(overlay);
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

/**
 * Caixa de entrada customizada (substitui prompt() nativo)
 */
export function customPrompt(title, message, defaultValue = "") {
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
    ui.openModal(overlay);

    setTimeout(() => inputEl.focus(), 100);

    const handleOk = () => {
      const val = inputEl.value;
      ui.closeModal(overlay);
      cleanup();
      resolve(val);
    };
    const handleCancel = () => {
      ui.closeModal(overlay);
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

/**
 * Exibe mensagem toast rápida (repassa para ui.js)
 */
export function showMessage(text, type = "info") {
  ui.showMessage(text, type);
}

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
