import { ArrayElement } from "./arrayElement";
import {
  createElementArray,
  createMultiElementFrame,
  drawElementsAtTime,
} from "./main";

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
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    setLineDash: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "start",
  } as unknown as CanvasRenderingContext2D;

  (canvas.getContext as jest.Mock).mockReturnValue(ctx);
  return { canvas, ctx };
};

// Mock canvas dimensions for testing
const mockCanvas = {
  width: 640,
  height: 480,
} as HTMLCanvasElement;

describe("Multi-Element ArrayElement Functionality", () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const mock = createMockCanvas();
    ctx = mock.ctx;
    // Mock the global canvas object used in main.ts
    (global as any).canvas = mockCanvas;
  });

  describe("createElementArray", () => {
    it("should create correct number of elements", () => {
      const elements = createElementArray(16, 5.0, 0.001, mockCanvas);
      expect(elements).toHaveLength(16);
    });

    it("should handle minimum elements (4)", () => {
      const elements = createElementArray(4, 5.0, 0.001, mockCanvas);
      expect(elements).toHaveLength(4);
      expect(elements[0]).toBeInstanceOf(ArrayElement);
    });

    it("should handle maximum elements (64)", () => {
      const elements = createElementArray(64, 3.0, 0.001, mockCanvas);
      expect(elements).toHaveLength(64);
      expect(elements[0]).toBeInstanceOf(ArrayElement);
    });

    it("should set same delay time for all elements", () => {
      const delayTime = 0.0015;
      const elements = createElementArray(8, 5.0, delayTime, mockCanvas);

      elements.forEach((element) => {
        expect(element.delay).toBe(delayTime);
      });
    });

    it("should position elements at correct x coordinate", () => {
      const elements = createElementArray(10, 50, 0.001, mockCanvas);
      const expectedX = mockCanvas.width * 0.4; // 40% from left

      elements.forEach((element) => {
        expect(element.x).toBe(expectedX);
      });
    });

    it("should space elements correctly with pitch in pixels", () => {
      const pitch = 40;
      const elements = createElementArray(5, pitch, 0.001, mockCanvas);

      // Check spacing between consecutive elements
      for (let i = 1; i < elements.length; i++) {
        const spacing = elements[i].y - elements[i - 1].y;
        expect(spacing).toBeCloseTo(pitch);
      }
    });

    it("should center array vertically on canvas", () => {
      const numElements = 6;
      const pitch = 50;
      const elements = createElementArray(
        numElements,
        pitch,
        0.001,
        mockCanvas,
      );

      const totalHeight = (numElements - 1) * pitch;
      const expectedStartY = (mockCanvas.height - totalHeight) / 2;

      expect(elements[0].y).toBeCloseTo(expectedStartY);
      expect(elements[elements.length - 1].y).toBeCloseTo(
        expectedStartY + totalHeight,
      );
    });

    it("should handle single element", () => {
      const elements = createElementArray(1, 5.0, 0.001, mockCanvas);

      expect(elements).toHaveLength(1);
      expect(elements[0].y).toBe(mockCanvas.height / 2); // Should be centered
    });

    it("should work with different pitch values", () => {
      const smallPitch = createElementArray(4, 2.0, 0.001, mockCanvas);
      const largePitch = createElementArray(4, 10.0, 0.001, mockCanvas);

      const smallSpacing = smallPitch[1].y - smallPitch[0].y;
      const largeSpacing = largePitch[1].y - largePitch[0].y;

      expect(largeSpacing).toBe(smallSpacing * 5); // 10mm vs 2mm
    });

    it("should handle edge case with very small pitch", () => {
      const elements = createElementArray(4, 1.0, 0.001, mockCanvas); // 1mm pitch
      const spacing = elements[1].y - elements[0].y;

      expect(spacing).toBe(1); // 1px pitch directly
    });

    it("should adapt to different canvas heights", () => {
      // Test with larger canvas
      const largeCanvas = { width: 640, height: 800 } as HTMLCanvasElement;
      const elementsLarge = createElementArray(10, 5.0, 0.001, largeCanvas);

      // Test with smaller canvas
      const smallCanvas = { width: 640, height: 300 } as HTMLCanvasElement;
      const elementsSmall = createElementArray(10, 5.0, 0.001, smallCanvas);

      // Elements should be centered differently based on canvas height
      expect(elementsLarge[0].y).not.toBe(elementsSmall[0].y);

      // Restore original
      (global as any).canvas = mockCanvas;
    });
  });

  describe("createMultiElementFrame", () => {
    beforeEach(() => {
      // Mock createImageBitmap
      (global as any).createImageBitmap = jest.fn().mockResolvedValue({
        width: 640,
        height: 480,
      });
    });

    it("should clear canvas before drawing", async () => {
      await createMultiElementFrame(0.001, 0.0005, 8, 5.0, mockCanvas, ctx);

      expect(ctx.clearRect).toHaveBeenCalledWith(
        0,
        0,
        mockCanvas.width,
        mockCanvas.height,
      );
    });

    it("should create and draw multiple elements", async () => {
      const numElements = 12;
      await createMultiElementFrame(
        0.001,
        0.0005,
        numElements,
        5.0,
        mockCanvas,
        ctx,
      );

      // Should draw main circles for all elements (plus red pulses)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls.length).toBeGreaterThanOrEqual(numElements);
    });

    it("should display correct frame information", async () => {
      const delayTime = 0.001;
      const currentTime = 0.0007;
      const numElements = 16;
      const pitch = 6.5;

      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        pitch,
        mockCanvas,
        ctx,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        `Current Time: ${currentTime.toFixed(6)}s`,
        10,
        20,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        `Max Delay: ${delayTime.toFixed(6)}s`,
        10,
        40,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        `Elements: ${numElements}, Pitch: ${pitch.toFixed(3)}`,
        10,
        60,
      );
    });

    it("should show coordinate information", async () => {
      await createMultiElementFrame(0.002, 0.001, 8, 5.0, mockCanvas, ctx);

      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 100);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        120,
      );
    });

    it("should show consistent coordinate information regardless of time", async () => {
      await createMultiElementFrame(0.001, 0.002, 8, 5.0, mockCanvas, ctx);

      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 100);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        120,
      );
    });

    it("should handle different numbers of elements correctly", async () => {
      // Test minimum
      await createMultiElementFrame(0.001, 0.0005, 4, 5.0, mockCanvas, ctx);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 4, Pitch: 5.000",
        10,
        60,
      );

      jest.clearAllMocks();

      // Test maximum
      await createMultiElementFrame(0.001, 0.0005, 64, 3.0, mockCanvas, ctx);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 64, Pitch: 3.000",
        10,
        60,
      );
    });

    it("should return ImageBitmap", async () => {
      const result = await createMultiElementFrame(
        0.001,
        0.0005,
        8,
        5.0,
        mockCanvas,
        ctx,
      );
      expect(result).toBeDefined();
      expect(global.createImageBitmap).toHaveBeenCalled();
    });
  });

  describe("Integration with drawElementsAtTime", () => {
    it("should draw all elements at specified time", () => {
      const elements = createElementArray(6, 4.0, 0.001, mockCanvas);
      const drawSpies = elements.map((el) => jest.spyOn(el, "draw"));

      const testTime = 0.0007;
      drawElementsAtTime(ctx, elements, testTime);

      drawSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledWith(ctx, testTime, 150);
      });
    });

    it("should work with elements in different animation phases", () => {
      const elements = createElementArray(4, 5.0, 0.001, mockCanvas);

      // Test pre-delay phase
      drawElementsAtTime(ctx, elements, 0.0005);

      // Should have drawn main circles and red pulses
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls.length).toBe(8); // 4 main circles + 4 red pulses

      jest.clearAllMocks();

      // Test post-delay phase
      drawElementsAtTime(ctx, elements, 0.002);

      // Should have drawn main circles and wave propagations
      const arcCallsPost = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCallsPost.length).toBe(8); // 4 main circles + 4 wave propagations
    });
  });

  describe("Physical Realism and Screen Adaptation", () => {
    it("should maintain reasonable element spacing on screen", () => {
      // Test different element counts with same pitch
      const pitch = 5.0; // 5mm pitch

      const few = createElementArray(4, pitch, 0.001, mockCanvas);
      const many = createElementArray(32, pitch, 0.001, mockCanvas);

      // Spacing should be the same regardless of count
      const fewSpacing = few[1].y - few[0].y;
      const manySpacing = many[1].y - many[0].y;
      expect(fewSpacing).toBe(manySpacing);
    });

    it("should fit elements within canvas bounds", () => {
      // Test maximum elements with reasonable pitch
      const elements = createElementArray(64, 0.6, 0.001, mockCanvas);

      elements.forEach((element) => {
        expect(element.y).toBeGreaterThanOrEqual(0);
        expect(element.y).toBeLessThanOrEqual(mockCanvas.height);
      });
    });

    it("should maintain physical pitch relationships", () => {
      const pitch1mm = createElementArray(5, 1.0, 0.001, mockCanvas);
      const pitch5mm = createElementArray(5, 5.0, 0.001, mockCanvas);

      const spacing1 = pitch1mm[1].y - pitch1mm[0].y;
      const spacing5 = pitch5mm[1].y - pitch5mm[0].y;

      expect(spacing5).toBe(spacing1 * 5);
    });

    it("should position elements with proper margins", () => {
      const elements = createElementArray(16, 5.0, 0.001, mockCanvas);

      // Elements should be positioned at 40% from left edge
      expect(elements[0].x).toBe(mockCanvas.width * 0.4);

      // Should leave room for trigger lines (200px default) and waves
      expect(elements[0].x).toBeGreaterThan(200);
      expect(elements[0].x).toBeLessThan(mockCanvas.width - 100);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle zero pitch gracefully", () => {
      const elements = createElementArray(3, 0, 0.001, mockCanvas);

      // All elements should be at same Y position
      expect(elements[0].y).toBe(elements[1].y);
      expect(elements[1].y).toBe(elements[2].y);
    });

    it("should handle very large pitch values", () => {
      const elements = createElementArray(3, 100.0, 0.001, mockCanvas); // 100mm pitch

      expect(() => {
        elements.forEach((el) => el.draw(ctx, 0.001, 100));
      }).not.toThrow();
    });

    it("should handle fractional element counts", () => {
      // JavaScript for loop with fractional count
      const elements = createElementArray(7.9, 5.0, 0.001, mockCanvas);
      expect(elements).toHaveLength(8); // for loop with i < 7.9 creates 8 iterations (0-7)
    });

    it("should maintain consistency with single element", () => {
      const single = createElementArray(1, 5.0, 0.001, mockCanvas);
      const multi = createElementArray(16, 5.0, 0.001, mockCanvas);

      // First element properties should be consistent
      expect(single[0].x).toBe(multi[0].x);
      expect(single[0].delay).toBe(multi[0].delay);
      expect(single[0].radius).toBe(multi[0].radius);
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle maximum elements efficiently", () => {
      const startTime = performance.now();
      const elements = createElementArray(64, 2.0, 0.001, mockCanvas);
      const endTime = performance.now();

      expect(elements).toHaveLength(64);
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it("should create elements with consistent properties", () => {
      const elements = createElementArray(20, 4.0, 0.00123, mockCanvas);

      elements.forEach((element) => {
        expect(element.delay).toBe(0.00123);
        expect(element.radius).toBe(10); // default radius
        expect(element.lineLength).toBe(200); // default line length
      });
    });
  });

  describe("Canvas Coordinate System", () => {
    it("should position elements in logical order", () => {
      const elements = createElementArray(5, 6.0, 0.001, mockCanvas);

      // Elements should be ordered top to bottom
      for (let i = 1; i < elements.length; i++) {
        expect(elements[i].y).toBeGreaterThan(elements[i - 1].y);
      }
    });

    it("should maintain consistent x-positioning", () => {
      const elements = createElementArray(10, 3.0, 0.001, mockCanvas);

      const xPosition = elements[0].x;
      elements.forEach((element) => {
        expect(element.x).toBe(xPosition);
      });
    });

    it("should center arrays of different sizes correctly", () => {
      const small = createElementArray(4, 5.0, 0.001, mockCanvas);
      const large = createElementArray(16, 5.0, 0.001, mockCanvas);

      // Both arrays should be vertically centered
      const smallCenter = (small[0].y + small[small.length - 1].y) / 2;
      const largeCenter = (large[0].y + large[large.length - 1].y) / 2;

      expect(smallCenter).toBeCloseTo(mockCanvas.height / 2, 1);
      expect(largeCenter).toBeCloseTo(mockCanvas.height / 2, 1);
    });
  });
});
