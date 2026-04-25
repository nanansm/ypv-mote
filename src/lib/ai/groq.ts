export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export type GroqResponse = {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
};

export async function callGroq({
  apiKey,
  model,
  systemPrompt,
  userMessage,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
}): Promise<GroqResponse> {
  async function attempt(): Promise<GroqResponse> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 429 || res.status >= 500) {
      throw Object.assign(new Error(`Groq API: ${res.status}`), { status: res.status });
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq API: ${res.status} ${body}`);
    }
    return res.json() as Promise<GroqResponse>;
  }

  try {
    return await attempt();
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 429 || (status !== undefined && status >= 500)) {
      await new Promise((r) => setTimeout(r, 2000));
      return attempt();
    }
    throw err;
  }
}
