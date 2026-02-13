import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Using a reliable public news aggregator API (ok.surf)
        const response = await fetch("https://ok.surf/api/v1/cors/news-feed", {
            next: { revalidate: 3600 }, // Cache news for 1 hour
        });

        if (!response.ok) {
            throw new Error(`News API failed: ${response.status}`);
        }

        const data = await response.json();

        // Flatten categories into a top headlines list
        const headlines = [];
        const categories = ["World", "Technology", "Business", "Science"];

        for (const cat of categories) {
            if (data[cat]) {
                // Take top 3 from each key category
                headlines.push(...data[cat].slice(0, 3).map(item => ({
                    title: item.title,
                    source: item.source,
                    link: item.link
                })));
            }
        }

        return NextResponse.json({ headlines });
    } catch (error) {
        console.error("News Fetch Error:", error);
        return NextResponse.json({ error: "Could not fetch news", headlines: [] }, { status: 500 });
    }
}
