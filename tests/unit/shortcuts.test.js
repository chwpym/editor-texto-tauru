import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as shortcuts from '../../js/shortcuts.js';

// Simulador de Textarea para o Vitest
function createMockEditor(value = "", start = 0, end = 0) {
  return {
    value,
    selectionStart: start,
    selectionEnd: end,
    setSelectionRange: vi.fn((s, e) => {
      this.selectionStart = s;
      this.selectionEnd = e;
    }),
    // Helper para o mock atualizar a própria seleção
    updateSelection(s, e) {
      this.selectionStart = s;
      this.selectionEnd = e;
    }
  };
}

describe('Lógica de Atalhos (Shortcuts)', () => {
  
  it('Ctrl+Shift+D: deve duplicar a linha atual', () => {
    const editor = {
      value: "Linha 1\nLinha 2",
      selectionStart: 2, // No meio da "Linha 1"
      selectionEnd: 2,
      setSelectionRange: vi.fn()
    };

    shortcuts.duplicateLine(editor);
    
    expect(editor.value).toBe("Linha 1\nLinha 1\nLinha 2");
  });

  it('Ctrl+Shift+U: deve converter seleção para MAIÚSCULAS e vice-versa', () => {
    const editor = {
      value: "texto simples",
      selectionStart: 0,
      selectionEnd: 5, // "texto"
      setSelectionRange: vi.fn()
    };

    // Primeira vez: MAIÚSCULAS
    shortcuts.toggleCase(editor);
    expect(editor.value).toBe("TEXTO simples");

    // Segunda vez: minúsculas
    editor.selectionStart = 0;
    editor.selectionEnd = 5;
    shortcuts.toggleCase(editor);
    expect(editor.value).toBe("texto simples");
  });

  it('Alt+Shift+Down: deve mover a linha para baixo', () => {
    const editor = {
      value: "Linha A\nLinha B\nLinha C",
      selectionStart: 0, // No início da Linha A
      selectionEnd: 0,
      setSelectionRange: vi.fn()
    };

    shortcuts.moveLine(editor, 1);
    expect(editor.value).toBe("Linha B\nLinha A\nLinha C");
  });

  it('Alt+Shift+Up: deve mover a linha para cima', () => {
    const editor = {
      value: "Linha A\nLinha B\nLinha C",
      selectionStart: 9, // No início da Linha B (considerando \n)
      selectionEnd: 9,
      setSelectionRange: vi.fn()
    };

    shortcuts.moveLine(editor, -1);
    expect(editor.value).toBe("Linha B\nLinha A\nLinha C");
  });
});
