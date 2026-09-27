import { Groq } from "groq-sdk";

const GROQ_MODEL = "openai/gpt-oss-20b";
const MAX_HISTORY_ITEMS = 40;
const MAX_RESULTS = 20;
const MAX_TEXT_LENGTH = 240;

const RANK_RESULTS_PROMPT = `You are a careful YouTube personalization ranker.

Rank the provided candidate videos for the user's current query using their recent activity.
The candidates are already relevant to the query. Your job is only to personalize their order.

Rules:
- Return every candidate ID exactly once. Never invent, remove, or duplicate an ID.
- Preserve the user's current query intent above historical preferences.
- Prefer candidates matching repeated or recent interests and watched-channel affinity.
- Avoid candidates that repeat a video or topic the user already watched when comparable alternatives exist.
- Prefer English-language titles and channels for a generic query by default.
- If the user's recent history clearly contains another language or a consistent multilingual preference, prioritize that language when it matches the current query.
- Do not reject useful non-English content when the query or history indicates that language preference.
- Keep 10-30% of the list exploratory or less personalized when reasonable.
- Do not let one channel dominate the entire top of the list.
- Specific searches for a person, company, product, creator, team, or named place should stay tightly focused.
- Use history as preference evidence, not as additional query terms.
- Make a meaningful preference-based reorder when the history supports one; do not blindly copy the input order.
- Confidence must be a numeric value between 0.0 and 1.0.
- Confidence rubric: 0.90-1.00 means clear intent and strong history alignment; 0.75-0.89 means good alignment; 0.55-0.74 means plausible but limited evidence; 0.01-0.54 means weak evidence.
- If you return a complete valid ranking, never return confidence 0.0. Use at least 0.55 when the ranking is usable.

Return valid JSON only:
{
  "rankedIds": ["candidate-id-1", "candidate-id-2"],
  "confidence": a number between 0.0 and 1.0
}`;

function cleanText(value) {
  return String(value || "").slice(0, MAX_TEXT_LENGTH);
}

function parseRankResponse(rawContent, candidateIds) {
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
    const rankedIds = Array.isArray(parsed.rankedIds) ? parsed.rankedIds : [];
    const candidateSet = new Set(candidateIds);
    const validIds = rankedIds.filter(id => typeof id === "string" && candidateSet.has(id));
    const uniqueIds = [...new Set(validIds)];
    const parsedConfidence = Number(parsed.confidence);
    const hasCompleteRanking = uniqueIds.length === candidateIds.length;
    const confidence = Number.isFinite(parsedConfidence) && parsedConfidence > 0
      ? parsedConfidence
      : hasCompleteRanking
        ? 0.7
        : 0.55;

    if (!Number.isFinite(confidence) || uniqueIds.length < Math.ceil(candidateIds.length * 0.7)) {
      return { rankedIds: candidateIds, confidence: 0 };
    }

    const rankedSet = new Set(uniqueIds);
    const completedIds = [
      ...uniqueIds,
      ...candidateIds.filter(id => !rankedSet.has(id))
    ];

    return {
      rankedIds: completedIds,
      confidence: Math.max(0, Math.min(1, confidence))
    };
  } catch (error) {
    return { rankedIds: candidateIds, confidence: 0 };
  }
/*
  try {
    const parsed = JSON.parse(String(rawContent || ""));

    const rankedIds = Array.isArray(parsed.rankedIds)
      ? parsed.rankedIds
      : [];

    const candidateSet = new Set(candidateIds);

    const validIds = rankedIds.filter(
      id => typeof id === "string" && candidateSet.has(id)
    );

    const uniqueIds = [...new Set(validIds)];

    const parsedConfidence = Number(parsed.confidence);

    const hasCompleteRanking =
      uniqueIds.length === candidateIds.length;

    const confidence =
      Number.isFinite(parsedConfidence) && parsedConfidence > 0
        ? parsedConfidence
        : hasCompleteRanking
          ? 0.7
          : 0.55;

    if (
      !Number.isFinite(confidence) ||
      uniqueIds.length < Math.ceil(candidateIds.length * 0.7)
    ) {
      return {
        rankedIds: candidateIds,
        confidence: 0
      };
    }

    const rankedSet = new Set(uniqueIds);

    const completedIds = [
      ...uniqueIds,
      ...candidateIds.filter(id => !rankedSet.has(id))
    ];

    return {
      rankedIds: completedIds,
      confidence: Math.max(0, Math.min(1, confidence))
    };

  } catch (error) {
    return {
      rankedIds: candidateIds,
      confidence: 0
    };
  }*/
}

function compactHistory(history) {
  return history
    .slice(0, MAX_HISTORY_ITEMS)
    .map(entry => ({
      type: entry && entry.type === "video" ? "video" : "search",
      query: cleanText(entry?.query),
      title: cleanText(entry?.title),
      channel: cleanText(entry?.channel)
    }))
    .filter(entry => entry.query || entry.title || entry.channel);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const history = Array.isArray(body.history) ? compactHistory(body.history) : [];
    const results = Array.isArray(body.results) ? body.results.slice(0, MAX_RESULTS) : [];
    const candidateIds = results.map(result => String(result?.id || ""));

    if (!query || !results.length || candidateIds.some(id => !id)) {
      return res.status(400).json({ error: "Missing query or candidates" });
    }

    const userPayload = {
      query,
      recentActivity: history,
      candidates: results.map(result => ({
        id: String(result.id),
        title: cleanText(result.title),
        channel: cleanText(result.channel),
        description: cleanText(result.description),
        position: result.position,
        viewCount: Number(result.viewCount || 0),
        publishedAt: cleanText(result.publishedAt),
        duration: cleanText(result.duration),
        interestMatch: Number(result.interestMatch || 0),
        channelAffinity: Number(result.channelAffinity || 0),
        freshness: Number(result.freshness || 0),
        popularity: Number(result.popularity || 0),
        watchedSimilarity: Number(result.watchedSimilarity || 0)
      }))
    };

    console.log("Groq ranking prompt", {
      system: RANK_RESULTS_PROMPT,
      user: userPayload
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: RANK_RESULTS_PROMPT },
        {
          role: "user",
          content: JSON.stringify(userPayload)
        }
      ],
      temperature: 0.1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const message = chatCompletion?.choices?.[0]?.message || {};

    console.log("Full Groq message:", message);

    const rawContent =
    message.content ||
    message.reasoning_content ||
    message.reasoning ||
    "";

    // const rawContent = chatCompletion?.choices?.[0]?.message?.content ?? "";
    console.log("Raw Groq ranking output:", rawContent);
    const parsedRanking = parseRankResponse(rawContent, candidateIds);
    return res.status(200).json({
      ...parsedRanking,
      debug: {
        systemPrompt: RANK_RESULTS_PROMPT,
        userPayload,
        rawOutput: rawContent,
        parsedRanking
      }
    });
  } catch (error) {
    console.error("Groq result ranking error:", error);
    return res.status(200).json({ rankedIds: [], confidence: 0 });
  }
}
