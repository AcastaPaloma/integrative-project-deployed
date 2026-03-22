"use client";

export default function LayerControls() {
  return (
    <div style={{ display: "grid", gap: "0.7rem" }}>
      <label>
        Base volume opacity
        <input type="range" min="0" max="100" defaultValue="90" />
      </label>
      <label>
        Prediction opacity
        <input type="range" min="0" max="100" defaultValue="65" />
      </label>
      <label>
        Blend mode
        <select defaultValue="normal">
          <option value="normal">normal</option>
          <option value="additive">additive</option>
          <option value="difference">difference</option>
        </select>
      </label>
    </div>
  );
}
