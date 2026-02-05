import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  const body = await req.json();

  const messages = Array.isArray(body.messages)
    ? body.messages.filter(
        m => m && typeof m.content === "string" && typeof m.role === "string"
      )
    : [];

  const stream = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", 
        content: `
        you are Nova, a friendly, calm, slightly witty AI assistant.
        you talk like a human, not a robot.
        you sometime use short reactions like "hmm", "okay", "got it".
        you keep replies natural, not too long.
        If the user is confused, you slow down and explain simple.
        `
       },
      ...messages
    ],
    stream: true,
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
