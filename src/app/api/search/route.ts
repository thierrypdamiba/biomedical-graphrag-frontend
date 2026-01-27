import { NextResponse } from "next/server";

const GRAPHRAG_API_URL = process.env.GRAPHRAG_API_URL || "https://biomedical-graphrag-9qqm.onrender.com";

interface SearchRequest {
  query: string;
  limit?: number;
  mode?: string;
}

export async function POST(request: Request) {
  try {
    const body: SearchRequest = await request.json();
    const { query, limit = 5, mode = "graphrag" } = body;

    const response = await fetch(`${GRAPHRAG_API_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, mode }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
