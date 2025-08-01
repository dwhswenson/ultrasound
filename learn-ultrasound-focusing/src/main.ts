import { ArrayElement } from "./arrayElement";

// Global variables for DOM elements (initialized in initializeUI)
let delayTimeInput: HTMLInputElement;
let currentTimeInput: HTMLInputElement;
let movieDurationInput: HTMLInputElement;
let numElementsInput: HTMLInputElement;
let pitchInput: HTMLInputElement;
let targetRadios: NodeListOf<HTMLInputElement>;
let linearControls: HTMLElement;
let pointControls: HTMLElement;
let targetXInput: HTMLInputElement;
let targetYInput: HTMLInputElement;
let generateBtn: HTMLElement;
let playMovieBtn: HTMLElement;
let prevFrameBtn: HTMLElement;
let nextFrameBtn: HTMLElement;
let downloadFrameBtn: HTMLElement;
let downloadMovieBtn: HTMLElement;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let frames: ImageBitmap[] = [];
let currentFrame = 0;
let isPlaying = false;
let playInterval: number | null = null;

/**
 * Creates a frame showing multiple ArrayElements at the specified time.
 */
async function createMultiElementFrame(
  delayTime: number,
  currentTime: number,
  numElements: number,
  pitch: number,
  canvasElement: HTMLCanvasElement = canvas,
  context: CanvasRenderingContext2D = ctx,
): Promise<ImageBitmap> {
  // Create elements with single delay (for backward compatibility)
  const elements = createElementArray(
    numElements,
    pitch,
    delayTime,
    canvasElement,
  );

  return createMultiElementFrameWithElements(
    elements,
    delayTime,
    currentTime,
    numElements,
    pitch,
    "linear",
    canvasElement,
    context,
    undefined,
    undefined,
  );
}

/**
 * Creates a frame with pre-created elements and additional target information.
 */
async function createMultiElementFrameWithElements(
  elements: ArrayElement[],
  maxDelayTime: number,
  currentTime: number,
  numElements: number,
  pitch: number,
  targetType: string,
  canvasElement: HTMLCanvasElement = canvas,
  context: CanvasRenderingContext2D = ctx,
  targetX?: number,
  targetY?: number,
): Promise<ImageBitmap> {
  // Clear canvas
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw all elements
  drawElementsAtTime(context, elements, currentTime);

  // Draw target point if point targeting
  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    // Draw target crosshairs
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(targetX - 10, targetY);
    context.lineTo(targetX + 10, targetY);
    context.moveTo(targetX, targetY - 10);
    context.lineTo(targetX, targetY + 10);
    context.stroke();

    // Draw target circle
    context.beginPath();
    context.arc(targetX, targetY, 5, 0, 2 * Math.PI);
    context.strokeStyle = "red";
    context.lineWidth = 1;
    context.stroke();
  }

  // Validate and draw target point feedback
  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    const elementX = canvasElement.width * 0.4;
    const validation = validateTargetPoint(
      targetX,
      targetY,
      canvasElement.width,
      canvasElement.height,
      elementX,
    );

    if (!validation.isValid) {
      // Draw invalid target indicator
      context.strokeStyle = "red";
      context.lineWidth = 3;
      context.setLineDash([5, 5]); // Dashed line
      context.beginPath();
      context.arc(targetX, targetY, 20, 0, 2 * Math.PI);
      context.stroke();
      context.setLineDash([]); // Reset dash

      // Draw X to indicate invalid
      context.beginPath();
      context.moveTo(targetX - 10, targetY - 10);
      context.lineTo(targetX + 10, targetY + 10);
      context.moveTo(targetX + 10, targetY - 10);
      context.lineTo(targetX - 10, targetY + 10);
      context.stroke();
    } else {
      // Draw wave convergence visualization for valid targets
      const amplitude = calculateWaveAmplitudeAtTarget(
        elements,
        targetX,
        targetY,
        currentTime,
      );

      if (amplitude > 0) {
        // Draw pulsing convergence indicator
        const maxRadius = 15;
        const pulseRadius = maxRadius * amplitude;
        const opacity = Math.min(amplitude * 2, 1); // More opaque with higher amplitude

        context.beginPath();
        context.arc(targetX, targetY, pulseRadius, 0, 2 * Math.PI);
        context.fillStyle = `rgba(0, 255, 0, ${opacity * 0.3})`; // Semi-transparent green
        context.fill();

        // Draw amplitude ring
        context.beginPath();
        context.arc(targetX, targetY, pulseRadius, 0, 2 * Math.PI);
        context.strokeStyle = `rgba(0, 255, 0, ${opacity})`;
        context.lineWidth = 2;
        context.stroke();
      }
    }
  }

  // Add some helpful text
  context.fillStyle = "black";
  context.font = "14px Arial";
  context.fillText(`Current Time: ${currentTime.toFixed(6)}s`, 10, 20);
  context.fillText(`Max Delay: ${maxDelayTime.toFixed(6)}s`, 10, 40);
  context.fillText(
    `Elements: ${numElements}, Pitch: ${pitch.toFixed(3)}`,
    10,
    60,
  );

  // Add coordinate information for target positioning
  context.fillText(
    `Canvas: ${canvasElement.width}×${canvasElement.height} px`,
    10,
    80,
  );
  context.fillText(
    `Element X: ${Math.round(canvasElement.width * 0.4)} px`,
    10,
    100,
  );
  context.fillText(`Coordinate system: (0,0) at top-left`, 10, 120);

  // Add click instruction for point targeting
  if (targetType === "point") {
    context.fillStyle = "blue";
    context.fillText(
      `💡 Click on canvas to set target point`,
      10,
      canvasElement.height - 20,
    );
    context.fillStyle = "black"; // Reset color
  }

  // Add target information
  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    context.fillText(`Target: (${targetX}, ${targetY})`, 10, 140);
  } else {
    context.fillText(`Target: Linear (parallel to array)`, 10, 140);
  }

  // Add validation and wave amplitude information for point targeting
  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    const elementX = canvasElement.width * 0.4;
    const validation = validateTargetPoint(
      targetX,
      targetY,
      canvasElement.width,
      canvasElement.height,
      elementX,
    );

    if (!validation.isValid) {
      context.fillStyle = "red";
      context.fillText(
        `⚠ Invalid Target: ${validation.errorMessage}`,
        10,
        160,
      );
      context.fillStyle = "black"; // Reset color
    } else {
      const amplitude = calculateWaveAmplitudeAtTarget(
        elements,
        targetX,
        targetY,
        currentTime,
      );
      context.fillText(
        `Wave Amplitude at Target: ${(amplitude * 100).toFixed(1)}%`,
        10,
        160,
      );
    }
  }

  return await createImageBitmap(canvasElement);
}

