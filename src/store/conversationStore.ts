import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Message } from "@/types/agent";

interface ConversationState {
  messages: Message[];
  currentInput: string;
  activeRequestId: string | null;
}

interface ConversationActions {
  addMessage: (message: Message) => void;
  addUserMessage: (content: string) => Message;
  addAssistantMessage: () => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setCurrentInput: (input: string) => void;
  clearConversation: () => void;
  setActiveRequestId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
}

export type ConversationStore = ConversationState & ConversationActions;

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      currentInput: "",
      activeRequestId: null,

      // Actions
      addMessage: (message: Message) => {
        set({ messages: [...get().messages, message] });
      },

      addUserMessage: (content: string) => {
        const userMessage: Message = {
          id: uuidv4(),
          role: "user",
          content,
          type: "text",
          timestamp: new Date().toISOString(),
        };
        set({
          messages: [...get().messages, userMessage],
          currentInput: "",
        });
        return userMessage;
      },

      addAssistantMessage: () => {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: "",
          type: "text",
          timestamp: new Date().toISOString(),
        };
        set({ messages: [...get().messages, assistantMessage] });
        return assistantMessage;
      },

      updateMessage: (id: string, updates: Partial<Message>) => {
        const messages = get().messages.map((msg) =>
          msg.id === id ? { ...msg, ...updates } : msg,
        );
        set({ messages });
      },

      setCurrentInput: (input: string) => {
        set({ currentInput: input });
      },

      clearConversation: () => {
        set({ messages: [] });
      },

      setActiveRequestId: (id: string | null) => {
        set({ activeRequestId: id });
      },

      setMessages: (messages: Message[]) => {
        set({ messages });
      },
    }),
    {
      name: "conversation-store",
      partialize: (state) => ({
        messages: state.messages,
      }),
    },
  ),
);

export default useConversationStore;
