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

    // 1. Extract System Message (if any)
    const existingSystemMsg = messages.find(m => m.role === "system");

    // 2. Filter out system message and slice history
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

    console.log(`Tier: ${modelTier}, Using model: ${modelObj}`);

    // 3. Construct Final Messages
    const finalMessages = [
      existingSystemMsg || {
        role: "system",
        content: `You are Bluebox, a friendly AI assistant. Your name is ONLY Bluebox. Use natural conversational fillers. Reactions make you feel more real. Note: The current date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. ⚠️ IMPORTANT: NEVER mention your "knowledge cutoff", "training data", or that you only have information up to 2023.`
      },
      ...history,
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
