/* ========================================
   THEME - Gerenciamento de Visual e Temas
   ======================================== */

export const THEMES = [
  { id: "taurus", name: "Taurus Dark", dark: true, editorBg: "#020617", editorText: "#e2e8f0", gutterBg: "#020617", gutterText: "#475569", line1: "#475569", line2: "#334155", line3: "#1e293b" },
  { id: "vscode", name: "VS Code Dark+", dark: true, editorBg: "#1e1e1e", editorText: "#d4d4d4", gutterBg: "#1e1e1e", gutterText: "#858585", line1: "#858585", line2: "#569cd6", line3: "#4ec9b0" },
  { id: "tokyo", name: "Tokyo Night", dark: true, editorBg: "#1a1b2e", editorText: "#a9b1d6", gutterBg: "#1a1b2e", gutterText: "#3b4261", line1: "#7aa2f7", line2: "#9ece6a", line3: "#bb9af7" },
  { id: "ayu", name: "Ayu Dark", dark: true, editorBg: "#0d1017", editorText: "#bfbdb6", gutterBg: "#0d1017", gutterText: "#3d424d", line1: "#e6b450", line2: "#7fd962", line3: "#59c2ff" },
  { id: "dracula", name: "Dracula", dark: true, editorBg: "#282a36", editorText: "#f8f8f2", gutterBg: "#282a36", gutterText: "#6272a4", line1: "#ff79c6", line2: "#50fa7b", line3: "#bd93f9" },
  { id: "light", name: "Light", dark: false, editorBg: "#ffffff", editorText: "#1e293b", gutterBg: "#ffffff", gutterText: "#94a3b8", line1: "#94a3b8", line2: "#334155", line3: "#3b82f6" },
];

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const html = document.documentElement;

  if (theme.dark) { html.classList.add("dark"); } 
  else { html.classList.remove("dark"); }

  if (theme.id === "taurus" || theme.id === "light") { html.removeAttribute("data-theme"); } 
  else { html.setAttribute("data-theme", theme.id); }

  localStorage.setItem("selectedTheme", themeId);
  if (window.lucide) window.lucide.createIcons();
}

export function initThemeSystem(openThemePickerFunc) {
  const btn = document.getElementById("theme-picker-btn");
  if (btn) btn.addEventListener("click", openThemePickerFunc);

  const saved = localStorage.getItem("selectedTheme") || "taurus";
  applyTheme(saved);
}


/**
 * Carrega o tema salvo do localStorage
 */
export function loadTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon();
}

/**
 * Alterna entre tema claro e escuro
 */
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
  updateThemeIcon();
}

/**
 * Atualiza o ícone do botão de tema (sol/lua)
 */
function updateThemeIcon() {
  const themeBtn = document.getElementById("toggle-mode-btn");
  if (!themeBtn) return;

  const icon = themeBtn.querySelector("i");
  if (!icon) return;

  const isDark = document.documentElement.classList.contains("dark");

  // Atualiza o ícone
  icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
  lucide.createIcons();
}
