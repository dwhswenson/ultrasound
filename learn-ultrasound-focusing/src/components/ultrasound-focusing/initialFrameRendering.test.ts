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

    // Mock canvas getContext
    jest.spyOn(mockCanvas, "getContext").mockReturnValue(mockCtx);

    // Create mock input elements
    mockInputs = {
      speedOfSound: { value: "150" } as HTMLInputElement,
      numElements: { value: "16" } as HTMLInputElement,
      pitch: { value: "50" } as HTMLInputElement,
      targetX: { value: "" } as HTMLInputElement,
      targetY: { value: "" } as HTMLInputElement,
    };

    // Mock document.getElementById
    document.getElementById = jest.fn((id: string) => {
      if (id === "animationCanvas") return mockCanvas;
      return mockInputs[id] || null;
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
});
