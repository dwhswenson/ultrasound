[![codecov](https://codecov.io/gh/dwhswenson/ultrasound/graph/badge.svg?token=QW8LDV1FD4)](https://codecov.io/gh/dwhswenson/ultrasound)

# Ultrasound Visualization

Interactive educational visualizations for ultrasound physics, focusing on shear wave elastography and ultrasound array focusing. This site provides hands-on learning tools for understanding how ultrasound can generate and observe shear waves in biological tissues.

## 🌟 Features

### 🌊 Shear Wave Generation
Learn about the two primary methods for generating shear waves:
- **Mechanical Vibration**: Direct tissue shaking for proof-of-concept studies
- **Acoustic Radiation Force**: Clinical-grade non-invasive shear wave generation using focused ultrasound

### 🎯 Ultrasound Array Focusing
Interactive visualization showing how ultrasound transducer arrays focus acoustic energy through precise timing control:
- Real-time parameter adjustment (number of elements, pitch, speed of sound)
- Click-to-set targeting with visual wave propagation
- Animation controls with frame-by-frame navigation
- Downloadable frames for educational use

### 📊 Pulse Harmonics Spectrum
Explore how pulsed ultrasound generates radiation force spectra:
- Interactive frequency and pulse duration controls
- Real-time spectrum visualization
- Understanding harmonic generation in SDUV (Shear wave Dispersion Ultrasound Vibrometry)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v22 or higher)
- npm package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/dwhswenson/ultrasound.git
   cd ultrasound
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:4321` to view the site locally.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the site for production
- `npm run preview` - Preview the production build locally
- `npm run test` - Run the test suite
- `npm run test:coverage` - Run tests with coverage reporting

## 🏗️ Technology Stack

- **[Astro](https://astro.build/)** - Static site generator with component islands
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** - Real-time 2D graphics and animations
- **[UPlot](https://github.com/leeoniya/uPlot)** - High-performance charting library
- **[Vitest](https://vitest.dev/)** - Testing framework with native TypeScript support

## 📁 Project Structure

```
src/
├── pages/                          # Main site pages
│   ├── index.astro                 # Homepage with feature overview
│   ├── about.md                    # About page and licensing info
│   ├── shear-waves/
│   │   └── index.md                # Shear wave generation concepts
│   ├── ultrasound-focusing/
│   │   └── index.astro             # Interactive array focusing demo
│   └── pulse-harmonics/
│       └── index.astro             # Pulse harmonics spectrum analyzer
├── components/                     # Reusable UI components
│   ├── ultrasound-focusing/        # Array focusing visualization logic
│   └── pulse-harmonics/            # Spectrum analysis components
├── layouts/
│   └── Layout.astro                # Base page layout
├── shared/                         # Shared constants and utilities
│   └── constants.ts                # Common configuration values
├── setupTests.ts                   # Test environment configuration
└── public/                         # Static assets
    └── shear-waves/                # SVG illustrations
        ├── mech_shaker_schematic.svg
        └── arf_schematic.svg
```

## 🔧 Site Maintenance

This project uses automated deployment and infrastructure management:

### Infrastructure as Code
The site infrastructure is managed using [Terraform](https://www.terraform.io/) in `main.tf`:

- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Static site hosting and CDN
- **[AWS Route 53](https://aws.amazon.com/route53/)** - DNS management for custom domain
- **[GitHub Integration](https://docs.github.com/en/actions)** - Automated secrets and variables setup

To update infrastructure:
```bash
terraform plan
terraform apply
```

### Automated Deployment Pipeline
The site uses [GitHub Actions](https://github.com/features/actions) workflows from the [omsf/static-site-tools](https://github.com/omsf/static-site-tools) repository:

#### Core Workflows:

- **`build-push.yaml`** - Builds the Astro site on every push to main
- **`prod-cloudflare.yaml`** - Deploys successful builds to production
- **`stage-cloudflare.yaml`** - Creates staging deployments for pull requests
- **`cleanup-cloudflare.yaml`** - Removes staging deployments when PRs close
- **`test-coverage.yaml`** - Runs tests and generates coverage reports

#### Environment Variables:
The following GitHub secrets and variables are managed by Terraform:

- `CLOUDFLARE_API_TOKEN` - API access for Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_ASTRO_PROJECT_NAME` - Project name for deployments
- `ASTRO_OUTPUT_DIR` - Build output directory (defaults to `dist`)

### Manual Deployment
If needed, you can manually deploy:
```bash
npm run build
# Upload the dist/ directory to your hosting provider
```

## 🧪 Testing

The project includes comprehensive testing using Vitest:
```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
```

Tests cover:

- Component functionality
- Mathematical calculations for wave physics
- Canvas rendering operations

The test suite runs on Node.js v22 and v24 in the CI pipeline and uses [happy-dom](https://github.com/capricorn86/happy-dom) for DOM simulation.

## 📚 Educational Use

This site was created as educational material for [ultrasound physics](https://en.wikipedia.org/wiki/Ultrasound) and [shear wave elastography](https://en.wikipedia.org/wiki/Elastography). All content is designed to:

- Provide interactive learning experiences
- Visualize complex physics concepts
- Support academic presentations and research

### Key Learning Objectives:
1. **Wave Physics**: Understanding how mechanical and acoustic waves propagate
2. **Array Beamforming**: Learning how transducer timing creates focused beams
3. **Frequency Analysis**: Exploring harmonic generation in pulsed systems
4. **Medical Applications**: Connecting physics to clinical ultrasound techniques

## 🤖 Development Philosophy

This project represents an experiment in balancing "vibe-coding" with professional software development practices. The entire codebase, including visualizations and SVG illustrations, was originally generated using AI assistance and then manually refined to achieve the desired educational outcomes.

### AI-Assisted Development Approach:
- **Code Generation**: All initial implementations were AI-generated, then iteratively improved
- **Professional Guardrails**: Comprehensive test suites, CI/CD pipelines, and infrastructure as code
- **Maintainability Focus**: Structured to remain manageable despite rapid AI-assisted development
- **Quality Assurance**: Automated testing and deployment ensure continued functionality

This approach allows for rapid prototyping and development while maintaining the reliability and maintainability expected in professional software projects. The project serves as a case study in how AI can accelerate development without sacrificing code quality or long-term sustainability.

## 📄 License

- **Content** (text, images, visualizations): [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
- **Code**: [MIT License](https://opensource.org/licenses/MIT)

## 🤝 Contributing

Contributions are welcome! This project strives to balance AI-assisted development with maintainable software practices.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🔗 Links

- **Live Site**: [ultrasound.dwhswenson.net](https://ultrasound.dwhswenson.net)
- **Repository**: [github.com/dwhswenson/ultrasound](https://github.com/dwhswenson/ultrasound)
- **Static Site Tools**: [github.com/omsf/static-site-tools](https://github.com/omsf/static-site-tools)

## 📧 Contact

Created by [David Swenson](https://github.com/dwhswenson) as educational material for ultrasound physics and shear wave elastography.
