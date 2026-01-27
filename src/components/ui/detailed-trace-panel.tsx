"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

interface TraceStep {
  name: string;
  result_count?: number | null;
  results?: unknown;
}

interface DetailedTracePanelProps {
  trace: TraceStep[];
}

export function DetailedTracePanel({ trace }: DetailedTracePanelProps) {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (trace.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
        No trace data. Run a search to see execution details.
      </div>
    );
  }

  const colors = ["text-[var(--blue)]", "text-[var(--violet)]", "text-[var(--teal)]", "text-[var(--amaranth)]"];
  const bgColors = ["bg-[var(--blue)]", "bg-[var(--violet)]", "bg-[var(--teal)]", "bg-[var(--amaranth)]"];

  return (
    <div className="space-y-2 overflow-y-auto">
      {/* Summary */}
      <div className="flex items-center gap-3 p-3 bg-[var(--bg-2)] rounded-lg">
        <Cpu className="h-4 w-4 text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-secondary)]">
          {trace.length} tool{trace.length !== 1 ? "s" : ""} executed
        </span>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => copyToClipboard(JSON.stringify(trace, null, 2), "all")}
        >
          {copiedId === "all" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="ml-1">Copy all</span>
        </Button>
      </div>

      {/* Tool steps */}
      {trace.map((step, i) => (
        <div key={i} className="border border-[var(--stroke-1)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleStep(i)}
            className="flex items-center gap-2 w-full p-3 hover:bg-[var(--bg-2)] transition-colors"
          >
            {expandedSteps.has(i) ? (
              <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
            )}
            <div className={cn("w-2 h-2 rounded-full shrink-0", bgColors[i % bgColors.length])} />
            <span className={cn("font-medium text-sm", colors[i % colors.length])}>
              {step.name}
            </span>
            <div className="flex-1" />
            {step.result_count != null && (
              <Chip variant="default" className="text-xs">
                {step.result_count} results
              </Chip>
            )}
          </button>
          {expandedSteps.has(i) && step.results != null && (
            <div className="p-3 border-t border-[var(--stroke-1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Tool output
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => copyToClipboard(JSON.stringify(step.results, null, 2), `step-${i}`)}
                >
                  {copiedId === `step-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <pre className="rounded bg-[#0B1220] p-2 text-[10px] overflow-x-auto max-h-[300px] overflow-y-auto">
                {JSON.stringify(step.results, null, 2).slice(0, 5000)}
                {JSON.stringify(step.results, null, 2).length > 5000 && "\n..."}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
