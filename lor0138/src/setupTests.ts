// Polyfills para jsPDF e outras bibliotecas que precisam de APIs do navegador
// IMPORTANTE: Deve vir ANTES de qualquer import que precise de TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
import { TransformStream } from 'stream/web';

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock env.ts (import.meta.env não funciona no Jest)
// O Jest vai usar automaticamente o arquivo __mocks__/env.ts
jest.mock('./shared/utils/env');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
// @ts-ignore
global.TransformStream = TransformStream;

// Mock BroadcastChannel (usado por MSW)
global.BroadcastChannel = class BroadcastChannel {
  name: string;
  onmessage: ((event: any) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(_message: any) {
    // No-op for tests
  }

  close() {
    // No-op for tests
  }

  addEventListener() {
    // No-op for tests
  }

  removeEventListener() {
    // No-op for tests
  }
} as any;

// Mock fetch global
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.matchMedia (para Ant Design)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: jest.fn(),
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

// ============================================================================
// MSW (Mock Service Worker) Setup
// ============================================================================
// Importação lazy do server para garantir que polyfills foram aplicados
let server: any;

beforeAll(async () => {
  const { server: mswServer } = await import('./mocks/server');
  server = mswServer;
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  if (server) {
    server.resetHandlers();
  }
});

afterAll(() => {
  if (server) {
    server.close();
  }
});
