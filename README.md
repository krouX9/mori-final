# Mori Campus 3D Visualization

An interactive, responsive 3D campus layout and tour application built with **Three.js** and **Vite**. The project visualizes the Mori campus area, complete with stylized buildings, vegetation, roadways, custom zones, a day/night cycle, real-time GPS location tracking, and an audio-guided tour.

---

## Key Features

1. **Procedural Campus Layout:** Automatically constructs pathways, boundary walls, zones, and places 3D models based on geographic datasets (GeoJSON).
2. **Audio-Guided Tour:** Includes an interactive, step-by-step campus tour. Audio tracks sync with play/pause and auto-advance when a stop's audio concludes.
3. **Day/Night Toggle:** Transitions smoothly between a bright daytime lighting configuration and a warm night mode with glowing street lamps.
4. **GPS Integration:** Tracks the user's real-world location and heading relative to the campus center, enabling an on-site virtual experience.
5. **Interactive Developer Mode:** Append `?dev=1` to the URL to enable the developer mode:
   - Move, rotate, and scale 3D building models interactively.
   - Draw custom pedestrian paths and road layouts directly on the terrain.
   - Define custom zones (gardens, playgrounds, assemblies).
   - Export all adjustments directly to the clipboard to save transforms back to the project dataset.

---

## Tech Stack

- **Core Logic:** Three.js (WebGL), ESNext JavaScript (Modules).
- **Assets Loader:** GLTFLoader with Draco compression support.
- **Build System:** Vite.
- **Styling:** Vanilla CSS (Glassmorphism & premium UI/UX).

---

## Getting Started

### Prerequisites
Make sure you have **Node.js** (v18 or higher recommended) and **npm** installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/krouX9/mori-final.git
   cd mori-final
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the local development server:
```bash
npm run dev
```
Open the local URL (usually `http://localhost:5173/mori-final/`) in your browser.

### Production Build
Build the optimized static assets bundle:
```bash
npm run build
```
The build artifacts will be written to the `dist/` directory, ready to be hosted on GitHub Pages or any static provider.

---

## Folder Structure

```text
├── .github/workflows/      # CI/CD deployment pipelines (GitHub Pages)
├── public/                 # Static assets (textures, audio tracks)
├── src/
│   ├── assets/             # 3D GLB models & model loading configurations
│   ├── data/               # GeoJSON datasets, tour stop list, baseline overrides
│   ├── dev/                # Dev mode tools & editors (draw, transform)
│   ├── gps/                # Location controller and proximity systems
│   ├── life/               # Ambient systems (clouds, birds, vehicles)
│   ├── procedural/         # Geometry creation (roads, zones, walls)
│   ├── scene/              # Core 3D scene elements (lighting, camera, terrain)
│   ├── tour/               # Guided tour logic & audio managers
│   ├── ui/                 # Interactive popups, modals, and dock layouts
│   ├── app.js              # Application entry and scene coordinator
│   └── main.js             # JavaScript entry point
├── index.html              # Main HTML entry and style system
├── vite.config.js          # Vite build config
└── package.json            # NPM scripts & dependencies
```
