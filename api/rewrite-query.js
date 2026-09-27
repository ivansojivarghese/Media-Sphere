import { Groq } from "groq-sdk";

const GROQ_MODEL = "openai/gpt-oss-20b";
const MAX_HISTORY_ITEMS = 40;
const MAX_TEXT_LENGTH = 240;

const QUERY_REWRITE_PROMPT = `You improve a user's YouTube search query using their recent activity.

Rules:
- Preserve the user's explicit intent and language.
- First classify the current query: broad subject/place, task/how-to, named entity, recommendation request, or already-specific search.
- Separately infer the user's stable interests from repeated history patterns, recency, and related watched content.
- Use history to infer broad categories such as travel, technology, music, education, gaming, sports, news, cooking, fitness, movies, or entertainment.
- For a broad or underspecified query, add one or two category or intent terms that make it useful for that user.
- For a task query, preserve the task and add only a relevant domain.
- For a named person, company, product, creator, team, place, or other specific entity, return the original query unchanged.
- For an already-specific query, return the original query unchanged unless the user explicitly asks for recommendations or a category.
- Do not copy a specific historical entity into a broad query unless the current query already names it or clearly asks for it.
- Example: if the current query is "Singapore" and history contains Emirates or airport videos, use "Singapore travel" or "Singapore tourism", never "Singapore Emirates".
- Example: if the current query is "camera" and history centers on filmmaking, use "camera filmmaking" rather than copying a specific camera model.
- Treat brands, creators, products, cities, airlines, and individual videos as evidence of an interest category, not automatic query terms.
- Do not invent people, products, locations, or facts.
- Do not rewrite hashtags, URLs, quoted phrases, or already-specific queries.
- Keep the rewritten query concise: the original query plus at most 3 useful concepts.
- If the history is not clearly relevant, return the original query unchanged.

Return valid JSON only:
{
  "rewrittenQuery": "string",
  "addedConcepts": ["string"],
  "queryType": "broad|task|recommendation|specific_entity|specific",
  "confidence": 0.0
}`;

function parseRewriteResponse(rawContent, originalQuery) {
  const cleanedContent = String(rawContent || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");
    const candidate = firstBrace !== -1 && lastBrace !== -1
      ? cleanedContent.slice(firstBrace, lastBrace + 1)
      : cleanedContent;
    const parsed = JSON.parse(candidate);
    const rewrittenQuery = typeof parsed.rewrittenQuery === "string"
      ? parsed.rewrittenQuery.trim()
      : originalQuery;
    const confidence = Number(parsed.confidence);
    const addedConcepts = Array.isArray(parsed.addedConcepts)
      ? parsed.addedConcepts.filter(item => typeof item === "string").slice(0, 3)
      : [];
    const allowedQueryTypes = new Set(["broad", "task", "recommendation", "specific_entity", "specific"]);
    const queryType = allowedQueryTypes.has(parsed.queryType) ? parsed.queryType : "unknown";

    if (!rewrittenQuery || rewrittenQuery.length > 240 || !Number.isFinite(confidence)) {
      return { rewrittenQuery: originalQuery, addedConcepts: [], queryType: "unknown", confidence: 0 };
    }

    return {
      rewrittenQuery,
      addedConcepts,
      queryType,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  } catch (error) {
    return { rewrittenQuery: originalQuery, addedConcepts: [], queryType: "unknown", confidence: 0 };
  }
}

function compactHistory(history) {
  return history
    .slice(0, MAX_HISTORY_ITEMS)
    .map(entry => ({
      type: entry && entry.type === "video" ? "video" : "search",
      query: String(entry?.query || "").slice(0, MAX_TEXT_LENGTH),
      title: String(entry?.title || "").slice(0, MAX_TEXT_LENGTH),
      channel: String(entry?.channel || "").slice(0, MAX_TEXT_LENGTH)
    }))
    .filter(entry => entry.query || entry.title || entry.channel);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const originalQuery = typeof body.query === "string" ? body.query.trim() : "";
    const history = Array.isArray(body.history) ? compactHistory(body.history) : [];

    if (!originalQuery) {
      return res.status(400).json({ error: "Missing query" });
    }

    if (!history.length) {
      return res.status(200).json({ rewrittenQuery: originalQuery, addedConcepts: [], queryType: "unknown", confidence: 0 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: QUERY_REWRITE_PROMPT },
        {
          role: "user",
          content: JSON.stringify({ query: originalQuery, recentActivity: history })
        }
      ],
      temperature: 0.2,
      max_completion_tokens: 300,
      top_p: 1,
      stream: false
    });

    const rawContent = chatCompletion?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json(parseRewriteResponse(rawContent, originalQuery));
  } catch (error) {
    console.error("Groq query rewrite error:", error);
    return res.status(200).json({ rewrittenQuery: "", addedConcepts: [], queryType: "unknown", confidence: 0 });
  }
}
