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

// Types
type GameStatus = 'Jogando' | 'Favoritos' | 'Completos' | 'Backlog';

interface Game {
  id: string;
  title: string;
  genre: string;
  status: GameStatus;
  playtime: number; // in hours
  progress: number; // 0-100
  rating: number; // 0-5
  coverUrl: string;
  isFavorite: boolean;
  platform: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  location: string;
  synopsis: string;
  genres: string[];
  trailerUrl?: string;
  isPlatinum?: boolean;
}

// Mock Data
const INITIAL_GAMES: Game[] = [
  {
    id: '1',
    title: 'Elden Ring',
    genre: 'Action RPG',
    status: 'Completos',
    playtime: 145,
    progress: 100,
    rating: 5,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbNdauzzNgJ7FgbsRoJQXQn6pvy4JVtPZWa03JtGo2v6wskphETT_LSyh1Vgtcl67jzuPNGH1uQ-8ZZnC7-6_F8BOdkO_ydM0KW3FYUP4b3NDAYDjpHiD90jy27k3vddfPFQMlZUiIn9JPxsCm3HvXV9FLlbrom7ETnE9-F8GNJ2Eg_eY7mwlwi90yhGNqwLNpki-BGEkqQA69JGeDxD4bO-hs6Gb8uGSzGFheQTNzBwlLmLpIBNFjRFO8WD5lML-hxnh4VxdykjM',
    isFavorite: true,
    platform: 'PC',
    releaseDate: '25 de Fevereiro de 2022',
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    location: 'Steam',
    synopsis: 'O Anel Prístino foi destruído. Nas Terras Entre, governadas pela Rainha Marika, a Eterna, o Anel Prístino, a fonte da Térvore, foi despedaçado.',
    genres: ['Action', 'RPG', 'Open World'],
    trailerUrl: 'https://www.youtube.com/watch?v=K37Zp99S9Is',
    isPlatinum: true
  },
  {
    id: '2',
    title: 'God of War Ragnarök',
    genre: 'Action Adventure',
    status: 'Jogando',
    playtime: 42,
    progress: 65,
    rating: 4,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDWUcFUYvtRVCFsuncKfeDLNhtmxvhJSnRumOCKmY_43u287sswHOCgKYJzadHy6JLJK-2JK58Ol0Wb33nMWhc4SPc7EIxBDibMSs4gUegfD2kZN9OgYVN2KW2-DmSie8Or_Bfccsdk5otvN4gXItYXEbCgfO8uZJDE1tXhbgRIpL6pPnojGKmNyBGG13XXoITAZUzR_4spPTMeNMYAoqazm_fftMW1MlnwtMeOoOO9KDoPZlh3Cf54Fh3tk-ydSwgEn9AExREsjs',
    isFavorite: true,
    platform: 'PlayStation 5',
    releaseDate: '9 de Novembro de 2022',
    developer: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    location: 'PS5 Library',
    synopsis: 'Kratos e Atreus devem viajar pelos Nove Reinos em busca de respostas enquanto as forças asgardianas se preparam para uma batalha profetizada que acabará com o mundo.',
    genres: ['Action', 'Adventure', 'Hack and Slash'],
    trailerUrl: 'https://www.youtube.com/watch?v=hfJ4Km46A-0',
    isPlatinum: true
  },
  {
    id: '3',
    title: 'Balatro',
    genre: 'Roguelike Deckbuilder',
    status: 'Backlog',
    playtime: 12,
    progress: 10,
    rating: 5,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6OtfNAJV0RCPRcJgKjWFqGwPoOV-cJECTuOWqn078YaiEo80ua3c0cNb4TVJZXVX5i24VwCFrICpmUQ6QOxMHydXL9FRknwicfuIHHBg7ASdyH9W4J9ZyUjYplOL4NZM3EckuLjgeEKmXFJVKVk979xOey-GY4XPfy15QXbJtgbn4eeuiJBCme0F_lCVbplboQxMK2uYlQiqz-J607xosigrBkyJSAxV_8Uhqh6wpPpwzhZT7CIsBVVaiMniXoTLKPeVaqdEZIp4',
    isFavorite: true,
    platform: 'PC',
    releaseDate: '20 de Fevereiro de 2024',
    developer: 'LocalThunk',
    publisher: 'Playstack',
    location: 'HD Externo',
    synopsis: 'Balatro é um roguelike de poker hipnótico onde se joga mãos de poker ilegais, se descobrem jokers que mudam o jogo e se desencadeiam combos viciantes e adrenalínicos.',
    genres: ['Roguelike', 'Deckbuilder', 'Poker'],
    trailerUrl: 'https://www.youtube.com/watch?v=H7S86t8X0p0',
    isPlatinum: false
  }
];

