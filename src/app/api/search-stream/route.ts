import { NextRequest } from "next/server";

const GRAPHRAG_API_URL = process.env.GRAPHRAG_API_URL || "https://biomedical-graphrag-9qqm.onrender.com";

interface SearchRequest {
  query: string;
  limit?: number;
  mode?: string;
}

export async function POST(request: NextRequest) {
  const body: SearchRequest = await request.json();
  const { query, limit = 10, mode = "graphrag" } = body;

  // Create a TransformStream to stream the response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", stage: "search", message: "Running vector search..." })}\n\n`));

        // Make request to backend
        const response = await fetch(`${GRAPHRAG_API_URL}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit, mode }),
        });

        if (!response.ok) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Search failed" })}\n\n`));
          controller.close();
          return;
        }

        // Send graph enrichment status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", stage: "graph", message: "Enriching with graph context..." })}\n\n`));

        const data = await response.json();

        // Send tools status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", stage: "tools", message: "Processing results..." })}\n\n`));

        // Send metadata first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "metadata",
          results: data.results || [],
          trace: data.trace || [],
          metadata: data.metadata || {}
        })}\n\n`));

        // Send generating status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "status", stage: "generate", message: "Generating response..." })}\n\n`));

        // Stream the summary word by word
        const summary = data.summary || "";
        if (summary) {
          // Split into chunks (words or small groups)
          const words = summary.split(/(\s+)/);

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", text: word })}\n\n`));

            // Small delay between words for streaming effect
            // Faster for whitespace, slower for actual words
            if (word.trim()) {
              await new Promise(resolve => setTimeout(resolve, 15));
            }
          }
        }

        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Search failed" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
