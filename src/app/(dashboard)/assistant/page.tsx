"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailedTracePanel } from "@/components/ui/detailed-trace-panel";
import Image from "next/image";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { FormattedResponse } from "@/components/ui/formatted-response";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface TraceStep {
  name: string;
  arguments?: Record<string, unknown> | null;
  result_count?: number | null;
  results?: unknown;
}

interface SearchResult {
  id: string;
  score: number;
  title?: string;
  abstract?: string;
  authors?: string[];
  journal?: string;
  year?: string;
  pmid?: string;
}

interface MessageMetadata {
  collection: string;
  results: SearchResult[];
  trace?: TraceStep[];
  query?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export default function AssistantPage() {
  const {
    artifactsPaneOpen,
    toggleArtifactsPane,
    activeArtifactTab,
    setActiveArtifactTab,
    topK,
    setTopK,
  } = useAppStore();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [currentStage, setCurrentStage] = React.useState<string | undefined>();
  const [stageMessage, setStageMessage] = React.useState<string | undefined>();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeSearch = async (query: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent("");
    setCurrentStage(undefined);
    setStageMessage(undefined);


    try {
      const response = await fetch("/api/search-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: topK,
          mode: "graphrag",
        }),
      });

      if (!response.ok) {
        throw new Error("Stream request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let accumulatedContent = "";
      let metadata: Partial<MessageMetadata> = {
        collection: "biomedical_papers",
        query,
        results: [],
        trace: [],
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "status":
                  setCurrentStage(data.stage);
                  setStageMessage(data.message);
                  break;

                case "metadata": {
                  const trace = data.trace || [];
                  // Extract rich results from the first trace step (Qdrant search)
                  // since the top-level results lack payload data
                  const qdrantTrace = trace.find((t: { name: string }) =>
                    t.name?.includes("retrieve") || t.name?.includes("search")
                  );
                  const traceResults = qdrantTrace?.results;
                  const richResults = Array.isArray(traceResults)
                    ? traceResults.map((r: Record<string, unknown>) => {
                        const payload = r.payload as Record<string, unknown> | undefined;
                        const paper = (payload?.paper || payload || {}) as Record<string, unknown>;
                        return {
                          id: String(r.id || ""),
                          score: Number(r.score || 0),
                          title: String(paper.title || "Untitled"),
                          abstract: String(paper.abstract || ""),
                          authors: Array.isArray(paper.authors)
                            ? paper.authors.map((a: unknown) => {
                                if (typeof a === "string") return a;
                                if (typeof a === "object" && a !== null) {
                                  const obj = a as Record<string, unknown>;
                                  return String(obj.name || obj.full_name || obj.label || JSON.stringify(a));
                                }
                                return String(a);
                              }).filter(Boolean)
                            : [],
                          journal: String(paper.journal || ""),
                          year: String(paper.publication_date || paper.year || ""),
                          pmid: String(paper.pmid || ""),
                        };
                      })
                    : data.results || [];
                  const slicedResults = richResults.slice(0, topK);
                  // Patch trace so Qdrant step reflects topK
                  const patchedTrace = trace.map((t: Record<string, unknown>) => {
                    if (t === qdrantTrace) {
                      return { ...t, result_count: slicedResults.length, results: (traceResults as unknown[]).slice(0, topK) };
                    }
                    return t;
                  });
                  metadata = {
                    ...metadata,
                    results: slicedResults,
                    trace: patchedTrace,
                  };
                  // metadata updated for final message
                  break;
                }

                case "content":
                  accumulatedContent += data.text;
                  setStreamingContent(accumulatedContent);
                  break;

                case "done":
                  // Create the final message
                  const assistantMessage: Message = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: accumulatedContent || `No results found for "${query}".`,
                    timestamp: new Date(),
                    metadata: metadata as MessageMetadata,
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingContent("");
                  setCurrentStage(undefined);
                  setStageMessage(undefined);
              
                  break;

                case "error":
                  throw new Error(data.message);
              }
            } catch (parseError) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, there was an error processing your search. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent("");
      setCurrentStage(undefined);
      setStageMessage(undefined);
  
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const query = input;
    setInput("");
    await executeSearch(query);
  };

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.metadata);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px-32px-56px)] md:h-[calc(100vh-56px-48px-56px)] gap-4">
      {/* Chat Pane */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold">Biomedical CoPilot</h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] truncate">
              GraphRAG search over biomedical literature
            </p>
          </div>
          {!artifactsPaneOpen && (
            <button
              onClick={toggleArtifactsPane}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border bg-[var(--bg-2)] border-[var(--stroke-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--stroke-2)]"
            >
              Show Results & Trace
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                PubMed Navigator
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-md">
                Ask biomedical research questions and get AI-generated answers grounded in PubMed literature and knowledge graphs.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "animate-fade-in",
                message.role === "user"
                  ? "border-l-2 border-[var(--stroke-2)] pl-4"
                  : "rounded-lg bg-[var(--bg-1)] p-4"
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="font-medium">
                  {message.role === "user" ? "You" : "Biomedical CoPilot"}
                </span>
                <span>•</span>
                <span>{message.timestamp.toLocaleTimeString()}</span>
              </div>
              {message.role === "assistant" ? (
                <FormattedResponse content={message.content} />
              ) : (
                <div className="text-[var(--text-primary)]">
                  {message.content}
                </div>
              )}
              {message.role === "assistant" && message.metadata && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--stroke-1)] pt-3">
                  <Chip variant="teal">
                    {(message.metadata.trace?.length ?? 0) - (message.metadata.trace?.at(-1)?.name?.toLowerCase().includes("summarize") ? 1 : 0)} tools executed
                  </Chip>
                  <Chip variant="default">
                    Vector Search Results: {message.metadata.results?.length || 0}
                  </Chip>
                </div>
              )}
            </div>
          ))}
          {isLoading && !streamingContent && (
            <ThinkingIndicator currentStage={currentStage} message={stageMessage} />
          )}
          {streamingContent && (
            <div className="rounded-lg bg-[var(--bg-1)] p-4 animate-fade-in">
              <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span className="font-medium">Biomedical CoPilot</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--emerald)]" />
                  Streaming...
                </span>
              </div>
              <FormattedResponse content={streamingContent} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--stroke-1)] pt-3 md:pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--stroke-1)] bg-[var(--bg-1)] p-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about genes, diseases..."
                  className="flex-1 min-w-0 bg-transparent text-sm md:text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
                <Button
                  variant="primary"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 border-l border-[var(--stroke-1)] pl-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Top K</span>
                  {[1, 3, 5].map((k) => (
                    <button
                      key={k}
                      onClick={() => setTopK(k)}
                      className={cn(
                        "w-6 h-6 rounded text-xs font-medium transition-all",
                        topK === k
                          ? "bg-[var(--violet)]/20 text-[var(--violet)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-wider">Powered by</span>
              <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-[80px] h-[28px] rounded bg-white hover:bg-gray-100 transition-all">
                <Image src="/qdrant-wordmark-dark.png" alt="Qdrant" width={64} height={18} className="object-contain" />
              </a>
              <a href="https://neo4j.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-[80px] h-[28px] rounded bg-white hover:bg-gray-100 transition-all">
                <Image src="/neo4j-logo.png" alt="Neo4j" width={64} height={18} className="object-contain" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Artifacts Pane */}
      {artifactsPaneOpen && (
        <div className="w-full lg:w-[420px] xl:w-[520px] shrink-0 overflow-hidden rounded-lg border border-[var(--stroke-1)] bg-[var(--bg-1)] max-h-[50vh] lg:max-h-none">
          <Tabs
            value={activeArtifactTab}
            onValueChange={(v) => setActiveArtifactTab(v as typeof activeArtifactTab)}
            className="h-full flex flex-col"
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <TabsList>
                <TabsTrigger value="results">Vector Search Results</TabsTrigger>
                <TabsTrigger value="trace">Trace</TabsTrigger>
              </TabsList>
              <button
                onClick={toggleArtifactsPane}
                className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-2)] transition-all"
              >
                Hide
              </button>
            </div>

            <TabsContent value="results" className="flex-1 overflow-y-auto p-4">
              {lastAssistantMessage?.metadata?.results && lastAssistantMessage.metadata.results.length > 0 ? (
                <div className="space-y-2">
                  <div className="mb-4">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Vector Search Results: {lastAssistantMessage.metadata.results.length}
                    </span>
                  </div>
                  {lastAssistantMessage.metadata.results.map((result) => {
                    const pmid = result.pmid || result.id || "";
                    const title = result.title || "Untitled";
                    const authors = result.authors
                      ? result.authors.slice(0, 3).join(", ") + (result.authors.length > 3 ? ", ..." : "")
                      : undefined;
                    const journal = result.journal || "";
                    const year = result.year || "";

                    return (
                      <div
                        key={String(result.id)}
                        className="rounded-lg border border-[var(--stroke-1)] p-3 hover:bg-[var(--bg-2)] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          {pmid ? (
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--blue)] hover:underline"
                            >
                              PMID: {pmid}
                            </a>
                          ) : (
                            <code className="text-xs text-[var(--text-tertiary)]">{result.id}</code>
                          )}
                          <Chip variant="blue">{result.score.toFixed(3)}</Chip>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{title}</p>
                        {authors && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {authors}
                          </p>
                        )}
                        {(journal || year) && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {journal && <span className="italic">{journal}</span>}
                            {journal && year && " · "}
                            {year}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
                  No results yet. Ask a question to see results.
                </div>
              )}
            </TabsContent>

            <TabsContent value="trace" className="flex-1 overflow-y-auto p-4">
              <DetailedTracePanel
                trace={lastAssistantMessage?.metadata?.trace || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

    </div>
  );
}
