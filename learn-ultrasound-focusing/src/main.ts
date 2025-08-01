import { ArrayElement } from "./arrayElement";

// Form element references
const delayTimeInput = document.getElementById("delayTime") as HTMLInputElement;
const currentTimeInput = document.getElementById(
  "currentTime",
) as HTMLInputElement;
// Keep these for future use but don't reference them in the current implementation
const targetRadios = document.getElementsByName(
  "targetType",
) as NodeListOf<HTMLInputElement>;
const linearControls = document.getElementById("linearControls")!;
const pointControls = document.getElementById("pointControls")!;

const generateBtn = document.getElementById("generate")!;
const prevFrameBtn = document.getElementById("prevFrame")!;
const nextFrameBtn = document.getElementById("nextFrame")!;
const downloadFrameBtn = document.getElementById("downloadFrame")!;
const downloadMovieBtn = document.getElementById("downloadMovie")!;

const canvas = document.getElementById("animationCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let frames: ImageBitmap[] = [];
let currentFrame = 0;

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

  // Clear previous frames and generate a single frame
  frames = [];
  const bitmap = await createSingleElementFrame(delayTime, currentTime);
  frames.push(bitmap);
  currentFrame = 0;
  renderFrame(0);
});

/**
 * Creates a frame showing a single ArrayElement at the specified time.
 * This is designed to be extensible to handle arrays of elements later.
 */
async function createSingleElementFrame(
  delayTime: number,
  currentTime: number,
): Promise<ImageBitmap> {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Create a single array element centered in the canvas
  const elementX = canvas.width / 2;
  const elementY = canvas.height / 2;

  // For future extensibility, we create an array with one element
  const elements: ArrayElement[] = [
    new ArrayElement(elementX, elementY, delayTime),
  ];

  // Draw all elements (currently just one)
  drawElementsAtTime(ctx, elements, currentTime);

  // Add some helpful text
  ctx.fillStyle = "black";
  ctx.font = "14px Arial";
  ctx.fillText(`Current Time: ${currentTime.toFixed(6)}s`, 10, 20);
  ctx.fillText(`Delay Time: ${delayTime.toFixed(6)}s`, 10, 40);

  if (currentTime < delayTime) {
    ctx.fillText("Phase: Red pulse approaching", 10, 60);
  } else {
    ctx.fillText("Phase: Wave propagating", 10, 60);
  }

  return await createImageBitmap(canvas);
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
