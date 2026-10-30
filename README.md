# Shader Point Cloud & Dynamic Particle Flow 🌌✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![React Three Fiber](https://img.shields.io/badge/R3F-Three.js-black.svg?logo=threedotjs&logoColor=white)](https://r3f.docs.pmnd.rs/)
[![GLSL Shaders](https://img.shields.io/badge/GLSL-Custom%20Turbulence%20Shaders-orange.svg)]()
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

> **Real-time, high-density WebGL point cloud with custom GPU GLSL turbulence shaders and post-processing.**  
> Built with Next.js 15, React Three Fiber (R3F), and custom GLSL vertex/fragment shaders featuring Catmull-Rom mouse history interpolation, trigonometric noise fields, and cinematic post-processing (Bloom, Chromatic Aberration, Vignette).

---

## ⚡ Visual & Technical Highlights

- **Custom GLSL Shader Pipeline:**
  - **Trigonometric Turbulence Noise:** High-performance procedural noise vector fields calculated on the GPU for organic particle motion.
  - **Catmull-Rom Mouse Trail Interpolation:** Smooth spline interpolation across a 50-step mouse velocity and position buffer.
  - **Dynamic Point Attenuation:** Particle size and alpha vary dynamically based on velocity, distance, and random phase offsets.
- **Cinematic Post-Processing:**
  - Unreal-style Bloom luminance glow
  - Chromatic Aberration lens distortion
  - Radial Vignette shading
- **Interactive Controls:** Smooth camera orbit with damping, pointer velocity tracking, and responsive window resizing.

---

## 📁 Repository Structure

```text
mkparticles/
├── app/
│   ├── globals.css         # Styling
│   ├── layout.tsx          # Root Next.js layout
│   └── page.tsx            # Main fullscreen scene viewport
├── components/
│   └── PointCloudScene.tsx # Full R3F Canvas, custom GLSL shaders & post-processing
├── hooks/
│   └── use-mobile.ts       # Responsive viewport hook
├── lib/
│   └── utils.ts            # Utility functions
├── package.json            # Dependencies
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

---

## 🚀 Quickstart

### 1. Installation

```bash
git clone https://github.com/MirhazarKhan/mkparticles.git
cd mkparticles

# Install dependencies
npm install
```

### 2. Development

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build

```bash
npm run build
npm run start
```

---

## 🛠️ Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **3D Engine:** [Three.js](https://threejs.org/) & [React Three Fiber](https://r3f.docs.pmnd.rs/)
- **Helpers:** [@react-three/drei](https://github.com/pmndrs/drei)
- **Post-Processing:** [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- **Shading Language:** WebGL GLSL (Custom Vertex & Fragment Shaders)

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 👨‍💻 Author

**Mirhazar Khan**  
*Senior 3D & Creative Web Engineer | AI Systems & Procedural Graphics Researcher*  
- **GitHub:** [@MirhazarKhan](https://github.com/MirhazarKhan)  
- **Website:** [mirhazarkhan.com](https://mirhazarkhan.com)