/**
 * Calculates the wave amplitude at a target point from multiple elements.
 * Returns amplitude (0-1) based on constructive/destructive interference.
 */
function calculateWaveAmplitudeAtTarget(
  elements: ArrayElement[],
  targetX: number,
  targetY: number,
  currentTime: number,
): number {
  const visualSpeed = 200; // px/sec, same as in ArrayElement
  let totalAmplitude = 0;
  let waveCount = 0;

  elements.forEach((element) => {
    // Check if this element has fired yet
    if (currentTime < element.delay) return;

    // Calculate time since this element fired
    const timeSinceFiring = currentTime - element.delay;

    // Calculate distance from element to target
    const distance = Math.sqrt(
      (targetX - element.x) ** 2 + (targetY - element.y) ** 2,
    );

    // Calculate time for wave to travel to target
    const travelTime = distance / visualSpeed;

    // Check if wave has reached target yet
    if (timeSinceFiring >= travelTime) {
      // Wave has reached target - add its contribution
      // Use a simple sinusoidal wave model for amplitude
      const phase = (timeSinceFiring - travelTime) * 2 * Math.PI * 5; // 5 Hz for visualization
      const amplitude = Math.sin(phase) * 0.5 + 0.5; // Normalize to 0-1
      totalAmplitude += amplitude;
      waveCount++;
    }
  });

  // Normalize by number of contributing waves for average amplitude
  return waveCount > 0 ? totalAmplitude / waveCount : 0;
}

/**
 * Validates if a target point is within acceptable bounds.
 * Returns validation result with error message if invalid.
 */
function validateTargetPoint(
  targetX: number,
  targetY: number,
  canvasWidth: number,
  canvasHeight: number,
  elementX: number,
): { isValid: boolean; errorMessage?: string } {
  // Check canvas bounds with margin
  const margin = 50;
  if (
    targetX < margin ||
    targetX > canvasWidth - margin ||
    targetY < margin ||
    targetY > canvasHeight - margin
  ) {
    return {
      isValid: false,
      errorMessage: `Target must be at least ${margin}px from canvas edges`,
    };
  }

  // Check minimum distance from array elements (avoid near-field issues)
  const minDistance = 100;
  const distanceFromArray = Math.abs(targetX - elementX);

  if (distanceFromArray < minDistance) {
    return {
      isValid: false,
      errorMessage: `Target must be at least ${minDistance}px from array elements`,
    };
  }

  // Check if target is behind the array (negative X direction from elements)
  if (targetX < elementX) {
    return {
      isValid: false,
      errorMessage:
        "Target must be in front of (to the right of) array elements",
    };
  }

  return { isValid: true };
}

