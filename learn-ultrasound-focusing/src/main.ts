import { ArrayElement } from "./arrayElement";
import {
  APP_FRAME_RATE,
  DEFAULT_ELEMENT_RADIUS,
  DEFAULT_LINE_LENGTH,
  DEFAULT_ELEMENT_X_POSITION,
} from "./shared/constants";

// Global variables for DOM elements (initialized in initializeUI)

let speedOfSoundInput: HTMLInputElement;
let currentTimeInput: HTMLInputElement;
let movieDurationInput: HTMLInputElement;
let numElementsInput: HTMLInputElement;
let pitchInput: HTMLInputElement;
let targetRadios: NodeListOf<HTMLInputElement>;
let linearControls: HTMLElement;
let pointControls: HTMLElement;
let targetXInput: HTMLInputElement;
let targetYInput: HTMLInputElement;
let angleInput: HTMLInputElement;
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
 * Gets the current speed of sound from the UI input field
 * Falls back to default value if DOM element is not available (for testing)
 */
function getSpeedOfSound(): number {
  if (speedOfSoundInput && speedOfSoundInput.value) {
    return parseFloat(speedOfSoundInput.value);
  }
  // Fallback for tests or when DOM is not initialized
  return 100;
}

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
  _maxDelayTime: number,
  currentTime: number,
  targetType: string,
  canvasElement: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  targetX?: number,
  targetY?: number,
): Promise<ImageBitmap> {
  // Clear the canvas
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  context.fillStyle = "white";
  context.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw elements
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
  /*context.fillText(`Current Time: ${currentTime.toFixed(6)}s`, 10, 20);
  //context.fillText(`Max Delay: ${maxDelayTime.toFixed(6)}s`, 10, 40);
  //context.fillText(
  //  `Elements: ${numElements}, Pitch: ${pitch.toFixed(3)}`,
  //  10,
  //60,
 //);

  // Add coordinate information for target positioning
  //context.fillText(
  //  `Canvas: ${canvasElement.width}×${canvasElement.height} px`,
  //  10,
  //60,
 //);
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
*/
  /*
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
*/
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
      calculateWaveAmplitudeAtTarget(elements, targetX, targetY, currentTime);
      /*context.fillText(
        `Wave Amplitude at Target: ${(amplitude * 100).toFixed(1)}%`,
        10,
        160,
      );*/
    }
  }
  // Add credit along left edge: ultrasound.dwhswenson.net
  context.save();
  context.translate(15, 470);
  context.rotate(-Math.PI / 2);
  context.textAlign = "left";
  context.fillText("ultrasound.dwhswenson.net", 0, 0);
  context.restore();

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
  const visualSpeed = getSpeedOfSound(); // px/sec, from user input
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
  const visualSpeed = getSpeedOfSound(); // px/sec, from user input

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
  pitch: number,
  delays: number | number[],
  canvasElement: HTMLCanvasElement,
): ArrayElement[] {
  const elements: ArrayElement[] = [];

  // Calculate total height needed and center the array vertically
  const totalHeight = (numElements - 1) * pitch;
  const startY = (canvasElement.height - totalHeight) / 2;

  // Position elements horizontally to leave room for trigger lines and waves
  const elementX = canvasElement.width * 0.4;

  for (let i = 0; i < numElements; i++) {
    const elementY = startY + i * pitch;
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
  const frameRate = APP_FRAME_RATE; // Use consistent application frame rate
  const totalFrames = Math.ceil(movieDuration * frameRate);

  // Calculate visual delay time as a fraction of total movie duration
  // Show red pulse phase for first 30% of movie, waves for remaining 70%

  // Create elements with appropriate delays based on target type
  let elements: ArrayElement[];
  let maxDelayTime: number;

  if (
    targetType === "point" &&
    targetX !== undefined &&
    targetY !== undefined
  ) {
    // Point targeting: calculate individual delays
    const totalHeight = (numElements - 1) * pitch;
    const startY = (canvas.height - totalHeight) / 2;
    const elementX = canvas.width * DEFAULT_ELEMENT_X_POSITION;

    const positions = [];
    for (let i = 0; i < numElements; i++) {
      positions.push({ x: elementX, y: startY + i * pitch });
    }

    // Calculate delays directly using visual speed (100 px/sec)
    // This ensures proper convergence in the visual timeline
    const visualSpeed = getSpeedOfSound(); // Speed from user input

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
    // Linear targeting: calculate delay so red pulse starts at far left of wire
    const visualSpeed = getSpeedOfSound(); // Speed from user input
    const lineLength = DEFAULT_LINE_LENGTH;
    const radius = DEFAULT_ELEMENT_RADIUS;
    const linearDelay = (lineLength - radius) / visualSpeed;
    elements = createElementArray(numElements, pitch, linearDelay, canvas);
    maxDelayTime = linearDelay;
  }

  // Generate frames with visual timing
  for (let i = 0; i < totalFrames; i++) {
    const visualCurrentTime = (i / (totalFrames - 1)) * movieDuration;
    const bitmap = await createMultiElementFrameWithElements(
      elements,
      maxDelayTime,
      visualCurrentTime,
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

  // Reset to first frame and render immediately
  currentFrame = 0;
  renderFrame(currentFrame);

  // Use consistent frame rate for playback
  const frameRate = APP_FRAME_RATE;
  playInterval = window.setInterval(() => {
    currentFrame++;
    if (currentFrame >= frames.length) {
      stopMovie();
      return;
    }
    renderFrame(currentFrame);
  }, 1000 / frameRate);
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
  const speed = getSpeedOfSound();
  elements.forEach((element) => {
    element.draw(ctx, time, speed);
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
  speedOfSoundInput = document.getElementById(
    "speedOfSound",
  ) as HTMLInputElement;
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
  angleInput = document.getElementById("angle") as HTMLInputElement;
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
      const totalHeight = (numElements - 1) * pitch;
      const startY = (canvas.height - totalHeight) / 2;
      const elementX = canvas.width * DEFAULT_ELEMENT_X_POSITION;

      const positions = [];
      for (let i = 0; i < numElements; i++) {
        positions.push({ x: elementX, y: startY + i * pitch });
      }

      // Calculate point target delays
      const delays = calculatePointTargetDelays(positions, targetX, targetY);
      elements = createElementArray(numElements, pitch, delays, canvas);

      // Use the maximum delay as reference for timing
      effectiveDelayTime = Math.max(...delays);
    } else {
      // Linear target: calculate delay so red pulse starts at far left of wire
      // travelTime = (lineLength - radius) / visualSpeed
      const visualSpeed = getSpeedOfSound(); // Speed from user input
      const lineLength = DEFAULT_LINE_LENGTH;
      const radius = DEFAULT_ELEMENT_RADIUS;
      const singleDelay = (lineLength - radius) / visualSpeed;
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
      const elementX = canvas.width * DEFAULT_ELEMENT_X_POSITION;
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
    // Create temporary canvas with white background for PNG export
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Fill with white background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the current canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob!);
      const a = document.createElement("a");
      a.href = url;
      a.download = `frame-${currentFrame}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  downloadMovieBtn.addEventListener("click", async () => {
    if (frames.length === 0) {
      alert("No movie to download. Please generate a movie first.");
      return;
    }

    try {
      await downloadMovie();
    } catch (error) {
      console.error("Error downloading movie:", error);
      alert("Failed to download movie. Please try again.");
    }
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

      // Trigger the same logic as the Generate Frame button
      setTimeout(() => {
        generateBtn.click();
      }, 150);
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

  // Add auto-preview functionality - show first frame when parameters change
  const autoPreview = () => {
    // Small delay to ensure DOM updates are complete
    setTimeout(() => {
      generateBtn.click();
    }, 50);
  };

  // Add auto-preview to all parameter inputs
  numElementsInput.addEventListener("input", autoPreview);
  pitchInput.addEventListener("input", autoPreview);
  speedOfSoundInput.addEventListener("input", () => {
    autoPreview();
    updateSpeedDisplay();
  });
  targetXInput.addEventListener("input", autoPreview);
  targetYInput.addEventListener("input", autoPreview);
  angleInput.addEventListener("input", autoPreview);
  movieDurationInput.addEventListener("input", autoPreview);

  // Add auto-preview to radio button changes
  targetRadios.forEach((radio) => {
    radio.addEventListener("change", autoPreview);
  });

  // Show initial frame on page load
  autoPreview();
}

// Initialize when DOM is ready (but not during testing)
if (typeof document !== "undefined" && typeof jest === "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUI);
  } else {
    initializeUI();
    updateSpeedDisplay(); // Initialize speed display
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
  updateSpeedDisplay,
  downloadMovie,
};

/**
 * Downloads the current movie frames as a video file.
 * Safari-compatible implementation with fallback methods.
 */
async function downloadMovie(): Promise<void> {
  // Check if MediaRecorder is supported and working
  const isMediaRecorderSupported = () => {
    try {
      if (
        typeof MediaRecorder === "undefined" ||
        !MediaRecorder.isTypeSupported
      ) {
        return false;
      }

      // Test formats by browser capability
      const userAgent = navigator.userAgent.toLowerCase();
      const isSafari =
        userAgent.includes("safari") && !userAgent.includes("chrome");

      const formats = isSafari
        ? [
            "video/mp4", // Safari's MP4 support actually works!
            "video/mp4;codecs=avc1", // H.264 MP4 for Safari
          ]
        : [
            "video/webm;codecs=vp8", // WebM for Chrome/Firefox
            "video/webm", // Basic WebM fallback
          ];

      return formats.some((format) => MediaRecorder.isTypeSupported(format));
    } catch (e) {
      console.error("MediaRecorder support check failed:", e);
      return false;
    }
  };

  if (isMediaRecorderSupported()) {
    try {
      await downloadMovieWithMediaRecorder();
      return;
    } catch (error) {
      console.warn(
        "MediaRecorder failed, falling back to frame sequence:",
        error,
      );

      // Inform user about fallback with more specific error info
      const userAgent = navigator.userAgent.toLowerCase();
      const isSafari =
        userAgent.includes("safari") && !userAgent.includes("chrome");
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const message = isSafari
        ? "Safari doesn't support video recording. We'll download key frames as PNG images instead."
        : `Video recording failed (${errorMessage}). We'll download key frames as PNG images instead.`;

      console.warn("MediaRecorder failed:", error);
      alert(message);
    }
  }

  // Inform user about fallback method
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari =
    userAgent.includes("safari") && !userAgent.includes("chrome");
  const message = isSafari
    ? "Safari doesn't support video recording. We'll download key frames as PNG images instead."
    : "Video recording not supported. We'll download key frames as PNG images instead.";

  alert(message);

  // Fallback: Download frames as individual images
  await downloadMovieAsFrameSequence();
}

/**
 * Downloads movie using MediaRecorder (Chrome, Firefox)
 * Records in background without affecting visible canvas
 */
async function downloadMovieWithMediaRecorder(): Promise<void> {
  // Auto-generate frames if they don't exist
  if (frames.length === 0) {
    console.log("No frames found, generating movie first...");
    downloadMovieBtn.textContent = "Generating frames...";
    (downloadMovieBtn as HTMLButtonElement).disabled = true;
    const numElements = parseInt(numElementsInput.value, 10);
    const pitch = parseFloat(pitchInput.value);
    const movieDuration = parseFloat(movieDurationInput.value);

    const targetType =
      (
        document.querySelector(
          'input[name="target"]:checked',
        ) as HTMLInputElement
      )?.value || "linear";
    let targetX: number | undefined;
    let targetY: number | undefined;

    if (targetType === "point") {
      targetX = parseFloat(targetXInput.value);
      targetY = parseFloat(targetYInput.value);
    }

    await generateMovie(
      numElements,
      pitch,
      movieDuration,
      targetType,
      targetX,
      targetY,
    );
    const frameRateForLog = APP_FRAME_RATE;
    console.log(
      `Generated ${frames.length} frames for ${movieDuration}s duration at ${frameRateForLog}fps`,
    );
    console.log(
      `Expected frames: ${Math.ceil(movieDuration * frameRateForLog)}, Actual frames: ${frames.length}`,
    );
    downloadMovieBtn.textContent = "Starting video encoding...";
  }

  // Create off-screen canvas for recording
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  const offscreenCtx = offscreenCanvas.getContext("2d")!;

  // Set up canvas stream with consistent frame rate
  const frameRate = APP_FRAME_RATE;
  const stream = offscreenCanvas.captureStream(frameRate);
  console.log(
    "Created canvas stream with",
    frameRate,
    "fps for",
    frames.length,
    "frames",
  );
  console.log("Expected video duration:", frames.length / frameRate, "seconds");

  // Ensure canvas has initial content for Safari
  offscreenCtx.fillStyle = "white";
  offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  // Use appropriate formats per browser
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari =
    userAgent.includes("safari") && !userAgent.includes("chrome");

  const formats = isSafari
    ? [
        { mimeType: "video/mp4", extension: "mp4" }, // Safari MP4 works!
        { mimeType: "video/mp4;codecs=avc1", extension: "mp4" }, // H.264 fallback
      ]
    : [
        { mimeType: "video/webm;codecs=vp8", extension: "webm" }, // Chrome/Firefox WebM
        { mimeType: "video/webm", extension: "webm" }, // WebM fallback
      ];

  let selectedFormat = null;
  for (const format of formats) {
    const supported = MediaRecorder.isTypeSupported(format.mimeType);
    if (supported && !selectedFormat) {
      selectedFormat = format;
    }
  }

  if (!selectedFormat) {
    throw new Error("No supported video format found");
  }

  console.log("Using format:", selectedFormat);

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: selectedFormat.mimeType,
    videoBitsPerSecond: 1000000, // 1 Mbps for compatibility
  });
  const recordedChunks: Blob[] = [];

  console.log("MediaRecorder created, state:", mediaRecorder.state);

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      console.log("Data available, size:", event.data.size);
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      try {
        console.log("Recording stopped, chunks:", recordedChunks.length);
        console.log(
          "Total size:",
          recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        );

        if (recordedChunks.length === 0) {
          reject(new Error("No data recorded"));
          return;
        }

        const blob = new Blob(recordedChunks, {
          type: selectedFormat.mimeType,
        });
        console.log("Final blob size:", blob.size);

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ultrasound-animation.${selectedFormat.extension}`;
        document.body.appendChild(a); // Ensure element is in DOM
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Reset button state
        downloadMovieBtn.textContent = "Download Movie";
        (downloadMovieBtn as HTMLButtonElement).disabled = false;
        resolve();
      } catch (error) {
        // Reset button state on error
        downloadMovieBtn.textContent = "Download Movie";
        (downloadMovieBtn as HTMLButtonElement).disabled = false;
        reject(error);
      }
    };

    mediaRecorder.onerror = (event) => {
      // Reset button state on error
      downloadMovieBtn.textContent = "Download Movie";
      (downloadMovieBtn as HTMLButtonElement).disabled = false;
      reject(new Error(`MediaRecorder error: ${event}`));
    };

    // Give Safari a moment to initialize the stream before recording
    setTimeout(
      () => {
        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms
        console.log("Recording started, state:", mediaRecorder.state);
        console.log("Frame duration:", 1000 / frameRate, "ms per frame");
        downloadMovieBtn.textContent = "Encoding video...";

        // Render frames at exact frame rate to match canvas stream
        let frameIndex = 0;
        const frameDuration = 1000 / frameRate; // Match consistent application frame rate
        const startTime = performance.now();

        const renderNextFrame = () => {
          if (frameIndex < frames.length) {
            // Render frame to off-screen canvas
            offscreenCtx.clearRect(
              0,
              0,
              offscreenCanvas.width,
              offscreenCanvas.height,
            );
            offscreenCtx.fillStyle = "white";
            offscreenCtx.fillRect(
              0,
              0,
              offscreenCanvas.width,
              offscreenCanvas.height,
            );
            offscreenCtx.drawImage(frames[frameIndex], 0, 0);

            // Update progress
            const progress = Math.round((frameIndex / frames.length) * 100);
            downloadMovieBtn.textContent = `Encoding video... ${progress}%`;

            frameIndex++;
            setTimeout(renderNextFrame, frameDuration);
          } else {
            const endTime = performance.now();
            const actualDuration = (endTime - startTime) / 1000;
            console.log(
              "All frames rendered in",
              actualDuration.toFixed(2),
              "seconds, stopping recording after delay...",
            );
            console.log(
              "Expected duration:",
              frames.length / frameRate,
              "seconds",
            );
            downloadMovieBtn.textContent = "Finalizing video...";
            // Stop recording after delay to ensure all frames are captured
            const stopDelay = isSafari ? 1000 : 500;
            setTimeout(() => {
              console.log(
                "Stopping MediaRecorder, state:",
                mediaRecorder.state,
              );
              if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
              }
            }, stopDelay);
          }
        };

        // Start rendering frames
        renderNextFrame();
      },
      isSafari ? 500 : 100,
    ); // Extra delay for Safari
  });
}

/**
 * Downloads movie as a sequence of PNG frames (Safari fallback)
 */
async function downloadMovieAsFrameSequence(): Promise<void> {
  const zip = await createFrameSequenceZip();

  // Download the zip file
  const url = URL.createObjectURL(zip);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ultrasound-animation-frames.zip";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Creates a ZIP file containing all frames as PNG images
 */
async function createFrameSequenceZip(): Promise<Blob> {
  // Simple ZIP implementation for frame sequence

  // For Safari compatibility, download key frames (first, middle, last)
  // This gives users a sample of the animation without requiring video support
  const framesToDownload = [
    0,
    Math.floor(frames.length / 2),
    frames.length - 1,
  ];

  let downloadPromise = Promise.resolve();

  framesToDownload.forEach((frameIndex) => {
    downloadPromise = downloadPromise.then(() => {
      return new Promise<void>((resolve) => {
        // Create temporary canvas with white background for PNG export
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d")!;

        // Fill with white background
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the frame on top
        tempCtx.drawImage(frames[frameIndex], 0, 0);

        setTimeout(() => {
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `ultrasound-frame-${String(frameIndex).padStart(3, "0")}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
            resolve();
          }, "image/png");
        }, 100); // Small delay to ensure render completes
      });
    });
  });

  await downloadPromise;

  // Return empty blob since we're downloading individual files
  return new Blob([], { type: "application/zip" });
}

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

function updateSpeedDisplay(): void {
  // Update the speed display span in the HTML
  const currentSpeed = document.getElementById("currentSpeed");
  if (currentSpeed) {
    currentSpeed.textContent = speedOfSoundInput.value;
  }
}
