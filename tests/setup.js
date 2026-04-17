import { vi } from 'vitest';

// Mock do localStorage para testes que dependem dele
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn(key => { delete store[key]; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do randomUUID se não estiver disponível no happy-dom
if (!global.crypto) {
    global.crypto = {};
}
if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = vi.fn(() => 'test-uuid-1234');
}

// Mock do IndexedDB
global.indexedDB = {
  open: vi.fn().mockImplementation(() => {
    const request = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        transaction: vi.fn().mockImplementation(() => ({
          objectStore: vi.fn().mockImplementation(() => ({
            getAll: vi.fn().mockImplementation(() => {
              const req = { onsuccess: null, onerror: null, result: [] };
              setTimeout(() => req.onsuccess(), 0);
              return req;
            }),
            put: vi.fn().mockImplementation(() => {
              const req = { onsuccess: null, onerror: null };
              setTimeout(() => req.onsuccess(), 0);
              return req;
            }),
            get: vi.fn().mockImplementation(() => {
              const req = { onsuccess: null, onerror: null, result: null };
              setTimeout(() => req.onsuccess(), 0);
              return req;
            }),
            delete: vi.fn().mockImplementation(() => {
              const req = { onsuccess: null, onerror: null };
              setTimeout(() => req.onsuccess(), 0);
              return req;
            }),
          })),
          oncomplete: null,
          onerror: null,
        })),
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        createObjectStore: vi.fn()
      }
    };
    setTimeout(() => { if (request.onsuccess) request.onsuccess(); }, 0);
    return request;
  })
};


