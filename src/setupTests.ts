// Mock canvas and related APIs for testing
import { vi } from "vitest";

// Mock Canvas API manually since we don't have jest-canvas-mock
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  strokeText: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  getLineDash: vi.fn(() => []),
  setLineDash: vi.fn(),
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => mockCanvasContext),
  writable: true,
});

Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
  value: vi.fn((callback) => {
    const mockBlob = new Blob(["mock canvas data"], { type: "image/png" });
    callback(mockBlob);
  }),
  writable: true,
});

// Mock createImageBitmap which isn't available in jsdom
global.createImageBitmap = vi.fn().mockImplementation(() =>
  Promise.resolve({
    width: 100,
    height: 100,
    close: vi.fn(),
  } as ImageBitmap),
);

// Mock URL methods
global.URL.createObjectURL = vi.fn().mockReturnValue("mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock animation frame methods
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});
