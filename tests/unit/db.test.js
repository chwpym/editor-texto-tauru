import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dbUtils from '../../js/db.js';

// Mocks para APIs de Navegador
class MockBlob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
    this.size = JSON.stringify(content).length;
    this.type = options?.type || "";
  }
}
global.Blob = MockBlob;

global.URL = {
  createObjectURL: vi.fn(() => 'blob:test-url'),
  revokeObjectURL: vi.fn()
};

// Mock da FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  readAsText(file) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: file.content || "" } });
      }
    }, 0);
  }
};


describe('Segurança de Dados: Backup e Restauração', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exportAllDocs: deve ler todos os docs e disparar download do backup', async () => {
    // Mock do elemento 'a' para download
    const mockA = { click: vi.fn(), href: '', download: '' };
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'a') return mockA;
      return document.createElement(tag);
    });

    await dbUtils.exportAllDocs();

    expect(mockA.download).toContain('backup_taurus_');
    expect(mockA.click).toHaveBeenCalled();
  });

  it('importDocs: deve importar documentos válidos de um backup', async () => {
    const backupContent = JSON.stringify([
      { id: '3', name: 'Documento Importado', content: 'Conteúdo Restaurado' }
    ]);
    const mockFile = { content: backupContent };

    const count = await dbUtils.importDocs(mockFile);

    expect(count).toBe(1);
    // Verificamos se no localStorage o status mudou ou se algo foi salvo 
    // (O mock do setup garante que o saveDoc no repositório fake funcione)
  });

  it('importDocs: deve falhar se o formato for inválido (não array)', async () => {
    const invalidContent = JSON.stringify({ not: "an array" });
    const mockFile = { content: invalidContent };

    await expect(dbUtils.importDocs(mockFile)).rejects.toThrow("Formato de backup inválido");
  });
});

