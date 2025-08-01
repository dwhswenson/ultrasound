// Mock canvas and related APIs for testing
import 'jest-canvas-mock';

// Mock createImageBitmap which isn't available in jsdom
global.createImageBitmap = jest.fn().mockImplementation(() =>
  Promise.resolve({
    width: 100,
    height: 100,
    close: jest.fn(),
  } as ImageBitmap)
);

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock HTMLCanvasElement.toBlob
HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((callback) => {
  const mockBlob = new Blob(['mock canvas data'], { type: 'image/png' });
  callback(mockBlob);
});

// Mock requestAnimationFrame if needed
global.requestAnimationFrame = jest.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = jest.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Set up console to be quiet during tests unless there are errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Only show console.error during tests if it's a real error
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
    originalConsoleError(...args);
  }
};
