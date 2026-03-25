"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { API_BASE } from "../../lib/api";
import LayerControls from "./LayerControls";
import ViewerToolbar, { ViewerViewKey } from "./ViewerToolbar";

type Props = {
  caseId: string;
  outputFiles: string[];
  modalities: string[];
};

type TileStatus = {
  loading: boolean;
  ready: boolean;
  error: string | null;
};

type ViewerLayoutMode = "quad" | "split" | "single";

const VIEW_ORDER: Array<{ key: ViewerViewKey; label: string; is3d: boolean }> = [
  { key: "sagittal", label: "SAGITTAL", is3d: false },
  { key: "axial", label: "AXIAL", is3d: false },
  { key: "coronal", label: "CORONAL", is3d: false },
  { key: "render", label: "3D RENDER", is3d: true },
];

const DEFAULT_ENABLED_VIEWS: Record<ViewerViewKey, boolean> = {
  sagittal: true,
  axial: true,
  coronal: true,
  render: false,
};

const LEGEND = [
  { filename: "mask_wt.nii.gz", label: "WT - Whole tumor", color: "#97f3be" },
  { filename: "mask_tc.nii.gz", label: "TC - Tumor core", color: "#316289" },
  { filename: "mask_et.nii.gz", label: "ET - Enhancing tumor", color: "#9f403d" },
];

function createInitialTileStatus(): Record<ViewerViewKey, TileStatus> {
  return {
    sagittal: { loading: false, ready: false, error: null },
    axial: { loading: false, ready: false, error: null },
    coronal: { loading: false, ready: false, error: null },
    render: { loading: false, ready: false, error: null },
  };
}

function getSliceTypeForView(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nv: any,
  view: ViewerViewKey,
) {
  switch (view) {
    case "sagittal":
      return nv.sliceTypeSagittal;
    case "coronal":
      return nv.sliceTypeCoronal;
    case "render":
      return nv.sliceTypeRender;
    case "axial":
    default:
      return nv.sliceTypeAxial;
  }
}

