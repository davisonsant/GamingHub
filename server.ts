import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
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
