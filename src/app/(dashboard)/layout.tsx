"use client";

import { TopBar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      <TopBar />
      <main className="pt-14">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
