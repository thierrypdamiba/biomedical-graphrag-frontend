"use client";

import * as React from "react";
import { Search, GitBranch, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingStage {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
}

const stages: ThinkingStage[] = [
  { id: "search", icon: Search, label: "Running vector search", color: "text-blue-400" },
  { id: "tools", icon: GitBranch, label: "Running graph enrichment tools", color: "text-violet-400" },
  { id: "generate", icon: Brain, label: "Generating AI summary", color: "text-emerald-400" },
];

interface ThinkingIndicatorProps {
  currentStage?: string;
  message?: string;
}

export function ThinkingIndicator({ currentStage, message }: ThinkingIndicatorProps) {
  const [autoStage, setAutoStage] = React.useState(0);
  const [dots, setDots] = React.useState("");

  // Find the index of the current stage if provided
  const stageIndex = currentStage
    ? stages.findIndex(s => s.id === currentStage)
    : autoStage;

  const activeIndex = stageIndex >= 0 ? stageIndex : autoStage;

  React.useEffect(() => {
    // Only auto-cycle if no currentStage is provided
    if (currentStage) return;

    const stageInterval = setInterval(() => {
      setAutoStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    return () => clearInterval(stageInterval);
  }, [currentStage]);

  React.useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotsInterval);
  }, []);

  const stage = stages[activeIndex];
  const Icon = stage.icon;
  const displayMessage = message || stage.label;

  return (
    <div className="rounded-lg bg-[var(--bg-1)] p-4">
      <div className="flex items-center gap-3">
        {/* Animated icon container */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20">
            <Icon className={cn("h-5 w-5", stage.color)} />
          </div>
          <Icon
            className={cn(
              "h-5 w-5 transition-all duration-500",
              stage.color
            )}
          />
        </div>

        {/* Stage label */}
        <span className="text-sm text-[var(--text-secondary)] transition-all duration-300">
          {displayMessage}
          <span className="inline-block w-6">{dots}</span>
        </span>
      </div>

      {/* Stage indicators */}
      <div className="mt-3 flex items-center gap-2">
        {stages.map((s, i) => {
          const StageIcon = s.icon;
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-300",
                isActive && "scale-105"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300",
                  isActive && "bg-[var(--bg-2)] ring-2 ring-[var(--violet)]/50",
                  isPast && "bg-[var(--bg-2)]",
                  !isActive && !isPast && "bg-[var(--bg-2)]/50"
                )}
              >
                <StageIcon
                  className={cn(
                    "h-3 w-3 transition-all duration-300",
                    isActive && s.color,
                    isPast && "text-[var(--text-tertiary)]",
                    !isActive && !isPast && "text-[var(--text-tertiary)]/50"
                  )}
                />
              </div>
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4 rounded transition-all duration-300",
                    isPast
                      ? "bg-[var(--violet)]/60"
                      : "bg-[var(--stroke-1)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
