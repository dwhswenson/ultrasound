import { radiationSpectrum } from "./RadiationSpectrum";

describe("radiationSpectrum", () => {
  test("returns arrays of expected length and frequencies", () => {
    const fr = 100; // Hz
    const Tb = 0.001; // s
    const N = 7;
    const { freq, amp } = radiationSpectrum(fr, Tb, N);

    expect(freq).toHaveLength(N);
    expect(amp).toHaveLength(N);

    // frequencies should be n * fr for n = 1..N
    for (let n = 1; n <= N; n++) {
      expect(freq[n - 1]).toBeCloseTo(n * fr, 12);
    }

    // amplitudes should be non-negative due to abs()
    expect(amp.every((a) => a >= 0)).toBe(true);
  });

  test("matches the analytic formula a * Tb * fr * sinc(pi * Tb * f)", () => {
    const fr = 200; // Hz
    const Tb = 0.002; // s
    const a = 2;
    const N = 5;

    const { freq, amp } = radiationSpectrum(fr, Tb, N, a);

    const sinc = (x: number) => (x === 0 ? 1 : Math.sin(x) / x);

    for (let i = 0; i < N; i++) {
      const f = freq[i];
      const expected = Math.abs(a * Tb * fr * sinc(Math.PI * Tb * f));
      expect(amp[i]).toBeCloseTo(expected, 12);
    }
  });

  test("zeros occur at harmonic indices where n*fr = k/Tb (sinc zeros), excluding f=0", () => {
    // With fr=100 Hz and Tb=0.004 s, zeros are at 250, 500, 750, ... Hz
    // Harmonics are at 100, 200, 300, ..., so n=5,10,15,... should be ≈0.
    const fr = 100;
    const Tb = 0.004;
    const N = 20;

    const { amp } = radiationSpectrum(fr, Tb, N);

    // n multiples of 5 should be ~0
    for (let n = 5; n <= N; n += 5) {
      const idx = n - 1; // zero-based
      expect(amp[idx]).toBeCloseTo(0, 12);
    }

    // check nearby non-multiple
    expect(Math.abs(amp[6 - 1])).toBeGreaterThan(1e-8);
  });

  test("scales linearly with amplitude parameter a", () => {
    const fr = 150;
    const Tb = 0.0015;
    const N = 8;

    const { amp: amp1 } = radiationSpectrum(fr, Tb, N, 1);
    const { amp: amp3 } = radiationSpectrum(fr, Tb, N, 3);

    for (let i = 0; i < N; i++) {
      if (Math.abs(amp1[i]) < 1e-14 && Math.abs(amp3[i]) < 1e-14) continue;
      expect(amp3[i] / amp1[i]).toBeCloseTo(3, 12);
    }
  });

  test("Tb = 0 yields zero amplitude at all harmonics", () => {
    const fr = 120;
    const Tb = 0;
    const N = 10;

    const { amp } = radiationSpectrum(fr, Tb, N);
    for (const A of amp) {
      expect(A).toBe(0);
    }
  });
});
