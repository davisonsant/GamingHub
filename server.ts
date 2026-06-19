import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import https from "https";
import { exec, spawn } from "child_process";

// Load environment variables from .env file
dotenv.config();

// Lazy initialization of GoogleGenAI client
let aiClient: any = null;

function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave de API GEMINI_API_KEY não foi configurada nas configurações/segredos do seu aplicativo.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to translate gaming genres in case of offline fallback or fallback translation
function translateGenreFallback(genre: string, targetLang: string): string {
  const gLower = genre.toLowerCase().trim();
  const isPt = targetLang.toLowerCase().includes("portu");
  const isEs = targetLang.toLowerCase().includes("espa");

  if (isPt) {
    const ptMap: { [key: string]: string } = {
      "action": "Ação",
      "adventure": "Aventura",
      "fighting": "Luta",
      "shooter": "Tiro",
      "music": "Música",
      "platform": "Plataforma",
      "puzzle": "Quebra-cabeça",
      "racing": "Corrida",
      "simulator": "Simulador",
      "sports": "Esporte",
      "sport": "Esporte",
      "strategy": "Estratégia",
      "tactical": "Tático",
      "role-playing": "RPG",
      "role-playing (rpg)": "RPG",
      "rpg": "RPG",
      "indie": "Indie",
      "arcade": "Fliperama (Arcade)",
      "casual": "Casual",
      "pinball": "Pinball",
      "visual novel": "Visual Novel",
      "turn-based strategy (tbs)": "Estratégia em Turnos",
      "real-time strategy (rts)": "Estratégia em Tempo Real",
      "hack and slash": "Hack and slash / Beat 'em up",
      "hack and slash/beat 'em up": "Hack and slash / Beat 'em up",
      "card & board game": "Cartas e Tabuleiro",
      "moba": "MOBA"
    };
    for (const [key, value] of Object.entries(ptMap)) {
      if (gLower.includes(key)) return value;
    }
  } else if (isEs) {
    const esMap: { [key: string]: string } = {
      "action": "Acción",
      "adventure": "Aventura",
      "fighting": "Pelea",
      "shooter": "Disparos",
      "music": "Música",
      "platform": "Plataformas",
      "puzzle": "Puzle",
      "racing": "Carreras",
      "simulator": "Simulador",
      "sports": "Deportes",
      "sport": "Deportes",
      "strategy": "Estrategia",
      "tactical": "Táctico",
      "role-playing": "RPG",
      "role-playing (rpg)": "RPG",
      "rpg": "RPG",
      "indie": "Indie",
      "arcade": "Arcade",
      "casual": "Casual",
      "pinball": "Pinball",
      "visual novel": "Novela Visual",
      "turn-based strategy (tbs)": "Estrategia por Turnos",
      "real-time strategy (rts)": "Estrategia en Tiempo Real",
      "hack and slash": "Hack and slash / Beat 'em up",
      "hack and slash/beat 'em up": "Hack and slash / Beat 'em up",
      "card & board game": "Cartas y Tablero",
      "moba": "MOBA"
    };
    for (const [key, value] of Object.entries(esMap)) {
      if (gLower.includes(key)) return value;
    }
  }
  return genre;
}