/**
 * Calculates delay times for point targeting.
 * Elements farther from target fire first, closer elements fire later.
 */
function calculatePointTargetDelays(
  elementPositions: { x: number; y: number }[],
  targetX: number,
  targetY: number,
): number[] {
  const visualSpeed = 200; // px/sec, same as in ArrayElement

  // Calculate distances from each element to target
  const distances = elementPositions.map((pos) =>
    Math.sqrt((targetX - pos.x) ** 2 + (targetY - pos.y) ** 2),
  );

  // Find maximum distance (reference)
  const maxDistance = Math.max(...distances);

  // Calculate delays: farthest element fires first (delay = 0)
  return distances.map((distance) => (maxDistance - distance) / visualSpeed);
}

/**
 * Creates an array of ArrayElements with proper spacing.
 * Pitch is in millimeters, converted to pixels for screen display.
 */
function createElementArray(
  numElements: number,
  pitchMm: number,
  delays: number[] | number,
  canvasElement: HTMLCanvasElement = canvas,
): ArrayElement[] {
  const elements: ArrayElement[] = [];

  // Convert pitch from mm to pixels (assume 1mm = 10 pixels for good screen visibility)
  const pitchPx = pitchMm * 10;

  // Calculate total height needed and center the array vertically
  const totalHeight = (numElements - 1) * pitchPx;
  const startY = (canvasElement.height - totalHeight) / 2;

  // Position elements horizontally to leave room for trigger lines and waves
  const elementX = canvasElement.width * 0.4; // 40% from left edge

  for (let i = 0; i < numElements; i++) {
    const elementY = startY + i * pitchPx;
    const elementDelay = Array.isArray(delays) ? delays[i] : delays;
    elements.push(new ArrayElement(elementX, elementY, elementDelay));
  }

  return elements;
}

/**
 * Generates a complete movie showing the full animation cycle.
 */
async function generateMovie(
  numElements: number,
  pitch: number,
  movieDuration: number,
  targetType: string = "linear",
  targetX?: number,
  targetY?: number,
): Promise<void> {
  frames = [];

  // Use visual timeline instead of physical timing
  // The movie duration controls the total visual time
  const frameRate = 30; // fps
  const totalFrames = Math.ceil(movieDuration * frameRate);

  // Calculate visual delay time as a fraction of total movie duration
  // Show red pulse phase for first 30% of movie, waves for remaining 70%
  const baseVisualDelayTime = movieDuration * 0.3;

  // Create elements with appropriate delays based on target type
  let elements: ArrayElement[];
  let maxDelayTime: number;

  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    // Point targeting: calculate individual delays
    const pitchPx = pitch * 10;
    const totalHeight = (numElements - 1) * pitchPx;
    const startY = (canvas.height - totalHeight) / 2;
    const elementX = canvas.width * 0.4;

    const positions = [];
    for (let i = 0; i < numElements; i++) {
      positions.push({ x: elementX, y: startY + i * pitchPx });
    }

    // Calculate delays directly using visual speed (200 px/sec)
    // This ensures proper convergence in the visual timeline
    const visualSpeed = 200; // Must match VISUAL_SPEED_PX_PER_SEC in ArrayElement

    // Calculate distances from each element to target
    const distances = positions.map((pos) =>
      Math.sqrt((targetX - pos.x) ** 2 + (targetY - pos.y) ** 2),
    );

    // Find maximum distance (reference)
    const maxDistance = Math.max(...distances);

    // Calculate visual delays: farthest element fires first (delay = 0)
    const visualDelays = distances.map(
      (distance) => (maxDistance - distance) / visualSpeed,
    );

    elements = createElementArray(numElements, pitch, visualDelays, canvas);
    maxDelayTime = Math.max(...visualDelays);
  } else {
    // Linear targeting: all elements have same delay
    elements = createElementArray(
      numElements,
      pitch,
      baseVisualDelayTime,
      canvas,
    );
    maxDelayTime = baseVisualDelayTime;
  }

  // Generate frames with visual timing
  for (let i = 0; i < totalFrames; i++) {
    const visualCurrentTime = (i / (totalFrames - 1)) * movieDuration;
    const bitmap = await createMultiElementFrameWithElements(
      elements,
      maxDelayTime,
      visualCurrentTime,
      numElements,
      pitch,
      targetType,
      canvas,
      ctx,
      targetX,
      targetY,
    );
    frames.push(bitmap);
  }

  currentFrame = 0;
}

