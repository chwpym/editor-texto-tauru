import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as theme from '../../js/theme.js';

describe('Sistema de Temas Dinâmicos', () => {

  beforeEach(() => {
    // Resetar documentElement.style
    document.documentElement.style.cssText = "";
    localStorage.clear();
  });

  it('initThemeSystem: deve carregar o tema taurus por padrão se o localStorage estiver vazio', () => {
    theme.initThemeSystem();
    
    // O tema taurus (editor-bg: #020617) deve ser aplicado
    const bg = document.documentElement.style.getPropertyValue('--theme-editor-bg');
    expect(bg).toBe("#020617");

  });

  it('applyTheme: deve alterar variáveis :root ao trocar de tema', () => {
    // Tema Dracula (#282a36 bg)
    theme.applyTheme("dracula");
    
    const bg = document.documentElement.style.getPropertyValue('--theme-editor-bg');
    expect(bg).toBe("#282a36");
    expect(localStorage.getItem('selectedTheme')).toBe("dracula");
  });

  it('applyTheme: deve injetar cores de texto corretas', () => {
    theme.applyTheme("tokyo"); // Tokyo Night (#1a1b26 bg)
    
    const text = document.documentElement.style.getPropertyValue('--theme-editor-text');
    expect(text).toBe("#a9b1d6");
  });
});
