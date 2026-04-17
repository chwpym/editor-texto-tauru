/* ========================================
   THEME - Gerenciamento de Visual e Temas 🎨
   ======================================== */

/**
 * Definição dos Temas Disponíveis
 * As cores aqui alimentam variáveis CSS dinâmicas (:root)
 */
export const THEMES = [
  { 
    id: "taurus", 
    name: "Taurus Dark", 
    dark: true, 
    editorBg: "#020617", 
    editorText: "#e2e8f0", 
    gutterBg: "#020617", 
    gutterText: "#475569", 
    toolbarBg: "#0f172a",
    statusbarBg: "#0f172a",
    border: "rgba(255,255,255,0.05)"
  },
  { 
    id: "vscode", 
    name: "VS Code Dark+", 
    dark: true, 
    editorBg: "#1e1e1e", 
    editorText: "#d4d4d4", 
    gutterBg: "#1e1e1e", 
    gutterText: "#858585",
    toolbarBg: "#2d2d2d",
    statusbarBg: "#007acc",
    border: "rgba(255,255,255,0.1)"
  },
  { 
    id: "tokyo", 
    name: "Tokyo Night", 
    dark: true, 
    editorBg: "#1a1b2e", 
    editorText: "#a9b1d6", 
    gutterBg: "#1a1b2e", 
    gutterText: "#3b4261",
    toolbarBg: "#16213e",
    statusbarBg: "#16213e",
    border: "rgba(255,255,255,0.08)"
  },
  { 
    id: "ayu", 
    name: "Ayu Dark", 
    dark: true, 
    editorBg: "#0d1017", 
    editorText: "#bfbdb6", 
    gutterBg: "#0d1017", 
    gutterText: "#3d424d",
    toolbarBg: "#131721",
    statusbarBg: "#e6b450",
    border: "rgba(255,255,255,0.05)"
  },
  { 
    id: "dracula", 
    name: "Dracula", 
    dark: true, 
    editorBg: "#282a36", 
    editorText: "#f8f8f2", 
    gutterBg: "#282a36", 
    gutterText: "#6272a4",
    toolbarBg: "#21222c",
    statusbarBg: "#bd93f9",
    border: "rgba(255,255,255,0.1)"
  },
  { 
    id: "light", 
    name: "Luz Clara", 
    dark: false, 
    editorBg: "#ffffff", 
    editorText: "#1e293b", 
    gutterBg: "#ffffff", 
    gutterText: "#94a3b8",
    toolbarBg: "#f1f5f9",
    statusbarBg: "#e2e8f0",
    border: "rgba(0,0,0,0.08)"
  },
];

/**
 * Aplica um tema à interface atualizando o DOM e variáveis CSS
 */
export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const html = document.documentElement;

  // Alterna classe .dark para o Tailwind e temas base
  if (theme.dark) { 
    html.classList.add("dark"); 
  } else { 
    html.classList.remove("dark"); 
  }

  // Define atributo data-theme para seletores CSS complexos
  html.setAttribute("data-theme", theme.id);

  // Injeta variáveis CSS dinamicamente para o tema selecionado
  const root = document.querySelector(':root');
  root.style.setProperty('--theme-editor-bg', theme.editorBg);
  root.style.setProperty('--theme-editor-text', theme.editorText);
  root.style.setProperty('--theme-gutter-bg', theme.gutterBg);
  root.style.setProperty('--theme-gutter-text', theme.gutterText);
  root.style.setProperty('--theme-toolbar-bg', theme.toolbarBg);
  root.style.setProperty('--theme-statusbar-bg', theme.statusbarBg);
  root.style.setProperty('--theme-border', theme.border);

  localStorage.setItem("selectedTheme", themeId);
  
  // Re-inicializa ícones lucide se estiverem disponíveis
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Inicializa o sistema de temas no carregamento do app
 */
export function initThemeSystem(openThemePickerFunc) {
  const btn = document.getElementById("theme-picker-btn");
  if (btn) btn.addEventListener("click", openThemePickerFunc);

  const saved = localStorage.getItem("selectedTheme") || "taurus";
  applyTheme(saved);
}
