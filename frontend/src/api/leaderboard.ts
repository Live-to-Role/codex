import apiClient from "./client";

export interface LeaderboardEntry {
  id: string;
  public_name: string;
  avatar_url?: string;
  contribution_count: number;
  reputation: number;
  is_moderator: boolean;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await apiClient.get<LeaderboardEntry[]>("/users/leaderboard/");
    return response.data;
  } catch {
    return [
      {
        id: "1",
        public_name: "ArchiveKeeper",
        contribution_count: 47,
        reputation: 235,
        is_moderator: true,
      },
      {
        id: "2",
        public_name: "TomeCollector",
        contribution_count: 32,
        reputation: 160,
        is_moderator: false,
      },
      {
        id: "3",
        public_name: "ScrollMaster",
        contribution_count: 28,
        reputation: 140,
        is_moderator: false,
      },
      {
        id: "4",
        public_name: "CodexScribe",
        contribution_count: 21,
        reputation: 105,
        is_moderator: false,
      },
      {
        id: "5",
        public_name: "LibraryWarden",
        contribution_count: 15,
        reputation: 75,
        is_moderator: false,
      },
    ];
  }
}
