"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Sparkles,
  ArrowUp,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import { uploadChatAttachmentAction } from "@/lib/actions/document-actions";
import { VoiceInputButton } from "@/components/voice/voice-input-button";
import { ContractProposalCard } from "@/components/ai/contract-proposal-card";
import { GoalProposalCard } from "@/components/ai/goal-proposal-card";
import { WealthProposalCard } from "@/components/ai/wealth-proposal-card";
import { VehicleProposalCard } from "@/components/ai/vehicle-proposal-card";
import { PropertyProposalCard } from "@/components/ai/property-proposal-card";
import { HealthProposalCard } from "@/components/ai/health-proposal-card";
import { DeleteProposalCard } from "@/components/ai/delete-proposal-card";
import { ThinkingIndicator } from "@/components/ai/thinking-indicator";
import type { AiMessageRow, MessageAttachment } from "@/lib/ai-messages";

// Every "propose_*"/update/delete tool result renders through this map — add
// one entry here (matching the `proposalType` used server-side) to support a
// new kind. Update proposals reuse the same card as create (an `id` in the
// data switches the card into update mode).
const PROPOSAL_CARDS: Record<string, ComponentType<{ proposal: never }>> = {
  contract_proposal: ContractProposalCard,
  goal_proposal: GoalProposalCard,
  wealth_proposal: WealthProposalCard,
  vehicle_proposal: VehicleProposalCard,
  property_proposal: PropertyProposalCard,
  health_proposal: HealthProposalCard,
  delete_proposal: DeleteProposalCard,
};

type Proposal = { type: string; data: unknown };

type Message = {
  role: "user" | "assistant";
  text: string;
  attachments: MessageAttachment[];
  proposal?: Proposal;
};

function parseAssistantContent(raw: string): { text: string; proposal?: Proposal } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      if (parsed.type === "text") return { text: parsed.text ?? "" };
      return { text: parsed.text ?? "", proposal: { type: parsed.type, data: parsed.proposal } };
    }
  } catch {
    // pre-existing plain-text messages from before structured content existed
  }
  return { text: raw };
}

function rowToMessage(row: AiMessageRow): Message {
  const attachments = row.attachments ? JSON.parse(row.attachments) : [];
  if (row.role === "user") {
    return { role: "user", text: row.content, attachments };
  }
  const { text, proposal } = parseAssistantContent(row.content);
  return { role: "assistant", text, attachments: [], proposal };
}

export function Chat({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: AiMessageRow[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.map(rowToMessage));
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const autoSentRef = useRef(false);

  // Runs before paint so the initial render already sits at the bottom —
  // no visible jump-down after the messages first show up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isNearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowJumpButton(!nearBottom);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    isNearBottomRef.current = true;
    setShowJumpButton(false);
  }

  useEffect(() => {
    const initialQuery = searchParams.get("q") ?? "";
    const attachmentId = searchParams.get("attachmentId");
    const attachmentName = searchParams.get("attachmentName");
    const attachmentMime = searchParams.get("attachmentMime");
    if ((!initialQuery && !attachmentId) || autoSentRef.current) return;
    autoSentRef.current = true;
    router.replace(pathname);
    const initialAttachments: MessageAttachment[] =
      attachmentId && attachmentName && attachmentMime
        ? [{ documentId: attachmentId, name: attachmentName, mimeType: attachmentMime }]
        : [];
    send(initialQuery, initialAttachments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setPendingAttachments((prev) => [
      ...prev,
      { documentId: result.id, name: result.original_name, mimeType: result.mime_type },
    ]);
  }

  async function send(overrideText?: string, overrideAttachments?: MessageAttachment[]) {
    const text = (overrideText ?? input).trim();
    const attachments = overrideAttachments ?? pendingAttachments;
    if (!text && attachments.length === 0) return;
    if (sending) return;

    setInput("");
    setPendingAttachments([]);
    setSending(true);
    isNearBottomRef.current = true;
    setShowJumpButton(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", text, attachments },
      { role: "assistant", text: "", attachments: [] },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          attachmentDocumentIds: attachments.map((a) => a.documentId),
        }),
      });
      const data = await res.json();

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] =
          data.type && data.type !== "text"
            ? {
                role: "assistant",
                text: data.text,
                attachments: [],
                proposal: { type: data.type, data: data.proposal },
              }
            : { role: "assistant", text: data.text || data.error || "…", attachments: [] };
        return next;
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          text: "⚠️ Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.",
          attachments: [],
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-1 flex-col md:h-[calc(100vh-4rem)]">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full space-y-3 overflow-y-auto pb-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-foreground-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Sparkles size={24} />
              </div>
              <p className="max-w-xs text-sm">
                Frag LIFE etwas oder lade ein Dokument/Foto hoch — z. B. &quot;Leg mir meinen
                Stromvertrag an&quot;.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={clsx("max-w-[85%]", m.proposal ? "w-full" : "")}>
                {m.attachments.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
                    {m.attachments.map((a) => (
                      <span
                        key={a.documentId}
                        className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground-muted"
                      >
                        {a.mimeType.startsWith("image/") ? (
                          <ImageIcon size={12} />
                        ) : (
                          <FileText size={12} />
                        )}
                        {a.name}
                      </span>
                    ))}
                  </div>
                )}
                {m.text ? (
                  <div
                    className={clsx(
                      "whitespace-pre-wrap rounded-life px-4 py-2.5 text-sm",
                      m.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-muted text-foreground"
                    )}
                  >
                    {m.text}
                  </div>
                ) : (
                  sending &&
                  i === messages.length - 1 &&
                  m.role === "assistant" && (
                    <ThinkingIndicator hasAttachment={(messages[i - 1]?.attachments.length ?? 0) > 0} />
                  )
                )}
                {m.proposal &&
                  (() => {
                    const ProposalCard = PROPOSAL_CARDS[m.proposal.type];
                    if (!ProposalCard) return null;
                    return (
                      <div className="mt-2">
                        <ProposalCard proposal={m.proposal.data as never} />
                      </div>
                    );
                  })()}
              </div>
            </div>
          ))}
        </div>
        {showJumpButton && (
          <button
            onClick={scrollToBottom}
            aria-label="Nach unten springen"
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted shadow-md hover:bg-surface-muted"
          >
            <ChevronDown size={14} /> Nach unten
          </button>
        )}
      </div>

      {uploadError && (
        <p className="mb-2 rounded-life bg-danger/10 px-3.5 py-2 text-sm text-danger">
          {uploadError}
        </p>
      )}

      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {pendingAttachments.map((a) => (
            <span
              key={a.documentId}
              className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs"
            >
              {a.mimeType.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
              {a.name}
              <button
                onClick={() =>
                  setPendingAttachments((prev) => prev.filter((p) => p.documentId !== a.documentId))
                }
                aria-label="Anhang entfernen"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-life border border-border bg-surface p-2">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-muted disabled:opacity-50"
        >
          <Paperclip size={18} />
        </button>
        <VoiceInputButton onResult={setInput} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={uploading ? "Datei wird hochgeladen…" : "Frag LIFE…"}
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button
          onClick={() => send()}
          disabled={sending || uploading || (!input.trim() && pendingAttachments.length === 0)}
          aria-label="Senden"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
