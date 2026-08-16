/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, type ReactNode, type MouseEvent, type Key } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Game, type GameStatus, type UserSettings, type Disk, type RoadmapItem, type ChangelogEntry } from './lib/db';
import { matchesGameTitle } from './lib/searchUtils';

function getGenreColor(genre: string) {
  const colors = [
    'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20',
    'bg-tertiary/10 text-tertiary border-tertiary/20 hover:bg-tertiary/20',
    'bg-error/10 text-error border-error/20 hover:bg-error/20',
    'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:text-blue-400',
    'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:text-purple-400',
    'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 dark:text-orange-400',
    'bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20 dark:text-pink-400',
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:emerald-500/20 dark:text-emerald-400',
    'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20 dark:text-cyan-400',
  ];
  
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getPlatformStyle(platform: string | undefined | null) {
  if (!platform) return 'bg-primary/10 text-primary border-primary/20';
  const p = platform.trim();
  if (p === 'PC') return 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400';
  if (p.includes('PlayStation')) return 'bg-blue-600/10 text-blue-600 border-blue-600/20 dark:text-blue-400';
  if (p.includes('Xbox')) return 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 dark:text-emerald-400';
  if (p.includes('Nintendo')) return 'bg-red-600/10 text-red-600 border-red-600/20 dark:text-red-400';
  if (p === 'Mobile') return 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:text-fuchsia-400';
  if (p === 'Steam Deck') return 'bg-violet-600/10 text-violet-600 border-violet-600/20 dark:text-violet-400';
  return 'bg-primary/10 text-primary border-primary/20';
}

function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  const origin = window.location.origin;
  
  // Se estiver executando no preview do Google AI Studio (que roda sob o domínio run.app ou googleusercontent),
  // usa-se o próprio origin atual (onde o Express e Vite rodam juntos no contêiner).
  const isCloudRun = origin.includes('run.app') || origin.includes('googleusercontent') || origin.includes('aistudio');
  
  let baseOrigin = isCloudRun 
    ? origin 
    : 'http://127.0.0.1:3000';
  
  const base = baseOrigin.replace(/\/$/, '');
  return `${base}${path}`;
}

// Mock Data for initial seed
const INITIAL_GAMES: Game[] = [];

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%231a1a24'/%3E%3Cpath d='M110 180h80v40h-80z' fill='%23333344'/%3E%3Ctext x='150' y='210' font-family='sans-serif' font-size='14' font-weight='bold' fill='%23777799' text-anchor='middle'%3EGamingHub%3C/text%3E%3C/svg%3E";

const INITIAL_DISKS: Disk[] = [
  { id: '1', label: 'Unidade A', letter: 'C', totalGB: 500, usedGB: 404 },
  { id: '2', label: 'Unidade B', letter: 'D', totalGB: 500, usedGB: 352.1 },
  { id: '3', label: 'Unidade C', letter: 'E', totalGB: 500, usedGB: 176 },
  { id: '4', label: 'Unidade D', letter: 'F', totalGB: 500, usedGB: 165 },
  { id: '5', label: 'Unidade E', letter: 'G', totalGB: 500, usedGB: 450 },
  { id: '6', label: 'Unidade F', letter: 'H', totalGB: 500, usedGB: 300 },
  { id: '7', label: 'Unidade G', letter: 'I', totalGB: 500, usedGB: 180 },
  { id: '8', label: 'Unidade H', letter: 'J', totalGB: 500, usedGB: 120 },
  { id: '9', label: 'Unidade I', letter: 'K', totalGB: 500, usedGB: 350 },
  { id: '10', label: 'Unidade J', letter: 'L', totalGB: 500, usedGB: 100 },
];

// Views enumeration
type View = 'Library' | 'Favorites' | 'Playing' | 'Completed' | 'Backlog' | 'Stats' | 'Ranking' | 'Storage' | 'Roadmap' | 'Settings' | 'Details' | 'Add' | 'Edit';

import { ptBR, translations, TranslationKeys } from './translations';

interface TrophyTheme {
  primary: string;
  secondary: string;
  dark: string;
  light: string;
  glow: string;
  text: string;
  leaf: string;
}

const getTrophyTheme = (level: number): TrophyTheme => {
  if (level >= 155) {
    return {
      primary: '#f43f5e',
      secondary: '#8b5cf6',
      dark: '#1e1b4b',
      light: '#fdf2f8',
      glow: 'rgba(236, 72, 153, 0.4)',
      text: '#ffd6e8',
      leaf: '#ec4899',
    };
  } else if (level >= 140) {
    return {
      primary: '#22d3ee',
      secondary: '#0891b2',
      dark: '#083344',
      light: '#ecfeff',
      glow: 'rgba(34, 211, 238, 0.4)',
      text: '#cffafe',
      leaf: '#22d3ee',
    };
  } else if (level >= 100) {
    return {
      primary: '#fbbf24',
      secondary: '#1e293b',
      dark: '#0f172a',
      light: '#fef3c7',
      glow: 'rgba(251, 191, 36, 0.3)',
      text: '#fef3c7',
      leaf: '#d97706',
    };
  } else if (level >= 75) {
    return {
      primary: '#ef4444',
      secondary: '#991b1b',
      dark: '#450a0a',
      light: '#fef2f2',
      glow: 'rgba(239, 68, 68, 0.4)',
      text: '#fee2e2',
      leaf: '#ef4444',
    };
  } else if (level >= 65) {
    return {
      primary: '#d946ef',
      secondary: '#701a75',
      dark: '#2e1065',
      light: '#faf5ff',
      glow: 'rgba(217, 70, 239, 0.4)',
      text: '#f3e8ff',
      leaf: '#d946ef',
    };
  } else if (level >= 45) {
    return {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      dark: '#172554',
      light: '#eff6ff',
      glow: 'rgba(59, 130, 246, 0.4)',
      text: '#dbeafe',
      leaf: '#3b82f6',
    };
  } else if (level >= 35) {
    return {
      primary: '#fbbf24',
      secondary: '#b45309',
      dark: '#451a03',
      light: '#fef9c3',
      glow: 'rgba(251, 191, 36, 0.4)',
      text: '#fef9c3',
      leaf: '#d97706',
    };
  } else if (level >= 25) {
    return {
      primary: '#cbd5e1',
      secondary: '#64748b',
      dark: '#1e293b',
      light: '#f8fafc',
      glow: 'rgba(203, 213, 225, 0.4)',
      text: '#f1f5f9',
      leaf: '#cbd5e1',
    };
  } else {
    return {
      primary: '#ea580c',
      secondary: '#7c2d12',
      dark: '#431407',
      light: '#fffbeb',
      glow: 'rgba(234, 88, 12, 0.4)',
      text: '#ffedd5',
      leaf: '#ea580c',
    };
  }
};

function GamerTrophy({ level }: { level: number }) {
  const theme = getTrophyTheme(level);

  return (
    <div className="relative w-28 h-40 flex items-center justify-center select-none">
      {/* Back Ambient Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[16px] pointer-events-none transition-all duration-500"
        style={{ backgroundColor: theme.glow, opacity: 0.35 }}
      />
      
      <motion.svg 
        width="112" 
        height="160" 
        viewBox="0 0 160 220" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        animate={{ 
          y: [0, -6, 0],
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]"
      >
        <defs>
          <linearGradient id={`badgeBg-${level}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.dark} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>
          <linearGradient id={`trophyPrimary-${level}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>
          <linearGradient id={`trophySecondary-${level}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.secondary} />
            <stop offset="50%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>
          <linearGradient id={`medallionBg-${level}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.dark} />
            <stop offset="100%" stopColor="#0d0e12" />
          </linearGradient>
          <linearGradient id={`trophyBody-${level}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="40%" stopColor={theme.secondary} />
            <stop offset="100%" stopColor={theme.dark} />
          </linearGradient>
          <linearGradient id={`leafGradient-${level}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.dark} stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id={`glowGrad-${level}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`glassSheen-${level}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="25%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Glow background inside SVG */}
        <circle cx="80" cy="115" r="75" fill={`url(#glowGrad-${level})`} />

        {/* Orbiting Tech Energy Trails */}
        <ellipse cx="80" cy="115" rx="68" ry="24" fill="none" stroke={`url(#trophyPrimary-${level})`} strokeWidth="1.5" strokeDasharray="90 150" opacity="0.6" transform="rotate(-25 80 115)" />
        <ellipse cx="80" cy="115" rx="64" ry="20" fill="none" stroke={`url(#trophySecondary-${level})`} strokeWidth="1" strokeDasharray="50 120" opacity="0.4" transform="rotate(35 80 115)" />

        {/* Background Sparkles */}
        <path d="M 24 90 Q 28 90 28 86 Q 28 90 32 90 Q 28 90 28 94 Q 28 90 24 90 Z" fill={theme.primary} opacity="0.8" />
        <path d="M 132 94 Q 136 94 136 90 Q 136 94 140 94 Q 136 94 136 98 Q 136 94 132 94 Z" fill={theme.primary} opacity="0.8" />
        <path d="M 80 62 Q 82 62 82 60 Q 82 62 84 62 Q 82 62 82 64 Q 82 62 80 62 Z" fill={theme.light} opacity="0.75" />

        {/* Modern Geometric 3D Shield (Outer Layer) */}
        <path 
          d="M 80 20 L 145 48 L 145 130 Q 145 155 115 178 L 80 202 L 45 178 Q 15 155 15 130 L 15 48 Z" 
          fill={`url(#medallionBg-${level})`} 
          stroke={`url(#trophySecondary-${level})`} 
          strokeWidth="1.5" 
          opacity="0.9" 
        />
        
        {/* Inner Sleek Shield with Glowing Border */}
        <path 
          d="M 80 28 L 137 53 L 137 125 Q 137 147 110 168 L 80 190 L 50 168 Q 23 147 23 125 L 23 53 Z" 
          fill={`url(#badgeBg-${level})`} 
          stroke={`url(#trophyPrimary-${level})`} 
          strokeWidth="2.5" 
        />

        {/* Techno Accent Line details inside shield */}
        <path d="M 35 60 L 50 56" stroke={theme.light} strokeWidth="1.5" opacity="0.4" />
        <path d="M 125 60 L 110 56" stroke={theme.light} strokeWidth="1.5" opacity="0.4" />

        {/* Floating Star of Achievement */}
        <path d="M 80 44 L 83 52 L 91 54 L 83 56 L 80 64 L 77 56 L 69 54 L 77 52 Z" fill={theme.light} />
        <circle cx="80" cy="54" r="2" fill="#ffffff" />

        {/* Central Stylized Modern Trophy Cup */}
        {/* Sharp geometric handles */}
        <path d="M 54 82 L 36 94 L 38 106 L 50 114 L 46 102 Z" fill={`url(#trophySecondary-${level})`} stroke={`url(#trophyPrimary-${level})`} strokeWidth="1" />
        <path d="M 106 82 L 124 94 L 122 106 L 110 114 L 114 102 Z" fill={`url(#trophySecondary-${level})`} stroke={`url(#trophyPrimary-${level})`} strokeWidth="1" />

        {/* Main geometric Faceted Trophy Bowl */}
        <path d="M 80 70 L 52 70 L 46 112 L 80 135 Z" fill={`url(#trophyPrimary-${level})`} />
        <path d="M 80 70 L 108 70 L 114 112 L 80 135 Z" fill={`url(#trophySecondary-${level})`} />
        {/* High-light middle shine */}
        <path d="M 80 70 L 70 70 L 73 130 L 80 135 Z" fill={theme.light} opacity="0.2" />

        {/* Sleek support stem */}
        <path d="M 74 135 L 86 135 L 84 154 L 76 154 Z" fill={`url(#trophyPrimary-${level})`} />

        {/* Multi-layered tech base */}
        <path d="M 55 154 L 105 154 L 98 165 L 62 165 Z" fill={`url(#trophyPrimary-${level})`} />
        <path d="M 48 165 L 112 165 L 104 175 L 56 175 Z" fill={`url(#trophySecondary-${level})`} stroke={`url(#trophyPrimary-${level})`} strokeWidth="1" />

        {/* Diagonal High-Gloss Sheen Overlay (frosted glass reflection) */}
        <path 
          d="M 23 53 L 100 28 L 137 125 L 60 150 Z" 
          fill={`url(#glassSheen-${level})`} 
          pointerEvents="none" 
        />
      </motion.svg>
    </div>
  );
}

const openExternalLink = (url: string, e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
  }
  try {
    const isElectron = typeof window !== 'undefined' && (
      (window as any).navigator?.userAgent?.toLowerCase().indexOf(' electron/') > -1 ||
      (window as any).process?.versions?.electron ||
      (window as any).electron
    );
    if (isElectron) {
      const electronAPI = (window as any).electron;
      if (electronAPI && typeof electronAPI.openExternal === 'function') {
        electronAPI.openExternal(url);
        return;
      }
      if (electronAPI && electronAPI.shell && typeof electronAPI.shell.openExternal === 'function') {
        electronAPI.shell.openExternal(url);
        return;
      }
      if (typeof (window as any).require === 'function') {
        const { shell } = (window as any).require('electron');
        shell.openExternal(url);
        return;
      }
    }
    if ((window as any).__TAURI__) {
      (window as any).__TAURI__.shell.open(url);
      return;
    }
  } catch (err) {
    console.error("Failed to open external link, falling back to window.open", err);
  }
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (win) win.focus();
};

