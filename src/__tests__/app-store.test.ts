import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/app-store";

describe("AppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      theme: "dark",
      topK: 5,
      artifactsPaneOpen: true,
      activeArtifactTab: "results",
    });
  });

  it("has correct default values", () => {
    const state = useAppStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.topK).toBe(5);
    expect(state.artifactsPaneOpen).toBe(true);
    expect(state.activeArtifactTab).toBe("results");
  });

  it("setTopK updates topK value", () => {
    useAppStore.getState().setTopK(3);
    expect(useAppStore.getState().topK).toBe(3);
  });

  it("toggleArtifactsPane toggles the pane", () => {
    expect(useAppStore.getState().artifactsPaneOpen).toBe(true);
    useAppStore.getState().toggleArtifactsPane();
    expect(useAppStore.getState().artifactsPaneOpen).toBe(false);
    useAppStore.getState().toggleArtifactsPane();
    expect(useAppStore.getState().artifactsPaneOpen).toBe(true);
  });

  it("setActiveArtifactTab changes tab", () => {
    useAppStore.getState().setActiveArtifactTab("trace");
    expect(useAppStore.getState().activeArtifactTab).toBe("trace");
  });
});
