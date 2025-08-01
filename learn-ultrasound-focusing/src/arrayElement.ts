// Constants for visual animation timing (not physical)
// These are designed for visual clarity over movie duration, not physical accuracy
const VISUAL_SPEED_PX_PER_SEC = 200; // pixels per second for visual timing

/**
 * Represents a single transducer element in a linear array.
 */
export class ArrayElement {
  x: number; // x-position in pixels (canvas coords)
  y: number; // y-position in pixels (canvas coords)
  delay: number; // firing delay in seconds
  radius: number; // element circle radius in pixels
  lineLength: number; // length of the trigger line in pixels

  constructor(
    x: number,
    y: number,
    delay: number,
    radius: number = 10,
    lineLength: number = 200,
  ) {
    this.x = x;
    this.y = y;
    this.delay = delay;
    this.radius = radius;
    this.lineLength = lineLength;
  }

  /**
   * Draws the element on the given canvas context at global time t.
   * @param ctx Canvas rendering context
   * @param t   Global time in seconds
   */
  draw(ctx: CanvasRenderingContext2D, t: number) {
    // Use visual speed for screen-appropriate timing
    const visualSpeedPx = VISUAL_SPEED_PX_PER_SEC;

    // 1. Draw main element circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();

    // 2. Draw trigger line to the left of the element
    const xStart = this.x - this.lineLength;
    ctx.beginPath();
    ctx.moveTo(xStart, this.y);
    ctx.lineTo(this.x - this.radius, this.y);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Animation phases
    if (t < this.delay) {
      // PHASE 1: Red pulse moving towards element at constant speed
      // All pulses travel at the same speed but start at different times
      const travelDistance = this.lineLength - this.radius;
      const travelTime = travelDistance / visualSpeedPx;
      const startTime = this.delay - travelTime;

      // Only show pulse if it has started and is on the visible wire
      if (t >= startTime) {
        const timeSinceStart = t - startTime;
        const pulseX = xStart + visualSpeedPx * timeSinceStart;

        // Only draw pulse if it's on the visible wire segment
        if (pulseX >= xStart && pulseX <= this.x - this.radius) {
          ctx.beginPath();
          ctx.arc(pulseX, this.y, this.radius / 2, 0, 2 * Math.PI);
          ctx.fillStyle = "red";
          ctx.fill();
        }
      }
    } else {
      // PHASE 2: Half-circle wave propagating to the right
      const timeSinceEmission = t - this.delay;
      const waveRadius = visualSpeedPx * timeSinceEmission;

      if (waveRadius > 0) {
        ctx.beginPath();
        // Draw half-circle (semicircle) to the right of the element
        ctx.arc(this.x, this.y, waveRadius, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
}
