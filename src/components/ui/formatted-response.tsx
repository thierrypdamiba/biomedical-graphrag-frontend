"use client";

import * as React from "react";
import { ExternalLink, Database, GitBranch, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormattedResponseProps {
  content: string;
  className?: string;
}

// Parse PMID references and make them clickable
function parsePMIDs(text: string): React.ReactNode[] {
  // Match PMID patterns: "PMID: 12345", "PMID:12345", "(PMID: 12345)"
  const pmidRegex = /\(?(PMID:?\s*)(\d+)\)?/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pmidRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const pmid = match[2];
    parts.push(
      <a
        key={`pmid-${match.index}`}
        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--blue)]/10 text-[var(--blue)] hover:bg-[var(--blue)]/20 transition-colors text-xs font-mono"
      >
        PMID:{pmid}
        <ExternalLink className="h-3 w-3" />
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Parse markdown-style bold and make it actual bold
function parseBold(nodes: React.ReactNode[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (typeof node !== "string") return node;

    const boldRegex = /\*\*(.+?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(node)) !== null) {
      if (match.index > lastIndex) {
        parts.push(node.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={`bold-${i}-${match.index}`} className="font-semibold text-[var(--text-primary)]">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < node.length) {
      parts.push(node.slice(lastIndex));
    }

    return parts.length > 0 ? parts : node;
  }).flat();
}

// Detect section headers and add icons
function getSectionIcon(line: string): React.ReactNode | null {
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes("qdrant") || lowerLine.includes("vector")) {
    return <Database className="h-4 w-4 text-[var(--blue)]" />;
  }
  if (lowerLine.includes("neo4j") || lowerLine.includes("graph")) {
    return <GitBranch className="h-4 w-4 text-[var(--violet)]" />;
  }
  if (lowerLine.includes("conclusion") || lowerLine.includes("synthesis") || lowerLine.includes("summary")) {
    return <Lightbulb className="h-4 w-4 text-[var(--amber)]" />;
  }
  return null;
}

export function FormattedResponse({ content, className }: FormattedResponseProps) {
  const lines = content.split("\n");

  return (
    <div className={cn("space-y-3", className)}>
      {lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
          return <div key={lineIndex} className="h-2" />;
        }

        // Main headers (### )
        if (trimmedLine.startsWith("### ")) {
          const headerText = trimmedLine.slice(4);
          const icon = getSectionIcon(headerText);
          return (
            <h3
              key={lineIndex}
              className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mt-4 first:mt-0"
            >
              {icon}
              {parseBold(parsePMIDs(headerText))}
            </h3>
          );
        }

        // Sub headers (** at start)
        if (trimmedLine.startsWith("**") && trimmedLine.includes(":**")) {
          const icon = getSectionIcon(trimmedLine);
          return (
            <h4
              key={lineIndex}
              className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mt-3"
            >
              {icon}
              {parseBold(parsePMIDs(trimmedLine))}
            </h4>
          );
        }

        // Numbered list items (1. 2. 3.)
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          const [, num, text] = numberedMatch;
          return (
            <div
              key={lineIndex}
              className="flex gap-3 pl-1"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--violet)]/10 text-xs font-medium text-[var(--violet)]">
                {num}
              </span>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                {parseBold(parsePMIDs(text))}
              </p>
            </div>
          );
        }

        // Bullet points (- )
        if (trimmedLine.startsWith("- ")) {
          const text = trimmedLine.slice(2);
          return (
            <div
              key={lineIndex}
              className="flex gap-3 pl-1"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                {parseBold(parsePMIDs(text))}
              </p>
            </div>
          );
        }

        // Regular paragraphs
        return (
          <p
            key={lineIndex}
            className="text-sm text-[var(--text-secondary)] leading-relaxed"
          >
            {parseBold(parsePMIDs(trimmedLine))}
          </p>
        );
      })}
    </div>
  );
}
