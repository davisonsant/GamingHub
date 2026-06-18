import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

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

async function startServer() {
  const app = express();
  const PORT = 3000;

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
          }
        } else {
          // No API key or empty summary, use robust offline translation fallback for genres
          translatedGenres = genres.map(g => translateGenreFallback(g, targetLang));
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
