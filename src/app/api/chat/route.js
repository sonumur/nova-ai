import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_MESSAGES = 12;

async function callOpenRouter(messages, modelTier) {
  // Use model from env if provided, otherwise default to a reliable free model
  const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free";
  console.log(`OpenRouter: Falling back to model: ${model}`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://bluebox-ai.vercel.app", // Optional, for OpenRouter rankings
      "X-Title": "Bluebox AI", // Optional
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  return response.body;
}

export async function POST(req) {
  try {
    const body = await req.json();

    let messages = Array.isArray(body.messages)
      ? body.messages.filter(
        m =>
          m &&
          typeof m.role === "string" &&
          (typeof m.content === "string" || Array.isArray(m.content))
      )
      : [];

    if (messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const existingSystemMsg = messages.find(m => m.role === "system");
    const history = messages
      .filter(m => m.role !== "system")
      .slice(-MAX_MESSAGES);

    const modelTier = body.modelTier || "basic";

    const hasImage = history.some(m =>
      Array.isArray(m.content) &&
      m.content.some(c => c.type === "image_url")
    );

    let modelObj;
    if (hasImage) {
      modelObj = "groq/meta-llama/llama-4-scout-17b-16e-instruct";
    } else {
      modelObj = modelTier === "premium" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
    }

    const finalMessages = [
      existingSystemMsg || {
        role: "system",
        content: `You are Bluebox, a friendly AI assistant. Your name is ONLY Bluebox. Use natural conversational fillers. Reactions make you feel more real. Note: The current date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. ⚠️ IMPORTANT: NEVER mention your "knowledge cutoff", "training data", or that you only have information up to 2023.`
      },
      ...history,
    ];

    const encoder = new TextEncoder();

    // Try Groq First
    try {
      console.log(`Tier: ${modelTier}, Attempting Groq with: ${modelObj}`);
      const stream = await groq.chat.completions.create({
        model: modelObj,
        messages: finalMessages,
        max_tokens: 512,
        temperature: 0.7,
        stream: true,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(text));
                const lagBase = modelTier === "premium" ? 0 : 60;
                await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + lagBase));
              }
            }
          } catch (err) {
            console.error("GROQ STREAM ERROR:", err);
            // Note: If streaming has already started, we can't easily fall back to a NEW stream
            // for the same response object. This catch is for errors DURING streaming.
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });

    } catch (groqErr) {
      console.error("GROQ PRIMARY ERROR:", groqErr.message);
      console.log("Attempting fallback to OpenRouter...");

      try {
        const openRouterStream = await callOpenRouter(finalMessages, modelTier);

        // OpenRouter returns a standard Fetch ReadableStream
        return new Response(openRouterStream, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      } catch (orErr) {
        console.error("OPENROUTER FALLBACK ERROR:", orErr.message);
        throw new Error(`Both Groq and OpenRouter failed. Groq: ${groqErr.message}, OR: ${orErr.message}`);
      }
    }

  } catch (err) {
    console.error("CHAT API ERROR DETAIL:", err);
    return new Response(`Chat failed: ${err.message || "Unknown error"}`, { status: 500 });
  }
}
