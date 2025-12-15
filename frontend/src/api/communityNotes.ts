import { apiClient } from "./client";

// Types
export type RunStatus = "want_to_run" | "running" | "completed";
export type RunDifficulty = "easier" | "as_written" | "harder";
export type NoteType = "prep_tip" | "modification" | "warning" | "review";
export type SpoilerLevel = "none" | "minor" | "major" | "endgame";
export type NoteVisibility = "anonymous" | "public";
export type FlagReason = "spam" | "inappropriate" | "spoiler" | "offensive" | "other";

export interface ProductListItem {
  id: string;
  title: string;
  slug: string;
  publisher_name: string | null;
  game_system_name: string | null;
  game_system_slug: string | null;
  product_type: string;
  product_type_display: string;
  thumbnail_url: string | null;
  cover_url: string | null;
}

export interface AdventureRun {
  id: string;
  product: ProductListItem;
  status: RunStatus;
  status_display: string;
  rating: number | null;
  difficulty: RunDifficulty | null;
  difficulty_display: string | null;
  session_count: number | null;
  player_count: number | null;
  completed_at: string | null;
  note_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdventureRunCreate {
  status: RunStatus;
  rating?: number | null;
  difficulty?: RunDifficulty | null;
  session_count?: number | null;
  player_count?: number | null;
  completed_at?: string | null;
}

export interface NoteAuthor {
  id?: string;
  public_name: string;
  avatar_url?: string | null;
}

export interface CommunityNote {
  id: string;
  adventure_run: string;
  product_slug: string;
  product_title: string;
  author: NoteAuthor;
  note_type: NoteType;
  note_type_display: string;
  title: string;
  content: string;
  spoiler_level: SpoilerLevel;
  spoiler_level_display: string;
  visibility: NoteVisibility;
  visibility_display: string;
  upvote_count: number;
  user_has_voted: boolean;
  is_own_note: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityNoteCreate {
  note_type: NoteType;
  title: string;
  content: string;
  spoiler_level: SpoilerLevel;
  visibility?: NoteVisibility;
  grimoire_note_id?: string;
}

export interface CommunityNoteUpdate {
  note_type?: NoteType;
  title?: string;
  content?: string;
  spoiler_level?: SpoilerLevel;
  visibility?: NoteVisibility;
}

export interface NotesQueryParams {
  sort?: "most_votes" | "least_votes" | "newest" | "oldest";
  spoiler_max?: SpoilerLevel;
  note_type?: NoteType;
  page?: number;
  per_page?: number;
}

export interface PaginatedNotesResponse {
  results: CommunityNote[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface VoteResponse {
  voted: boolean;
  upvote_count: number;
}

export interface FlagData {
  reason: FlagReason;
  details?: string;
}

// Adventure Run API

export async function getProductAdventureRun(
  productSlug: string
): Promise<AdventureRun | null> {
  const response = await apiClient.get<AdventureRun | null>(
    `/products/${productSlug}/adventure-run/`
  );
  return response.data;
}

export async function createOrUpdateAdventureRun(
  productSlug: string,
  data: AdventureRunCreate
): Promise<AdventureRun> {
  const response = await apiClient.post<AdventureRun>(
    `/products/${productSlug}/adventure-run/`,
    data
  );
  return response.data;
}

export async function getUserAdventureRuns(): Promise<AdventureRun[]> {
  const response = await apiClient.get<AdventureRun[]>("/adventure-runs/");
  return response.data;
}

// Community Notes API

export async function getProductCommunityNotes(
  productSlug: string,
  params?: NotesQueryParams
): Promise<PaginatedNotesResponse> {
  const response = await apiClient.get<PaginatedNotesResponse>(
    `/products/${productSlug}/community-notes/`,
    { params }
  );
  return response.data;
}

export async function createCommunityNote(
  productSlug: string,
  data: CommunityNoteCreate
): Promise<CommunityNote> {
  const response = await apiClient.post<CommunityNote>(
    `/products/${productSlug}/community-notes/`,
    data
  );
  return response.data;
}

export async function getCommunityNote(noteId: string): Promise<CommunityNote> {
  const response = await apiClient.get<CommunityNote>(
    `/community-notes/${noteId}/`
  );
  return response.data;
}

export async function updateCommunityNote(
  noteId: string,
  data: CommunityNoteUpdate
): Promise<CommunityNote> {
  const response = await apiClient.patch<CommunityNote>(
    `/community-notes/${noteId}/`,
    data
  );
  return response.data;
}

export async function deleteCommunityNote(noteId: string): Promise<void> {
  await apiClient.delete(`/community-notes/${noteId}/`);
}

// Voting API

export async function voteOnNote(noteId: string): Promise<VoteResponse> {
  const response = await apiClient.post<VoteResponse>(
    `/community-notes/${noteId}/vote/`
  );
  return response.data;
}

export async function removeVoteFromNote(noteId: string): Promise<VoteResponse> {
  const response = await apiClient.delete<VoteResponse>(
    `/community-notes/${noteId}/vote/`
  );
  return response.data;
}

// Flagging API

export async function flagNote(
  noteId: string,
  data: FlagData
): Promise<{ flagged: boolean }> {
  const response = await apiClient.post<{ flagged: boolean }>(
    `/community-notes/${noteId}/flag/`,
    data
  );
  return response.data;
}

// Helper functions

export const NOTE_TYPE_OPTIONS = [
  { value: "prep_tip", label: "Prep Tip", description: "Tips for preparing to run this adventure" },
  { value: "modification", label: "Modification", description: "Changes you made that worked well" },
  { value: "warning", label: "Warning", description: "Issues or problems to watch out for" },
  { value: "review", label: "Review", description: "Your overall experience running this" },
] as const;

export const SPOILER_LEVEL_OPTIONS = [
  { value: "none", label: "No Spoilers", color: "green" },
  { value: "minor", label: "Minor Spoilers", color: "yellow" },
  { value: "major", label: "Major Spoilers", color: "orange" },
  { value: "endgame", label: "Endgame Spoilers", color: "red" },
] as const;

export const RUN_STATUS_OPTIONS = [
  { value: "want_to_run", label: "Want to Run" },
  { value: "running", label: "Currently Running" },
  { value: "completed", label: "Completed" },
] as const;

export const RUN_DIFFICULTY_OPTIONS = [
  { value: "easier", label: "Easier than Expected" },
  { value: "as_written", label: "As Written" },
  { value: "harder", label: "Harder than Expected" },
] as const;

export const FLAG_REASON_OPTIONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "spoiler", label: "Unmarked Spoilers" },
  { value: "offensive", label: "Offensive Language" },
  { value: "other", label: "Other" },
] as const;

export function getSpoilerLevelColor(level: SpoilerLevel): string {
  const colors: Record<SpoilerLevel, string> = {
    none: "bg-green-100 text-green-800 border-green-200",
    minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
    major: "bg-orange-100 text-orange-800 border-orange-200",
    endgame: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[level];
}

export function getNoteTypeColor(type: NoteType): string {
  const colors: Record<NoteType, string> = {
    prep_tip: "bg-blue-100 text-blue-800 border-blue-200",
    modification: "bg-purple-100 text-purple-800 border-purple-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    review: "bg-teal-100 text-teal-800 border-teal-200",
  };
  return colors[type];
}
