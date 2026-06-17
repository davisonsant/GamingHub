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
  isPlatinum?: boolean;
  build?: string;
  version?: string;
  dlc?: string;
  size?: string;
  rankingPos?: number;
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
    this.version(3).stores({
      games: 'id, title, status, isFavorite, platform', // Primary key and indexed fields
      settings: 'id',
      disks: 'id',
      roadmap: 'id, date',
      changelog: 'id, version'
    });
  }
}

export const db = new GamingHubDatabase();