export default function App() {
  const games = useLiveQuery(() => db.games.toArray()) || [];
  const rawDisks = useLiveQuery(() => db.disks.toArray()) || [];
  const disks = [...rawDisks].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? a.sortOrder : Number(a.id) || 0;
    const orderB = b.sortOrder !== undefined ? b.sortOrder : Number(b.id) || 0;
    return orderA - orderB;
  });
  const roadmapItems = useLiveQuery(() => db.roadmap.toArray()) || [];
  const changelogEntries = useLiveQuery(() => db.changelog.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('current'));
  
  const [view, setView] = useState<View>('Library');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>('Todas');
  const [activeDeveloper, setActiveDeveloper] = useState<string>('Todos');
  const [activeYear, setActiveYear] = useState<string>('Todos');
  const [platinumFilter, setPlatinumFilter] = useState<'all' | 'platinum' | 'not_platinum'>('all');
  const [sortBy, setSortByState] = useState<'Date' | 'Title' | 'Playtime' | 'Rating'>(() => {
    const saved = localStorage.getItem('gaminghub_sortBy');
    return (saved === 'Date' || saved === 'Title' || saved === 'Playtime' || saved === 'Rating')
      ? saved
      : 'Date';
  });

  const setSortBy = (val: 'Date' | 'Title' | 'Playtime' | 'Rating') => {
    setSortByState(val);
    localStorage.setItem('gaminghub_sortBy', val);
  };
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLuckyModal, setShowLuckyModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [luckyGame, setLuckyGame] = useState<Game | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearDbModal, setShowClearDbModal] = useState(false);
  const [dbClearAware, setDbClearAware] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [editingDisk, setEditingDisk] = useState<Disk | null>(null);
  const [showEditDiskModal, setShowEditDiskModal] = useState(false);
  const [draggedDiskId, setDraggedDiskId] = useState<string | null>(null);
  const [rankingSlotToEdit, setRankingSlotToEdit] = useState<number | null>(null);
  const [showRankingSelectModal, setShowRankingSelectModal] = useState(false);
  const [showAddRoadmapModal, setShowAddRoadmapModal] = useState(false);
  const [showAddChangelogModal, setShowAddChangelogModal] = useState(false);
  const [editingRoadmapItem, setEditingRoadmapItem] = useState<RoadmapItem | null>(null);
  const [editingChangelogEntry, setEditingChangelogEntry] = useState<ChangelogEntry | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'up-to-date' | 'error' | 'no-release'>('idle');
  const [latestReleaseData, setLatestReleaseData] = useState<any>(null);
  const [hasUpdateBadge, setHasUpdateBadge] = useState(false);

  // Silent update checker to show red badge
  useEffect(() => {
    const silentCheck = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/davisonsant/GamingHub/releases/latest', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        });
        if (res.ok) {
          const data = await res.json();
          const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '') : '';
          const current = "1.6.0";
          const latestParts = latestTag.split('.').map(Number);
          const currentParts = current.split('.').map(Number);
          let isNewer = false;
          for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const lp = latestParts[i] || 0;
            const cp = currentParts[i] || 0;
            if (lp > cp) {
              isNewer = true;
              break;
            } else if (lp < cp) {
              break;
            }
          }
          if (isNewer) {
            setHasUpdateBadge(true);
          }
        }
      } catch (e) {
        console.error("Silent update check failed:", e);
      }
    };
    silentCheck();
  }, []);

  // Settings State Managers
  const theme = settings?.theme || 'light';
  const userAvatar = settings?.userAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
  const userName = settings?.userName || "Usuário Gamer";
  const language = settings?.language || "Português (Brasil)";

  // Translation Hook
  const t = (translations[language as keyof typeof translations] || ptBR) as TranslationKeys;

  const getTooltip = (key: 'library' | 'favorites' | 'playing' | 'completed' | 'backlog' | 'statistics' | 'ranking' | 'storage' | 'roadmap' | 'settings' | 'randomGameBtn' | 'addGameBtn' | 'profileBtn') => {
    const lang = language;
    const isPt = lang === 'Português (Brasil)';
    const isEs = lang === 'Español';
    const isFr = lang === 'Français';
    const isRu = lang === 'Русский';
    const isZh = lang === '简体中文';
    const isAr = lang === 'العربية';
    const isJa = lang === '日本語';
    const isTr = lang === 'Türkçe';

    const tooltips = {
      library: {
        pt: "Exibe sua coleção de jogos, jogos concluídos, backlog e tempo total.",
        en: "Displays your collection of games, completed games, backlog, and total play time.",
        es: "Muestra tu colección de juegos, juegos completados, backlog y tiempo total.",
        fr: "Affiche votre collection de jeux, jeux terminés, backlog et temps total.",
        ru: "Показывает вашу коллекцию игр, пройденные игры, бэклог и общее время.",
        zh: "显示您的游戏收藏、已完成的游戏、待玩清单 and 总游戏时间。",
        ar: "يعرض مجموعة ألعابك، والألعاب المكتملة، والمتراكمة، وإجمالي وقت اللعب.",
        ja: "ゲームのコレクション、完了したゲーム、バックログ、および合計プレイ時間を表示します。",
        tr: "Oyun koleksiyonunuzu, tamamlanan oyunları, birikmiş işleri ve toplam oyun süresini görüntüler."
      },
      favorites: {
        pt: "Exibe seus jogos marcados como favoritos.",
        en: "Displays your games marked as favorites.",
        es: "Muestra tus juegos marcados como favoritos.",
        fr: "Affiche vos jeux favoris.",
        ru: "Показывает ваши избранные игры.",
        zh: "显示您标记为收藏的游戏。",
        ar: "يعرض ألعابك المفضلة.",
        ja: "お気に入りに登録されたゲームを表示します。",
        tr: "Favori olarak işaretlenmiş oyunlarınızı görüntüler."
      },
      playing: {
        pt: "Exibe os jogos que você está jogando atualmente.",
        en: "Displays the games you are currently playing.",
        es: "Muestra los juegos que estás jugando actualmente.",
        fr: "Affiche les jeux auxquels vous jouez actuellement.",
        ru: "Показывает игры, в которые вы сейчас играете.",
        zh: "显示您当前正在玩的游戏。",
        ar: "يعرض الألعاب التي تلعبها حاليًا.",
        ja: "現在プレイ中のゲームを表示します。",
        tr: "Şu anda oynadığınız oyunları görüntüler."
      },
      completed: {
        pt: "Exibe os jogos que você já completou ou platinou.",
        en: "Displays the games you have completed or platinumed.",
        es: "Muestra los juegos que ya has completado o platinado.",
        fr: "Affiche les jeux que vous avez terminés ou platinés.",
        ru: "Показывает завершенные или платиновые игры.",
        zh: "显示您已通关或获得白金奖杯的游戏。",
        ar: "يعرض الألعاب التي أكملتها أو حصلت على البلاتينية فيها.",
        ja: "完了またはプラチナを獲得したゲームを表示します。",
        tr: "Tamamladığınız veya platin aldığınız oyunları görüntüler."
      },
      backlog: {
        pt: "Exibe sua lista de jogos pendentes salvos no backlog.",
        en: "Displays your pending list of games saved in your backlog.",
        es: "Muestra tu lista de juegos pendientes guardados en el backlog.",
        fr: "Affiche votre liste de jeux en attente dans le backlog.",
        ru: "Показывает ваш список отложенных игр (бэклог).",
        zh: "显示您待玩清单中保存的待玩游戏。",
        ar: "يعرض قائمة الألعاب المعلقة المحفوظة في قائمة الألعاب المتراكمة.",
        ja: "バックログに保存されている未完了のゲームを表示します。",
        tr: "Birikmiş işlerinizde kayıtlı olan bekleyen oyunlar listenizi görüntüler."
      },
      statistics: {
        pt: "Exibe relatórios visuais e estatísticas detalhadas sobre o tempo de jogo e conclusão.",
        en: "Displays visual reports and detailed statistics about play time and completion.",
        es: "Muestra informes visuales y estadísticas detalladas sobre el tempo de juego y completado.",
        fr: "Affiche des rapports visuels et des statistiques détaillées sur le temps de jeu.",
        ru: "Показывает визуальные отчеты и статистику игрового времени.",
        zh: "显示有关游戏时间和通关进度的可视化报告和详细统计信息。",
        ar: "يعرض التقارير المرئية والإحصاءات التفصيلية حول وقت اللعب وإكمال الألعاب.",
        ja: "プレイ時間と完了に関する視覚的なレポートと詳細な統計を表示します。",
        tr: "Oyun süresi ve tamamlanma hakkında görsel raporlar ve ayrıntılı istatistikler görüntüler."
      },
      ranking: {
        pt: "Exibe o ranking global e classificação de notas de sua coleção de jogos.",
        en: "Displays the global ranking and rating classification of your game collection.",
        es: "Muestra la clasificación global de notas de tu colección de juegos.",
        fr: "Affiche le classement mondial et les notes de votre collection.",
        ru: "Показывает глобальный рейтинг и оценки вашей коллекции игр.",
        zh: "显示您的游戏收藏的全局排行和评分分类。",
        ar: "يعرض التصنيف العالمي وتقييم مجموعة ألعابك.",
        ja: "ゲームコレクションのグローバルランキングと評価分類を表示します。",
        tr: "Oyun koleksiyonunuzun genel sıralamasını ve derecelendirme sınıflandırmasını görüntüler."
      },
      storage: {
        pt: "Exibe informações de espaço e localização de armazenamento das mídias dos jogos.",
        en: "Displays disk space allocation and physical storage location of game files.",
        es: "Muestra información de asignación de espacio y almacenamiento de tus juegos.",
        fr: "Affiche les informations d'espace disque et l'emplacement de stockage des jeux.",
        ru: "Показывает распределение дискового пространства и место хранения файлов игр.",
        zh: "显示磁盘空间分配和游戏文件的物理存储位置。",
        ar: "يعرض تخصيص مساحة القرص وموقع التخزين الفعلي لملفات الألعاب.",
        ja: "ディスクスペースの割り当てとゲームファイルの物理的な保存場所を表示します。",
        tr: "Disk alanı tahsisini ve oyun dosyalarının fiziksel depolama konumunu görüntüler."
      },
      roadmap: {
        pt: "Exibe o roteiro de objetivos e conquistas de próximos jogos a serem platinados.",
        en: "Displays your future timeline of goals and achievements to platinum games.",
        es: "Muestra tu hoja de ruta de objetivos y logros para próximos juegos a platinar.",
        fr: "Affiche la feuille de route des objectifs et succès des prochains jeux à platiner.",
        ru: "Показывает дорожную карту целей и достижений для будущих платин в играх.",
        zh: "显示您的下一个需要打出白金奖杯的游戏的目标和成就路线图。",
        ar: "يعرض جدولك الزمني للأهداف والإنجازات القادمة للحصول على البلاتين في الألعاب.",
        ja: "プラチナを獲得するための目標と実積のロードマップを表示します。",
        tr: "Gelecekte platin alacağınız oyunlara yönelik hedefler ve başarılar yol haritasını görüntüler."
      },
      settings: {
        pt: "Acesse as configurações do sistema, preferências de idioma, tema e backups.",
        en: "Access system settings, language preferences, appearance themes, and backups.",
        es: "Accede a la configuración del sistema, preferencias de idioma, temas y copias de seguridad.",
        fr: "Accédez aux paramètres système, préférences de langue, thèmes et sauvegardes.",
        ru: "Перейти к настройкам системы, языковым предпочтениям, темам оформления и резервным копиям.",
        zh: "访问系统设置、语言偏好、外观主题和备份。",
        ar: "الوصول إلى إعدادات النظام، وتفضيلات اللغة، وموضوع المظهر، والنسخ الاحتياطية.",
        ja: "システム設定、言語設定、テーマ、およびバックアップにアクセスします。",
        tr: "Sistem ayarlarına, dil tercihlerine, görünüm temalarına ve yedeklemelere erişin."
      },
      randomGameBtn: {
        pt: "Sorteie um jogo para jogar.",
        en: "Roll a random game to play.",
        es: "Sortea un juego para jugar.",
        fr: "Tirez un jeu au sort pour jouer.",
        ru: "Выбрать случайную игру.",
        zh: "随机抽取一个游戏来玩。",
        ar: "سحب لعبة عشوائية للعب.",
        ja: "プレイするゲームをランダムに抽選します。",
        tr: "Oynamak için rastgele bir oyun seçin."
      },
      addGameBtn: {
        pt: "Adicione um novo jogo à sua coleção.",
        en: "Add a new game to your collection.",
        es: "Añade un nuevo juego a tu colección.",
        fr: "Ajouter un nouveau jeu à votre collection.",
        ru: "Добавить новую игру в коллекцию.",
        zh: "向您的收藏中添加一个新游戏。",
        ar: "أضf لعبة جديدة إلى مجموعتك.",
        ja: "新しいゲームをコレクションに追加します。",
        tr: "Koleksiyonunuza yeni bir oyun ekleyin."
      },
      profileBtn: {
        pt: "Acesse suas configurações de perfil.",
        en: "Access your profile settings.",
        es: "Accede a la configuración de tu perfil.",
        fr: "Accéder aux paramètres de votre profil.",
        ru: "Перейти к настройкам профиля.",
        zh: "访问您的个人资料设置。",
        ar: "الوصول إلى إعدادات ملفك الشخصي.",
        ja: "プロフィール設定にアクセスします。",
        tr: "Profil ayarlarınıza erişin."
      }
    };

    const item = tooltips[key];
    if (isPt) return item.pt;
    if (isEs) return item.es;
    if (isFr) return item.fr;
    if (isRu) return item.ru;
    if (isZh) return item.zh;
    if (isAr) return item.ar;
    if (isJa) return item.ja;
    if (isTr) return item.tr;
    return item.en; // English fallback
  };

  // Set page title
  useEffect(() => {
    document.title = "GamingHub | Sua coleção gamer, organizada do seu jeito.";
  }, []);

  // Seeding Database
  useEffect(() => {
    const seed = async () => {
      const dbEmptyV118 = localStorage.getItem('gaminghub_db_empty_v118');
      if (!dbEmptyV118) {
        await db.games.clear();
        localStorage.setItem('gaminghub_db_empty_v118', 'true');
        localStorage.setItem('gaminghub_db_seeded_10games', 'true');
      }
      const diskCount = await db.disks.count();
      if (diskCount === 0) {
        await db.disks.bulkAdd(INITIAL_DISKS);
      } else {
        const disksMigrated = localStorage.getItem('gaminghub_disks_migrated_v151');
        if (!disksMigrated) {
          const allDisks = await db.disks.toArray();
          const hasOldLabels = allDisks.some(d => d.label === 'Windows' || d.label === 'Expansion Disc I');
          if (hasOldLabels) {
            for (const disk of allDisks) {
              if (disk.label === 'Windows') {
                disk.label = 'Unidade A';
                await db.disks.put(disk);
              } else if (disk.label === 'Expansion Disc I') {
                disk.label = 'Unidade B';
                await db.disks.put(disk);
              }
            }
          }
          localStorage.setItem('gaminghub_disks_migrated_v151', 'true');
        }
      }
      const settingsCount = await db.settings.count();
      if (settingsCount === 0) {
        await db.settings.add({
          id: 'current',
          theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
          userAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4",
          userName: "Usuário Gamer",
          language: "Português (Brasil)"
        });
      }

      const roadmapCount = await db.roadmap.count();
      if (roadmapCount === 0) {
        await db.roadmap.bulkPut([
          { id: '1', title: 'Novos Temas', date: 'Q3 2026', description: 'Personalização avançada de cores e fontes.', status: 'planned', priority: 'Q3' },
          { id: '2', title: 'Integração Web', date: 'Q2 2026', description: 'Sincronização com Steam e PlayStation Network.', status: 'in-progress', priority: 'Q2' },
          { id: '3', title: 'Biblioteca Pública', date: 'Q1 2026', description: 'Compare sua biblioteca com amigos.', status: 'planned', priority: 'Q1' },
          { id: '4', title: 'Sincronização de capas e informações Steam', date: 'Q1 2026', description: 'Implementação de sistema e mecanismo que busca automaticamente capa e informações dos jogos ao cadastrar.', status: 'completed', priority: 'Q1' },
          { id: '5', title: 'Sincronização Steam', date: 'Q1 2026', description: 'Sistema de sincronizar conquistas da Steam na biblioteca além de outras estatísticas', status: 'planned', priority: 'Q1' }
        ]);
      } else {
        const r1 = await db.roadmap.get('1');
        if (r1) {
          await db.roadmap.update('1', { status: 'planned', date: 'Q3 2026' });
        }
        const r2 = await db.roadmap.get('2');
        if (r2 && r2.date === 'Q3 2024') {
          await db.roadmap.update('2', { date: 'Q2 2026' });
        }
        const r3 = await db.roadmap.get('3');
        if (r3) {
          await db.roadmap.update('3', { title: 'Biblioteca Pública', date: 'Q1 2026' });
        }
        const r4 = await db.roadmap.get('4');
        if (!r4) {
          await db.roadmap.put({
            id: '4',
            title: 'Sincronização de capas e informações Steam',
            date: 'Q1 2026',
            description: 'Implementação de sistema e mecanismo que busca automaticamente capa e informações dos jogos ao cadastrar.',
            status: 'completed',
            priority: 'Q1'
          });
        } else if (r4.status !== 'completed') {
          await db.roadmap.update('4', { status: 'completed' });
        }
        const r5 = await db.roadmap.get('5');
        if (!r5) {
          await db.roadmap.put({
            id: '5',
            title: 'Sincronização Steam',
            date: 'Q1 2026',
            description: 'Sistema de sincronizar conquistas da Steam na biblioteca além de outras estatísticas',
            status: 'planned',
            priority: 'Q1'
          });
        }
      }

      await db.changelog.put({ id: '1', version: '1.0.0', date: '2024-01-01', changes: ['Lançamento inicial', 'Gerenciamento de biblioteca', 'Modo escuro'] });
      await db.changelog.put({ id: '2', version: '1.0.1', date: '2024-02-15', changes: ['Melhorias de desempenho', 'Correção de filtros'] });
      await db.changelog.put({ 
        id: '3', 
        version: '1.1.7', 
        date: '2026-05-19', 
        changes: [
          'Nova tela de estatísticas',
          'Melhorias visuais',
          'Correções no ranking',
          'Adicionado idioma russo',
          'Adicionado idioma chinês',
          'Adicionado função atualização automática',
          'Pequenas correções',
          'Corrigido o problema de travamento na obtenção de troféus quando o alvo da ação não existia.'
        ] 
      });
      await db.changelog.put({ 
        id: '4', 
        version: '1.1.9', 
        date: '2026-06-17', 
        changes: [
          'Dicionário Temático Multilíngue (getTooltip)',
          'Menus de Navegação do Painel Lateral (Sidebar)',
          'Botões de Ação Principais da Barra Superior (Header)',
          'Dynamic Database Installation Modes',
          'Sinalização Visual de Atualizações',
          'Fluxo de Atualização Interativo',
          'Architectural & Visual Layout'
        ] 
      });
      await db.changelog.put({ 
        id: '5', 
        version: '1.2.0', 
        date: '2026-06-18', 
        changes: [
          'Botão Sincronizar Informações',
          'Otimização do banco de dados',
          'Ícone do app re-criado em dimensão 256x256'
        ] 
      });
      await db.changelog.put({ 
        id: '6', 
        version: '1.2.1', 
        date: '2026-06-18', 
        changes: [
          'Ajuste no layout dos cards dos jogos para formato de quadrado perfeito modernos (aspect-square) e pontas totalmente retas',
          'Exibição de jogos otimizada para 5 colunas por fileira',
          'Compactação visual do cabeçalho de filtros de gêneros e botões de ordenação para maior elegância',
          'Transformação dos blocos de estatísticas da Biblioteca (Jogando, Concluído e Backlog) em botões interativos de navegação direta',
          'Sinalização no Roadmap do status "Concluído" para a Sincronização de capas e informações Steam',
          'Implementação de dicionário tradutor interno para tradução de sinopses de jogos ao utilizar Sincronizar Informações'
        ] 
      });
      await db.changelog.put({
        id: '7',
        version: '1.3.0',
        date: '2026-06-19',
        changes: [
          'Sistema de atualização automática modernizado (com download via servidor local e instalação silenciosa automática ao fechar)',
          'Balão vermelho indicativo de atualização pendente exibido de forma imediata assim que o app inicia',
          'Aprimoramento de robustez do filtro de categorias e genres para evitar bugs inesperados'
        ]
      });
      await db.changelog.put({
        id: '8',
        version: '1.4.0',
        date: '2026-07-07',
        changes: [
          'Design do botão "Sortear Jogo" otimizado e minimalista, mantendo apenas o ícone do Dado',
          'Design do botão "Add Jogo" otimizado, mantendo apenas o símbolo "+"',
          'Redimensionamento inteligente e design totalmente responsivo dos cards de jogos na Biblioteca (títulos, estrelas de avaliação, tempo de jogo, ícones de plataforma e progresso)',
          'Suavização e refinamento da animação de escala e hover dos cards de jogos para maior fluidez e sutileza',
          'Listagem direta de jogos instalados ao abrir os detalhes de cada Unidade de Armazenamento'
        ]
      });
      await db.changelog.put({
        id: '9',
        version: '1.4.1',
        date: '2026-07-08',
        changes: [
          'Correção e automatização total do atualizador de sistema.',
          'Instalação inteligente.',
          'Redesenho completo do ícone de badge (troféu/medalha) do Nível do Jogador nas Estatísticas por um modelo futurista geométrico 3D sofisticado com linhas orbitais tecnológicas de energia',
          'Refinamento do sombreamento e glow traseiro do badge de nível de jogador para um visual super limpo, elegante e leve'
        ]
      });
      await db.changelog.put({
        id: '10',
        version: '1.4.2',
        date: '2026-07-09',
        changes: [
          'Correção definitiva do player de trailers do YouTube contra Erro 153 com suporte a modo sem cookies, autoplay silenciado e botão de visualização direta.'
        ]
      });
      await db.changelog.put({
        id: '11',
        version: '1.5.0',
        date: '2026-07-09',
        changes: [
          'Movimentação e unificação do Backup e Importação para a seção de Banco de Dados.',
          'Atualização dos botões Exportar e Importar para o mesmo modelo visual dos botões Reparar e Apagar.',
          'Padronização automática das unidades de armazenamento para Unidade A, Unidade B, etc. (C: até Z:).',
          'Adicionada nova função completa de adicionar e excluir unidades de armazenamento no painel.',
          'Suporte para personalização de letra da unidade, capacidade padrão de 500 GB e espaço de uso inicial.',
          'Cálculo e formatação inteligente de dados digitais (exibição em TB para unidades maiores ou iguais a 1000 GB).',
          'Diferenciação visual e estrutural completa entre as janelas "Adicionar Unidade" (sem botão de exclusão) e "Editar Disco" (com botão de exclusão).',
          'Organização da ordem das unidades de armazenamento arrastando e soltando (drag & drop) de forma intuitiva.',
          'Aprimorado o botão Apagar do Banco de Dados para limpar também a biblioteca, avatar, Usuário Gamer e redefinir o Armazenamento.',
          'Resolvido bug crítico de travamento e handles de arquivos no instalador NSIS através do encerramento limpo via API do Electron ao atualizar.'
        ]
      });
      await db.changelog.put({
        id: '12',
        version: '1.5.1',
        date: '2026-07-11',
        changes: [
          'Resolvido bug de backup onde os nomes personalizados das Unidades de Armazenamento não eram salvos e restaurados.',
          'Corrigida a exibição da Sinopse na tela de detalhes dos jogos para respeitar quebras de linha e parágrafos de forma correta e legível.'
        ]
      });
      await db.changelog.put({
        id: '13',
        version: '1.5.2',
        date: '2026-07-12',
        changes: [
          'Resolução definitiva na atualização dinâmica do contêiner "Adicionados Recentemente" e "Concluídos Recentemente" na tela de Estatísticas através do controle preciso de registros de data/hora.',
          'Correção de persistência nos nomes personalizados das Unidades de Armazenamento, garantindo consistência total ao importar, exportar ou recarregar os dados.'
        ]
      });
      await db.changelog.put({
        id: '14',
        version: '1.6.0',
        date: '2026-08-16',
        changes: [
          'Adicionado o botão "Carregar Capa de Fundo (horizontal)" na tela de Editar Jogo para envio de imagem panorâmica personalizada a partir do computador, com opções completas de alterar e remover foto.',
          'Reformulado o campo de Plataformas no formulário de jogo para abrir automaticamente a listagem de plataformas e inserção personalizada diretamente ao clicar no campo.',
          'Implementada a sugestão e preenchimento inteligente de Localização com base nas localizações já cadastradas na biblioteca (confirmado pela tecla TAB).',
          'Adicionado o novo campo de Região ao lado de Localização para catalogação detalhada da procedência dos jogos.',
          'Aprimorada a pesquisa global na barra superior para pesquisar e navegar diretamente para os resultados na Biblioteca mesmo ao buscar a partir da página de Detalhes de um jogo.',
          'Correção e sincronização em tempo real das listas "Adicionados Recentemente" e "Concluídos Recentemente" na tela de Estatísticas com ordenação cronológica precisa e suporte a jogos 100% zerados.'
        ]
      });

      // Ensure all games have valid addedAt, dateAdded and completedAt timestamps
      try {
        const allGames = await db.games.toArray();
        for (let i = 0; i < allGames.length; i++) {
          const game = allGames[i];
          const updates: Partial<Game> = {};
          
          if (!game.dateAdded || !game.addedAt) {
            const fallbackTime = game.dateAdded || game.addedAt || (1710000000000 + i * 1000);
            updates.dateAdded = fallbackTime;
            updates.addedAt = fallbackTime;
          }

          if ((game.status === 'Completos' || game.progress === 100) && !game.completedAt) {
            updates.completedAt = updates.dateAdded || game.dateAdded || game.addedAt || (1710000000000 + i * 1000);
          }

          if (Object.keys(updates).length > 0) {
            await db.games.update(game.id, updates);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar timestamps dos jogos:", err);
      }
    };
    seed();
  }, []);

  const handleGenreClick = (genre: string) => {
    setActiveGenres([genre]);
    setView('Library');
    window.scrollTo(0, 0);
  };

  const mainRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = async () => {
    await db.settings.update('current', { theme: theme === 'light' ? 'dark' : 'light' });
  };

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    setShowUpdateModal(true);
    setHasUpdateBadge(false);
    try {
      const res = await fetch('https://api.github.com/repos/davisonsant/GamingHub/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      if (res.status === 404) {
        setUpdateStatus('no-release');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '') : '';
      const current = "1.6.0";
      
      const latestParts = latestTag.split('.').map(Number);
      const currentParts = current.split('.').map(Number);
      
      let isNewer = false;
      for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
        const lp = latestParts[i] || 0;
        const cp = currentParts[i] || 0;
        if (lp > cp) {
          isNewer = true;
          break;
        } else if (lp < cp) {
          break;
        }
      }
      
      setLatestReleaseData(data);
      if (isNewer) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch (err) {
      console.error(err);
      setUpdateStatus('error');
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: games.length,
      playing: games.filter(g => g.status === 'Jogando').length,
      completed: games.filter(g => g.status === 'Completos').length,
      backlog: games.filter(g => g.status === 'Backlog').length,
      totalTime: games.reduce((acc, g) => acc + g.playtime, 0)
    };
  }, [games]);

  const extraStats = useMemo(() => {
    const totalFavorites = games.filter(g => g.isFavorite).length;
    const platinumTotal = games.filter(g => g.isPlatinum).length;
    
    // Most used platform
    const platformCounts: Record<string, number> = {};
    games.forEach(g => {
      if (Array.isArray(g.platform)) {
        g.platform.forEach(p => {
          platformCounts[p] = (platformCounts[p] || 0) + 1;
        });
      }
    });
    const mostUsedPlatform = Object.entries(platformCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';
    
    // Favorite Genre
    const genreCounts: Record<string, number> = {};
    games.forEach(g => {
      g.genres?.forEach(gen => {
        genreCounts[gen] = (genreCounts[gen] || 0) + 1;
      });
    });
    const favoriteGenre = Object.entries(genreCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';
    
    // Total Size calculation
    let totalSizeBytes = 0;
    games.forEach(g => {
      if (g.size) {
        const match = g.size.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
        if (match) {
          let value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'MB') value *= 1024 * 1024;
          else if (unit === 'GB') value *= 1024 * 1024 * 1024;
          else if (unit === 'TB') value *= 1024 * 1024 * 1024 * 1024;
          else if (unit === 'KB') value *= 1024;
          totalSizeBytes += value;
        }
      }
    });

    const totalSizeFormatted = totalSizeBytes > 1024 * 1024 * 1024 * 1024 
      ? (totalSizeBytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB'
      : (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';

    const top3 = games
      .filter(g => g.isFavorite && g.progress === 100 && g.isPlatinum)
      .sort((a,b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
      
    const recentlyAdded = [...games].sort((a, b) => {
      const timeA = a.dateAdded || a.addedAt || 0;
      const timeB = b.dateAdded || b.addedAt || 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.id || "").localeCompare(a.id || "");
    }).slice(0, 4);

    const recentlyCompleted = games
      .filter(g => g.status === 'Completos' || g.progress === 100)
      .sort((a, b) => {
        const timeA = a.completedAt || a.dateAdded || a.addedAt || 0;
        const timeB = b.completedAt || b.dateAdded || b.addedAt || 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || "").localeCompare(a.id || "");
      })
      .slice(0, 4);
    
    // Gamer Level Calculation (Based on Campaign Progress)
    const experiencePoints = games.reduce((acc, g) => acc + (g.progress || 0), 0);
    const gamerLevel = Math.floor(experiencePoints / 100);
    const progressToNextLevel = experiencePoints % 100;
    
    let gamerTier = 'BRONZE II';
    let tierColor = 'from-amber-900 to-amber-950';

    if (gamerLevel >= 10 && gamerLevel < 25) {
      gamerTier = 'BRONZE';
      tierColor = 'from-amber-700 to-amber-900';
    } else if (gamerLevel >= 25 && gamerLevel < 35) {
      gamerTier = 'PRATA';
      tierColor = 'from-slate-400 to-slate-600';
    } else if (gamerLevel >= 35 && gamerLevel < 45) {
      gamerTier = 'OURO';
      tierColor = 'from-yellow-400 to-yellow-600';
    } else if (gamerLevel >= 45 && gamerLevel < 65) {
      gamerTier = 'SAFIRA';
      tierColor = 'from-blue-500 to-blue-800';
    } else if (gamerLevel >= 65 && gamerLevel < 75) {
      gamerTier = 'AMETISTA';
      tierColor = 'from-purple-500 to-purple-800';
    } else if (gamerLevel >= 75 && gamerLevel < 100) {
      gamerTier = 'RUBI';
      tierColor = 'from-red-500 to-red-800';
    } else if (gamerLevel >= 100 && gamerLevel < 140) {
      gamerTier = 'ELITE';
      tierColor = 'from-zinc-800 to-black';
    } else if (gamerLevel >= 140 && gamerLevel < 155) {
      gamerTier = 'DIAMANTE';
      tierColor = 'from-cyan-100 via-white to-cyan-300';
    } else if (gamerLevel >= 155) {
      gamerTier = 'LENDÁRIO';
      tierColor = 'from-indigo-500 via-purple-500 to-pink-500';
    }

    // Platinum Rank Logic
    let platinumRank = { index: -1, name: '-', color: 'from-gray-400 to-gray-600', textColor: 'text-gray-100' };
    if (platinumTotal >= 1 && platinumTotal <= 20) {
      platinumRank = { index: 0, name: t.rank1, color: 'from-amber-800 to-amber-950', textColor: 'text-amber-200' };
    } else if (platinumTotal > 20 && platinumTotal <= 40) {
      platinumRank = { index: 1, name: t.rank2, color: 'from-amber-600 to-amber-800', textColor: 'text-amber-100' };
    } else if (platinumTotal > 40 && platinumTotal <= 70) {
      platinumRank = { index: 2, name: t.rank3, color: 'from-slate-400 to-slate-600', textColor: 'text-slate-100' };
    } else if (platinumTotal > 70 && platinumTotal <= 100) {
      platinumRank = { index: 3, name: t.rank4, color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-100' };
    } else if (platinumTotal > 100 && platinumTotal <= 140) {
      platinumRank = { index: 4, name: t.rank5, color: 'from-cyan-400 to-blue-600', textColor: 'text-white' };
    } else if (platinumTotal > 140 && platinumTotal <= 190) {
      platinumRank = { index: 5, name: t.rank6, color: 'from-violet-500 to-purple-800', textColor: 'text-white' };
    } else if (platinumTotal > 190 && platinumTotal <= 250) {
      platinumRank = { index: 6, name: t.rank7, color: 'from-rose-500 to-red-800', textColor: 'text-white' };
    } else if (platinumTotal > 250 && platinumTotal <= 320) {
      platinumRank = { index: 7, name: t.rank8, color: 'from-slate-800 to-black', textColor: 'text-yellow-400' };
    } else if (platinumTotal > 320 && platinumTotal <= 400) {
      platinumRank = { index: 8, name: t.rank9, color: 'from-cyan-100 via-white to-cyan-200', textColor: 'text-cyan-800' };
    } else if (platinumTotal > 400) {
      platinumRank = { index: 9, name: t.rank10, color: 'from-indigo-500 via-purple-500 to-pink-500', textColor: 'text-white' };
    }

    const storageByPlatform = (() => {
      const platformSize: Record<string, number> = {};
      games.forEach(g => {
        if (g.size && Array.isArray(g.platform)) {
          const match = g.size.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
          if (match) {
            let value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            if (unit === 'MB') value *= 1024 * 1024;
            else if (unit === 'GB') value *= 1024 * 1024 * 1024;
            else if (unit === 'TB') value *= 1024 * 1024 * 1024 * 1024;
            else if (unit === 'KB') value *= 1024;
            
            g.platform.forEach(p => {
              platformSize[p] = (platformSize[p] || 0) + value;
            });
          }
        }
      });

      return Object.entries(platformSize).map(([name, bytes]) => ({
        name,
        size: bytes > 1024 * 1024 * 1024 * 1024 
          ? (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1) + ' TB'
          : (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
        bytes
      })).sort((a, b) => b.bytes - a.bytes);
    })();

    const largestGames = (() => {
      return [...games].map(g => {
        let bytes = 0;
        if (g.size) {
          const match = g.size.match(/([\d.]+)\s*(GB|MB|KB|TB)/i);
          if (match) {
            let value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            if (unit === 'MB') value *= 1024 * 1024;
            else if (unit === 'GB') value *= 1024 * 1024 * 1024;
            else if (unit === 'TB') value *= 1024 * 1024 * 1024 * 1024;
            else if (unit === 'KB') value *= 1024;
            bytes = value;
          }
        }
        return { ...g, bytes };
      }).sort((a, b) => b.bytes - a.bytes).slice(0, 10);
    })();

    const mostPlayedGame = [...games].sort((a, b) => b.playtime - a.playtime)[0] || null;

    return {
      totalFavorites,
      platinumTotal,
      mostUsedPlatform,
      favoriteGenre,
      totalSizeFormatted,
      top3,
      recentlyAdded,
      recentlyCompleted,
      platinumRank,
      storageByPlatform,
      largestGames,
      gamerLevel,
      gamerTier,
      tierColor,
      progressToNextLevel,
      experiencePoints,
      mostPlayedGame
    };
  }, [games]);

  // Filtering
  const filteredGames = useMemo(() => {
    let list = games;
    
    // View filtering
    if (view === 'Favorites') list = list.filter(g => g.isFavorite);
    else if (view === 'Playing') list = list.filter(g => g.status === 'Jogando');
    else if (view === 'Completed') list = list.filter(g => g.status === 'Completos');
    else if (view === 'Backlog') list = list.filter(g => g.status === 'Backlog');
    else if (view === 'Stats') list = list.filter(g => g.status === 'Backlog'); // Duplicating Backlog as Stats
    
    // Search
    if (searchQuery.trim()) {
      list = list.filter(g => matchesGameTitle(g.title, searchQuery));
    }

    // Genre
    if (activeGenres.length > 0) {
      list = list.filter(g => g && g.genres && Array.isArray(g.genres) && g.genres.some(genre => activeGenres.includes(genre)));
    }

    // Platform
    if (activePlatform !== 'Todas') {
      list = list.filter(g => {
        if (!g || !g.platform) return false;
        if (Array.isArray(g.platform)) return g.platform.includes(activePlatform);
        return String(g.platform).includes(activePlatform);
      });
    }

    // Developer
    if (activeDeveloper !== 'Todos') {
      list = list.filter(g => g && g.developer && g.developer === activeDeveloper);
    }

    // Year
    if (activeYear !== 'Todos') {
      list = list.filter(g => g && g.releaseDate && String(g.releaseDate).includes(activeYear));
    }

    // Platinum
    if (platinumFilter === 'platinum') {
      list = list.filter(g => g && g.isPlatinum === true);
    } else if (platinumFilter === 'not_platinum') {
      list = list.filter(g => g && g.isPlatinum !== true);
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'Title':
          return (a.title || "").localeCompare(b.title || "");
        case 'Playtime':
          return (b.playtime || 0) - (a.playtime || 0);
        case 'Rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'Date':
        default: {
          const timeA = a.dateAdded || a.addedAt || 0;
          const timeB = b.dateAdded || b.addedAt || 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || "").localeCompare(a.id || "");
        }
      }
    });

    return list;
  }, [games, view, searchQuery, activeGenres, activePlatform, activeDeveloper, activeYear, platinumFilter, sortBy]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    games.forEach(g => {
      if (g && Array.isArray(g.genres)) {
        g.genres.forEach(genre => {
          if (genre) genres.add(genre);
        });
      }
    });
    return ['Todos', ...Array.from(genres)];
  }, [games]);

  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    games.forEach(g => {
      if (Array.isArray(g.platform)) {
        g.platform.forEach(p => platforms.add(p));
      } else if (g.platform) {
        platforms.add(g.platform);
      }
    });
    return ['Todas', ...Array.from(platforms).sort()];
  }, [games]);

  const allDevelopers = useMemo(() => {
    const devs = new Set<string>();
    games.forEach(g => devs.add(g.developer));
    return ['Todos', ...Array.from(devs).sort()];
  }, [games]);

  const allYears = useMemo(() => {
    const years = new Set<string>();
    games.forEach(g => {
      const match = g.releaseDate.match(/\d{4}/);
      if (match) years.add(match[0]);
    });
    return ['Todos', ...Array.from(years).sort((a, b) => b.localeCompare(a))];
  }, [games]);

  const selectedGame = games.find(g => g.id === selectedGameId);

  const handleToggleFavorite = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    const game = await db.games.get(id);
    if (game) {
      await db.games.update(id, { isFavorite: !game.isFavorite });
    }
  };

  const handleDeleteGame = async (id: string) => {
    await db.games.delete(id);
    setView('Library');
    setSelectedGameId(null);
  };

  const handleUpdateGameFields = async (id: string, updates: Partial<Game>) => {
    await db.games.update(id, updates);
  };

  const handleSaveGame = async (gameData: Partial<Game>) => {
    if (view === 'Edit' && selectedGameId) {
      const { id, ...updates } = gameData;
      const isCompleted = updates.status === 'Completos' || (updates.progress !== undefined && updates.progress === 100);
      const oldGame = await db.games.get(selectedGameId);
      const wasCompleted = oldGame?.status === 'Completos' || (oldGame?.progress ?? 0) === 100;
      
      if (isCompleted && !wasCompleted) {
        (updates as any).completedAt = Date.now();
      } else if (updates.status && updates.status !== 'Completos' && (updates.progress === undefined ? (oldGame?.progress ?? 0) < 100 : updates.progress < 100)) {
        (updates as any).completedAt = undefined;
      }
      await db.games.update(selectedGameId, updates);
      setView('Details');
    } else {
      const now = Date.now();
      const isCompleted = gameData.status === 'Completos' || gameData.progress === 100;
      const newGame: Game = {
        title: gameData.title || 'Novo Jogo',
        genre: gameData.genre || '',
        status: gameData.status || 'Backlog',
        playtime: gameData.playtime || 0,
        progress: gameData.progress || 0,
        rating: gameData.rating || 0,
        coverUrl: gameData.coverUrl || '',
        isFavorite: gameData.isFavorite || false,
        platform: gameData.platform || [],
        releaseDate: gameData.releaseDate || '',
        developer: gameData.developer || '',
        publisher: gameData.publisher || '',
        location: gameData.location || '',
        region: gameData.region || '',
        synopsis: gameData.synopsis || '',
        genres: gameData.genres || [],
        trailerUrl: gameData.trailerUrl,
        bannerUrl: gameData.bannerUrl || '',
        isPlatinum: gameData.isPlatinum || false,
        build: gameData.build || '',
        version: gameData.version || '',
        dlc: gameData.dlc || '',
        size: gameData.size || '',
        id: Math.random().toString(36).substr(2, 9),
        addedAt: now,
        dateAdded: now,
        completedAt: isCompleted ? now : undefined,
      };
      await db.games.add(newGame);
      setView('Library');
    }
  };

  const navigateToDetails = (id: string) => {
    setSelectedGameId(id);
    setView('Details');
  };

  const handleLuckyDraw = () => {
    const nonCompleted = games.filter(g => g.status !== 'Completos');
    if (nonCompleted.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonCompleted.length);
      setLuckyGame(nonCompleted[randomIndex]);
      setShowLuckyModal(true);
    } else {
      alert("Todos os jogos da sua biblioteca já foram completados! Parabéns!");
    }
  };

  const handleExport = (fullBackup = false) => {
    const data = fullBackup 
      ? { games, theme, userAvatar, userName, disks, version: '1.0.4' }
      : games;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullBackup ? `gaminghub-backup-${new Date().toISOString().split('T')[0]}.json` : `gaminghub-library.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (fullRestore = false) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (fullRestore) {
             if (parsed.games) {
                await db.games.clear();
                await db.games.bulkAdd(parsed.games);
             }
             if (parsed.theme || parsed.userAvatar || parsed.userName) {
                await db.settings.update('current', {
                   theme: parsed.theme || theme,
                   userAvatar: parsed.userAvatar || userAvatar,
                   userName: parsed.userName || userName
                });
             }
             if (parsed.disks && Array.isArray(parsed.disks)) {
                await db.disks.clear();
                await db.disks.bulkAdd(parsed.disks);
                localStorage.setItem('gaminghub_disks_migrated_v151', 'true');
             }
             alert("Backup restaurado com sucesso!");
          } else {
             // Just games or generic import
             const importedGames = Array.isArray(parsed) ? parsed : (parsed.games || []);
             if (confirm("Deseja substituir sua biblioteca atual ou adicionar os novos jogos? (OK = Substituir, Cancelar = Adicionar)")) {
                await db.games.clear();
                await db.games.bulkAdd(importedGames);
             } else {
                const existing = await db.games.toArray();
                const existingIds = new Set(existing.map(g => g.id));
                const uniqueNew = importedGames.filter((g: Game) => !existingIds.has(g.id));
                await db.games.bulkAdd(uniqueNew);
             }
          }
        } catch (err) {
          alert("Erro ao importar arquivo. Verifique se o formato está correto.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearDatabase = () => {
    setShowClearDbModal(true);
    setDbClearAware(false);
  };

  const confirmClearDatabase = async () => {
    if (!dbClearAware) return;
    try {
      await db.games.clear();
      await db.settings.update('current', {
        userAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4",
        userName: "Usuário Gamer"
      });
      await db.disks.clear();
      await db.disks.bulkAdd(INITIAL_DISKS);
      setShowClearDbModal(false);
      alert("Banco de dados local limpo com sucesso!");
    } catch (err) {
      alert("Erro ao limpar banco de dados.");
      console.error(err);
    }
  };

  const handleRepairDatabase = async () => {
    try {
      const existing = await db.games.toArray();
      const existingTitles = new Set(existing.map(g => g.title));
      const missing = INITIAL_GAMES.filter(g => !existingTitles.has(g.title));
      
      if (missing.length > 0) {
        if (confirm(`Reparação: ${missing.length} jogos do sistema estão ausentes. Deseja restaurar esses títulos padrão?`)) {
          await db.games.bulkAdd(missing);
          alert("Banco de dados reparado com sucesso!");
        }
      } else {
        alert("Integridade do banco de dados verificada. Tudo parece estar em ordem.");
      }
    } catch (err) {
      alert("Erro ao reparar banco de dados.");
      console.error(err);
    }
  };

  const handleSaveDisk = async (diskData: Disk) => {
    await db.disks.put(diskData);
    setShowEditDiskModal(false);
    setEditingDisk(null);
  };

  const handleAddDisk = () => {
    // Letters from C to Z, then A, B
    const possibleLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B'];
    const usedLetters = disks.map(d => (d.letter || '').toUpperCase());
    const nextLetter = possibleLetters.find(l => !usedLetters.includes(l)) || 'C';

    // Name suffixes from A to Z, then AA, BB etc.
    const possibleSuffixes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    const usedLabels = disks.map(d => (d.label || '').trim());
    
    // Find the first suffix not used in labels (e.g. "Unidade A", "Unidade B"...)
    let nextSuffix = 'A';
    for (const suffix of possibleSuffixes) {
      const candidateLabel = `Unidade ${suffix}`;
      if (!usedLabels.includes(candidateLabel)) {
        nextSuffix = suffix;
        break;
      }
    }

    const newDisk: Disk = {
      id: Date.now().toString(),
      label: `Unidade ${nextSuffix}`,
      letter: nextLetter,
      totalGB: 500,
      usedGB: 0
    };

    setEditingDisk(newDisk);
    setShowEditDiskModal(true);
  };

  const handleDeleteDisk = async (diskId: string) => {
    await db.disks.delete(diskId);
    setShowEditDiskModal(false);
    setEditingDisk(null);
  };

  const handleReorderDisks = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const items = [...disks];
    const draggedIdx = items.findIndex(d => d.id === draggedId);
    const targetIdx = items.findIndex(d => d.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;

    const [draggedItem] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, draggedItem);

    for (let i = 0; i < items.length; i++) {
      items[i].sortOrder = i;
      await db.disks.put(items[i]);
    }
  };

  const handleSetRankingGame = async (gameId: string, slot: number) => {
    // Clear slot from this game if it already had one
    const existingForSlot = games.find(g => g.rankingPos === slot);
    if (existingForSlot) {
      await db.games.update(existingForSlot.id, { rankingPos: undefined });
    }
    
    // Set new game for slot
    await db.games.update(gameId, { rankingPos: slot });
    
    setShowRankingSelectModal(false);
    setRankingSlotToEdit(null);
  };

  const handleRemoveFromRanking = async (gameId: string) => {
    await db.games.update(gameId, { rankingPos: undefined });
  };

  const handleSaveRoadmapItem = async (data: Partial<RoadmapItem>) => {
    if (editingRoadmapItem) {
      const { id, ...updates } = data;
      await db.roadmap.update(editingRoadmapItem.id, updates);
    } else {
      await db.roadmap.add({
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      } as RoadmapItem);
    }
    setShowAddRoadmapModal(false);
    setEditingRoadmapItem(null);
  };

  const handleDeleteRoadmapItem = async (id: string) => {
    await db.roadmap.delete(id);
    setShowAddRoadmapModal(false);
    setEditingRoadmapItem(null);
  };

  const handleSaveChangelogEntry = async (data: Partial<ChangelogEntry>) => {
    if (editingChangelogEntry) {
      const { id, ...updates } = data;
      await db.changelog.update(editingChangelogEntry.id, updates);
    } else {
      await db.changelog.add({
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      } as ChangelogEntry);
    }
    setShowAddChangelogModal(false);
    setEditingChangelogEntry(null);
  };

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case 'Jogando': return 'bg-primary-container text-on-primary-container';
      case 'Completos': return 'bg-tertiary-container text-on-tertiary-container';
      case 'Backlog': return 'bg-secondary-container text-on-secondary-container';
      default: return 'bg-surface-container-highest text-on-surface';
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-stretch transition-colors duration-300">
      <div className="w-full flex relative">
        {/* Sidebar Backdrop for Mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky lg:top-0 h-screen w-[var(--spacing-sidebar-width)] 
          bg-surface-container-low/95 lg:bg-surface-container-low/40 backdrop-blur-xl border-r border-outline-variant/20 
          flex flex-col py-8 z-[60] shrink-0 transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-6 mb-8 flex items-center justify-between h-[var(--spacing-header-height)]">
            <div className="flex items-center gap-3 text-primary font-display font-bold text-xl tracking-tight">
              <span className="material-symbols-outlined text-3xl">sports_esports</span>
              <span>GamingHub</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-2 hover:bg-surface-container rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <nav className="flex-1 px-3 space-y-1">
            <NavItem active={view === 'Library'} onClick={() => { setView('Library'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">sports_esports</span>} label={t.library} tooltip={getTooltip('library')} />
            <NavItem active={view === 'Favorites'} onClick={() => { setView('Favorites'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">favorite</span>} label={t.favorites} tooltip={getTooltip('favorites')} />
            <NavItem active={view === 'Playing'} onClick={() => { setView('Playing'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">play_circle</span>} label={t.playing} tooltip={getTooltip('playing')} />
            <NavItem active={view === 'Completed'} onClick={() => { setView('Completed'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">check_circle</span>} label={t.completed} tooltip={getTooltip('completed')} />
            <NavItem active={view === 'Backlog'} onClick={() => { setView('Backlog'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">inbox</span>} label={t.backlog} tooltip={getTooltip('backlog')} />
            <NavItem active={view === 'Stats'} onClick={() => { setView('Stats'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">insights</span>} label={t.statistics} tooltip={getTooltip('statistics')} />
            <NavItem active={view === 'Ranking'} onClick={() => { setView('Ranking'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">auto_awesome_motion</span>} label={t.ranking} tooltip={getTooltip('ranking')} />
            <NavItem active={view === 'Storage'} onClick={() => { setView('Storage'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">storage</span>} label={t.storage} tooltip={getTooltip('storage')} />
            <NavItem active={view === 'Roadmap'} onClick={() => { setView('Roadmap'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">map</span>} label={t.roadmap} tooltip={getTooltip('roadmap')} />
            <NavItem active={view === 'Settings'} onClick={() => { setView('Settings'); setMobileMenuOpen(false); }} icon={<span className="material-symbols-outlined">settings</span>} label={t.settings} tooltip={getTooltip('settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
          {/* TopBar */}
          <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-outline-variant/10 h-[var(--spacing-header-height)] flex items-center justify-between px-6 gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center mr-1"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              {view === 'Details' && (
                <button onClick={() => setView('Library')} className="p-2 hover:bg-surface-container rounded-lg transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
              )}
              <div className="relative w-full max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] pointer-events-none">search</span>
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (val.trim().length > 0 && view !== 'Library' && view !== 'Favorites' && view !== 'Playing' && view !== 'Completed' && view !== 'Backlog') {
                      setView('Library');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && view !== 'Library' && view !== 'Favorites' && view !== 'Playing' && view !== 'Completed' && view !== 'Backlog') {
                      setView('Library');
                    }
                  }}
                  className={`w-full bg-surface-container-low border border-outline-variant/5 rounded-lg pl-10 ${searchQuery ? 'pr-9' : 'pr-4'} py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none`}
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Limpar busca"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-surface-container rounded-full transition-colors relative h-10 w-10 flex items-center justify-center overflow-hidden"
            >
              <motion.div
                initial={false}
                animate={{ y: theme === 'light' ? 0 : 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-outline">dark_mode</span>
              </motion.div>
              <motion.div
                initial={false}
                animate={{ y: theme === 'dark' ? 0 : -40 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-yellow-500">light_mode</span>
              </motion.div>
            </button>
            <button 
              onClick={checkForUpdates}
              className="p-2 hover:bg-surface-container rounded-full transition-colors relative h-10 w-10 flex items-center justify-center text-outline hover:text-primary transition-all group"
              title={language === 'English (US)' ? 'Check for updates' : 'Verificar atualizações'}
            >
              <span className="material-symbols-outlined group-hover:scale-110 group-active:scale-95 transition-transform">system_update_alt</span>
              {hasUpdateBadge && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setShowBugReportModal(true)}
              className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
              title={t.bugReportTitle}
            >
              <span className="material-symbols-outlined text-outline">bug_report</span>
            </button>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <button 
              onClick={() => handleLuckyDraw()}
              title={getTooltip('randomGameBtn')}
              className="h-10 w-10 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-all flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">casino</span>
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('Add')}
              title={getTooltip('addGameBtn')}
              className="h-10 w-10 bg-primary text-on-primary rounded-full text-xl font-bold shadow-sm hover:brightness-110 transition-all flex items-center justify-center cursor-pointer"
            >
              +
            </motion.button>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => setView('Settings')}
                title={getTooltip('profileBtn')}
                className="w-8 h-8 rounded-full border border-outline-variant shadow-sm hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden active:scale-95 cursor-pointer outline-none"
              >
                <img 
                  src={userAvatar || DEFAULT_AVATAR} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-[var(--spacing-content-padding)] flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {(view === 'Library' || view === 'Favorites' || view === 'Playing' || view === 'Completed' || view === 'Backlog' || view === 'Stats' || view === 'Ranking' || view === 'Storage' || view === 'Roadmap') && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 lg:space-y-8"
              >
                {view !== 'Stats' && view !== 'Ranking' && view !== 'Storage' && view !== 'Roadmap' ? (
                  <>
                    {/* Header Section */}
                    <div className="mb-10 lg:mb-12">
                      <h1 className="font-display font-bold text-headline-md lg:text-7xl text-on-surface tracking-tight leading-none mb-4">
                        {view === 'Favorites' ? t.favorites : 
                         view === 'Playing' ? t.playing : 
                         view === 'Completed' ? t.completed : 
                         view === 'Backlog' ? t.backlog : t.library}
                      </h1>
                      <p className="text-on-surface-variant text-body-sm lg:text-2xl font-medium opacity-80">
                        {t.librarySubtitle}
                      </p>
                    </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                  <StatCard label={t.totalGames} value={stats.total} color="text-primary" icon="inventory_2" />
                  <StatCard label={t.playing} value={stats.playing} color="text-primary" icon="play_circle" onClick={() => setView('Playing')} />
                  <StatCard label={t.completed} value={stats.completed} color="text-primary" icon="check_circle" onClick={() => setView('Completed')} />
                  <StatCard label={t.backlog} value={stats.backlog} color="text-primary" icon="inbox" onClick={() => setView('Backlog')} />
                  <StatCard label={t.totalTime} value={`${stats.totalTime}h`} color="text-primary" icon="schedule" />
                </div>

                {/* Filter Bar */}
                <div className="bg-surface-container-low border border-outline-variant/10 p-2 rounded-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between shadow-sm gap-3">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5 lg:pb-0">
                    {['Todos', 'RPG', 'Aventura', 'Ação', 'Mundo Aberto', 'Third-person', 'Shooter', 'Indie', 'Fantasia', 'Simulação', 'Corrida', 'Sci-Fi', 'Esporte', 'Stealth'].map(genre => {
                      const isTodos = genre === 'Todos';
                      const isActive = isTodos ? activeGenres.length === 0 : activeGenres.includes(genre);
                      
                      return (
                        <button 
                          key={genre}
                          onClick={() => {
                            if (isTodos) {
                              setActiveGenres([]);
                            } else {
                              setActiveGenres(prev => 
                                prev.includes(genre) 
                                  ? prev.filter(g => g !== genre)
                                  : [...prev, genre]
                              );
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            isActive 
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-102' 
                              : 'text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/10'
                          }`}
                        >
                          {!isTodos && activeGenres.includes(genre) && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                          {genre === 'Todos' ? t.all : genre}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3 lg:ml-6 pr-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-1 lg:pb-0">
                    {activeGenres.length > 1 && (
                      <button 
                        onClick={() => setActiveGenres([])}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                      >
                        Limpar Seleção
                      </button>
                    )}
                    <button 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                        showAdvancedFilters 
                          ? 'bg-primary/10 border-primary/40 text-primary' 
                          : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">filter_list</span>
                      Filtros
                      <span className={`material-symbols-outlined text-[16px] transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    <div className="relative">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/30 rounded-lg text-[11px] font-bold text-on-surface-variant bg-transparent hover:bg-surface-container-high transition-all whitespace-nowrap appearance-none outline-none pr-8 cursor-pointer"
                      >
                        <option value="Date">Recentes</option>
                        <option value="Title">Título (A-Z)</option>
                        <option value="Playtime">Horas</option>
                        <option value="Rating">Avaliação</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] opacity-50">sort</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Panel */}
                <AnimatePresence>
                  {showAdvancedFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-surface-container-low/80 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/30 shadow-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">Plataforma</p>
                          <div className="relative">
                            <select 
                              value={activePlatform}
                              onChange={(e) => setActivePlatform(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{t.genres}</p>
                          <div className="relative">
                            <select 
                              value={activeGenres[0] || 'Todos'}
                              onChange={(e) => setActiveGenres(e.target.value === 'Todos' ? [] : [e.target.value])}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allGenres.map(g => <option key={g} value={g}>{g === 'Todos' ? t.all : g}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{t.developer}</p>
                          <div className="relative">
                            <select 
                              value={activeDeveloper}
                              onChange={(e) => setActiveDeveloper(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allDevelopers.map(d => <option key={d} value={d}>{d === 'Todos' ? t.all : d}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{t.releaseYear}</p>
                          <div className="relative">
                            <select 
                              value={activeYear}
                              onChange={(e) => setActiveYear(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allYears.map(y => <option key={y} value={y}>{y === 'Todos' ? t.all : y}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{t.platinumGames}</p>
                          <div className="relative">
                            <select 
                              value={platinumFilter}
                              onChange={(e) => setPlatinumFilter(e.target.value as 'all' | 'platinum' | 'not_platinum')}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              <option value="all">{t.all}</option>
                              <option value="platinum">
                                {language === 'English (US)' ? 'Platinumed' : (language === 'Español' ? 'Platinados' : (language === 'Français' ? 'Platinés' : (language === 'Русский' ? 'С платиной' : (language === '简体中文' ? '已达成白金' : 'Platinados'))))}
                              </option>
                              <option value="not_platinum">
                                {language === 'English (US)' ? 'Not Platinumed' : (language === 'Español' ? 'No Platinados' : (language === 'Français' ? 'Non Platinés' : (language === 'Русский' ? 'Без платины' : (language === '简体中文' ? '未达成白金' : 'Não Platinados'))))}
                              </option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-5 pt-2 flex justify-between items-center border-t border-outline-variant/10">
                          <p className="text-xs text-outline">{filteredGames.length} {t.gamesFound}</p>
                          <button 
                            onClick={() => {
                              setActiveGenres([]);
                              setActivePlatform('Todas');
                              setActiveDeveloper('Todos');
                              setActiveYear('Todos');
                              setPlatinumFilter('all');
                            }}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            {language === 'English (US)' ? 'Reset all filters' : (language === 'Español' ? 'Restablecer todos los filtros' : 'Resetar todos os filtros')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Grid */}
                <motion.div 
                  key={`${view}-${sortBy}-${searchQuery}-${activeGenres.join(',')}-${activePlatform}-${activeDeveloper}-${activeYear}-${platinumFilter}`}
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.03
                      }
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 lg:gap-6 pb-12"
                >
                  {filteredGames.map(game => (
                    <motion.div
                      key={game.id}
                      className="w-full"
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        show: { 
                          opacity: 1, 
                          y: 0,
                          transition: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }
                        }
                      }}
                    >
                      <GameCard 
                        game={game} 
                        t={t}
                        onToggleFavorite={handleToggleFavorite}
                        onUpdateStatus={async (id, status) => {
                          const updates: Partial<Game> = { status };
                          if (status === 'Completos') {
                            updates.completedAt = Date.now();
                          }
                          await db.games.update(id, updates);
                        }}
                        onClick={() => navigateToDetails(game.id)}
                        statusColor={getStatusColor(game.status)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            ) : (
              <div className="space-y-8 pb-20">
                {/* Stats Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h1 className="font-display font-bold text-headline-md lg:text-7xl text-on-surface tracking-tight leading-none mb-4">
                      {view === 'Ranking' ? t.ranking : 
                       view === 'Storage' ? t.storage : 
                       view === 'Roadmap' ? t.roadmap : t.statistics}
                    </h1>
                    <p className="text-on-surface-variant text-body-sm lg:text-2xl font-medium opacity-80 uppercase tracking-[0.2em]">
                      {view === 'Ranking' ? (language === 'English (US)' ? 'Global collection ranking' : 'Ranking global da coleção') : 
                       view === 'Storage' ? t.storageSubtitle : 
                       view === 'Roadmap' ? t.roadmapSubtitle : t.statsSubtitle}
                    </p>
                  </div>
                                    
                  {/* Space for additional header status if needed */}
                </div>

                {/* Secondary Metrics & Insights */}
                {view === 'Stats' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Gamer Level & Trophies */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface-container-low/60 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-8 flex flex-col shadow-sm relative overflow-hidden group">
                          {/* Background Decoration */}
                          <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${extraStats.tierColor} opacity-5 blur-[80px] rounded-full`} />
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                              <GamerTrophy level={extraStats.gamerLevel} />
                              <div>
                                <h3 className="text-3xl font-black text-on-surface tracking-tighter leading-none mb-1">{t.gamerLevel}</h3>
                                <div className="flex items-center gap-2">
                                  <p className={`text-[12px] font-black uppercase tracking-widest bg-gradient-to-br ${extraStats.tierColor} bg-clip-text text-transparent`}>
                                    {extraStats.gamerLevel >= 999 ? t.platinumTier : 
                                     extraStats.gamerLevel >= 600 ? t.goldTier : 
                                     extraStats.gamerLevel >= 300 ? t.silverTier : t.bronzeTier}
                                  </p>
                                  <span className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
                                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{extraStats.experiencePoints} XP Total</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                               <div className="text-6xl font-black text-on-surface flex items-baseline gap-1 justify-end">
                                 <span className="text-sm text-on-surface-variant font-bold mb-1">LV.</span>
                                 {extraStats.gamerLevel}
                               </div>
                            </div>
                          </div>

                          <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t.levelProgress}</span>
                              <span className="text-[10px] font-black text-on-surface">{extraStats.progressToNextLevel}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-surface-container overflow-hidden p-[2px] shadow-inner border border-outline-variant/10">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${extraStats.progressToNextLevel}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full rounded-full bg-gradient-to-r ${extraStats.tierColor} shadow-[0_0_15px_rgba(var(--primary),0.3)]`} 
                              />
                            </div>
                            <div className="flex justify-between text-[9px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">
                               <div className="flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[10px]">trending_up</span>
                                 <span>{extraStats.experiencePoints % 100} / 100 XP</span>
                               </div>
                               <span>{t.nextLevel}: {((Math.floor(extraStats.experiencePoints / 100) + 1) * 100)} XP</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                            <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 flex flex-col items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-primary text-xl">emoji_events</span>
                              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{t.platinumGames}</span>
                              <span className="text-xl font-black text-on-surface">{extraStats.platinumTotal}</span>
                            </div>
                            <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 flex flex-col items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
                              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{t.completed}</span>
                              <span className="text-xl font-black text-on-surface">{stats.completed}</span>
                            </div>
                            <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 flex flex-col items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-amber-500 text-xl">favorite</span>
                              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{t.favorites}</span>
                              <span className="text-xl font-black text-on-surface">{extraStats.totalFavorites}</span>
                            </div>
                            <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 flex flex-col items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-blue-500 text-xl">schedule</span>
                              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{t.totalTime}</span>
                              <span className="text-xl font-black text-on-surface">{stats.totalTime}h</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container-low/50 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">stars</span>
                              <h2 className="text-xl font-bold uppercase tracking-tight">{t.top3Title}</h2>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {extraStats.top3.length > 0 ? extraStats.top3.map((game, i) => (
                              <div key={game.id} className="relative group cursor-pointer" onClick={() => navigateToDetails(game.id)}>
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20 group-hover:scale-[1.02] transition-transform duration-500">
                                  <img src={game.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover" alt={game.title} />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 flex flex-col justify-end p-4">
                                    <h4 className="text-white text-xs font-bold truncate mb-1">{game.title}</h4>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, star) => (
                                        <span key={star} className={`material-symbols-outlined text-[10px] ${star < game.rating ? 'text-yellow-400 fill-1' : 'text-gray-400'}`}>star</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shadow-lg border-2 border-white/20">
                                    {i + 1}
                                  </div>
                                </div>
                              </div>
                            )) : (
                              <div className="col-span-3 py-12 flex flex-col items-center justify-center text-on-surface-variant/40 bg-surface-container/20 rounded-3xl border-2 border-dashed border-outline-variant/10">
                                <span className="material-symbols-outlined text-5xl mb-3">auto_awesome</span>
                                <p className="text-xs font-bold uppercase tracking-widest">{language === 'English (US)' ? 'Add platinum favorites to see them here' : 'Adicione favoritos platinados para vê-los aqui'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Trophy Hierarchy, Legend & Insights */}
                      <div className="space-y-6">
                        {/* Platinum Hierarchy row */}
                        <div className="flex gap-2 p-4 bg-surface-container-low/30 backdrop-blur-md rounded-3xl border border-outline-variant/10 overflow-x-auto scrollbar-hide">
                          {[...Array(10)].map((_, i) => {
                            const trophyColors = [
                              'from-amber-800 to-amber-950', 'from-amber-600 to-amber-800', 
                              'from-slate-300 to-slate-500', 'from-yellow-400 to-yellow-600',
                              'from-cyan-400 to-blue-600', 'from-violet-500 to-purple-800',
                              'from-rose-500 to-red-800', 'from-slate-800 to-black',
                              'from-cyan-100 via-white to-cyan-200', 'from-indigo-500 via-purple-500 to-pink-500'
                            ];
                            const isActive = extraStats.platinumRank.index === i;
                            const isUnlocked = extraStats.platinumRank.index >= i;
                            
                            return (
                              <div key={i} className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-500 ${isActive ? 'scale-110 mx-1' : 'scale-90 opacity-40 grayscale'}`}>
                                <div className="w-5 h-5 rounded bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-[8px] font-black text-on-surface-variant/50">
                                  {i + 1}
                                </div>
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${trophyColors[i]} flex items-center justify-center shadow-lg relative`}>
                                  <span className={`material-symbols-outlined text-base ${[7, 8, 9].includes(i) ? 'text-white' : 'text-white/80'}`}>workspace_premium</span>
                                  {!isUnlocked && (
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[10px] text-white/40">lock</span>
                                    </div>
                                  )}
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend Box */}
                        <div className="bg-surface-container-low/40 p-6 rounded-[2.5rem] border border-outline-variant/10 text-[9px] uppercase tracking-[0.1em] font-bold text-on-surface-variant/60 shadow-sm">
                          <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/10 pb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary text-xl">info</span>
                            </div>
                            <div>
                               <h4 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em]">{t.legendTitle}</h4>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3">
                            <div className="flex items-center gap-3 group transition-colors">
                              <span className="w-3 h-3 rounded-full bg-amber-900 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank1}:</strong> {t.legend1}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-amber-700 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank2}:</strong> {t.legend2}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-slate-400 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank3}:</strong> {t.legend3}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-yellow-400 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank4}:</strong> {t.legend4}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-cyan-400 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank5}:</strong> {t.legend5}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-violet-600 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank6}:</strong> {t.legend6}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-rose-500 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank7}:</strong> {t.legend7}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-slate-800 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank8}:</strong> {t.legend8}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-slate-100 border border-cyan-200 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank9}:</strong> {t.legend9}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 border border-white/10 shadow-sm shrink-0"></span> 
                              <span className="truncate"><strong>{t.rank10}:</strong> {t.legend10}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-surface-container-low/50 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-6 shadow-sm flex flex-col">
                           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-2">
                             <span className="material-symbols-outlined text-primary">analytics</span>
                             Insights
                           </h3>
                           <div className="space-y-4">
                             <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                               <MetricItem icon="category" label={t.favoriteGenreLabel} value={extraStats.favoriteGenre} color="text-primary" />
                             </div>
                             <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                               <MetricItem icon="devices" label={t.mostUsedPlatformLabel} value={extraStats.mostUsedPlatform} color="text-blue-500" />
                             </div>
                             <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                               <MetricItem icon="database" label={t.totalSizeLabel} value={extraStats.totalSizeFormatted} color="text-emerald-500" />
                             </div>
                             <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                               <MetricItem 
                                 icon="history" 
                                 label={language === 'English (US)' ? 'Most Played' : 'Jogo com mais horas'} 
                                 value={extraStats.mostPlayedGame ? `${extraStats.mostPlayedGame.title} (${extraStats.mostPlayedGame.playtime}h)` : '-'} 
                                 color="text-amber-500" 
                               />
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Recently Added & Completed */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-surface-container-low/50 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-6 flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">add_circle</span>
                          {t.recentlyAddedLabel}
                        </h3>
                        <div className="space-y-4">
                          {extraStats.recentlyAdded.map(g => (
                            <div key={g.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-all cursor-pointer group" onClick={() => navigateToDetails(g.id)}>
                              <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-md">
                                <img src={g.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{g.title}</p>
                                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">{g.genres?.[0] || 'Game'}</p>
                              </div>
                              <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary transition-colors">chevron_right</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-surface-container-low/50 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-6 flex items-center gap-3">
                          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                          {t.recentlyCompletedLabel}
                        </h3>
                        <div className="space-y-4">
                          {extraStats.recentlyCompleted.length > 0 ? extraStats.recentlyCompleted.map(g => (
                            <div key={g.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-all cursor-pointer group" onClick={() => navigateToDetails(g.id)}>
                              <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-md">
                                <img src={g.coverUrl || DEFAULT_COVER} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{g.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{language === 'English (US)' ? 'Mastered' : t.completed}</p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary transition-colors">chevron_right</span>
                            </div>
                          )) : (
                            <div className="py-12 text-center text-on-surface-variant/30 italic text-xs">
                              <span className="material-symbols-outlined text-3xl mb-2 opacity-10">history</span>
                              <p>{language === 'English (US)' ? 'Your path to glory is waiting.' : 'Seu caminho para a glória está à espera.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Primary Metrics Grid (Moved to Bottom) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pt-4">
                      <MetricCard label={t.totalGames} value={stats.total} icon="inventory_2" color="primary" />
                      <MetricCard label={t.completed} value={stats.completed} icon="check_circle" color="emerald" />
                      <MetricCard label={t.totalTime} value={`${stats.totalTime}h`} icon="schedule" color="amber" />
                      <MetricCard label={t.favorites} value={extraStats.totalFavorites} icon="favorite" color="rose" />
                    </div>
                  </div>
                )}

                {/* Storage Specific Section */}
                {view === 'Storage' && (
                  <div className="space-y-8 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-surface-container-high/40 p-8 rounded-3xl border border-outline-variant/10 flex flex-col justify-between shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{language === 'English (US)' ? 'Total Library Size' : 'Espaço Total da Biblioteca'}</p>
                          <h2 className="text-5xl font-black text-on-surface tracking-tighter">{extraStats.totalSizeFormatted}</h2>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-wider">
                          <span className="material-symbols-outlined">analytics</span>
                          {language === 'English (US)' ? 'Space used by your games' : 'Espaço usado pelos seus jogos'}
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                        <h3 className="text-lg font-bold text-on-surface tracking-tight mb-6">{language === 'English (US)' ? 'Platform Distribution' : 'Distribuição por Plataforma'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {extraStats.storageByPlatform.map(p => (
                            <div key={p.name} className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">{p.name}</span>
                                <span className="text-sm font-black text-primary">{p.size}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                                <div className="h-full bg-primary" 
                                  style={{ width: `${(p.bytes / (extraStats.storageByPlatform.reduce((acc, curr) => acc + curr.bytes, 0) || 1)) * 100}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Windows 11 Style Disk Grid */}
                    <div className="bg-surface-container p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">storage</span>
                          <h3 className="text-xl font-bold text-on-surface tracking-tight uppercase">{language === 'English (US)' ? 'Personal Storage Units' : 'Unidades de Armazenamento'}</h3>
                        </div>
                        <button
                          onClick={handleAddDisk}
                          className="py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold text-xs hover:scale-102 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none"
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                          {language === 'English (US)' ? 'Add Unit' : 'Adicionar Unidade'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {disks.map(disk => (
                          <DiskItem 
                            key={disk.id} 
                            disk={disk} 
                            t={t} 
                            onEdit={(d) => {
                              setEditingDisk(d);
                              setShowEditDiskModal(true);
                            }} 
                            onDragStart={(e, id) => setDraggedDiskId(id)}
                            onDrop={(e, targetId) => {
                              if (draggedDiskId) {
                                handleReorderDisks(draggedDiskId, targetId);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
                      <h3 className="text-lg font-bold text-on-surface tracking-tight mb-6">{language === 'English (US)' ? 'Heaviest Games' : 'Jogos Mais Pesados'}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {extraStats.largestGames.map(game => (
                          <div key={game.id} className="p-3 bg-surface-container-high/40 rounded-2xl border border-outline-variant/5 group hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigateToDetails(game.id)}>
                            <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 border border-outline-variant/10">
                              <img src={game.coverUrl || DEFAULT_COVER} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            </div>
                            <p className="text-[10px] font-bold text-on-surface truncate mb-1">{game.title}</p>
                            <p className="text-xs font-black text-primary">{game.size}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranking Specific Section */}
                {view === 'Ranking' && (
                  <div className="space-y-6 pb-12">
                    <div className="bg-surface-container-low/50 backdrop-blur-md rounded-[2.5rem] border border-outline-variant/20 p-8 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                          <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">{t.top10Title}</h2>
                            <p className="text-xs text-on-surface-variant/70 font-medium tracking-wide">{t.rankingLegend}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => {
                          const rankingGame = games.find(g => g.rankingPos === pos);
                          return (
                            <motion.div 
                              key={pos}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative group"
                            >
                              <div className="absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center font-black text-sm text-on-surface-variant shadow-lg">
                                {pos}
                              </div>

                              {rankingGame ? (
                                <div className="space-y-3">
                                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-outline-variant/10 group-hover:border-primary/50 transition-all duration-500">
                                    <img 
                                      src={rankingGame.coverUrl || DEFAULT_COVER} 
                                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                      alt={rankingGame.title} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); navigateToDetails(rankingGame.id); }}
                                        className="w-full py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-[10px] font-bold uppercase tracking-widest border border-white/20 hover:bg-white/40 transition-colors mb-2"
                                      >
                                        {t.viewDetails || 'Ver Detalhes'}
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFromRanking(rankingGame.id); }}
                                        className="w-full py-2 bg-red-500/20 backdrop-blur-md rounded-xl text-red-200 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500/40 transition-colors"
                                      >
                                        {t.removeRank}
                                      </button>
                                    </div>

                                    {/* Top 3 Badges */}
                                    {pos <= 3 && (
                                      <div className="absolute top-2 right-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 ${
                                          pos === 1 ? 'bg-yellow-500' : 
                                          pos === 2 ? 'bg-slate-400' : 
                                          'bg-amber-700'
                                        }`}>
                                          <span className="material-symbols-outlined text-white text-[18px]">verified</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="px-1 text-center">
                                    <h4 className="text-[11px] font-black text-on-surface truncate uppercase tracking-tight">{rankingGame.title}</h4>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <span className="material-symbols-outlined text-[10px] text-yellow-500 fill-1">star</span>
                                      <span className="text-[10px] font-bold text-on-surface-variant">{rankingGame.rating}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setRankingSlotToEdit(pos); setShowRankingSelectModal(true); }}
                                  className="w-full aspect-[3/4] rounded-2xl bg-surface-container/30 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 hover:bg-surface-container/50 hover:border-primary/50 transition-all group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/40 group-hover:text-primary group-hover:scale-110 transition-all">
                                    <span className="material-symbols-outlined text-2xl">add</span>
                                  </div>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/30 group-hover:text-primary transition-colors text-center px-4">
                                    {t.emptyRankSlot}
                                  </span>
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Roadmap Specific Section */}
                {view === 'Roadmap' && (
                  <div className="space-y-12 pb-20">
                    <div className="grid grid-cols-1 gap-8">
                      {/* Timeline Side */}
                      <div className="space-y-8">
                        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-outline-variant/20 shadow-sm">
                          <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-10 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">timeline</span>
                            {language === 'English (US)' ? 'Future Timeline' : 'Linha do Tempo'}
                          </h3>
                          
                          <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
                            {[...roadmapItems].sort((a, b) => a.date.localeCompare(b.date) || Number(a.id) - Number(b.id)).map((item) => (
                              <div key={item.id} className="relative">
                                <div className={`absolute -left-[37px] top-1.5 w-6 h-6 rounded-full border-4 border-surface-container flex items-center justify-center shadow-sm z-10 ${
                                  item.status === 'completed' ? 'bg-green-500' :
                                  item.status === 'in-progress' ? 'bg-blue-500' : 'bg-red-500'
                                }`}>
                                  {item.status === 'completed' && <span className="material-symbols-outlined text-[12px] text-white">check</span>}
                                </div>
                                <div className="bg-surface-container-high/40 p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col gap-1">
                                      <h4 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{item.title}</h4>
                                      {item.priority && (
                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md w-fit border ${
                                          item.priority === 'Q1' ? 'bg-error/10 text-error border-error/20' :
                                          item.priority === 'Q2' ? 'bg-warning/10 text-warning border-warning/20' :
                                          'bg-outline-variant/10 text-on-surface-variant border-outline-variant/20'
                                        }`}>
                                          {item.priority} - {item.priority === 'Q1' ? t.high : item.priority === 'Q2' ? t.medium : t.low}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full">{item.date}</span>
                                  </div>
                                  <p className="text-sm text-on-surface-variant/80 leading-relaxed">{item.description}</p>
                                  <div className="mt-4 flex items-center justify-between">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                      item.status === 'completed' ? 'text-green-500' :
                                      item.status === 'in-progress' ? 'text-blue-500' : 'text-red-500'
                                    }`}>
                                      {item.status === 'completed' ? t.completedStatus :
                                       item.status === 'in-progress' ? t.inProgress : t.planned}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>

                    {/* Changelog Section */}
                    <section className="bg-surface-container p-8 rounded-[3rem] border border-outline-variant/10 shadow-sm">
                       <div className="flex items-center justify-between mb-12">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-3xl">history</span>
                            <h3 className="text-3xl font-black text-on-surface tracking-tighter uppercase">{t.changelog}</h3>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                         {[...changelogEntries].sort((a, b) => Number(b.id) - Number(a.id)).map((entry) => (
                           <div key={entry.id} className="relative bg-surface-container-low/40 p-8 rounded-3xl border border-outline-variant/10 group">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                               <div className="flex items-center gap-4">
                                 <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl font-black text-sm tracking-tight border border-primary/20">
                                   v{entry.version}
                                 </div>
                                 <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">{entry.date}</span>
                               </div>

                             </div>
                             <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8">
                               {entry.changes.map((change, idx) => (
                                 <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant/80">
                                   <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">check_small</span>
                                   {change}
                                 </li>
                               ))}
                             </ul>
                           </div>
                         ))}
                       </div>
                    </section>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

            {view === 'Details' && selectedGame && (
              <GameDetailView 
                game={selectedGame} 
                t={t}
                onEdit={() => setView('Edit')}
                onBack={() => setView('Library')}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={(id) => setDeleteConfirmId(id)}
                onGenreClick={handleGenreClick}
                onUpdateGame={handleUpdateGameFields}
              />
            )}

            {(view === 'Add' || view === 'Edit') && (
              <GameFormView 
                game={view === 'Edit' ? selectedGame : undefined}
                t={t}
                onSave={handleSaveGame}
                onCancel={() => setView(view === 'Edit' ? 'Details' : 'Library')}
                isEdit={view === 'Edit'}
                onDeleteRequest={(id) => setDeleteConfirmId(id)}
              />
            )}

            {view === 'Settings' && (
              <SettingsView 
                theme={theme} 
                userAvatar={userAvatar} 
                userName={userName}
                language={language}
                t={t}
                onExport={handleExport}
                onImport={handleImport}
                onClearDatabase={handleClearDatabase}
                onRepairDatabase={handleRepairDatabase}
                onApplySettings={async (data) => {
                  const { id, ...updates } = data;
                  await db.settings.update('current', updates);
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Clear Database Modal */}
        <AnimatePresence>
          {showClearDbModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowClearDbModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-surface-container-low w-full max-w-md rounded-xl p-8 shadow-2xl border border-error/20"
              >
                <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl">warning</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-center mb-2">{t.clearDbTitle}</h2>
                <p className="text-on-surface-variant text-center mb-8">
                  {t.clearDbWarning}
                </p>

                <div className="bg-error/5 border border-error/10 rounded-xl p-4 mb-8 text-left">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={dbClearAware}
                      onChange={(e) => setDbClearAware(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-error/20 text-error focus:ring-error transition-all"
                    />
                    <span className="text-sm font-medium text-error/80 group-hover:text-error transition-colors">
                      {t.clearDbCheckbox}
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowClearDbModal(false)}
                    className="flex-1 py-3 px-4 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container-high transition-all"
                  >
                    {t.clearDbCancel}
                  </button>
                  <button 
                    onClick={confirmClearDatabase}
                    disabled={!dbClearAware}
                    className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all shadow-lg ${
                      dbClearAware 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                        : 'bg-outline-variant text-on-surface/30 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {t.clearDbConfirm}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bug Report Modal */}
        <BugReportModal 
          isOpen={showBugReportModal} 
          t={t}
          onClose={() => setShowBugReportModal(false)} 
        />

        {/* Update Modal */}
        <UpdateModal 
          isOpen={showUpdateModal}
          status={updateStatus}
          onClose={() => setShowUpdateModal(false)}
          onCheckAgain={checkForUpdates}
          data={latestReleaseData}
          t={t}
        />

        {/* Lucky Draw Modal */}
        <LuckyDrawModal 
          isOpen={showLuckyModal} 
          t={t}
          game={luckyGame} 
          onClose={() => setShowLuckyModal(false)}
          onReDraw={handleLuckyDraw}
          onViewDetails={(id) => {
            setShowLuckyModal(false);
            navigateToDetails(id);
          }}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal 
          isOpen={!!deleteConfirmId}
          t={t}
          gameTitle={games.find(g => g.id === deleteConfirmId)?.title || ''}
          onConfirm={() => {
            if (deleteConfirmId) {
              handleDeleteGame(deleteConfirmId);
              setDeleteConfirmId(null);
            }
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />

        <EditDiskModal 
          isOpen={showEditDiskModal}
          disk={editingDisk}
          isAdding={editingDisk ? !disks.some(d => d.id === editingDisk.id) : false}
          onClose={() => {
            setShowEditDiskModal(false);
            setEditingDisk(null);
          }}
          onSave={handleSaveDisk}
          onDelete={handleDeleteDisk}
          t={t}
          games={games}
          onGameClick={(gameId) => {
            setShowEditDiskModal(false);
            setEditingDisk(null);
            navigateToDetails(gameId);
          }}
        />

        <RankingSelectModal 
          isOpen={showRankingSelectModal}
          onClose={() => {
            setShowRankingSelectModal(false);
            setRankingSlotToEdit(null);
          }}
          onSelect={handleSetRankingGame}
          games={games}
          slot={rankingSlotToEdit}
          t={t}
        />

        <AddRoadmapModal 
          isOpen={showAddRoadmapModal}
          item={editingRoadmapItem}
          onClose={() => {
            setShowAddRoadmapModal(false);
            setEditingRoadmapItem(null);
          }}
          onSave={handleSaveRoadmapItem}
          onDelete={handleDeleteRoadmapItem}
          t={t}
        />

        <AddChangelogModal 
          isOpen={showAddChangelogModal}
          entry={editingChangelogEntry}
          onClose={() => {
            setShowAddChangelogModal(false);
            setEditingChangelogEntry(null);
          }}
          onSave={handleSaveChangelogEntry}
          t={t}
        />
      </main>
      </div>
    </div>
  );
}

// Sub-components
function NavItem({ active, icon, label, onClick, tooltip }: { active: boolean, icon: ReactNode, label: string, onClick: () => void, tooltip?: string }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip || label}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
        active 
          ? 'bg-primary/10 text-primary' 
          : 'text-outline hover:text-on-surface hover:bg-surface-container-high'
      }`}
    >
      <div className={`${active ? 'text-primary' : 'text-outline group-hover:text-on-surface'} transition-colors`}>
        {icon}
      </div>
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(77,142,239,0.5)]" />}
    </button>
  );
}

function StatCard({ label, value, color, icon, onClick }: { label: string, value: string | number, color: string, icon?: string, onClick?: () => void }) {
  const className = `bg-surface-container-low/40 backdrop-blur-sm p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm flex flex-col gap-4 group transition-all text-left w-full h-full ${
    onClick 
      ? 'cursor-pointer hover:border-primary/60 hover:bg-surface-container-low/60 active:scale-[0.98]' 
      : 'cursor-default hover:border-primary/40'
  }`;

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-80">{label}</p>
          {icon && (
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
              <span className={`material-symbols-outlined text-[20px] ${color} opacity-90`}>{icon}</span>
            </div>
          )}
        </div>
        <p className={`text-4xl font-display font-bold tracking-tight ${color} group-hover:scale-105 transition-transform origin-left`}>{value}</p>
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between w-full">
        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-80">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
            <span className={`material-symbols-outlined text-[20px] ${color} opacity-90`}>{icon}</span>
          </div>
        )}
      </div>
      <p className={`text-4xl font-display font-bold tracking-tight ${color} group-hover:scale-105 transition-transform origin-left`}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: 'primary' | 'emerald' | 'amber' | 'rose' }) {
  const colorMap = {
    primary: 'from-primary/20 to-primary/5 text-primary border-primary/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-500/20'
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border p-6 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-inner`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-70 mb-1">{label}</p>
      <h3 className="text-3xl font-black tracking-tight">{value}</h3>
    </div>
  );
}

function MetricItem({ icon, label, value, color }: { icon: string, label: string, value: string | number, color: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shadow-sm group-hover:bg-surface-container-high transition-colors`}>
        <span className={`material-symbols-outlined ${color}`}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-on-surface uppercase tracking-tight truncate max-w-[120px]">{value}</p>
      </div>
    </div>
  );
}

interface GameCardProps {
  key?: Key;
  game: Game;
  onToggleFavorite: (id: string, e?: MouseEvent) => void;
  onUpdateStatus: (id: string, status: GameStatus) => void;
  onClick: () => void;
  statusColor: string;
}

function GameCard({ 
  game, 
  onToggleFavorite, 
  onUpdateStatus, 
  onClick,
  statusColor,
  t
}: GameCardProps & { t: TranslationKeys }) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ 
        y: -4,
        scale: 1.015,
        transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] }
      }}
      whileTap={{ scale: 0.99 }}
      className="group bg-surface-container-low border border-outline-variant/10 rounded-none shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden rounded-none">
        <motion.img 
          src={game.coverUrl || DEFAULT_COVER} 
          alt={game.title} 
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="absolute top-4 left-4 z-10">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
          >
            {game.status === 'Jogando' ? t.playing : (game.status === 'Completos' ? t.completed : game.status)}
          </motion.span>
        </div>

        <motion.button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id, e);
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors z-20"
        >
          <span className={`material-symbols-outlined text-[20px] transition-colors ${game.isFavorite ? 'text-red-500 font-variation-fill' : ''}`} style={{ fontVariationSettings: `"FILL" ${game.isFavorite ? 1 : 0}` }}>favorite</span>
        </motion.button>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3 min-w-0">
        <div className="space-y-1.5 min-w-0">
          {/* Game Title */}
          <h3 className="font-display font-bold text-xs sm:text-sm lg:text-base text-on-surface line-clamp-2 transition-colors group-hover:text-primary tracking-tight leading-tight min-h-[2.4em] flex items-center">
            {game.title}
          </h3>
          
          {/* Rating Stars */}
          <div className="flex items-center gap-0.5 text-primary">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ scale: i < game.rating ? 1 : 0.9, opacity: i < game.rating ? 1 : 0.3 }}
                className="flex items-center justify-center font-semibold"
              >
                <span 
                  className="material-symbols-outlined text-[10px] sm:text-[11px] lg:text-[12px]" 
                  style={{ fontVariationSettings: `"FILL" ${i < game.rating ? 1 : 0}` }}
                >
                  star
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Playtime & Platform Info */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 mt-auto gap-2 min-w-0">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-on-surface-variant font-bold group-hover:text-primary transition-colors uppercase tracking-tight shrink-0">
            <span className="material-symbols-outlined text-[12px] sm:text-[14px] opacity-70">schedule</span>
            {game.playtime}h
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-on-surface-variant font-bold uppercase tracking-tight opacity-70 min-w-0">
             <span className="material-symbols-outlined text-[12px] sm:text-[14px] shrink-0">
               {(() => {
                 const firstPlatform = Array.isArray(game.platform) ? (game.platform[0] || '') : (game.platform || '');
                 const p = firstPlatform.trim().toLowerCase();
                 if (p === 'pc') {
                   return 'desktop_windows';
                 }
                 if (p.includes('playstation') || p.includes('ps') || p.includes('xbox')) {
                   return 'sports_esports';
                 }
                 if (p.includes('switch') || p.includes('nintendo') || p.includes('mobile') || p.includes('phone') || p.includes('deck')) {
                   return 'stay_current_portrait';
                 }
                 return 'desktop_windows';
               })()}
             </span>
             <span className="truncate max-w-[50px] sm:max-w-[70px]">
               {Array.isArray(game.platform) ? (game.platform.length > 1 ? `${game.platform[0]}+` : game.platform[0]) : game.platform}
             </span>
          </div>
        </div>

        {game.status === 'Jogando' && (
           <div className="mt-1 space-y-1.5">
             <div className="flex justify-between text-[8px] sm:text-[9px] font-bold uppercase tracking-tighter text-on-surface-variant/60">
               <span>{t.progress}</span>
               <span>{game.progress}%</span>
             </div>
             <div className="w-full h-1 bg-surface-container-highest/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-secondary shadow-[0_0_8px_rgba(127,207,173,0.5)]" 
                />
             </div>
           </div>
        )}
      </div>
    </motion.div>
  );
}

function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    const videoId = match[2];
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      rel: '0'
    });

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      if (protocol === 'http:' || protocol === 'https:') {
        params.set('enablejsapi', '1');
        params.set('origin', window.location.origin);
      }
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }
  return null;
}

function TrailerModal({ isOpen, url, onClose }: { isOpen: boolean, url: string | null; onClose: () => void }) {
  const embedUrl = getYoutubeEmbedUrl(url);
  const isPt = localStorage.getItem('gaminghub_language') !== 'English (US)';

  return (
    <AnimatePresence>
      {isOpen && url && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-container-low max-w-4xl w-full aspect-video rounded-2xl border border-outline-variant/15 shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header/Controls bar */}
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={onClose} 
                className="p-2 bg-black/60 hover:bg-black/90 rounded-full text-white/80 hover:text-white transition-all flex items-center justify-center outline-none shadow-lg border border-white/10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {embedUrl ? (
              <div className="flex-1 flex flex-col min-h-0 relative">
                <iframe 
                  src={embedUrl}
                  title="YouTube Game Trailer"
                  className="w-full flex-1 border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="bg-[#0f0f11] px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/10 text-xs text-on-surface-variant gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-center sm:text-left">
                    <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                    {isPt 
                      ? 'Problemas com a reprodução ou erro de configuração do player (ex: Erro 153)?' 
                      : 'Having playback or player configuration issues (e.g. Error 153)?'}
                  </span>
                  <button
                    onClick={(e) => {
                      onClose();
                      openExternalLink(url, e);
                    }}
                    className="flex items-center gap-1 text-primary hover:text-primary-hover font-bold transition-colors uppercase tracking-wider text-[10px]"
                  >
                    <span>{isPt ? 'Assistir no YouTube' : 'Watch on YouTube'}</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center bg-[#070707]">
                <span className="material-symbols-outlined text-5xl text-primary animate-pulse">play_circle</span>
                <div className="space-y-1">
                  <p className="text-on-surface font-bold text-lg">
                    {isPt ? 'Vídeo externo detectado' : 'External video stream'}
                  </p>
                  <p className="text-on-surface-variant text-sm max-w-md">
                    {isPt 
                      ? 'Este link do trailer não pôde ser incorporado diretamente. Deseja abrir no seu navegador?' 
                      : 'This trailer link cannot be fully embedded. Would you like to open it in your browser?'}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    onClose();
                    openExternalLink(url, e);
                  }}
                  className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all outline-none flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  {isPt ? 'Abrir no Navegador' : 'Open in Browser'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function GameDetailView({ game, onEdit, onBack, onToggleFavorite, onDeleteRequest, onGenreClick, onUpdateGame, t }: { 
  game: Game, 
  onEdit: () => void, 
  onBack: () => void,
  onToggleFavorite: (id: string) => void,
  onDeleteRequest: (id: string) => void,
  onGenreClick: (genre: string) => void,
  onUpdateGame?: (id: string, updates: Partial<Game>) => Promise<void>,
  t: TranslationKeys
}) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [activeTrailerUrl, setActiveTrailerUrl] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      const response = await fetch(getApiUrl(`/api/sync-game?title=${encodeURIComponent(game.title)}&lang=${encodeURIComponent(language)}`));
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao sincronizar informações do jogo");
      }
      
      const updates: Partial<Game> = {};
      let updatedSomething = false;
      
      if (data.developer && game.developer !== data.developer) {
        updates.developer = data.developer;
        updatedSomething = true;
      }
      if (data.publisher && game.publisher !== data.publisher) {
        updates.publisher = data.publisher;
        updatedSomething = true;
      }
      if (data.releaseDate && game.releaseDate !== String(data.releaseDate)) {
        updates.releaseDate = String(data.releaseDate);
        updatedSomething = true;
      }
      if (Array.isArray(data.genres) && data.genres.length > 0 && JSON.stringify(game.genres) !== JSON.stringify(data.genres)) {
        updates.genres = data.genres;
        updatedSomething = true;
      }
      if (data.synopsis && game.synopsis !== data.synopsis) {
        updates.synopsis = data.synopsis;
        updatedSomething = true;
      }
      if (data.coverUrl && game.coverUrl !== data.coverUrl) {
        updates.coverUrl = data.coverUrl;
        updatedSomething = true;
      }

      if (updatedSomething) {
        await onUpdateGame?.(game.id, updates);
        setSyncSuccess(true);
      } else {
        setSyncError("As informações do jogo já estão sincronizadas com o banco de dados oficial.");
      }
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || "Erro de conexão com o servidor de sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <section className="relative rounded-xl overflow-hidden shadow-2xl h-[380px] group">
        <img 
          src={game.bannerUrl || game.coverUrl || DEFAULT_COVER} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 inset-x-0 p-4 lg:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 overflow-hidden">
          <div className="space-y-3 lg:space-y-4">
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {game.status}
              </span>
              {game.isPlatinum && (
                <div className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                  <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                  Platinado
                </div>
              )}
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className="material-symbols-outlined text-[16px] lg:text-[18px]" 
                    style={{ fontVariationSettings: `"FILL" ${i < game.rating ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            
            <h1 className="text-white text-3xl lg:text-5xl font-bold tracking-tight line-clamp-2">{game.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-white/80 text-xs lg:text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] lg:text-[18px]">schedule</span>
                {game.playtime}h jogadas
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] lg:text-[18px]">list_alt</span>
                {game.progress}% completo
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-3 w-full lg:w-auto">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 lg:flex-none px-4 lg:px-5 py-2 lg:py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] lg:text-[20px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Informações'}
            </button>
            <button 
              onClick={onEdit} 
              className="flex-1 lg:flex-none px-4 lg:px-5 py-2 lg:py-2.5 bg-surface-container-highest text-on-surface rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-2 hover:bg-opacity-80 transition-all active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">edit</span>
              Editar
            </button>
            <button 
              onClick={() => onToggleFavorite(game.id)}
              className="flex-1 lg:flex-none px-4 lg:px-5 py-2 lg:py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg"
            >
              <span className={`material-symbols-outlined text-[18px] lg:text-[20px]` } style={{ fontVariationSettings: `"FILL" ${game.isFavorite ? 1 : 0}` }}>favorite</span>
              Favoritar
            </button>
            <button 
              onClick={() => onDeleteRequest(game.id)}
              className="px-4 py-2 lg:py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">delete</span>
            </button>
            {game.trailerUrl && (
              <button 
                onClick={() => setActiveTrailerUrl(game.trailerUrl)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-sm backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                Trailer
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sync Status Feedback Banners */}
      {syncSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-medium rounded-xl p-4 text-xs flex items-center justify-between gap-3 max-w-full">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Campos em branco preenchidos automaticamente com sucesso!</span>
          </div>
          <button onClick={() => setSyncSuccess(false)} className="material-symbols-outlined text-[16px] hover:opacity-75">close</button>
        </div>
      )}
      {syncError && (
        <div className="bg-error/10 border border-error/20 text-error font-medium rounded-xl p-4 text-xs flex items-center justify-between gap-3 max-w-full">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>{syncError}</span>
          </div>
          <button onClick={() => setSyncError(null)} className="material-symbols-outlined text-[16px] hover:opacity-75">close</button>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="col-span-1 lg:col-span-8 space-y-8">
          {/* Synopsis */}
          <section className="bg-surface-container-low/40 backdrop-blur-md p-6 lg:p-10 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="font-display text-sm lg:text-base font-bold text-on-surface-variant uppercase tracking-wider">{t.synopsis}</h3>
            </div>
            <p className="font-sans text-on-surface-variant leading-relaxed text-xs lg:text-sm font-normal opacity-90 max-w-none whitespace-pre-line">
              {game.synopsis}
            </p>
          </section>
        </div>
        
        {/* Sidebar Space */}
        <div className="col-span-1 lg:col-span-4 space-y-8">
          <section className="bg-surface-container-low/40 backdrop-blur-md p-6 lg:p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="font-display text-lg font-bold text-on-surface">{t.progress}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-medium text-sm text-on-surface">{t.completed}</span>
                <span className="text-primary font-bold text-xs">{game.progress}%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  className="h-full bg-primary rounded-full transition-all" 
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-outline-variant/10 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">PLATINADO</span>
                <span className={`material-symbols-outlined text-[20px] ${game.isPlatinum ? 'text-primary' : 'text-outline-variant opacity-40'}`}>workspace_premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">HORAS JOGADAS</span>
                <span className="font-bold text-sm">{game.playtime}h</span>
              </div>
            </div>
          </section>
        </div>

        {/* Technical Info Expanded Row */}
        <div className="col-span-1 lg:col-span-12">
          <section className="bg-surface-container-low/60 p-6 lg:p-8 rounded-xl border border-outline-variant/10 shadow-sm">
            <h3 className="font-display text-sm lg:text-base font-bold mb-6 text-on-surface-variant uppercase tracking-wider">Informações Técnicas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-6">
              <div className="space-y-1">
                <p className="font-sans text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-80">Plataformas</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {Array.isArray(game.platform) ? game.platform.map(p => (
                    <span key={p} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getPlatformStyle(p)}`}>
                      {p}
                    </span>
                  )) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getPlatformStyle(game.platform)}`}>
                      {game.platform}
                    </span>
                  )}
                </div>
              </div>
              <DetailItem label="Lançamento" value={game.releaseDate} />
              <DetailItem label="Desenvolvedor" value={game.developer} />
              <DetailItem label="Publicador" value={game.publisher} />
              <DetailItem label="Localização" value={game.location} />
              <DetailItem label={t.region || "Região"} value={game.region || 'Global'} />
              <DetailItem label="Build" value={game.build || 'N/A'} />
              <DetailItem label="Versão" value={game.version || 'N/A'} />
              <DetailItem label="DLC" value={game.dlc || 'N/A'} />
              <DetailItem label="Tamanho" value={game.size || 'N/A'} />
              <div className="space-y-1">
                <p className="font-sans text-[9px] font-bold text-on-surface-variant uppercase tracking-[0.15em] opacity-80">Gêneros</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {game.genres.map(g => (
                    <button 
                      key={g} 
                      onClick={() => onGenreClick(g)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${getGenreColor(g)}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TrailerModal 
        isOpen={!!activeTrailerUrl} 
        url={activeTrailerUrl} 
        onClose={() => setActiveTrailerUrl(null)} 
      />
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-outline-variant uppercase tracking-[0.15em] opacity-80">{label}</p>
      <p className="font-bold text-xs lg:text-sm tracking-tight text-on-surface">{value}</p>
    </div>
  );
}

function GameFormView({ game, onSave, onCancel, isEdit, onDeleteRequest, t }: { 
  game?: Game, 
  onSave: (data: Partial<Game>) => void, 
  onCancel: () => void,
  isEdit: boolean,
  onDeleteRequest?: (id: string) => void,
  t: TranslationKeys
}) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  const [formData, setFormData] = useState<Partial<Game>>(game || {
    title: '',
    platform: [],
    coverUrl: '',
    bannerUrl: '',
    rating: 0,
    status: 'Backlog',
    playtime: 0,
    progress: 0,
    developer: '',
    publisher: '',
    synopsis: '',
    genres: [],
    location: '',
    region: '',
    trailerUrl: '',
    isPlatinum: false,
    releaseDate: '',
    build: '',
    version: '',
    dlc: '',
    size: ''
  });

  const [newGenre, setNewGenre] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
  const [customPlatformInput, setCustomPlatformInput] = useState('');
  const platformContainerRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [activeTrailerUrl, setActiveTrailerUrl] = useState<string | null>(null);

  // Existing locations for auto-completion
  const allExistingGames = useLiveQuery(() => db.games.toArray()) || [];
  const existingLocations = useMemo(() => {
    const locs = allExistingGames
      .map(g => g.location?.trim())
      .filter((l): l is string => Boolean(l && l.length > 0));
    return Array.from(new Set(locs));
  }, [allExistingGames]);

  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const currentLocationInput = formData.location || '';
  const locationSuggestion = useMemo(() => {
    if (!currentLocationInput.trim()) return null;
    return existingLocations.find(loc => 
      loc.toLowerCase().startsWith(currentLocationInput.toLowerCase()) && 
      loc.toLowerCase() !== currentLocationInput.toLowerCase()
    ) || null;
  }, [currentLocationInput, existingLocations]);

  const filteredLocations = useMemo(() => {
    if (!currentLocationInput.trim()) return existingLocations.slice(0, 8);
    return existingLocations.filter(loc => 
      loc.toLowerCase().includes(currentLocationInput.toLowerCase())
    ).slice(0, 8);
  }, [currentLocationInput, existingLocations]);

  const handleSyncGameInfo = async () => {
    if (!formData.title?.trim()) {
      setSyncError("Por favor, digite o título do jogo para sincronizar.");
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const response = await fetch(getApiUrl(`/api/sync-game?title=${encodeURIComponent(formData.title)}&lang=${encodeURIComponent(language)}`));
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao sincronizar informações.");
      }

      setFormData(prev => {
        const next = { ...prev };
        let filledAny = false;

        if (data.developer && next.developer !== data.developer) {
          next.developer = data.developer;
          filledAny = true;
        }
        if (data.publisher && next.publisher !== data.publisher) {
          next.publisher = data.publisher;
          filledAny = true;
        }
        if (data.releaseDate && next.releaseDate !== String(data.releaseDate)) {
          next.releaseDate = String(data.releaseDate);
          filledAny = true;
        }
        if (Array.isArray(data.genres) && data.genres.length > 0 && JSON.stringify(next.genres) !== JSON.stringify(data.genres)) {
          next.genres = data.genres;
          filledAny = true;
        }
        if (data.synopsis && next.synopsis !== data.synopsis) {
          next.synopsis = data.synopsis;
          filledAny = true;
        }
        if (data.coverUrl && next.coverUrl !== data.coverUrl) {
          next.coverUrl = data.coverUrl;
          filledAny = true;
        }

        if (filledAny) {
          setSyncSuccess(true);
        } else {
          setSyncError("As informações sincronizadas já eram idênticas às preenchidas.");
        }

        return next;
      });
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || "Erro de conexão com o servidor de sincronização.");
    } finally {
      setIsSyncing(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, coverUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, bannerUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    }
  }, [formData.synopsis]);

  const addGenre = () => {
    if (newGenre.trim() && !formData.genres?.includes(newGenre.trim())) {
      setFormData(prev => ({ ...prev, genres: [...(prev.genres || []), newGenre.trim()] }));
      setNewGenre('');
    }
  };

  const removeGenre = (genre: string) => {
    setFormData(prev => ({ ...prev, genres: prev.genres?.filter(g => g !== genre) }));
  };

  const STANDARD_PLATFORMS = [
    'PC', 
    'PlayStation 5', 
    'PlayStation 4', 
    'Xbox Series X|S', 
    'Xbox One', 
    'Nintendo Switch', 
    'Steam Deck', 
    'Mobile', 
    'PlayStation 3', 
    'Xbox 360', 
    'Nintendo Wii / Wii U', 
    'Nintendo 3DS', 
    'Retro / Emulador'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformContainerRef.current && !platformContainerRef.current.contains(event.target as Node)) {
        setIsPlatformMenuOpen(false);
      }
    };
    if (isPlatformMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlatformMenuOpen]);

  const addPlatform = (platform: string) => {
    const p = platform.trim();
    if (p && !formData.platform?.includes(p)) {
      setFormData(prev => ({ 
        ...prev, 
        platform: Array.isArray(prev.platform) ? [...prev.platform, p] : [p] 
      }));
    }
  };

  const removePlatform = (platform: string) => {
    setFormData(prev => ({ 
      ...prev, 
      platform: Array.isArray(prev.platform) ? prev.platform.filter(p => p !== platform) : [] 
    }));
  };

  const togglePlatform = (platform: string) => {
    const p = platform.trim();
    if (!p) return;
    const current = Array.isArray(formData.platform) ? formData.platform : [];
    if (current.includes(p)) {
      removePlatform(p);
    } else {
      addPlatform(p);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 lg:p-margin-desktop max-w-[var(--spacing-container-max-width)] mx-auto"
    >
      <div className="mb-6 lg:mb-8">
        <h1 className="font-headline-md lg:text-headline-lg text-on-surface">
          {isEdit ? `${t.editGame}: ${formData.title}` : t.addNewGame}
        </h1>
        <p className="font-body-sm lg:text-body-md text-on-surface-variant mt-2">
          {isEdit ? t.updateGameInfo : t.fillGameInfo}
        </p>
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="bg-surface-container-low/50 backdrop-blur-md rounded-xl border border-outline-variant/10 shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-8">
          {/* Left Column: Cover Upload */}
          <div className="lg:col-span-4 space-y-4">
            <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">{t.gameCover}</label>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <div 
              className="relative group cursor-pointer aspect-[3/4] bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.coverUrl && formData.coverUrl.trim() !== '' ? (
                <img src={formData.coverUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                  <span className="font-body-sm text-body-sm px-4 text-center">{t.clickToUpload}</span>
                </>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-2">
                <span className="material-symbols-outlined mb-1">add_photo_alternate</span>
                <span className="font-label-md">{t.changePhoto}</span>
                {formData.coverUrl && formData.coverUrl.trim() !== '' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData(prev => ({ ...prev, coverUrl: '' }));
                    }}
                    className="mt-1 px-3 py-1 bg-error text-white rounded-lg text-xs font-semibold hover:bg-error/80 flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    {t.removePhoto || "Remover Foto"}
                  </button>
                )}
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant/70 text-center">{t.recommendedFormat}</p>
            
            <div className="pt-4 border-t border-outline-variant/20 space-y-4">
              <button 
                type="button"
                onClick={() => formData.trailerUrl && setActiveTrailerUrl(formData.trailerUrl)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all active:scale-95 outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined">play_circle</span>
                {t.watchTrailer}
              </button>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t.trailerLink}</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all" 
                  placeholder="https://youtube.com/..." 
                  type="text"
                  value={formData.trailerUrl || ''}
                  onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                />
              </div>

              {/* Horizontal Background Cover Upload */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  {t.horizontalCover || "Capa de Fundo (horizontal)"}
                </label>

                <input 
                  type="file"
                  ref={bannerFileInputRef}
                  onChange={handleBannerUpload}
                  accept="image/*"
                  className="hidden"
                />

                {formData.bannerUrl && formData.bannerUrl.trim() !== '' ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-[16/9] border-2 border-outline-variant/30 bg-surface-container-low shadow-sm">
                    <img 
                      src={formData.bannerUrl} 
                      alt="Capa de Fundo" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        {t.changePhoto || "Alterar foto"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                        className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        {t.deletePhoto || "Excluir foto"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="w-full py-4 px-4 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-3xl mb-1 text-primary group-hover:scale-110 transition-transform">panorama</span>
                    <span className="font-label-md text-xs text-on-surface font-semibold">{t.uploadHorizontalCover || "Carregar Capa de Fundo (horizontal)"}</span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant/70 mt-0.5">{t.horizontalRecommendedFormat || "Formato recomendado: 16:9 (Horizontal)"}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  className="w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary transition-all cursor-pointer" 
                  id="platina-checkbox" 
                  type="checkbox"
                  checked={formData.isPlatinum || false}
                  onChange={(e) => setFormData({...formData, isPlatinum: e.target.checked})}
                />
                <label className="font-label-md text-label-md text-on-surface-variant uppercase cursor-pointer tracking-wider" htmlFor="platina-checkbox">{t.gamePlatinumed}</label>
              </div>
            </div>
          </div>
          {/* Right Column: Form Fields */}
          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="title">{t.gameTitle}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    className="flex-1 bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                    id="title" 
                    placeholder="Ex: Elden Ring" 
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSyncGameInfo}
                    disabled={isSyncing || !formData.title?.trim()}
                    className="px-5 py-2.5 bg-secondary text-on-secondary rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Informações'}
                  </button>
                </div>
                {syncSuccess && <p className="text-xs text-green-500 font-medium mt-1">Campos em branco preenchidos automaticamente com sucesso!</p>}
                {syncError && <p className="text-xs text-error font-medium mt-1">{syncError}</p>}
              </div>
              <div className="space-y-2 relative" ref={platformContainerRef}>
                <div className="flex items-center justify-between">
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                    {t.platforms}
                  </label>
                  {Array.isArray(formData.platform) && formData.platform.length > 0 && (
                    <span className="text-[11px] text-primary font-bold">
                      {formData.platform.length} selecionada(s)
                    </span>
                  )}
                </div>

                {/* Clickable Platforms Field */}
                <div 
                  onClick={() => setIsPlatformMenuOpen(prev => !prev)}
                  className={`w-full bg-surface-container-low border ${
                    isPlatformMenuOpen ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/30 hover:border-outline-variant/60'
                  } rounded-lg p-2.5 min-h-[48px] flex items-center justify-between gap-2 cursor-pointer transition-all shadow-sm`}
                >
                  <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                    {Array.isArray(formData.platform) && formData.platform.length > 0 ? (
                      formData.platform.map(p => (
                        <span 
                          key={p} 
                          className="flex items-center gap-1 bg-primary text-on-primary px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p}
                          <span 
                            className="material-symbols-outlined text-[14px] cursor-pointer hover:bg-black/20 rounded-full p-0.5 transition-colors" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlatform(p);
                            }}
                          >
                            close
                          </span>
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant/50 text-xs select-none">
                        {t.noPlatformSelected || "Clique para selecionar plataformas..."}
                      </span>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 shrink-0 ${isPlatformMenuOpen ? 'rotate-180 text-primary' : ''}`}>
                    expand_more
                  </span>
                </div>

                {/* Interactive Platforms Popover Menu */}
                {isPlatformMenuOpen && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl p-3 space-y-3 backdrop-blur-md">
                    {/* Custom platform input */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text"
                        placeholder="Digitar outra plataforma..."
                        value={customPlatformInput}
                        onChange={(e) => setCustomPlatformInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customPlatformInput.trim()) {
                              addPlatform(customPlatformInput.trim());
                              setCustomPlatformInput('');
                            }
                          }
                        }}
                        className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                      <button
                        type="button"
                        disabled={!customPlatformInput.trim()}
                        onClick={() => {
                          if (customPlatformInput.trim()) {
                            addPlatform(customPlatformInput.trim());
                            setCustomPlatformInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Adicionar
                      </button>
                    </div>

                    {/* Predefined Platform Options */}
                    <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider">
                          Selecione as plataformas
                        </span>
                        <span className="text-[9px] text-on-surface-variant/50">
                          clique para marcar/desmarcar
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                        {STANDARD_PLATFORMS.map(p => {
                          const isSelected = Array.isArray(formData.platform) && formData.platform.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePlatform(p)}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left cursor-pointer ${
                                isSelected 
                                  ? 'bg-primary text-on-primary shadow-sm font-bold' 
                                  : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/20'
                              }`}
                            >
                              <span className="truncate mr-1">{p}</span>
                              <span className="material-symbols-outlined text-[16px] shrink-0">
                                {isSelected ? 'check_circle' : 'add'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Detail Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="build">Build</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="build" 
                  placeholder="Ex: 12345" 
                  type="text"
                  value={formData.build || ''}
                  onChange={(e) => setFormData({...formData, build: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="version">{t.version}</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="version" 
                  placeholder="Ex: 1.0.4" 
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="dlc">DLC</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="dlc" 
                  placeholder="Ex: Shadow of the Erdtree" 
                  type="text"
                  value={formData.dlc || ''}
                  onChange={(e) => setFormData({...formData, dlc: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="size">{t.size}</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="size" 
                  placeholder="Ex: 60GB" 
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                />
              </div>
            </div>

            {/* New Fields: Desenvolvedor & Publisher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="developer">{language === 'English (US)' ? 'Developer' : (language === 'Español' ? 'Desarrollador' : 'Desenvolvedor')}</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="developer" 
                  placeholder="Ex: FromSoftware" 
                  type="text"
                  value={formData.developer || ''}
                  onChange={(e) => setFormData({...formData, developer: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="publisher">Publisher</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="publisher" 
                  placeholder="Ex: Bandai Namco" 
                  type="text"
                  value={formData.publisher || ''}
                  onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                />
              </div>
            </div>

            {/* Fields: Localização & Região */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Localização with Tab Autocompletion and Suggestions */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="location">
                    {t.location}
                  </label>
                  {locationSuggestion && (
                    <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <kbd className="font-mono bg-surface-container px-1 py-0.2 rounded text-[10px] border border-outline-variant/30">Tab</kbd>
                      {t.tabToComplete || "Tab para completar"}
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  {/* Ghost text overlay for Tab completion */}
                  {locationSuggestion && isLocationFocused && (
                    <div className="absolute inset-0 px-4 py-2 pointer-events-none font-body-sm text-body-sm flex items-center whitespace-pre overflow-hidden">
                      <span className="opacity-0">{currentLocationInput}</span>
                      <span className="text-on-surface-variant/40 select-none">
                        {locationSuggestion.slice(currentLocationInput.length)}
                      </span>
                    </div>
                  )}

                  <input 
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                    id="location" 
                    placeholder="Ex: Biblioteca I, HD Externo, Steam" 
                    type="text"
                    autoComplete="off"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    onFocus={() => setIsLocationFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setIsLocationFocused(false), 200);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Tab' || e.key === 'ArrowRight') && locationSuggestion) {
                        e.preventDefault();
                        setFormData(prev => ({ ...prev, location: locationSuggestion }));
                      }
                    }}
                  />
                </div>

                {/* Suggested existing locations dropdown */}
                {isLocationFocused && filteredLocations.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant/30 rounded-lg shadow-xl p-2 space-y-1 backdrop-blur-md">
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant/60 px-2 py-1 flex items-center justify-between">
                      <span>Localizações existentes</span>
                      <span className="text-[9px] lowercase opacity-70">tab ou clique para aplicar</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1 max-h-36 overflow-y-auto">
                      {filteredLocations.map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, location: loc }));
                            setIsLocationFocused(false);
                          }}
                          className={`px-2.5 py-1 text-xs rounded-md transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                            loc.toLowerCase() === (formData.location || '').toLowerCase()
                              ? 'bg-primary text-on-primary font-bold'
                              : 'bg-surface-container-high hover:bg-primary/20 text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px] opacity-70">folder</span>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Região Field */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="region">
                  {t.region || "Região"}
                </label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                    id="region" 
                    placeholder="Ex: Global, USA / NTSC-U, EUR / PAL, JPN" 
                    type="text"
                    list="game-region-options"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                  />
                  <datalist id="game-region-options">
                    <option value="Global" />
                    <option value="América do Norte (USA / NTSC-U)" />
                    <option value="Europa (EUR / PAL)" />
                    <option value="Japão (JPN / NTSC-J)" />
                    <option value="Brasil (BR)" />
                    <option value="Ásia (Asia)" />
                    <option value="América Latina (LATAM)" />
                    <option value="Austrália (AUS)" />
                  </datalist>
                </div>
              </div>
            </div>

            {/* New Field: Ano de Lançamento & Horas Jogadas (Modified grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="release_year">{t.releaseYear}</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="release_year" 
                  placeholder="Ex: 2022" 
                  type="text"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="hours">{t.hoursPlayed}</label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                    id="hours" 
                    min="0" 
                    placeholder="0" 
                    type="number"
                    value={formData.playtime || 0}
                    onChange={(e) => setFormData({...formData, playtime: Number(e.target.value)})}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body-sm text-on-surface-variant">h</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t.genres}</label>
              <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg">
                {formData.genres?.map(genre => (
                  <span key={genre} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-label-md">
                    {genre}
                    <span 
                      className="material-symbols-outlined text-[16px] cursor-pointer hover:opacity-70" 
                      onClick={() => removeGenre(genre)}
                    >
                      close
                    </span>
                  </span>
                ))}
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder={"+ " + t.add}
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    className="bg-transparent border-none outline-none font-label-md text-label-md text-primary w-24 placeholder:text-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t.progressStatus}</label>
              <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 h-[48px]">
                {(['Backlog', 'Jogando', 'Completos'] as GameStatus[]).map((status) => (
                  <button 
                    key={status}
                    className={`flex-1 py-2 px-4 rounded-lg font-label-md text-label-md transition-all ${
                      formData.status === status 
                        ? 'bg-white shadow-sm text-primary' 
                        : 'text-on-surface-variant hover:bg-white/50'
                    }`} 
                    type="button"
                    onClick={() => setFormData({...formData, status})}
                  >
                    {status === 'Completos' ? t.completed : (status === 'Jogando' ? t.playing : status)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t.campaignProgress}</label>
                <span className="font-label-md text-label-md text-primary">{formData.progress}%</span>
              </div>
              <input 
                className="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
                type="range"
                min="0"
                max="100"
                value={formData.progress || 0}
                onChange={(e) => setFormData({...formData, progress: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t.yourRating}</label>
              <div className="flex items-center gap-1 text-primary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setFormData({...formData, rating: star})}
                    className="outline-none"
                  >
                    <span 
                      className={`material-symbols-outlined text-3xl transition-transform hover:scale-110 ${star <= (formData.rating || 0) ? 'fill' : ''}`}
                      style={{ fontVariationSettings: `"FILL" ${star <= (formData.rating || 0) ? 1 : 0}` }}
                    >
                      star
                    </span>
                  </button>
                ))}
                <span className="ml-2 font-body-sm text-on-surface-variant">({formData.rating}/5)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="synopsis">{t.synopsis}</label>
              <textarea 
                ref={textareaRef}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] max-h-[400px] resize-none outline-none overflow-y-auto" 
                id="synopsis" 
                placeholder={language === 'English (US)' ? 'A brief description of the game...' : (language === 'Español' ? 'Una breve descripción del juego...' : 'Uma breve descrição do jogo...')}
                value={formData.synopsis || ''}
                onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="bg-surface-container-low/50 border-t border-outline-variant/30 p-8 flex justify-between items-center">
          <div>
            {isEdit && onDeleteRequest && (
               <button 
                type="button"
                onClick={() => onDeleteRequest(game!.id)}
                className="px-6 py-2.5 rounded-lg border border-error/30 text-error font-label-md text-label-md hover:bg-error/5 transition-all outline-none"
              >
                {language === 'English (US)' ? 'Delete Game' : (language === 'Español' ? 'Eliminar Juego' : 'Excluir Jogo')}
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              className="px-8 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant/50 transition-all outline-none" 
              type="button"
              onClick={onCancel}
            >
              {t.clearDbCancel}
            </button>
            <button 
              className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:brightness-110 active:scale-95 transition-all outline-none" 
              type="submit"
            >
              {isEdit ? t.saveChanges : t.saveGame}
            </button>
          </div>
        </div>
      </form>

      <TrailerModal 
        isOpen={!!activeTrailerUrl} 
        url={activeTrailerUrl} 
        onClose={() => setActiveTrailerUrl(null)} 
      />
    </motion.div>
  );
}



// Lucky Draw Modal Component
function LuckyDrawModal({ isOpen, game, onClose, onReDraw, onViewDetails, t }: { 
  isOpen: boolean, 
  game: Game | null, 
  onClose: () => void,
  onReDraw: () => void,
  onViewDetails: (id: string) => void,
  t: TranslationKeys
}) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  if (!isOpen || !game) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-surface-container-low w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border border-outline-variant/30"
        >
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/2 aspect-[3/4] md:aspect-auto">
              <img src={game.coverUrl || DEFAULT_COVER} alt={game.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 flex flex-col justify-center flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  {language === 'English (US)' ? 'Hub Recommendation' : (language === 'Español' ? 'Recomendación del Hub' : 'Recomendação do Hub')}
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-on-surface leading-tight">{game.title}</h2>
                <div className="flex flex-wrap gap-2">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getPlatformStyle(Array.isArray(game.platform) ? game.platform[0] : game.platform)}`}>
                     {Array.isArray(game.platform) ? game.platform[0] : game.platform}
                   </span>
                   <span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-bold uppercase">{game.status === 'Backlog' ? 'No Backlog' : (game.status === 'Jogando' ? t.playing : t.completed)}</span>
                </div>
              </div>
              
              <p className="text-on-surface-variant text-sm line-clamp-4 italic">
                "{game.synopsis}"
              </p>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => onViewDetails(game.id)}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                  {language === 'English (US)' ? 'View Details' : (language === 'Español' ? 'Ver Detalles' : 'Ver Detalhes')}
                </button>
                <button 
                  onClick={onReDraw}
                  className="w-full py-4 border border-outline-variant text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95 transition-transform"
                >
                  {language === 'English (US)' ? 'Roll Another' : (language === 'Español' ? 'Sortear Otro' : 'Sortear Outro')}
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmModal({ isOpen, gameTitle, onConfirm, onCancel, t }: {
  isOpen: boolean,
  gameTitle: string,
  onConfirm: () => void,
  onCancel: () => void,
  t: TranslationKeys
}) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-surface-container-low w-full max-w-md rounded-xl p-8 shadow-2xl border border-outline-variant/30 text-center"
        >
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">delete_forever</span>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-2">{language === 'English (US)' ? 'Delete Game?' : (language === 'Español' ? '¿Eliminar juego?' : 'Excluir Jogo?')}</h2>
          <p className="text-on-surface-variant text-sm mb-8">
            {language === 'English (US)' ? `Are you sure you want to delete "${gameTitle}"?` : (language === 'Español' ? `¿Estás seguro de que quieres eliminar "${gameTitle}"?` : `Tem certeza que deseja excluir "${gameTitle}"?`)} 
            {language === 'English (US)' ? 'This action cannot be undone.' : (language === 'Español' ? 'Esta acción no se puede deshacer.' : 'Esta ação não pode ser desfeita.')}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-error text-white rounded-2xl font-bold text-sm shadow-lg shadow-error/20 active:scale-95 transition-transform"
            >
              {language === 'English (US)' ? 'Yes, Delete Game' : (language === 'Español' ? 'Sí, eliminar juego' : 'Sim, Excluir Jogo')}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 border border-outline-variant text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95 transition-transform"
            >
              {t.clearDbCancel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SettingsView({ 
  theme, 
  userAvatar, 
  userName,
  language,
  t,
  onExport,
  onImport,
  onClearDatabase,
  onRepairDatabase,
  onApplySettings
}: { 
  theme: 'light' | 'dark', 
  userAvatar: string,
  userName: string,
  language: string,
  t: TranslationKeys,
  onExport: (full: boolean) => void,
  onImport: (full: boolean) => void,
  onClearDatabase: () => void | Promise<void>,
  onRepairDatabase: () => void | Promise<void>,
  onApplySettings: (data: Partial<UserSettings>) => Promise<void>
}) {
  const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(theme);
  const [localAvatar, setLocalAvatar] = useState<string>(userAvatar);
  const [localName, setLocalName] = useState<string>(userName);
  const [localLanguage, setLocalLanguage] = useState<string>(language);
  const [isSaved, setIsSaved] = useState(false);

  // Custom modal states for requested buttons
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [supportTab, setSupportTab] = useState<'pix' | 'alternativa'>('pix');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const dbChangelogs = useLiveQuery(() => db.changelog.toArray()) || [];

  const changelogEntries = useMemo(() => {
    const STATIC_CHANGELOG: ChangelogEntry[] = [
      {
        id: '1',
        version: '1.0.0',
        date: '2024-01-01',
        changes: ['Lançamento inicial', 'Gerenciamento de biblioteca', 'Modo escuro']
      },
      {
        id: '2',
        version: '1.0.1',
        date: '2024-02-15',
        changes: ['Melhorias de desempenho', 'Correção de filtros']
      },
      {
        id: '3',
        version: '1.1.7',
        date: '2026-05-19',
        changes: [
          'Nova tela de estatísticas',
          'Melhorias visuais',
          'Correções no ranking',
          'Adicionado idioma russo',
          'Adicionado idioma chinês',
          'Adicionado função atualização automática',
          'Pequenas correções',
          'Corrigido o problema de travamento na obtenção de troféus quando o alvo da ação não existia.'
        ]
      },
      {
        id: '4',
        version: '1.1.9',
        date: '2026-06-17',
        changes: [
          'Dicionário Temático Multilíngue (getTooltip)',
          'Menus de Navegação do Painel Lateral (Sidebar)',
          'Botões de Ação Principais da Barra Superior (Header)',
          'Dynamic Database Installation Modes',
          'Sinalização Visual de Atualizações',
          'Fluxo de Atualização Interativo',
          'Architectural & Visual Layout'
        ]
      },
      {
        id: '5',
        version: '1.2.0',
        date: '2026-06-18',
        changes: [
          'Botão Sincronizar Informações',
          'Otimização do banco de dados',
          'Ícone do app re-criado em dimensão 256x256'
        ]
      },
      {
        id: '6',
        version: '1.2.1',
        date: '2026-06-18',
        changes: [
          'Ajuste no layout dos cards dos jogos para formato de quadrado perfeito modernos (aspect-square) e pontas totalmente retas',
          'Exibição de jogos otimizada para 5 colunas por fileira',
          'Compactação visual do cabeçalho de filtros de gêneros e botões de ordenação para maior elegância',
          'Transformação dos blocos de estatísticas da Biblioteca (Jogando, Concluído e Backlog) em botões interativos de navegação direta',
          'Sinalização no Roadmap do status "Concluído" para a Sincronização de capas e informações Steam',
          'Implementação de dicionário tradutor interno para tradução de sinopses de jogos ao utilizar Sincronizar Informações'
        ]
      },
      {
        id: '7',
        version: '1.3.0',
        date: '2026-06-19',
        changes: [
          'Sistema de atualização automática modernizado (com download via servidor local e instalação silenciosa automática ao fechar)',
          'Balão vermelho indicativo de atualização pendente exibido de forma imediata assim que o app inicia',
          'Aprimoramento de robustez do filtro de categorias e genres para evitar bugs inesperados'
        ]
      },
      {
        id: '8',
        version: '1.4.0',
        date: '2026-07-07',
        changes: [
          'Design do botão "Sortear Jogo" otimizado e minimalista, mantendo apenas o ícone do Dado',
          'Design do botão "Add Jogo" otimizado, mantendo apenas o símbolo "+"',
          'Redimensionamento inteligente e design totalmente responsivo dos cards de jogos na Biblioteca (títulos, estrelas de avaliação, tempo de jogo, ícones de plataforma e progresso)',
          'Suavização e refinamento da animação de escala e hover dos cards de jogos para maior fluidez e sutileza',
          'Listagem direta de jogos instalados ao abrir os detalhes de cada Unidade de Armazenamento'
        ]
      },
      {
        id: '9',
        version: '1.4.1',
        date: '2026-07-08',
        changes: [
          'Correção e automatização total do atualizador de sistema.',
          'Instalação inteligente.',
          'Redesenho completo do ícone de badge (troféu/medalha) do Nível do Jogador nas Estatísticas por um modelo futurista geométrico 3D sofisticado com linhas orbitais tecnológicas de energia',
          'Refinamento do sombreamento e glow traseiro do badge de nível de jogador para um visual super limpo, elegante e leve'
        ]
      },
      {
        id: '10',
        version: '1.4.2',
        date: '2026-07-09',
        changes: [
          'Correção definitiva do player de trailers do YouTube contra Erro 153 com suporte a modo sem cookies, autoplay silenciado e botão de visualização direta.'
        ]
      },
      {
        id: '11',
        version: '1.5.0',
        date: '2026-07-09',
        changes: [
          'Movimentação e unificação do Backup e Importação para a seção de Banco de Dados.',
          'Atualização dos botões Exportar e Importar para o mesmo modelo visual dos botões Reparar e Apagar.',
          'Padronização automática das unidades de armazenamento para Unidade A, Unidade B, etc. (C: até Z:).',
          'Adicionada nova função completa de adicionar e excluir unidades de armazenamento no painel.',
          'Suporte para personalização de letra da unidade, capacidade padrão de 500 GB e espaço de uso inicial.',
          'Cálculo e formatação inteligente de dados digitais (exibição em TB para unidades maiores ou iguais a 1000 GB).',
          'Diferenciação visual e estrutural completa entre as janelas "Adicionar Unidade" (sem botão de exclusão) e "Editar Disco" (com botão de exclusão).',
          'Organização da ordem das unidades de armazenamento arrastando e soltando (drag & drop) de forma intuitiva.',
          'Aprimorado o botão Apagar do Banco de Dados para limpar também a biblioteca, avatar, Usuário Gamer e redefinir o Armazenamento.',
          'Resolvido bug crítico de travamento e handles de arquivos no instalador NSIS através do encerramento limpo via API do Electron ao atualizar.'
        ]
      },
      {
        id: '12',
        version: '1.5.1',
        date: '2026-07-11',
        changes: [
          'Resolvido bug de backup onde os nomes personalizados das Unidades de Armazenamento não eram salvos e restaurados.',
          'Corrigida a exibição da Sinopse na tela de detalhes dos jogos para respeitar quebras de linha e parágrafos de forma correta e legível.'
        ]
      },
      {
        id: '13',
        version: '1.5.2',
        date: '2026-07-12',
        changes: [
          'Resolução definitiva na atualização dinâmica do contêiner "Adicionados Recentemente" e "Concluídos Recentemente" na tela de Estatísticas através do controle preciso de registros de data/hora.',
          'Correção de persistência nos nomes personalizados das Unidades de Armazenamento, garantindo consistência total ao importar, exportar ou recarregar os dados.'
        ]
      },
      {
        id: '14',
        version: '1.6.0',
        date: '2026-08-16',
        changes: [
          'Adicionado o botão "Carregar Capa de Fundo (horizontal)" na tela de Editar Jogo para envio de imagem panorâmica personalizada a partir do computador, com opções completas de alterar e remover foto.',
          'Reformulado o campo de Plataformas no formulário de jogo para abrir automaticamente a listagem de plataformas e inserção personalizada diretamente ao clicar no campo.',
          'Implementada a sugestão e preenchimento inteligente de Localização com base nas localizações já cadastradas na biblioteca (confirmado pela tecla TAB).',
          'Adicionado o novo campo de Região ao lado de Localização para catalogação detalhada da procedência dos jogos.',
          'Aprimorada a pesquisa global na barra superior para pesquisar e navegar diretamente para os resultados na Biblioteca mesmo ao buscar a partir da página de Detalhes de um jogo.',
          'Correção e sincronização em tempo real das listas "Adicionados Recentemente" e "Concluídos Recentemente" na tela de Estatísticas com ordenação cronológica precisa e suporte a jogos 100% zerados.'
        ]
      }
    ];

    const merged = [...STATIC_CHANGELOG];
    dbChangelogs.forEach(dbEntry => {
      if (!merged.some(item => item.id === dbEntry.id)) {
        merged.push(dbEntry);
      }
    });
    return merged;
  }, [dbChangelogs]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sync with props if they change elsewhere
  useEffect(() => {
    setLocalTheme(theme);
    setLocalAvatar(userAvatar);
    setLocalName(userName);
    setLocalLanguage(language);
  }, [theme, userAvatar, userName, language]);

  const hasChanges = localTheme !== theme || localAvatar !== userAvatar || localName !== userName || localLanguage !== language;

  const handleUpdateAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async () => {
    await onApplySettings({
      theme: localTheme,
      userAvatar: localAvatar,
      userName: localName,
      language: localLanguage
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto space-y-8 pb-20 mt-4"
    >
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="font-display font-bold text-headline-md text-on-surface tracking-tight">{t.settings}</h1>
          <p className="text-on-surface-variant text-sm">{t.manageAccount}</p>
        </div>
        <AnimatePresence>
          {isSaved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-green-500 font-bold text-sm bg-green-500/10 px-4 py-2 rounded-full"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {language === 'English (US)' ? 'Changes applied!' : (language === 'Español' ? '¡Cambios aplicados!' : 'Alterações aplicadas!')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avatar Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-8 items-center h-full">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/10 shadow-lg bg-surface-container">
              <img src={localAvatar || DEFAULT_AVATAR} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={handleUpdateAvatar}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-xs font-bold"
            >
              <span className="material-symbols-outlined mb-1">add_a_photo</span>
              {language === 'English (US)' ? 'Change' : (language === 'Español' ? 'Cambiar' : 'Alterar')}
            </button>
          </div>
          
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wider">{t.profilePicture}</h3>
              <p className="text-on-surface-variant text-[11px] font-medium leading-relaxed">{t.personalizeAppearance}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button 
                onClick={handleUpdateAvatar}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-[11px] hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                {t.changePhoto}
              </button>
              <button 
                onClick={() => setLocalAvatar(DEFAULT_AVATAR)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded-xl font-bold text-[11px] hover:bg-surface-container-high transition-all active:scale-95"
              >
                {t.removePhoto}
              </button>
            </div>
          </div>
        </section>

        {/* Profile Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6 flex flex-col justify-center h-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">{t.editProfile}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{t.name}</label>
              <input 
                type="text" 
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none" 
              />
              <div className="flex items-center gap-2 p-3 bg-surface-container-high/30 rounded-lg">
                <span className="material-symbols-outlined text-sm text-primary">info</span>
                <p className="text-[10px] text-on-surface-variant font-medium">{t.offlineApp}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">palette</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">{t.appearance}</h2>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{t.darkModeLightMode}</p>
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/10">
              <button 
                onClick={() => setLocalTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[11px] font-bold transition-all ${
                  localTheme === 'light' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
                {t.light}
              </button>
              <button 
                onClick={() => setLocalTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[11px] font-bold transition-all ${
                  localTheme === 'dark' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                {t.dark}
              </button>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">language</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">{t.preferences}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.1em]">{t.language}</label>
              <div className="relative">
                <select 
                  value={localLanguage}
                  onChange={(e) => setLocalLanguage(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3.5 text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none cursor-pointer"
                >
                  <option value="Português (Brasil)">Português (Brasil)</option>
                  <option value="English (US)">English (US)</option>
                  <option value="Español">Español</option>
                  <option value="Français">Français</option>
                  <option value="Русский">Русский</option>
                  <option value="中文">中文</option>
                  <option value="العربية">العربية</option>
                  <option value="日本語">日本語</option>
                  <option value="Türkçe">Türkçe</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
              </div>
            </div>
          </div>
        </section>

        {/* Unified App Info & Utilities Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">info</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">Aplicativo</h2>
          </div>
          
          <div className="divide-y divide-outline-variant/10">
            {/* Termos de Uso e Politica de Privacidade */}
            <button 
              onClick={() => setShowTermsModal(true)}
              className="w-full flex items-center justify-between py-4 text-left group hover:text-primary transition-colors outline-none cursor-pointer"
            >
              <span className="text-sm font-semibold text-on-surface">Termos de Uso e Política de Privacidade</span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform text-[20px]">arrow_forward</span>
            </button>

            {/* Ver funcionalidade */}
            <button 
              onClick={() => setShowFeaturesModal(true)}
              className="w-full flex items-center justify-between py-4 text-left group hover:text-primary transition-colors outline-none cursor-pointer"
            >
              <span className="text-sm font-semibold text-on-surface">Ver funcionalidade</span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform text-[20px]">arrow_forward</span>
            </button>

            {/* Novidades desta versao do App */}
            <button 
              onClick={() => setShowChangelogModal(true)}
              className="w-full flex items-center justify-between py-4 text-left group hover:text-primary transition-colors outline-none cursor-pointer"
            >
              <span className="text-sm font-semibold text-on-surface">Novidades desta versão do App</span>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">Novo</span>
            </button>
          </div>

          {/* Card Footer with Version and Support Button */}
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
            <span className="bg-primary/5 border border-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-xl">
              v1.6.0
            </span>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] font-variation-fill" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
              Apoiar este Projeto
            </button>
          </div>
        </section>

        {/* Database Management Section */}
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">database</span>
            </div>
            <h2 className="font-display text-xl font-bold text-on-surface uppercase tracking-tight">Banco de Dados</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button 
              onClick={onRepairDatabase}
              className="py-3.5 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[11px] hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              {language === 'English (US)' ? 'Repair' : (language === 'Español' ? 'Reparar' : 'Reparar')}
            </button>
            <button 
              onClick={onClearDatabase}
              className="py-3.5 border border-error/20 bg-error/5 text-error rounded-xl font-bold text-[11px] hover:bg-error/10 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              {language === 'English (US)' ? 'Clear' : (language === 'Español' ? 'Apagar' : 'Apagar')}
            </button>
            <button 
              onClick={() => onExport(true)}
              className="py-3.5 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[11px] hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {language === 'English (US)' ? 'Export' : (language === 'Español' ? 'Exportar' : 'Exportar')}
            </button>
            <button 
              onClick={() => onImport(true)}
              className="py-3.5 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[11px] hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
              {language === 'English (US)' ? 'Import' : (language === 'Español' ? 'Importar' : 'Importar')}
            </button>
          </div>
        </section>
      </div>

      {/* Floating Apply Action */}
      <AnimatePresence>
        {hasChanges && (
          <div className="fixed bottom-10 inset-x-0 flex justify-center z-50 pointer-events-none">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-surface-container-high/90 backdrop-blur-xl border border-outline-variant/30 p-4 rounded-3xl shadow-2xl flex items-center gap-6 pointer-events-auto"
            >
              <p className="text-xs font-bold text-on-surface-variant ml-4 hidden md:block">
                {t.unsavedChanges}
              </p>
              <button 
                onClick={handleApply}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {t.applyChanges}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-surface-container-high/95 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/30 shadow-2xl p-8 max-w-md w-full relative z-10 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-red-500 text-2xl font-variation-fill animate-pulse" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
                  <h3 className="font-display font-black text-headline-sm text-on-surface uppercase tracking-tight">Apoie o Projeto</h3>
                </div>
                <button 
                  onClick={() => setShowSupportModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                GamingHub é um projeto independente. Cada apoio ajuda a manter este aplicativo seguindo evoluindo com novas features, ajustes e patches.
              </p>

              {/* Tabs */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setSupportTab('pix')}
                  className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs active:scale-95 cursor-pointer ${
                    supportTab === 'pix' 
                      ? 'border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                      : 'border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span>💚</span> PIX
                </button>
                <button 
                  onClick={() => setSupportTab('alternativa')}
                  className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-xs active:scale-95 cursor-pointer ${
                    supportTab === 'alternativa' 
                      ? 'border-2 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                      : 'border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span>💙</span> ALTERNATIVA
                </button>
              </div>

              {/* Content Card */}
              <div className="bg-surface-container-low/60 p-5 rounded-2xl border border-outline-variant/20">
                <div className="mb-4">
                  <span className="text-[10px] font-black tracking-widest text-on-surface-variant/60 uppercase">Beneficiário</span>
                  <p className="text-xs font-black text-on-surface uppercase mt-1">BENEFICIARIO: DAVISON SANT' ANA DA SILVA</p>
                </div>

                {supportTab === 'pix' ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Chave PIX (E-mail)</span>
                      <div className="bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/10 flex items-center justify-between gap-4">
                        <span className="text-xs font-mono text-on-surface select-all break-all">davisonsant@gmail.com</span>
                        <button 
                          onClick={() => handleCopy('davisonsant@gmail.com', 'email')}
                          className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {copiedField === 'email' ? 'check_circle' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Chave Aleatória</span>
                      <div className="bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/10 flex items-center justify-between gap-4">
                        <span className="text-xs font-mono text-on-surface select-all break-all">f5f689d7-09d5-4a52-b327-771266473851</span>
                        <button 
                          onClick={() => handleCopy('f5f689d7-09d5-4a52-b327-771266473851', 'random')}
                          className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {copiedField === 'random' ? 'check_circle' : 'content_copy'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Chave PIX Copia e Cola</span>
                    <div className="bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/10 flex flex-col gap-3">
                      <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 max-h-20 overflow-y-auto font-mono text-[10px] text-on-surface-variant break-all select-all scrollbar-thin">
                        00020101021126580014br.gov.bcb.pix01364c65e83e-3f96-4ea4-ac5d-c754fab5ddf35204000053039865802BR5914DAVISON  SILVA6009Sao Paulo62070503***63049063
                      </div>
                      <button 
                        onClick={() => handleCopy('00020101021126580014br.gov.bcb.pix01364c65e83e-3f96-4ea4-ac5d-c754fab5ddf35204000053039865802BR5914DAVISON  SILVA6009Sao Paulo62070503***63049063', 'copiacola')}
                        className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {copiedField === 'copiacola' ? 'check_circle' : 'content_copy'}
                        </span>
                        {copiedField === 'copiacola' ? 'Chave Copiada!' : 'Copiar Chave'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowSupportModal(false)}
                className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms of Use Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-surface-container-high/95 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/30 shadow-2xl p-8 max-w-2xl w-full relative z-10 flex flex-col gap-6 max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
                  <h3 className="font-display font-black text-headline-sm text-on-surface uppercase tracking-tight">Termos de Uso & Política</h3>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Terms Content */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-sm text-on-surface-variant leading-relaxed scrollbar-thin max-h-[50vh]">
                <div className="border-b border-outline-variant/10 pb-4">
                  <h4 className="font-bold text-on-surface text-base">Termo de Uso – GamingHub</h4>
                  <p className="text-[11px] text-on-surface-variant/70 font-semibold uppercase mt-1">Última atualização: 09 de julho de 2026</p>
                </div>

                <p className="font-medium">
                  Bem-vindo ao GamingHub. Ao instalar ou utilizar o GamingHub, você concorda com os presentes Termos de Uso. Caso não concorde com qualquer uma das condições descritas abaixo, não instale ou utilize o software.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <h5 className="font-bold text-on-surface mb-1">1. Sobre o GamingHub</h5>
                    <p className="text-xs">O GamingHub é um aplicativo desenvolvido para auxiliar usuários na organização e gerenciamento de sua biblioteca de jogos, permitindo o cadastro, acompanhamento e gerenciamento de informações relacionadas aos seus jogos.</p>
                    <p className="text-xs mt-1">O GamingHub é disponibilizado "no estado em que se encontra" ("as is"), podendo receber atualizações, melhorias, correções ou novas funcionalidades a qualquer momento.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">2. Licença de Uso</h5>
                    <p className="text-xs">É concedida ao usuário uma licença pessoal, não exclusiva, intransferível e revogável para utilizar o GamingHub exclusivamente para fins pessoais ou internos. Esta licença não transfere qualquer direito de propriedade intelectual sobre o software.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">3. Direitos Autorais</h5>
                    <p className="text-xs">Todos os direitos sobre o GamingHub, incluindo seu código-fonte, interface, identidade visual, documentação, logotipos e demais elementos que compõem o software pertencem ao seu desenvolvedor, salvo conteúdos pertencentes a terceiros.</p>
                    <p className="text-xs mt-1 font-semibold">O usuário não poderá:</p>
                    <ul className="list-disc list-inside text-xs pl-2 space-y-0.5 mt-1">
                      <li>Vender ou redistribuir versões modificadas do software como se fossem oficiais;</li>
                      <li>Remover avisos de direitos autorais;</li>
                      <li>Utilizar o nome GamingHub para induzir terceiros a acreditar que sua versão é oficial.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">4. Código Aberto</h5>
                    <p className="text-xs">O GamingHub possui repositório oficial disponível em:</p>
                    <a href="https://github.com/davisonsant/GamingHub" target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all font-mono">
                      https://github.com/davisonsant/GamingHub
                    </a>
                    <p className="text-xs mt-1">A utilização, contribuição ou distribuição do código-fonte deverá respeitar a licença publicada no respectivo repositório.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">5. Responsabilidades do Usuário</h5>
                    <p className="text-xs">O usuário é responsável por utilizar o software de forma lícita, manter cópias de segurança de seus dados, verificar a compatibilidade do software com seu computador e utilizar versões obtidas de fontes confiáveis.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">6. Limitação de Responsabilidade</h5>
                    <p className="text-xs">Embora esforços sejam realizados para oferecer um software estável e seguro, o GamingHub é fornecido sem garantias de qualquer natureza. O desenvolvedor não se responsabiliza por perda de dados, danos indiretos ou consequenciais, incompatibilidade com hardware/software de terceiros, ou falhas no uso do programa. O usuário utiliza o aplicativo por sua conta e risco.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">7. Dados Armazenados</h5>
                    <p className="text-xs">O GamingHub armazena informações localmente no computador do usuário. O desenvolvedor não possui acesso automático às informações de sua biblioteca.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">8. Atualizações</h5>
                    <p className="text-xs">O GamingHub poderá disponibilizar atualizações periódicas de segurança, melhorias de desempenho, correções ou novas funcionalidades. Recomenda-se manter o app sempre atualizado.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">9. Softwares de Terceiros</h5>
                    <p className="text-xs">O GamingHub utiliza bibliotecas, frameworks ou componentes de terceiros, cada um sujeito às respectivas licenças de uso.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">10. Encerramento da Licença</h5>
                    <p className="text-xs">O direito de utilização poderá ser encerrado caso o usuário viole estes Termos de Uso. Após o encerramento, o usuário deverá interromper a utilização do software.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">11. Alterações dos Termos</h5>
                    <p className="text-xs">Este documento poderá ser atualizado periodicamente. A versão mais recente substituirá quaisquer versões anteriores.</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">12. Contato</h5>
                    <p className="text-xs">E-mail do desenvolvedor: <span className="font-semibold text-on-surface">davison.sant@live.com</span></p>
                  </div>

                  <div>
                    <h5 className="font-bold text-on-surface mb-1">13. Aceite</h5>
                    <p className="text-xs">Ao instalar ou utilizar o GamingHub, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso.</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowTermsModal(false)}
                className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Features Modal */}
      <AnimatePresence>
        {showFeaturesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeaturesModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-surface-container-high/95 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/30 shadow-2xl p-8 max-w-lg w-full relative z-10 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-2xl">star</span>
                  <h3 className="font-display font-black text-headline-sm text-on-surface uppercase tracking-tight">Recursos do GamingHub</h3>
                </div>
                <button 
                  onClick={() => setShowFeaturesModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Grid of features */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">sports_esports</span>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-0.5">Biblioteca Premium</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Cadastre, refine filtros, gerencie status (Jogando, Favoritos, Backlog) e registre todas as suas horas de gameplay.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">monitoring</span>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-0.5">Estatísticas do Jogador</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Acompanhe seu nível de jogador em tempo real através de XP acumulado por suas jogatinas e conquistas registradas.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">database</span>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-0.5">Espaço em Disco & Armazenamento</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Gerencie o espaço ocupado por jogo em suas mídias ou partições de armazenamento, evitando surpresas de falta de espaço.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/10">
                  <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">timeline</span>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface mb-0.5">Linha de Desenvolvimento (Roadmap)</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Visualize o planejamento e as próximas metas de novas funcionalidades previstas para o aplicativo.</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowFeaturesModal(false)}
                className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Changelog Modal */}
      <AnimatePresence>
        {showChangelogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChangelogModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-surface-container-high/95 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/30 shadow-2xl p-8 max-w-lg w-full relative z-10 flex flex-col gap-6 max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-2xl">history</span>
                  <h3 className="font-display font-black text-headline-sm text-on-surface uppercase tracking-tight">Histórico de Novidades</h3>
                </div>
                <button 
                  onClick={() => setShowChangelogModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Scrollable Changelog List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin max-h-[45vh]">
                {changelogEntries.length > 0 ? (
                  [...changelogEntries].sort((a, b) => Number(b.id) - Number(a.id)).map((entry) => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-primary" />
                      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-2">
                        <span className="font-bold text-on-surface text-base">Versão {entry.version}</span>
                        <span className="text-[10px] text-on-surface-variant/70 font-bold uppercase tracking-wider">{entry.date}</span>
                      </div>
                      <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1.5 pl-1.5">
                        {entry.changes.map((change, i) => (
                          <li key={i} className="leading-relaxed">{change}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl mb-2">inventory_2</span>
                    <p className="text-xs text-on-surface-variant font-medium">Nenhum changelog registrado.</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowChangelogModal(false)}
                className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center py-6 flex flex-col gap-1 items-center">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-60">
          GAMINGHUB V1.6.0 • 2026
        </p>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-60">
          Um produto Hub_ • {t.developedBy} DAVISON SANT
        </p>
      </div>
    </motion.div>
  );
}

function UpdateModal({ 
  isOpen, 
  status, 
  onClose, 
  onCheckAgain, 
  data, 
  t 
}: { 
  isOpen: boolean, 
  status: 'idle' | 'checking' | 'available' | 'up-to-date' | 'error' | 'no-release', 
  onClose: () => void, 
  onCheckAgain: () => void, 
  data: any, 
  t: TranslationKeys 
}) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  const isPt = language !== 'English (US)';

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadingName, setDownloadingName] = useState<string>('');
  const [isDone, setIsDone] = useState(false);
  const [updateMode, setUpdateMode] = useState<'preserve' | 'clean'>('preserve');

  const startDownload = async (url: string, filename: string) => {
    try {
      if (updateMode === 'clean') {
        const confirmClean = window.confirm(
          isPt 
            ? "Você selecionou 'Instalação Limpa'. Isso apagará PERMANENTEMENTE todos os jogos cadastrados, categorias, conquistas e mídias salvos localmente. Tem certeza que deseja prosseguir?" 
            : "You selected 'Clean Installation'. This will PERMANENTLY erase all locally stored games, categories, achievements, and media. Are you sure you want to proceed?"
        );
        if (!confirmClean) return;
        
        await db.games.clear();
        await db.roadmap.clear();
        await db.changelog.clear();
        await db.disks.clear();
        await db.disks.bulkPut(INITIAL_DISKS);
      }

      setDownloadProgress(0);
      setDownloadingName(filename);
      setIsDone(false);
      
      const res = await fetch(getApiUrl('/api/updater/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, filename })
      });
      
      if (!res.ok) {
        throw new Error("HTTP error starting updater on backend");
      }

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(getApiUrl('/api/updater/progress'));
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.state === 'downloading') {
              setDownloadProgress(pollData.progress);
            } else if (pollData.state === 'installing') {
              setDownloadProgress(100);
              setIsDone(true);
              clearInterval(pollInterval);
            } else if (pollData.state === 'error') {
              clearInterval(pollInterval);
              setDownloadProgress(null);
              setIsDone(false);
              alert(isPt ? `Erro no download do update: ${pollData.error}` : `Update download error: ${pollData.error}`);
            }
          }
        } catch (pollErr) {
          console.error("Error polling updater progress:", pollErr);
        }
      }, 500);
    } catch (err) {
      console.warn("Backend-managed update failed, falling back to openExternalLink", err);
      openExternalLink(url);
      setDownloadProgress(null);
    }
  };

  if (!isOpen) return null;

  const assets = data?.assets || [];
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface-container-low max-w-2xl w-full rounded-2xl border border-outline-variant/10 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-high/50">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">system_update_alt</span>
            <h2 className="text-xl font-headline font-bold text-on-surface">
              {isPt ? 'Atualizador de Sistema' : 'System Updater'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-surface-container rounded-full text-outline hover:text-on-surface transition-colors flex items-center justify-center outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          {status === 'checking' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-on-surface-variant font-medium text-center">
                {isPt ? 'Verificando atualizações no GitHub...' : 'Checking for updates on GitHub...'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto shadow-inner shadow-error/5">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-on-surface">
                  {isPt ? 'Conexão Falhou' : 'Connection Failed'}
                </h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                  {isPt 
                    ? 'Não conseguimos obter as informações de lançamento mais recentes do GamingHub. Verifique sua conexão de internet.' 
                    : 'We were unable to pull the latest release info for GamingHub. Please check your internet connection.'}
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={onCheckAgain}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all outline-none"
                >
                  {isPt ? 'Tentar Novamente' : 'Try Again'}
                </button>
                <a 
                  href="https://github.com/davisonsant/GamingHub/releases/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 border-2 border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center gap-2 outline-none"
                >
                  {isPt ? 'GitHub Releases' : 'GitHub Releases'}
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            </div>
          )}

          {status === 'no-release' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner shadow-primary/5">
                <span className="material-symbols-outlined text-3xl">info</span>
              </div>
              <div className="space-y-4 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-on-surface">
                  {isPt ? 'Versão de Desenvolvimento' : 'Development Build'}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {isPt 
                    ? 'Ainda não existem versões de lançamento (releases) oficiais criadas no seu repositório GitHub. O GamingHub está executando na versão v1.6.0.' 
                    : 'There are no official releases found on your GitHub repository yet. GamingHub is running on build v1.6.0.'}
                </p>
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-medium rounded-xl p-4 text-xs flex items-center gap-2.5 max-w-md mx-auto">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>
                    {isPt 
                      ? 'Seu banco de dados e biblioteca salvos localmente serão totalmente preservados e nunca serão perdidos ao atualizar.' 
                      : 'Your local database and saved library will be fully preserved and never lost during updates.'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant/80 italic">
                  {isPt 
                    ? 'Para habilitar atualizações em tempo real com download e instalação de arquivos, configure tags e releases em seu repositório: https://github.com/davisonsant/GamingHub/releases' 
                    : 'To enable real-time updates with direct downloader, create release tags inside your repository: https://github.com/davisonsant/GamingHub/releases'}
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <a 
                  href="https://github.com/davisonsant/GamingHub/releases/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 outline-none"
                >
                  {isPt ? 'Acessar Releases do GitHub' : 'Open GitHub Releases'}
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 border border-outline-variant text-on-surface hover:bg-surface-container rounded-xl font-bold text-sm active:scale-95 transition-all outline-none"
                >
                  {isPt ? 'Fechar' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {status === 'up-to-date' && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-green-500/5">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-on-surface">
                  {isPt ? 'Você está Atualizado!' : 'System is Up to Date!'}
                </h3>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                  {isPt 
                    ? 'Parabéns! Você já está rodando a versão mais recente do GamingHub.' 
                    : 'Congratulations! You are already running the latest available version of GamingHub.'}
                </p>
                <div className="inline-block px-4 py-1 bg-surface-container-high rounded-full border border-outline-variant/30 text-xs font-mono font-bold text-on-surface-variant mt-2">
                  v1.6.0 (Latest)
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button 
                  onClick={onClose}
                  className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all outline-none"
                >
                  {isPt ? 'Excelente!' : 'Awesome!'}
                </button>
              </div>
            </div>
          )}

          {status === 'available' && (
            <div className="space-y-6">
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-on-surface">
                    {isPt ? 'Nova Atualização Disponível!' : 'New Update is Available!'}
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    {isPt 
                      ? `Uma nova atualização está disponível. Versão atual v1.6.0 → Nova versão ${data?.tag_name || ''}`
                      : `A new update is available. Current version v1.6.0 → New version ${data?.tag_name || ''}`}
                  </p>
                </div>
              </div>

              {/* Release Notes */}
              {data?.body && (
                <div className="space-y-3 bg-surface-container rounded-2xl p-5 border border-outline-variant/5">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                    {isPt ? 'Notas de Lançamento:' : 'Release Notes:'}
                  </h4>
                  <div className="text-sm text-on-surface-variant leading-relaxed max-h-[140px] overflow-y-auto pr-2 custom-scrollbar whitespace-pre-line font-serif italic text-justify select-text">
                    {data.body}
                  </div>
                </div>
              )}

              {/* Choice of Installation */}
              <div className="space-y-6">
                {/* Installation Option Picker */}
                <div className="space-y-3 bg-surface-container-high/60 p-5 rounded-2xl border border-outline-variant/10">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">settings_backup_restore</span>
                    {isPt ? 'Tipo de Instalação (Banco de Dados)' : 'Installation Type (Database)'}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isPt 
                      ? 'Decida se prefere manter seus jogos e conquistas existentes ou realizar uma formatação completa.' 
                      : 'Decide whether you prefer to keep your existing games and achievements or perform a full wipe.'}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {/* Mode Preserve */}
                    <button
                      type="button"
                      onClick={() => setUpdateMode('preserve')}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        updateMode === 'preserve' 
                          ? 'border-primary bg-primary/5 text-on-surface' 
                          : 'border-outline-variant/20 hover:border-outline-variant bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="mt-0.5 flex shrink-0 items-center justify-center">
                        <span className={`material-symbols-outlined text-[20px] ${updateMode === 'preserve' ? 'text-primary' : 'text-outline'}`}>
                          {updateMode === 'preserve' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm tracking-tight text-on-surface">
                          {isPt ? 'Manter Banco de Dados' : 'Keep Database'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant leading-normal mt-0.5">
                          {isPt 
                            ? 'Preserva 100% de seus jogos salvos, conquistas, histórico e configurações intactos.' 
                            : 'Preserves 100% of your saved games, achievements, history and settings intact.'}
                        </p>
                      </div>
                    </button>

                    {/* Mode Clean */}
                    <button
                      type="button"
                      onClick={() => setUpdateMode('clean')}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                        updateMode === 'clean' 
                          ? 'border-error bg-error/5 text-on-surface' 
                          : 'border-outline-variant/20 hover:border-outline-variant bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="mt-0.5 flex shrink-0 items-center justify-center">
                        <span className={`material-symbols-outlined text-[20px] ${updateMode === 'clean' ? 'text-error' : 'text-outline'}`}>
                          {updateMode === 'clean' ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm tracking-tight text-on-surface">
                          {isPt ? 'Instalação Limpa' : 'Clean Installation'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant leading-normal mt-0.5">
                          {isPt 
                            ? 'Zera todo o banco de dados local para começar com uma biblioteca em branco.' 
                            : 'Re-initializes all local database tables to start with an empty library.'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Option 1: Automatic Download & Install */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">download_for_offline</span>
                    {isPt ? 'Opção 1: Instalação Automática (Baixar Direto)' : 'Option 1: Automatic Installation (Direct Download)'}
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {isPt 
                      ? 'Baixe a atualização diretamente pelo aplicativo com monitoramento em tempo real.' 
                      : 'Download the update directly through the app featuring real-time download tracking.'}
                  </p>

                  {(() => {
                    const exeAssets = assets.filter((a: any) => a.name.toLowerCase().endsWith('.exe'));
                    let target = exeAssets.find((a: any) => {
                      const name = a.name.toLowerCase();
                      return (name.includes('setup') || name.includes('install')) && !name.includes('portable');
                    });
                    if (!target) {
                      target = exeAssets.find((a: any) => !a.name.toLowerCase().includes('portable'));
                    }
                    if (!target) {
                      target = exeAssets[0];
                    }
                    if (!target) {
                      target = assets[0];
                    }

                    if (!target) {
                      return (
                        <p className="text-xs text-on-surface-variant/70 italic text-center py-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                          {isPt 
                            ? 'Nenhum executável anexado a esta release ainda. Utilize a Opção 2 abaixo.' 
                            : 'No executables attached to this release yet. Please use Option 2 below.'}
                        </p>
                      );
                    }

                    const isThisDownloading = downloadProgress !== null && downloadingName === target.name;
                    const sizeMB = (target.size / (1024 * 1024)).toFixed(1);

                    return (
                      <div className="space-y-4 pt-1">
                        {downloadProgress !== null && isThisDownloading ? (
                          <div className="p-5 border rounded-2xl border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 relative overflow-hidden shadow-md">
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <span className="material-symbols-outlined text-[28px] shrink-0 text-blue-500">desktop_windows</span>
                                <div className="text-left min-w-0">
                                  <p className="font-bold text-sm tracking-tight truncate max-w-[280px]" title={target.name}>
                                    {target.name}
                                  </p>
                                  <p className="text-[11px] opacity-75 font-semibold">
                                    {isPt ? 'Windows (Instalador)' : 'Windows (Installer)'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-bold opacity-90 bg-blue-500/10 px-2.5 py-0.5 rounded-md shrink-0">
                                {sizeMB} MB
                              </span>
                            </div>

                            <div className="mt-4.5 w-full">
                              <div className="w-full bg-blue-500/15 h-2.5 rounded-full overflow-hidden relative">
                                <div 
                                  className="bg-blue-500 h-full transition-all duration-150 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                  style={{ width: `${downloadProgress}%` }}
                                />
                              </div>
                              <div className="mt-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex justify-between w-full uppercase tracking-wider">
                                <span>
                                  {isDone 
                                    ? (isPt ? 'Concluído! Fechando o aplicativo...' : 'Done! Closing the application...') 
                                    : (isPt ? 'Baixando...' : 'Downloading...')}
                                </span>
                                <span>{downloadProgress}%</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                            <button
                              onClick={() => startDownload(target.browser_download_url, target.name)}
                              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all duration-150 outline-none cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">system_update_alt</span>
                              {isPt ? 'Atualizar Agora' : 'Update Now'}
                            </button>

                            <button
                              onClick={onClose}
                              className="px-6 py-3.5 border border-outline-variant/30 hover:border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-sm rounded-xl active:scale-98 transition-all duration-150 outline-none cursor-pointer"
                            >
                              {isPt ? 'Atualizar Depois' : 'Update Later'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function BugReportModal({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: TranslationKeys }) {
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl('/api/report-bug'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description,
          timestamp: new Date().toISOString(),
          app: 'GamingHub V1.2.1',
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        setIsSent(true);
        setTimeout(() => {
          setIsSent(false);
          setDescription('');
          onClose();
        }, 3000);
      } else {
        alert("Erro ao enviar reporte. Tente novamente.");
      }
    } catch (error) {
      console.error("Bug Report Error:", error);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-surface-container-low w-full max-w-md rounded-xl p-8 shadow-2xl border border-outline-variant/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined">bug_report</span>
                </div>
                <h2 className="text-xl font-display font-bold text-on-surface">{t.bugReportTitle}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {isSent ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="font-bold text-lg">{t.bugReportSent}</h3>
                <p className="text-sm text-on-surface-variant">{t.bugReportSentDesc}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">
                    {t.bugReportDesc}
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.bugReportPlaceholder}
                    className="w-full h-32 bg-surface p-4 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none custom-scrollbar"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="bg-primary/5 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {t.bugReportHelp}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container transition-all"
                    disabled={isSubmitting}
                  >
                    {t.clearDbCancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isSubmitting || !description.trim()
                        ? 'bg-outline-variant text-on-surface/30 cursor-not-allowed'
                        : 'bg-primary text-on-primary hover:brightness-110 shadow-primary/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                        {t.sending}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        {t.sendReport}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function AddRoadmapModal({ isOpen, item, onClose, onSave, onDelete, t }: { isOpen: boolean, item: RoadmapItem | null, onClose: () => void, onSave: (data: Partial<RoadmapItem>) => void, onDelete: (id: string) => void, t: any }) {
  const [formData, setFormData] = useState<Partial<RoadmapItem>>(item || { title: '', description: '', status: 'planned', date: new Date().toISOString().split('T')[0], priority: 'Q3' });

  useEffect(() => {
    if (item) setFormData(item);
    else setFormData({ title: '', description: '', status: 'planned', date: new Date().toISOString().split('T')[0], priority: 'Q3' });
  }, [item, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface-container-low w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/30"
        >
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{item ? 'edit' : 'add_circle'}</span>
              {item ? (t.editGame || 'Editar Item') : (t.addRoadmapItem || 'Novo Item')}
            </h2>
            {item && (
              <button 
                onClick={() => { if(confirm(t.confirm || 'Excluir?')) onDelete(item.id); }}
                className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                title={t.delete}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.title}</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all" placeholder="Ex: Novo Filtro de Busca" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.description}</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all h-24" placeholder="O que será lançado..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.releaseDate}</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.status}</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all">
                  <option value="planned">{t.planned}</option>
                  <option value="in-progress">{t.inProgress}</option>
                  <option value="completed">{t.completedStatus}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.priority}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Q1', 'Q2', 'Q3'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${
                      formData.priority === p 
                        ? 'bg-primary text-on-primary border-primary shadow-md' 
                        : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-primary/30'
                    }`}
                  >
                    {p} - {p === 'Q1' ? t.high : p === 'Q2' ? t.medium : t.low}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-3 px-4 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container transition-all">{t.cancel}</button>
            <button onClick={() => onSave(formData)} className="flex-1 py-3 px-4 bg-primary text-on-primary font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg" disabled={!formData.title}>{t.save}</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function AddChangelogModal({ isOpen, entry, onClose, onSave, t }: { isOpen: boolean, entry: ChangelogEntry | null, onClose: () => void, onSave: (data: Partial<ChangelogEntry>) => void, t: any }) {
  const [formData, setFormData] = useState<Partial<ChangelogEntry>>(entry || { version: '', date: new Date().toISOString().split('T')[0], changes: [''] });

  useEffect(() => {
    if (entry) setFormData(entry);
    else setFormData({ version: '', date: new Date().toISOString().split('T')[0], changes: [''] });
  }, [entry, isOpen]);

  if (!isOpen) return null;

  const addChangeRule = () => setFormData({...formData, changes: [...(formData.changes || []), '']});
  const updateChange = (idx: number, val: string) => {
    const newChanges = [...(formData.changes || [])];
    newChanges[idx] = val;
    setFormData({...formData, changes: newChanges});
  };
  const removeChange = (idx: number) => {
    const newChanges = (formData.changes || []).filter((_, i) => i !== idx);
    setFormData({...formData, changes: newChanges});
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface-container-low w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh]"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">{entry ? 'edit' : 'history'}</span>
            {entry ? 'Editar Changelog' : 'Novo Registro de Mudanças'}
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">Versão</label>
                <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all" placeholder="Ex: 1.2.0" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">Data</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block">Mudanças</label>
                <button onClick={addChangeRule} className="text-[10px] font-black text-primary uppercase hover:underline">+ Adicionar</button>
              </div>
              <div className="space-y-2">
                {formData.changes?.map((change, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={change} onChange={e => updateChange(idx, e.target.value)} className="flex-1 bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all" placeholder="O que mudou..." />
                    <button onClick={() => removeChange(idx)} className="p-2 text-error hover:bg-error/10 rounded-lg"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-3 px-4 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container transition-all">Cancelar</button>
            <button onClick={() => onSave(formData)} className="flex-1 py-3 px-4 bg-primary text-on-primary font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg" disabled={!formData.version || !formData.changes?.length}>Salvar</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function RankingSelectModal({ isOpen, onClose, onSelect, games, slot, t }: { isOpen: boolean, onClose: () => void, onSelect: (gameId: string, slot: number) => void, games: Game[], slot: number | null, t: any }) {
  const [search, setSearch] = useState('');
  
  if (!isOpen || slot === null) return null;

  const filteredGames = games.filter(g => 
    matchesGameTitle(g.title, search) && !g.rankingPos
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface-container-low w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-outline-variant/30 flex flex-col max-h-[80vh]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              {t.selectGameForRank} (#{slot})
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none">search</span>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-container pl-12 pr-10 py-4 rounded-2xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Limpar busca"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
            {filteredGames.length > 0 ? (
              filteredGames.map(game => (
                <div 
                  key={game.id}
                  onClick={() => onSelect(game.id, slot)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-container transition-all cursor-pointer group border border-transparent hover:border-outline-variant/20"
                >
                  <img src={game.coverUrl || DEFAULT_COVER} className="w-10 h-14 rounded-lg object-cover shadow-md" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">{game.title}</h4>
                    <p className="text-[10px] text-on-surface-variant/60 uppercase font-bold tracking-wider">{Array.isArray(game.platform) ? game.platform[0] : game.platform}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary transition-colors">add</span>
                </div>
              ))
            ) : (
                <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant/30 italic">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                  <p className="text-xs">{t.noGamesFound}</p>
                </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function formatStorageUnit(gb: number, forceDecimal: boolean = false): string {
  if (gb >= 1000) {
    const tb = gb / 1000;
    return tb % 1 === 0 ? `${tb} TB` : `${tb.toFixed(1)} TB`;
  }
  return forceDecimal ? `${gb.toFixed(1)} GB` : `${gb} GB`;
}

function DiskItem({ 
  disk, 
  t, 
  onEdit, 
  onDragStart, 
  onDrop 
}: { 
  disk: Disk, 
  t: any, 
  onEdit: (disk: Disk) => void, 
  onDragStart: (e: React.DragEvent, id: string) => void, 
  onDrop: (e: React.DragEvent, id: string) => void,
  key?: any 
}) {
  const freeGB = disk.totalGB - disk.usedGB;
  const usedPercent = (disk.usedGB / disk.totalGB) * 100;
  const [isDragOver, setIsDragOver] = useState(false);
  
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      draggable
      onDragStart={(e) => onDragStart(e, disk.id)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, disk.id);
      }}
      className={`p-4 rounded-2xl border flex items-center gap-4 group cursor-grab active:cursor-grabbing hover:bg-surface-container transition-all ${
        isDragOver 
          ? 'border-primary bg-primary/5 scale-[1.02] shadow-md' 
          : 'bg-surface-container-high/40 border-outline-variant/10'
      }`}
      onClick={() => onEdit(disk)}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center border border-outline-variant/20 shadow-sm overflow-hidden group-hover:border-primary/30 transition-colors">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant font-light group-hover:text-primary transition-colors">database</span>
        </div>
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)] border border-white/20" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-on-surface truncate mb-1.5">
          {disk.label} ({disk.letter}:)
        </h4>
        
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded-sm overflow-hidden border border-slate-300 dark:border-slate-800 p-[1px] mb-1">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${usedPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-sm ${usedPercent > 90 ? 'bg-red-500' : 'bg-[#0078d4]'} shadow-sm`}
          />
        </div>
        
        <p className="text-[10px] text-on-surface-variant/70 font-medium">
          {formatStorageUnit(freeGB, true)} {t.freeSpace} {formatStorageUnit(disk.totalGB)}
        </p>
      </div>
    </motion.div>
  );
}

function EditDiskModal({ isOpen, disk, isAdding, onClose, onSave, onDelete, t, games = [], onGameClick }: { 
  isOpen: boolean, 
  disk: Disk | null, 
  isAdding: boolean,
  onClose: () => void, 
  onSave: (disk: Disk) => void, 
  onDelete?: (diskId: string) => void,
  t: any,
  games?: Game[],
  onGameClick?: (gameId: string) => void
}) {
  const [formData, setFormData] = useState<Partial<Disk>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const language = localStorage.getItem('gaminghub_language') || 'Português (Brasil)';

  useEffect(() => {
    if (disk) {
      setFormData(disk);
      setConfirmDelete(false);
    }
  }, [disk]);

  if (!isOpen || !disk) return null;

  // Filter games associated with this disk
  const diskGames = games.filter(g => {
    if (!g.location) return false;
    const loc = g.location.trim().toLowerCase();
    const letter = (disk.letter || '').trim().toLowerCase();
    const label = (disk.label || '').trim().toLowerCase();
    
    // Check if location starts with letter followed by a colon (like I:\... or I:)
    if (loc.startsWith(letter + ':')) return true;
    
    // Check if the disk label matches or is included in the location with proper word/roman numeral boundaries
    if (label) {
      const idx = loc.indexOf(label);
      if (idx !== -1) {
        const nextChar = loc[idx + label.length];
        if (!nextChar || !/[a-z0-9]/i.test(nextChar)) {
          return true;
        }
      }
    }
    
    // Check if it contains the drive letter in parentheses/brackets/spaces
    if (loc.includes('(' + letter + ':') || loc.includes('[' + letter + ':') || loc.includes(' ' + letter + ':')) return true;
    
    // If location is exactly the drive letter
    if (loc === letter) return true;
    
    return false;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-surface-container-low w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                {isAdding ? 'add' : 'edit'}
              </span>
              {isAdding 
                ? (language === 'English (US)' ? 'Add Storage Unit' : 'Adicionar Unidade') 
                : (language === 'English (US)' ? 'Edit Disk' : 'Editar Disco')}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.diskName}</label>
                  <input 
                    type="text" 
                    value={formData.label || ''} 
                    onChange={e => setFormData({...formData, label: e.target.value})}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">
                    {language === 'English (US)' ? 'Letter' : 'Letra'}
                  </label>
                  <input 
                    type="text" 
                    maxLength={1}
                    value={formData.letter || ''} 
                    onChange={e => setFormData({...formData, letter: e.target.value.toUpperCase()})}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all text-center font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.totalCapacity}</label>
                  <input 
                    type="number" 
                    value={formData.totalGB || 0} 
                    onChange={e => setFormData({...formData, totalGB: parseFloat(e.target.value)})}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-1.5">{t.usedSpace}</label>
                  <input 
                    type="number" 
                    value={formData.usedGB || 0} 
                    onChange={e => setFormData({...formData, usedGB: parseFloat(e.target.value)})}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/20 focus:border-primary/50 outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20">
              <label className="text-[10px] uppercase font-bold text-outline-variant tracking-widest block mb-2">
                {localStorage.getItem('gaminghub_language') !== 'English (US)' ? 'Jogos nesta Unidade' : 'Games on this Drive'} ({diskGames.length})
              </label>
              
              {diskGames.length > 0 ? (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {diskGames.map(game => (
                    <div 
                      key={game.id}
                      onClick={() => onGameClick?.(game.id)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-surface-container hover:bg-primary/10 transition-all cursor-pointer group"
                    >
                      <img 
                        src={game.coverUrl || DEFAULT_COVER} 
                        alt="" 
                        className="w-8 h-10 object-cover rounded shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {game.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-on-surface-variant font-medium">
                          <span className="uppercase">{Array.isArray(game.platform) ? game.platform[0] : game.platform}</span>
                          {game.size && <span>• {game.size}</span>}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-sm text-outline opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                        arrow_forward
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/50 italic py-2">
                  {localStorage.getItem('gaminghub_language') !== 'English (US)' 
                    ? 'Nenhum jogo associado a esta unidade.' 
                    : 'No games associated with this drive.'}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-outline-variant/10">
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-outline-variant text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => onSave({...disk, ...formData} as Disk)}
                className="flex-1 py-3 px-4 bg-primary text-on-primary font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                {isAdding 
                  ? (language === 'English (US)' ? 'Add Unit' : 'Adicionar Unidade') 
                  : t.saveDisk}
              </button>
            </div>
            {!isAdding && disk.id && (
              <div className="w-full mt-1">
                {!confirmDelete ? (
                  <button 
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2.5 px-4 bg-error/10 hover:bg-error/20 text-error border border-error/20 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    {language === 'English (US)' ? 'Delete Storage Unit' : 'Excluir Unidade'}
                  </button>
                ) : (
                  <div className="flex gap-2 w-full animate-fade-in">
                    <button 
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 px-3 border border-outline-variant text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                    >
                      {language === 'English (US)' ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button 
                      onClick={() => {
                        onDelete?.(disk.id);
                        setConfirmDelete(false);
                      }}
                      className="flex-1 py-2 px-3 bg-error text-white text-xs font-bold rounded-xl hover:bg-error/80 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                      {language === 'English (US)' ? 'Confirm' : 'Confirmar'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


