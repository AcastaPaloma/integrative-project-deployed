"use client";

export type ViewerViewKey = "sagittal" | "axial" | "coronal" | "render";

const VIEW_BUTTONS: Array<{ key: ViewerViewKey; label: string }> = [
  { key: "sagittal", label: "SAGITTAL" },
  { key: "axial", label: "AXIAL" },
  { key: "coronal", label: "CORONAL" },
  { key: "render", label: "3D RENDER" },
];

type Props = {
  activeView: ViewerViewKey;
  enabledViews: Record<ViewerViewKey, boolean>;
  onToggleView: (view: ViewerViewKey) => void;
  onReset: () => void;
  onScreenshot: () => void;
  onFullscreen: () => void;
  onToggleCrosshair: () => void;
};

export default function ViewerToolbar({
  activeView,
  enabledViews,
  onToggleView,
  onReset,
  onScreenshot,
  onFullscreen,
  onToggleCrosshair,
}: Props) {
  return (
    <div className="viewer-toolbar">
      <div className="viewer-toolbar-stack">
        <div className="viewer-toolbar-label">Tile visibility</div>
        <div className="viewer-toolbar-group">
          {VIEW_BUTTONS.map((view) => (
            <button
              key={view.key}
              type="button"
              className="viewer-button"
              data-active={enabledViews[view.key]}
              onClick={() => onToggleView(view.key)}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="viewer-toolbar-stack">
        <div className="viewer-toolbar-label">{`Active tile: ${activeView.toUpperCase()}`}</div>
        <div className="viewer-toolbar-group">
          <button type="button" className="viewer-button" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="viewer-button" onClick={onScreenshot}>
            Screenshot
          </button>
          <button type="button" className="viewer-button" onClick={onFullscreen}>
            Fullscreen
          </button>
          <button type="button" className="viewer-button" onClick={onToggleCrosshair}>
            Crosshair
          </button>
        </div>
      </div>
    </div>
  );
}
