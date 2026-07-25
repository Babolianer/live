"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowUp, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createConversationAction } from "@/lib/actions/ai-conversation-actions";
import { uploadChatAttachmentAction } from "@/lib/actions/document-actions";
import { VoiceInputButton } from "@/components/voice/voice-input-button";

export function HomeChatStarter() {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<{ id: string; name: string; mimeType: string } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadChatAttachmentAction(formData);
    setUploading(false);

    if ("error" in result) {
      setUploadError(result.error);
      return;
    }
    setAttachment({ id: result.id, name: result.original_name, mimeType: result.mime_type });
  }

  function start() {
    const text = value.trim();
    if ((!text && !attachment) || isPending) return;
    startTransition(async () => {
      const id = await createConversationAction();
      const params = new URLSearchParams();
      if (text) params.set("q", text);
      if (attachment) {
        params.set("attachmentId", attachment.id);
        params.set("attachmentName", attachment.name);
        params.set("attachmentMime", attachment.mimeType);
      }
      router.push(`/ai/${id}?${params.toString()}`);
    });
  }

  return (
    <Card className="bg-accent text-accent-foreground">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="font-heading font-semibold">Ask LIFE</p>
          <p className="text-sm opacity-90">Frag mich etwas, sprich oder häng ein Dokument an.</p>
        </div>
      </div>

      {uploadError && (
        <p className="mb-2 rounded-life bg-black/15 px-3.5 py-2 text-sm">{uploadError}</p>
      )}

      {attachment && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs">
            {attachment.mimeType.startsWith("image/") ? (
              <ImageIcon size={12} />
            ) : (
              <FileText size={12} />
            )}
            {attachment.name}
            <button onClick={() => setAttachment(null)} aria-label="Anhang entfernen">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-life bg-white/10 p-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Datei anhängen"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent-foreground hover:bg-white/20 disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>
        <VoiceInputButton
          onResult={setValue}
          className="text-accent-foreground hover:bg-white/20"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              start();
            }
          }}
          placeholder={uploading ? "Datei wird hochgeladen…" : "z. B. „Leg mir meinen Stromvertrag an“"}
          className="flex-1 bg-transparent px-2 py-2 text-sm text-accent-foreground placeholder-accent-foreground/60 outline-none"
        />
        <button
          onClick={start}
          disabled={isPending || uploading || (!value.trim() && !attachment)}
          aria-label="Chat starten"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-accent-foreground disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </Card>
  );
}
