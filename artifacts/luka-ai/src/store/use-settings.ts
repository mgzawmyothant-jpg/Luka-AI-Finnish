import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  apiKey: string;
  model: string;
  isSettingsDrawerOpen: boolean;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      model: "gemini-2.0-flash",
      isSettingsDrawerOpen: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      openSettings: () => set({ isSettingsDrawerOpen: true }),
      closeSettings: () => set({ isSettingsDrawerOpen: false }),
    }),
    {
      name: "luka-settings",
      partialize: (state) => ({ apiKey: state.apiKey, model: state.model }),
    }
  )
);

export const MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Fast)" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview (Best)" },
  { id: "gemini-2.0-flash-thinking-exp", label: "Gemini 2.0 Flash Thinking" },
  { id: "gemini-1.5-pro-latest", label: "Gemini 1.5 Pro Latest" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];
