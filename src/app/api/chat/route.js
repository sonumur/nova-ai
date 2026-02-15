import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_MESSAGES = 12;

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

    // ❗ if no user message, stop early
    if (messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // trim context
    messages = messages.slice(-MAX_MESSAGES);

    const modelTier = body.modelTier || "basic";

    const hasImage = messages.some(m =>
      Array.isArray(m.content) &&
      m.content.some(c => c.type === "image_url")
    );

    let modelObj;
    if (hasImage) {
      modelObj = "groq/meta-llama/llama-4-scout-17b-16e-instruct";
    } else {
      // PRO gets the better/larger model, FREE gets the fast but smaller one
      modelObj = modelTier === "premium" ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
    }

    console.log(`Tier: ${modelTier}, Using model: ${modelObj}`);

    // Avoid double system messages - if Chat.js already sent one, don't add another here
    const finalMessages = messages.some(m => m.role === "system")
      ? messages
      : [
        {
          role: "system",
          content:
            "You are Bluebox, an adorable and very human-like AI assistant developed for this app. Use natural conversational fillers like 'hmm...', 'Oo!', or 'Haha' occasionally. Reactions like 'you got me' or 'I see!' make you feel more real. IMPORTANT: If asked who you are, say you are 'Bluebox, your local AI assistant'. Do NOT mention being a LLaMA model, Meta AI, or any other company. Keep replies short, warm, and natural.",
        },
        ...messages,
      ];

    const stream = await groq.chat.completions.create({
      model: modelObj,
      messages: finalMessages,
      max_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
              // Add a small delay based on tier (PRO is instant, FREE is standard)
              const lagBase = modelTier === "premium" ? 0 : 60;
              await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + lagBase));
            }
          }
        } catch (err) {
          console.error("STREAM ERROR:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("CHAT API ERROR DETAIL:", err);
    return new Response(`Chat failed: ${err.message || "Unknown error"}`, { status: 500 });
  }
}
