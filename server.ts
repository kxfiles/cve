import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PrismaClient } from "@prisma/client";
import { pollVulnerabilities } from "./src/lib/autonomous/cve-sentinel";
import { produceVideo } from "./src/services/producer";

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get all discovered CVEs
  app.get("/api/cve", async (req, res) => {
    const cves = await prisma.cve.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50
    });
    res.json(cves);
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    const projects = await prisma.project.findMany({
      include: { cve: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  });

  // Trigger autonomous polling
  app.post("/api/autonomous/poll", async (req, res) => {
    try {
      const count = await pollVulnerabilities();
      res.json({ message: "Polling complete", discovered: count });
    } catch (err) {
      res.status(500).json({ error: "Polling failed" });
    }
  });

  // Trigger production for a CVE
  app.post("/api/autonomous/produce", async (req, res) => {
    const { cveId } = req.body;
    if (!cveId) return res.status(400).json({ error: "cveId is required" });
    
    try {
      const projectId = await produceVideo(cveId);
      res.json({ message: "Production started", projectId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Production failed" });
    }
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
    console.log(`[CVE Studio] Server running on http://localhost:${PORT}`);
  });
}

startServer();
