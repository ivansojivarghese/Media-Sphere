import { Groq } from "groq-sdk";

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const THEME_PROMPT = `You are given a user's mixed media activity history (search queries and video titles).

Your task is to:

1. Analyze the content and group it into exactly 5 high-level themes.
2. Each theme should:

   * Be concise (2–5 words)
   * Represent a meaningful pattern (not just repeating keywords)
   * Combine related items into broader intent-based categories

For each theme, include:

* "title": short theme name
* "explanation": 1–2 sentences describing the reasoning and signals
* "examples": 2–4 representative items from the input
* "inferred_intent": (optional) what the user might be trying to achieve

Additional rules:

* Output exactly 5 themes (no more, no less)
* Avoid redundant or overlapping themes
* Prefer intent-based grouping over literal keywords
* Keep explanations clear and non-speculative (reasonable inference only)

Output format (valid JSON only, no extra text):

{
"themes": [
{
"title": "Theme Name",
"explanation": "Reasoning behind grouping",
"examples": ["item 1", "item 2"],
"inferred_intent": "Possible user goal"
}
]
}`;

function parseThemesResponse(rawContent) {
  const cleanedContent = String(rawContent || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  if (!cleanedContent) {
    return { themes: [] };
  }

  const firstBrace = cleanedContent.indexOf("{");
  const lastBrace = cleanedContent.lastIndexOf("}");
  const candidate = (firstBrace !== -1 && lastBrace !== -1)
    ? cleanedContent.slice(firstBrace, lastBrace + 1)
    : cleanedContent;

  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === "object" ? parsed : { themes: [] };
  } catch (error) {
    return { themes: [] };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}"): (req.body || {});
    const history = Array.isArray(body.history) ? body.history : [];

    if (!history.length) {
      return res.status(400).json({ error: "Missing history" });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: THEME_PROMPT },
        { role: "user", content: JSON.stringify(history) }
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const rawContent = chatCompletion?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json(parseThemesResponse(rawContent));
  } catch (error) {
    console.error("Groq themes error:", error);
    return res.status(500).json({ error: "Failed to generate themes" });
  }
}