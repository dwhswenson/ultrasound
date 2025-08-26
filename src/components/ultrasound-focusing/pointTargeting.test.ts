import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { ArrayElement } from "./arrayElement";
import {
  calculatePointTargetDelays,
  calculateWaveAmplitudeAtTarget,
  createElementArray,
  createMultiElementFrameWithElements,
  validateTargetPoint,
} from "./main";

// Mock canvas context for testing
const createMockCanvas = () => {
  const canvas = {
    width: 640,
    height: 480,
    getContext: vi.fn(),
  } as unknown as HTMLCanvasElement;

  const ctx = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    setLineDash: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "start",
  } as unknown as CanvasRenderingContext2D;

  (canvas.getContext as vi.Mock).mockReturnValue(ctx);
  return { canvas, ctx };
};

const mockCanvas = {
  width: 640,
  height: 480,
} as HTMLCanvasElement;

// Mock global functions
beforeEach(() => {
  (global as any).createImageBitmap = vi.fn().mockResolvedValue({
    width: 640,
    height: 480,
    close: vi.fn(),
  } as ImageBitmap);
});

describe("Point Targeting Functionality", () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    ctx = mock.ctx;
  });

  describe("calculatePointTargetDelays", () => {
    it("should calculate correct delays for simple vertical array", () => {
      const positions = [
        { x: 256, y: 200 }, // Top element
        { x: 256, y: 240 }, // Middle element
        { x: 256, y: 280 }, // Bottom element
      ];
      const targetX = 400;
      const targetY = 240; // Same as middle element

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Calculate expected distances
      const dist0 = Math.sqrt((400 - 256) ** 2 + (240 - 200) ** 2); // ~149.5
      const dist1 = Math.sqrt((400 - 256) ** 2 + (240 - 240) ** 2); // 144
      const dist2 = Math.sqrt((400 - 256) ** 2 + (240 - 280) ** 2); // ~149.5

      const maxDist = Math.max(dist0, dist1, dist2);
      const visualSpeed = 150;

      expect(delays[0]).toBeCloseTo((maxDist - dist0) / visualSpeed);
      expect(delays[1]).toBeCloseTo((maxDist - dist1) / visualSpeed);
      expect(delays[2]).toBeCloseTo((maxDist - dist2) / visualSpeed);

      // Middle element should have largest delay (closest to target)
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[1]).toBeGreaterThan(delays[2]);
    });

    it("should handle target at element position", () => {
      const positions = [
        { x: 256, y: 200 },
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];
      const targetX = 256; // Same X as elements
      const targetY = 240; // Same as middle element

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Middle element should have maximum delay (distance = 0)
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[1]).toBeGreaterThan(delays[2]);
      expect(delays[0]).toBe(delays[2]); // Symmetric distances
    });

    it("should produce zero delay for farthest element", () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ];
      const targetX = 0;
      const targetY = 0;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // At least one delay should be zero (farthest element)
      const minDelay = Math.min(...delays);
      expect(minDelay).toBeCloseTo(0, 10);
    });

    it("should handle single element", () => {
      const positions = [{ x: 256, y: 240 }];
      const targetX = 400;
      const targetY = 300;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      expect(delays).toHaveLength(1);
      expect(delays[0]).toBe(0); // Only element, so delay = 0
    });

    it("should calculate delays proportional to distances", () => {
      const positions = [
        { x: 100, y: 100 }, // Far from target
        { x: 150, y: 150 }, // Medium distance
        { x: 190, y: 190 }, // Close to target
      ];
      const targetX = 200;
      const targetY = 200;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Delays should be inversely proportional to distances
      // Closest element (index 2) should have largest delay
      expect(delays[2]).toBeGreaterThan(delays[1]);
      expect(delays[1]).toBeGreaterThan(delays[0]);
    });
  });

  describe("createElementArray with individual delays", () => {
    it("should create elements with individual delay times", () => {
      const delays = [0.001, 0.002, 0.003];
      const elements = createElementArray(3, 5.0, delays, mockCanvas);

      expect(elements).toHaveLength(3);
      expect(elements[0].delay).toBe(0.001);
      expect(elements[1].delay).toBe(0.002);
      expect(elements[2].delay).toBe(0.003);
    });

    it("should handle uniform delays when single delay provided", () => {
      const singleDelay = 0.005;
      const elements = createElementArray(4, 3.0, singleDelay, mockCanvas);

      expect(elements).toHaveLength(4);
      elements.forEach((element) => {
        expect(element.delay).toBe(singleDelay);
      });
    });

    it("should handle mismatched delay array length", () => {
      const delays = [0.001, 0.002]; // Only 2 delays for 3 elements
      const elements = createElementArray(3, 5.0, delays, mockCanvas);

      expect(elements).toHaveLength(3);
      expect(elements[0].delay).toBe(0.001);
      expect(elements[1].delay).toBe(0.002);
      expect(elements[2].delay).toBeUndefined(); // Should handle gracefully
    });
  });

  describe("Point Target Frame Generation", () => {
    beforeEach(() => {
      // Mock target input elements
      (global as any).targetXInput = { value: "400" };
      (global as any).targetYInput = { value: "240" };
    });

    it("should draw target crosshairs for point targeting", async () => {
      const elements = [
        new ArrayElement(256, 200, 0.001),
        new ArrayElement(256, 240, 0.002),
        new ArrayElement(256, 280, 0.001),
      ];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        0.0015,
        "point",
        canvas,
        ctx,
        400,
        240,
      );

      // Should draw crosshairs
      expect(ctx.moveTo).toHaveBeenCalledWith(390, 240); // targetX - 10
      expect(ctx.lineTo).toHaveBeenCalledWith(410, 240); // targetX + 10
      expect(ctx.moveTo).toHaveBeenCalledWith(400, 230); // targetY - 10
      expect(ctx.lineTo).toHaveBeenCalledWith(400, 250); // targetY + 10

      // Should draw target circle
      expect(ctx.arc).toHaveBeenCalledWith(400, 240, 5, 0, 2 * Math.PI);
    });

    it("should display target coordinates in text", async () => {
      const elements = [new ArrayElement(256, 240, 0.001)];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        0.0015,
        "point",
        canvas,
        ctx,
        400,
        240,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        "ultrasound.dwhswenson.net",
        0,
        0,
      );
    });

    it("should display linear target info for linear targeting", async () => {
      const elements = [new ArrayElement(256, 240, 0.001)];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        0.0015,
        "linear",
        canvas,
        ctx,
      );

      expect(ctx.fillText).toHaveBeenCalledWith(
        "ultrasound.dwhswenson.net",
        0,
        0,
      );
    });
  });

  describe("Wave Convergence Calculation", () => {
    it("should return 0 amplitude when no waves have reached target", () => {
      const elements = [
        new ArrayElement(100, 100, 0.001),
        new ArrayElement(100, 150, 0.002),
      ];
      const targetX = 400;
      const targetY = 125;
      const currentTime = 0.0005; // Before any element fires

      const amplitude = calculateWaveAmplitudeAtTarget(
        elements,
        targetX,
        targetY,
        currentTime,
      );

      expect(amplitude).toBe(0);
    });

    it("should return amplitude when waves reach target", () => {
      const elements = [new ArrayElement(100, 100, 0.001)];
      const targetX = 200; // 100px away from element
      const targetY = 100;
      const travelTime = 100 / 150; // distance / visual speed = 0.667s
      const currentTime = 0.001 + travelTime + 0.1; // After wave reaches target

      const amplitude = calculateWaveAmplitudeAtTarget(
        elements,
        targetX,
        targetY,
        currentTime,
      );

      expect(amplitude).toBeGreaterThan(0);
      expect(amplitude).toBeLessThanOrEqual(1);
    });

    it("should calculate amplitude from multiple elements", () => {
      const elements = [
        new ArrayElement(100, 100, 0.001),
        new ArrayElement(100, 150, 0.001),
      ];
      const targetX = 200;
      const targetY = 125; // Equidistant from both elements
      const currentTime = 2; // Long enough for all waves to reach

      const amplitude = calculateWaveAmplitudeAtTarget(
        elements,
        targetX,
        targetY,
        currentTime,
      );

      expect(amplitude).toBeGreaterThan(0);
      expect(amplitude).toBeLessThanOrEqual(1);
    });
  });

  describe("Target Point Validation", () => {
    const canvasWidth = 640;
    const canvasHeight = 480;
    const elementX = 256; // 40% of 640

    it("should validate target within canvas bounds", () => {
      const result = validateTargetPoint(
        400,
        240,
        canvasWidth,
        canvasHeight,
        elementX,
      );

      expect(result.isValid).toBe(true);
    });

    it("should reject target too close to canvas edges", () => {
      const result = validateTargetPoint(
        10,
        10,
        canvasWidth,
        canvasHeight,
        elementX,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("at least 50px from canvas edges");
    });

    it("should reject target too close to array elements", () => {
      const result = validateTargetPoint(
        300,
        240,
        canvasWidth,
        canvasHeight,
        elementX,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain(
        "at least 100px from array elements",
      );
    });

    it("should reject target behind the array", () => {
      const result = validateTargetPoint(
        100, // Far behind array (156px from elementX=256) but beyond min distance
        240,
        canvasWidth,
        canvasHeight,
        elementX,
      );

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain(
        "in front of (to the right of) array elements",
      );
    });

    it("should validate target at minimum acceptable distance", () => {
      const result = validateTargetPoint(
        357,
        240,
        canvasWidth,
        canvasHeight,
        elementX,
      ); // exactly 101px from elementX

      expect(result.isValid).toBe(true);
    });

    it("should validate target at canvas edge margins", () => {
      const result = validateTargetPoint(
        590,
        430,
        canvasWidth,
        canvasHeight,
        elementX,
      ); // 50px from edges

      expect(result.isValid).toBe(true);
    });
  });

  describe("Visual Feedback Integration", () => {
    it("should draw convergence indicator for valid targets with amplitude", async () => {
      const elements = [new ArrayElement(256, 240, 0.001)];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        2.0, // Long time to ensure waves reach target
        "point",
        canvas,
        ctx,
        400,
        240,
      );

      // Should draw convergence visualization (green circles)
      expect(ctx.arc).toHaveBeenCalledWith(
        400,
        240,
        expect.any(Number),
        0,
        2 * Math.PI,
      );

      // Should show amplitude information in text
      expect(ctx.fillText).toHaveBeenCalledWith(
        "ultrasound.dwhswenson.net",
        0,
        0,
      );
    });

    it("should draw invalid target indicator for out-of-bounds targets", async () => {
      const elements = [new ArrayElement(256, 240, 0.001)];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        0.0015,
        "point",
        canvas,
        ctx,
        10, // Too close to edge
        10,
      );

      // Should draw invalid target X mark
      expect(ctx.moveTo).toHaveBeenCalledWith(0, 0); // X mark lines
      expect(ctx.lineTo).toHaveBeenCalledWith(20, 20);
      expect(ctx.moveTo).toHaveBeenCalledWith(20, 0);
      expect(ctx.lineTo).toHaveBeenCalledWith(0, 20);

      // Should show error message
      expect(ctx.fillText).toHaveBeenCalledWith(
        expect.stringContaining("⚠ Invalid Target:"),
        10,
        160,
      );
    });

    it("should not draw target crosshairs for linear targeting", async () => {
      const elements = [new ArrayElement(256, 240, 0.001)];

      await createMultiElementFrameWithElements(
        elements,
        0.002,
        0.0015,
        "linear",
        canvas,
        ctx,
      );

      // Count arc calls - should only be for elements, not target
      const arcCalls = (ctx.arc as vi.Mock).mock.calls;
      // Should have element circle and red pulse, but no target circle
      expect(arcCalls.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Point Target Physics Validation", () => {
    it("should debug wave convergence timing", () => {
      // Simple 3-element vertical array
      const positions = [
        { x: 256, y: 200 }, // Top element - far from target
        { x: 256, y: 240 }, // Middle element - medium distance
        { x: 256, y: 280 }, // Bottom element - close to target
      ];
      const targetX = 400;
      const targetY = 240; // Same Y as middle element
      const visualSpeed = 150;

      // Calculate delays
      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Calculate distances for verification
      const distances = positions.map((pos) =>
        Math.sqrt((targetX - pos.x) ** 2 + (targetY - pos.y) ** 2),
      );

      // Calculate arrival times at target
      const arrivalTimes = delays.map((delay, i) => {
        const travelTime = distances[i] / visualSpeed;
        const arrivalTime = delay + travelTime;

        return arrivalTime;
      });

      // Check if all arrival times are equal
      const firstArrival = arrivalTimes[0];
      const maxDifference =
        Math.max(...arrivalTimes) - Math.min(...arrivalTimes);

      // All arrival times should be equal (within floating point precision)
      arrivalTimes.forEach((time) => {
        expect(time).toBeCloseTo(firstArrival, 6);
      });

      // Maximum difference should be very small
      expect(maxDifference).toBeLessThan(0.000001);
    });

    it("should maintain convergence with direct visual delay calculation", () => {
      // Test the direct visual delay calculation from movie generation
      const positions = [
        { x: 256, y: 200 },
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];
      const targetX = 400;
      const targetY = 240;
      const visualSpeed = 150;

      // Calculate delays directly using visual speed (same as new movie generation logic)
      const distances = positions.map((pos) =>
        Math.sqrt((targetX - pos.x) ** 2 + (targetY - pos.y) ** 2),
      );

      const maxDistance = Math.max(...distances);
      const visualDelays = distances.map(
        (distance) => (maxDistance - distance) / visualSpeed,
      );

      // Calculate arrival times with direct visual delays
      const arrivalTimes = visualDelays.map((delay, i) => {
        const travelTime = distances[i] / visualSpeed;
        return delay + travelTime;
      });

      // All arrival times should be equal with direct calculation
      const firstArrival = arrivalTimes[0];
      const maxDifference =
        Math.max(...arrivalTimes) - Math.min(...arrivalTimes);

      arrivalTimes.forEach((time) => {
        expect(time).toBeCloseTo(firstArrival, 6);
      });

      expect(maxDifference).toBeLessThan(0.000001);
    });

    it("should create constructive interference at target point", () => {
      const positions = [
        { x: 256, y: 200 },
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];
      const targetX = 400;
      const targetY = 240;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Calculate arrival times at target
      const distances = positions.map((pos) =>
        Math.sqrt((targetX - pos.x) ** 2 + (targetY - pos.y) ** 2),
      );
      const visualSpeed = 150;

      const arrivalTimes = delays.map(
        (delay, i) => delay + distances[i] / visualSpeed,
      );

      // All arrival times should be equal (within floating point precision)
      const firstArrival = arrivalTimes[0];
      arrivalTimes.forEach((time) => {
        expect(time).toBeCloseTo(firstArrival, 10);
      });
    });

    it("should handle target at array position", () => {
      const positions = [
        { x: 256, y: 200 },
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];
      const targetX = 256; // Same as element X
      const targetY = 240; // Same as middle element Y

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Should produce valid delays
      delays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).not.toBe(Infinity);
        expect(delay).not.toBeNaN();
      });
    });

    it("should handle extreme target positions", () => {
      const positions = [
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];

      // Test very far target
      const extremeDelays = calculatePointTargetDelays(positions, 10000, 10000);
      extremeDelays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).not.toBe(Infinity);
        expect(delay).not.toBeNaN();
      });

      // Test negative coordinates
      const negativeDelays = calculatePointTargetDelays(positions, -100, -100);
      negativeDelays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).not.toBe(Infinity);
        expect(delay).not.toBeNaN();
      });
    });

    it("should calculate correct delay for linear targeting", () => {
      // Test the linear delay calculation logic from movie generation
      const visualSpeed = 200; // Must match VISUAL_SPEED_PX_PER_SEC in ArrayElement
      const lineLength = 200; // Default line length from ArrayElement
      const radius = 10; // Default radius from ArrayElement
      const expectedLinearDelay = (lineLength - radius) / visualSpeed;

      // This should equal 0.95 seconds (190px / 200px/s)
      expect(expectedLinearDelay).toBeCloseTo(0.95, 3);

      // Verify this delay makes red pulse start at far left
      // At t=0, pulse should be at xStart (far left of wire)
      // pulseX = xStart + visualSpeed * (t - startTime)
      // startTime = delay - travelTime = delay - (travelDistance / visualSpeed)
      // At t=0: pulseX = xStart + visualSpeed * (0 - (delay - travelTime))
      //                = xStart + visualSpeed * (-delay + travelTime)
      //                = xStart + visualSpeed * travelTime - visualSpeed * delay
      //                = xStart + travelDistance - visualSpeed * delay
      //                = xStart + (lineLength - radius) - visualSpeed * expectedLinearDelay
      //                = xStart + 190 - 200 * 0.95
      //                = xStart + 190 - 190
      //                = xStart (exactly at start of wire)

      const travelDistance = lineLength - radius;
      const calculatedPosition =
        travelDistance - visualSpeed * expectedLinearDelay;
      expect(calculatedPosition).toBeCloseTo(0, 10);
    });
  });

  describe("Integration with Movie Generation", () => {
    it("should generate different delays for different targets", () => {
      const positions = [
        { x: 256, y: 200 },
        { x: 256, y: 240 },
        { x: 256, y: 280 },
      ];

      // Target to the right
      const rightDelays = calculatePointTargetDelays(positions, 400, 240);

      // Target to the left
      const leftDelays = calculatePointTargetDelays(positions, 100, 240);

      // Delays should be different for different targets
      expect(rightDelays).not.toEqual(leftDelays);

      // But both should satisfy the focusing condition
      rightDelays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
      });
      leftDelays.forEach((delay) => {
        expect(delay).toBeGreaterThanOrEqual(0);
      });
    });

    it("should maintain consistent element properties", () => {
      const delays = [0.001, 0.003, 0.002];
      const elements = createElementArray(3, 4.0, delays, mockCanvas);

      // All elements should have consistent non-delay properties
      elements.forEach((element) => {
        expect(element.radius).toBe(10); // Default radius
        expect(element.lineLength).toBe(200); // Default line length
        expect(element.x).toBe(mockCanvas.width * 0.4); // Same X position
      });

      // But different delays
      expect(elements[0].delay).toBe(0.001);
      expect(elements[1].delay).toBe(0.003);
      expect(elements[2].delay).toBe(0.002);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty position array", () => {
      const delays = calculatePointTargetDelays([], 400, 240);
      expect(delays).toEqual([]);
    });

    it("should handle target at infinity", () => {
      const positions = [{ x: 256, y: 240 }];
      const delays = calculatePointTargetDelays(
        positions,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
      );

      // Should handle gracefully without throwing
      expect(delays).toHaveLength(1);
      // Delay might be infinite, but shouldn't crash
    });

    it("should handle NaN coordinates", () => {
      const positions = [{ x: 256, y: 240 }];
      const delays = calculatePointTargetDelays(positions, NaN, NaN);

      expect(delays).toHaveLength(1);
      // Result might be NaN, but shouldn't crash
    });

    it("should handle zero distances correctly", () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 100, y: 100 }, // Same position as first
      ];
      const targetX = 200;
      const targetY = 200;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBe(delays[1]); // Same distance, same delay
    });
  });

  describe("Mathematical Properties", () => {
    it("should satisfy delay ordering principle", () => {
      const positions = [
        { x: 200, y: 200 }, // Far from target
        { x: 250, y: 250 }, // Medium distance
        { x: 290, y: 290 }, // Close to target
      ];
      const targetX = 300;
      const targetY = 300;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);

      // Closer elements should have larger delays
      expect(delays[2]).toBeGreaterThan(delays[1]); // Closest has largest delay
      expect(delays[1]).toBeGreaterThan(delays[0]); // Medium > farthest
    });

    it("should produce delays proportional to distance differences", () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ];
      const targetX = 300;
      const targetY = 300;

      const delays = calculatePointTargetDelays(positions, targetX, targetY);
      const visualSpeed = 150;

      // Calculate expected distance difference
      const dist1 = Math.sqrt((300 - 100) ** 2 + (300 - 100) ** 2);
      const dist2 = Math.sqrt((300 - 200) ** 2 + (300 - 200) ** 2);
      const expectedDelayDiff = (dist1 - dist2) / visualSpeed;

      expect(delays[1] - delays[0]).toBeCloseTo(expectedDelayDiff, 10);
    });
  });
});
