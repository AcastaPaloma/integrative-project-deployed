"use client";

import { useCallback, useState } from "react";

type Props = {
  baseLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getViewers: () => any[];
};

export default function LayerControls({ baseLabel, getViewers }: Props) {
  const [baseOpacity, setBaseOpacity] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(45);

  const onBaseOpacityChange = useCallback(
    (value: number) => {
      setBaseOpacity(value);
      const viewers = getViewers();
      for (const nv of viewers) {
        if (!nv || nv.volumes.length === 0) continue;
        nv.setOpacity(0, value / 100);
        nv.drawScene();
      }
    },
    [getViewers],
  );

  const onOverlayOpacityChange = useCallback(
    (value: number) => {
      setOverlayOpacity(value);
      const viewers = getViewers();
      for (const nv of viewers) {
        if (!nv) continue;
        for (let i = 1; i < nv.volumes.length; i += 1) {
          nv.setOpacity(i, value / 100);
        }
        nv.drawScene();
      }
    },
    [getViewers],
  );

  return (
    <div className="viewer-footer">
      <label className="range-group">
        <span className="range-row">
          <span>{`base ${baseLabel}`}</span>
          <span>{baseOpacity}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={baseOpacity}
          onChange={(event) => onBaseOpacityChange(Number(event.target.value))}
        />
      </label>

      <label className="range-group">
        <span className="range-row">
          <span>overlay opacity</span>
          <span>{overlayOpacity}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={overlayOpacity}
          onChange={(event) => onOverlayOpacityChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