// Internal translator dictionary to translate game synopses / summaries offline (e.g. English -> Portuguese or Spanish)
function translateSynopsisFallback(synopsis: string, targetLang: string): string {
  if (!synopsis) return "";
  const isPt = targetLang.toLowerCase().includes("portu");
  const isEs = targetLang.toLowerCase().includes("espa");

  if (isPt) {
    let result = synopsis;
    // We execute replacements from most specific/longer phrases to simpler words/verbs
    const dictionaryPt: [RegExp, string][] = [
      // Longer Phrases
      [/\bis an action-adventure game\b/gi, "é um jogo de ação e aventura"],
      [/\bis an action-adventure\b/gi, "é um jogo de ação e aventura"],
      [/\baction-adventure game\b/gi, "jogo de ação e aventura"],
      [/\bis an action game\b/gi, "é um jogo de ação"],
      [/\bis an adventure game\b/gi, "é um jogo de aventura"],
      [/\bis a role-playing game\b/gi, "é um jogo de RPG (role-playing)"],
      [/\bis a tactical role-playing\b/gi, "é um RPG tático"],
      [/\bis a first-person shooter\b/gi, "é um jogo de tiro em primeira pessoa (FPS)"],
      [/\bis a third-person shooter\b/gi, "é um jogo de tiro em terceira pessoa"],
      [/\bfirst-person perspective\b/gi, "perspectiva em primeira pessoa"],
      [/\bthird-person perspective\b/gi, "perspectiva em terceira pessoa"],
      [/\btakes place in\b/gi, "se passa em"],
      [/\btake on the role of\b/gi, "assumir o papel de"],
      [/\btakes on the role of\b/gi, "assume o papel de"],
      [/\bthe player controls\b/gi, "o jogador controla"],
      [/\bthe player can\b/gi, "o jogador pode"],
      [/\bplayers can\b/gi, "os jogadores podem"],
      [/\bplayers are able to\b/gi, "os jogadores conseguem"],
      [/\bopen world\b/gi, "mundo aberto"],
      [/\bopen-world\b/gi, "mundo aberto"],
      [/\bsingle-player and multiplayer\b/gi, "single-player e multiplayer"],
      [/\bsingle-player mode\b/gi, "modo single-player"],
      [/\bmultiplayer mode\b/gi, "modo multiplayer"],
      [/\bco-operative mode\b/gi, "modo cooperativo (co-op)"],
      [/\bco-op mode\b/gi, "modo co-op"],
      [/\bset in a\b/gi, "situado em um"],
      [/\bset in the\b/gi, "situado no/a"],
      [/\bwith the help of\b/gi, "com a ajuda de"],
      [/\bas well as\b/gi, "bem como"],
      [/\bdeveloped by\b/gi, "desenvolvido por"],
      [/\bpublished by\b/gi, "publicado por"],
      [/\breleased in\b/gi, "lançado em"],
      [/\bfeatures a variety of\b/gi, "apresenta uma variedade de"],
      [/\ba wide variety of\b/gi, "uma ampla variação de"],
      [/\bincluding\b/gi, "incluindo"],
      [/\bincludes\b/gi, "inclui"],
      [/\bhas been\b/gi, "foi"],
      [/\bas they\b/gi, "enquanto eles"],
      [/\bdesigned to\b/gi, "projetado para"],
      [/\bupto\b/gi, "até"],
      [/\bup to\b/gi, "até"],
      [/\bnew features\b/gi, "novos recursos"],
      [/\bmain character\b/gi, "personagem principal"],
      [/\bmain protagonist\b/gi, "protagonista principal"],
      [/\bplayable character\b/gi, "personagem jogável"],
      [/\bplayable characters\b/gi, "personagens jogáveis"],
      [/\bvarious environments\b/gi, "vários ambientes"],
      [/\bcombat system\b/gi, "sistema de combate"],
      [/\bgameplay mechanics\b/gi, "mecânicas de jogabilidade"],
      [/\bexperience points\b/gi, "pontos de experiência (XP)"],
      [/\bshort summary:\b/gi, "breve resumo:"],
      [/\bshort story:\b/gi, "breve história:"],
      [/\bplot details:\b/gi, "detalhes do enredo:"],
      [/\bthe main objective\b/gi, "o objetivo principal"],
      [/\bin search of\b/gi, "em busca de"],
      [/\bto protect the\b/gi, "para proteger o/a"],
      [/\byour way through\b/gi, "seu caminho através de"],
      [/\bby defeating\b/gi, "ao derrotar"],
      [/\bin order to\b/gi, "para poder"],
      [/\bas a result of\b/gi, "como resultado de"],
      [/\bafter the events of\b/gi, "após os eventos de"],

      // Shorter words and standard terms
      [/\bgameplay\b/gi, "jogabilidade"],
      [/\bgame\b/gi, "jogo"],
      [/\bgames\b/gi, "jogos"],
      [/\bstoryline\b/gi, "enredo / história"],
      [/\bstory\b/gi, "história"],
      [/\bcharacter\b/gi, "personagem"],
      [/\bcharacters\b/gi, "personagens"],
      [/\bplayer\b/gi, "jogador"],
      [/\bplayers\b/gi, "jogadores"],
      [/\bworld\b/gi, "mundo"],
      [/\bworlds\b/gi, "mundos"],
      [/\benemy\b/gi, "inimigo"],
      [/\benemies\b/gi, "inimigos"],
      [/\bweapon\b/gi, "arma"],
      [/\bweapons\b/gi, "armas"],
      [/\bcombat\b/gi, "combate"],
      [/\bbattle\b/gi, "batalha"],
      [/\bbattles\b/gi, "batalhas"],
      [/\bfight\b/gi, "luta"],
      [/\bfights\b/gi, "lutas"],
      [/\bjourney\b/gi, "jornada"],
      [/\bquest\b/gi, "missão (quest)"],
      [/\bquests\b/gi, "missões (quests)"],
      [/\bmission\b/gi, "missão"],
      [/\bmissions\b/gi, "missões"],
      [/\blevel\b/gi, "nível"],
      [/\blevels\b/gi, "níveis"],
      [/\bskill\b/gi, "habilidade"],
      [/\bskills\b/gi, "habilidades"],
      [/\bability\b/gi, "capacidade"],
      [/\babilities\b/gi, "habilidades"],
      [/\bchallenge\b/gi, "desafio"],
      [/\bchallenges\b/gi, "desafios"],
      [/\bdanger\b/gi, "perigo"],
      [/\bdangers\b/gi, "perigos"],
      [/\bitem\b/gi, "item"],
      [/\bitems\b/gi, "itens"],
      [/\bequipment\b/gi, "equipamento"],
      [/\bgraphic\b/gi, "gráfico"],
      [/\bgraphics\b/gi, "gráficos"],
      [/\bexperience\b/gi, "experiência"],
      [/\buniverse\b/gi, "universo"],
      [/\bgalaxy\b/gi, "galáxia"],
      [/\bcity\b/gi, "cidade"],
      [/\bcities\b/gi, "cidades"],
      [/\bkingdom\b/gi, "reino"],
      [/\bshadow\b/gi, "sombra"],
      [/\bshadows\b/gi, "sombras"],
      [/\bdarkness\b/gi, "escuridão"],
      [/\bcreature\b/gi, "criatura"],
      [/\bcreatures\b/gi, "criaturas"],
      [/\bmonster\b/gi, "monstro"],
      [/\bmonsters\b/gi, "monstros"],
      [/\bhuman\b/gi, "humano"],
      [/\bhumans\b/gi, "humanos"],
      [/\balien\b/gi, "alienígena"],
      [/\baliens\b/gi, "alienígenas"],
      [/\brobot\b/gi, "robô"],
      [/\brobots\b/gi, "robôs"],
      [/\bthreat\b/gi, "ameaça"],
      [/\bthreats\b/gi, "ameaças"],
      [/\bforce\b/gi, "força"],
      [/\bforces\b/gi, "forças"],
      [/\bpeace\b/gi, "paz"],
      [/\bwar\b/gi, "guerra"],
      [/\bwars\b/gi, "guerras"],
      [/\bempire\b/gi, "império"],
      [/\bsecret\b/gi, "segredo"],
      [/\bsecrets\b/gi, "segredos"],
      [/\bmystery\b/gi, "mistério"],
      [/\bmysteries\b/gi, "mistérios"],
      [/\bpower\b/gi, "poder"],
      [/\bpowers\b/gi, "poderes"],
      [/\bmagical\b/gi, "mágico(a)"],
      [/\bmagic\b/gi, "magia"],
      [/\bspell\b/gi, "feitiço"],
      [/\bspells\b/gi, "feitiços"],
      [/\bdungeon\b/gi, "masmorra (dungeon)"],
      [/\bdungeons\b/gi, "masmorras (dungeons)"],
      [/\brow\b/gi, "linha"],
      [/\bmode\b/gi, "modo"],
      [/\bmodes\b/gi, "modos"],

      // Common verbs
      [/\bexplore\b/gi, "explorar"],
      [/\bexplores\b/gi, "explora"],
      [/\bexploring\b/gi, "explorando"],
      [/\bdefeat\b/gi, "derrotar"],
      [/\bdefeating\b/gi, "derrotando"],
      [/\bdefeats\b/gi, "derrota"],
      [/\bfight\b/gi, "lutar"],
      [/\bfighting\b/gi, "lutando"],
      [/\bfights\b/gi, "luta"],
      [/\bcontrol\b/gi, "controlar"],
      [/\bcontrols\b/gi, "controla"],
      [/\bcontrolling\b/gi, "controlando"],
      [/\bsurvive\b/gi, "sobreviver"],
      [/\bsurvives\b/gi, "sobrevive"],
      [/\bsurviving\b/gi, "sobrevivendo"],
      [/\bdiscover\b/gi, "descobrir"],
      [/\bdiscovers\b/gi, "descobre"],
      [/\bdiscovering\b/gi, "descobrindo"],
      [/\bprotect\b/gi, "proteger"],
      [/\bprotects\b/gi, "protege"],
      [/\bprotecting\b/gi, "protegendo"],
      [/\bsave\b/gi, "salvar"],
      [/\bsaves\b/gi, "salva"],
      [/\bsaving\b/gi, "salvando"],
      [/\bfind\b/gi, "encontrar"],
      [/\bfinds\b/gi, "encontra"],
      [/\bfinding\b/gi, "encontrando"],
      [/\bcollect\b/gi, "coletar"],
      [/\bcollects\b/gi, "coleta"],
      [/\bcollecting\b/gi, "coletando"],
      [/\bbuild\b/gi, "construir"],
      [/\bbuilds\b/gi, "constrói"],
      [/\bbuilding\b/gi, "construindo"],
      [/\bcreate\b/gi, "criar"],
      [/\bcreates\b/gi, "cria"],
      [/\bcreating\b/gi, "criando"],
      [/\bdestroy\b/gi, "destruir"],
      [/\bdestroys\b/gi, "destrói"],
      [/\bdestroying\b/gi, "destruindo"],
      [/\bchoose\b/gi, "escolher"],
      [/\bchooses\b/gi, "escolhe"],
      [/\bchoosing\b/gi, "escolhendo"],
      [/\blearn\b/gi, "aprender"],
      [/\blearns\b/gi, "aprende"],
      [/\blearning\b/gi, "aprendendo"],
      [/\bimprove\b/gi, "melhorar"],
      [/\bupgrade\b/gi, "aprimorar"],
      [/\bupgrades\b/gi, "aprimoramentos"],
      [/\bcustomize\b/gi, "personalizar"],
      [/\bcustomization\b/gi, "personalização"],
      [/\binteract\b/gi, "interagir"],
      [/\binteracts\b/gi, "interage"],
      [/\binteracting\b/gi, "interagindo"],
      [/\bexperience\b/gi, "vivenciar / experimentar"],
      [/\bexperience\b/gi, "vivencia / experimenta"],
      [/\bjourney through\b/gi, "viajar por"],
      [/\btravel\b/gi, "viajar"],

      // Common adjectives
      [/\ban ancient\b/gi, "um antigo"],
      [/\bancient\b/gi, "antigo(a)"],
      [/\bmysterious\b/gi, "misterioso(a)"],
      [/\bpowerful\b/gi, "poderoso(a)"],
      [/\bepic\b/gi, "épico(a)"],
      [/\bbeautiful\b/gi, "belo(a)"],
      [/\bdark\b/gi, "sombrio / escuro"],
      [/\bdeadly\b/gi, "mortal"],
      [/\bnew\b/gi, "novo(a)"],
      [/\bunique\b/gi, "único(a)"],
      [/\bdifferent\b/gi, "diferente"],
      [/\bvarious\b/gi, "vários(as)"],
      [/\bhuge\b/gi, "enorme"],
      [/\bvast\b/gi, "vasto(a)"],
      [/\bstrange\b/gi, "estranho(a)"],
      [/\bclassic\b/gi, "clássico(a)"],
      [/\boriginal\b/gi, "original"],
      [/\bcomplete\b/gi, "completo(a)"],
      [/\bfinal\b/gi, "final"],
      [/\bgreat\b/gi, "grande"],
      [/\bstrong\b/gi, "forte"],
      [/\bevil\b/gi, "maligno(a)"],
      [/\bheroic\b/gi, "heróico(a)"],
      [/\bmain\b/gi, "principal"],
      [/\bdirect\b/gi, "direto(a)"],
      [/\bfree\b/gi, "grátis / livre"],
      [/\bhidden\b/gi, "escondido(a) / oculto(a)"],
      [/\blost\b/gi, "perdido(a)"],
      [/\bwild\b/gi, "selvagem"],
      [/\bfantasy\b/gi, "fantasia"],
      [/\bsci-fi\b/gi, "ficção científica"],
      [/\bscience fiction\b/gi, "ficção científica"],
      [/\bpost-apocalyptic\b/gi, "pós-apocalíptico"],

      // Connectives
      [/\bthroughout the\b/gi, "ao longo de toda a / do"],
      [/\bthroughout\b/gi, "ao longo de / por todo"],
      [/\bby using\b/gi, "usando"],
      [/\bwith each\b/gi, "com cada"],
      [/\bbefore\b/gi, "antes de"],
      [/\bafter\b/gi, "depois de"],
      [/\bduring\b/gi, "durante"],
      [/\bfrom the\b/gi, "de / do / da"],
      [/\binto the\b/gi, "em direção a / para dentro de"],
      [/\bonto the\b/gi, "sobre o / para o"],
      [/\bunder the\b/gi, "sob o / debaixo do"],
      [/\babove the\b/gi, "acima de"],
      [/\bbetween\b/gi, "entre"],
      [/\bthrough\b/gi, "através de"],
      [/\bwithout\b/gi, "sem"],
      [/\bwithin\b/gi, "dentro de"],
      [/\babout\b/gi, "sobre / a respeito de"],
      [/\bfor example\b/gi, "por exemplo"],

      [/\bis set in\b/gi, "se passa em"],
      [/\bwas released\b/gi, "foi lançado"],
      [/\bcan choose\b/gi, "pode escolher"],
      [/\bcan explore\b/gi, "pode explorar"],
      [/\bcan battle\b/gi, "pode lutar contra"],
      [/\bfirst time\b/gi, "primeira vez"],
      [/\band more\b/gi, "e muito mais"]
    ];

    for (const [regex, replacement] of dictionaryPt) {
      result = result.replace(regex, replacement);
    }
    return result;
  }

  if (isEs) {
    let result = synopsis;
    const dictionaryEs: [RegExp, string][] = [
      [/\bis an action-adventure game\b/gi, "es un juego de acción y aventura"],
      [/\bis an action-adventure\b/gi, "es un juego de ação y aventura"],
      [/\baction-adventure game\b/gi, "juego de acción y aventura"],
      [/\bis an action game\b/gi, "es un juego de acción"],
      [/\bis an adventure game\b/gi, "es un juego de aventura"],
      [/\bthe player controls\b/gi, "el jugador controla"],
      [/\bthe player can\b/gi, "el jugador puede"],
      [/\bplayers can\b/gi, "los jugadores pueden"],
      [/\bopen world\b/gi, "mundo abierto"],
      [/\bopen-world\b/gi, "mundo abierto"],
      [/\bstory\b/gi, "historia"],
      [/\bstoryline\b/gi, "argumento / historia"],
      [/\bgameplay\b/gi, "jugabilidad"],
      [/\bgame\b/gi, "juego"],
      [/\bgames\b/gi, "juegos"],
      [/\bcharacter\b/gi, "personaje"],
      [/\bcharacters\b/gi, "personajes"],
      [/\bplayer\b/gi, "jugador"],
      [/\bplayers\b/gi, "jugadores"],
      [/\bworld\b/gi, "mundo"],
      [/\bworlds\b/gi, "mundos"],
      [/\benemy\b/gi, "enemigo"],
      [/\benemies\b/gi, "enemigos"],
      [/\bweapons\b/gi, "armas"],
      [/\bweapon\b/gi, "arma"],
      [/\bcombat\b/gi, "combate"],
      [/\bbattle\b/gi, "batalla"],
      [/\bbattles\b/gi, "batallas"],
      [/\bfight\b/gi, "lucha"],
      [/\bjourney\b/gi, "viaje / trayectoria"],
      [/\bexplore\b/gi, "explorar"],
      [/\bexplores\b/gi, "explora"],
      [/\bexploring\b/gi, "explorando"],
      [/\bdefeat\b/gi, "derrotar"],
      [/\bdefeating\b/gi, "derrotando"],
      [/\bdefeats\b/gi, "derrota"],
      [/\bdeveloped by\b/gi, "desarrollado por"],
      [/\bpublished by\b/gi, "publicado por"],
      [/\breleased in\b/gi, "lanzado en"]
    ];

    for (const [regex, replacement] of dictionaryEs) {
      result = result.replace(regex, replacement);
    }
    return result;
  }

  return synopsis;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Permissive CORS middleware for API routes and local/development routing
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // API Routes
  app.get("/api/sync-game", async (req, res) => {
    try {
      const { title, lang } = req.query;
      if (!title || typeof title !== "string") {
        return res.status(400).json({ success: false, error: "O título do jogo é obrigatório." });
      }

      const targetLang = typeof lang === "string" ? lang.trim() : "Português (Brasil)";

      const cleanAndValidate = (envVal: string | undefined, defaultVal: string) => {
        if (!envVal) return defaultVal;
        let val = envVal.trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1).trim();
        }
        // If it's the old invalid secret, force override with the new correct secret
        if (val === "8p3ya0mus0z9w8bzhzj0zbxl8kvhx7") {
          return defaultVal;
        }
        return val || defaultVal;
      };

      const IGDB_CLIENT_ID = cleanAndValidate(process.env.IGDB_CLIENT_ID, "v4qnz63h9qcfsn75b4auh11pdmfckx");
      const IGDB_CLIENT_SECRET = cleanAndValidate(process.env.IGDB_CLIENT_SECRET, "nq3bsv5w913pnz4nbq1688n9q4eq3t");

      console.log(`[IGDB Sync] Using client_id: "${IGDB_CLIENT_ID}" (len: ${IGDB_CLIENT_ID.length}), secret: "${IGDB_CLIENT_SECRET.slice(0,3)}...${IGDB_CLIENT_SECRET.slice(-3)}" (len: ${IGDB_CLIENT_SECRET.length})`);

      // 1. Authenticate with Twitch OAuth2 using clean POST body params
      const params = new URLSearchParams();
      params.append("client_id", IGDB_CLIENT_ID);
      params.append("client_secret", IGDB_CLIENT_SECRET);
      params.append("grant_type", "client_credentials");

      const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        const errorDetails = await tokenResponse.text();
        throw new Error(`Falha na autenticação com Twitch para o IGDB: ${errorDetails}`);
      }
      const tokenData = await tokenResponse.json() as { access_token: string };
      const accessToken = tokenData.access_token;

      // 2. Query IGDB games endpoint
      // Using search parameters with Apicalypse syntax, requesting summary and storyline for completeness.
      const searchQuery = `search "${title.replace(/"/g, '\\"')}"; fields name, summary, storyline, cover.url, first_release_date, genres.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher; limit 1;`;
      
      const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
        method: "POST",
        headers: {
          "Client-ID": IGDB_CLIENT_ID,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
          "Accept": "application/json"
        },
        body: searchQuery
      });

      if (!igdbResponse.ok) {
        const errorText = await igdbResponse.text();
        throw new Error(`Erro retornado pelo IGDB: ${errorText}`);
      }

      const results = await igdbResponse.json() as any[];
      if (!results || results.length === 0) {
        throw new Error("Nenhum jogo correspondente encontrado no IGDB da Amazon.");
      }

      const game = results[0];

      // Compile Developer & Publisher from involved_companies
      let developer = "";
      let publisher = "";
      if (Array.isArray(game.involved_companies)) {
        const devCompany = game.involved_companies.find((c: any) => c.developer === true);
        if (devCompany && devCompany.company) {
          developer = devCompany.company.name;
        }
        const pubCompany = game.involved_companies.find((c: any) => c.publisher === true);
        if (pubCompany && pubCompany.company) {
          publisher = pubCompany.company.name;
        }
      }

      // Convert IGDB cover to HD t_1080p URL
      let coverUrl = "";
      if (game.cover && game.cover.url) {
        coverUrl = game.cover.url;
        if (coverUrl.startsWith("//")) {
          coverUrl = "https:" + coverUrl;
        }
        coverUrl = coverUrl.replace("t_thumb", "t_1080p");
      }

      // Format unix release date to year string
      let releaseDate = "";
      if (game.first_release_date) {
        releaseDate = new Date(game.first_release_date * 1000).getFullYear().toString();
      }

      // Compile list of genres
      const genres = Array.isArray(game.genres) ? game.genres.map((g: any) => g.name) : [];

      // Combine summary and storyline into a complete, rich synopsis
      let fullSynopsis = game.summary || "";
      if (game.storyline) {
        fullSynopsis = `${fullSynopsis}\n\nHistória / Lore:\n${game.storyline}`;
      }

      // Let's translate using Gemini if key is present or fall back gracefully
      let translatedSynopsis = fullSynopsis;
      let translatedGenres = genres;

      const needsTranslation = targetLang.toLowerCase().includes("portu") || 
                               targetLang.toLowerCase().includes("espa") || 
                               targetLang.toLowerCase().includes("rus") || 
                               targetLang.toLowerCase().includes("chin") || 
                               targetLang.toLowerCase().includes("zh") || 
                               targetLang.toLowerCase().includes("ru");

      if (needsTranslation) {
        let hasGeminiKey = false;
        try {
          hasGeminiKey = !!process.env.GEMINI_API_KEY;
        } catch {
          hasGeminiKey = false;
        }

        if (hasGeminiKey && fullSynopsis.trim().length > 0) {
          try {
            const ai = getGeminiClient();
            const prompt = `You are a video game localized translator. Translate the following game overview completely and faithfully into "${targetLang}".
Make sure the translated summary/synopsis is exhaustive, expressive, grammatically correct and NOT condensed or summarized. Keep any styling and paragraphs.
Translate the genre tag strings into gamer terms of "${targetLang}".

Original Summary to translate:
"${fullSynopsis}"

Original Genre tags:
${JSON.stringify(genres)}

Provide the response STRICTLY as a raw JSON object complying with this exact schema:
{
  "synopsis": "The full complete detailed translation in ${targetLang}",
  "genres": ["Translated Genre 1", "Translated Genre 2"]
}`;

            const aiResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    synopsis: { type: Type.STRING },
                    genres: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["synopsis", "genres"]
                }
              }
            });

            if (aiResponse && aiResponse.text) {
              const parsed = JSON.parse(aiResponse.text.trim());
              if (parsed.synopsis && parsed.synopsis.trim().length > 0) {
                translatedSynopsis = parsed.synopsis;
              }
              if (Array.isArray(parsed.genres) && parsed.genres.length > 0) {
                translatedGenres = parsed.genres;
              }
              console.log(`[IGDB Sync] Successfully translated synopsis & genres to "${targetLang}" with Gemini 2.5-flash.`);
            }
          } catch (geminiError: any) {
            console.warn("[IGDB Sync] Gemini automatic translation failed, falling back to local dictionaries.", geminiError?.message || geminiError);
            translatedGenres = genres.map(g => translateGenreFallback(g, targetLang));
            translatedSynopsis = translateSynopsisFallback(fullSynopsis, targetLang);
          }
        } else {
          // No API key or empty summary, use robust offline translation fallback for genres and synopsis
          translatedGenres = genres.map(g => translateGenreFallback(g, targetLang));
          translatedSynopsis = translateSynopsisFallback(fullSynopsis, targetLang);
        }
      }

      res.json({
        success: true,
        developer: developer || "",
        publisher: publisher || "",
        releaseDate: releaseDate || "",
        genres: translatedGenres,
        synopsis: translatedSynopsis || "",
        coverUrl: coverUrl || ""
      });
    } catch (error: any) {
      console.error("Error in /api/sync-game:", error);
      res.status(500).json({ 
        success: false, 
        error: error?.message || "Erro ao sicronizar as informações do jogo." 
      });
    }
  });

  app.post("/api/report-bug", (req, res) => {
    const { description, timestamp } = req.body;
    
    console.log("------------------------------------------");
    console.log("BUG REPORT RECEIVED");
    console.log(`To: davison.sant@outlook.com`);
    console.log(`Time: ${timestamp}`);
    console.log(`Description: ${description}`);
    console.log("------------------------------------------");

    // In a production app, you would use a service like Nodemailer, SendGrid, or Mailgun here.
    // Example logic (if configured):
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ from: 'system@gaminghub.app', to: 'davison.sant@outlook.com', ... });

    res.json({ success: true, message: "Report logged successfully" });
  });

  // Background Updater states
  let updateProgress = 0;
  let updateState = "idle"; // "idle" | "downloading" | "installing" | "error"
  let updateErrorMsg = "";

  app.post("/api/updater/start", (req, res) => {
    const { url, filename } = req.body;
    if (!url || !filename) {
      return res.status(400).json({ success: false, error: "A URL e o nome do arquivo são obrigatórios." });
    }

    // Reset status
    updateProgress = 0;
    updateState = "downloading";
    updateErrorMsg = "";

    console.log(`[Updater] Starting background download: ${filename} from ${url}`);

    // Run background download process so we can respond to the server immediately
    const destPath = path.join(os.tmpdir(), filename);
    const file = fs.createWriteStream(destPath);
    
    function getRequest(requestUrl: string) {
      https.get(requestUrl, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          getRequest(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          updateState = "error";
          updateErrorMsg = `Erro HTTP ${response.statusCode}: ${response.statusMessage}`;
          file.close();
          fs.unlink(destPath, () => {});
          return;
        }
        
        const totalBytes = parseInt(response.headers['content-length'] || "0", 10);
        let loadedBytes = 0;
        
        response.on('data', (chunk) => {
          loadedBytes += chunk.length;
          if (totalBytes > 0) {
            updateProgress = Math.round((loadedBytes / totalBytes) * 100);
          }
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          updateState = "installing";
          updateProgress = 100;
          
          console.log(`[Updater] Download finished! Executing downloaded updater: ${destPath}`);
          // Execute installer after a tiny pause to ensure write locks are off
          setTimeout(() => {
            try {
              if (process.platform === 'win32') {
                const proc = spawn(destPath, [], { detached: true, stdio: 'ignore' });
                proc.unref();
              } else if (process.platform === 'darwin') {
                spawn('open', [destPath], { detached: true, stdio: 'ignore' }).unref();
              } else {
                exec(`chmod +x "${destPath}"`, () => {
                  spawn(destPath, [], { detached: true, stdio: 'ignore' }).unref();
                });
              }
            } catch (err: any) {
              console.error("[Updater] Failed to execute setup file:", err);
              updateState = "error";
              updateErrorMsg = err?.message || "Falha ao executar o executável de instalação.";
              return;
            }
            
            // Auto close application after launching update
            setTimeout(() => {
              console.log("[Updater] Closing application... Update is being run!");
              process.exit(0);
            }, 1500);
          }, 1000);
        });
      }).on('error', (err) => {
        console.error("[Updater] HTTPS network error:", err);
        updateState = "error";
        updateErrorMsg = err.message;
        file.close();
        fs.unlink(destPath, () => {});
      });
    }

    try {
      getRequest(url);
      res.json({ success: true, message: "Download iniciado em segundo plano." });
    } catch (e: any) {
      updateState = "error";
      updateErrorMsg = e?.message || "Falha ao iniciar o request de download.";
      res.status(500).json({ success: false, error: updateErrorMsg });
    }
  });

  app.get("/api/updater/progress", (req, res) => {
    res.json({
      progress: updateProgress,
      state: updateState,
      error: updateErrorMsg
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const isLocalWindows = process.platform === "win32" || !!process.versions.electron || process.env.IS_ELECTRON === "true";
  const host = isLocalWindows ? "127.0.0.1" : "0.0.0.0";

  app.listen(PORT, host, () => {
    console.log(`Server running on http://${host}:${PORT}`);
  });
}

startServer();
