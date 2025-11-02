import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFolderSchema, 
  insertStorySchema, 
  insertUserAttemptSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/folders - Get all folders
  app.get("/api/folders", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      let folders;
      
      if (search) {
        folders = await storage.searchFolders(search);
      } else {
        folders = await storage.getFolders();
      }
      
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  // GET /api/folders/:id - Get folder by ID
  app.get("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      const folder = await storage.getFolderById(id);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folder" });
    }
  });

  // POST /api/folders - Create a new folder
  app.post("/api/folders", async (req, res) => {
    try {
      const validatedData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder(validatedData);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  // PUT /api/folders/:id - Update a folder
  app.put("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      const validatedData = insertFolderSchema.parse(req.body);
      const folder = await storage.updateFolder(id, validatedData);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update folder" });
    }
  });

  // DELETE /api/folders/:id - Delete a folder
  app.delete("/api/folders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      // Don't allow deleting the General folder
      if (id === 1) {
        return res.status(403).json({ message: "Cannot delete the General folder" });
      }

      // Delete all stories in the folder before deleting the folder itself
      const stories = await storage.getStories(id);
      if (stories.length > 0) {
        for (const story of stories) {
          await storage.deleteStory(story.id);
        }
      }

      const success = await storage.deleteFolder(id);
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // GET /api/stories - Get stories (optionally filtered by folder)
  app.get("/api/stories", async (req, res) => {
    try {
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;
      
      if (req.query.folder && isNaN(folderId!)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      const stories = await storage.getStories(folderId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  // GET /api/stories/:id - Get story by ID
  app.get("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      const story = await storage.getStoryById(id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // POST /api/folders/:folderId/stories - Create a new story in a folder
  app.post("/api/folders/:folderId/stories", async (req, res) => {
    try {
      console.log("[DEBUG] Incoming story data:", req.body);
      const folderId = parseInt(req.params.folderId);
      if (isNaN(folderId)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      // Check if folder exists
      const folder = await storage.getFolderById(folderId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      // Validate story data and add folder_id
      const storyData = { ...req.body, folder_id: folderId };
      const validatedData = insertStorySchema.parse(storyData);
      
      const story = await storage.createStory(validatedData);
  res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[ERROR] Failed to create story:", error);
      res.status(500).json({ message: "Failed to create story", error: errMsg });
    }
  });

  // PUT /api/stories/:id - Update a story
  app.put("/api/stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      // Make sure we don't change the folder_id if it's not provided
      const existingStory = await storage.getStoryById(id);
      if (!existingStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      const storyData = { ...req.body, folder_id: req.body.folder_id || existingStory.folder_id };
      const validatedData = insertStorySchema.parse(storyData);
      
      const story = await storage.updateStory(id, validatedData);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  // DELETE /api/stories/:id - Delete a story
  app.delete("/api/stories/:id", async (req, res) => {
    try {
      console.log(`[DEBUG] Attempting to delete story with id: ${req.params.id}`);
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid story ID" });
      }
      
      const success = await storage.deleteStory(id);
      if (!success) {
        console.error(`[ERROR] Story with id ${id} not found or could not be deleted.`);
        return res.status(404).json({ message: "Story not found" });
      }
      res.status(204).send();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Failed to delete story" });
  console.error(`[ERROR] Failed to delete story with id ${req.params.id}:`, error);
  res.status(500).json({ message: "Failed to delete story", error: errMsg });
    }
  });
  // POST /api/attempt - Record a user attempt
  app.post("/api/attempt", async (req, res) => {
    try {
      // Log the incoming user_id and payload
      console.log("Received attempt payload:", req.body);

      const validatedData = insertUserAttemptSchema.parse(req.body);
      const story = await storage.getStoryById(validatedData.story_id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      // Log the validated user_id
      console.log("Validated user_id for attempt:", validatedData.user_id);

      const attempt = await storage.recordAttempt(validatedData);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error recording attempt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attempt data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to record attempt",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/stats/user - Get user statistics
  app.get("/api/stats/user", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;

      // Log the userId being used for stats query
      console.log("Querying user stats for userId:", userId);

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (req.query.folder && isNaN(folderId!)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const stats = await storage.getUserStats(userId, folderId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // GET /api/stats/stories - Get story statistics
  app.get("/api/stats/stories", async (req, res) => {
    try {
      const folderId = req.query.folder ? parseInt(req.query.folder as string) : undefined;
      
      if (req.query.folder && isNaN(folderId!)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }
      
      const stats = await storage.getStoryStats(folderId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story statistics" });
    }
  });

  // POST /api/ollama/generate - Generate a hallucinated/fake version using Ollama Cloud
  app.post('/api/ollama/generate', async (req, res) => {
    try {
      const { true_version, model } = req.body || {};

      if (!true_version || typeof true_version !== 'string') {
        return res.status(400).json({ message: 'true_version is required in the request body' });
      }

      const apiKey = process.env.OLLAMA_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: 'Ollama API key not configured on server' });
      }

  // Build prompt to ask Ollama to generate a creative, reimagined story based on the true_version
  const prompt = `Take the following story and write a new, creative story based on it. Keep the overall structure the same, for example the main role or occupation stays the same. Change all the details, characters, events, and settings so it is entirely different, but the story should be roughly the same length. Do not use em dashes. Focus on imaginative storytelling while remaining plausible.\n\n${true_version}`;

      const payload = {
        model: model || process.env.OLLAMA_MODEL || 'gpt-oss:120b',
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: false
      };

      const response = await fetch('https://ollama.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        return res.status(response.status).json({ message: 'Ollama API error', body });
      }

      // Try to extract returned content in common shapes
      const content = body?.message?.content || body?.choices?.[0]?.message?.content || body?.choices?.[0]?.text || body?.output || null;

      if (!content) {
        return res.status(200).json({ hallucinated: String(body) });
      }

      return res.status(200).json({ hallucinated: content });
    } catch (err: any) {
      console.error('[ERROR] Ollama generate error:', err);
      return res.status(500).json({ message: 'Failed to call Ollama', error: err?.message || String(err) });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
