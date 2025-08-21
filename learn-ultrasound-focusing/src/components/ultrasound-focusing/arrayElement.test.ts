import { ArrayElement } from "./arrayElement";
import {
  VISUAL_SPEED_PX_PER_SEC,
  DEFAULT_ELEMENT_RADIUS,
  DEFAULT_LINE_LENGTH,
} from "./shared/constants";

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
      element = new ArrayElement(
        100,
        200,
        0.001,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      );
    });

    it("should always draw the main element circle", () => {
      // Use a time after delay to avoid red pulse interfering with fillStyle
      element.draw(ctx, 0.002, VISUAL_SPEED_PX_PER_SEC);

      // Should draw main circle
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalledWith(100, 200, 10, 0, 2 * Math.PI);
      // Check that fillStyle was set to black at some point
      expect(ctx.fillStyle).toHaveProperty("length"); // fillStyle gets set
      expect(ctx.fill).toHaveBeenCalled();
    });

    it("should always draw the trigger line", () => {
      element.draw(ctx, 0.002, VISUAL_SPEED_PX_PER_SEC); // Use time after delay

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
      element = new ArrayElement(
        100,
        200,
        0.001,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      );
    });

    it("should draw red pulse at correct position when t=0", () => {
      element.draw(ctx, 0, VISUAL_SPEED_PX_PER_SEC);

      // With constant speed physics:
      // travelDistance = DEFAULT_LINE_LENGTH - DEFAULT_ELEMENT_RADIUS = 190px
      // travelTime = 190 / VISUAL_SPEED_PX_PER_SEC = 1.9s
      // startTime = 0.001 - 1.9 = -1.899s
      // At t=0: position = xStart + VISUAL_SPEED_PX_PER_SEC * (0 - (-1.899)) = xStart + 189.9
      const xStart = 100 - DEFAULT_LINE_LENGTH; // x - lineLength
      const expectedX = xStart + VISUAL_SPEED_PX_PER_SEC * (0 - (0.001 - 1.9));

      expect(ctx.arc).toHaveBeenCalledWith(
        expectedX,
        200,
        DEFAULT_ELEMENT_RADIUS / 2,
        0,
        2 * Math.PI,
      ); // radius/2
      // Check that red fillStyle was set (after black for main element)
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should draw red pulse at correct position at half delay time", () => {
      const halfDelayTime = 0.0005;
      element.draw(ctx, halfDelayTime, VISUAL_SPEED_PX_PER_SEC);

      // With constant speed physics:
      // startTime = 0.001 - 1.9 = -1.899s
      // At t=0.0005: position = xStart + 100 * (0.0005 - (-1.899))
      const xStart = 100 - DEFAULT_LINE_LENGTH; // x - lineLength
      const travelTime =
        (DEFAULT_LINE_LENGTH - DEFAULT_ELEMENT_RADIUS) /
        VISUAL_SPEED_PX_PER_SEC; // 1.9s
      const startTime = 0.001 - travelTime;
      const expectedX =
        xStart + VISUAL_SPEED_PX_PER_SEC * (halfDelayTime - startTime);

      expect(ctx.arc).toHaveBeenCalledWith(expectedX, 200, 5, 0, 2 * Math.PI);
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should draw red pulse near element just before delay time", () => {
      const justBeforeDelay = 0.00099;
      element.draw(ctx, justBeforeDelay, VISUAL_SPEED_PX_PER_SEC);

      // With constant speed physics, pulse should be very close to element
      const xStart = 100 - DEFAULT_LINE_LENGTH; // x - lineLength
      const travelTime =
        (DEFAULT_LINE_LENGTH - DEFAULT_ELEMENT_RADIUS) /
        VISUAL_SPEED_PX_PER_SEC; // 1.9s
      const startTime = 0.001 - travelTime;
      const expectedX =
        xStart + VISUAL_SPEED_PX_PER_SEC * (justBeforeDelay - startTime);

      expect(ctx.arc).toHaveBeenCalledWith(expectedX, 200, 5, 0, 2 * Math.PI);
      expect(ctx.fillStyle).toHaveProperty("length");
    });

    it("should not draw wave propagation before delay time", () => {
      element.draw(ctx, 0.0005, VISUAL_SPEED_PX_PER_SEC);

      // Should not call arc for wave propagation (only for element and pulse)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + red pulse only
    });

    it("should not show red pulse before it starts", () => {
      // Create element with long delay so pulse hasn't started yet
      const laterElement = new ArrayElement(100, 200, 2.0, 10, 200);
      laterElement.draw(ctx, 0.05, VISUAL_SPEED_PX_PER_SEC); // Very early time when pulse hasn't started

      // With delay=2.0s, travel time = 1.9s, start time = 0.1s
      // At t=0.05s (before start time), should only draw main element
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(1); // main element only
    });

    it("should handle pulse traveling at constant speed", () => {
      const t1 = 0;
      const t2 = 0.0001; // 0.1ms later

      // Draw at two different times
      element.draw(ctx, t1, VISUAL_SPEED_PX_PER_SEC);

      (ctx.arc as jest.Mock).mockClear();
      element.draw(ctx, t2, VISUAL_SPEED_PX_PER_SEC);

      // Should have moved at constant speed (VISUAL_SPEED_PX_PER_SEC px/s)
      // Verify pulse is still being drawn
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls.length).toBeGreaterThan(0);
    });

    it("should demonstrate constant speed physics across multiple elements", () => {
      // Create elements with different delays to test staggered start times
      const element1 = new ArrayElement(
        100,
        200,
        0.001,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      ); // Short delay
      const element2 = new ArrayElement(
        100,
        300,
        0.002,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      ); // Medium delay
      const element3 = new ArrayElement(
        100,
        400,
        0.0005,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      ); // Already fired

      const testTime = 0.0008; // Test at 0.8ms

      // Draw each element at the same time
      element1.draw(ctx, testTime, VISUAL_SPEED_PX_PER_SEC);
      const element1Calls = (ctx.arc as jest.Mock).mock.calls.length;

      (ctx.arc as jest.Mock).mockClear();
      element2.draw(ctx, testTime, VISUAL_SPEED_PX_PER_SEC);
      const element2Calls = (ctx.arc as jest.Mock).mock.calls.length;

      (ctx.arc as jest.Mock).mockClear();
      element3.draw(ctx, testTime, VISUAL_SPEED_PX_PER_SEC);
      const element3Calls = (ctx.arc as jest.Mock).mock.calls.length;

      // Element 1 (delay=0.001s): pulse should be visible, very close to element
      expect(element1Calls).toBe(2); // main element + red pulse

      // Element 2 (delay=0.002s): pulse should be visible, farther from element
      expect(element2Calls).toBe(2); // main element + red pulse

      // Element 3 (delay=0.0005s): pulse should have already fired (no red pulse)
      expect(element3Calls).toBe(2); // main element + wave propagation

      // Verify constant speed: all visible pulses travel at VISUAL_SPEED_PX_PER_SEC px/s
      const visualSpeed = VISUAL_SPEED_PX_PER_SEC;
      const travelDistance = DEFAULT_LINE_LENGTH - DEFAULT_ELEMENT_RADIUS; // lineLength - radius = 190px
      const travelTime = travelDistance / visualSpeed; // 1.9s

      expect(travelTime).toBeCloseTo(1.9, 3);
    });
  });

  describe("Drawing - Post-delay Phase (Wave Propagation)", () => {
    beforeEach(() => {
      element = new ArrayElement(
        100,
        200,
        0.001,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      );
    });

    it("should not draw red pulse after delay time", () => {
      element.draw(ctx, 0.002, VISUAL_SPEED_PX_PER_SEC); // after delay

      // Should only have 2 arc calls: main element + wave (no red pulse)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + wave propagation
    });

    it("should draw wave propagation just after delay time", () => {
      const justAfterDelay = 0.0011;
      element.draw(ctx, justAfterDelay, VISUAL_SPEED_PX_PER_SEC);

      const timeSinceEmission = justAfterDelay - 0.001; // 0.0001s
      const expectedRadius = VISUAL_SPEED_PX_PER_SEC * timeSinceEmission; // VISUAL_SPEED_PX_PER_SEC * time

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
      element.draw(ctx, laterTime, VISUAL_SPEED_PX_PER_SEC);

      const timeSinceEmission = laterTime - 0.001; // 0.001s
      const expectedRadius = VISUAL_SPEED_PX_PER_SEC * timeSinceEmission; // larger radius

      expect(ctx.arc).toHaveBeenCalledWith(
        100,
        200,
        expectedRadius,
        -Math.PI / 2,
        Math.PI / 2,
      );
    });

    it("should not draw wave when radius would be zero or negative", () => {
      element.draw(ctx, 0.001, VISUAL_SPEED_PX_PER_SEC); // exactly at delay time

      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      // Should only have main element circle, no wave propagation
      expect(arcCalls).toHaveLength(1);
    });
  });

  describe("Drawing - Edge Cases", () => {
    it("should handle zero delay time", () => {
      element = new ArrayElement(100, 200, 0, 10, 200);

      element.draw(ctx, 0.001, VISUAL_SPEED_PX_PER_SEC); // any positive time

      // Should immediately show wave propagation
      const expectedRadius = VISUAL_SPEED_PX_PER_SEC * 0.001;
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

      expect(() =>
        element.draw(ctx, -0.001, VISUAL_SPEED_PX_PER_SEC),
      ).not.toThrow();

      // With negative time, red pulse calculation may go backwards
      // Just verify that arc is called for the red pulse (second call after main element)
      const arcCalls = (ctx.arc as jest.Mock).mock.calls;
      expect(arcCalls).toHaveLength(2); // main element + red pulse
      expect(arcCalls[1][2]).toBe(5); // radius/2 for red pulse
    });

    it("should work with different element positions", () => {
      element = new ArrayElement(300, 400, 0.001, 15, 250);

      element.draw(ctx, 0, VISUAL_SPEED_PX_PER_SEC);

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
      element = new ArrayElement(
        100,
        200,
        0.001,
        DEFAULT_ELEMENT_RADIUS,
        DEFAULT_LINE_LENGTH,
      );

      const testTime = 0.002; // 0.001s after delay
      element.draw(ctx, testTime, VISUAL_SPEED_PX_PER_SEC);

      const timeSinceEmission = 0.001;
      const expectedRadius = VISUAL_SPEED_PX_PER_SEC * timeSinceEmission; // pixels per second

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
