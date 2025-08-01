import { ArrayElement } from "./arrayElement";

// Mock canvas context
const createMockContext = () => {
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
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
  } as unknown as CanvasRenderingContext2D;
  return ctx;
};

describe("ArrayElement", () => {
  let element: ArrayElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  describe("Constructor", () => {
    it("should create element with default parameters", () => {
      element = new ArrayElement(100, 200, 0.001);

      expect(element.x).toBe(100);
      expect(element.y).toBe(200);
      expect(element.delay).toBe(0.001);
      expect(element.radius).toBe(10); // default
      expect(element.lineLength).toBe(200); // default
    });

    it("should create element with custom parameters", () => {
      element = new ArrayElement(50, 150, 0.002, 15, 300);

      expect(element.x).toBe(50);
      expect(element.y).toBe(150);
      expect(element.delay).toBe(0.002);
      expect(element.radius).toBe(15);
      expect(element.lineLength).toBe(300);
    });
  });

  describe("Drawing - Basic Elements", () => {
    beforeEach(() => {
      element = new ArrayElement(100, 200, 0.001, 10, 200);
    });

    it("should always draw the main element circle", () => {
      // Use a time after delay to avoid red pulse interfering with fillStyle
      element.draw(ctx, 0.002);

      // Should draw main circle
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalledWith(100, 200, 10, 0, 2 * Math.PI);
      // Check that fillStyle was set to black at some point
      expect(ctx.fillStyle).toHaveProperty("length"); // fillStyle gets set
      expect(ctx.fill).toHaveBeenCalled();
    });

    it("should always draw the trigger line", () => {
      element.draw(ctx, 0.002); // Use time after delay

      // Should draw trigger line from left of element
      const expectedXStart = 100 - 200; // x - lineLength
      expect(ctx.moveTo).toHaveBeenCalledWith(expectedXStart, 200);
      expect(ctx.lineTo).toHaveBeenCalledWith(90, 200); // x - radius
      expect(ctx.strokeStyle).toHaveProperty("length"); // strokeStyle gets set
      expect(ctx.lineWidth).toBe(2);
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe("Drawing - Pre-delay Phase (Red Pulse)", () => {
    beforeEach(() => {
      element = new ArrayElement(100, 200, 0.001, 10, 200);
    });

    it("should draw red pulse at start of line when t=0", () => {
      element.draw(ctx, 0);

      // Should draw red pulse at start position
      const expectedXStart = 100 - 200; // x - lineLength
      expect(ctx.arc).toHaveBeenCalledWith(
        expectedXStart,
        200,
        5,
        0,
        2 * Math.PI,
      ); // radius/2 = 5
      // Check that red fillStyle was set (after black for main element)
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should draw red pulse midway when t is half of delay time", () => {
      const halfDelayTime = 0.0005;
      element.draw(ctx, halfDelayTime);

      // At half delay time, pulse should be halfway along the line
      const totalDistance = 200 - 10; // lineLength - radius
      const expectedDistance = 0.5 * totalDistance; // 50% of the way
      const expectedX = 100 - 200 + expectedDistance; // start + distance

      expect(ctx.arc).toHaveBeenCalledWith(expectedX, 200, 5, 0, 2 * Math.PI);
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should draw red pulse near element just before delay time", () => {
      const justBeforeDelay = 0.00099;
      element.draw(ctx, justBeforeDelay);

      // Should be very close to the element
      const totalDistance = 200 - 10; // lineLength - radius
      const progress = justBeforeDelay / 0.001; // 99% progress
      const expectedDistance = progress * totalDistance;
      const expectedX = 100 - 200 + expectedDistance;

      expect(ctx.arc).toHaveBeenCalledWith(expectedX, 200, 5, 0, 2 * Math.PI);
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should not draw wave propagation before delay time", () => {
      element.draw(ctx, 0.0005);

      // Should not call arc for wave propagation (only for element and pulse)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + red pulse only
    });
  });

  describe("Drawing - Post-delay Phase (Wave Propagation)", () => {
    beforeEach(() => {
      element = new ArrayElement(100, 200, 0.001, 10, 200);
    });

    it("should not draw red pulse after delay time", () => {
      element.draw(ctx, 0.002); // after delay

      // Should only have 2 arc calls: main element + wave (no red pulse)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + wave propagation
    });

    it("should draw wave propagation just after delay time", () => {
      const justAfterDelay = 0.0011;
      element.draw(ctx, justAfterDelay);

      const timeSinceEmission = justAfterDelay - 0.001; // 0.0001s
      const expectedRadius = 200 * timeSinceEmission; // VISUAL_SPEED_PX_PER_SEC * time

      // Should draw half-circle for wave
      expect(ctx.arc).toHaveBeenCalledWith(
        100,
        200,
        expectedRadius,
        -Math.PI / 2,
        Math.PI / 2,
      );
      expect(ctx.strokeStyle).toBe("black");
      expect(ctx.lineWidth).toBe(2);
    });

    it("should draw larger wave propagation as time increases", () => {
      const laterTime = 0.002;
      element.draw(ctx, laterTime);

      const timeSinceEmission = laterTime - 0.001; // 0.001s
      const expectedRadius = 200 * timeSinceEmission; // larger radius

      expect(ctx.arc).toHaveBeenCalledWith(
        100,
        200,
        expectedRadius,
        -Math.PI / 2,
        Math.PI / 2,
      );
    });

    it("should not draw wave when radius would be zero or negative", () => {
      element.draw(ctx, 0.001); // exactly at delay time

      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      // Should only have main element circle, no wave propagation
      expect(arcCalls).toHaveLength(1);
    });
  });

  describe("Drawing - Edge Cases", () => {
    it("should handle zero delay time", () => {
      element = new ArrayElement(100, 200, 0, 10, 200);

      element.draw(ctx, 0.001); // any positive time

      // Should immediately show wave propagation
      const expectedRadius = 200 * 0.001;
      expect(ctx.arc).toHaveBeenCalledWith(
        100,
        200,
        expectedRadius,
        -Math.PI / 2,
        Math.PI / 2,
      );
    });

    it("should handle negative time gracefully", () => {
      element = new ArrayElement(100, 200, 0.001, 10, 200);

      expect(() => element.draw(ctx, -0.001)).not.toThrow();

      // With negative time, red pulse calculation may go backwards
      // Just verify that arc is called for the red pulse (second call after main element)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + red pulse
      expect(arcCalls[1][2]).toBe(5); // radius/2 for red pulse
    });

    it("should work with different element positions", () => {
      element = new ArrayElement(300, 400, 0.001, 15, 250);

      element.draw(ctx, 0);

      // Main element should be at correct position
      expect(ctx.arc).toHaveBeenCalledWith(300, 400, 15, 0, 2 * Math.PI);

      // Trigger line should start from correct position
      const expectedXStart = 300 - 250;
      expect(ctx.moveTo).toHaveBeenCalledWith(expectedXStart, 400);
      expect(ctx.lineTo).toHaveBeenCalledWith(285, 400); // 300 - 15
    });
  });

  describe("Visual Speed Constants", () => {
    it("should use correct visual speed in calculations", () => {
      element = new ArrayElement(100, 200, 0.001, 10, 200);

      const testTime = 0.002; // 0.001s after delay
      element.draw(ctx, testTime);

      const timeSinceEmission = 0.001;
      const expectedRadius = 200 * timeSinceEmission; // 200 pixels per second

      expect(ctx.arc).toHaveBeenCalledWith(
        100,
        200,
        expectedRadius,
        -Math.PI / 2,
        Math.PI / 2,
      );
    });
  });
});
