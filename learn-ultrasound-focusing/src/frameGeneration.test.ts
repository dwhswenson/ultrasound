import { ArrayElement } from "./arrayElement";

// Mock canvas context for testing
const createMockCanvas = () => {
  const canvas = {
    width: 640,
    height: 480,
    getContext: jest.fn(),
  } as unknown as HTMLCanvasElement;

  const ctx = {
    beginPath: jest.fn(),
    arc: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    clearRect: jest.fn(),
    fillText: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
  } as unknown as CanvasRenderingContext2D;

  (canvas.getContext as jest.Mock).mockReturnValue(ctx);
  return { canvas, ctx };
};

// Extract the core logic functions for testing
// These mirror the functions in main.ts but are testable

/**
 * Test version of drawElementsAtTime function
 */
function drawElementsAtTime(
  ctx: CanvasRenderingContext2D,
  elements: ArrayElement[],
  time: number,
) {
  elements.forEach((element) => {
    element.draw(ctx, time);
  });
}

/**
 * Test version of createSingleElementFrame logic
 */
function createSingleElementFrameLogic(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  delayTime: number,
  currentTime: number,
): ArrayElement[] {
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Create a single array element centered in the canvas
  const elementX = canvasWidth / 2;
  const elementY = canvasHeight / 2;

  // For future extensibility, we create an array with one element
  const elements: ArrayElement[] = [
    new ArrayElement(elementX, elementY, delayTime),
  ];

  // Draw all elements (currently just one)
  drawElementsAtTime(ctx, elements, currentTime);

  // Add some helpful text
  ctx.fillStyle = "black";
  ctx.font = "14px Arial";
  ctx.fillText(`Current Time: ${currentTime.toFixed(6)}s`, 10, 20);
  ctx.fillText(`Delay Time: ${delayTime.toFixed(6)}s`, 10, 40);

  // Add coordinate information for target positioning
  ctx.fillText(`Canvas: ${canvasWidth}×${canvasHeight} px`, 10, 60);
  ctx.fillText(`Element X: ${Math.round(canvasWidth * 0.4)} px`, 10, 80);
  ctx.fillText("Coordinate system: (0,0) at top-left", 10, 100);

  return elements;
}

