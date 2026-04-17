import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as auto from '../../js/autocomplete.js';

describe('Lógica de Autocomplete', () => {
  let editor;

  beforeEach(() => {
    // Mock do DOM necessário para o autocomplete (mesmo com Happy-DOM)
    document.body.innerHTML = '<div id="autocomplete-popup" class="hidden"></div>';
    // Mockamos o getCursorXY para não depender de medição de pixel no happy-dom
    vi.spyOn(auto, 'getCursorXY').mockReturnValue({ top: 10, left: 10, height: 18 });
    auto.initAutocomplete();

    editor = {


      value: "",
      selectionStart: 0,
      selectionEnd: 0,
      setSelectionRange: vi.fn((s, e) => {
        editor.selectionStart = s;
        editor.selectionEnd = e;
      })
    };
  });

  it('deve filtrar sugestões corretamente baseada no "lastWord"', () => {
    editor.selectionStart = 4;
    editor.selectionEnd = 4;
    const keywords = ["digital", "digitando", "banana"];


    auto.triggerAutocomplete(editor, keywords);
    
    // Como innerHTML é populado via renderSuggestions(), vamos checar o conteúdo do popup
    const popup = document.getElementById("autocomplete-popup");
    expect(popup.innerHTML).toContain("digital");
    expect(popup.innerHTML).toContain("digitando");
    expect(popup.innerHTML).not.toContain("banana");
  });

  it('deve inserir a sugestão escolhida na posição correta', () => {
    editor.value = "No meio da fra ";
    editor.selectionStart = 14; 
    editor.selectionEnd = 14;
    
    auto.acceptAutocomplete(editor, "frase");
    
    expect(editor.value).toBe("No meio da frase ");
    expect(editor.selectionStart).toBe(19); // "frase" tem 5 chars, começou em 11 (pós-espaço)
  });

  it('hideAutocompletePopup: deve esconder o popup', () => {
    const popup = document.getElementById("autocomplete-popup");
    popup.classList.remove("hidden");
    
    auto.hideAutocompletePopup();
    expect(popup.classList.contains("hidden")).toBe(true);
  });
});
