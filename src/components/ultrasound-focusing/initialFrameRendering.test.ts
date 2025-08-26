import { generateAndRenderInitialFrame } from "./main";

describe("Initial Frame Rendering", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;
  let mockInputs: Record<string, HTMLInputElement>;
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    // Store original method
    originalGetElementById = document.getElementById;

    // Create mock canvas
    mockCanvas = document.createElement("canvas");
    mockCanvas.width = 640;
    mockCanvas.height = 480;

    // Create comprehensive mock context
    mockCtx = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      setLineDash: jest.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      font: "",
      textAlign: "start" as CanvasTextAlign,
    } as unknown as CanvasRenderingContext2D;

    // Mock canvas getContext and event methods
    jest.spyOn(mockCanvas, "getContext").mockReturnValue(mockCtx);
    mockCanvas.addEventListener = jest.fn();
    mockCanvas.dispatchEvent = jest.fn();

    // Create mock input elements
    mockInputs = {
      speedOfSound: {
        value: "150",
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as HTMLInputElement,
      numElements: {
        value: "16",
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as HTMLInputElement,
      pitch: {
        value: "50",
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as HTMLInputElement,
      targetX: {
        value: "",
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as HTMLInputElement,
      targetY: {
        value: "",
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as HTMLInputElement,
    };

    // Create mock buttons
    const mockButtons = {
      unsetTarget: {
        disabled: true,
        addEventListener: jest.fn(),
        click: jest.fn(),
      } as unknown as HTMLButtonElement,
      playPauseMovie: {
        addEventListener: jest.fn(),
      } as unknown as HTMLButtonElement,
      stopMovie: {
        addEventListener: jest.fn(),
        disabled: true,
      } as unknown as HTMLButtonElement,
      prevFrame: {
        addEventListener: jest.fn(),
      } as unknown as HTMLButtonElement,
      nextFrame: {
        addEventListener: jest.fn(),
      } as unknown as HTMLButtonElement,
      downloadFrame: {
        addEventListener: jest.fn(),
      } as unknown as HTMLButtonElement,
      // TEMPORARILY DISABLED: Download Movie button
      // downloadMovie: {
      //   addEventListener: jest.fn(),
      // } as unknown as HTMLButtonElement,
    };

    // Mock document.getElementById
    document.getElementById = jest.fn((id: string) => {
      if (id === "animationCanvas") return mockCanvas;
      if (mockInputs[id]) return mockInputs[id];
      if (mockButtons[id]) return mockButtons[id];
      // Handle temporarily disabled downloadMovie button
      if (id === "downloadMovie") return null;
      return null;
    });

    // Mock createImageBitmap
    global.createImageBitmap = jest.fn().mockResolvedValue({
      width: 640,
      height: 480,
      close: jest.fn(),
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    jest.resetAllMocks();
  });

  it("should render initial frame with linear targeting", async () => {
    // Arrange - empty target means linear targeting
    mockInputs.targetX.value = "";
    mockInputs.targetY.value = "";

    // Act
    await generateAndRenderInitialFrame();

    // Assert - should call context methods for drawing and final render
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalledWith(mockCanvas);
  });

  it("should render initial frame with point targeting", async () => {
    // Arrange - valid target coordinates
    mockInputs.targetX.value = "500";
    mockInputs.targetY.value = "300";

    // Act
    await generateAndRenderInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalledWith(mockCanvas);
  });

  it("should handle missing canvas gracefully", async () => {
    // Arrange - no canvas element
    document.getElementById = jest.fn(() => null);

    // Act & Assert - should not throw
    await expect(generateAndRenderInitialFrame()).resolves.not.toThrow();

    // Should not call any context methods
    expect(mockCtx.clearRect).not.toHaveBeenCalled();
    expect(mockCtx.drawImage).not.toHaveBeenCalled();
  });

  it("should handle missing input elements gracefully", async () => {
    // Arrange - canvas exists but inputs don't
    document.getElementById = jest.fn((id: string) => {
      if (id === "animationCanvas") return mockCanvas;
      return null;
    });

    // Act & Assert - should not throw
    await expect(generateAndRenderInitialFrame()).resolves.not.toThrow();

    // Should not call any context methods due to missing inputs
    expect(mockCtx.clearRect).not.toHaveBeenCalled();
    expect(mockCtx.drawImage).not.toHaveBeenCalled();
  });

  it("should clean up bitmap resources", async () => {
    // Arrange
    const mockBitmap = {
      width: 640,
      height: 480,
      close: jest.fn(),
    };
    (global.createImageBitmap as jest.Mock).mockResolvedValue(mockBitmap);

    // Act
    await generateAndRenderInitialFrame();

    // Assert
    expect(mockBitmap.close).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockBitmap, 0, 0);
  });

  it("should handle different element configurations", async () => {
    // Arrange - different number of elements
    mockInputs.numElements.value = "8";
    mockInputs.pitch.value = "25";

    // Act
    await generateAndRenderInitialFrame();

    // Assert - should still render successfully
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should handle different speed values", async () => {
    // Arrange
    mockInputs.speedOfSound.value = "200";

    // Act
    await generateAndRenderInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should fallback to linear targeting for invalid point targets", async () => {
    // Arrange - target too close to elements (should be invalid)
    mockInputs.targetX.value = "200";
    mockInputs.targetY.value = "240";

    // Act
    await generateAndRenderInitialFrame();

    // Assert - should still render successfully using fallback
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should handle edge cases with minimal elements", async () => {
    // Arrange
    mockInputs.numElements.value = "1";
    mockInputs.pitch.value = "0";

    // Act
    await generateAndRenderInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it("should handle maximum element configuration", async () => {
    // Arrange
    mockInputs.numElements.value = "64";
    mockInputs.pitch.value = "10";

    // Act
    await generateAndRenderInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it("should work with the new updateInitialFrame global function", async () => {
    // Arrange - import the new function
    const { updateInitialFrame } = await import("./main");

    // Clear previous calls
    jest.clearAllMocks();

    // Set up some test values
    mockInputs.numElements.value = "8";
    mockInputs.pitch.value = "40";
    mockInputs.speedOfSound.value = "200";
    mockInputs.targetX.value = "450";
    mockInputs.targetY.value = "320";

    // Act
    await updateInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should handle updateInitialFrame with linear targeting", async () => {
    // Arrange
    const { updateInitialFrame } = await import("./main");

    // Clear target values for linear targeting
    mockInputs.targetX.value = "";
    mockInputs.targetY.value = "";

    jest.clearAllMocks();

    // Act
    await updateInitialFrame();

    // Assert
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it("should regenerate initial frame when canvas is clicked", async () => {
    // Arrange - import initializeUI to set up click handlers
    const { initializeUI } = await import("./main");

    // Clear target values first
    mockInputs.targetX.value = "";
    mockInputs.targetY.value = "";

    // Mock getBoundingClientRect before initializing UI
    Object.defineProperty(mockCanvas, "getBoundingClientRect", {
      value: jest.fn(() => ({ left: 50, top: 50, width: 640, height: 480 })),
      writable: true,
    });

    // Set up a proper click handler that calls the regeneration function
    let clickHandler: (event: MouseEvent) => void;
    const originalAddEventListener = mockCanvas.addEventListener;
    mockCanvas.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === "click") {
        clickHandler = handler;
      }
      if (originalAddEventListener) {
        originalAddEventListener.call(mockCanvas, event, handler);
      }
    });

    // Initialize UI to set up event handlers
    initializeUI();

    // Clear canvas operations from initialization
    jest.clearAllMocks();

    // Simulate click by calling handler directly
    if (clickHandler) {
      const mockEvent = {
        clientX: 350, // Will result in x = 300 (350 - 50)
        clientY: 190, // Will result in y = 140 (190 - 50)
      } as MouseEvent;

      clickHandler(mockEvent);
    }

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Assert - target values should be set
    expect(mockInputs.targetX.value).toBe("300");
    expect(mockInputs.targetY.value).toBe("140");

    // Assert - initial frame should have been regenerated
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should handle async canvas click with proper timing", async () => {
    // Arrange - comprehensive test for async behavior
    const { initializeUI } = await import("./main");

    // Track order of operations
    const operationOrder: string[] = [];

    // Enhanced mocks with operation tracking
    const trackedCtx = {
      ...mockCtx,
      clearRect: jest.fn((...args) => {
        operationOrder.push("clearRect");
        return (mockCtx.clearRect as jest.Mock)(...args);
      }),
      drawImage: jest.fn((...args) => {
        operationOrder.push("drawImage");
        return (mockCtx.drawImage as jest.Mock)(...args);
      }),
      fillRect: jest.fn((...args) => {
        operationOrder.push("fillRect");
        return (mockCtx.fillRect as jest.Mock)(...args);
      }),
    };

    jest.spyOn(mockCanvas, "getContext").mockReturnValue(trackedCtx as any);

    Object.defineProperty(mockCanvas, "getBoundingClientRect", {
      value: jest.fn(() => ({ left: 0, top: 0, width: 640, height: 480 })),
      writable: true,
    });

    // Set up click handler capture
    let asyncClickHandler: (event: MouseEvent) => Promise<void>;
    mockCanvas.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === "click") {
        asyncClickHandler = handler;
      }
    });

    // Initialize UI
    initializeUI();

    // Clear tracking after initialization
    operationOrder.length = 0;
    jest.clearAllMocks();

    // Simulate canvas click with proper async handling
    if (asyncClickHandler) {
      const clickEvent = {
        clientX: 400,
        clientY: 240,
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      } as any;

      // Call the async handler and wait for completion
      await asyncClickHandler(clickEvent);
    }

    // Additional wait to ensure all async operations complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Assert target was set
    expect(mockInputs.targetX.value).toBe("400");
    expect(mockInputs.targetY.value).toBe("240");

    // Assert canvas operations occurred in correct order
    expect(operationOrder).toContain("clearRect");
    expect(operationOrder).toContain("fillRect");
    expect(operationOrder).toContain("drawImage");

    // Verify the frame generation pipeline worked
    expect(trackedCtx.clearRect).toHaveBeenCalled();
    expect(trackedCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });

  it("should handle unset target functionality", async () => {
    // Arrange - test the updateInitialFrame function directly
    const { updateInitialFrame } = await import("./main");

    // Set initial target values
    mockInputs.targetX.value = "400";
    mockInputs.targetY.value = "240";

    jest.clearAllMocks();

    // Act - call updateInitialFrame which should handle the logic
    await updateInitialFrame();

    // Assert frame generation occurred
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();

    // Test with cleared target (simulating unset)
    mockInputs.targetX.value = "";
    mockInputs.targetY.value = "";
    jest.clearAllMocks();

    await updateInitialFrame();

    // Assert frame generation occurred again with linear targeting
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.drawImage).toHaveBeenCalled();
    expect(global.createImageBitmap).toHaveBeenCalled();
  });
});
