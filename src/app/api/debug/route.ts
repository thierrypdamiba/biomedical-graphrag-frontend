import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    GRAPHRAG_API_URL: process.env.GRAPHRAG_API_URL ? "SET" : "NOT SET",
    QDRANT_URL: process.env.QDRANT_URL ? "SET" : "NOT SET",
    QDRANT_API_KEY: process.env.QDRANT_API_KEY ? "SET" : "NOT SET",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
