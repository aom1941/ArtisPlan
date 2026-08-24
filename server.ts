import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will fallback to smart creative defaults.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

/**
 * Safely strips markdown fences and parses JSON with robust fallback.
 */
function cleanAndParseJson<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    let text = rawText.trim();
    // Strip markdown code fences if present
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("Could not parse JSON from Gemini response, using fallback:", err);
    return fallback;
  }
}

async function startServer() {
  const app = express();
  // 3000 collides with the Gemini Ink OS Vite dev server (repo root of
  // Project-Companion----visual-computer) and with the Gitea connector URL in
  // that repo's project-companion-os/backend/connectors.json — pick the next
  // free slot after elster-ready-accounting (:5173) / picas-fingerprint-explorer
  // (:5174) in that same connectors.json, overridable via PORT.
  const PORT = Number(process.env.PORT) || 5175;

  app.use(express.json({ limit: "50mb" }));

  // API health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Mood Board Generator API
  app.post("/api/ai/moodboard", async (req, res) => {
    try {
      const { prompt, aesthetic, targetMedium, mood } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback response with curated artistic moodboard
        return res.json({
          title: prompt ? `${prompt} Vision` : "Atmospheric Concept",
          summary: `Curated ${aesthetic || 'cinematic'} mood board focusing on ${mood || 'evocative'} emotional tone and deep contrast.`,
          palette: [
            { hex: "#2E3840", name: "Deep Charcoal", role: "Primary Shadow" },
            { hex: "#4E6E81", name: "Atmospheric Slate", role: "Midtone Depth" },
            { hex: "#F9DBBB", name: "Warm Amber Glow", role: "Key Rim Light" },
            { hex: "#FF0303", name: "Crimson Accent", role: "Focal Pop" },
            { hex: "#F8F9FA", name: "Clean Specular", role: "Highlight" }
          ],
          keywords: ["High Dynamic Range", "Volumetric Fog", "Impasto Texture", "Dynamic Composition", "Warm Key Light"],
          compositionTips: [
            "Use the 70-20-10 color rule with Warm Amber for focal lighting.",
            "Establish depth with 3-plane atmospheric layering.",
            "Keep the silhouettes bold and readable from distance."
          ],
          lightingStyle: "Soft rim-lighting with moody ambient fill",
          textureFocus: "Chunky textured brushwork with soft blended gradients",
          suggestedReferences: [
            { query: "Cinematic atmospheric concept art", type: "Lighting" },
            { query: "Gouache texture brush strokes", type: "Texture" },
            { query: "Expressive color study", type: "Palette" }
          ]
        });
      }

      const client = getGeminiClient();
      const systemInstruction = `You are a master concept artist, art director, and visual designer. Generate a rich, structured visual mood board and palette specification for the artist based on their prompt. Respond strictly with JSON format matching the schema:
{
  "title": "Short evocative title",
  "summary": "2-sentence creative vision statement",
  "palette": [
    {"hex": "#HEXCODE", "name": "Color Name", "role": "Role description (e.g. Key Light, Focal Pop, Shadow)"}
  ],
  "keywords": ["5-6 aesthetic keywords"],
  "compositionTips": ["3 practical compositional advice items"],
  "lightingStyle": "Description of lighting style",
  "textureFocus": "Description of brushwork/texture direction",
  "suggestedReferences": [
    {"query": "Search phrase for finding visual refs", "type": "Lighting | Texture | Anatomy | Palette"}
  ]
}`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a visual moodboard and color script for:
Project Concept: "${String(prompt || 'Cyberpunk Samurai in Neon Rain').slice(0, 500)}"
Aesthetic Style: "${String(aesthetic || 'Concept Art / Painterly').slice(0, 200)}"
Target Medium: "${String(targetMedium || 'Digital Painting').slice(0, 100)}"
Desired Mood: "${String(mood || 'Dramatic & Atmospheric').slice(0, 200)}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const fallbackMoodboard = {
        title: prompt ? `${prompt} Vision` : "Atmospheric Concept",
        summary: `Curated ${aesthetic || 'cinematic'} mood board focusing on ${mood || 'evocative'} tone.`,
        palette: [
          { hex: "#2E3840", name: "Deep Charcoal", role: "Primary Shadow" },
          { hex: "#4E6E81", name: "Atmospheric Slate", role: "Midtone Depth" },
          { hex: "#F9DBBB", name: "Warm Amber Glow", role: "Key Rim Light" },
          { hex: "#FF0303", name: "Crimson Accent", role: "Focal Pop" },
          { hex: "#F8F9FA", name: "Clean Specular", role: "Highlight" }
        ],
        keywords: ["High Dynamic Range", "Volumetric Fog", "Impasto Texture", "Dynamic Composition"],
        compositionTips: ["Group dark values to create strong contrast.", "Use leading lines toward focal element."],
        lightingStyle: "Soft rim-lighting with moody ambient fill",
        textureFocus: "Chunky textured brushwork with soft gradients",
        suggestedReferences: [{ query: "Concept art lighting study", type: "Lighting" }]
      };

      const parsed = cleanAndParseJson(response.text, fallbackMoodboard);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error generating moodboard:", err);
      res.status(500).json({
        error: "Failed to generate moodboard",
        details: err.message,
        fallback: {
          title: "Creative Inspiration Palette",
          summary: "Ethereal aesthetic with balanced contrast and evocative tone.",
          palette: [
            { hex: "#1A1A2E", name: "Midnight Navy", role: "Deep Shadow" },
            { hex: "#16213E", name: "Cosmic Indigo", role: "Base Ambient" },
            { hex: "#0F3460", name: "Electric Cerulean", role: "Midtone" },
            { hex: "#E94560", name: "Neon Magenta", role: "Focal Accent" },
            { hex: "#E0E0E0", name: "Pale Fog", role: "Specular" }
          ],
          keywords: ["Chiaroscuro", "Atmospheric Perspective", "Sharp Silhouettes", "Color Contrast"],
          compositionTips: [
            "Group dark values to create strong contrast with focal lighting.",
            "Use leading lines directed toward the primary focal element.",
            "Keep saturated colors confined to 10% of canvas area."
          ],
          lightingStyle: "Strong contrast directional key light",
          textureFocus: "Textured edge control with smooth interior gradients",
          suggestedReferences: [
            { query: "Painterly lighting reference", type: "Lighting" },
            { query: "Digital ink texture", type: "Texture" }
          ]
        }
      });
    }
  });

  // AI Project Timeline & Milestone Generator API
  app.post("/api/ai/timeline", async (req, res) => {
    try {
      const { projectName, projectType, deadlineWeeks, scopeDescription } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        const weeks = Number(deadlineWeeks) || 4;
        const now = new Date();
        const addDays = (d: number) => {
          const resDate = new Date(now);
          resDate.setDate(resDate.getDate() + d);
          return resDate.toISOString().split("T")[0];
        };

        return res.json({
          projectOverview: `Structured ${weeks}-week art project workflow for ${projectName || 'New Artwork'}`,
          totalEstimatedHours: weeks * 12,
          milestones: [
            {
              id: "m-1",
              phase: "Phase 1: Research & Mood Board",
              title: "Reference Gathering & Visual Research",
              description: "Collect high-res lighting, costume, and anatomy references; generate moodboard palette.",
              startDate: addDays(0),
              endDate: addDays(Math.max(2, Math.floor(weeks * 1.5))),
              status: "completed",
              color: "#3B82F6",
              tasks: ["Gather 10+ high quality reference images", "Lock color moodboard and lighting direction", "Define canvas aspect ratio & resolution"]
            },
            {
              id: "m-2",
              phase: "Phase 2: Thumbnails & Composition",
              title: "Value Thumbnails & Silhouette Exploration",
              description: "Draw 6-8 loose compositional sketches focusing on rhythm and focal points.",
              startDate: addDays(Math.floor(weeks * 1.5)),
              endDate: addDays(Math.floor(weeks * 3.5)),
              status: "in-progress",
              color: "#8B5CF6",
              tasks: ["Generate 6 value thumbnail sketches", "Client / Self review & pick best 2", "Refine perspective grid & camera angle"]
            },
            {
              id: "m-3",
              phase: "Phase 3: Lineart & Color Script",
              title: "Clean Lineart & Color Blocking",
              description: "Finalize clean contours and establish flat local colors with initial light pass.",
              startDate: addDays(Math.floor(weeks * 3.5)),
              endDate: addDays(Math.floor(weeks * 5.5)),
              status: "pending",
              color: "#EC4899",
              tasks: ["Produce clean line work on dedicated layer", "Block in flat local base colors (color flats)", "Establish direct light vs ambient shadow masks"]
            },
            {
              id: "m-4",
              phase: "Phase 4: Rendering & Polish",
              title: "Volume Modeling, Materials & Details",
              description: "Render textures, skin tones, edge highlights, and specular reflections.",
              startDate: addDays(Math.floor(weeks * 5.5)),
              endDate: addDays(Math.floor(weeks * 6.5)),
              status: "pending",
              color: "#F59E0B",
              tasks: ["Render focal details (face, materials, metal luster)", "Add atmospheric particles & color grading", "Run value check in grayscale mode"]
            },
            {
              id: "m-5",
              phase: "Phase 5: Final Delivery & Export",
              title: "Final Export, Backup & Documentation",
              description: "Export high-resolution master files, create Google Drive backup, export project summary Doc.",
              startDate: addDays(Math.floor(weeks * 6.5)),
              endDate: addDays(weeks * 7),
              status: "pending",
              color: "#10B981",
              tasks: ["Export print-ready CMYK/RGB TIFF & Web PNG", "Sync master project to Google Drive backup", "Generate project report to Google Docs"]
            }
          ]
        });
      }

      const client = getGeminiClient();
      const systemInstruction = `You are a professional creative project manager and senior art director. Generate an actionable, realistic project milestone plan with phases, deadlines, and granular tasks tailored for artists. Return strictly JSON matching:
{
  "projectOverview": "Summary statement",
  "totalEstimatedHours": 40,
  "milestones": [
    {
      "id": "unique-id-1",
      "phase": "Phase Name (e.g. Phase 1: Research)",
      "title": "Milestone Title",
      "description": "Milestone description",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "pending | in-progress | completed",
      "color": "#HEXCODE",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    }
  ]
}`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create an art production timeline for:
Project Name: "${String(projectName || 'Keyframe Art Concept').slice(0, 300)}"
Type: "${String(projectType || 'Character & Environmental Concept Art').slice(0, 200)}"
Target Duration: "${Number(deadlineWeeks) || 4} weeks"
Scope / Details: "${String(scopeDescription || 'Full finished illustration with preliminary sketches and review checkpoints').slice(0, 500)}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const weeks = Number(deadlineWeeks) || 4;
      const now = new Date();
      const addDays = (d: number) => {
        const resDate = new Date(now);
        resDate.setDate(resDate.getDate() + d);
        return resDate.toISOString().split("T")[0];
      };

      const fallbackTimeline = {
        projectOverview: `Structured ${weeks}-week art workflow for ${projectName || 'Artwork'}`,
        totalEstimatedHours: weeks * 12,
        milestones: [
          {
            id: "m-1",
            phase: "Phase 1: Research & Mood Board",
            title: "Reference Gathering & Moodboard",
            description: "Collect high-res lighting and anatomy references.",
            startDate: addDays(0),
            endDate: addDays(Math.max(2, Math.floor(weeks * 1.5))),
            status: "in-progress",
            color: "#3B82F6",
            tasks: ["Gather references", "Lock palette", "Define canvas aspect ratio"]
          }
        ]
      };

      const parsed = cleanAndParseJson(response.text, fallbackTimeline);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error generating timeline:", err);
      res.status(500).json({ error: "Failed to generate timeline", details: err.message });
    }
  });

  // AI Art Critique & Annotation Advisor API
  app.post("/api/ai/critique", async (req, res) => {
    try {
      const { noteText, canvasSummary, question } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      const fallbackCritique = {
        feedback: "Focus on strengthening your focal contrast. Darken background values slightly to make the subject pop. Check the anatomy proportions on the primary gesture line.",
        compositionSuggestions: ["Rule of thirds balance", "Add subtle rim light on the upper edge", "Check value hierarchy in monochrome"],
        brushTechniqueTip: "Use textured dry brushes on the clothing to create fabric tactile depth."
      };

      if (!apiKey) {
        return res.json(fallbackCritique);
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an encouraging, expert art director giving constructive visual critique and suggestions.
Artist's Question/Annotation: "${String(question || noteText || 'How can I improve the composition and lighting?').slice(0, 400)}"
Context: "${String(canvasSummary || 'Digital sketch work in progress with moodboard and character studies').slice(0, 500)}"
Provide structured feedback with concise pointers.`,
        config: {
          systemInstruction: `Respond in JSON: {"feedback": "string", "compositionSuggestions": ["item1", "item2"], "brushTechniqueTip": "string"}`,
          responseMimeType: "application/json",
        }
      });

      const parsed = cleanAndParseJson(response.text, fallbackCritique);
      res.json(parsed);
    } catch (err: any) {
      console.error("Error in AI critique:", err);
      res.status(500).json({
        feedback: "Ensure your lighting source has a clear primary direction, and use complementary colors in the shadow transitions.",
        compositionSuggestions: ["Verify focal point clarity", "Check silhouette readability"],
        brushTechniqueTip: "Maintain variety in edge sharpness: sharp focal points, soft transitions."
      });
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ArtisPlan Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
});
