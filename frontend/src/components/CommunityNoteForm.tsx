import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Eye, Edit3 } from "lucide-react";
import {
  createCommunityNote,
  updateCommunityNote,
  NOTE_TYPE_OPTIONS,
  SPOILER_LEVEL_OPTIONS,
  type CommunityNote,
  type CommunityNoteCreate,
  type NoteType,
  type SpoilerLevel,
  type NoteVisibility,
} from "@/api/communityNotes";

interface CommunityNoteFormProps {
  productSlug: string;
  existingNote?: CommunityNote;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CommunityNoteForm({
  productSlug,
  existingNote,
  onSuccess,
  onCancel,
}: CommunityNoteFormProps) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const [noteType, setNoteType] = useState<NoteType>(
    existingNote?.note_type || "prep_tip"
  );
  const [title, setTitle] = useState(existingNote?.title || "");
  const [content, setContent] = useState(existingNote?.content || "");
  const [spoilerLevel, setSpoilerLevel] = useState<SpoilerLevel>(
    existingNote?.spoiler_level || "none"
  );
  const [visibility, setVisibility] = useState<NoteVisibility>(
    existingNote?.visibility || "public"
  );

  const createMutation = useMutation({
    mutationFn: (data: CommunityNoteCreate) =>
      createCommunityNote(productSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["communityNotes", productSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["adventureRun", productSlug],
      });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CommunityNoteCreate>) =>
      updateCommunityNote(existingNote!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["communityNotes", productSlug],
      });
      onSuccess();
    },
  });

  const mutation = existingNote ? updateMutation : createMutation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      note_type: noteType,
      title: title.trim(),
      content: content.trim(),
      spoiler_level: spoilerLevel,
      visibility,
    };

    mutation.mutate(data);
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-medium text-codex-ink">
          {existingNote ? "Edit Note" : "Add GM Note"}
        </h3>
        <button
          onClick={onCancel}
          className="text-codex-brown/60 hover:text-codex-ink"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-codex-ink mb-2">
            Note Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {NOTE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNoteType(option.value)}
                className={`p-2 text-left border rounded transition-colors ${
                  noteType === option.value
                    ? "bg-codex-olive/10 border-codex-olive"
                    : "bg-white border-codex-brown/20 hover:bg-codex-tan/30"
                }`}
              >
                <span className="block text-sm font-medium text-codex-ink">
                  {option.label}
                </span>
                <span className="block text-xs text-codex-brown/60">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="note-title"
            className="block text-sm font-medium text-codex-ink mb-1"
          >
            Title
          </label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your note"
            className="input w-full"
            maxLength={255}
            required
          />
          <p className="text-xs text-codex-brown/50 mt-1">
            {title.length}/255 characters
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="note-content"
              className="block text-sm font-medium text-codex-ink"
            >
              Content
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-codex-brown/60 hover:text-codex-ink flex items-center gap-1"
            >
              {showPreview ? (
                <>
                  <Edit3 className="w-3 h-3" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Preview
                </>
              )}
            </button>
          </div>
          {showPreview ? (
            <div className="input w-full min-h-[120px] whitespace-pre-wrap bg-codex-cream/50">
              {content || (
                <span className="text-codex-brown/40">Nothing to preview</span>
              )}
            </div>
          ) : (
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your GM wisdom... (Markdown supported)"
              className="input w-full min-h-[120px]"
              maxLength={20000}
              required
            />
          )}
          <p className="text-xs text-codex-brown/50 mt-1">
            {content.length}/20,000 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-codex-ink mb-2">
            Spoiler Level
          </label>
          <div className="flex flex-wrap gap-2">
            {SPOILER_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSpoilerLevel(option.value)}
                className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                  spoilerLevel === option.value
                    ? option.color === "green"
                      ? "bg-green-100 border-green-300 text-green-800"
                      : option.color === "yellow"
                      ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                      : option.color === "orange"
                      ? "bg-orange-100 border-orange-300 text-orange-800"
                      : "bg-red-100 border-red-300 text-red-800"
                    : "bg-white border-codex-brown/20 text-codex-brown/70 hover:bg-codex-tan/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-codex-ink mb-2">
            Attribution
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                className="text-codex-olive focus:ring-codex-olive"
              />
              <span className="text-sm text-codex-brown">
                Show my name
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={visibility === "anonymous"}
                onChange={() => setVisibility("anonymous")}
                className="text-codex-olive focus:ring-codex-olive"
              />
              <span className="text-sm text-codex-brown">
                Post anonymously
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={!isValid || mutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : existingNote ? (
              "Update Note"
            ) : (
              "Share Note"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost"
            disabled={mutation.isPending}
          >
            Cancel
          </button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            Failed to save note. Please try again.
          </p>
        )}
      </form>
    </div>
  );
}
