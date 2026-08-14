type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type DeepSeekToolResponse = {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: { arguments?: string };
      }>;
    };
  }>;
  error?: { message?: string };
};

const MAX_CONTEXT_MESSAGES = 30;
const MAX_CONTEXT_MESSAGE_LENGTH = 2_000;
const MAX_SUGGESTION_LENGTH = 120;

function parseSuggestions(data: DeepSeekToolResponse) {
  const rawArguments = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!rawArguments) return null;

  try {
    const parsed = JSON.parse(rawArguments) as { suggestions?: unknown };
    if (!Array.isArray(parsed.suggestions)) return null;
    const suggestions = parsed.suggestions
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.length <= MAX_SUGGESTION_LENGTH)
      .slice(0, 3);
    return suggestions.length === 3 ? suggestions : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { context?: unknown } | null;
  const context: ConversationMessage[] = Array.isArray(body?.context)
    ? body.context
        .filter(
          (item): item is ConversationMessage =>
            typeof item === "object" &&
            item !== null &&
            ((item as ConversationMessage).role === "user" || (item as ConversationMessage).role === "assistant") &&
            typeof (item as ConversationMessage).content === "string" &&
            (item as ConversationMessage).content.length <= MAX_CONTEXT_MESSAGE_LENGTH,
        )
        .slice(-MAX_CONTEXT_MESSAGES)
    : [];

  if (context.length === 0) {
    return Response.json({ error: "Conversation context is required." }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Suggestions are temporarily unavailable." }, { status: 503 });
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      thinking: { type: "disabled" },
      max_tokens: 240,
      messages: [
        {
          role: "system",
          content:
            "Generate three short, natural follow-up questions that the visitor can ask Ender next. Base them on the conversation without repeating questions already answered. Determine the predominant language from the visitor's messages across the conversation, and write all three suggestions in that language. Use the provided tool exactly once.",
        },
        ...context,
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_follow_up_questions",
            description: "Returns exactly three contextual follow-up questions in the visitor's predominant language.",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: { type: "string" },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "suggest_follow_up_questions" },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json()) as DeepSeekToolResponse;
  if (!response.ok) {
    console.error("DeepSeek suggestion request failed", response.status, data.error?.message ?? "Unknown error");
    return Response.json({ error: "Suggestions are temporarily unavailable." }, { status: 502 });
  }

  const suggestions = parseSuggestions(data);
  if (!suggestions) {
    return Response.json({ error: "Suggestions are temporarily unavailable." }, { status: 502 });
  }

  return Response.json({ suggestions });
}
