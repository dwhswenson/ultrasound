// Mock canvas and related APIs for testing
import { vi, afterEach } from "vitest";

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

// Mock Path2D for canvas path operations
global.Path2D = vi.fn(function Path2DMock() {
  return {
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
  };
});

// Mock animation frame methods with proper cleanup tracking
const pendingAnimationFrames = new Map<number, NodeJS.Timeout>();
let frameIdCounter = 1;

global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  const id = frameIdCounter++;
  const timeoutId = setTimeout(() => {
    // Remove from tracking when callback executes
    pendingAnimationFrames.delete(id);
    cb(Date.now());
  }, 16); // Use 16ms to simulate ~60fps

  // Track the timeout so we can clean it up
  pendingAnimationFrames.set(id, timeoutId);
  return id;
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  const timeoutId = pendingAnimationFrames.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingAnimationFrames.delete(id);
  }
});

// Automatically cleanup all pending animation frames after each test
afterEach(() => {
  // Cancel all pending animation frames
  for (const [id, timeoutId] of pendingAnimationFrames) {
    clearTimeout(timeoutId);
  }
  pendingAnimationFrames.clear();

  // Reset the counter for the next test
  frameIdCounter = 1;
});