export default function NiiVueViewer({ caseId, outputFiles, modalities }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<Record<ViewerViewKey, HTMLCanvasElement | null>>({
    sagittal: null,
    axial: null,
    coronal: null,
    render: null,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nvRefs = useRef<Record<ViewerViewKey, any | null>>({
    sagittal: null,
    axial: null,
    coronal: null,
    render: null,
  });

  const [enabledViews, setEnabledViews] = useState(DEFAULT_ENABLED_VIEWS);
  const [activeView, setActiveView] = useState<ViewerViewKey>("sagittal");
  const [tileStatus, setTileStatus] = useState<Record<ViewerViewKey, TileStatus>>(createInitialTileStatus);
  const [crosshairVisible, setCrosshairVisible] = useState(true);

  const baseModality = useMemo(() => {
    const order = ["flair", "t1ce", "t2", "t1"];
    return order.find((modality) => modalities.includes(modality)) ?? modalities[0] ?? null;
  }, [modalities]);

  const presentLegend = useMemo(
    () => LEGEND.filter((entry) => outputFiles.includes(entry.filename)),
    [outputFiles],
  );
  const visibleViews = useMemo(
    () => VIEW_ORDER.filter((view) => enabledViews[view.key]),
    [enabledViews],
  );
  const layoutMode = useMemo<ViewerLayoutMode>(() => {
    if (visibleViews.length <= 1) return "single";
    if (visibleViews.length === 2) return "split";
    return "quad";
  }, [visibleViews]);
  const renderedViews = useMemo(
    () => (visibleViews.length >= 3 ? VIEW_ORDER : visibleViews),
    [visibleViews],
  );

  const outputFilesKey = useMemo(() => JSON.stringify(outputFiles), [outputFiles]);

  const getActiveCanvas = useCallback(() => {
    if (!enabledViews[activeView]) return null;
    return canvasRefs.current[activeView];
  }, [activeView, enabledViews]);

  const getLoadedViewers = useCallback(() => {
    return VIEW_ORDER
      .filter((view) => enabledViews[view.key])
      .map((view) => nvRefs.current[view.key])
      .filter(Boolean);
  }, [enabledViews]);

  useEffect(() => {
    if (enabledViews[activeView]) return;
    const firstEnabled = VIEW_ORDER.find((view) => enabledViews[view.key]);
    if (firstEnabled) {
      setActiveView(firstEnabled.key);
    }
  }, [activeView, enabledViews]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      for (const nv of getLoadedViewers()) {
        nv.resizeListener();
        nv.drawScene();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [getLoadedViewers, layoutMode]);

  useEffect(() => {
    if (!baseModality) return;

    let cancelled = false;

    async function loadTiles() {
      const { Niivue } = await import("@niivue/niivue");
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

      for (const view of VIEW_ORDER) {
        const existing = nvRefs.current[view.key];
        if (existing) {
          try {
            existing.closeDrawing();
          } catch {
            // Safe cleanup.
          }
          nvRefs.current[view.key] = null;
        }
      }

      setTileStatus(createInitialTileStatus());

      for (const view of VIEW_ORDER) {
        if (!enabledViews[view.key]) continue;

        const canvas = canvasRefs.current[view.key];
        if (!canvas) continue;

        setTileStatus((prev) => ({
          ...prev,
          [view.key]: { loading: true, ready: false, error: null },
        }));

        try {
          const nv = new Niivue({
            backColor: [0.02, 0.02, 0.02, 1],
            show3Dcrosshair: true,
            isResizeCanvas: true,
          });

          nv.setCrosshairWidth(crosshairVisible ? 1 : 0);
          nvRefs.current[view.key] = nv;

          await nv.attachToCanvas(canvas);
          if (cancelled) return;

          await nv.loadVolumes(volumes);
          if (cancelled) return;

          nv.setSliceType(getSliceTypeForView(nv, view.key));
          if (view.key === "render") {
            nv.setRenderAzimuthElevation(45, 18);
          }
          nv.drawScene();

          setTileStatus((prev) => ({
            ...prev,
            [view.key]: { loading: false, ready: true, error: null },
          }));
        } catch (loadError) {
          setTileStatus((prev) => ({
            ...prev,
            [view.key]: {
              loading: false,
              ready: false,
              error: loadError instanceof Error ? loadError.message : "Viewer failed to load",
            },
          }));
        }
      }

      const instances = VIEW_ORDER
        .filter((view) => enabledViews[view.key])
        .map((view) => nvRefs.current[view.key])
        .filter(Boolean);

      for (const nv of instances) {
        const others = instances.filter((other) => other !== nv);
        if (others.length === 0) continue;
        nv.broadcastTo(others, {
          "2d": true,
          "3d": true,
          zoomPan: true,
          crosshair: true,
          sliceType: false,
        });
      }
    }

    void loadTiles();

    return () => {
      cancelled = true;
      for (const view of VIEW_ORDER) {
        const nv = nvRefs.current[view.key];
        if (nv) {
          try {
            nv.closeDrawing();
          } catch {
            // Safe cleanup.
          }
          nvRefs.current[view.key] = null;
        }
      }
    };
  }, [baseModality, caseId, crosshairVisible, enabledViews, outputFilesKey]);

  const onToggleView = useCallback((view: ViewerViewKey) => {
    const isEnabled = enabledViews[view];
    const enabledCount = Object.values(enabledViews).filter(Boolean).length;
    if (isEnabled && enabledCount === 1) {
      return;
    }

    setEnabledViews((prev) => ({
      ...prev,
      [view]: !prev[view],
    }));

    if (!isEnabled) {
      setActiveView(view);
    }
  }, [enabledViews]);

  const onReset = useCallback(() => {
    for (const view of VIEW_ORDER) {
      const nv = nvRefs.current[view.key];
      if (!nv || !enabledViews[view.key]) continue;
      nv.setSliceType(getSliceTypeForView(nv, view.key));
      if (view.key === "render") {
        nv.setRenderAzimuthElevation(45, 18);
      }
      nv.drawScene();
    }
  }, [enabledViews]);

  const onScreenshot = useCallback(() => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${activeView}_view.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [activeView, getActiveCanvas]);

  const onFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  }, []);

  const onToggleCrosshair = useCallback(() => {
    setCrosshairVisible((prev) => {
      const next = !prev;
      for (const nv of getLoadedViewers()) {
        nv.setCrosshairWidth(next ? 1 : 0);
        nv.drawScene();
      }
      return next;
    });
  }, [getLoadedViewers]);

  return (
    <div className="viewer-pane" ref={containerRef}>
      <ViewerToolbar
        activeView={activeView}
        enabledViews={enabledViews}
        onToggleView={onToggleView}
        onReset={onReset}
        onScreenshot={onScreenshot}
        onFullscreen={onFullscreen}
        onToggleCrosshair={onToggleCrosshair}
      />

      {presentLegend.length > 0 ? (
        <div className="viewer-legend-strip">
          {presentLegend.map((entry) => (
            <div key={entry.filename} className="viewer-legend-item">
              <span className="viewer-legend-swatch" style={{ background: entry.color }} />
              <span>{entry.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="viewer-grid" data-layout={layoutMode}>
        {renderedViews.map((view) => {
          const status = tileStatus[view.key];
          const enabled = enabledViews[view.key];

          return (
            <section
              key={view.key}
              className="viewer-tile"
              data-active={activeView === view.key}
              data-empty={!enabled}
              onClick={() => {
                if (enabled) {
                  setActiveView(view.key);
                }
              }}
            >
              <div className="viewer-tile-header">
                <span className="viewer-tile-title">{view.label}</span>
                <span className="viewer-tile-state">
                  {!enabled ? "HIDDEN" : status.loading ? "LOADING" : status.ready ? "READY" : status.error ? "ERROR" : "IDLE"}
                </span>
              </div>

              {enabled ? (
                <div className="viewer-tile-body">
                  <canvas
                    ref={(node) => {
                      canvasRefs.current[view.key] = node;
                    }}
                    width={720}
                    height={520}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      visibility: status.ready ? "visible" : "hidden",
                    }}
                  />

                  {!status.ready ? (
                    <div className="viewer-tile-placeholder">
                      <div className="viewer-tile-placeholder-title">
                        {status.loading ? "Loading tile" : status.error ? "Tile error" : "Preparing tile"}
                      </div>
                      <div className="viewer-tile-placeholder-copy">
                        {status.error ?? "Waiting for NIfTI volumes and WebGL initialization."}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="viewer-tile-placeholder viewer-tile-placeholder-static">
                  <div className="viewer-tile-placeholder-title">
                    {view.is3d ? "3D render disabled" : `${view.label} hidden`}
                  </div>
                  <div className="viewer-tile-placeholder-copy">
                    Enable this tile from the toolbar whenever you want it in the 2x2 layout.
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {baseModality ? <LayerControls baseLabel={baseModality.toUpperCase()} getViewers={getLoadedViewers} /> : null}
    </div>
  );
}
