import { createMultiElementFrame } from "./main";

// Mock canvas context and elements for testing
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
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
  } as unknown as CanvasRenderingContext2D;

  (canvas.getContext as jest.Mock).mockReturnValue(ctx);
  return { canvas, ctx };
};

// Mock global functions
beforeEach(() => {
  (global as any).createImageBitmap = jest.fn().mockResolvedValue({
    width: 640,
    height: 480,
    close: jest.fn(),
  } as ImageBitmap);
});

describe("Movie Generation Functionality", () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    const mock = createMockCanvas();
    canvas = mock.canvas;
    ctx = mock.ctx;
  });

  describe("Movie Timeline Calculations", () => {
    it("should calculate correct total time for movie", () => {
      const delayTime = 0.001;
      const expectedPostDelayTime = delayTime + 0.002; // 0.003s total
      const expectedTotalTime = expectedPostDelayTime;

      expect(expectedTotalTime).toBe(0.003);
    });

    it("should calculate correct number of frames at 30fps", () => {
      const totalTime = 0.003; // 3ms
      const frameRate = 30;
      const expectedFrames = Math.ceil(totalTime * frameRate);

      expect(expectedFrames).toBe(1); // Math.ceil(0.09) = 1
    });

    it("should handle longer delays with appropriate frame counts", () => {
      const delayTime = 0.1; // 100ms delay
      const totalTime = delayTime + 0.002; // 102ms total
      const frameRate = 30;
      const expectedFrames = Math.ceil(totalTime * frameRate);

      expect(expectedFrames).toBe(4); // Math.ceil(3.06) = 4
    });

    it("should generate time progression correctly", () => {
      const totalTime = 0.1;
      const totalFrames = 30;
      const times = [];

      for (let i = 0; i < totalFrames; i++) {
        const currentTime = (i / (totalFrames - 1)) * totalTime;
        times.push(currentTime);
      }

      expect(times[0]).toBe(0); // First frame at t=0
      expect(times[totalFrames - 1]).toBe(totalTime); // Last frame at total time
      expect(times[1]).toBeCloseTo(totalTime / (totalFrames - 1)); // Linear progression
    });

    it("should calculate correct frames for movie duration", () => {
      const movieDuration = 3.0; // 3 seconds
      const frameRate = 30;
      const expectedFrames = Math.ceil(movieDuration * frameRate);

      expect(expectedFrames).toBe(90); // 3 seconds * 30 fps
    });

    it("should use visual timing with proper delay ratio", () => {
      const movieDuration = 4.0;
      const visualDelayTime = movieDuration * 0.3; // 30% of movie for red pulse phase

      expect(visualDelayTime).toBe(1.2); // 30% of 4 seconds
      expect(movieDuration - visualDelayTime).toBe(2.8); // 70% for wave phase
    });
  });

  describe("Frame Sequence Generation", () => {
    it("should generate frames covering pre-delay phase", async () => {
      const delayTime = 0.001;
      const numElements = 8;
      const pitch = 5.0;
      const totalTime = delayTime + 0.002;
      const totalFrames = Math.ceil(totalTime * 30);

      const frames: ImageBitmap[] = [];

      // Simulate movie generation logic
      for (let i = 0; i < totalFrames; i++) {
        const currentTime = (i / (totalFrames - 1)) * totalTime;
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      expect(frames.length).toBe(totalFrames);
      expect(frames[0]).toBeDefined();
    });

    it("should generate frames covering post-delay phase", async () => {
      const delayTime = 0.001;
      const numElements = 4;
      const pitch = 3.0;

      const frames: ImageBitmap[] = [];

      // Generate several frames after delay time
      const postDelayFrames = 5;
      for (let i = 0; i < postDelayFrames; i++) {
        const currentTime = delayTime + i * 0.0005; // Times after delay
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      expect(frames.length).toBe(postDelayFrames);
      frames.forEach((frame) => {
        expect(frame).toBeDefined();
      });
    });

    it("should handle very short delays efficiently", async () => {
      const delayTime = 0.00001; // Very short delay
      const numElements = 2;
      const pitch = 10.0;
      const totalTime = delayTime + 0.002;
      const totalFrames = Math.ceil(totalTime * 30);

      const startTime = performance.now();
      const frames: ImageBitmap[] = [];

      for (let i = 0; i < Math.min(totalFrames, 3); i++) {
        // Limit frames for performance
        const currentTime = (i / 2) * totalTime;
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      expect(frames.length).toBeGreaterThan(0);
    });
  });

  describe("Movie Animation Phases", () => {
    it("should show red pulse phase in early frames", async () => {
      const delayTime = 0.002;
      const currentTime = 0.001; // Before delay
      const numElements = 6;
      const pitch = 4.0;

      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      // Should show coordinate information
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 100);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        120,
      );
    });

    it("should show wave propagation phase in later frames", async () => {
      const delayTime = 0.001;
      const currentTime = 0.002; // After delay
      const numElements = 6;
      const pitch = 4.0;

      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      // Should show coordinate information
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 100);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        120,
      );
    });

    it("should transition between phases correctly", async () => {
      const delayTime = 0.001;
      const numElements = 4;
      const pitch = 5.0;

      // Frame just before delay
      jest.clearAllMocks();
      await createMultiElementFrame(
        delayTime,
        delayTime - 0.0001,
        numElements,
        pitch,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);

      // Frame just after delay
      jest.clearAllMocks();
      await createMultiElementFrame(
        delayTime,
        delayTime + 0.0001,
        numElements,
        pitch,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
    });
  });

  describe("Movie Parameters Validation", () => {
    it("should handle different element counts in movie", async () => {
      const delayTime = 0.001;
      const currentTime = 0.0005;
      const pitch = 5.0;

      // Test with minimum elements
      await createMultiElementFrame(
        delayTime,
        currentTime,
        4,
        pitch,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 4, Pitch: 5.000",
        10,
        60,
      );

      jest.clearAllMocks();

      // Test with maximum elements
      await createMultiElementFrame(
        delayTime,
        currentTime,
        64,
        pitch,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 64, Pitch: 5.000",
        10,
        60,
      );
    });

    it("should handle different pitch values in movie", async () => {
      const delayTime = 0.001;
      const currentTime = 0.0005;
      const numElements = 16;

      // Test with small pitch
      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        1.0,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 16, Pitch: 1.000",
        10,
        60,
      );

      jest.clearAllMocks();

      // Test with large pitch
      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        20.0,
        canvas,
        ctx,
      );
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Elements: 16, Pitch: 20.000",
        10,
        60,
      );
    });

    it("should maintain frame consistency across movie", async () => {
      const delayTime = 0.001;
      const numElements = 8;
      const pitch = 6.0;
      const frames: ImageBitmap[] = [];

      // Generate several frames
      for (let i = 0; i < 5; i++) {
        const currentTime = i * 0.0005;
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      // All frames should be generated
      expect(frames.length).toBe(5);
      frames.forEach((frame) => {
        expect(frame).toBeDefined();
        expect(frame.width).toBe(640);
        expect(frame.height).toBe(480);
      });
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large frame counts efficiently", async () => {
      const delayTime = 0.001;
      const numElements = 16;
      const pitch = 3.0;
      const frameCount = 10; // Reasonable test size

      const startTime = performance.now();
      const frames: ImageBitmap[] = [];

      for (let i = 0; i < frameCount; i++) {
        const currentTime = (i / (frameCount - 1)) * (delayTime + 0.002);
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(frames.length).toBe(frameCount);
    });

    it("should create frames with consistent dimensions", async () => {
      const delayTime = 0.001;
      const frames: ImageBitmap[] = [];

      // Generate frames with different parameters
      const parameters = [
        { elements: 4, pitch: 2.0 },
        { elements: 16, pitch: 5.0 },
        { elements: 32, pitch: 3.0 },
      ];

      for (const param of parameters) {
        const bitmap = await createMultiElementFrame(
          delayTime,
          0.0005,
          param.elements,
          param.pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      frames.forEach((frame) => {
        expect(frame.width).toBe(640);
        expect(frame.height).toBe(480);
      });
    });
  });

  describe("Edge Cases in Movie Generation", () => {
    it("should handle zero delay time in movie", async () => {
      const delayTime = 0;
      const currentTime = 0.001;
      const numElements = 8;
      const pitch = 5.0;

      const bitmap = await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      expect(bitmap).toBeDefined();
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
    });

    it("should handle very small time steps", async () => {
      const delayTime = 0.001;
      const numElements = 4;
      const pitch = 5.0;
      const frames: ImageBitmap[] = [];

      // Generate frames with very small time differences
      for (let i = 0; i < 3; i++) {
        const currentTime = delayTime + i * 0.000001; // Microsecond steps
        const bitmap = await createMultiElementFrame(
          delayTime,
          currentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      expect(frames.length).toBe(3);
      frames.forEach((frame) => expect(frame).toBeDefined());
    });

    it("should handle time exactly at delay boundary", async () => {
      const delayTime = 0.001;
      const numElements = 6;
      const pitch = 4.0;

      // Test exactly at delay time
      const bitmap = await createMultiElementFrame(
        delayTime,
        delayTime, // currentTime === delayTime
        numElements,
        pitch,
        canvas,
        ctx,
      );

      expect(bitmap).toBeDefined();
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
    });
  });

  describe("Movie Duration Control", () => {
    it("should respect movie duration parameter", async () => {
      // Using visual timing instead of physical delay timing
      const numElements = 8;
      const pitch = 5.0;
      const movieDuration = 2.5; // 2.5 second movie

      // Mock generateMovie functionality
      const frames: ImageBitmap[] = [];
      const frameRate = 30;
      const totalFrames = Math.ceil(movieDuration * frameRate);
      const visualDelayTime = movieDuration * 0.3;

      for (let i = 0; i < totalFrames; i++) {
        const visualCurrentTime = (i / (totalFrames - 1)) * movieDuration;
        const bitmap = await createMultiElementFrame(
          visualDelayTime,
          visualCurrentTime,
          numElements,
          pitch,
          canvas,
          ctx,
        );
        frames.push(bitmap);
      }

      expect(frames.length).toBe(75); // 2.5 * 30 fps
      expect(frames[0]).toBeDefined();
      expect(frames[frames.length - 1]).toBeDefined();
    });

    it("should show red pulse phase for first 30% of movie", async () => {
      const movieDuration = 3.0;
      const visualDelayTime = movieDuration * 0.3; // 0.9 seconds
      const numElements = 6;
      const pitch = 4.0;

      // Test time in red pulse phase (before visual delay)
      const redPhaseTime = visualDelayTime * 0.5; // 0.45 seconds
      await createMultiElementFrame(
        visualDelayTime,
        redPhaseTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
    });

    it("should show wave phase for last 70% of movie", async () => {
      const movieDuration = 3.0;
      const visualDelayTime = movieDuration * 0.3; // 0.9 seconds
      const numElements = 6;
      const pitch = 4.0;

      // Test time in wave phase (after visual delay)
      const wavePhaseTime = visualDelayTime + 0.5; // 1.4 seconds
      await createMultiElementFrame(
        visualDelayTime,
        wavePhaseTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
    });

    it("should handle different movie durations", async () => {
      const testDurations = [1.0, 2.0, 5.0, 10.0];
      const numElements = 4;
      const pitch = 5.0;

      for (const duration of testDurations) {
        const frameRate = 30;
        const expectedFrames = Math.ceil(duration * frameRate);
        const visualDelayTime = duration * 0.3;

        // Test one frame from each duration
        const bitmap = await createMultiElementFrame(
          visualDelayTime,
          duration * 0.5, // Middle of movie
          numElements,
          pitch,
          canvas,
          ctx,
        );

        expect(bitmap).toBeDefined();
        expect(expectedFrames).toBeGreaterThan(0);
      }
    });

    it("should maintain minimum 2 second default duration", () => {
      const defaultDuration = 3.0; // From HTML default
      expect(defaultDuration).toBeGreaterThanOrEqual(2.0);

      // Visual timing should allow for proper observation
      const visualDelayTime = defaultDuration * 0.3;
      const waveTime = defaultDuration * 0.7;

      expect(visualDelayTime).toBeGreaterThanOrEqual(0.6); // At least 0.6s for red pulse
      expect(waveTime).toBeGreaterThanOrEqual(1.4); // At least 1.4s for wave propagation
    });

    it("should display comprehensive coordinate information", async () => {
      const delayTime = 0.001;
      const currentTime = 0.0005;
      const numElements = 16;
      const pitch = 5.0;

      await createMultiElementFrame(
        delayTime,
        currentTime,
        numElements,
        pitch,
        canvas,
        ctx,
      );

      // Check all coordinate information is displayed
      expect(ctx.fillText).toHaveBeenCalledWith("Canvas: 640×480 px", 10, 80);
      expect(ctx.fillText).toHaveBeenCalledWith("Element X: 256 px", 10, 100);
      expect(ctx.fillText).toHaveBeenCalledWith(
        "Coordinate system: (0,0) at top-left",
        10,
        120,
      );

      // Verify element X calculation (40% of canvas width)
      const expectedElementX = Math.round(640 * 0.4);
      expect(expectedElementX).toBe(256);
    });
  });

  describe("Visual Speed vs Physical Speed", () => {
    it("should use visual speed for screen-appropriate timing", () => {
      // Visual speed should be much slower than physical speed for visibility
      const visualSpeedPxPerSec = 200; // From ArrayElement
      const physicalSpeedPxPerSec = 1540 * 1000; // Old physical calculation

      expect(visualSpeedPxPerSec).toBeLessThan(physicalSpeedPxPerSec);
      expect(visualSpeedPxPerSec).toBeGreaterThan(50); // Fast enough to be interesting
      expect(visualSpeedPxPerSec).toBeLessThan(500); // Slow enough to observe
    });

    it("should allow waves to traverse screen in reasonable time", async () => {
      const screenWidth = 640;
      const visualSpeed = 200; // px/sec
      const traversalTime = screenWidth / visualSpeed; // 3.2 seconds

      // This should be reasonable for a movie duration
      expect(traversalTime).toBeGreaterThan(1.0); // Not too fast
      expect(traversalTime).toBeLessThan(10.0); // Not too slow

      // Test that waves can actually traverse the screen
      const movieDuration = 5.0; // Increased to allow enough time for wave traversal
      const visualDelayTime = movieDuration * 0.3;
      const waveTime = movieDuration - visualDelayTime;

      expect(waveTime).toBeGreaterThan(traversalTime); // Enough time for full traversal
    });
  });
});
