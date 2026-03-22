"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ViewerToolbar from "./ViewerToolbar";
import LayerControls from "./LayerControls";

type Props = {
  caseId: string;
  outputFiles: string[];
  modalities: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NiiVueViewer({ caseId, outputFiles, modalities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nvRef = useRef<any>(null);
  const [mode3d, setMode3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseModality = useMemo(() => {
    const order = ["flair", "t1ce", "t2", "t1"];
    return order.find((m) => modalities.includes(m)) ?? modalities[0] ?? null;
  }, [modalities]);

  const outputFilesKey = useMemo(() => JSON.stringify(outputFiles), [outputFiles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseModality) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setReady(false);
      setError(null);

      try {
        /* Lazy-import NiiVue at runtime so it never enters the SSR bundle */
        const { Niivue } = await import("@niivue/niivue");

        if (cancelled) return;

        /* Tear down any previous instance */
        if (nvRef.current) {
          try { nvRef.current.closeDrawing(); } catch { /* ok */ }
          nvRef.current = null;
        }

        const nv = new Niivue({
          backColor: [1, 1, 1, 1],
          show3Dcrosshair: true,
          isResizeCanvas: true,
        });
        nvRef.current = nv;

        await nv.attachToCanvas(canvas!);
        if (cancelled) return;

        const parsedOutputs: string[] = JSON.parse(outputFilesKey);

        const volumes: Array<{ url: string; name: string; colormap: string; opacity: number }> = [
          {
            url: `${API_BASE}/files/cases/${caseId}/inputs/${baseModality}`,
            name: `${baseModality}.nii.gz`,
            colormap: "gray",
            opacity: 1,
          },
        ];

        if (parsedOutputs.includes("mask_wt.nii.gz")) {
          volumes.push({
            url: `${API_BASE}/files/cases/${caseId}/outputs/mask_wt.nii.gz`,
            name: "mask_wt.nii.gz",
            colormap: "winter",
            opacity: 0.45,
          });
        }
        if (parsedOutputs.includes("mask_tc.nii.gz")) {
          volumes.push({
            url: `${API_BASE}/files/cases/${caseId}/outputs/mask_tc.nii.gz`,
            name: "mask_tc.nii.gz",
            colormap: "red",
            opacity: 0.45,
          });
        }
        if (parsedOutputs.includes("mask_et.nii.gz")) {
          volumes.push({
            url: `${API_BASE}/files/cases/${caseId}/outputs/mask_et.nii.gz`,
            name: "mask_et.nii.gz",
            colormap: "hot",
            opacity: 0.45,
          });
        }

        await nv.loadVolumes(volumes);

        if (!cancelled) {
          nv.setSliceType(nv.sliceTypeMultiplanar);
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("NiiVue load failed:", err);
          setError(err instanceof Error ? err.message : "Viewer failed to load");
          setReady(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (nvRef.current) {
        try { nvRef.current.closeDrawing(); } catch { /* ok */ }
      }
      nvRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseModality, caseId, outputFilesKey]);

  useEffect(() => {
    const nv = nvRef.current;
    if (!nv || !ready) return;
    nv.setSliceType(mode3d ? nv.sliceTypeRender : nv.sliceTypeMultiplanar);
    nv.drawScene();
  }, [mode3d, ready]);

  const hasModalities = modalities.length > 0;

  return (
    <div style={{ display: "grid", gap: "0.7rem" }}>
      {hasModalities && (
        <ViewerToolbar
          nvRef={nvRef}
          canvasRef={canvasRef}
          mode3d={mode3d}
          onToggle3d={setMode3d}
        />
      )}

      {/* Canvas is always in the DOM (NiiVue needs it) but hidden until ready */}
      <div style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#f0f4fb",
        minHeight: hasModalities ? 400 : 120,
      }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={680}
          style={{
            width: "100%",
            display: "block",
            visibility: ready ? "visible" : "hidden",
            position: ready ? "relative" : "absolute",
          }}
        />
        {/* Overlay shown while loading or when there's nothing to display */}
        {!ready && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: hasModalities ? 400 : 120,
            color: "#6b8ab3",
            fontSize: "0.95rem",
          }}>
            {loading && "Loading volumes…"}
            {error && <span style={{ color: "#a71d2a" }}>Error: {error}</span>}
            {!loading && !error && !hasModalities && "Upload modalities to view brain volumes."}
            {!loading && !error && hasModalities && "Preparing viewer…"}
          </div>
        )}
      </div>

      {ready && <LayerControls nvRef={nvRef} />}
    </div>
  );
}
