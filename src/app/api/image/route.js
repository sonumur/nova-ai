export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    // TEMP response (replace later with real image API)
    return Response.json({
      type: "image",
      url: "https://via.placeholder.com/512?text=Nova+Image",
    });

  } catch (error) {
    return Response.json({ error: "Image error" }, { status: 500 });
  }
}

