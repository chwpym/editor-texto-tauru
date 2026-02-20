// ========================================
// SISTEMA DE TEMA CLARO/ESCURO
// ========================================

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
