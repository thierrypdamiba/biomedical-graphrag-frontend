"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, GitBranch, Brain, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#DC244C]/10 via-transparent to-[#018BFF]/10" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/qdrant-logo.png"
                alt="Biomedical GraphRAG"
                width={80}
                height={80}
                className="drop-shadow-lg"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--text-primary)] mb-4">
              Biomedical GraphRAG
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              AI-powered research assistant combining vector search with knowledge graphs
              to explore biomedical literature
            </p>

            {/* CTA */}
            <Link href="/assistant">
              <Button variant="primary" size="lg" className="gap-2 text-base px-8">
                Start Exploring
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="bg-[var(--bg-1)] rounded-xl p-6 border border-[var(--stroke-1)]">
              <div className="w-12 h-12 rounded-lg bg-[#DC244C]/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-[#DC244C]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Vector Search
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Semantic search across PubMed papers using Qdrant&apos;s hybrid dense-sparse retrieval
              </p>
            </div>

            <div className="bg-[var(--bg-1)] rounded-xl p-6 border border-[var(--stroke-1)]">
              <div className="w-12 h-12 rounded-lg bg-[#018BFF]/10 flex items-center justify-center mb-4">
                <GitBranch className="h-6 w-6 text-[#018BFF]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Knowledge Graph
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Enriched context from Neo4j graph relationships between genes, diseases, and papers
              </p>
            </div>

            <div className="bg-[var(--bg-1)] rounded-xl p-6 border border-[var(--stroke-1)]">
              <div className="w-12 h-12 rounded-lg bg-[var(--violet)]/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-[var(--violet)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                AI Synthesis
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                GPT-powered summaries with citations linking directly to PubMed sources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Powered By Section */}
      <div className="border-t border-[var(--stroke-1)]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-center text-sm text-[var(--text-tertiary)] mb-6">
            POWERED BY
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <a
              href="https://qdrant.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-[var(--stroke-1)]"
            >
              <Image
                src="/qdrant-logo.png"
                alt="Qdrant"
                width={32}
                height={32}
              />
              <span className="text-[var(--text-primary)] font-medium">Qdrant</span>
            </a>
            <a
              href="https://neo4j.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-gray-100 transition-all border border-gray-200"
            >
              <Image
                src="/neo4j-logo.png"
                alt="Neo4j"
                width={80}
                height={32}
                className="object-contain"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--stroke-1)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            Built with Qdrant Vector Database and Neo4j Knowledge Graph
          </p>
        </div>
      </div>
    </div>
  );
}
