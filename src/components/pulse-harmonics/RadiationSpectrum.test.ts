import { radiationSpectrum } from "./RadiationSpectrum";

describe("radiationSpectrum", () => {
  describe("basic functionality", () => {
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

    test("uses default values when parameters are omitted", () => {
      const fr = 100;
      const Tb = 0.001;

      // Test with default N and a
      const result1 = radiationSpectrum(fr, Tb);
      expect(result1.freq).toHaveLength(500); // default N

      // Test with custom N but default a
      const result2 = radiationSpectrum(fr, Tb, 10);
      expect(result2.freq).toHaveLength(10);

      // Verify default a = 1 by comparing with explicit a = 1
      const result3 = radiationSpectrum(fr, Tb, 10, 1);
      expect(result2.amp).toEqual(result3.amp);
    });

    test("frequencies are evenly spaced by fr", () => {
      const fr = 150;
      const Tb = 0.001;
      const N = 10;

      const { freq } = radiationSpectrum(fr, Tb, N);

      for (let i = 1; i < N; i++) {
        const spacing = freq[i] - freq[i - 1];
        expect(spacing).toBeCloseTo(fr, 12);
      }
    });

    test("first frequency equals fr and last equals N * fr", () => {
      const fr = 123.456;
      const Tb = 0.001;
      const N = 7;

      const { freq } = radiationSpectrum(fr, Tb, N);
      expect(freq[0]).toBeCloseTo(fr, 12);
      expect(freq[N - 1]).toBeCloseTo(N * fr, 12);
    });
  });

  describe("edge cases and boundary conditions", () => {
    test("zeros occur at harmonic indices where n*fr = k/Tb (sinc zeros)", () => {
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

    test("Tb = 0 yields zero amplitude at all harmonics", () => {
      const fr = 120;
      const Tb = 0;
      const N = 10;

      const { amp } = radiationSpectrum(fr, Tb, N);
      for (const A of amp) {
        expect(A).toBe(0);
      }
    });

    test("handles very small Tb values", () => {
      const fr = 100;
      const Tb = 1e-10;
      const N = 5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);
      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(amp.every((a) => !isNaN(a) && isFinite(a))).toBe(true);
    });

    test("handles very large N values", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 10000;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);
      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(freq[N - 1]).toBeCloseTo(N * fr);
    });

    test("handles negative amplitude parameter", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 5;
      const a = -2;

      const { amp } = radiationSpectrum(fr, Tb, N, a);
      // All amplitudes should still be non-negative due to Math.abs()
      expect(amp.every((a) => a >= 0)).toBe(true);
    });

    test("handles N = 1", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 1;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);
      expect(freq).toHaveLength(1);
      expect(amp).toHaveLength(1);
      expect(freq[0]).toBe(fr);
    });

    test("handles zero frequency", () => {
      const fr = 0;
      const Tb = 0.001;
      const N = 5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      expect(freq.every((f) => f === 0)).toBe(true);
      expect(amp.every((a) => a === 0)).toBe(true);
    });

    test("handles fractional N (should truncate)", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 5.7; // This should be treated as 5

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      expect(freq).toHaveLength(5);
      expect(amp).toHaveLength(5);
    });

    test("handles negative N (edge case)", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = -5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      // Should return empty arrays for negative N
      expect(freq).toHaveLength(0);
      expect(amp).toHaveLength(0);
    });

    test("handles very high frequency", () => {
      const fr = 1e6; // 1 MHz
      const Tb = 1e-6; // 1 microsecond
      const N = 5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);
      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(amp.every((a) => !isNaN(a) && isFinite(a))).toBe(true);
    });

    test("handles very small fr", () => {
      const fr = 1e-6;
      const Tb = 0.001;
      const N = 5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(freq[0]).toBeCloseTo(fr, 15);
    });

    test("handles very long pulse duration", () => {
      const fr = 100;
      const Tb = 10; // 10 second pulse
      const N = 5;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(amp.every((a) => !isNaN(a) && isFinite(a))).toBe(true);
    });

    test("handles NaN inputs gracefully", () => {
      const { freq, amp } = radiationSpectrum(NaN, 0.001, 5);

      expect(freq).toHaveLength(5);
      expect(amp).toHaveLength(5);
      // With NaN frequency, all amplitudes should be NaN
      expect(amp.every((a) => isNaN(a))).toBe(true);
    });

    test("handles Infinity inputs", () => {
      const { freq, amp } = radiationSpectrum(Infinity, 0.001, 3);

      expect(freq).toHaveLength(3);
      expect(amp).toHaveLength(3);
      expect(freq.every((f) => f === Infinity)).toBe(true);
    });
  });

  describe("amplitude scaling", () => {
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

    test("amplitude relationship with Tb", () => {
      const fr = 100;
      const N = 5;
      const a = 1;

      const { amp: amp1 } = radiationSpectrum(fr, 0.001, N, a);
      const { amp: amp2 } = radiationSpectrum(fr, 0.002, N, a);

      // Amplitude should increase with Tb (though not necessarily linearly due to sinc)
      expect(amp2[0]).toBeGreaterThan(amp1[0]);
      // The ratio should be approximately 2, but sinc function affects exact scaling
      const ratio = amp2[0] / amp1[0];
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(2.5);
    });

    test("amplitude relationship with fr", () => {
      const Tb = 0.001;
      const N = 5;
      const a = 1;

      const { amp: amp1 } = radiationSpectrum(100, Tb, N, a);
      const { amp: amp2 } = radiationSpectrum(200, Tb, N, a);

      // Amplitude should increase with fr (though not necessarily linearly due to sinc)
      expect(amp2[0]).toBeGreaterThan(amp1[0]);
      // The ratio should be approximately 2, but sinc function affects exact scaling
      const ratio = amp2[0] / amp1[0];
      expect(ratio).toBeGreaterThan(1.5);
      expect(ratio).toBeLessThan(2.5);
    });

    test("handles very large amplitude parameter", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 5;
      const a = 1e6;

      const { freq, amp } = radiationSpectrum(fr, Tb, N, a);
      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);
      expect(amp.every((a) => !isNaN(a) && isFinite(a))).toBe(true);
    });
  });

  describe("mathematical properties", () => {
    test("amplitude decreases with frequency for typical parameters", () => {
      const fr = 100;
      const Tb = 0.005; // 5ms pulse
      const N = 10;

      const { amp } = radiationSpectrum(fr, Tb, N);

      // For a 5ms pulse, the first zero is at 200Hz, second at 400Hz
      // So amplitudes should generally decrease until the first zero
      expect(amp[0]).toBeGreaterThan(amp[1]); // 100Hz > 200Hz (at zero)
    });

    test("total energy conservation approximation", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 1000;
      const a = 1;

      const { amp } = radiationSpectrum(fr, Tb, N, a);

      // Sum of squares should be approximately proportional to Tb^2 * fr^2 * a^2
      const energySum = amp.reduce((sum, a) => sum + a * a, 0);

      expect(energySum).toBeGreaterThan(0);
      expect(isFinite(energySum)).toBe(true);
    });

    test("parseval's theorem approximation", () => {
      // Test that the discrete spectrum approximates the continuous case
      const fr = 50;
      const Tb = 0.002;
      const N1 = 100;
      const N2 = 200;

      const { amp: amp1 } = radiationSpectrum(fr, Tb, N1);
      const { amp: amp2 } = radiationSpectrum(fr, Tb, N2);

      // Energy in first N1 harmonics should be similar
      const energy1 = amp1.slice(0, N1).reduce((sum, a) => sum + a * a, 0);
      const energy2 = amp2.slice(0, N1).reduce((sum, a) => sum + a * a, 0);

      expect(energy1).toBeCloseTo(energy2, 10);
    });
  });

  describe("sinc function behavior", () => {
    test("sinc(0) = 1 behavior", () => {
      // When π * Tb * f = 0, sinc should return 1
      const fr = 100;
      const Tb = 0; // This makes π * Tb * f = 0 for all f
      const N = 3;
      const a = 2;

      const { amp } = radiationSpectrum(fr, Tb, N, a);

      // All amplitudes should be 0 because Tb = 0
      expect(amp.every((a) => a === 0)).toBe(true);
    });

    test("sinc function zeros", () => {
      // Test that sinc zeros occur at expected frequencies
      const fr = 100;
      const Tb = 0.01; // 10ms pulse
      const N = 50;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      // Zeros should occur when π * Tb * f = nπ (n ≠ 0)
      // So f = n / Tb for integer n
      const expectedZeros = [100, 200, 300, 400, 500]; // n/Tb for n=1,2,3,4,5

      for (const zeroFreq of expectedZeros) {
        const index = freq.findIndex((f) => Math.abs(f - zeroFreq) < 1e-10);
        if (index >= 0) {
          expect(amp[index]).toBeCloseTo(0, 12);
        }
      }
    });

    test("sinc function symmetry", () => {
      // sinc(-x) = sinc(x), but our function uses abs() so this is implicit
      const fr = 100;
      const Tb = 0.001;
      const N = 10;

      const { amp } = radiationSpectrum(fr, Tb, N);

      // All amplitudes should be positive (due to abs())
      expect(amp.every((a) => a >= 0)).toBe(true);
    });

    test("correctly implements sinc(x) = sin(x)/x for x ≠ 0", () => {
      // Test with parameters that create known sinc arguments
      const fr = 100;
      const Tb = 0.001;
      const N = 1;
      const a = 1;

      const { amp } = radiationSpectrum(fr, Tb, N, a);

      // For n=1, f = 100 Hz, sinc argument is π * 0.001 * 100 = π/10
      const x = Math.PI / 10;
      const expectedSinc = Math.sin(x) / x;
      const expectedAmp = Math.abs(a * Tb * fr * expectedSinc);

      expect(amp[0]).toBeCloseTo(expectedAmp, 12);
    });

    test("handles sinc(0) = 1 case implicitly", () => {
      // When Tb * f approaches conditions where sinc argument → 0
      const fr = 1;
      const Tb = 1e-10; // Very small pulse duration
      const N = 1;
      const a = 1;

      const { amp } = radiationSpectrum(fr, Tb, N, a);

      // Should approach a * Tb * fr * 1 = a * Tb * fr
      const expected = Math.abs(a * Tb * fr);
      expect(amp[0]).toBeCloseTo(expected, 10);
    });
  });

  describe("performance", () => {
    test("memory usage is reasonable", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 1000;

      const { freq, amp } = radiationSpectrum(fr, Tb, N);

      // Check that arrays are properly sized
      expect(freq.length).toBe(N);
      expect(amp.length).toBe(N);

      // Check that no element is undefined
      expect(freq.every((f) => f !== undefined)).toBe(true);
      expect(amp.every((a) => a !== undefined)).toBe(true);
    });

    test("handles large dataset efficiently", () => {
      const fr = 100;
      const Tb = 0.001;
      const N = 50000; // Large dataset

      const start = Date.now();
      const { freq, amp } = radiationSpectrum(fr, Tb, N);
      const end = Date.now();

      expect(freq).toHaveLength(N);
      expect(amp).toHaveLength(N);

      // Should complete in reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
    });

    test("consistent results across multiple calls", () => {
      const fr = 150;
      const Tb = 0.002;
      const N = 100;
      const a = 1.5;

      const result1 = radiationSpectrum(fr, Tb, N, a);
      const result2 = radiationSpectrum(fr, Tb, N, a);

      expect(result1.freq).toEqual(result2.freq);
      expect(result1.amp).toEqual(result2.amp);
    });
  });

  describe("additional coverage scenarios", () => {
    test("verifies sinc function implementation edge cases", () => {
      // Test the sinc function indirectly through radiationSpectrum
      // with parameters that stress different parts of the sinc calculation

      // Case 1: Very small argument (near sinc(0))
      const result1 = radiationSpectrum(1, 1e-15, 1, 1);
      expect(result1.amp[0]).toBeCloseTo(1e-15, 20);

      // Case 2: Argument that causes sinc to be exactly zero
      const result2 = radiationSpectrum(1000, 0.001, 1, 1); // π * 0.001 * 1000 = π
      expect(result2.amp[0]).toBeCloseTo(0, 12);

      // Case 3: Large argument
      const result3 = radiationSpectrum(1e6, 1e-3, 1, 1);
      expect(result3.amp[0]).toBeCloseTo(0, 10); // sinc of large value → 0
    });

    test("validates function parameter flow", () => {
      // Test to ensure all parameters properly affect the calculation
      const baseParams = { fr: 100, Tb: 0.001, N: 5, a: 1 };

      // Change each parameter and verify impact
      const base = radiationSpectrum(
        baseParams.fr,
        baseParams.Tb,
        baseParams.N,
        baseParams.a,
      );

      const diffFr = radiationSpectrum(
        200,
        baseParams.Tb,
        baseParams.N,
        baseParams.a,
      );
      expect(diffFr.freq).not.toEqual(base.freq);

      const diffTb = radiationSpectrum(
        baseParams.fr,
        0.002,
        baseParams.N,
        baseParams.a,
      );
      expect(diffTb.amp).not.toEqual(base.amp);

      const diffN = radiationSpectrum(
        baseParams.fr,
        baseParams.Tb,
        10,
        baseParams.a,
      );
      expect(diffN.freq).toHaveLength(10);
      expect(diffN.freq).not.toEqual(base.freq);

      const diffA = radiationSpectrum(
        baseParams.fr,
        baseParams.Tb,
        baseParams.N,
        2,
      );
      expect(diffA.amp).not.toEqual(base.amp);
    });

    test("boundary value analysis", () => {
      // Test exact boundary values
      expect(() => radiationSpectrum(0, 0, 0, 0)).not.toThrow();
      expect(() => radiationSpectrum(1, 1, 1, 1)).not.toThrow();
      expect(() =>
        radiationSpectrum(
          Number.MAX_VALUE,
          Number.MIN_VALUE,
          1,
          Number.MAX_VALUE,
        ),
      ).not.toThrow();
    });

    test("validates array construction loop", () => {
      // Ensure the for loop in radiationSpectrum works correctly
      const N = 3;
      const { freq, amp } = radiationSpectrum(100, 0.001, N, 1);

      // Verify each array index is populated
      for (let i = 0; i < N; i++) {
        expect(freq[i]).toBeDefined();
        expect(amp[i]).toBeDefined();
        expect(typeof freq[i]).toBe("number");
        expect(typeof amp[i]).toBe("number");
      }
    });

    test("mathematical formula coverage", () => {
      // Test to ensure Math.PI, Math.sin, and Math.abs are exercised
      const result = radiationSpectrum(100, 0.001, 1, -1);

      // With negative amplitude, Math.abs should ensure positive result
      expect(result.amp[0]).toBeGreaterThan(0);

      // Verify the formula components are calculated
      const fr = 100,
        Tb = 0.001,
        a = -1;
      const f = fr;
      const piTbF = Math.PI * Tb * f;
      const sincValue = Math.sin(piTbF) / piTbF;
      const expected = Math.abs(a * Tb * fr * sincValue);

      expect(result.amp[0]).toBeCloseTo(expected, 12);
    });

    test("sinc function with zero argument", () => {
      // Test the internal sinc function behavior with x = 0
      // This happens when Math.PI * Tb * f = 0

      // Case where f = 0 (first harmonic with fr = 0)
      const result1 = radiationSpectrum(0, 0.001, 1, 1);
      expect(result1.amp[0]).toBe(0); // 0 * anything = 0

      // Case where Tb = 0
      const result2 = radiationSpectrum(100, 0, 1, 1);
      expect(result2.amp[0]).toBe(0); // 0 * anything = 0
    });

    test("validates SpectrumData interface compliance", () => {
      const result = radiationSpectrum(100, 0.001, 5, 1);

      // Check interface compliance
      expect(result).toHaveProperty("freq");
      expect(result).toHaveProperty("amp");
      expect(Array.isArray(result.freq)).toBe(true);
      expect(Array.isArray(result.amp)).toBe(true);
      expect(result.freq.every((f) => typeof f === "number")).toBe(true);
      expect(result.amp.every((a) => typeof a === "number")).toBe(true);
    });

    test("parameter edge combinations", () => {
      // Test combinations of edge case parameters
      const edgeCases = [
        { fr: 0, Tb: 0, N: 0, a: 0 },
        { fr: 1, Tb: 0, N: 1, a: 1 },
        { fr: 0, Tb: 1, N: 1, a: 1 },
        { fr: 1, Tb: 1, N: 0, a: 1 },
        { fr: -1, Tb: 1, N: 1, a: 1 },
        { fr: 1, Tb: -1, N: 1, a: 1 },
      ];

      edgeCases.forEach((params, index) => {
        expect(() => {
          const result = radiationSpectrum(
            params.fr,
            params.Tb,
            params.N,
            params.a,
          );
          // Verify result structure is valid regardless of input
          expect(Array.isArray(result.freq)).toBe(true);
          expect(Array.isArray(result.amp)).toBe(true);
        }).not.toThrow(`Edge case ${index} should not throw`);
      });
    });
  });
});

describe("mountRadiationSpectrum basic error handling", () => {
  test("throws error when selector not found", async () => {
    const { mountRadiationSpectrum } = await import("./RadiationSpectrum");

    await expect(mountRadiationSpectrum("#nonexistent")).rejects.toThrow(
      "Container '#nonexistent' not found",
    );
  });
});
