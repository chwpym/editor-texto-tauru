/* ========================================
   UTILS - Diálogos e Helpers Genéricos
   ======================================== */

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
    const cancelBtn = document.getElementById("confirm-modal-cancel-btn"); // Ajustado seletor se necessário

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = defaultValue;
    overlay.classList.add("show");

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
      const cancelBtnPrompt = document.getElementById("prompt-modal-cancel-btn");
      if(cancelBtnPrompt) cancelBtnPrompt.removeEventListener("click", handleCancel);
      inputEl.removeEventListener("keydown", handleKey);
    };
    const handleKey = (e) => {
      if (e.key === "Enter") handleOk();
      if (e.key === "Escape") handleCancel();
    };

    okBtn.addEventListener("click", handleOk);
    const cancelBtnMain = document.getElementById("prompt-modal-cancel-btn") || cancelBtn;
    cancelBtnMain.addEventListener("click", handleCancel);
    inputEl.addEventListener("keydown", handleKey);
  });
}

/**
 * Exibe mensagem toast rápida
 */
export function showMessage(text, duration = 3000) {
  const messageBox = document.getElementById("message-box");
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.opacity = "1";
  messageBox.style.transform = "translateX(-50%) translateY(0)";

  setTimeout(() => {
    messageBox.style.opacity = "0";
    messageBox.style.transform = "translateX(-50%) translateY(100px)";
  }, duration);
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
