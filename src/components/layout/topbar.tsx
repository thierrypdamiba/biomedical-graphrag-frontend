"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";

export function TopBar() {
  const { theme, setTheme, sidebarCollapsed, toggleMobileMenu } = useAppStore();
  const mounted = useMounted();

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b border-[var(--stroke-1)] bg-[var(--bg-0)] px-4 md:px-6 transition-all duration-300",
        // Mobile: full width
        "left-0",
        // Desktop: account for sidebar
        sidebarCollapsed ? "lg:left-[72px]" : "lg:left-[260px]"
      )}
    >
      {/* Left: Mobile menu + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-[var(--text-primary)] text-sm md:text-base truncate">
          <span className="hidden sm:inline">Biomedical Research Assistant</span>
          <span className="sm:hidden">BioMed GraphRAG</span>
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ThemeIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon">
            <Monitor className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
