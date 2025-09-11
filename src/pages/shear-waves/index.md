---
layout: ../../layouts/Layout.astro
title: "Shear Waves"
description: "Understanding shear wave generation and propagation in ultrasound applications"
---

<style>
/* Shear Waves Page Specific Styles */

.image-text-section {
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    margin: 2rem 0;
    flex-wrap: wrap;
}

.text-content {
    flex: 1;
    min-width: 300px;
    order: 2;
}

.image-content {
    flex: 0 0 auto;
    max-width: 400px;
    order: 1;
}

.image-content img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}

/* Desktop layout - image on the right */
@media (min-width: 769px) {
    .text-content {
        order: 1;
    }

    .image-content {
        order: 2;
    }
}

/* Mobile layout - image before text (natural order) */
@media (max-width: 768px) {
    .image-text-section {
        flex-direction: column;
    }

    .image-content {
        max-width: 100%;
        order: 1;
    }

    .text-content {
        order: 2;
    }
}

/* Additional spacing for better readability */
.image-text-section h3 {
    margin-top: 0;
    color: #1e293b;
    font-size: 1.25rem;
    font-weight: 600;
}

.image-text-section p {
    margin-bottom: 1rem;
    line-height: 1.7;
}
</style>

# 🌊 Ultrasonic Observation of Shear Waves

Shear waves play a crucial role in ultrasound elastography and tissue
characterization. Unlike compressional waves, shear waves propagate much slower
and are highly sensitive to tissue mechanical properties.

## Introduction

Shear waves are transverse mechanical waves that propagate perpendicular to the
direction of particle motion. In biological tissues, shear wave velocity is
directly related to tissue stiffness, making them invaluable for medical
diagnostics.

### Key Properties

- **Velocity**: Typically 1-10 m/s in soft tissues (much slower than compressional waves at ~1540 m/s)
- **Frequency**: Usually 50-1000 Hz for elastography applications
- **Attenuation**: Higher than compressional waves, limiting penetration depth

## Generating Shear Waves

### Mechanical Vibration

<div class="image-text-section">
<div class="image-content">

![Mechanical Vibration Shear Waves](/shear-waves/mech_shaker_schematic.svg)

</div>
<div class="text-content">

One way to generate shear waves is through mechanical vibration: you can
literally shake the tissue to make the shear waves. This is actually done as
part of the proof-of-concept in a number of papers on shear wave elastography.
However, it clearly isn't practical for clinical use: you're not going to cut
open a patient and shake their liver to measure its stiffness!

Despite its clinical limitations, mechanical vibration offers some distinct advantages for research applications. External shakers can provide precise control over both frequency and amplitude, allowing researchers to study tissue properties across well-defined parameter ranges. This makes mechanical excitation particularly valuable for validating elastography algorithms, characterizing tissue phantoms, and conducting fundamental studies of tissue biomechanics where controlled experimental conditions are essential.

</div>
</div>

### Acoustic Radiation Force

<div class="image-text-section">
<div class="image-content">

![Acoustic Radiation Force](/shear-waves/arf_schematic.svg)

</div>
<div class="text-content">

A more practical method for clinical use is to use the acoustic radiation force
to cause shear waves. The basic idea is to use a focused ultrasound beam to
cause local vibrations at a point in the tissue. This creates shear waves that
propagate away from the focal point, and can be observed.

In general, ultrasound shear wave elastography uses time-of-flight methods,
which assume a constant shear wave speed, to measure the shear wave velocity.
The shear wave speed is then related to tissue stiffness or viscoelastic
properties.

The acoustic radiation force approach offers several advantages over mechanical vibration:
- **Non-invasive**: No physical contact with the patient beyond normal ultrasound probe placement
- **Localized excitation**: Shear waves can be generated at specific depths and locations
- **Real-time capability**: Integration with conventional ultrasound imaging systems
- **Quantitative measurements**: Precise control over excitation parameters

</div>
</div>


## Related Topics


This site has a couple additional pages about aspects of how ultrasound can
create shear waves:

* [Ultrasound Focusing](/ultrasound-focusing/): This page contains an interactive tool to show how
  ultrasound can be focused to a specific point in the tissue.
* [Harmonic Generation](/pulse-harmonics/): This page explains how the square-wave pulse
  sequence used in, for example, shear wave dispersion ultrasound vibrometry
  (SDUV) can create harmonics of a fundamental frequency, allowing a single ARF
  excitation to be used to sample shear wave speed at multiple frequencies.
