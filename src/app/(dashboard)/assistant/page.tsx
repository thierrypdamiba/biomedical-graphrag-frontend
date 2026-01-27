"use client";

import * as React from "react";
import {
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailedTracePanel } from "@/components/ui/detailed-trace-panel";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { FormattedResponse } from "@/components/ui/formatted-response";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

interface TraceStep {
  name: string;
  result_count?: number | null;
  results?: unknown;
}

interface SearchResult {
  id: string;
  score: number;
  payload: {
    paper?: {
      pmid?: string;
      title?: string;
      abstract?: string;
      authors?: Array<{ name?: string }>;
      journal?: string;
      publication_date?: string;
      mesh_terms?: Array<{ term?: string }>;
    };
  };
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
    traceDrawerOpen,
    toggleTraceDrawer,
    sidebarCollapsed,
  } = useAppStore();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [currentStage, setCurrentStage] = React.useState<string | undefined>();
  const [stageMessage, setStageMessage] = React.useState<string | undefined>();
  const [selectedTraceStep, setSelectedTraceStep] = React.useState<TraceStep | null>(null);
  const [streamingMetadata, setStreamingMetadata] = React.useState<Partial<MessageMetadata> | null>(null);
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
    setStreamingMetadata(null);

    try {
      const response = await fetch("/api/search-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: 5,
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

                case "metadata":
                  metadata = {
                    ...metadata,
                    results: data.results || [],
                    trace: data.trace || [],
                  };
                  setStreamingMetadata(metadata);
                  break;

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
                  setStreamingMetadata(null);
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
      setStreamingMetadata(null);
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
            <h1 className="text-lg md:text-xl font-semibold">Assistant</h1>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] truncate">
              GraphRAG search over biomedical literature
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleArtifactsPane}
              className="gap-2 text-xs md:text-sm"
            >
              <span className="hidden sm:inline">{artifactsPaneOpen ? "Hide" : "Show"} Artifacts</span>
              <span className="sm:hidden">{artifactsPaneOpen ? "Hide" : "Show"}</span>
              {artifactsPaneOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
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
                  {message.role === "user" ? "You" : "Assistant"}
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
                    {message.metadata.trace?.length || 0} tools executed
                  </Chip>
                  <Chip variant="default">
                    {message.metadata.results?.length || 0} results
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
                <span className="font-medium">Assistant</span>
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
              </div>
            </div>
          </div>
          <div className="mt-2 hidden md:flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span>Enter to send, Shift+Enter for new line</span>
            <span>⌘/ to toggle trace</span>
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
            <TabsList className="px-4 pt-4">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="trace">Trace</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="flex-1 overflow-y-auto p-4">
              {lastAssistantMessage?.metadata?.results && lastAssistantMessage.metadata.results.length > 0 ? (
                <div className="space-y-2">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {lastAssistantMessage.metadata.results.length} results
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(lastAssistantMessage.metadata?.results, null, 2)
                          );
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                  {lastAssistantMessage.metadata.results.map((result) => {
                    const r = result as unknown as Record<string, unknown>;
                    const paper = result.payload?.paper;
                    const pmid = String(paper?.pmid || r.pmid || result.id || "");
                    const title = String(paper?.title || r.title || "Untitled");
                    const authors = (paper?.authors || r.authors as Array<{ name?: string }> | undefined)?.slice(0, 2).map((a) => a.name).join(", ");
                    const journal = String(paper?.journal || r.journal || "");

                    return (
                      <div
                        key={String(result.id)}
                        className="rounded-lg border border-[var(--stroke-1)] p-3 hover:bg-[var(--bg-2)] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-xs text-[var(--text-tertiary)]">
                            PMID:{pmid}
                          </code>
                          <Chip variant="blue">{result.score.toFixed(3)}</Chip>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{title}</p>
                        {authors && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {authors}
                          </p>
                        )}
                        {journal && (
                          <p className="text-xs text-[var(--text-tertiary)]">
                            {journal}
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

      {/* Bottom Trace Drawer */}
      <div
        className={cn(
          "fixed bottom-0 right-0 border-t border-[var(--stroke-1)] bg-[var(--bg-1)] transition-all duration-300",
          traceDrawerOpen ? "h-[280px] md:h-[360px]" : "h-10 md:h-11",
          // Mobile: full width
          "left-0",
          // Desktop: account for sidebar
          sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]"
        )}
      >
        <button
          onClick={toggleTraceDrawer}
          className="flex h-10 md:h-11 w-full items-center justify-between px-3 md:px-4 hover:bg-[var(--bg-2)]"
        >
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm overflow-x-auto">
            <span className="text-[var(--text-secondary)] hidden sm:inline">Tools:</span>
            <Chip variant="teal" className="text-xs">
              {lastAssistantMessage?.metadata?.trace?.length || 0}
            </Chip>
            <span className="text-[var(--text-secondary)] hidden sm:inline">Results:</span>
            <span className="text-[var(--text-secondary)] sm:hidden">R:</span>
            <Chip variant="default" className="text-xs">
              {lastAssistantMessage?.metadata?.results?.length || 0}
            </Chip>
          </div>
          {traceDrawerOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0" />
          )}
        </button>
        {traceDrawerOpen && (
          <div className="h-[calc(280px-40px)] md:h-[calc(360px-44px)] overflow-y-auto p-3 md:p-4">
            {lastAssistantMessage?.metadata?.trace && lastAssistantMessage.metadata.trace.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <h3 className="mb-2 md:mb-3 text-sm font-semibold">Tool Executions</h3>
                  <div className="space-y-2">
                    {lastAssistantMessage.metadata.trace.map((step, i) => {
                      const colors = [
                        "bg-[var(--blue)]",
                        "bg-[var(--violet)]",
                        "bg-[var(--teal)]",
                        "bg-[var(--amaranth)]",
                      ];
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer rounded p-1 -m-1 transition-colors hover:bg-[var(--bg-2)]",
                            selectedTraceStep?.name === step.name && "bg-[var(--selection)]"
                          )}
                          onClick={() => setSelectedTraceStep(selectedTraceStep?.name === step.name ? null : step)}
                        >
                          <div className={cn("w-2 h-2 rounded-full shrink-0", colors[i % colors.length])} />
                          <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
                            {step.name}
                          </span>
                          {step.result_count != null && (
                            <Chip variant="default" className="text-[10px]">
                              {step.result_count} results
                            </Chip>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    {selectedTraceStep ? "Tool Results" : "Summary"}
                  </h3>
                  {selectedTraceStep ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-[var(--text-tertiary)]">Tool</span>
                        <p className="text-sm font-medium">{selectedTraceStep.name}</p>
                      </div>
                      {selectedTraceStep.result_count != null && (
                        <div>
                          <span className="text-xs text-[var(--text-tertiary)]">Results</span>
                          <p className="text-sm">{selectedTraceStep.result_count}</p>
                        </div>
                      )}
                      {selectedTraceStep.results != null && (
                        <div>
                          <span className="text-xs text-[var(--text-tertiary)]">Data</span>
                          <pre className="mt-1 rounded bg-[#0B1220] p-2 text-[10px] overflow-x-auto max-h-32">
                            {JSON.stringify(selectedTraceStep.results, null, 2).slice(0, 2000)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs font-mono text-[var(--text-secondary)]">
                      {lastAssistantMessage.metadata.trace.map((step, i) => (
                        <div key={i}>
                          {step.name} {step.result_count != null ? `→ ${step.result_count}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
                No trace data. Run a search to see the execution timeline.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
