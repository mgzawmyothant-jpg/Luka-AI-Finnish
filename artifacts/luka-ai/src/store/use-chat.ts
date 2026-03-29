import { create } from "zustand";
import type { ChatMessage } from "@workspace/api-client-react";

interface ChatState {
  history: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  history: [],
  addMessage: (msg) => set((state) => ({ history: [...state.history, msg] })),
  clearHistory: () => set({ history: [] }),
}));
