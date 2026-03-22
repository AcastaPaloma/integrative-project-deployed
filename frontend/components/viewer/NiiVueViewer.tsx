"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Niivue } from "@niivue/niivue";

type Props = {
  caseId: string;
  outputFiles: string[];
  modalities: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NiiVueViewer({ caseId, outputFiles, modalities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef = useRef<Niivue | null>(null);
  const [mode3d, setMode3d] = useState(false);
  const [ready, setReady] = useState(false);

  const baseModality = useMemo(() => {
    const order = ["flair", "t1ce", "t2", "t1"];
    return order.find((m) => modalities.includes(m)) ?? modalities[0] ?? null;
  }, [modalities]);

  useEffect(() => {
    if (!canvasRef.current || !baseModality) return;

    const nv = new Niivue({ backColor: [1, 1, 1, 1], show3Dcrosshair: true });
    nv.attachToCanvas(canvasRef.current);
    nvRef.current = nv;

    async function load() {
      const volumes: Array<any> = [
        {
          url: `${API_BASE}/files/cases/${caseId}/inputs/${baseModality}`,
          colormap: "gray",
          opacity: 1,
        },
      ];

      if (outputFiles.includes("mask_wt.nii.gz")) {
        volumes.push({
          url: `${API_BASE}/files/cases/${caseId}/outputs/mask_wt.nii.gz`,
          colormap: "winter",
          opacity: 0.45,
        });
      }
      if (outputFiles.includes("mask_tc.nii.gz")) {
        volumes.push({
          url: `${API_BASE}/files/cases/${caseId}/outputs/mask_tc.nii.gz`,
          colormap: "red",
          opacity: 0.45,
        });
      }
      if (outputFiles.includes("mask_et.nii.gz")) {
        volumes.push({
          url: `${API_BASE}/files/cases/${caseId}/outputs/mask_et.nii.gz`,
          colormap: "hot",
          opacity: 0.45,
        });
      }

      try {
        await nv.loadVolumes(volumes);
        nv.setSliceType(nv.sliceTypeMultiplanar);
        setReady(true);
      } catch {
        setReady(false);
      }
    }

    void load();

    return () => {
      nvRef.current = null;
    };
  }, [baseModality, caseId, outputFiles]);

  useEffect(() => {
    const nv = nvRef.current;
    if (!nv) return;
    nv.setSliceType(mode3d ? nv.sliceTypeRender : nv.sliceTypeMultiplanar);
    nv.drawScene();
  }, [mode3d]);

  return (
    <div style={{ display: "grid", gap: "0.7rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button onClick={() => setMode3d(false)}>2D Multi-planar</button>
        <button onClick={() => setMode3d(true)}>3D Render</button>
      </div>
      <canvas ref={canvasRef} width={1000} height={680} style={{ width: "100%", borderRadius: 12, background: "#f5f8ff" }} />
      {!ready ? <small>Viewer will appear after inputs and outputs are available.</small> : null}
    </div>
  );
}
