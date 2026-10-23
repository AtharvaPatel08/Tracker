import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

// Process crash guards to prevent dev server process termination
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception intercepted:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection intercepted at:", promise, "reason:", reason);
});

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined.");
}

// API endpoint for chatbot / research grounding queries
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!ai) {
      return res.status(503).json({
        error: "AI service is currently not configured. Please supply a GEMINI_API_KEY secret."
      });
    }

    // Format the system instruction to align with SHAT Coach voice
    const systemInstruction = 
      "You are the SHAT Coach, an elegant, supportive, and compassionate fitness and wellness companion. " +
      "Provide gentle, helpful, and highly insightful responses to wellbeing, fitness, or cycle queries. " +
      "Include self-reflection prompts, positive breathing methods, and clear advice. " +
      "Use clean markdown with bullet points for readability.";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${systemInstruction}\n\nUser query: ${message}` }] }
      ],
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95
      }
    });

    const aiText = response.text || "I'm here to support you. Let me know how I can help you manage your wellness today.";
    return res.json({ response: aiText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Something went wrong processing your request.", details: error.message });
  }
});

// API endpoint for Fitness Chat (Gemini grounded with a specific fitness expert persona)
app.post("/api/fitness-chat", async (req, res) => {
  try {
    const { message, history, thinkingMode } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!ai) {
      return res.status(503).json({
        error: "AI service is currently not configured. Please supply a GEMINI_API_KEY secret."
      });
    }

    const systemPrompt = 
      "You are SHAT AI — the intelligent core of the SHAT platform (Science, Honesty, " +
      "Adaptation, Transformation). You are a world-class fitness and nutrition expert. " +
      "Give precise, science-backed, actionable answers on workouts, nutrition, fat loss, " +
      "muscle building, recovery, and supplements. Be concise and direct. Never be vague. " +
      "Understand Indian dietary habits, vegetarian protein sources, and the " +
      "Indian fitness lifestyle. Always end your response with one specific action " +
      "the user can take today.";

    // Convert history format to Google GenAI structure (max last 6 messages)
    const contents = [];
    if (history && Array.isArray(history)) {
      const last6 = history.slice(-6);
      for (const msg of last6) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    let modelToUse = "gemini-3.8-flash";
    let configObj: any = {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    };

    if (thinkingMode) {
      configObj.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH
      };
      // Note: do NOT set maxOutputTokens to allow full reasoning range
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: contents,
      config: configObj
    });

    const aiText = response.text || "As your fitness assistant, I'm here to give you precise, science-backed answers. Please ask any fitness-related question.";
    return res.json({ response: aiText });
  } catch (error: any) {
    console.error("Fitness Chat API Error:", error);
    return res.status(500).json({ error: "Something went wrong processing your request.", details: error.message });
  }
});

// Real-time Diet Analysis
app.post("/api/analyze-diet", async (req, res) => {
  try {
    const { dietDesc, dietPreference } = req.body;
    if (!dietDesc) {
      return res.status(400).json({ error: "Diet description is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const prompt = `You are the nutritional core of the SHAT Coach system.
Analyze the user's typical daily food intake: '${dietDesc}' under their chosen dietary preference: '${dietPreference}'.
Provide a highly realistic, hard-hitting, scientific, and direct nutritional critique. Tell them exactly where they are failing (e.g., too many simple carbs, low bioavailability of proteins, bad macro timings) and how to fix it with specific Indian staples (like paneer, egg whites, soya chunks, dal, double toned milk, chicken breast, etc.). Keep the tone direct, motivating, and professional, avoiding corporate fluff. Limit your response to 2-3 concise, hard-hitting sentences (about 50 words) in plain text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    return res.json({ feedback: response.text?.trim() });
  } catch (error: any) {
    console.error("Analyze Diet Error:", error);
    return res.status(500).json({ error: "Diet analysis failed." });
  }
});

