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
    const A = 2 * a * Tb * sinc(Math.PI * Tb * f);

    // Stop when the envelope is essentially zero to save work
    if (A < 1e-3 * 2 * a * Tb) break;

    freq.push(f);
    amp.push(A);
  }

  return { freq, amp };
}

class RadiationSpectrumPlot {
  private u: any;
  private frInput!: HTMLInputElement;
  private TbInput!: HTMLInputElement;
  private container: HTMLElement;

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
        <input id="fr" type="number" value="500" min="1" step="10" />
      </label>
      <label>Pulse duration T<sub>b</sub> (s):
        <input id="Tb" type="number" value="0.001" min="0.00005" step="0.00005" />
      </label>
      <button id="resetZoom">Reset zoom</button>
    `;
    this.container.appendChild(controls);

    this.frInput = controls.querySelector("#fr") as HTMLInputElement;
    this.TbInput = controls.querySelector("#Tb") as HTMLInputElement;

    const plotDiv = document.createElement("div");
    this.container.appendChild(plotDiv);

    // Initialize with empty data first
    this.u = new UPlot(this.defaultOptions(), [[], []], plotDiv);

    // Event handlers
    this.frInput.addEventListener("input", () => this.update());
    this.TbInput.addEventListener("input", () => this.update());
    controls.querySelector("#resetZoom")!.addEventListener("click", () => {
      const xscale = this.u.scales.x;
      this.u.setScale("x", { min: 0, max: xscale.max });
    });

    // Initial render
    this.update();
  }

  private defaultOptions(): any {
    return {
      title: "Radiation-force Spectrum |F(f)|",
      width: 640,
      height: 360,
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

  private update() {
    if (!this.u) return;

    const fr = parseFloat(this.frInput.value);
    const Tb = parseFloat(this.TbInput.value);

    const { freq, amp } = radiationSpectrum(fr, Tb, 1000);

    // Ensure we have data before setting
    if (freq.length > 0 && amp.length > 0) {
      this.u.setData([freq, amp]);

      // Auto-adjust X scale to fit data
      const maxF = freq[freq.length - 1] || 1;
      this.u.setScale("x", { min: 0, max: maxF * 1.05 });
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
