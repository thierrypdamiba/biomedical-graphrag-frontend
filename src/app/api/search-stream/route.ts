import { NextRequest } from "next/server";

const GRAPHRAG_API_URL = process.env.GRAPHRAG_API_URL || "https://biomedical-graphrag-9qqm.onrender.com";

interface SearchRequest {
  query: string;
  limit?: number;
  mode?: string;
}

export async function POST(request: NextRequest) {
  const body: SearchRequest = await request.json();
  const { query, limit = 5, mode = "graphrag" } = body;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        // Send initial status
        send({ type: "status", stage: "search", message: "Running vector search..." });

        // Start the backend request and progress timer concurrently
        const stages = [
          { delay: 4000, stage: "tools", message: "Running graph enrichment tools..." },
          { delay: 10000, stage: "generate", message: "Generating AI summary..." },
        ];

        let cancelled = false;
        const timers = stages.map(({ delay, stage, message }) =>
          setTimeout(() => {
            if (!cancelled) send({ type: "status", stage, message });
          }, delay)
        );

        // Make request to backend (this is the long blocking call)
        const response = await fetch(`${GRAPHRAG_API_URL}/api/graphrag-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, limit, mode }),
          signal: AbortSignal.timeout(120_000),
        });

        // Cancel any remaining timers
        cancelled = true;
        timers.forEach(clearTimeout);

        if (!response.ok) {
          send({ type: "error", message: "Search failed" });
          controller.close();
          return;
        }

        const data = await response.json();

        // Send final processing status
        send({ type: "status", stage: "generate", message: "Streaming response..." });

        // Send metadata
        send({
          type: "metadata",
          results: data.results || [],
          trace: data.trace || [],
          metadata: data.metadata || {},
        });

        // Stream the summary word by word
        const summary = data.summary || "";
        if (summary) {
          const words = summary.split(/(\s+)/);
          for (const word of words) {
            send({ type: "content", text: word });
            if (word.trim()) {
              await new Promise(resolve => setTimeout(resolve, 15));
            }
          }
        }

        send({ type: "done" });
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
