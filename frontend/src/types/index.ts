export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  public_name: string;
  bio: string;
  avatar_url: string;
  contribution_count: number;
  reputation: number;
  is_moderator: boolean;
  is_publisher: boolean;
  created_at: string;
}

export interface UserPublic {
  id: string;
  public_name: string;
  avatar_url: string;
  contribution_count: number;
  reputation: number;
  is_moderator: boolean;
  is_publisher: boolean;
}

export interface Publisher {
  id: string;
  name: string;
  slug: string;
  website?: string;
  description?: string;
  founded_year?: number;
  logo_url?: string;
  is_verified: boolean;
  follower_count?: number;
  is_following?: boolean;
  product_count?: number;
  created_by?: UserPublic;
  created_at?: string;
  updated_at?: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  website?: string;
  follower_count?: number;
  is_following?: boolean;
  created_by?: UserPublic;
  created_at?: string;
  updated_at?: string;
}

export interface GameSystem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  publisher?: Publisher;
  publisher_name?: string;
  edition?: string;
  parent_system?: GameSystem;
  year_released?: number;
  logo_url?: string;
  website_url?: string;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type ProductType =
  | "adventure"
  | "sourcebook"
  | "supplement"
  | "bestiary"
  | "tools"
  | "magazine"
  | "core_rules"
  | "screen"
  | "other";

export type ProductStatus = "draft" | "published" | "verified";

export type ProductFormat = "pdf" | "print" | "both";

export interface ProductCredit {
  id: string;
  author: Author;
  role: string;
  role_display: string;
  notes?: string;
}

export interface FileHash {
  id: string;
  hash_sha256: string;
  hash_md5?: string;
  file_size_bytes?: number;
  file_name?: string;
  source: string;
  contributed_by?: UserPublic;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  publisher?: Publisher;
  publisher_name?: string;
  game_system?: GameSystem;
  game_system_name?: string;
  game_system_slug?: string;
  product_type: ProductType;
  product_type_display?: string;
  publication_date?: string;
  page_count?: number;
  format?: ProductFormat;
  format_display?: string;
  isbn?: string;
  msrp?: number;
  dtrpg_id?: string;
  dtrpg_url?: string;
  itch_id?: string;
  itch_url?: string;
  other_urls?: string[];
  level_range_min?: number;
  level_range_max?: number;
  party_size_min?: number;
  party_size_max?: number;
  estimated_runtime?: string;
  setting?: string;
  tags?: string[];
  themes?: string[];
  content_warnings?: string[];
  cover_url?: string;
  thumbnail_url?: string;
  status: ProductStatus;
  status_display?: string;
  credits?: ProductCredit[];
  file_hashes?: FileHash[];
  created_by?: UserPublic;
  created_at?: string;
  updated_at?: string;
}

export interface IdentifyResponse {
  match: "exact" | "fuzzy" | "none";
  confidence: number;
  product: Product | null;
  suggestions: Product[];
}

export interface SearchResult {
  type: "product" | "publisher" | "author" | "game_system";
  data: Product | Publisher | Author | GameSystem;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password1: string;
  password2: string;
}

export interface Revision {
  id: string;
  product: Product;
  user?: UserPublic;
  changes: Record<string, unknown>;
  comment: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  product?: Product;
  user?: UserPublic;
  data: Record<string, unknown>;
  file_hash: string;
  source: "web" | "grimoire" | "api";
  status: "pending" | "approved" | "rejected";
  reviewed_by?: UserPublic;
  review_notes: string;
  reviewed_at?: string;
  created_at: string;
}
