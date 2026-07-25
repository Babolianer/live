"use client";

import { useActionState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import {
  uploadDocumentAction,
  type UploadFormState,
} from "@/lib/actions/document-actions";
import { Button } from "@/components/ui/button";

export function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<UploadFormState, FormData>(
    async (prevState, formData) => {
      const result = await uploadDocumentAction(prevState, formData);
      if (!result?.error) {
        formRef.current?.reset();
      }
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <label
        htmlFor="file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-life border-2 border-dashed border-border bg-surface-muted px-4 py-8 text-center transition-colors hover:border-accent"
      >
        <UploadCloud className="text-accent" size={26} />
        <span className="text-sm font-medium">
          Datei auswählen oder hierher ziehen
        </span>
        <span className="text-xs text-foreground-muted">
          PDF, PNG, JPEG oder WEBP · max. 15 MB
        </span>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
      </label>

      {pending && (
        <p className="text-sm text-foreground-muted">Wird hochgeladen…</p>
      )}
      {state?.error && (
        <p className="rounded-life bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={pending} className="hidden">
        Hochladen
      </Button>
    </form>
  );
}
