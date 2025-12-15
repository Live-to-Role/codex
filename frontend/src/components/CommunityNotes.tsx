import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquarePlus,
  Filter,
  SortAsc,
  Loader2,
  FileText,
  LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProductCommunityNotes,
  getProductAdventureRun,
  NOTE_TYPE_OPTIONS,
  type CommunityNote,
  type SpoilerLevel,
  type NoteType,
} from "@/api/communityNotes";
import { CommunityNoteCard } from "./CommunityNoteCard";
import { CommunityNoteForm } from "./CommunityNoteForm";

interface CommunityNotesProps {
  productSlug: string;
}

type SortOption = "most_votes" | "least_votes" | "newest" | "oldest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "most_votes", label: "Most Helpful" },
  { value: "least_votes", label: "Least Votes" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export function CommunityNotes({ productSlug }: CommunityNotesProps) {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<CommunityNote | null>(null);
  const [spoilerMax, setSpoilerMax] = useState<SpoilerLevel>("endgame");
  const [noteTypeFilter, setNoteTypeFilter] = useState<NoteType | "">("");
  const [sort, setSort] = useState<SortOption>("most_votes");
  const [page, setPage] = useState(1);

  const { data: adventureRun } = useQuery({
    queryKey: ["adventureRun", productSlug],
    queryFn: () => getProductAdventureRun(productSlug),
    enabled: isAuthenticated,
  });

  const { data: notesData, isLoading } = useQuery({
    queryKey: [
      "communityNotes",
      productSlug,
      { spoilerMax, noteTypeFilter, sort, page },
    ],
    queryFn: () =>
      getProductCommunityNotes(productSlug, {
        spoiler_max: spoilerMax,
        note_type: noteTypeFilter || undefined,
        sort,
        page,
        per_page: 20,
      }),
  });

  const handleEditNote = (note: CommunityNote) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  const canAddNote = isAuthenticated && adventureRun;

  return (
    <div className="mt-8 pt-6 border-t border-codex-brown/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-medium text-codex-ink flex items-center gap-2">
          <FileText className="w-4 h-4" />
          GM Notes
          {notesData && notesData.total > 0 && (
            <span className="text-sm text-codex-brown/50 font-normal">
              ({notesData.total})
            </span>
          )}
        </h3>

        {canAddNote && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Add Note
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mb-4 p-3 bg-codex-cream/50 rounded border border-codex-brown/10">
          <p className="text-sm text-codex-brown/70 flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <Link to="/login" className="text-codex-olive hover:underline">
              Log in
            </Link>{" "}
            to add your GM notes
          </p>
        </div>
      )}

      {isAuthenticated && !adventureRun && !showForm && (
        <div className="mb-4 p-3 bg-codex-cream/50 rounded border border-codex-brown/10">
          <p className="text-sm text-codex-brown/70">
            Add this to your runs above to share GM notes
          </p>
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <CommunityNoteForm
            productSlug={productSlug}
            existingNote={editingNote || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-codex-brown/50" />
          <select
            value={spoilerMax}
            onChange={(e) => {
              setSpoilerMax(e.target.value as SpoilerLevel);
              setPage(1);
            }}
            className="input text-sm py-1"
            aria-label="Filter by spoiler level"
          >
            <option value="endgame">Show All</option>
            <option value="major">Up to Major Spoilers</option>
            <option value="minor">Up to Minor Spoilers</option>
            <option value="none">No Spoilers Only</option>
          </select>
        </div>

        <select
          value={noteTypeFilter}
          onChange={(e) => {
            setNoteTypeFilter(e.target.value as NoteType | "");
            setPage(1);
          }}
          className="input text-sm py-1"
          aria-label="Filter by note type"
        >
          <option value="">All Types</option>
          {NOTE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <SortAsc className="w-4 h-4 text-codex-brown/50" />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              setPage(1);
            }}
            className="input text-sm py-1"
            aria-label="Sort notes"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-codex-olive" />
        </div>
      ) : notesData && notesData.results.length > 0 ? (
        <>
          <div className="space-y-4">
            {notesData.results.map((note) => (
              <CommunityNoteCard
                key={note.id}
                note={note}
                productSlug={productSlug}
                onEdit={handleEditNote}
              />
            ))}
          </div>

          {notesData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-codex-brown/60">
                Page {page} of {notesData.total_pages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(notesData.total_pages, p + 1))
                }
                disabled={page === notesData.total_pages}
                className="btn-ghost text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-codex-brown/50">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No GM notes yet.</p>
          {canAddNote && (
            <p className="text-sm mt-1">Be the first to share your wisdom!</p>
          )}
        </div>
      )}
    </div>
  );
}
