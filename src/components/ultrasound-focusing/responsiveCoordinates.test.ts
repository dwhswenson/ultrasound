import { initializeUI } from "./main";

// Mock DOM elements
const createMockCanvas = (width: number, height: number, displayWidth: number, displayHeight: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.id = "animationCanvas";

  // Mock getBoundingClientRect to simulate responsive scaling
  canvas.getBoundingClientRect = jest.fn().mockReturnValue({
    left: 10,
    top: 20,
    width: displayWidth,
    height: displayHeight,
    right: 10 + displayWidth,
    bottom: 20 + displayHeight,
    x: 10,
    y: 20,
  });

  const ctx = {
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillText: jest.fn(),
    fillRect: jest.fn(),
    setLineDash: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "start" as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;

  canvas.getContext = jest.fn().mockReturnValue(ctx);
  return { canvas, ctx };
};

const createMockInput = (id: string, initialValue: string = "") => {
  const input = document.createElement("input");
  input.type = "number";
  input.id = id;
  input.value = initialValue;
  return input;
};

const createMockButton = (id: string) => {
  const button = document.createElement("button");
  button.id = id;
  button.disabled = false;
  return button;
};

// Mock global functions
beforeEach(() => {
  (global as any).createImageBitmap = jest.fn().mockResolvedValue({
    width: 640,
    height: 480,
    close: jest.fn(),
  } as ImageBitmap);

  // Clear any existing event listeners
  document.body.innerHTML = "";
});

describe("Responsive Canvas Coordinate Scaling", () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let targetXInput: HTMLInputElement;
  let targetYInput: HTMLInputElement;
  let unsetTargetBtn: HTMLButtonElement;
  let playPauseMovieBtn: HTMLButtonElement;
  let stopMovieBtn: HTMLButtonElement;
  let prevFrameBtn: HTMLButtonElement;
  let nextFrameBtn: HTMLButtonElement;
  let downloadFrameBtn: HTMLButtonElement;
  let speedOfSoundInput: HTMLInputElement;
  let movieDurationInput: HTMLInputElement;
  let numElementsInput: HTMLInputElement;
  let pitchInput: HTMLInputElement;

  const setupDOM = (canvasDisplayWidth: number, canvasDisplayHeight: number) => {
    // Create canvas with fixed internal dimensions but variable display size
    const canvasMock = createMockCanvas(640, 480, canvasDisplayWidth, canvasDisplayHeight);
    canvas = canvasMock.canvas;
    ctx = canvasMock.ctx;

    // Create required input elements
    targetXInput = createMockInput("targetX");
    targetYInput = createMockInput("targetY");
    speedOfSoundInput = createMockInput("speedOfSound", "150");
    movieDurationInput = createMockInput("movieDuration", "7.0");
    numElementsInput = createMockInput("numElements", "16");
    pitchInput = createMockInput("pitch", "50");

    // Create required buttons
    unsetTargetBtn = createMockButton("unsetTarget");
    playPauseMovieBtn = createMockButton("playPauseMovie");
    stopMovieBtn = createMockButton("stopMovie");
    prevFrameBtn = createMockButton("prevFrame");
    nextFrameBtn = createMockButton("nextFrame");
    downloadFrameBtn = createMockButton("downloadFrame");

    // Add elements to DOM
    document.body.appendChild(canvas);
    document.body.appendChild(targetXInput);
    document.body.appendChild(targetYInput);
    document.body.appendChild(speedOfSoundInput);
    document.body.appendChild(movieDurationInput);
    document.body.appendChild(numElementsInput);
    document.body.appendChild(pitchInput);
    document.body.appendChild(unsetTargetBtn);
    document.body.appendChild(playPauseMovieBtn);
    document.body.appendChild(stopMovieBtn);
    document.body.appendChild(prevFrameBtn);
    document.body.appendChild(nextFrameBtn);
    document.body.appendChild(downloadFrameBtn);

    // Mock getElementById to return our elements
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id: string) => {
      const elements: { [key: string]: HTMLElement } = {
        animationCanvas: canvas,
        targetX: targetXInput,
        targetY: targetYInput,
        speedOfSound: speedOfSoundInput,
        movieDuration: movieDurationInput,
        numElements: numElementsInput,
        pitch: pitchInput,
        unsetTarget: unsetTargetBtn,
        playPauseMovie: playPauseMovieBtn,
        stopMovie: stopMovieBtn,
        prevFrame: prevFrameBtn,
        nextFrame: nextFrameBtn,
        downloadFrame: downloadFrameBtn,
      };
      return elements[id] || originalGetElementById.call(document, id);
    });
  };

  afterEach(() => {
    // Restore original getElementById
    document.getElementById = Document.prototype.getElementById;
    document.body.innerHTML = "";
  });

  describe("Click Event Coordinate Scaling", () => {
    it("should handle clicks correctly when canvas is displayed at full size", async () => {
      // Canvas displayed at full 640x480 size
      setupDOM(640, 480);

      // Initialize UI to set up event listeners
      await initializeUI();

      // Simulate click at visual position (100, 50)
      const clickEvent = new MouseEvent("click", {
        clientX: 110, // 10 (rect.left) + 100
        clientY: 70,  // 20 (rect.top) + 50
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // At full size, coordinates should be 1:1
      expect(targetXInput.value).toBe("100");
      expect(targetYInput.value).toBe("50");
    });

    it("should handle clicks correctly when canvas is scaled down to 50%", async () => {
      // Canvas displayed at half size (320x240)
      setupDOM(320, 240);

      await initializeUI();

      // Simulate click at visual position (100, 50) on the scaled canvas
      const clickEvent = new MouseEvent("click", {
        clientX: 110, // 10 (rect.left) + 100
        clientY: 70,  // 20 (rect.top) + 50
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // Should scale coordinates: 100 * (640/320) = 200, 50 * (480/240) = 100
      expect(targetXInput.value).toBe("200");
      expect(targetYInput.value).toBe("100");
    });

    it("should handle clicks correctly when canvas is scaled down to 75%", async () => {
      // Canvas displayed at 75% size (480x360)
      setupDOM(480, 360);

      await initializeUI();

      // Simulate click at visual position (120, 90)
      const clickEvent = new MouseEvent("click", {
        clientX: 130, // 10 (rect.left) + 120
        clientY: 110, // 20 (rect.top) + 90
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // Should scale coordinates: 120 * (640/480) = 160, 90 * (480/360) = 120
      expect(targetXInput.value).toBe("160");
      expect(targetYInput.value).toBe("120");
    });

    it("should handle clicks correctly when canvas is scaled down for mobile", async () => {
      // Canvas displayed at mobile size (320x240)
      setupDOM(320, 240);

      await initializeUI();

      // Simulate click at edge of scaled canvas
      const clickEvent = new MouseEvent("click", {
        clientX: 330, // 10 (rect.left) + 320 (full width of displayed canvas)
        clientY: 260, // 20 (rect.top) + 240 (full height of displayed canvas)
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // Should scale to full canvas coordinates: 320 * (640/320) = 640, 240 * (480/240) = 480
      expect(targetXInput.value).toBe("640");
      expect(targetYInput.value).toBe("480");
    });
  });

  describe("MouseMove Event Coordinate Scaling", () => {
    // Mock updateCoordinateDisplay function
    let mockUpdateCoordinateDisplay: jest.Mock;

    beforeEach(() => {
      // Mock the updateCoordinateDisplay function
      mockUpdateCoordinateDisplay = jest.fn();
      (window as any).updateCoordinateDisplay = mockUpdateCoordinateDisplay;

      // Mock the function in the main module
      const mainModule = require("./main");
      if (mainModule.updateCoordinateDisplay) {
        jest.spyOn(mainModule, "updateCoordinateDisplay").mockImplementation(mockUpdateCoordinateDisplay);
      }
    });

    it("should scale mousemove coordinates correctly at full size", async () => {
      setupDOM(640, 480);
      await initializeUI();

      // Create a custom event listener to capture the coordinates
      let capturedX: number, capturedY: number;
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        capturedX = (event.clientX - rect.left) * scaleX;
        capturedY = (event.clientY - rect.top) * scaleY;
      });

      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 160, // 10 (rect.left) + 150
        clientY: 120, // 20 (rect.top) + 100
        bubbles: true,
      });

      canvas.dispatchEvent(mouseMoveEvent);

      expect(capturedX!).toBe(150);
      expect(capturedY!).toBe(100);
    });

    it("should scale mousemove coordinates correctly when scaled down", async () => {
      setupDOM(320, 240); // 50% scale
      await initializeUI();

      let capturedX: number, capturedY: number;
      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        capturedX = (event.clientX - rect.left) * scaleX;
        capturedY = (event.clientY - rect.top) * scaleY;
      });

      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 85,  // 10 (rect.left) + 75
        clientY: 70,  // 20 (rect.top) + 50
        bubbles: true,
      });

      canvas.dispatchEvent(mouseMoveEvent);

      // Should scale: 75 * (640/320) = 150, 50 * (480/240) = 100
      expect(capturedX!).toBe(150);
      expect(capturedY!).toBe(100);
    });
  });

  describe("Coordinate Scaling Edge Cases", () => {
    it("should handle zero display dimensions gracefully", async () => {
      setupDOM(0, 0);
      await initializeUI();

      const clickEvent = new MouseEvent("click", {
        clientX: 110,
        clientY: 70,
        bubbles: true,
      });

      // Should not throw error even with zero dimensions
      expect(() => canvas.dispatchEvent(clickEvent)).not.toThrow();
    });

    it("should handle very small display dimensions", async () => {
      setupDOM(64, 48); // 10% of original size
      await initializeUI();

      const clickEvent = new MouseEvent("click", {
        clientX: 42, // 10 (rect.left) + 32
        clientY: 44, // 20 (rect.top) + 24
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // Should scale: 32 * (640/64) = 320, 24 * (480/48) = 240
      expect(targetXInput.value).toBe("320");
      expect(targetYInput.value).toBe("240");
    });

    it("should handle non-uniform scaling (different aspect ratio)", async () => {
      // Canvas displayed with different aspect ratio: 400x300 instead of 640x480
      setupDOM(400, 300);
      await initializeUI();

      const clickEvent = new MouseEvent("click", {
        clientX: 210, // 10 (rect.left) + 200
        clientY: 170, // 20 (rect.top) + 150
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // Should scale differently for X and Y:
      // X: 200 * (640/400) = 320
      // Y: 150 * (480/300) = 240
      expect(targetXInput.value).toBe("320");
      expect(targetYInput.value).toBe("240");
    });
  });

  describe("Integration with Target Validation", () => {
    it("should provide correctly scaled coordinates to validation functions", async () => {
      setupDOM(320, 240); // 50% scale
      await initializeUI();

      // Click at what appears to be position (160, 120) on the scaled canvas
      const clickEvent = new MouseEvent("click", {
        clientX: 170, // 10 (rect.left) + 160
        clientY: 140, // 20 (rect.top) + 120
        bubbles: true,
      });

      canvas.dispatchEvent(clickEvent);

      // The actual canvas coordinates should be scaled up
      const expectedX = 160 * (640 / 320); // 320
      const expectedY = 120 * (480 / 240); // 240

      expect(targetXInput.value).toBe(expectedX.toString());
      expect(targetYInput.value).toBe(expectedY.toString());
    });
  });
});
