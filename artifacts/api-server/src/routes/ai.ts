import { Router, type IRouter } from "express";
import { AiClassifyComplaintResponse, AiTranslateResponse } from "@workspace/api-zod";
import { aiLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

const KEYWORD_CATEGORIES: Array<{ name: string; keywords: string[] }> = [
  { name: "Bribery", keywords: ["bribe", "bribery", "money", "payment", "paid", "demand", "extort", "கையூட்டல்", "லஞ்சம்"] },
  { name: "Land Grabbing", keywords: ["land", "property", "encroach", "grab", "patta", "நிலம்", "சொத்து"] },
  { name: "Service Delay", keywords: ["delay", "pending", "slow", "wait", "certificate", "license", "தாமதம்"] },
  { name: "Fake Documents", keywords: ["fake", "forged", "fraud", "document", "false", "போலி", "ஆவணம்"] },
  { name: "Misconduct", keywords: ["misconduct", "abuse", "harassment", "misbehave", "threat", "துன்புறுத்தல்"] },
  { name: "Public Works", keywords: ["road", "bridge", "construction", "contract", "tender", "சாலை", "கட்டுமானம்"] },
  { name: "Education", keywords: ["school", "college", "admission", "teacher", "student", "பள்ளி", "கல்வி"] },
  { name: "Healthcare", keywords: ["hospital", "doctor", "medicine", "health", "medical", "மருத்துவமனை", "மருத்துவர்"] },
  { name: "Ration/PDS", keywords: ["ration", "pds", "rice", "grain", "food", "ration card", "ரேஷன்"] },
  { name: "Police Misconduct", keywords: ["police", "fir", "arrest", "station", "constable", "காவல்"] },
];

function keywordClassify(text: string): Array<{ categoryName: string; confidence: number; reasoning: string }> {
  const lower = text.toLowerCase();
  const scores: Array<{ categoryName: string; confidence: number; reasoning: string }> = [];

  for (const cat of KEYWORD_CATEGORIES) {
    const matched = cat.keywords.filter(kw => lower.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      scores.push({
        categoryName: cat.name,
        confidence: Math.min(0.95, 0.4 + matched.length * 0.2),
        reasoning: `Matched keywords: ${matched.join(", ")}`,
      });
    }
  }
  scores.sort((a, b) => b.confidence - a.confidence);
  return scores.slice(0, 3);
}

async function tryOpenAIClassify(text: string, categories: string[]): Promise<Array<{ categoryName: string; confidence: number; reasoning: string | null }> | null> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;

  try {
    // @ts-ignore — openai is an optional runtime dep
    const { default: OpenAI } = await import("openai") as any;
    // @ts-ignore
    const client = new (OpenAI as any)({ baseURL: baseUrl, apiKey });
    const catList = categories.length ? categories.join(", ") : KEYWORD_CATEGORIES.map(c => c.name).join(", ");
    const resp = await client.chat.completions.create({
      model: "gpt-5-nano",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a complaint classification assistant for Tamil Nadu's anti-corruption portal. Given a complaint text, return the top 3 matching categories from this list: ${catList}. Respond ONLY with valid JSON: {"suggestions": [{"categoryName": string, "confidence": number 0-1, "reasoning": string}]}`,
        },
        { role: "user", content: text.slice(0, 1000) },
      ],
    });
    const content = resp.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    return parsed.suggestions ?? null;
  } catch {
    return null;
  }
}

router.post("/ai/classify-complaint", aiLimiter, async (req, res, next) => {
  try {
    const { text, categories = [] } = req.body as { text: string; categories?: string[] };
    if (!text || text.length < 10) {
      res.status(400).json({ error: "Text must be at least 10 characters" });
      return;
    }

    const aiResult = await tryOpenAIClassify(text, categories);
    if (aiResult && aiResult.length > 0) {
      res.json(AiClassifyComplaintResponse.parse({ suggestions: aiResult, model: "gpt-5-nano" }));
      return;
    }

    const fallback = keywordClassify(text);
    if (fallback.length === 0) {
      fallback.push({ categoryName: "General Misconduct", confidence: 0.3, reasoning: "No strong keyword match found" });
    }
    res.json(AiClassifyComplaintResponse.parse({ suggestions: fallback, model: "keyword-fallback" }));
  } catch (err) {
    next(err);
  }
});

async function tryOpenAITranslate(text: string, targetLang: string): Promise<string | null> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;

  try {
    // @ts-ignore — openai is an optional runtime dep
    const { default: OpenAI } = await import("openai") as any;
    // @ts-ignore
    const client = new (OpenAI as any)({ baseURL: baseUrl, apiKey });
    const langName = targetLang === "ta" ? "Tamil" : "English";
    const resp = await client.chat.completions.create({
      model: "gpt-5-nano",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a translator for the Tamil Nadu anti-corruption portal. Translate the following text to ${langName}. Return ONLY the translated text, no explanation.`,
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

router.post("/ai/translate", aiLimiter, async (req, res, next) => {
  try {
    const { text, targetLang } = req.body as { text: string; targetLang: string };
    if (!text || !targetLang) {
      res.status(400).json({ error: "text and targetLang are required" });
      return;
    }
    if (!["en", "ta"].includes(targetLang)) {
      res.status(400).json({ error: "targetLang must be en or ta" });
      return;
    }

    const translated = await tryOpenAITranslate(text, targetLang);
    if (translated) {
      res.json(AiTranslateResponse.parse({ translatedText: translated, sourceLang: targetLang === "ta" ? "en" : "ta", targetLang, model: "gpt-5-nano" }));
      return;
    }

    res.json(AiTranslateResponse.parse({
      translatedText: text,
      sourceLang: targetLang === "ta" ? "en" : "ta",
      targetLang,
      model: "unavailable",
    }));
  } catch (err) {
    next(err);
  }
});

export default router;
