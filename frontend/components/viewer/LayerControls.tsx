"use client";

import { useCallback, useState, type RefObject } from "react";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nvRef: RefObject<any>;
};

export default function LayerControls({ nvRef }: Props) {
  const [baseOpacity, setBaseOpacity] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(45);

  const onBaseOpacityChange = useCallback(
    (value: number) => {
      setBaseOpacity(value);
      const nv = nvRef.current;
      if (!nv || nv.volumes.length === 0) return;
      nv.setOpacity(0, value / 100);
      nv.drawScene();
    },
    [nvRef],
  );

  const onOverlayOpacityChange = useCallback(
    (value: number) => {
      setOverlayOpacity(value);
      const nv = nvRef.current;
      if (!nv) return;
      for (let i = 1; i < nv.volumes.length; i++) {
        nv.setOpacity(i, value / 100);
      }
      nv.drawScene();
    },
    [nvRef],
  );

  return (
    <div style={{ display: "grid", gap: "0.7rem" }}>
      <label>
        Base volume opacity: {baseOpacity}%
        <input
          type="range"
          min="0"
          max="100"
          value={baseOpacity}
          onChange={(e) => onBaseOpacityChange(Number(e.target.value))}
        />
      </label>
      <label>
        Overlay opacity: {overlayOpacity}%
        <input
          type="range"
          min="0"
          max="100"
          value={overlayOpacity}
          onChange={(e) => onOverlayOpacityChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