/**
 * Plays the generated movie.
 */
function playMovie(): void {
  if (frames.length === 0) return;

  isPlaying = true;
  playMovieBtn.textContent = "Stop Movie";

  playInterval = window.setInterval(() => {
    renderFrame(currentFrame);
    currentFrame++;

    if (currentFrame >= frames.length) {
      stopMovie();
    }
  }, 1000 / 15); // 15 fps for better visual clarity
}

/**
 * Stops the movie playback.
 */
function stopMovie(): void {
  isPlaying = false;
  playMovieBtn.textContent = "Play Movie";

  if (playInterval !== null) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

/**
 * Draws an array of elements at a specific time.
 * This function is designed to handle multiple elements in the future.
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

function renderFrame(idx: number) {
  if (frames.length === 0) return;
  const bitmap = frames[idx];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
}

/**
 * Initialize UI event listeners and DOM references.
 * Call this when the DOM is ready.
 */
function initializeUI(): void {
  // Get DOM element references
  delayTimeInput = document.getElementById("delayTime") as HTMLInputElement;
  currentTimeInput = document.getElementById("currentTime") as HTMLInputElement;
  movieDurationInput = document.getElementById(
    "movieDuration",
  ) as HTMLInputElement;
  numElementsInput = document.getElementById("numElements") as HTMLInputElement;
  pitchInput = document.getElementById("pitch") as HTMLInputElement;
  targetRadios = document.getElementsByName(
    "targetType",
  ) as NodeListOf<HTMLInputElement>;
  linearControls = document.getElementById("linearControls")!;
  pointControls = document.getElementById("pointControls")!;
  targetXInput = document.getElementById("targetX") as HTMLInputElement;
  targetYInput = document.getElementById("targetY") as HTMLInputElement;
  generateBtn = document.getElementById("generate")!;
  playMovieBtn = document.getElementById("playMovie")!;
  prevFrameBtn = document.getElementById("prevFrame")!;
  nextFrameBtn = document.getElementById("nextFrame")!;
  downloadFrameBtn = document.getElementById("downloadFrame")!;
  downloadMovieBtn = document.getElementById("downloadMovie")!;
  canvas = document.getElementById("animationCanvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;

  // Toggle target-specific controls (for future use)
  targetRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "linear" && radio.checked) {
        linearControls.style.display = "";
        pointControls.style.display = "none";
      } else if (radio.value === "point" && radio.checked) {
        linearControls.style.display = "none";
        pointControls.style.display = "";
      }
    });
  });

  // Generate frame based on current form values
  generateBtn.addEventListener("click", async () => {
    const currentTime = parseFloat(currentTimeInput.value);
    const numElements = parseInt(numElementsInput.value, 10);
    const pitch = parseFloat(pitchInput.value);
    const targetType = Array.from(targetRadios).find((r) => r.checked)!.value;

    // Calculate appropriate delays based on target type
    let effectiveDelayTime: number;
    let elements: ArrayElement[];

    if (targetType === "point") {
      const targetX = parseFloat(targetXInput.value);
      const targetY = parseFloat(targetYInput.value);

      // Create element positions first
      const pitchPx = pitch * 10;
      const totalHeight = (numElements - 1) * pitchPx;
      const startY = (canvas.height - totalHeight) / 2;
      const elementX = canvas.width * 0.4;

      const positions = [];
      for (let i = 0; i < numElements; i++) {
        positions.push({ x: elementX, y: startY + i * pitchPx });
      }

      // Calculate point target delays
      const delays = calculatePointTargetDelays(positions, targetX, targetY);
      elements = createElementArray(numElements, pitch, delays, canvas);

      // Use the maximum delay as reference for timing
      effectiveDelayTime = Math.max(...delays);
    } else {
      // Linear target: use single delay for all elements
      const singleDelay = parseFloat(delayTimeInput.value);
      elements = createElementArray(numElements, pitch, singleDelay, canvas);
      effectiveDelayTime = singleDelay;
    }

    // Clear previous frames and generate a single frame
    frames = [];

    // Get target coordinates if point targeting
    let targetX, targetY;
    if (targetType === "point") {
      targetX = parseFloat(targetXInput.value);
      targetY = parseFloat(targetYInput.value);

      // Validate target point
      const elementX = canvas.width * 0.4;
      const validation = validateTargetPoint(
        targetX,
        targetY,
        canvas.width,
        canvas.height,
        elementX,
      );

      if (!validation.isValid) {
        alert(`Invalid target position: ${validation.errorMessage}`);
        return;
      }
    }

    const bitmap = await createMultiElementFrameWithElements(
      elements,
      effectiveDelayTime,
      currentTime,
      numElements,
      pitch,
      targetType,
      canvas,
      ctx,
      targetX,
      targetY,
    );
    frames.push(bitmap);
    currentFrame = 0;
    renderFrame(0);
  });

  // Play movie functionality
  playMovieBtn.addEventListener("click", async () => {
    if (isPlaying) {
      stopMovie();
      return;
    }

    const numElements = parseInt(numElementsInput.value, 10);
    const pitch = parseFloat(pitchInput.value);
    const movieDuration = parseFloat(movieDurationInput.value);
    const targetType = Array.from(targetRadios).find((r) => r.checked)!.value;

    let targetX, targetY;
    if (targetType === "point") {
      targetX = parseFloat(targetXInput.value);
      targetY = parseFloat(targetYInput.value);

      // Validate target point before generating movie
      const elementX = canvas.width * 0.4;
      const validation = validateTargetPoint(
        targetX,
        targetY,
        canvas.width,
        canvas.height,
        elementX,
      );

      if (!validation.isValid) {
        alert(`Cannot generate movie: ${validation.errorMessage}`);
        return;
      }
    }

    await generateMovie(
      numElements,
      pitch,
      movieDuration,
      targetType,
      targetX,
      targetY,
    );
    playMovie();
  });

  prevFrameBtn.addEventListener("click", () => {
    if (currentFrame > 0) {
      currentFrame--;
      renderFrame(currentFrame);
    }
  });

  nextFrameBtn.addEventListener("click", () => {
    if (currentFrame < frames.length - 1) {
      currentFrame++;
      renderFrame(currentFrame);
    }
  });

  downloadFrameBtn.addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      const a = document.createElement("a");
      a.href = url;
      a.download = `frame-${currentFrame}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  downloadMovieBtn.addEventListener("click", () => {
    // TODO: hook up MediaRecorder or GIF.js to export frames as movie
    alert("Download movie not implemented yet");
  });

  // Add click-to-set-target functionality
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Only set target if point targeting is selected
    const pointRadio = Array.from(targetRadios).find(
      (r) => r.value === "point" && r.checked,
    );
    if (pointRadio) {
      targetXInput.value = Math.round(x).toString();
      targetYInput.value = Math.round(y).toString();

      // Show visual feedback
      showTargetSetFeedback(x, y);

      // Auto-generate frame if current settings are valid
      generateBtn.click();
    }
  });

  // Add mouse move tracking for coordinate display
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update cursor coordinate display
    updateCoordinateDisplay(x, y);
  });
}

// Initialize when DOM is ready (but not during testing)
if (typeof document !== "undefined" && typeof jest === "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUI);
  } else {
    initializeUI();
  }
}

// Export functions for testing
export {
  createElementArray,
  createMultiElementFrame,
  createMultiElementFrameWithElements,
  drawElementsAtTime,
  generateMovie,
  calculatePointTargetDelays,
  calculateWaveAmplitudeAtTarget,
  validateTargetPoint,
  showTargetSetFeedback,
  updateCoordinateDisplay,
};

/**
 * Shows visual feedback when a target point is set by clicking.
 */
function showTargetSetFeedback(x: number, y: number): void {
  // Create a temporary visual indicator
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Copy current canvas content
  tempCtx.drawImage(canvas, 0, 0);

  // Draw feedback animation
  let opacity = 1;
  let radius = 5;

  const animate = () => {
    // Clear and redraw base content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    // Draw expanding ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Update animation parameters
    opacity -= 0.05;
    radius += 2;

    if (opacity > 0) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

/**
 * Updates coordinate display in the UI.
 */
function updateCoordinateDisplay(x: number, y: number): void {
  // Update the mouse coordinates span in the HTML
  const mouseCoords = document.getElementById("mouseCoords");
  if (mouseCoords) {
    mouseCoords.textContent = `(${Math.round(x)}, ${Math.round(y)})`;
  }
}
