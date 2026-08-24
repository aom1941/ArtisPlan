# ArtisPlan Studio

ArtisPlan Studio is a high-performance, infinite sketching and vector canvas built with React 19, TypeScript, and Tailwind CSS. It combines fluid digital illustration tools with precision CAD-grade alignment systems, custom magnetic guidelines, touch gesture visualizations, stamp brushes, stroke stabilization, activity heatmaps, and version control.

---

## Key Features

### 1. Smart Magnetic Guidelines & Alignment
- **Custom Interactive Guidelines**: Create, drag, reposition, lock, and color-code horizontal and vertical canvas guidelines.
- **Smart Guide Manager**:
  - Precision coordinate positioning with single-pixel accuracy.
  - Multi-select checkboxes for batch operations (bulk delete, batch recoloring, batch lock/unlock, batch visibility).
  - Global **Show/Hide All** toggle to declutter canvas views on demand.
  - Composition presets including **Rule of Thirds**, **Golden Ratio**, **Canvas Origin**, **Print Margins**, and **16:9 Safe Areas**.
  - Direct viewport centering to jump immediately to any guideline coordinate.
- **Magnetic Snapping Engine**: Real-time bounding box edge and center snapping with haptic feedback, laser ray overlays, and glowing distance badges.

### 2. Infinite Canvas & Natural Inking
- **Smooth Canvas Navigation**: Infinite pan and zoom with sub-pixel precision, minimap navigation, and origin re-centering.
- **Stroke Stabilization & Inking**: Adjustable line smoothing (Streamline / Lazy Nezumi style), pressure simulation, and high-DPI rasterization.
- **Custom Stamp Brushes**: Configurable procedural and stamp brushes (scatter, rotation jitter, spacing, opacity dynamics).
- **Customizable Grid Overlay**: Isometric, dot grid, Cartesian, and millimeter grids with magnetic vertex snapping.

### 3. Touch Gesture Engine & Visual HUD
- **Multi-Finger Gesture Recognition**: Pinch-to-zoom, two-finger rotate, two-finger tap (undo), three-finger tap (redo), and four-finger canvas reset.
- **Real-Time Gesture Feedback HUD**: Dynamic touch path visualization and glowing gesture HUD indicator during active finger gestures.
- **Palm Rejection**: Dedicated Apple Pencil / stylus mode with configurable palm rejection thresholds.

### 4. Layers, Version Control & Reference Tools
- **Layer Stack Management**: Reorderable layers with opacity controls, blend modes, locking, and visibility toggling.
- **Time-Travel History & Snapshot Branching**: Non-destructive undo/redo history stack and project checkpoint versioning.
- **Picture-in-Picture Floating References**: Resizable moodboard and reference window with color-picker sampling.
- **Activity Heatmap Density**: Visual representation of stroke density and edit intensity across the canvas.

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend / Dev Server**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx), [esbuild](https://esbuild.github.io/)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd <project-folder>

# Install dependencies
npm install
```

### Development
Start the local development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Production Build
Compile the client application and bundled backend server:
```bash
# Build frontend and compile backend with esbuild
npm run build

# Start production server
npm run start
```

### Type Checking & Linting
Validate TypeScript types across the project:
```bash
npm run lint
```

---

## Canvas Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Pan Canvas** | Space + Drag or Middle Click |
| **Zoom Canvas** | Ctrl / Cmd + Mouse Wheel or Pinch |
| **Undo** | Ctrl / Cmd + Z or Two-Finger Tap |
| **Redo** | Ctrl / Cmd + Shift + Z or Three-Finger Tap |
| **Guide Manager** | Click Compass / Guide Icon on Floating Dock |
| **Snap Toggle** | S or Magnetic Toggle in Quick Controls |
| **Select All Objects** | Ctrl / Cmd + A |
| **Delete Selected** | Delete / Backspace |

---

## License
MIT License.
