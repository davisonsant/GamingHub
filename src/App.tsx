/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, type ReactNode, type MouseEvent, type Key } from 'react';
import { 
  Gamepad2, 
  Heart, 
  PlayCircle, 
  CheckCircle2, 
  Inbox, 
  Settings, 
  Search, 
  Moon, 
  Sun,
  Download, 
  Plus, 
  ChevronDown, 
  Star, 
  Clock, 
  Award, 
  ArrowLeft,
  X,
  UserCircle2,
  Trash2,
  Info,
  Palette,
  Languages,
  Database,
  Cloud,
  FileUp,
  FileDown,
  Edit2,
  ClipboardList,
  Medal,
  RotateCcw,
  UserCog
} from 'lucide-react';
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

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

    return list;
  }, [games, view, searchQuery, activeGenres, activePlatform, activeDeveloper, activeYear]);

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
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-low border-r border-outline-variant flex flex-col py-10 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3 text-primary font-bold text-2xl tracking-tight">
            <Gamepad2 className="w-8 h-8" />
            <span>GamingHub</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          <NavItem active={view === 'Library'} onClick={() => setView('Library')} icon={<Gamepad2 className="w-5 h-5" />} label="Biblioteca" />
          <NavItem active={view === 'Favorites'} onClick={() => setView('Favorites')} icon={<Heart className="w-5 h-5" />} label="Favoritos" />
          <NavItem active={view === 'Playing'} onClick={() => setView('Playing')} icon={<PlayCircle className="w-5 h-5" />} label="Jogando" />
          <NavItem active={view === 'Completed'} onClick={() => setView('Completed')} icon={<CheckCircle2 className="w-5 h-5" />} label="Completos" />
          <NavItem active={view === 'Backlog'} onClick={() => setView('Backlog')} icon={<Inbox className="w-5 h-5" />} label="Backlog" />
          <NavItem active={view === 'Settings'} onClick={() => setView('Settings')} icon={<Settings className="w-5 h-5" />} label="Configurações" />
        </nav>

        <div className="px-6 mt-auto">
          <button className="w-full py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20">
            Sincronizar Biblioteca
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[280px] flex-1 flex flex-col min-h-screen relative">
        {/* TopBar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant h-16 flex items-center justify-between px-10">
          <div className="flex items-center gap-4 flex-1">
            {view === 'Details' && (
              <button onClick={() => setView('Library')} className="p-2 hover:bg-surface-container rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
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
                className="absolute"
              >
                <Moon className="w-5 h-5 text-outline" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ y: theme === 'dark' ? 0 : -40 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute"
              >
                <Sun className="w-5 h-5 text-yellow-500" />
              </motion.div>
            </button>
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <Download className="w-5 h-5 text-outline" />
            </button>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <button className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container transition-all">
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
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCteXppEy_4C1ES54wvS9QXaGTeoYBOajgFUD05c8Lk1XPWeyDHKD3afKIQ6lZwcXskaQEU7Dlud1nEiFXJ7tPqTROQaAUZD9Aw4k_eTvKQ8Hx_0ueJTpGXqY-j4TOkuZAdkbPaYV91lsO0xDBAahIdgbvhubD2QJy-fPWI0zYId92SC0XSpWKDOQeYdnYv9wtsICaBg1BTeEI1SVbNK2Mg5fPUBBlfiF2N1tjJ7Vc5l8zBOI51ETHqzSKLo-NKH-l0-TeZWnA25d4" 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-outline-variant shadow-sm"
              />
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
                {/* Stats */}
                <div className="grid grid-cols-5 gap-6">
                  <StatCard label="Total Jogos" value={stats.total} color="text-primary" />
                  <StatCard label="Jogando" value={stats.playing} color="text-primary" />
                  <StatCard label="Completos" value={stats.completed} color="text-tertiary" />
                  <StatCard label="Backlog" value={stats.backlog} color="text-secondary" />
                  <StatCard label="Total Tempo" value={`${stats.totalTime}h`} color="text-primary" />
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-sm overflow-x-auto no-scrollbar">
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
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                            isActive ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'text-outline hover:bg-surface-container'
                          }`}
                        >
                          {!isTodos && activeGenres.includes(genre) && <CheckCircle2 className="w-3 h-3" />}
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    {activeGenres.length > 1 && (
                      <button 
                        onClick={() => setActiveGenres([])}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Limpar Seleção
                      </button>
                    )}
                    <button 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        showAdvancedFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'border-outline-variant text-outline hover:bg-surface-container'
                      }`}
                    >
                      Filtros Avançados
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-outline hover:bg-surface-container transition-all whitespace-nowrap">
                      Ordenar por: Data adicionado
                      <ChevronDown className="w-4 h-4" />
                    </button>
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
                      <div className="bg-white dark:bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm grid grid-cols-3 gap-8">
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
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
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                onDelete={handleDeleteGame}
              />
            )}

            {(view === 'Add' || view === 'Edit') && (
              <GameFormView 
                game={view === 'Edit' ? selectedGame : undefined}
                onSave={handleSaveGame}
                onCancel={() => setView(view === 'Edit' ? 'Details' : 'Library')}
                isEdit={view === 'Edit'}
                onDelete={handleDeleteGame}
              />
            )}

            {view === 'Settings' && (
              <SettingsView theme={theme} setTheme={setTheme} />
            )}
          </AnimatePresence>
        </div>
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
      {active && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(0,88,190,0.5)]" />}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm transition-transform hover:scale-[1.02]">
      <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-3xl font-bold ${color} tracking-tight`}>{value}</h3>
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
        y: -8,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="group bg-white dark:bg-surface-container-low rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer"
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
          <Heart className={`w-4 h-4 transition-colors ${game.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </motion.button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-on-surface line-clamp-1 transition-colors group-hover:text-primary">{game.title}</h3>
            <p className="text-xs text-outline font-medium">{game.genre}</p>
          </div>
          <div className="flex items-center gap-0.5 text-primary">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ scale: i < game.rating ? 1 : 0.9, opacity: i < game.rating ? 1 : 0.3 }}
              >
                <Star className={`w-3.5 h-3.5 ${i < game.rating ? 'fill-primary' : 'text-outline-variant'}`} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-outline font-medium group-hover:text-primary transition-colors">
            <Clock className="w-3.5 h-3.5 group-hover:animate-pulse" />
            {game.playtime}h jogadas
          </div>
          {game.status === 'Jogando' && (
             <div className="w-24 h-1 bg-surface-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${game.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary" 
                />
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GameDetailView({ game, onEdit, onBack, onToggleFavorite, onDelete }: { 
  game: Game, 
  onEdit: () => void, 
  onBack: () => void,
  onToggleFavorite: (id: string) => void,
  onDelete: (id: string) => void
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
                  <Medal className="w-3 h-3" />
                  Platinado
                </div>
              )}
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < game.rating ? 'fill-yellow-400' : 'text-white/30'}`} 
                  />
                ))}
              </div>
            </div>
            
            <h1 className="text-white text-5xl font-bold tracking-tight">{game.title}</h1>
            
            <div className="flex items-center gap-6 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {game.playtime}h jogadas
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {game.progress}% completo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onEdit} 
              className="px-5 py-2.5 bg-white text-on-surface rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-surface-container transition-all active:scale-95 shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
              Editar Jogo
            </button>
            <button 
              onClick={() => onToggleFavorite(game.id)}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg"
            >
              <Heart className={`w-4 h-4 ${game.isFavorite ? 'fill-on-primary' : ''}`} />
              Favoritar
            </button>
            {game.trailerUrl && (
              <a 
                href={game.trailerUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold text-sm backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
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
          <section className="bg-white dark:bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <h3 className="text-2xl font-bold tracking-tight">Sinopse</h3>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-xl font-medium opacity-90 max-w-none">
              {game.synopsis}
            </p>
          </section>

          {/* Technical Info */}
          <section className="bg-white dark:bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Informações Técnicas</h3>
            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
              <DetailItem label="Plataformas" value={game.platform} />
              <DetailItem label="Lançamento" value={game.releaseDate} />
              <DetailItem label="Desenvolvedor" value={game.developer} />
              <DetailItem label="Publicador" value={game.publisher} />
              <DetailItem label="Localização" value={game.location} />
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">Gêneros</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {game.genres.map(g => (
                    <span key={g} className="px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full text-[10px] font-bold">
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
          <section className="bg-white dark:bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
            <h3 className="text-lg font-bold">Progresso</h3>
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
                <Medal className={`w-5 h-5 ${game.isPlatinum || game.progress === 100 ? 'text-primary' : 'text-outline-variant opacity-40'}`} />
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

function GameFormView({ game, onSave, onCancel, isEdit, onDelete }: { 
  game?: Game, 
  onSave: (data: Partial<Game>) => void, 
  onCancel: () => void,
  isEdit: boolean,
  onDelete?: (id: string) => void
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 max-w-[container-max-width] mx-auto p-margin-desktop"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          {isEdit ? `Editar Jogo: ${game?.title}` : 'Adicionar Novo Jogo'}
        </h1>
        <div className="flex gap-4">
          {isEdit && onDelete && (
            <button 
              onClick={() => onDelete(game!.id)}
              className="px-6 py-2 border border-error text-error rounded-lg font-label-md text-label-md hover:bg-error/5 transition-all outline-none"
            >
              Excluir Jogo
            </button>
          )}
          <button 
            onClick={onCancel} 
            className="px-6 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant/50 transition-all font-semibold outline-none"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm active:scale-95 transition-transform font-semibold outline-none"
          >
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Game Cover Section */}
        <div className="col-span-4">
          <div className="bg-white dark:bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm space-y-4">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Capa do Jogo</p>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-outline-variant/10 bg-surface-container-low">
              {formData.coverUrl ? (
                <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-outline-variant gap-2">
                  <span className="material-symbols-outlined text-4xl opacity-30">add_photo_alternate</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sem Capa</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity h-full w-full">
                <input 
                  type="text" 
                  placeholder="Cole a URL da capa"
                  value={formData.coverUrl || ''}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="material-symbols-outlined mb-2 text-3xl">add_photo_alternate</span>
                <span className="font-label-md">Alterar Capa</span>
              </div>
            </div>

            <div className="space-y-4 mt-4 pt-4 border-t border-outline-variant/20">
              <div>
                <button 
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all active:scale-95 font-bold outline-none"
                  onClick={() => formData.trailerUrl && window.open(formData.trailerUrl, '_blank')}
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  Trailer
                </button>
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Link do Trailer</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all placeholder:opacity-50" 
                  placeholder="https://youtube.com/..." 
                  type="text"
                  value={formData.trailerUrl || ''}
                  onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <input 
                  className="w-5 h-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer" 
                  id="platina-checkbox" 
                  type="checkbox"
                  checked={formData.isPlatinum || false}
                  onChange={(e) => setFormData({ ...formData, isPlatinum: e.target.checked })}
                />
                <label className="font-label-md text-label-md text-on-surface-variant uppercase cursor-pointer" htmlFor="platina-checkbox">Platina</label>
              </div>
              <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Horas Jogadas</label>
                  <div className="relative flex items-center">
                    <input 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 pr-10 text-on-surface focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all" 
                      placeholder="0" 
                      type="number"
                      value={formData.playtime || 0}
                      onChange={(e) => setFormData({...formData, playtime: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 text-on-surface-variant font-body-sm">h</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-md text-label-md text-on-surface-variant uppercase">Concluído</label>
                  <div className="relative flex items-center">
                    <input 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 pr-10 text-on-surface focus:ring-primary focus:border-primary font-body-sm text-body-sm outline-none transition-all" 
                      max="100" min="0" placeholder="0" 
                      type="number"
                      value={formData.progress || 0}
                      onChange={(e) => setFormData({...formData, progress: Number(e.target.value)})}
                    />
                    <span className="absolute right-4 text-on-surface-variant font-body-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields Section */}
        <div className="col-span-8">
          <div className="bg-white dark:bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 shadow-sm space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Título</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  type="text" 
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Plataforma</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  type="text" 
                  value={formData.platform || ''}
                  onChange={(e) => setFormData({...formData, platform: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Ano de Lançamento</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  placeholder="Ex: 2024" 
                  type="text"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Horas Jogadas</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  type="number" 
                  value={formData.playtime || 0}
                  onChange={(e) => setFormData({...formData, playtime: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Localização</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface font-body-sm text-body-sm focus:ring-primary focus:border-primary transition-all outline-none" 
                  placeholder="Ex: HD Externo, Steam Library, GOG Galaxy" 
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Desenvolvedor</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  type="text" 
                  value={formData.developer || ''}
                  onChange={(e) => setFormData({...formData, developer: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Publisher</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none transition-all font-medium" 
                  type="text" 
                  value={formData.publisher || ''}
                  onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Sinopse</label>
                <textarea 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary min-h-[120px] resize-none outline-none transition-all font-medium placeholder:opacity-50" 
                  placeholder="Digite uma breve descrição do jogo..."
                  value={formData.synopsis || ''}
                  onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                ></textarea>
              </div>
              <div className="col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Gêneros</label>
                <div className="flex flex-wrap gap-2 p-3 bg-surface-container-low border border-outline-variant rounded-lg">
                  {formData.genres?.map(g => (
                    <span key={g} className="px-3 py-1 bg-primary/10 text-primary rounded-full font-label-sm text-label-sm flex items-center gap-1">
                      {g}
                      <span 
                        className="material-symbols-outlined text-[14px] cursor-pointer hover:opacity-70" 
                        onClick={() => removeGenre(g)}
                      >
                        close
                      </span>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input 
                      type="text" 
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                      className="bg-transparent border-none outline-none font-label-sm text-label-sm text-primary placeholder:text-primary/50 w-32"
                      placeholder="+ Adicionar Gênero"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Status de Progresso</label>
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:ring-primary focus:border-primary outline-none cursor-pointer font-medium"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as GameStatus})}
                >
                  <option value="Jogando">Jogando</option>
                  <option value="Backlog">Backlog</option>
                  <option value="Completos">Completos</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider font-semibold">Avaliação</label>
                <div className="flex items-center gap-1 h-[50px] text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i}
                      onClick={() => setFormData({...formData, rating: i + 1})}
                      className="material-symbols-outlined cursor-pointer select-none text-3xl transition-transform hover:scale-110" 
                      style={{ fontVariationSettings: `"FILL" ${i < (formData.rating || 0) ? 1 : 0}` }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



function SettingsView({ theme, setTheme }: { theme: 'light' | 'dark', setTheme: (t: 'light' | 'dark') => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="mb-8">
        <h1 className="font-bold text-headline-sm text-on-surface">Configurações</h1>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-surface-container-low p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <UserCog className="w-8 h-8 text-primary" />
          <h2 className="text-xl font-bold text-on-surface">Editar perfil</h2>
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
              <Info className="w-4 h-4" />
              Este app é offline e não necessita e-mail.
            </p>
          </div>
        </div>
      </section>

      {/* Appearance & Preferences */}
      <div className="grid grid-cols-2 gap-6">
        <section className="bg-white dark:bg-surface-container-low p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <Palette className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">Aparência</h2>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Modo escuro e claro</p>
            <div className="flex bg-surface-container-low p-1 rounded-xl">
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  theme === 'light' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'bg-white/10 shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Moon className="w-4 h-4" />
                Escuro
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-surface-container-low p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <Languages className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">Preferências</h2>
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
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
        </section>
      </div>

      {/* Data Management */}
      <section className="bg-white dark:bg-surface-container-low p-8 rounded-2xl border border-outline-variant/30 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <Database className="w-8 h-8 text-primary" />
          <h2 className="text-xl font-bold text-on-surface">Backup</h2>
        </div>
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">Proteja seus dados salvando uma cópia local da sua biblioteca.</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <Cloud className="w-4 h-4" />
                Criar Backup
              </button>
              <button className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low active:scale-95 transition-transform flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </button>
            </div>
          </div>
          <div className="space-y-4 border-l border-outline-variant/30 pl-10">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Importar/exportar listas</p>
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                <FileUp className="w-4 h-4" />
                Importar Listas
              </button>
              <button className="w-full py-3 border border-outline-variant text-on-surface rounded-xl font-bold text-xs hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
                <FileDown className="w-4 h-4" />
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


