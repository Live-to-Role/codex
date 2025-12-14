import type { Product, Publisher, GameSystem, PaginatedResponse } from "@/types";

export const mockSystems: GameSystem[] = [
  {
    id: "1",
    name: "D&D 5E",
    slug: "dnd-5e",
    description: "The fifth edition of the world's most popular tabletop roleplaying game.",
    edition: "5th Edition",
    year_released: 2014,
    product_count: 6,
  },
  {
    id: "2",
    name: "OSR",
    slug: "osr",
    description: "Old School Renaissance - games inspired by early editions of D&D.",
    product_count: 3,
  },
  {
    id: "3",
    name: "Pathfinder 2E",
    slug: "pathfinder-2e",
    description: "The second edition of Paizo's flagship roleplaying game.",
    edition: "2nd Edition",
    year_released: 2019,
    product_count: 2,
  },
];

export const mockPublishers: Publisher[] = [
  {
    id: "1",
    name: "Frog God Games",
    slug: "frog-god-games",
    description: "Publisher of classic-style adventures and the Lost Lands setting.",
    website: "https://www.froggodgames.com",
    founded_year: 2010,
    is_verified: true,
    product_count: 4,
  },
  {
    id: "2",
    name: "Loot the Body",
    slug: "loot-the-body",
    description: "Independent publisher of OSR and weird fantasy content.",
    is_verified: false,
    product_count: 1,
  },
  {
    id: "3",
    name: "Wizards of the Coast",
    slug: "wizards-of-the-coast",
    description: "Publisher of Dungeons & Dragons.",
    website: "https://www.dndbeyond.com",
    founded_year: 1990,
    is_verified: true,
    product_count: 3,
  },
  {
    id: "4",
    name: "Kobold Press",
    slug: "kobold-press",
    description: "Award-winning publisher of tabletop RPG content.",
    website: "https://koboldpress.com",
    founded_year: 2006,
    is_verified: true,
    product_count: 2,
  },
];

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "City of Brass",
    slug: "city-of-brass",
    description: "A massive planar adventure set in the legendary City of Brass on the Elemental Plane of Fire. This epic campaign takes heroes from the mortal realm into the heart of the Elemental Plane of Fire.",
    publisher: mockPublishers[0],
    publisher_name: "Frog God Games",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "adventure",
    product_type_display: "Adventure",
    publication_date: "2018-01-01",
    page_count: 554,
    level_range_min: 12,
    level_range_max: 18,
    status: "verified",
    dtrpg_url: "https://www.drivethrurpg.com/product/240996/City-of-Brass-5th-Edition",
    tags: ["planar", "high-level", "epic"],
  },
  {
    id: "2",
    title: "Against The Cult Of The Hippie Commune",
    slug: "against-the-cult-of-the-hippie-commune",
    description: "A psychedelic OSR adventure involving a mysterious hippie commune and dark secrets lurking beneath the surface.",
    publisher: mockPublishers[1],
    publisher_name: "Loot the Body",
    game_system: mockSystems[1],
    game_system_name: "OSR",
    game_system_slug: "osr",
    product_type: "adventure",
    product_type_display: "Adventure",
    publication_date: "2023-06-15",
    page_count: 17,
    level_range_min: 1,
    level_range_max: 3,
    status: "published",
    tags: ["weird", "psychedelic", "low-level"],
  },
  {
    id: "3",
    title: "Tegel Manor",
    slug: "tegel-manor",
    description: "The classic haunted house adventure, updated for 5th Edition. Explore the sprawling manor of the Rump family and uncover its dark secrets.",
    publisher: mockPublishers[0],
    publisher_name: "Frog God Games",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "adventure",
    product_type_display: "Adventure",
    publication_date: "2019-10-01",
    page_count: 214,
    level_range_min: 1,
    level_range_max: 10,
    status: "verified",
    tags: ["haunted", "exploration", "classic"],
  },
  {
    id: "4",
    title: "Tome of Beasts",
    slug: "tome-of-beasts",
    description: "Over 400 new monsters for 5th Edition! From the cunning to the terrifying, this bestiary has something for every encounter.",
    publisher: mockPublishers[3],
    publisher_name: "Kobold Press",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "bestiary",
    product_type_display: "Bestiary",
    publication_date: "2016-10-01",
    page_count: 430,
    status: "verified",
    tags: ["monsters", "creatures", "bestiary"],
  },
  {
    id: "5",
    title: "Curse of Strahd",
    slug: "curse-of-strahd",
    description: "Under raging storm clouds, the vampire Count Strahd von Zarovich stands silhouetted against the ancient walls of Castle Ravenloft.",
    publisher: mockPublishers[2],
    publisher_name: "Wizards of the Coast",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "adventure",
    product_type_display: "Adventure",
    publication_date: "2016-03-15",
    page_count: 256,
    level_range_min: 1,
    level_range_max: 10,
    status: "verified",
    tags: ["horror", "gothic", "vampire"],
  },
  {
    id: "6",
    title: "Mouth of Doom",
    slug: "mouth-of-doom",
    description: "A classic dungeon crawl adventure for brave adventurers willing to face the horrors within.",
    publisher: mockPublishers[0],
    publisher_name: "Frog God Games",
    game_system: mockSystems[1],
    game_system_name: "OSR",
    game_system_slug: "osr",
    product_type: "adventure",
    product_type_display: "Adventure",
    page_count: 7,
    level_range_min: 1,
    level_range_max: 5,
    status: "published",
    tags: ["dungeon", "classic"],
  },
  {
    id: "7",
    title: "Midgard Worldbook",
    slug: "midgard-worldbook",
    description: "A comprehensive guide to the dark fantasy world of Midgard, filled with intrigue, magic, and danger.",
    publisher: mockPublishers[3],
    publisher_name: "Kobold Press",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "sourcebook",
    product_type_display: "Sourcebook",
    publication_date: "2018-04-01",
    page_count: 460,
    status: "verified",
    tags: ["setting", "world", "dark fantasy"],
  },
  {
    id: "8",
    title: "Player's Handbook",
    slug: "players-handbook-5e",
    description: "The essential rulebook for D&D 5th Edition players. Everything you need to create heroic characters.",
    publisher: mockPublishers[2],
    publisher_name: "Wizards of the Coast",
    game_system: mockSystems[0],
    game_system_name: "D&D 5E",
    game_system_slug: "dnd-5e",
    product_type: "core_rules",
    product_type_display: "Core Rules",
    publication_date: "2014-08-19",
    page_count: 320,
    status: "verified",
    tags: ["core", "rules", "essential"],
  },
];

export function getMockProducts(filters?: {
  page?: number;
  search?: string;
  game_system__slug?: string;
  product_type?: string;
}): PaginatedResponse<Product> {
  let filtered = [...mockProducts];

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.publisher_name?.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.game_system__slug) {
    filtered = filtered.filter((p) => p.game_system_slug === filters.game_system__slug);
  }

  if (filters?.product_type) {
    filtered = filtered.filter((p) => p.product_type === filters.product_type);
  }

  return {
    count: filtered.length,
    next: null,
    previous: null,
    results: filtered,
  };
}

export function getMockPublishers(): PaginatedResponse<Publisher> {
  return {
    count: mockPublishers.length,
    next: null,
    previous: null,
    results: mockPublishers,
  };
}

export function getMockSystems(): PaginatedResponse<GameSystem> {
  return {
    count: mockSystems.length,
    next: null,
    previous: null,
    results: mockSystems,
  };
}

export function getMockProduct(slug: string): Product | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getMockPublisher(slug: string): Publisher | undefined {
  return mockPublishers.find((p) => p.slug === slug);
}

export function getMockSystem(slug: string): GameSystem | undefined {
  return mockSystems.find((s) => s.slug === slug);
}
