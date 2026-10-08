import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as pdfjs from "pdfjs-dist";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Code2,
  ImageIcon,
  Search,
  Scroll,
  BookOpen,
  ArrowRight,
  Maximize,
} from "lucide-react";

// Ensure worker is registered
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export interface DocViewerProps {
  /** Raw decrypted file bytes */
  pdfBytes: Uint8Array | null;
  /** Loading state while decrypting */
  loading: boolean;
  /** Error message if fetch/decrypt failed */
  error: string | null;
  /** File name from submission record */
  fileName: string;
  /** Download action handler */
  onDownload: () => void;
  /** Whether download is in progress */
  isDownloading: boolean;
  /** Optional callback to toggle theater/fullscreen split mode */
  onToggleMaximize?: () => void;
  /** Whether the viewer is currently maximized */
  isMaximized?: boolean;
}

type ViewMode = "continuous" | "single";

interface PageCanvasProps {
  doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  pageNum: number;
  scale: number;
  rotation: number;
  onVisible?: (pageNum: number) => void;
}

/**
 * Individual Page Renderer with IntersectionObserver lazy evaluation.
 * Avoids browser memory exhaustion on 50+ page PDFs while providing smooth scrolling.
 */
const PdfPageItem: React.FC<PageCanvasProps> = ({
  doc,
  pageNum,
  scale,
  rotation,
  onVisible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [inView, setInView] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });

  // Observe visibility in scroll viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            onVisible?.(pageNum);
          }
        });
      },
      { rootMargin: "350px 0px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, onVisible]);

  // Initial estimate of viewport dimensions
  useEffect(() => {
    let active = true;
    doc.getPage(pageNum).then((page) => {
      if (!active) return;
      const vp = page.getViewport({ scale, rotation });
      setPageSize({ width: vp.width, height: vp.height });
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [doc, pageNum, scale, rotation]);

  // Render canvas once in view
  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isCurrent = true;

    // Cancel existing render if parameters changed
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
      renderTaskRef.current = null;
    }

    doc.getPage(pageNum).then(async (page) => {
      if (!isCurrent) return;
      const viewport = page.getViewport({ scale, rotation });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      try {
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (isCurrent) setRendered(true);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.debug("Page render error:", err);
        }
      }
    });

    return () => {
      isCurrent = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [doc, pageNum, scale, rotation, inView]);

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNum}`}
      className="flex flex-col items-center my-4 group"
    >
      <div
        className="bg-white rounded-lg shadow-md border border-slate-300/80 overflow-hidden transition-shadow group-hover:shadow-lg relative"
        style={{
          width: pageSize.width,
          minHeight: pageSize.height,
        }}
      >
        <canvas ref={canvasRef} className="block" />
        {!rendered && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-mono"
            style={{ width: pageSize.width, height: pageSize.height }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-peerity-600 border-t-transparent rounded-full animate-spin" />
              <span>Rendering Page {pageNum}…</span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 text-[11px] font-medium text-slate-500 font-mono tracking-tight select-none">
        Page {pageNum}
      </div>
    </div>
  );
};

export const DocViewer: React.FC<DocViewerProps> = ({
  pdfBytes,
  loading,
  error,
  fileName,
  onDownload,
  isDownloading,
  onToggleMaximize,
  isMaximized = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]> | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.15);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>("continuous");
  const [jumpPageInput, setJumpPageInput] = useState<string>("1");
  const [singlePageRendering, setSinglePageRendering] = useState(false);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const singleRenderTaskRef = useRef<any>(null);

  // Non-PDF detection (Text/Code or Image)
  const fileExt = useMemo(() => {
    const parts = fileName.toLowerCase().split(".");
    return parts.length > 1 ? parts.pop() || "" : "";
  }, [fileName]);

  const isPdf = fileExt === "pdf";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(fileExt);
  const isCodeOrText = [
    "py", "java", "c", "cpp", "h", "cs", "js", "ts", "jsx", "tsx",
    "html", "css", "json", "xml", "yaml", "yml", "md", "sql", "txt",
    "sh", "bat", "rb", "go", "rs", "php", "r", "csv", "log"
  ].includes(fileExt);

  // Decoded text content if text/code file
  const [textContent, setTextContent] = useState<string | null>(null);
  const [codeWrap, setCodeWrap] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Decoded image object URL
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // File size formatted
  const formattedFileSize = useMemo(() => {
    if (!pdfBytes) return "";
    const kb = pdfBytes.length / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  }, [pdfBytes]);

  // Decode non-PDF bytes
  useEffect(() => {
    if (!pdfBytes) {
      setTextContent(null);
      setImageUrl(null);
      return;
    }

    if (isImage) {
      const mime = fileExt === "svg" ? "image/svg+xml" : `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: mime });
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (isCodeOrText || !isPdf) {
      try {
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(pdfBytes);
        // Quick heuristic: if text has null bytes, likely binary
        if (!decoded.includes("\0")) {
          setTextContent(decoded);
        } else {
          setTextContent(null);
        }
      } catch {
        setTextContent(null);
      }
    }
  }, [pdfBytes, isImage, isCodeOrText, isPdf, fileExt]);

  // Load PDF document
  useEffect(() => {
    if (!pdfBytes || !isPdf) {
      setPdfDoc(null);
      setTotalPages(0);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setJumpPageInput("1");
      } catch (e) {
        console.error("PDF load error:", e);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [pdfBytes, isPdf]);

  // Render single-page mode canvas
  useEffect(() => {
    if (!pdfDoc || viewMode !== "single") return;
    const canvas = singleCanvasRef.current;
    if (!canvas) return;

    let isCurrent = true;
    if (singleRenderTaskRef.current) {
      try {
        singleRenderTaskRef.current.cancel();
      } catch {}
      singleRenderTaskRef.current = null;
    }

    setSinglePageRendering(true);
    pdfDoc.getPage(currentPage).then(async (page) => {
      if (!isCurrent) return;
      const viewport = page.getViewport({ scale, rotation });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      try {
        const task = page.render({ canvasContext: ctx, viewport });
        singleRenderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(err);
        }
      } finally {
        if (isCurrent) setSinglePageRendering(false);
      }
    });

    return () => {
      isCurrent = false;
      if (singleRenderTaskRef.current) {
        try {
          singleRenderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, viewMode]);

  // Zoom helpers
  const handleZoom = (dir: "in" | "out") => {
    setScale((s) => {
      const step = 0.15;
      const next = dir === "in" ? s + step : s - step;
      return Math.max(0.4, Math.min(3.0, Math.round(next * 100) / 100));
    });
  };

  const handleFitWidth = async () => {
    if (!containerRef.current || !pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const vp = page.getViewport({ scale: 1, rotation });
      const availableWidth = containerRef.current.clientWidth - 48; // padding
      if (availableWidth > 0 && vp.width > 0) {
        const newScale = Math.max(0.4, Math.min(2.5, availableWidth / vp.width));
        setScale(Math.round(newScale * 100) / 100);
      }
    } catch {}
  };

  const handleResetZoom = () => {
    setScale(1.15);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      if (viewMode === "continuous") {
        const el = document.getElementById(`pdf-page-${p}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  const handlePageVisibleInScroll = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    setJumpPageInput(String(pageNum));
  }, []);

  const handleCopyCode = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filtered lines for code search
  const textLines = useMemo(() => {
    if (!textContent) return [];
    return textContent.split("\n");
  }, [textContent]);

  return (
    <div className="flex flex-col h-full bg-slate-100 border-r border-slate-200 select-none overflow-hidden">
      {/* ── TOP TOOLBAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-200 flex-shrink-0 flex-wrap">
        {/* Left: Document info & icon */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          <div className="w-7 h-7 rounded-lg bg-peerity-100 text-peerity-800 flex items-center justify-center flex-shrink-0">
            {isPdf ? (
              <FileText className="w-4 h-4" />
            ) : isImage ? (
              <ImageIcon className="w-4 h-4" />
            ) : isCodeOrText ? (
              <Code2 className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate font-display" title={fileName}>
              {fileName}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              {formattedFileSize && <span>{formattedFileSize}</span>}
              {isPdf && totalPages > 0 && (
                <>
                  <span>•</span>
                  <span>{totalPages} page{totalPages > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Controls for PDF */}
        {isPdf && pdfDoc && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Continuous vs Single */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("continuous")}
                title="Continuous Vertical Scroll"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                  viewMode === "continuous"
                    ? "bg-white text-peerity-800 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Scroll className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Scroll</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                title="Single Page Presentation"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition ${
                  viewMode === "single"
                    ? "bg-white text-peerity-800 shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Single</span>
              </button>
            </div>

            {/* Page navigation / jump */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-1 py-0.5">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, currentPage - 1);
                  setCurrentPage(next);
                  setJumpPageInput(String(next));
                  if (viewMode === "continuous") {
                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                disabled={currentPage <= 1}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 transition"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <form onSubmit={handlePageJump} className="flex items-center gap-1">
                <input
                  type="text"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  onBlur={handlePageJump}
                  className="w-8 text-center text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-peerity-600"
                  title="Jump to page number"
                />
                <span className="text-xs font-mono text-slate-400 select-none">
                  / {totalPages}
                </span>
              </form>

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(next);
                  setJumpPageInput(String(next));
                  if (viewMode === "continuous") {
                    document.getElementById(`pdf-page-${next}`)?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                disabled={currentPage >= totalPages}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 transition"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-1 py-0.5">
              <button
                type="button"
                onClick={() => handleZoom("out")}
                disabled={scale <= 0.4}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 text-xs font-mono text-slate-700 hover:text-peerity-800 transition font-medium select-none"
                title="Reset to 100%"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => handleZoom("in")}
                disabled={scale >= 3.0}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

              <button
                type="button"
                onClick={handleFitWidth}
                className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-peerity-800 rounded transition font-display"
                title="Fit to Width"
              >
                Fit
              </button>
            </div>

            {/* Rotation Control */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition"
              title={`Rotate 90° clockwise (current: ${rotation}°)`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition"
              title={isMaximized ? "Restore Split View" : "Maximize Document View"}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-xs font-semibold transition shadow-2xs disabled:opacity-50 font-display flex-shrink-0"
            title="Download decrypted file directly"
          >
            {isDownloading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{isDownloading ? "Decrypting..." : "Download"}</span>
          </button>
        </div>
      </div>

      {/* ── VIEWER BODY (SCROLLABLE CONTAINER) ─────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-200/90 flex flex-col items-center relative p-3"
      >
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-slate-500 py-12">
            <div className="w-10 h-10 border-3 border-peerity-800 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800 font-display">Decrypting AES-256 Payload…</p>
              <p className="text-xs text-slate-400 mt-0.5">Fetching from secure sidecar keystore</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-slate-600 p-8 text-center max-w-md bg-white rounded-2xl border border-slate-300 shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <h3 className="text-base font-bold text-slate-900 font-display">Decryption Error</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <button
              onClick={onDownload}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Raw Artifact
            </button>
          </div>
        )}

        {/* 1. PDF: Continuous Scroll Mode */}
        {!loading && !error && isPdf && pdfDoc && viewMode === "continuous" && (
          <div className="w-full flex flex-col items-center pb-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PdfPageItem
                key={`${pageNum}-${scale}-${rotation}`}
                doc={pdfDoc}
                pageNum={pageNum}
                scale={scale}
                rotation={rotation}
                onVisible={handlePageVisibleInScroll}
              />
            ))}
          </div>
        )}

        {/* 2. PDF: Single Page Mode */}
        {!loading && !error && isPdf && pdfDoc && viewMode === "single" && (
          <div className="my-auto flex flex-col items-center py-6">
            <div className="bg-white rounded-lg shadow-lg border border-slate-300 overflow-hidden relative">
              <canvas ref={singleCanvasRef} className="block" />
              {singlePageRendering && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-peerity-800 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-300 text-xs font-mono text-slate-600 shadow-xs">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="hover:text-peerity-800 disabled:opacity-30"
              >
                &larr; Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="hover:text-peerity-800 disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {/* 3. Code & Text File Preview Fallback */}
        {!loading && !error && textContent !== null && (
          <div className="w-full max-w-4xl bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden my-4 flex flex-col">
            {/* Code Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-slate-300 font-semibold">{fileName}</span>
                <span className="text-[10px] text-slate-500 font-mono">({textLines.length} lines)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCodeWrap((w) => !w)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition ${
                    codeWrap ? "border-emerald-500 text-emerald-400 bg-emerald-950/40" : "border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Wrap: {codeWrap ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition"
                  title="Copy code to clipboard"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className={`p-4 font-mono text-xs text-slate-200 overflow-auto max-h-[75vh] ${codeWrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}>
              {textLines.map((line, idx) => (
                <div key={idx} className="flex hover:bg-slate-800/60 leading-5">
                  <span className="w-12 text-slate-600 select-none text-right pr-4 flex-shrink-0 font-mono text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="flex-1 font-mono">{line || " "}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Image File Preview Fallback */}
        {!loading && !error && imageUrl && (
          <div className="my-auto flex flex-col items-center py-6">
            <div
              className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden p-2 transition-transform"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
            >
              <img
                src={imageUrl}
                alt={fileName}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* 5. Generic Non-previewable Binary */}
        {!loading && !error && !isPdf && textContent === null && !imageUrl && pdfBytes && (
          <div className="my-auto flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-300 shadow-md text-center max-w-md">
            <div className="w-12 h-12 rounded-2xl bg-peerity-100 text-peerity-800 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Decrypted Binary Artifact</h3>
            <p className="text-xs text-slate-500 mt-1">
              File type <code>.{fileExt || "bin"}</code> cannot be rendered directly in the canvas viewer.
            </p>
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-xs text-slate-600 font-mono flex justify-between">
              <span>{fileName}</span>
              <span>{formattedFileSize}</span>
            </div>
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="mt-4 flex items-center gap-1.5 px-5 py-2.5 bg-peerity-800 hover:bg-peerity-600 text-white rounded-xl text-xs font-semibold transition shadow-xs"
            >
              <Download className="w-4 h-4" /> {isDownloading ? "Decrypting..." : "Download Decrypted File"}
            </button>
          </div>
        )}

        {/* 6. Empty / Unloaded state */}
        {!loading && !error && !pdfBytes && (
          <div className="my-auto flex flex-col items-center justify-center gap-2 text-slate-400 py-16">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p className="text-sm font-display font-medium text-slate-500">No submission loaded</p>
            <p className="text-xs text-slate-400">Select a review from the roster to begin grading</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocViewer;
