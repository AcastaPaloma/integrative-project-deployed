"use client";

export default function ViewerToolbar() {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button>Reset</button>
      <button>Screenshot</button>
      <button>Fullscreen</button>
      <button>Layout</button>
      <button>Crosshair</button>
      <button>Ruler</button>
      <button>Prediction vs MRI</button>
      <button>Model A vs Model B</button>
    </div>
  );
}
