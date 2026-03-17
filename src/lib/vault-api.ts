/**
 * vault-api.ts — Typed client helpers for the Vault REST API proxy routes.
 *
 * All requests go through Next.js API routes (/api/vault/*) which in turn
 * proxy to WordPress using server-side credentials, so NO token or password
 * is ever exposed to the browser.
 *
 * Usage:
 *   import { vaultApi } from '@/lib/vault-api';
 *   const assets = await vaultApi.getAssets({ order_id: 'SO-123' });
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type VaultAsset = {
  id: number;
  order_id: string;
  customer_user_id: number;
  file_url: string;
  file_name: string;
  user_id: number;
  requires_approval: 0 | 1;
  approval_status: 'pending' | 'approved' | 'rejected' | 'not_required';
  timestamp: string;
};

export type VaultComment = {
  id: number;
  asset_id: number;
  user_id: number;
  comment: string;
  reply_to_id: number | null;
  timestamp: string;
  display_name: string;
};

export type UploadAssetResult = {
  success: boolean;
  id: number;
  url: string;
};

export type PostCommentResult = {
  success: boolean;
  id: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || `Request failed with status ${res.status}`
    );
  }
  return data as T;
}

// ─── Vault API Client ─────────────────────────────────────────────────────────

export const vaultApi = {
  /**
   * List assets, optionally filtered.
   *
   * @param filters  One or more of: order_id, customer_id, user_id
   *
   * @example
   *   // All assets for a Jira/Sales order
   *   const assets = await vaultApi.getAssets({ order_id: 'SO-4567' });
   *
   *   // All assets uploaded for a specific WordPress customer user
   *   const assets = await vaultApi.getAssets({ customer_id: 42 });
   */
  async getAssets(filters: {
    order_id?: string;
    customer_id?: number;
    user_id?: number;
  } = {}): Promise<VaultAsset[]> {
    const params = new URLSearchParams();
    if (filters.order_id)    params.set('order_id',    filters.order_id);
    if (filters.customer_id) params.set('customer_id', String(filters.customer_id));
    if (filters.user_id)     params.set('user_id',     String(filters.user_id));

    const res = await fetch(`/api/vault/assets?${params.toString()}`, {
      cache: 'no-store',
    });
    return parseResponse<VaultAsset[]>(res);
  },

  /**
   * Upload a file as a new vault asset.
   *
   * @param file               The File object from an <input type="file"> or drag-drop
   * @param order_id           The Sales Order / Jira order ID to attach to
   * @param customer_id        WordPress user ID of the customer
   * @param requires_approval  Whether the customer must approve the file
   *
   * @example
   *   const result = await vaultApi.uploadAsset(file, 'SO-1234', 42, true);
   *   console.log('New asset ID:', result.id);
   */
  async uploadAsset(
    file: File,
    order_id: string,
    customer_id: number,
    requires_approval = false
  ): Promise<UploadAssetResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('order_id', order_id);
    formData.append('customer_id', String(customer_id));
    formData.append('requires_approval', requires_approval ? 'true' : 'false');

    const res = await fetch('/api/vault/assets', {
      method: 'POST',
      body: formData,
      // NOTE: Do NOT set Content-Type header — the browser sets it automatically
      // with the correct multipart/form-data boundary for file uploads.
    });
    return parseResponse<UploadAssetResult>(res);
  },

  /**
   * Fetch all comments for a specific asset.
   *
   * @param assetId  The vault asset ID
   *
   * @example
   *   const comments = await vaultApi.getComments(17);
   */
  async getComments(assetId: number): Promise<VaultComment[]> {
    const res = await fetch(`/api/vault/assets/${assetId}/comments`, {
      cache: 'no-store',
    });
    return parseResponse<VaultComment[]>(res);
  },

  /**
   * Post a new comment (or reply) on an asset.
   *
   * @param asset_id     The vault asset to comment on
   * @param comment      The message text
   * @param reply_to_id  Optional: ID of the comment being replied to
   *
   * @example
   *   await vaultApi.postComment(17, 'Looks great, approved!');
   *   await vaultApi.postComment(17, 'Agree with above', 31); // reply
   */
  async postComment(
    asset_id: number,
    comment: string,
    reply_to_id?: number
  ): Promise<PostCommentResult> {
    const body: Record<string, unknown> = { asset_id, comment };
    if (reply_to_id !== undefined) body.reply_to_id = reply_to_id;

    const res = await fetch('/api/vault/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parseResponse<PostCommentResult>(res);
  },
};