describe("Frame Generation Functions", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const mockCanvas = createMockCanvas();
    ctx = mockCanvas.ctx;
  });

  describe("drawElementsAtTime", () => {
    it("should call draw on all elements with correct time", () => {
      const element1 = new ArrayElement(100, 200, 0.001);
      const element2 = new ArrayElement(200, 300, 0.002);
      const elements = [element1, element2];

      // Spy on the draw methods
      const drawSpy1 = jest.spyOn(element1, "draw");
      const drawSpy2 = jest.spyOn(element2, "draw");

      const testTime = 0.0015;
      drawElementsAtTime(ctx, elements, testTime);

      expect(drawSpy1).toHaveBeenCalledWith(ctx, testTime);
      expect(drawSpy2).toHaveBeenCalledWith(ctx, testTime);
    });

    it("should handle empty array gracefully", () => {
      expect(() => drawElementsAtTime(ctx, [], 0.001)).not.toThrow();
    });

    it("should handle single element array", () => {
      const element = new ArrayElement(100, 200, 0.001);
      const drawSpy = jest.spyOn(element, "draw");

      drawElementsAtTime(ctx, [element], 0.0005);

      expect(drawSpy).toHaveBeenCalledWith(ctx, 0.0005);
    });
  });

  describe("createSingleElementFrameLogic", () => {
    const canvasWidth = 640;
    const canvasHeight = 480;

    it("should clear canvas before drawing", () => {
      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        0.001,
        0.0005,
      );

      expect(ctx.clearRect).toHaveBeenCalledWith(
        0,
        0,
        canvasWidth,
        canvasHeight,
      );
    });

    it("should create element centered in canvas", () => {
      const elements = createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        0.001,
        0.0005,
      );

      expect(elements).toHaveLength(1);
      expect(elements[0].x).toBe(canvasWidth / 2);
      expect(elements[0].y).toBe(canvasHeight / 2);
      expect(elements[0].delay).toBe(0.001);
    });

    it("should display correct text for pre-delay phase", () => {
      const delayTime = 0.001;
      const currentTime = 0.0005; // before delay

      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        delayTime,
        currentTime,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        "Current Time: 0.000500s",
        10,
        20,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Delay Time: 0.001000s",
        10,
        40,
      );
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        100,
      );
    });

    it("should display correct text for post-delay phase", () => {
      const delayTime = 0.001;
      const currentTime = 0.0015; // after delay

      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        delayTime,
        currentTime,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        "Current Time: 0.001500s",
        10,
        20,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Delay Time: 0.001000s",
        10,
        40,
      );
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        100,
      );
    });

    it("should set correct text style", () => {
      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        0.001,
        0.0005,
      );

      expect(ctx.fillStyle).toBe("black");
      expect(ctx.font).toBe("14px Arial");
    });

    it("should work with different canvas dimensions", () => {
      const customWidth = 800;
      const customHeight = 600;

      const elements = createSingleElementFrameLogic(
        ctx,
        customWidth,
        customHeight,
        0.001,
        0.0005,
      );

      expect(ctx.clearRect).toHaveBeenCalledWith(
        0,
        0,
        customWidth,
        customHeight,
      );
      expect(elements[0].x).toBe(customWidth / 2);
      expect(elements[0].y).toBe(customHeight / 2);
    });

    it("should handle zero delay time", () => {
      const elements = createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        0,
        0.001,
      );

      expect(elements[0].delay).toBe(0);
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);
    });

    it("should handle current time equal to delay time", () => {
      const delayTime = 0.001;
      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        delayTime,
        delayTime,
      );

      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);
    });

    it("should format time display correctly", () => {
      createSingleElementFrameLogic(
        ctx,
        canvasWidth,
        canvasHeight,
        0.123456,
        0.654321,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        "Current Time: 0.654321s",
        10,
        20,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Delay Time: 0.123456s",
        10,
        40,
      );
    });
  });

  describe("Integration Tests", () => {
    it("should create complete frame with element drawing", () => {
      const delayTime = 0.001;
      const currentTime = 0.0005;

      const elements = createSingleElementFrameLogic(
        ctx,
        640,
        480,
        delayTime,
        currentTime,
      );

      // Verify canvas was cleared
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 640, 480);

      // Verify element was created correctly
      expect(elements).toHaveLength(1);
      expect(elements[0].x).toBe(320);
      expect(elements[0].y).toBe(240);
      expect(elements[0].delay).toBe(delayTime);

      // Verify text was added
      expect(ctx.fillText).toHaveBeenCalledTimes(5);
    });

    it("should handle animation phases correctly in frame generation", () => {
      // Test pre-delay phase
      createSingleElementFrameLogic(ctx, 640, 480, 0.002, 0.001);
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);

      // Reset mocks
      jest.clearAllMocks();

      // Test post-delay phase
      createSingleElementFrameLogic(ctx, 640, 480, 0.001, 0.002);
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 60);
    });
  });

  describe("Future Extensibility", () => {
    it("should support multiple elements architecture", () => {
      // Test that drawElementsAtTime can handle multiple elements
      const elements = [
        new ArrayElement(100, 200, 0.001),
        new ArrayElement(200, 200, 0.002),
        new ArrayElement(300, 200, 0.003),
      ];

      const drawSpies = elements.map((el) => jest.spyOn(el, "draw"));

      drawElementsAtTime(ctx, elements, 0.0015);

      drawSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledWith(ctx, 0.0015);
      });
    });

    it("should maintain single element structure for current implementation", () => {
      const elements = createSingleElementFrameLogic(
        ctx,
        640,
        480,
        0.001,
        0.0005,
      );

      // Should create exactly one element for current implementation
      expect(elements).toHaveLength(1);
      expect(elements[0]).toBeInstanceOf(ArrayElement);
    });
  });
});