// Workout Split Critique
app.post("/api/critique-split", async (req, res) => {
  try {
    const { splitDesc, fitnessStatus } = req.body;
    if (!splitDesc) {
      return res.status(400).json({ error: "Split description is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const prompt = `You are the kinetic performance analyzer of the SHAT Coach system.
Critique the user's workout split: '${splitDesc}' (Training Location: ${fitnessStatus}).
Provide a direct, high-octane physical analysis. Give specific critiques (e.g., recovery gaps, volume issues, structural imbalances, lack of progressive overload focus) and suggest 1 key actionable modification in direct Indian gym terms (e.g., compound priority, rest intervals, muscle group pairing). Keep it intense, motivating, and to the point. Limit to 2-3 concise, high-impact sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    return res.json({ critique: response.text?.trim() });
  } catch (error: any) {
    console.error("Critique Split Error:", error);
    return res.status(500).json({ error: "Workout split critique failed." });
  }
});

// Personalized Tough-Love Roast
app.post("/api/generate-roast", async (req, res) => {
  try {
    const { name, age, weight, height, bmi, bmiCategory, currentGoal } = req.body;
    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const prompt = `You are the SHAT Coach, an elite, honest, and uncompromising fitness mentor.
The user's metrics are: Name: ${name}, Age: ${age}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi} (${bmiCategory}), Goal: ${currentGoal}.
Deliver an intense, highly personalized, motivating tough-love roast of their current status and goal. If they are trying to Bulk/Maintain while overweight/obese, point out the biological folly (e.g. insulin resistance, packing fat on fat) in a tough but constructive way. If they are cut/thin and trying to Cut further, tell them to stop starving and start building density. Keep it incredibly direct, high-performance, and deeply motivational. Limit to 2-3 punchy, epic, or hard-hitting sentences. Do not use generic placeholders.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.8
      }
    });

    return res.json({ roast: response.text?.trim() });
  } catch (error: any) {
    console.error("Generate Roast Error:", error);
    return res.status(500).json({ error: "Roast generation failed." });
  }
});

// Supplement Search using Google Search Grounding
app.post("/api/search-supplements", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const prompt = `Search for real online prices, availability, and retail links in India for the supplement or health query: '${query}'.
Find real Indian product options from major platforms like Amazon India, Flipkart, MuscleBlaze, HealthKart, etc.
You MUST respond with a valid JSON array of up to 3 objects. Each object represents a product option and MUST strictly contain these keys:
- id: a unique string ID
- name: name of the product
- platform: e.g. 'Amazon India', 'Flipkart', or the brand store
- price: e.g. '₹2,499' or '₹999' (the actual real price found)
- delivery: e.g. 'Delivers in 2-3 days' or 'Same-day delivery'
- link: the search/product link (e.g. 'https://www.amazon.in' or 'https://www.flipkart.com' or another real direct link)

Return ONLY the JSON array. Do not include markdown code blocks around the JSON array, just return the raw JSON text starting with [ and ending with ].`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2
      }
    });

    let text = response.text || "[]";
    // Strip markdown formatting if the model still returns it
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsedResults = JSON.parse(text);
      if (Array.isArray(parsedResults)) {
        return res.json({ results: parsedResults });
      }
    } catch (e) {
      console.warn("Failed to parse Gemini search JSON, attempting regex extract", e);
      // Try to find the first [ and last ]
      const startIdx = text.indexOf("[");
      const endIdx = text.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          const slicedJson = JSON.parse(text.slice(startIdx, endIdx + 1));
          if (Array.isArray(slicedJson)) {
            return res.json({ results: slicedJson });
          }
        } catch (innerErr) {
          console.error("Regex extract also failed", innerErr);
        }
      }
    }

    // Fallback if formatting is entirely lost or call fails
    return res.status(422).json({ error: "Failed to construct valid search JSON from grounding response." });
  } catch (error: any) {
    console.error("Search Supplements Error:", error);
    return res.status(500).json({ error: "Supplement search failed." });
  }
});

// AI Vision / Text-based Meal Macronutrients Scanner
app.post("/api/analyze-meal", async (req, res) => {
  try {
    const { mealDescription, base64Image, mimeType } = req.body;
    if (!mealDescription && !base64Image) {
      return res.status(400).json({ error: "Meal description or image is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const parts: any[] = [];
    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType: mimeType || "image/jpeg"
        }
      });
    }

    const prompt = `Analyze this meal: '${mealDescription || "the uploaded photo"}'. Estimate its nutritional density, calories, and macronutrients.
You MUST respond with a valid JSON object matching this schema. Do not include any other conversational text or markdown code blocks:
{
  "name": "descriptive name of the meal with matching emoji (e.g., '2 Egg Kathi Rolls + 1 Scoop Whey Protein 🍳')",
  "protein": estimated protein in grams as an integer,
  "calories": estimated calories as an integer,
  "carbs": estimated carbs in grams as an integer,
  "fats": estimated fats in grams as an integer
}

Return ONLY this JSON object. No markdown, no other text.`;

    parts.push({ text: prompt });

    // gemini-3.8-flash handles both multimodal image analysis and text estimation
    const modelToUse = "gemini-3.8-flash";

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: parts,
      config: {
        temperature: 0.2
      }
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsedMeal = JSON.parse(text);
      if (parsedMeal.name && typeof parsedMeal.protein === "number") {
        return res.json({ meal: parsedMeal });
      }
    } catch (e) {
      console.warn("Failed to parse Gemini meal analysis JSON, attempting regex extract", e);
      const startIdx = text.indexOf("{");
      const endIdx = text.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          const slicedJson = JSON.parse(text.slice(startIdx, endIdx + 1));
          if (slicedJson.name && typeof slicedJson.protein === "number") {
            return res.json({ meal: slicedJson });
          }
        } catch (innerErr) {
          console.error("Regex extract also failed", innerErr);
        }
      }
    }

    return res.status(422).json({ error: "Failed to construct valid meal analysis JSON." });
  } catch (error: any) {
    console.error("Analyze Meal Error:", error);
    return res.status(500).json({ error: "Meal analysis failed." });
  }
});

// Search Local Gyms, Stores, or Parks using Google Maps Grounding
app.post("/api/search-maps", async (req, res) => {
  try {
    const { query, location } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    if (!ai) {
      return res.status(503).json({ error: "AI service is not configured." });
    }

    const searchLocation = location || "India";
    const prompt = `Search for real physical gyms, fitness centers, supplement shops, or health stores matching the query: '${query}' around or in the location: '${searchLocation}'.
You MUST respond with a valid JSON array of up to 3 objects. Each object represents a physical location/store found and MUST strictly contain these keys:
- id: a unique string ID
- name: name of the place
- address: full real address of the place
- distance: estimated distance or region/neighborhood name
- rating: rating (e.g., '4.5 ⭐' or '4.8 ⭐')
- link: a real Google Maps search link for that place (e.g., 'https://www.google.com/maps/search/?api=1&query=' followed by URL-encoded name and address)

Return ONLY the JSON array. Do not include markdown code blocks around the JSON array, just return the raw JSON text starting with [ and ending with ].`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.2
      }
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsedResults = JSON.parse(text);
      if (Array.isArray(parsedResults)) {
        return res.json({ results: parsedResults });
      }
    } catch (e) {
      console.warn("Failed to parse Gemini maps JSON, attempting regex extract", e);
      const startIdx = text.indexOf("[");
      const endIdx = text.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        try {
          const slicedJson = JSON.parse(text.slice(startIdx, endIdx + 1));
          if (Array.isArray(slicedJson)) {
            return res.json({ results: slicedJson });
          }
        } catch (innerErr) {
          console.error("Regex extract also failed", innerErr);
        }
      }
    }

    return res.status(422).json({ error: "Failed to construct valid maps JSON from grounding response." });
  } catch (error: any) {
    console.error("Search Maps Error:", error);
    return res.status(500).json({ error: "Local maps search failed." });
  }
});

// Serve mental health articles / resource directory
app.get("/api/resources", (req, res) => {
  res.json([
    {
      id: "mindfulness-101",
      title: "Mindfulness and Daily Presence",
      category: "Education",
      readTime: "4 min",
      description: "Learn how taking just 5 minutes a day for conscious observation can reshape stress responses."
    },
    {
      id: "breathing-exercises",
      title: "The Science of Box Breathing",
      category: "Patient Resources",
      readTime: "3 min",
      description: "Explore the physiological effects of four-part box breathing on the autonomic nervous system."
    },
    {
      id: "cognitive-reframing",
      title: "Introduction to Cognitive Reframing",
      category: "Education",
      readTime: "6 min",
      description: "A practical worksheet guide to recognizing cognitive distortions and drafting more balanced thoughts."
    }
  ]);
});

// Setup Vite & static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with static assets serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express full-stack server running on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${PORT} is already in use, process will exit gracefully.`);
      process.exit(0);
    } else {
      console.error("Server listen error:", err);
    }
  });
}

setupVite().catch((err) => {
  console.error("Failed to boot Vite server", err);
});
