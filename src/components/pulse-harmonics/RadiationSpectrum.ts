import type uPlot from "uplot";

// Dynamically import uPlot to avoid SSR issues
let uPlotLib: typeof uPlot | null = null;

async function loadUPlot() {
  if (!uPlotLib && typeof window !== "undefined") {
    const uPlotModule = await import("uplot");
    uPlotLib = uPlotModule.default;

    // Load CSS dynamically
    if (!document.querySelector('link[href*="uPlot"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/uplot@1.6.32/dist/uPlot.min.css";
      document.head.appendChild(link);
    }
  }
  return uPlotLib;
}

/**
 * Compute the spectrum described by Eq. 18.
 * @param fr  Base (repetition) frequency in Hz.
 * @param Tb  Pulse duration in seconds.
 * @param N   Max harmonic index to evaluate.
 * @param a   Amplitude prefactor (2a in paper). 1 by default.
 */
export interface SpectrumData {
  freq: number[];
  amp: number[];
}

function sinc(x: number): number {
  return x === 0 ? 1 : Math.sin(x) / x;
}

export function radiationSpectrum(
  fr: number,
  Tb: number,
  N = 500,
  a = 1,
): SpectrumData {
  const freq: number[] = [];
  const amp: number[] = [];

  for (let n = 1; n <= N; n++) {
    const f = n * fr;
    const A = a * Tb * fr * sinc(Math.PI * Tb * f);

    freq.push(f);
    amp.push(Math.abs(A));
  }

  return { freq, amp };
}

/**
 * Interactive plot for radiation spectrum visualization with responsive design.
 * The plot automatically adjusts its dimensions based on the container size:
 * - Min width: 320px, Max width: 800px
 * - Min height: 240px, Max height: 480px
 * - Maintains 3:5 aspect ratio (height = width * 0.6) when possible
 * - Uses ResizeObserver for efficient responsive updates
 */
class RadiationSpectrumPlot {
  private u: any;
  private frInput!: HTMLInputElement;
  private TbInput!: HTMLInputElement;
  private maxFreqInput!: HTMLInputElement;
  private container: HTMLElement;
  private resizeObserver?: ResizeObserver;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init() {
    const UPlot = await loadUPlot();
    if (!UPlot) {
      console.error("Failed to load uPlot");
      return;
    }

    // Build UI controls
    const controls = document.createElement("div");
    controls.className = "controls flex gap-2 mb-2";
    controls.innerHTML = `
      <label>Base freq (Hz):
        <input id="fr" type="number" value="200" min="1" step="10" />
      </label>
      <label>Pulse duration T<sub>b</sub> (s):
        <input id="Tb" type="number" value="0.0001" min="0.00005" step="0.00005" />
      </label>
      <label>Max freq (Hz):
        <input id="maxFreq" type="range" value="2500" min="1000" max="100000" step="100" />
        <span id="maxFreqValue">2500</span>
      </label>
      <button id="resetZoom">Reset zoom</button>
    `;
    this.container.appendChild(controls);

    this.frInput = controls.querySelector("#fr") as HTMLInputElement;
    this.TbInput = controls.querySelector("#Tb") as HTMLInputElement;
    this.maxFreqInput = controls.querySelector("#maxFreq") as HTMLInputElement;

    const plotDiv = document.createElement("div");
    this.container.appendChild(plotDiv);

    // Initialize with empty data first
    this.u = new UPlot(this.defaultOptions(), [[], []], plotDiv);

    // Set up responsive behavior
    this.setupResponsiveBehavior();

    // Event handlers
    this.frInput.addEventListener("input", () => this.update());
    this.TbInput.addEventListener("input", () => this.update());
    this.maxFreqInput.addEventListener("input", () => {
      const maxFreqValue = controls.querySelector(
        "#maxFreqValue",
      ) as HTMLSpanElement;
      maxFreqValue.textContent = this.maxFreqInput.value;
      this.update();
    });
    controls.querySelector("#resetZoom")!.addEventListener("click", () => {
      const xscale = this.u.scales.x;
      this.u.setScale("x", { min: 0, max: xscale.max });
    });

    // Initial render
    this.update();
  }

  private defaultOptions(): any {
    // Calculate responsive dimensions based on container size
    const containerWidth = this.container.getBoundingClientRect().width;
    const plotWidth = Math.max(320, Math.min(containerWidth - 40, 800)); // Min 320px, max 800px, with 40px padding
    const plotHeight = Math.max(240, Math.min(plotWidth * 0.6, 480)); // Maintain aspect ratio, max 480px

    return {
      title: "Radiation-force Spectrum |F(f)|",
      width: plotWidth,
      height: plotHeight,
      scales: {
        x: {
          time: false,
        },
        y: {
          auto: true,
        },
      },
      axes: [
        {
          label: "Frequency (Hz)",
        },
        {
          label: "Amplitude (linear)",
        },
      ],
      cursor: {
        drag: {
          x: true,
          y: true,
        },
      },
      series: [
        {}, // x values
        {
          label: "|F(f)|",
          stroke: "#2563eb",
          width: 2,
          points: {
            show: true,
            size: 4,
            fill: "#2563eb",
            stroke: "#1d4ed8",
            width: 1,
          },
          paths: this.stemPaths,
        },
      ],
    };
  }

  /** Custom path renderer to draw stem (lollipop) plot with visible spikes. */
  private stemPaths = (
    u: any,
    seriesIdx: number,
    idx0: number,
    idx1: number,
  ) => {
    const { valToPosX, valToPosY } = u;

    return (u: any, _seriesIdx: number) => {
      const path = new Path2D();

      // Draw vertical lines (stems) for each frequency component
      for (let i = idx0; i <= idx1; i++) {
        const x = valToPosX(u.data[0][i] as number, "x", true);
        const y0 = valToPosY(0, seriesIdx, true);
        const y1 = valToPosY(u.data[1][i] as number, seriesIdx, true);

        // Draw the vertical line (spike)
        path.moveTo(x, y0);
        path.lineTo(x, y1);

        // Add a small cap at the top for visibility
        path.moveTo(x - 1, y1);
        path.lineTo(x + 1, y1);
      }

      return path;
    };
  };

  /**
   * Sets up responsive behavior using ResizeObserver (preferred) or window resize events (fallback).
   * This ensures the plot adapts to container size changes on mobile devices and window resizing.
   */
  private setupResponsiveBehavior() {
    // Set up ResizeObserver to handle container size changes
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Also listen for window resize as a fallback
    window.addEventListener("resize", () => this.handleResize());
  }

  /**
   * Handles container resize events by recalculating and applying new plot dimensions.
   * Includes throttling to avoid excessive redraws on small size changes.
   */
  private handleResize() {
    if (!this.u) return;

    const containerWidth = this.container.getBoundingClientRect().width;
    const newWidth = Math.max(320, Math.min(containerWidth - 40, 800));
    const newHeight = Math.max(240, Math.min(newWidth * 0.6, 480));

    // Only resize if dimensions changed significantly (avoid unnecessary redraws)
    const currentWidth = this.u.over.getBoundingClientRect().width;
    if (Math.abs(currentWidth - newWidth) > 10) {
      this.u.setSize({ width: newWidth, height: newHeight });
    }
  }

  private update() {
    if (!this.u) return;

    const fr = parseFloat(this.frInput.value);
    const Tb = parseFloat(this.TbInput.value);
    const maxFreq = parseFloat(this.maxFreqInput.value);

    const { freq, amp } = radiationSpectrum(fr, Tb, 1000);

    // Filter data to only show frequencies up to maxFreq
    const filteredFreq: number[] = [];
    const filteredAmp: number[] = [];

    for (let i = 0; i < freq.length; i++) {
      if (freq[i] <= maxFreq) {
        filteredFreq.push(freq[i]);
        filteredAmp.push(amp[i]);
      } else {
        break;
      }
    }

    // Ensure we have data before setting
    if (filteredFreq.length > 0 && filteredAmp.length > 0) {
      this.u.setData([filteredFreq, filteredAmp]);

      // Set X scale to match the max frequency slider
      this.u.setScale("x", { min: 0, max: maxFreq * 1.05 });
    }
  }

  /**
   * Cleans up resources including ResizeObserver and uPlot instance.
   * Should be called when the component is no longer needed to prevent memory leaks.
   */
  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.u) {
      this.u.destroy();
    }
  }
}

/**
 * Mount the widget inside the first element that matches `selector`.
 * Example usage:
 *   mountRadiationSpectrum("#spectrum");
 */
export async function mountRadiationSpectrum(selector: string) {
  if (typeof window === "undefined") {
    console.warn("mountRadiationSpectrum called in non-browser environment");
    return;
  }

  const el = document.querySelector(selector);
  if (!el) throw new Error(`Container '${selector}' not found`);
  new RadiationSpectrumPlot(el as HTMLElement);
}
