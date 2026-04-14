import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.post("/api/analyze-repo", async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub URL" });
      }
      const [_, owner, repoName] = match;
      const cleanRepoName = repoName.replace(/\.git$/, "");

      // Fetch file tree from GitHub API
      // We'll use the recursive tree API to get a good overview
      const treeUrl = `https://api.github.com/repos/${owner}/${cleanRepoName}/git/trees/main?recursive=1`;
      let response;
      try {
        response = await axios.get(treeUrl);
      } catch (e) {
        // Try master if main fails
        const masterUrl = `https://api.github.com/repos/${owner}/${cleanRepoName}/git/trees/master?recursive=1`;
        response = await axios.get(masterUrl);
      }

      const tree = response.data.tree;
      
      // Filter for interesting files (config, main entry points, etc.)
      const importantFiles = tree.filter((file: any) => {
        const path = file.path.toLowerCase();
        return (
          path.includes("package.json") ||
          path.includes("requirements.txt") ||
          path.includes("dockerfile") ||
          path.includes("docker-compose") ||
          path.includes("main.py") ||
          path.includes("app.py") ||
          path.includes("index.ts") ||
          path.includes("server.ts") ||
          path.includes("config") ||
          path.endsWith(".yaml") ||
          path.endsWith(".yml") ||
          path.includes("src/")
        );
      }).slice(0, 100); // Limit to avoid hitting token limits too hard

      // Get content of top-level config files for better context
      const configFiles = tree.filter((file: any) => 
        file.path === "package.json" || 
        file.path === "requirements.txt" || 
        file.path === "docker-compose.yml" ||
        file.path === "docker-compose.yaml"
      );

      const fileContents: Record<string, string> = {};
      for (const file of configFiles) {
        try {
          const contentRes = await axios.get(file.url);
          const content = Buffer.from(contentRes.data.content, 'base64').toString('utf-8');
          fileContents[file.path] = content;
        } catch (err) {
          console.error(`Failed to fetch ${file.path}`);
        }
      }

      res.json({
        owner,
        repo: cleanRepoName,
        tree: tree.map((f: any) => f.path),
        importantFiles: importantFiles.map((f: any) => f.path),
        fileContents
      });
    } catch (error: any) {
      console.error("Error analyzing repo:", error.message);
      res.status(500).json({ error: "Failed to analyze repository. Make sure it is public." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
