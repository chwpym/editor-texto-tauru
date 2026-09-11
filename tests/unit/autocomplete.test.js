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
      clientWidth: 400,
      clientHeight: 200,
      scrollLeft: 0,
      scrollTop: 0,
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 })),
      setSelectionRange: vi.fn((s, e) => {
        editor.selectionStart = s;
        editor.selectionEnd = e;
      })
    };
  });

  it('deve filtrar sugestões corretamente baseada no "lastWord"', () => {
    editor.value = "digi";
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

  it('deve emitir a sugestão escolhida para o editor aplicar', () => {
    editor.value = "No meio da fra ";
    editor.selectionStart = 14; 
    editor.selectionEnd = 14;
    const listener = vi.fn();
    window.addEventListener('accept-autocomplete-internal', listener, { once: true });
    
    auto.acceptAutocomplete(editor, "frase");
    
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail.suggestion).toBe("frase");
  });

  it('deve renderizar sugestões como texto, sem interpretar HTML', () => {
    editor.value = "te";
    editor.selectionStart = 2;
    editor.selectionEnd = 2;

    auto.triggerAutocomplete(editor, ['teste<img src=x onerror=alert(1)>']);

    const popup = document.getElementById("autocomplete-popup");
    expect(popup.querySelector('img')).toBeNull();
    expect(popup.textContent).toContain('teste<img src=x onerror=alert(1)>');
  });

  it('hideAutocompletePopup: deve esconder o popup', () => {
    const popup = document.getElementById("autocomplete-popup");
    popup.classList.remove("hidden");
    
    auto.hideAutocompletePopup();
    expect(popup.classList.contains("hidden")).toBe(true);
  });
});
