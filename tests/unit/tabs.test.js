import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as tabs from '../../js/tabs.js';

describe('Gerenciamento de Abas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve carregar abas vazias se o localStorage estiver limpo', () => {
    const openTabs = tabs.getOpenTabsFromStorage();
    expect(openTabs).toEqual([]);
  });

  it('deve salvar e carregar abas corretamente', () => {
    const testTabs = ['uuid-1', 'uuid-2'];
    tabs.saveOpenTabs(testTabs);
    
    const loadedTabs = tabs.getOpenTabsFromStorage();
    expect(loadedTabs).toEqual(testTabs);
    expect(localStorage.setItem).toHaveBeenCalledWith('openTabs', JSON.stringify(testTabs));
  });
});
