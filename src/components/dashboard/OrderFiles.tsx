"use client";

import React from "react";
import AssetVault from "@/components/AssetVault";

interface WpAsset {
  id: number;
  file_url: string;
  file_name: string;
  order_id: string;
  approval_status: string;
  requires_approval: number;
}

export function OrderFilesPreview({
  orderId,
  hideEmptyState = false,
  uploadButton,
}: {
  orderId: string;
  hideEmptyState?: boolean;
  uploadButton?: React.ReactNode;
}) {
  const [assets, setAssets] = React.useState<WpAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openAssetId, setOpenAssetId] = React.useState<number | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/vault/assets?order_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => b.id - a.id) : [];
        setAssets(sorted);
        setLoading(false);
      })
      .catch(() => { setAssets([]); setLoading(false); });
  }, [orderId, refreshKey]);

  React.useEffect(() => {
    if (!orderId) return;
    const handleUpdate = (e: CustomEvent) => {
      if (e.detail?.orderId === orderId) {
        setRefreshKey(prev => prev + 1);
      }
    };
    window.addEventListener("vault:files-updated" as any, handleUpdate as any);
    return () => window.removeEventListener("vault:files-updated" as any, handleUpdate as any);
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 8, margin: '8px 0', width: "100%" }}>
        {[1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 68, borderRadius: 8, background: '#f8fafc', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const hasAssets = assets.length > 0;

  return (
    <>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', width: '100%' }}>
         <div className="order-files-preview" style={{ flex: 1, display: 'flex', overflowX: 'auto', gap: 12, alignItems: 'center', minHeight: 80, flexWrap: 'nowrap', padding: "5px 2px" }}>
           {!hasAssets && !hideEmptyState && (
              <p style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', margin: 0, flexShrink: 0 }}>No files uploaded yet.</p>
           )}
           
           {assets.map(file => {
          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.file_url);
          return (
            <div
              key={file.id}
              className="asset-horizontal-card"
              onClick={() => setOpenAssetId(file.id)}
              style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 10, cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,.05)', width: '100%', maxWidth: 250 }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 6, overflow: 'hidden', background: '#f0f2f5', flexShrink: 0, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isImage
                  ? <img src={file.file_url} alt={file.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 10, color: '#666', fontWeight: 'bold' }}>DOC</span>
                }
              </div>
              <div style={{ flexGrow: 1, padding: '0 12px', overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1a2b3c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                  {file.file_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#777' }}>Click to view</span>
                </div>
              </div>
              <div style={{ color: '#ccc', fontSize: 18, paddingRight: 5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
            </div>
          );
        })}
         </div>

         {uploadButton && (
            <div style={{ flexShrink: 0 }}>
               {uploadButton}
            </div>
         )}
      </div>
      {openAssetId !== null && (
        <AssetVault
          orderId={orderId}
          customerId={0}
          isAdmin={true}
          mode="discuss"
          targetAssetId={openAssetId}
          onClose={() => setOpenAssetId(null)}
          onUpdate={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </>
  );
}

export function ViewFilesButton({ orderId, customerId }: { orderId: string; customerId: number }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        className="upload-btn"
        style={{ marginLeft: 8 }}
        onClick={() => setOpen(true)}
      >
        📂 View Files
      </button>
      {open && (
        <AssetVault
          orderId={orderId}
          customerId={customerId}
          isAdmin={true}
          mode="discuss"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
