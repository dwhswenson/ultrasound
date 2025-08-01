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
  // Clear canvas
  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Create multiple array elements with proper spacing
  const elements = createElementArray(
    numElements,
    pitch,
    delayTime,
    canvasElement,
  );

  // Draw all elements
  drawElementsAtTime(context, elements, currentTime);

  // Add some helpful text
  context.fillStyle = "black";
  context.font = "14px Arial";
  context.fillText(`Current Time: ${currentTime.toFixed(6)}s`, 10, 20);
  context.fillText(`Delay Time: ${delayTime.toFixed(6)}s`, 10, 40);
  context.fillText(
    `Elements: ${numElements}, Pitch: ${pitch.toFixed(3)}`,
    10,
    60,
  );

  if (currentTime < delayTime) {
    context.fillText("Phase: Red pulses approaching", 10, 80);
  } else {
    context.fillText("Phase: Waves propagating", 10, 80);
  }

  return await createImageBitmap(canvasElement);
}

/**
 * Creates an array of ArrayElements with proper spacing.
 * Pitch is in millimeters, converted to pixels for screen display.
 */
function createElementArray(
  numElements: number,
  pitchMm: number,
  delayTime: number,
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
    elements.push(new ArrayElement(elementX, elementY, delayTime));
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
): Promise<void> {
  frames = [];

  // Use visual timeline instead of physical timing
  // The movie duration controls the total visual time
  const frameRate = 30; // fps
  const totalFrames = Math.ceil(movieDuration * frameRate);

  // Calculate visual delay time as a fraction of total movie duration
  // Show red pulse phase for first 30% of movie, waves for remaining 70%
  const visualDelayTime = movieDuration * 0.3;

  // Generate frames with visual timing
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
    const delayTime = parseFloat(delayTimeInput.value);
    const currentTime = parseFloat(currentTimeInput.value);
    const numElements = parseInt(numElementsInput.value, 10);
    const pitch = parseFloat(pitchInput.value);

    // Clear previous frames and generate a single frame
    frames = [];
    const bitmap = await createMultiElementFrame(
      delayTime,
      currentTime,
      numElements,
      pitch,
      canvas,
      ctx,
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

    await generateMovie(numElements, pitch, movieDuration);
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
  drawElementsAtTime,
  generateMovie,
};
