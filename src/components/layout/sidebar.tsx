"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const navItems = [
  { name: "Assistant", href: "/assistant", icon: MessageSquare },
  { name: "Get Started", href: "/get-started", icon: Rocket },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStore();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[var(--stroke-1)] bg-[var(--bg-1)] transition-all duration-300",
          // Desktop: show based on collapsed state
          "hidden lg:flex",
          sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]",
          // Mobile: show as overlay when menu is open
          mobileMenuOpen && "flex w-[280px]"
        )}
      >
      {/* Header */}
      <div className="flex h-14 items-center justify-between gap-3 border-b border-[var(--stroke-1)] px-4">
        <div className="flex items-center gap-3">
          <Image
            src="/qdrant-logo.png"
            alt="Qdrant"
            width={32}
            height={32}
            className="shrink-0"
          />
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <span className="font-semibold text-[var(--text-primary)]">
              BioMed GraphRAG
            </span>
          )}
        </div>
        {/* Mobile close button */}
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const showText = !sidebarCollapsed || mobileMenuOpen;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--bg-2)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]",
                    !showText && "justify-center px-2"
                  )}
                  title={!showText ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {showText && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Powered by section */}
      {(!sidebarCollapsed || mobileMenuOpen) && (
        <div className="border-t border-[var(--stroke-1)] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
            Powered by
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://qdrant.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              title="Qdrant Vector Database"
            >
              <Image
                src="/qdrant-logo.png"
                alt="Qdrant"
                width={24}
                height={24}
              />
            </a>
            <a
              href="https://neo4j.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded bg-white hover:bg-gray-100 transition-all"
              title="Neo4j Graph Database"
            >
              <Image
                src="/neo4j-logo.png"
                alt="Neo4j"
                width={50}
                height={20}
                className="object-contain"
              />
            </a>
          </div>
        </div>
      )}

      {/* Footer - collapse button */}
      <div className="hidden lg:block border-t border-[var(--stroke-1)] p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-tertiary)] hover:bg-[var(--bg-2)] hover:text-[var(--text-primary)]"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
