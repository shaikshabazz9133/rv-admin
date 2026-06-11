"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { resolveImg } from "@/lib/utils";

const API_BASE = "https://dev-backend.rvadventureaustralia.com.au/api";

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
  const [form, setForm] = useState({
    title: initialTitle,
    altText: initialAltText,
    description: initialDescription,
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const resolved = resolveImg(imageUrl);

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
      if (form.title.trim()) fd.append("title", form.title.trim());
      if (form.altText.trim()) fd.append("altText", form.altText.trim());
      if (form.description.trim()) fd.append("description", form.description.trim());
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[82vh] min-h-[540px] overflow-hidden ring-1 ring-black/5">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Attachment details</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left — image */}
          <div className="w-[45%] bg-[#f5f6f8] border-r border-gray-100 flex flex-col items-center justify-center p-6 gap-3 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolved}
              alt={form.altText || "Attachment"}
              className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-sm"
            />
            <p className="text-[10px] text-gray-400 text-center break-all leading-relaxed w-full">
              {resolved.split("/").pop()?.split("?")[0] ?? ""}
            </p>
          </div>

          {/* Right — fields + footer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Alternative Text</label>
                <input
                  type="text"
                  value={form.altText}
                  onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
                  placeholder="Describe the image…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
                <p className="text-[11px] text-gray-400">Leave empty if the image is purely decorative.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Image title…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Add a caption or longer description…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a2b6b]/20 focus:border-[#1a2b6b] transition-colors resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">File URL</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="flex-1 text-xs text-gray-500 truncate font-mono">{resolved}</span>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-md font-medium border transition-all ${copied ? "bg-green-50 text-green-600 border-green-200" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a2b6b]/40 hover:text-[#1a2b6b]"}`}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>

            </div>

            {/* Sticky footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 bg-[#1a2b6b] hover:bg-[#142258] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                  ) : (
                    "Save Details"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
