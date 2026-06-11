"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { resolveImg } from "@/lib/utils";
import { API_BASE } from "@/lib/config";


function getToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("auth_token") ?? "";
}

interface AttachmentDetailsModalProps {
  imageUrl: string;
  imageId?: string;
  initialTitle?: string;
  initialAltText?: string;
  initialDescription?: string;
  onClose: () => void;
  onSaved?: (data: { title: string; altText: string; description: string }) => void;
}

export default function AttachmentDetailsModal({
  imageUrl,
  imageId,
  initialTitle = "",
  initialAltText = "",
  initialDescription = "",
  onClose,
  onSaved,
}: AttachmentDetailsModalProps) {
  const resolved = resolveImg(imageUrl);
  const filenameTitle = resolved.split("/").pop()?.split("?")[0]?.replace(/\.[^/.]+$/, "") ?? "";

  const [form, setForm] = useState({
    title: initialTitle || filenameTitle,
    altText: initialAltText,
    description: initialDescription,
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(resolved).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = async () => {
    if (!imageId) {
      onSaved?.(form);
      onClose();
      return;
    }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("imageId", imageId);
      fd.append("title", form.title.trim());
      fd.append("altText", form.altText.trim());
      fd.append("description", form.description.trim());
      await fetch(`${API_BASE}/image`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "x-app-client": "ADMIN_PANEL" },
        body: fd,
      });
      onSaved?.(form);
      onClose();
    } catch {
      // silently close
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
        {/* Content — centered via inline styles, no Tailwind transform classes */}
        <DialogPrimitive.Content
          onInteractOutside={onClose}
          onEscapeKeyDown={onClose}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 201,
            width: "calc(100vw - 32px)",
            maxWidth: "768px",
            maxHeight: "80vh",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{ flexShrink: 0, padding: "12px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Attachment details</span>
            <button
              type="button"
              onClick={onClose}
              style={{ width: 24, height: 24, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ display: "flex", overflow: "hidden", maxHeight: "calc(80vh - 112px)" }}>

            {/* Left — image */}
            <div style={{ width: "42%", flexShrink: 0, backgroundColor: "#f5f6f8", borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", gap: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolved}
                alt={form.altText || "Attachment"}
                style={{ maxWidth: "100%", maxHeight: "42vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
              />
              <p style={{ fontSize: "10px", color: "#9ca3af", textAlign: "center", wordBreak: "break-all", lineHeight: 1.5, width: "100%" }}>
                {resolved.split("/").pop()?.split("?")[0] ?? ""}
              </p>
            </div>

            {/* Right — fields + footer */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
              {/* Scrollable fields */}
              <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alternative Text</label>
                  <input
                    type="text"
                    value={form.altText}
                    onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
                    placeholder="Describe the image…"
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1a2b6b"; e.target.style.boxShadow = "0 0 0 3px rgba(26,43,107,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                  <span style={{ fontSize: "10px", color: "#9ca3af" }}>Leave empty if purely decorative.</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Image title…"
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1a2b6b"; e.target.style.boxShadow = "0 0 0 3px rgba(26,43,107,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Add a caption or longer description…"
                    rows={2}
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "14px", color: "#1f2937", outline: "none", resize: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#1a2b6b"; e.target.style.boxShadow = "0 0 0 3px rgba(26,43,107,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>File URL</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                    <span style={{ flex: 1, fontSize: "11px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{resolved}</span>
                    <button
                      type="button"
                      onClick={copyUrl}
                      style={{ flexShrink: 0, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", fontWeight: 500, border: copied ? "1px solid #bbf7d0" : "1px solid #e5e7eb", backgroundColor: copied ? "#f0fdf4" : "#fff", color: copied ? "#16a34a" : "#4b5563", cursor: "pointer" }}
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Sticky footer */}
              <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: "1px solid #f3f4f6", backgroundColor: "#fff", display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ flex: 1, height: "36px", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: "#4b5563", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, height: "36px", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, color: "#fff", backgroundColor: saving ? "#6b7280" : "#1a2b6b", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {saving ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Saving…</> : "Save Details"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