// Views enumeration
type View = 'Library' | 'Favorites' | 'Playing' | 'Completed' | 'Backlog' | 'Settings' | 'Details' | 'Add' | 'Edit';

export default function App() {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [view, setView] = useState<View>('Library');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [activePlatform, setActivePlatform] = useState<string>('Todas');
  const [activeDeveloper, setActiveDeveloper] = useState<string>('Todos');
  const [activeYear, setActiveYear] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'Date' | 'Title' | 'Playtime' | 'Rating'>('Date');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLuckyModal, setShowLuckyModal] = useState(false);
  const [luckyGame, setLuckyGame] = useState<Game | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [userAvatar, setUserAvatar] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userAvatar') || "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
    }
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
  });

  // Persist avatar
  useEffect(() => {
    localStorage.setItem('userAvatar', userAvatar);
  }, [userAvatar]);

  const mainRef = useRef<HTMLDivElement>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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

  // Filtering
  const filteredGames = useMemo(() => {
    let list = games;
    
    // View filtering
    if (view === 'Favorites') list = list.filter(g => g.isFavorite);
    else if (view === 'Playing') list = list.filter(g => g.status === 'Jogando');
    else if (view === 'Completed') list = list.filter(g => g.status === 'Completos');
    else if (view === 'Backlog') list = list.filter(g => g.status === 'Backlog');
    
    // Search
    if (searchQuery) {
      list = list.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Genre
    if (activeGenres.length > 0) {
      list = list.filter(g => g.genres.some(genre => activeGenres.includes(genre)));
    }

    // Platform
    if (activePlatform !== 'Todas') {
      list = list.filter(g => g.platform === activePlatform);
    }

    // Developer
    if (activeDeveloper !== 'Todos') {
      list = list.filter(g => g.developer === activeDeveloper);
    }

    // Year
    if (activeYear !== 'Todos') {
      list = list.filter(g => g.releaseDate.includes(activeYear));
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'Title':
          return a.title.localeCompare(b.title);
        case 'Playtime':
          return (b.playtime || 0) - (a.playtime || 0);
        case 'Rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'Date':
        default:
          return b.id.localeCompare(a.id); // Assuming ID order roughly reflects addition order for this mock context
      }
    });

    return list;
  }, [games, view, searchQuery, activeGenres, activePlatform, activeDeveloper, activeYear, sortBy]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    games.forEach(g => g.genres.forEach(genre => genres.add(genre)));
    return ['Todos', ...Array.from(genres)];
  }, [games]);

  const allPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    games.forEach(g => platforms.add(g.platform));
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

  const handleToggleFavorite = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setGames(prev => prev.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g));
  };

  const handleDeleteGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
    setView('Library');
    setSelectedGameId(null);
  };

  const handleSaveGame = (gameData: Partial<Game>) => {
    if (view === 'Edit' && selectedGameId) {
      setGames(prev => prev.map(g => g.id === selectedGameId ? { ...g, ...gameData } as Game : g));
      setView('Details');
    } else {
      const newGame: Game = {
        ...gameData as Game,
        id: Math.random().toString(36).substr(2, 9),
        playtime: gameData.playtime || 0,
        progress: gameData.progress || 0,
        rating: gameData.rating || 0,
        isFavorite: gameData.isFavorite || false,
        genres: gameData.genres || []
      };
      setGames(prev => [...prev, newGame]);
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
      ? { games, theme, userAvatar, version: '1.0.4' }
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
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (fullRestore) {
             if (parsed.games) setGames(parsed.games);
             if (parsed.theme) setTheme(parsed.theme);
             if (parsed.userAvatar) setUserAvatar(parsed.userAvatar);
             alert("Backup restaurado com sucesso!");
          } else {
             // Just games or generic import
             const importedGames = Array.isArray(parsed) ? parsed : (parsed.games || []);
             if (confirm("Deseja substituir sua biblioteca atual ou adicionar os novos jogos? (OK = Substituir, Cancelar = Adicionar)")) {
                setGames(importedGames);
             } else {
                setGames(prev => {
                  const existingIds = new Set(prev.map(g => g.id));
                  const uniqueNew = importedGames.filter((g: Game) => !existingIds.has(g.id));
                  return [...prev, ...uniqueNew];
                });
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

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case 'Jogando': return 'bg-primary-container text-on-primary-container';
      case 'Completos': return 'bg-tertiary-container text-on-tertiary-container';
      case 'Backlog': return 'bg-secondary-container text-on-secondary-container';
      default: return 'bg-surface-container-highest text-on-surface';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[var(--spacing-sidebar-width)] bg-surface-container-low/80 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col py-10 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3 text-primary font-display font-bold text-2xl tracking-tight">
            <span className="material-symbols-outlined text-4xl">sports_esports</span>
            <span>GamingHub</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          <NavItem active={view === 'Library'} onClick={() => setView('Library')} icon={<span className="material-symbols-outlined">sports_esports</span>} label="Biblioteca" />
          <NavItem active={view === 'Favorites'} onClick={() => setView('Favorites')} icon={<span className="material-symbols-outlined">favorite</span>} label="Favoritos" />
          <NavItem active={view === 'Playing'} onClick={() => setView('Playing')} icon={<span className="material-symbols-outlined">play_circle</span>} label="Jogando" />
          <NavItem active={view === 'Completed'} onClick={() => setView('Completed')} icon={<span className="material-symbols-outlined">check_circle</span>} label="Completos" />
          <NavItem active={view === 'Backlog'} onClick={() => setView('Backlog')} icon={<span className="material-symbols-outlined">inbox</span>} label="Backlog" />
          <NavItem active={view === 'Settings'} onClick={() => setView('Settings')} icon={<span className="material-symbols-outlined">settings</span>} label="Configurações" />
        </nav>

        <div className="px-6 mt-auto">
          <button 
            onClick={handleLuckyDraw}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">casino</span>
            Sortear Jogo
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[var(--spacing-sidebar-width)] flex-1 flex flex-col min-h-screen relative">
        {/* TopBar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 h-16 flex items-center justify-between px-10">
          <div className="flex items-center gap-4 flex-1">
            {view === 'Details' && (
              <button onClick={() => setView('Library')} className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
              <input 
                type="text" 
                placeholder="Procurar na biblioteca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
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
              onClick={() => handleExport(false)}
              className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center"
              title="Exportar Biblioteca"
            >
              <span className="material-symbols-outlined text-outline">download</span>
            </button>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <button 
              onClick={() => handleImport(false)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition-all"
            >
              Importar
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('Add')}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold shadow-sm hover:brightness-110 transition-all"
            >
              Add Jogo
            </motion.button>
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => setView('Settings')}
                className="w-8 h-8 rounded-full border border-outline-variant shadow-sm hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden active:scale-95 cursor-pointer outline-none"
              >
                <img 
                  src={userAvatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 flex-1">
          <AnimatePresence mode="wait">
            {(view === 'Library' || view === 'Favorites' || view === 'Playing' || view === 'Completed' || view === 'Backlog') && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="mb-2">
                  <h1 className="font-display font-bold text-headline-xl text-on-surface tracking-tight">Biblioteca</h1>
                  <p className="text-on-surface-variant text-body-md mb-4">Sua coleção pessoal de jogos.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-6">
                  <StatCard label="Total Jogos" value={stats.total} color="text-primary" icon="inventory_2" />
                  <StatCard label="Jogando" value={stats.playing} color="text-primary" icon="play_circle" />
                  <StatCard label="Completos" value={stats.completed} color="text-secondary" icon="check_circle" />
                  <StatCard label="Backlog" value={stats.backlog} color="text-tertiary" icon="inbox" />
                  <StatCard label="Total Tempo" value={`${stats.totalTime}h`} color="text-primary" icon="schedule" />
                </div>

                {/* Filter Bar */}
                <div className="bg-surface-container-low/50 backdrop-blur-sm p-4 rounded-[1.5rem] border border-outline-variant/30 flex items-center justify-between shadow-sm overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 min-w-max">
                    {allGenres.map(genre => {
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
                          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            isActive 
                              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105' 
                              : 'text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/10'
                          }`}
                        >
                          {!isTodos && activeGenres.includes(genre) && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 ml-8 pr-2">
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
                      className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        showAdvancedFilters 
                          ? 'bg-primary/10 border-primary/40 text-primary' 
                          : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">filter_list</span>
                      Filtros
                      <span className={`material-symbols-outlined transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    <div className="relative">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant bg-transparent hover:bg-surface-container-high transition-all whitespace-nowrap appearance-none outline-none pr-10 cursor-pointer"
                      >
                        <option value="Date">Recentes</option>
                        <option value="Title">Título (A-Z)</option>
                        <option value="Playtime">Horas</option>
                        <option value="Rating">Avaliação</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[18px] opacity-50">sort</span>
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
                      <div className="bg-surface-container-low/80 backdrop-blur-md p-6 rounded-2xl border border-outline-variant/30 shadow-2xl grid grid-cols-3 gap-8">
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
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">Desenvolvedor</p>
                          <div className="relative">
                            <select 
                              value={activeDeveloper}
                              onChange={(e) => setActiveDeveloper(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allDevelopers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">Ano de Lançamento</p>
                          <div className="relative">
                            <select 
                              value={activeYear}
                              onChange={(e) => setActiveYear(e.target.value)}
                              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                          </div>
                        </div>

                        <div className="col-span-3 pt-2 flex justify-between items-center border-t border-outline-variant/10">
                          <p className="text-xs text-outline">{filteredGames.length} jogos encontrados</p>
                          <button 
                            onClick={() => {
                              setActiveGenres([]);
                              setActivePlatform('Todas');
                              setActiveDeveloper('Todos');
                              setActiveYear('Todos');
                            }}
                            className="text-xs font-bold text-primary hover:underline"
                          >
                            Resetar todos os filtros
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Grid */}
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
                >
                  {filteredGames.map(game => (
                    <motion.div
                      key={game.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                    >
                      <GameCard 
                        game={game} 
                        onToggleFavorite={handleToggleFavorite}
                        onUpdateStatus={(id, status) => setGames(prev => prev.map(g => g.id === id ? { ...g, status } : g))}
                        onClick={() => navigateToDetails(game.id)}
                        statusColor={getStatusColor(game.status)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {view === 'Details' && selectedGame && (
              <GameDetailView 
                game={selectedGame} 
                onEdit={() => setView('Edit')}
                onBack={() => setView('Library')}
                onToggleFavorite={handleToggleFavorite}
                onDeleteRequest={(id) => setDeleteConfirmId(id)}
              />
            )}

            {(view === 'Add' || view === 'Edit') && (
              <GameFormView 
                game={view === 'Edit' ? selectedGame : undefined}
                onSave={handleSaveGame}
                onCancel={() => setView(view === 'Edit' ? 'Details' : 'Library')}
                isEdit={view === 'Edit'}
                onDeleteRequest={(id) => setDeleteConfirmId(id)}
              />
            )}

            {view === 'Settings' && (
              <SettingsView 
                theme={theme} 
                setTheme={setTheme} 
                userAvatar={userAvatar} 
                setUserAvatar={setUserAvatar}
                onExport={handleExport}
                onImport={handleImport}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Lucky Draw Modal */}
        <LuckyDrawModal 
          isOpen={showLuckyModal} 
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
          gameTitle={games.find(g => g.id === deleteConfirmId)?.title || ''}
          onConfirm={() => {
            if (deleteConfirmId) {
              handleDeleteGame(deleteConfirmId);
              setDeleteConfirmId(null);
            }
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      </main>
    </div>
  );
}

// Sub-components
function NavItem({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
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

function StatCard({ label, value, color, icon }: { label: string, value: string | number, color: string, icon?: string }) {
  return (
    <div className="bg-surface-container-low/50 backdrop-blur-sm p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-1 group hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</p>
        {icon && <span className={`material-symbols-outlined text-sm ${color} opacity-50`}>{icon}</span>}
      </div>
      <p className={`text-3xl font-display font-bold tracking-tight ${color} group-hover:scale-105 transition-transform origin-left`}>{value}</p>
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
  statusColor 
}: GameCardProps) {
  return (
    <motion.div 
      layoutId={game.id}
      onClick={onClick}
      whileHover={{ 
        y: -12,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="group bg-surface-container-low/40 backdrop-blur-md rounded-[1.5rem] border border-outline-variant/30 shadow-sm overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <motion.img 
          src={game.coverUrl} 
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
            {game.status}
          </motion.span>
        </div>

        <motion.button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.id, e);
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors z-20"
        >
          <span className={`material-symbols-outlined text-[20px] transition-colors ${game.isFavorite ? 'text-red-500 font-variation-fill' : ''}`} style={{ fontVariationSettings: `"FILL" ${game.isFavorite ? 1 : 0}` }}>favorite</span>
        </motion.button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-sm text-on-surface line-clamp-1 transition-colors group-hover:text-primary tracking-tight">{game.title}</h3>
            <p className="font-sans text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{game.genre}</p>
          </div>
          <div className="flex items-center gap-0.5 text-primary shrink-0 ml-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ scale: i < game.rating ? 1 : 0.9, opacity: i < game.rating ? 1 : 0.3 }}
                className="flex items-center justify-center font-semibold"
              >
                <span 
                  className="material-symbols-outlined text-[14px]" 
                  style={{ fontVariationSettings: `"FILL" ${i < game.rating ? 1 : 0}` }}
                >
                  star
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant font-bold group-hover:text-primary transition-colors uppercase tracking-tight">
            <span className="material-symbols-outlined text-[14px] opacity-70">schedule</span>
            {game.playtime}h
          </div>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-bold uppercase tracking-tight opacity-70">
             <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
             {game.platform}
          </div>
        </div>
        {game.status === 'Jogando' && (
           <div className="mt-2 space-y-1">
             <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter text-on-surface-variant/60">
               <span>Progresso</span>
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

function GameDetailView({ game, onEdit, onBack, onToggleFavorite, onDeleteRequest }: { 
  game: Game, 
  onEdit: () => void, 
  onBack: () => void,
  onToggleFavorite: (id: string) => void,
  onDeleteRequest: (id: string) => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <section className="relative rounded-[2rem] overflow-hidden shadow-2xl h-[380px] group">
        <img 
          src={game.coverUrl} 
          alt={game.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 inset-x-0 p-10 flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {game.status}
              </span>
              {game.isPlatinum && (
                <div className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                  Platinado
                </div>
              )}
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className="material-symbols-outlined text-[18px]" 
                    style={{ fontVariationSettings: `"FILL" ${i < game.rating ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            
            <h1 className="text-white text-5xl font-bold tracking-tight">{game.title}</h1>
            
            <div className="flex items-center gap-6 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                {game.playtime}h jogadas
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                {game.progress}% completo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onEdit} 
              className="px-5 py-2.5 bg-surface-container-highest text-on-surface rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-opacity-80 transition-all active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Editar Jogo
            </button>
            <button 
              onClick={() => onToggleFavorite(game.id)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg"
            >
              <span className={`material-symbols-outlined text-[20px]` } style={{ fontVariationSettings: `"FILL" ${game.isFavorite ? 1 : 0}` }}>favorite</span>
              Favoritar
            </button>
            <button 
              onClick={() => onDeleteRequest(game.id)}
              className="px-4 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-error/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            {game.trailerUrl && (
              <a 
                href={game.trailerUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-sm backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                Trailer
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          {/* Synopsis */}
          <section className="bg-surface-container-low/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-primary shadow-[0_0_12px_rgba(77,142,239,0.6)] rounded-full" />
              <h3 className="font-display text-2xl font-bold tracking-tight text-on-surface">Sinopse</h3>
            </div>
            <p className="font-sans text-on-surface-variant leading-relaxed text-xl font-medium opacity-90 max-w-none line-clamp-10">
              {game.synopsis}
            </p>
          </section>

          {/* Technical Info */}
          <section className="bg-surface-container-low/40 backdrop-blur-md p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-display text-xl font-bold mb-8 text-on-surface">Informações Técnicas</h3>
            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
              <DetailItem label="Plataformas" value={game.platform} />
              <DetailItem label="Lançamento" value={game.releaseDate} />
              <DetailItem label="Desenvolvedor" value={game.developer} />
              <DetailItem label="Publicador" value={game.publisher} />
              <DetailItem label="Localização" value={game.location} />
              <div className="space-y-2">
                <p className="font-sans text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Gêneros</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {game.genres.map(g => (
                    <span key={g} className="px-3 py-1 bg-surface-container-highest/20 text-on-surface rounded-full text-[10px] font-bold border border-outline-variant/10">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Space */}
        <div className="col-span-4 space-y-8">
          <section className="bg-surface-container-low/40 backdrop-blur-md p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="font-display text-lg font-bold text-on-surface">Progresso</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-medium text-sm text-on-surface">Concluído</span>
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
                <span className={`material-symbols-outlined text-[20px] ${game.isPlatinum || game.progress === 100 ? 'text-primary' : 'text-outline-variant opacity-40'}`}>workspace_premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">HORAS JOGADAS</span>
                <span className="font-bold text-sm">{game.playtime}h</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest uppercase">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </div>
  );
}

function GameFormView({ game, onSave, onCancel, isEdit, onDeleteRequest }: { 
  game?: Game, 
  onSave: (data: Partial<Game>) => void, 
  onCancel: () => void,
  isEdit: boolean,
  onDeleteRequest?: (id: string) => void
}) {
  const [formData, setFormData] = useState<Partial<Game>>(game || {
    title: '',
    platform: '',
    coverUrl: '',
    rating: 0,
    status: 'Backlog',
    playtime: 0,
    progress: 0,
    developer: '',
    publisher: '',
    synopsis: '',
    genres: [],
    location: '',
    trailerUrl: '',
    isPlatinum: false,
    releaseDate: ''
  });

  const [newGenre, setNewGenre] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-margin-desktop max-w-[container-max-width] mx-auto"
    >
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          {isEdit ? `Editar Jogo: ${formData.title}` : 'Adicionar Novo Jogo'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          {isEdit ? 'Atualize as informações do seu jogo na biblioteca.' : 'Preencha as informações para catalogar sua nova experiência.'}
        </p>
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(formData); }}
        className="bg-surface-container-low/50 backdrop-blur-md rounded-[1.5rem] border border-outline-variant/30 shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8">
          {/* Left Column: Cover Upload */}
          <div className="md:col-span-4 space-y-4">
            <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Capa do Jogo</label>
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
              {formData.coverUrl ? (
                <img src={formData.coverUrl} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl mb-2">add_photo_alternate</span>
                  <span className="font-body-sm text-body-sm px-4 text-center">Clique para enviar a capa</span>
                </>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                <span className="material-symbols-outlined mb-2">add_photo_alternate</span>
                <span className="font-label-md">Alterar Capa</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant/70 text-center">Formato recomendado: 3:4. Clique para enviar do computador.</p>
            
            <div className="pt-4 border-t border-outline-variant/20 space-y-4">
              <button 
                type="button"
                onClick={() => formData.trailerUrl && window.open(formData.trailerUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all active:scale-95 outline-none"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Assistir Trailer
              </button>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Link do Trailer</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all" 
                  placeholder="https://youtube.com/..." 
                  type="text"
                  value={formData.trailerUrl || ''}
                  onChange={(e) => setFormData({...formData, trailerUrl: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  className="w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary transition-all cursor-pointer" 
                  id="platina-checkbox" 
                  type="checkbox"
                  checked={formData.isPlatinum || false}
                  onChange={(e) => setFormData({...formData, isPlatinum: e.target.checked})}
                />
                <label className="font-label-md text-label-md text-on-surface-variant uppercase cursor-pointer tracking-wider" htmlFor="platina-checkbox">Jogo Platinado</label>
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="title">Título do Jogo</label>
                <input 
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  id="title" 
                  placeholder="Ex: Elden Ring" 
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="platform">Plataforma</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all appearance-none outline-none" 
                    id="platform"
                    value={formData.platform || ''}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    <option value="PC">PC</option>
                    <option value="PlayStation 5">PlayStation 5</option>
                    <option value="Xbox Series X|S">Xbox Series X|S</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
            </div>

            {/* New Fields: Desenvolvedor & Publisher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="developer">Desenvolvedor</label>
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

            {/* New Field: Localização (Full Width) */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="location">Localização</label>
              <input 
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                id="location" 
                placeholder="Ex: HD Externo, Steam Library, GOG Galaxy" 
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* New Field: Ano de Lançamento & Horas Jogadas (Modified grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="release_year">Ano de Lançamento</label>
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
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="hours">Horas Jogadas</label>
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
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Gêneros</label>
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
                    placeholder="+ Adicionar"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    className="bg-transparent border-none outline-none font-label-md text-label-md text-primary w-24 placeholder:text-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status de Progresso</label>
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
                    {status === 'Completos' ? 'Completado' : status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Progresso da Campanha</label>
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
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Sua Avaliação</label>
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
              <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="synopsis">Sinopse</label>
              <textarea 
                ref={textareaRef}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-body-sm text-body-sm focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px] max-h-[400px] resize-none outline-none overflow-y-auto" 
                id="synopsis" 
                placeholder="Uma breve descrição do jogo..."
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
                Excluir Jogo
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              className="px-8 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-variant/50 transition-all outline-none" 
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button 
              className="px-8 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:brightness-110 active:scale-95 transition-all outline-none" 
              type="submit"
            >
              {isEdit ? 'Salvar Alterações' : 'Salvar Jogo'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}



// Lucky Draw Modal Component
function LuckyDrawModal({ isOpen, game, onClose, onReDraw, onViewDetails }: { 
  isOpen: boolean, 
  game: Game | null, 
  onClose: () => void,
  onReDraw: () => void,
  onViewDetails: (id: string) => void
}) {
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
          className="relative bg-surface-container-low w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-outline-variant/30"
        >
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/2 aspect-[3/4] md:aspect-auto">
              <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 flex flex-col justify-center flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  Recomendação do Hub
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-on-surface leading-tight">{game.title}</h2>
                <div className="flex gap-2">
                   <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase">{game.platform}</span>
                   <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-md text-[10px] font-bold uppercase">{game.status === 'Backlog' ? 'No Backlog' : 'Jogando'}</span>
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
                  Ver Detalhes
                </button>
                <button 
                  onClick={onReDraw}
                  className="w-full py-4 border border-outline-variant text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95 transition-transform"
                >
                  Sortear Outro
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
function DeleteConfirmModal({ isOpen, gameTitle, onConfirm, onCancel }: {
  isOpen: boolean,
  gameTitle: string,
  onConfirm: () => void,
  onCancel: () => void
}) {
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
          className="relative bg-surface-container-low w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-outline-variant/30 text-center"
        >
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">delete_forever</span>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-2">Excluir Jogo?</h2>
          <p className="text-on-surface-variant text-sm mb-8">
            Tem certeza que deseja excluir <span className="font-bold text-on-surface">"{gameTitle}"</span>? 
            Esta ação não pode ser desfeita.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full py-4 bg-error text-white rounded-2xl font-bold text-sm shadow-lg shadow-error/20 active:scale-95 transition-transform"
            >
              Sim, Excluir Jogo
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 border border-outline-variant text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-95 transition-transform"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SettingsView({ 
  theme, 
  setTheme, 
  userAvatar, 
  setUserAvatar,
  onExport,
  onImport
}: { 
  theme: 'light' | 'dark', 
  setTheme: (t: 'light' | 'dark') => void,
  userAvatar: string,
  setUserAvatar: (url: string) => void,
  onExport: (full: boolean) => void,
  onImport: (full: boolean) => void
}) {
  const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="mb-8">
        <h1 className="font-display font-bold text-headline-md text-on-surface tracking-tight">Configurações</h1>
      </div>

      {/* Avatar Section */}
      <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 shadow-lg bg-surface-container">
            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={handleUpdateAvatar}
            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center text-xs font-bold"
          >
            <span className="material-symbols-outlined mb-1">add_a_photo</span>
            Alterar
          </button>
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold">Foto de Perfil</h3>
            <p className="text-on-surface-variant text-sm">Personalize sua aparência no GamingHub.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <button 
              onClick={handleUpdateAvatar}
              className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95"
            >
              Alterar Foto
            </button>
            <button 
              onClick={() => setUserAvatar(DEFAULT_AVATAR)}
              className="px-6 py-2 border border-outline-variant text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-all active:scale-95"
            >
              Remover Foto
            </button>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-3xl">person</span>
          <h2 className="font-display text-xl font-bold text-on-surface">Editar perfil</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Nome</label>
            <input 
              type="text" 
              defaultValue="Usuário Gamer" 
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none" 
            />
            <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Este app é offline e não necessita e-mail.
            </p>
          </div>
        </div>
      </section>

      {/* Appearance & Preferences */}
      <div className="grid grid-cols-2 gap-6">
        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">palette</span>
            <h2 className="font-display text-xl font-bold text-on-surface">Aparência</h2>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Modo escuro e claro</p>
            <div className="flex bg-surface-container-low p-1 rounded-xl">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  theme === 'light' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">light_mode</span>
                Claro
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">dark_mode</span>
                Escuro
              </button>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-3xl">language</span>
            <h2 className="font-display text-xl font-bold text-on-surface">Preferências</h2>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Idioma</label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-medium appearance-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none cursor-pointer"
                defaultValue="Português (Brasil)"
              >
                <option>Português (Brasil)</option>
                <option>English (US)</option>
                <option>Español</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
        </section>
      </div>

      {/* Data Management */}
      <section className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-3xl">database</span>
          <h2 className="font-display text-xl font-bold text-on-surface">Backup</h2>
        </div>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">Proteja seus dados salvando uma cópia local da sua biblioteca.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => onExport(true)}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">cloud</span>
                Criar Backup
              </button>
              <button 
                onClick={() => onImport(true)}
                className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">rotate_left</span>
                Restaurar
              </button>
            </div>
          </div>
          <div className="space-y-4 border-l border-outline-variant/30 pl-10">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Importar/exportar listas</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onImport(false)}
                className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">upload</span>
                Importar Listas
              </button>
              <button 
                onClick={() => onExport(false)}
                className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Exportar Listas
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center py-6">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-60">
          GAMINGHUB V1.0.4 • 2026 • DESENVOLVIDO POR DAVISON SANT
        </p>
      </div>
    </motion.div>
  );
}


