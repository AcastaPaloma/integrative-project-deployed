"use client";

import { useCallback, type RefObject } from "react";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nvRef: RefObject<any>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  mode3d: boolean;
  onToggle3d: (next: boolean) => void;
};

export default function ViewerToolbar({ nvRef, canvasRef, mode3d, onToggle3d }: Props) {
  const reset = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    nv.setSliceType(nv.sliceTypeMultiplanar);
    onToggle3d(false);
    nv.drawScene();
  }, [nvRef, onToggle3d]);

  const screenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "niivue_screenshot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [canvasRef]);

  const fullscreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void canvas.requestFullscreen();
    }
  }, [canvasRef]);

  const toggleCrosshair = useCallback(() => {
    const nv = nvRef.current;
    if (!nv) return;
    nv.opts.crosshairWidth = nv.opts.crosshairWidth > 0 ? 0 : 1;
    nv.drawScene();
  }, [nvRef]);

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <button onClick={() => onToggle3d(false)} style={mode3d ? undefined : activeStyle}>
        2D Multi-planar
      </button>
      <button onClick={() => onToggle3d(true)} style={!mode3d ? undefined : activeStyle}>
        3D Render
      </button>
      <button onClick={reset}>Reset</button>
      <button onClick={screenshot}>Screenshot</button>
      <button onClick={fullscreen}>Fullscreen</button>
      <button onClick={toggleCrosshair}>Crosshair</button>
    </div>
  );
}

const activeStyle: React.CSSProperties = {
  background: "linear-gradient(165deg, #dbe9ff, #c8dcff)",
  borderColor: "rgba(22,100,216,0.35)",
};
