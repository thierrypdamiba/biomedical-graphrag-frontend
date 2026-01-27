import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Query settings
  topK: number;
  setTopK: (k: number) => void;

  // Artifacts pane
  artifactsPaneOpen: boolean;
  toggleArtifactsPane: () => void;
  activeArtifactTab: "results" | "trace";
  setActiveArtifactTab: (tab: "results" | "trace") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: "dark",
      setTheme: (theme) => set({ theme }),

      // Query settings
      topK: 5,
      setTopK: (k) => set({ topK: k }),

      // Artifacts pane
      artifactsPaneOpen: true,
      toggleArtifactsPane: () => set((state) => ({ artifactsPaneOpen: !state.artifactsPaneOpen })),
      activeArtifactTab: "results",
      setActiveArtifactTab: (tab) => set({ activeArtifactTab: tab }),
    }),
    {
      name: "qdrant-demo-storage",
      partialize: (state) => ({
        theme: state.theme,
        topK: state.topK,
      }),
    }
  )
);
