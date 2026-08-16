import Dexie, { type Table } from 'dexie';

export type GameStatus = 'Jogando' | 'Favoritos' | 'Completos' | 'Backlog';

export interface Game {
  id: string;
  title: string;
  genre: string;
  status: GameStatus;
  playtime: number;
  progress: number;
  rating: number;
  coverUrl: string;
  isFavorite: boolean;
  platform: string[];
  releaseDate: string;
  developer: string;
  publisher: string;
  location: string;
  synopsis: string;
  genres: string[];
  trailerUrl?: string;
  bannerUrl?: string;
  region?: string;
  isPlatinum?: boolean;
  build?: string;
  version?: string;
  dlc?: string;
  size?: string;
  rankingPos?: number;
  addedAt?: number;
  dateAdded?: number;
  completedAt?: number;
}

export interface UserSettings {
  id: string; // 'current'
  theme: 'light' | 'dark';
  userAvatar: string;
  userName: string;
  language?: string;
}

export interface Disk {
  id: string;
  label: string;
  letter: string;
  totalGB: number;
  usedGB: number;
  sortOrder?: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  date: string; // e.g. "Q3 2024" or "Dec 2024"
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority?: 'Q1' | 'Q2' | 'Q3';
}

export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  changes: string[];
}

export class GamingHubDatabase extends Dexie {
  games!: Table<Game>;
  settings!: Table<UserSettings>;
  disks!: Table<Disk>;
  roadmap!: Table<RoadmapItem>;
  changelog!: Table<ChangelogEntry>;

  constructor() {
    super('GamingHubDatabase');
    // Version 3 (previous schema configuration)
    this.version(3).stores({
      games: 'id, title, status, isFavorite, platform',
      settings: 'id',
      disks: 'id',
      roadmap: 'id, date',
      changelog: 'id, version'
    });

    // Version 4: Added dateAdded as an indexed field on games to ensure proper "Recently Added" sorting.
    // Why this is necessary: The old sorting used 'id' as a fallback, but 'id' is a random alphanumeric string,
    // which caused the "Recentes" (Date) sort to produce virtually random results.
    this.version(4).stores({
      games: 'id, title, status, isFavorite, platform, dateAdded',
      settings: 'id',
      disks: 'id',
      roadmap: 'id, date',
      changelog: 'id, version'
    }).upgrade(async (tx) => {
      const gamesTable = tx.table('games');
      const allGames = await gamesTable.toArray();
      // Assign synthetic, sequential timestamps (1ms increments) to preserve the original insertion order
      const baseTime = Date.now() - allGames.length * 10;
      for (let i = 0; i < allGames.length; i++) {
        const game = allGames[i];
        if (!game.dateAdded) {
          await gamesTable.update(game.id, { dateAdded: baseTime + i });
        }
      }
    });
  }
}

export const db = new GamingHubDatabase();

// Dexie 'creating' hook: ensures that any newly inserted game gets 'dateAdded' and 'addedAt'
// and 'completedAt' if the game is already marked as completed.
db.games.hook('creating', (primKey, obj) => {
  const now = Date.now();
  if (obj.dateAdded === undefined || obj.dateAdded === null) {
    obj.dateAdded = now;
  }
  if (obj.addedAt === undefined || obj.addedAt === null) {
    obj.addedAt = obj.dateAdded;
  }
  if (obj.status === 'Completos' || obj.progress === 100) {
    if (!obj.completedAt) {
      obj.completedAt = now;
    }
  }
});

// Dexie 'updating' hook: ensures that when status becomes 'Completos' or progress becomes 100, completedAt is set
db.games.hook('updating', (modifications: any, primKey, obj) => {
  const isNowCompleted = modifications.status === 'Completos' || modifications.progress === 100;
  const wasCompleted = obj.status === 'Completos' || obj.progress === 100;

  if (isNowCompleted && !wasCompleted) {
    if (!modifications.completedAt) {
      modifications.completedAt = Date.now();
    }
  } else if (modifications.status !== undefined && modifications.status !== 'Completos' && (modifications.progress === undefined ? obj.progress < 100 : modifications.progress < 100)) {
    if (modifications.completedAt === undefined) {
      modifications.completedAt = undefined;
    }
  }
});
