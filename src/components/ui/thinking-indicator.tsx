"use client";

import * as React from "react";
import { Search, GitBranch, Wrench, Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingStage {
  icon: React.ElementType;
  label: string;
  color: string;
}

const stages: ThinkingStage[] = [
  { icon: Search, label: "Running vector search", color: "text-blue-400" },
  { icon: GitBranch, label: "Enriching with graph", color: "text-violet-400" },
  { icon: Wrench, label: "Selecting tools", color: "text-amber-400" },
  { icon: Brain, label: "Generating response", color: "text-emerald-400" },
];

export function ThinkingIndicator() {
  const [activeStage, setActiveStage] = React.useState(0);
  const [dots, setDots] = React.useState("");

  React.useEffect(() => {
    // Cycle through stages
    const stageInterval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => {
      clearInterval(stageInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  const currentStage = stages[activeStage];
  const Icon = currentStage.icon;

  return (
    <div className="rounded-lg bg-[var(--bg-1)] p-4">
      <div className="flex items-center gap-3">
        {/* Animated icon container */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20">
            <Icon className={cn("h-5 w-5", currentStage.color)} />
          </div>
          <Icon
            className={cn(
              "h-5 w-5 transition-all duration-500",
              currentStage.color
            )}
          />
        </div>

        {/* Stage label */}
        <span className="text-sm text-[var(--text-secondary)] transition-all duration-300">
          {currentStage.label}
          <span className="inline-block w-6">{dots}</span>
        </span>
      </div>

      {/* Stage indicators */}
      <div className="mt-3 flex items-center gap-2">
        {stages.map((stage, i) => {
          const StageIcon = stage.icon;
          const isActive = i === activeStage;
          const isPast = i < activeStage;

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
                    isActive && stage.color,
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
