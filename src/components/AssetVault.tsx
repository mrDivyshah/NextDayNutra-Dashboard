"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Download,
  MessageCircle,
  Trash2,
  Upload,
  Send,
  CornerUpLeft,
  CheckCircle,
  XCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Image,
  File,
} from "lucide-react";
import { vaultApi, VaultAsset, VaultComment } from "@/lib/vault-api";

// ─── Types ────────────────────────────────────────────────────────────────────


// ─── Helpers ─────────────────────────────────────────────────────────────────


function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  msg: string;
  type: "success" | "error";
}

function Toast({ items }: { items: ToastItem[] }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000100 }}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            background: "#1a2b3c",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 8,
            marginBottom: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            borderLeft: `5px solid ${t.type === "success" ? "#2eb67d" : "#dc2626"}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            animation: "slideIn 0.3s ease",
            fontSize: 14,
          }}
        >
          <span>{t.type === "success" ? "✅" : "❌"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  orderId: string;
  customerId: number;
  onClose: () => void;
  onUploaded: (assetId: number) => void;
  addToast: (msg: string, type?: "success" | "error") => void;
}

function UploadModal({ orderId, customerId, onClose, onUploaded, addToast }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const ALLOWED = /\.(jpg|jpeg|png|gif|pdf|doc|docx|ai|psd)$/i;

  const handleFile = (file: File) => {
    if (!ALLOWED.test(file.name)) {
      addToast("File type not supported. Use PDF, Word, AI, PSD or images.", "error");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const renderPreview = () => {
    if (!selectedFile || !previewUrl) return null;
    const name = selectedFile.name.toLowerCase();
    if (selectedFile.type.startsWith("image/")) {
      return (
        <img
          src={previewUrl}
          alt="preview"
          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
        />
      );
    }
    if (selectedFile.type === "application/pdf") {
      return (
        <iframe src={previewUrl} title="pdf-preview" style={{ width: "100%", height: "100%", border: "none" }} />
      );
    }
    const icon = name.endsWith(".doc") || name.endsWith(".docx") ? "📝" : name.endsWith(".ai") ? "🎨" : "🖼️";
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 52 }}>{icon}</div>
        <div style={{ fontWeight: 700, marginTop: 8, color: "#334155" }}>{selectedFile.name}</div>
      </div>
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const result = await vaultApi.uploadAsset(selectedFile, orderId, customerId, requiresApproval);
      if (result.success) {
        // Submit comment notes instructions if provided
        if (comment.trim()) {
           try {
             await vaultApi.postComment(result.id, comment.trim());
           } catch (cerr) {
             console.error("Failed to post initial comment instruction:", cerr);
           }
        }
        addToast("Asset successfully shared with the recipient!");
        onClose();
        onUploaded(result.id);
      } else {
        addToast("Upload failed. Please try again.", "error");
      }
    } catch (err) {
      const error = err as Error;
      addToast(error.message || "Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000050,
        backdropFilter: "blur(12px)",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end", // Push to right drawer align
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Left Area: Transparent Blur Preview/Dropzone ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          position: "relative",
          cursor: "pointer",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
         <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
           {!selectedFile ? (
             <div
               ref={dropZoneRef}
               onClick={() => fileInputRef.current?.click()}
               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={onDrop}
               style={{
                 width: "100%",
                 maxWidth: 600,
                 height: 320,
                 background: isDragging ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                 border: `3px dashed ${isDragging ? "#f07931" : "rgba(255,255,255,0.2)"}`,
                 borderRadius: 16,
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 cursor: "pointer",
                 transition: "all 0.2s",
                 backdropFilter: "blur(4px)",
                 color: "#fff",
               }}
             >
               <div style={{ textAlign: "center", pointerEvents: "none" }}>
                 <div style={{ marginBottom: 16 }}>
                   <Upload size={48} color={isDragging ? "#f07931" : "#fff"} />
                 </div>
                 <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 18 }}>
                   Click or Drag &amp; Drop
                 </p>
                 <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                   PDF, Word, AI, PSD or Images
                 </p>
               </div>
             </div>
           ) : (
             <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
               {renderPreview()}
             </div>
           )}
         </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="image/*,.pdf,.doc,.docx,.ai,.psd"
        onChange={onInputChange}
      />

      {/* ── Right Panel: Controls & Details ── */}
      <div
        style={{
          width: 420,
          background: "#ffffff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 50px rgba(0,0,0,0.1)",
          position: "relative",
          animation: "slideInRight 0.3s ease",
          borderLeft: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        {/* Header toolbar with close */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
          >
            <X size={16} />
          </button>
          <div style={{ paddingRight: 36 }}>
            <h4 style={{ margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 700 }}>Upload Asset</h4>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Order: {orderId}</p>
          </div>
        </div>

        {/* Form area details list scroll view */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column" }}>
          
          {selectedFile && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: 12, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                 <div style={{ fontSize: 24 }}>📄</div>
                 <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{selectedFile.name}</div>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                style={{ background: "#f1f5f9", border: "none", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#64748b" }}
              >
                Clear
              </button>
            </div>
          )}

          {/* Comment description */}
          <label style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 8, display: "block" }}>
             Instructions &amp; Notes
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add instructions or notes for the recipient..."
            style={{
              width: "100%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "12px",
              height: 100,
              color: "#334155",
              marginBottom: 20,
              fontSize: 13,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Approval check rules */}
          <label style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 8, display: "block" }}>
             Requires Customer Approval?
          </label>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#1e293b" }}>
              <input type="radio" name="vault-approval-new" checked={requiresApproval} onChange={() => setRequiresApproval(true)} />
              Yes
            </label>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#1e293b" }}>
              <input type="radio" name="vault-approval-new" checked={!requiresApproval} onChange={() => setRequiresApproval(false)} />
              No
            </label>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              style={{
                width: "100%",
                background: selectedFile && !isUploading ? "#0073aa" : "#cbd5e1",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isUploading ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} /> Share Resource
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discussion Modal (File Viewer + Chat) ────────────────────────────────────

interface DiscussionModalProps {
  orderId: string;
  initialAssetId?: number | null;
  onClose: () => void;
  addToast: (msg: string, type?: "success" | "error") => void;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

function DiscussionModal({ orderId, initialAssetId, onClose, addToast, isAdmin = true, onUpdate }: DiscussionModalProps) {
  const [assets, setAssets] = useState<VaultAsset[]>([]);
  const [activeAsset, setActiveAsset] = useState<VaultAsset | null>(null);
  const [comments, setComments] = useState<VaultComment[]>([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<VaultComment | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fileListOpen, setFileListOpen] = useState(true);
  const streamRef = useRef<HTMLDivElement>(null);
  const imgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoom(1);
  }, [activeAsset]);

  // Trackpad / Ctrl + Wheel Pinch to zoom at cursor position
  useEffect(() => {
    const el = imgWrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        
        // 1. Get cursor position inside scroll window
        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        // 2. Fetch current ratios inside scrollable area
        const xRatio = (el.scrollLeft + cursorX) / el.scrollWidth;
        const yRatio = (el.scrollTop + cursorY) / el.scrollHeight;

        setZoom((prev) => {
           const nextZoom = Math.min(4, Math.max(0.4, prev + delta));
           
           // Use setTimeout to wait for dimensions layout pass recalculation
           setTimeout(() => {
              if (el) {
                 el.scrollLeft = (xRatio * el.scrollWidth) - cursorX;
                 el.scrollTop = (yRatio * el.scrollHeight) - cursorY;
              }
           }, 0);

           return nextZoom;
        });
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Mobile pinch to zoom
  useEffect(() => {
    const el = imgWrapperRef.current;
    if (!el) return;

    let initialDist = 0;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        if (initialDist > 0) {
          const delta = dist - initialDist;
          setZoom((prev) => Math.min(3, Math.max(0.4, prev + (delta > 0 ? 0.05 : -0.05))));
        }
        initialDist = dist;
      }
    };

    const handleTouchEnd = () => { initialDist = 0; };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  const scrollToBottom = () => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  };

  const loadComments = useCallback(async (assetId: number) => {
    setIsLoadingComments(true);
    try {
      const data = await vaultApi.getComments(assetId);
      setComments(data);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Load comments error:", err);
      addToast("Failed to load comments.", "error");
    } finally {
      setIsLoadingComments(false);
    }
  }, [addToast]);

  const loadAsset = useCallback((asset: VaultAsset) => {
    setActiveAsset(asset);
    setReplyTo(null);
    loadComments(asset.id);
  }, [loadComments]);

  useEffect(() => {
    const load = async () => {
      setIsLoadingAssets(true);
      try {
        const data = await vaultApi.getAssets({ order_id: orderId });
        setAssets(data);
        if (data.length > 0) {
          const target = initialAssetId ? data.find((a) => a.id === initialAssetId) : null;
          loadAsset(target || data[0]);
        }
      } catch (err) {
        console.error("Load assets error:", err);
        addToast("Failed to load assets.", "error");
      } finally {
        setIsLoadingAssets(false);
      }
    };
    load();
  }, [orderId, initialAssetId, loadAsset, addToast]);

  const sendComment = async () => {
    if (!newComment.trim() || !activeAsset || isSending) return;
    setIsSending(true);
    try {
      await vaultApi.postComment(activeAsset.id, newComment.trim(), replyTo?.id);
      setNewComment("");
      setReplyTo(null);
      await loadComments(activeAsset.id);
    } catch (err) {
      console.error("Send comment error:", err);
      addToast("Failed to send message.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleApproval = async (status: "approved" | "rejected") => {
    if (!activeAsset) return;
    try {
      await vaultApi.postComment(activeAsset.id, `📢 Asset status changed to: ${status.toUpperCase()}`);
      const updated = { ...activeAsset, approval_status: status };
      setActiveAsset(updated as VaultAsset);
      setAssets((prev) => prev.map((a) => (a.id === activeAsset.id ? (updated as VaultAsset) : a)));
      await loadComments(activeAsset.id);
      addToast(`Asset ${status}.`);
    } catch {
      addToast("Failed to update approval.", "error");
    }
  };

  const renderFilePreview = () => {
    if (!activeAsset) return (
      <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
        <FileText size={60} />
        <p>Select a file to preview</p>
      </div>
    );
    const url = activeAsset.file_url;
    const name = activeAsset.file_name.toLowerCase();
    if (name.endsWith(".pdf")) {
      return <iframe src={url} title="pdf" style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />;
    }
    if (name.endsWith(".doc") || name.endsWith(".docx")) {
      const gView = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      return <iframe src={gView} title="doc" style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />;
    }
    if (name.endsWith(".psd") || name.endsWith(".ai")) {
      const photopeaUrl = `https://www.photopea.com/#${encodeURIComponent(url)}`;
      const icon = name.endsWith(".ai") ? "🎨" : "🖼️";
      return (
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 64 }}>{icon}</div>
          <h3 style={{ margin: "12px 0 8px" }}>{activeAsset.file_name}</h3>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>Professional design file</p>
          <a href={photopeaUrl} target="_blank" rel="noopener noreferrer"
            style={{ background: "#2eb67d", color: "#fff", padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
            Open Online Editor
          </a>
        </div>
      );
    }
    return (
      <img
        src={url}
        alt={activeAsset.file_name || "Asset image"}
        style={{
          width: `${100 * zoom}%`,
          height: "auto",
          maxWidth: "none",
          maxHeight: "none",
        }}
      />
    );
  };

  const renderApprovalBlock = () => {
    if (!activeAsset) return null;
    
    if (activeAsset.requires_approval && activeAsset.approval_status === "pending") {
      // Admins/Senders cannot execute approvals themselves
      if (isAdmin) return null;

      return (
        <div style={{ padding: "12px 20px", background: "rgba(240,121,49,0.1)", borderTop: "1px solid #f07931", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f07931" }}>⚡ Action Required</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleApproval("approved")}
              style={{ background: "#2eb67d", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircle size={14} /> Approve
            </button>
            <button
              onClick={() => handleApproval("rejected")}
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 6, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <XCircle size={14} /> Reject
            </button>
          </div>
        </div>
      );
    }
    if (activeAsset.approval_status === "approved" || activeAsset.approval_status === "rejected") {
      const isApproved = activeAsset.approval_status === "approved";
      return (
        <div style={{ padding: "10px 20px", background: isApproved ? "rgba(46,182,125,0.1)" : "rgba(220,38,38,0.1)", borderTop: `1px solid ${isApproved ? "#2eb67d" : "#dc2626"}`, textAlign: "center", fontSize: 13, fontWeight: 700, color: isApproved ? "#2eb67d" : "#dc2626" }}>
          {isApproved ? "✅ APPROVED" : "❌ REJECTED"}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000060,
        backdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
      }}
    >
      {/* ── Left Area: Transparent Preview ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: activeAsset?.file_name.toLowerCase().endsWith(".pdf") ? 0 : 40,
          position: "relative",
          cursor: "pointer"
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
         {/* Floating Zoom Controls for pictures */}
         {activeAsset && 
          !activeAsset.file_name.toLowerCase().endsWith(".pdf") && 
          !activeAsset.file_name.toLowerCase().endsWith(".doc") && 
          !activeAsset.file_name.toLowerCase().endsWith(".docx") && (
          <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 30, display: "flex", gap: 14, alignItems: "center", zIndex: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
             <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>-</button>
             <span style={{ color: "#fff", fontSize: 12, minWidth: 36, textAlign: "center", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>+</button>
             <button onClick={() => setZoom(1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", fontSize: 10, padding: "4px 8px", borderRadius: 15, fontWeight: 600 }}>Reset</button>
          </div>
         )}

         <div ref={imgWrapperRef} style={{ width: "100%", height: "100%", display: "flex", alignItems: zoom > 1 ? "flex-start" : "center", justifyContent: zoom > 1 ? "flex-start" : "center", cursor: "default", overflow: zoom > 1 ? "auto" : "hidden" }}>
           {isLoadingAssets ? (
              <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
                <p>Loading assets...</p>
              </div>
            ) : assets.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                <Upload size={50} />
                <p>No assets uploaded yet for this order.</p>
              </div>
            ) : renderFilePreview()}
         </div>
      </div>

      {/* ── Middle Area: File List Panel ── */}
      {assets.length > 1 && (
        <div style={{ position: "relative", height: "100%", zIndex: 10, flexShrink: 0 }}>
           {/* Collapse Toggle Arrow (Placed on the outer stack layer so absolute doesn't clip) */}
           <button 
             onClick={() => setFileListOpen(!fileListOpen)}
             style={{ position: "absolute", top: "50%", left: -12, transform: "translateY(-50%)", background: "#ffffff", border: "1px solid #cbd5e1", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000 }}
           >
              {fileListOpen ? <ChevronRight size={14} color="#334155" /> : <ChevronLeft size={14} color="#334155" />}
           </button>

           <div
             style={{
               width: fileListOpen ? 220 : 0,
               background: "rgba(15,23,42,0.9)",
               backdropFilter: "blur(12px)",
               borderLeft: "1px solid rgba(255,255,255,0.1)",
               borderRight: "1px solid #e2e8f0",
               height: "100%",
               display: "flex",
               flexDirection: "column",
               transition: "width 0.25s ease",
               overflow: "hidden",
             }}
           >
              <div style={{ padding: "20px 14px", flex: 1, overflowY: "auto" }}>
                 <h5 style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>
                    Order Files ({assets.length})
                 </h5>
                 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {assets.map((a) => {
                       const isActive = activeAsset?.id === a.id;
                       const name = a.file_name.toLowerCase();
                       const isImg = name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg");
                       const isDoc = name.endsWith(".doc") || name.endsWith(".docx");
                       const isPdf = name.endsWith(".pdf");
                       
                       return (
                           <div 
                             key={a.id}
                             onClick={() => {
                                setActiveAsset(a);
                                setZoom(1);
                                loadComments(a.id);
                             }}
                             style={{ padding: "10px 12px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", borderRadius: 10, cursor: "pointer", border: `1px solid ${isActive ? "rgba(255,255,255,0.2)" : "transparent"}`, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                             onMouseEnter={e => !isActive && (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                             onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
                           >
                              <span style={{ fontSize: 16, color: isActive ? "#38bdf8" : "rgba(255,255,255,0.6)", display: "flex", alignItems: "center" }}>
                                 {isImg ? <Image size={15} /> : isPdf || isDoc ? <FileText size={15} /> : <File size={15} />}
                              </span>
                              <span style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: isActive ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={a.file_name}>
                                 {a.file_name}
                              </span>
                           </div>
                       )
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── Right Panel: Details, Actions & Chat ── */}
      <div
        style={{
          width: 420,
          background: "#ffffff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 50px rgba(0,0,0,0.1)",
          position: "relative",
          animation: "slideInRight 0.3s ease",
          borderLeft: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        {/* Top Header with title and close */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, background: "#f1f5f9", border: "none", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
          >
            <X size={16} />
          </button>
          <div style={{ paddingRight: 36 }}>
            <h4 style={{ margin: 0, color: "#0f172a", fontSize: 16, fontWeight: 700, wordBreak: "break-all" }}>
              {activeAsset?.file_name || "Asset Details"}
            </h4>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Order ID: {orderId}</p>
          </div>
        </div>

        {/* Scrollable Container covering Actions, Approval & Comments */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          {/* 1. Approval Section */}
          {renderApprovalBlock()}

          {/* 2. Actions (Download & Delete) */}
          {activeAsset && (
            <div style={{ padding: "16px 24px", display: "flex", gap: 12, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
               <a
                 href={activeAsset.file_url}
                 download={activeAsset.file_name}
                 target="_blank"
                 rel="noopener noreferrer"
                 style={{ flex: 1, background: "#0ea5e9", color: "#fff", textDecoration: "none", padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600, fontSize: 13 }}
               >
                 <Download size={15} /> Download
               </a>

               {isAdmin && (
                 <button
                   style={{ flex: 1, background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 600, fontSize: 13 }}
                   onClick={async () => {
                     if (!activeAsset || !confirm("Permanently delete this asset?")) return;
                     try {
                       await fetch(`/api/vault/assets/${activeAsset.id}`, { method: "DELETE" });
                       const remaining = assets.filter((a) => a.id !== activeAsset.id);
                       setAssets(remaining);
                       
                       if (remaining.length === 0) {
                         onClose();
                         addToast("Asset deleted.");
                         onUpdate?.();
                         if (typeof window !== "undefined") {
                           window.dispatchEvent(new CustomEvent("vault:files-updated", { detail: { orderId } }));
                         }
                         return;
                       }

                       setActiveAsset(remaining[0] || null);
                       if (remaining[0]) loadComments(remaining[0].id);
                       addToast("Asset deleted.");
                       onUpdate?.();
                       if (typeof window !== "undefined") {
                         window.dispatchEvent(new CustomEvent("vault:files-updated", { detail: { orderId } }));
                       }
                     } catch { addToast("Delete failed.", "error"); }
                   }}
                 >
                   <Trash2 size={15} /> Delete
                 </button>
               )}
            </div>
          )}

          {/* 3. Comments Title */}
          <div style={{ padding: "12px 24px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: "#334155", fontSize: 13, background: "#f8fafc" }}>
            Discussion &amp; Logs
          </div>

          {/* 4. Messages Stream */}
          <div ref={streamRef} style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
            {isLoadingComments ? (
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ height: 48, background: "#f1f5f9", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "30px 20px", fontSize: 13 }}>
                No messages yet. Start the discussion!
              </p>
            ) : (
              comments.map((c) => {
                const isSystem = c.comment.includes("📢");
                const parentComment = c.reply_to_id ? comments.find((x) => x.id === c.reply_to_id) : null;
                const initials = c.display_name ? c.display_name.charAt(0).toUpperCase() : "?";
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 24px",
                      borderBottom: "1px solid #f1f5f9",
                      background: isSystem ? "#fffbeb" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isSystem ? "#f59e0b" : "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {isSystem ? "⚙" : initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{c.display_name}</span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{formatTime(c.timestamp)}</span>
                      </div>
                      {parentComment && (
                        <div
                          style={{
                            background: "#f8fafc",
                            borderLeft: "3px solid #0ea5e9",
                            padding: "6px 10px",
                            borderRadius: 4,
                            marginBottom: 6,
                            fontSize: 12,
                            color: "#475569",
                          }}
                        >
                          <strong style={{ color: "#000", display: "block", fontSize: 11 }}>@{parentComment.display_name}</strong>
                          <span style={{ fontStyle: "italic" }}>"{parentComment.comment.slice(0, 60)}{parentComment.comment.length > 60 ? "…" : ""}"</span>
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, wordBreak: "break-word" }}>{c.comment}</div>
                    </div>
                    {!isSystem && (
                      <button
                        onClick={() => setReplyTo(c)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11, padding: "4px", flexShrink: 0 }}
                        title="Reply"
                      >
                        <CornerUpLeft size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 5. Input area */}
          <div style={{ padding: "16px 24px", flexShrink: 0, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
            {replyTo && (
              <div style={{ background: "#f0f9ff", borderLeft: "3px solid #0ea5e9", padding: "6px 10px", borderRadius: 4, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#0369a1" }}>Replying to {replyTo.display_name}…</span>
                <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            )}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px", border: "1px solid #e2e8f0" }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                placeholder="Write a comment..."
                rows={2}
                style={{ background: "none", border: "none", color: "#1e293b", width: "100%", outline: "none", fontSize: 13, resize: "none", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={sendComment}
                  disabled={!newComment.trim() || isSending}
                  style={{
                    background: newComment.trim() ? "#0f172a" : "#cbd5e1",
                    color: "#fff",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: newComment.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <Send size={13} /> {isSending ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0.9; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ─── Main Exported Component ───────────────────────────────────────────────────

interface AssetVaultProps {
  orderId: string;
  customerId: number;
  isAdmin?: boolean;
  mode?: "upload" | "discuss" | "button";
  targetAssetId?: number;
  /** Optional close callback — used when the parent controls visibility */
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function AssetVault({
  orderId,
  customerId,
  isAdmin = true,
  mode = "button",
  targetAssetId,
  onClose: externalOnClose,
  onUpdate,
}: AssetVaultProps) {
  const [showUpload, setShowUpload] = useState(mode === "upload");
  const [showDiscuss, setShowDiscuss] = useState(mode === "discuss");
  const [pendingAssetId, setPendingAssetId] = useState<number | null>(targetAssetId ?? null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (msg: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleUploaded = (assetId: number) => {
    setPendingAssetId(assetId);
    setShowDiscuss(true);
    onUpdate?.();
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vault:files-updated", { detail: { orderId } }));
    }
  };

  const handleDiscussClose = () => {
    setShowDiscuss(false);
    setPendingAssetId(null);
    externalOnClose?.();
  };

  return (
    <>
      {/* Inline button (mode="button") */}
      {mode === "button" && (
        <button
          onClick={() => setShowUpload(true)}
          style={{
            background: "#0073aa",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: 4,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Upload files
        </button>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          orderId={orderId}
          customerId={customerId}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          addToast={addToast}
        />
      )}

      {/* Discussion Modal */}
      {showDiscuss && (
        <DiscussionModal
          orderId={orderId}
          initialAssetId={pendingAssetId}
          onClose={handleDiscussClose}
          addToast={addToast}
          isAdmin={isAdmin}
          onUpdate={onUpdate}
        />
      )}

      {/* Toasts */}
      <Toast items={toasts} />
    </>
  );
}
