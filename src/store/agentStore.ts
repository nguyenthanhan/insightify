import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  Message,
  DashboardType,
  UserRole,
  UserPreferences,
  MessageType,
} from "@/types/agent";
import { AIAgent, createAIAgent } from "@/lib/agent/aiAgent";
import { ProviderConfig, AgentResponse } from "@/lib/agent/types";
import { getWelcomeMessage } from "@/lib/agent/templates";
import { registerDashboardTools } from "@/lib/agent/tools/dashboardTools";

// Default provider config (mock mode)
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: "openai",
  model: "gpt-4",
  apiKey: "", // Empty key triggers degraded mode
};

interface AgentState {
  // UI State
  isDialogOpen: boolean;
  isProcessing: boolean;
  isStreaming: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isDegradedMode: boolean;

  // Conversation
  messages: Message[];
  currentInput: string;
  activeRequestId: string | null;

  // Context
  currentDashboard: DashboardType;
  userRole: UserRole;
  userPreferences: UserPreferences;

  // Provider
  providerConfig: ProviderConfig;

  // Actions
  toggleChatDialog: () => void;
  setCurrentInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  cancelRequest: () => void;
  clearConversation: () => void;
  setDashboard: (dashboard: DashboardType) => void;
  setTheme: (theme: "light" | "dark") => void;
  addWelcomeMessage: () => void;
  setProviderConfig: (config: ProviderConfig) => Promise<void>;
  getAgent: () => AIAgent;
}

// Singleton agent instance
let agentInstance: AIAgent | null = null;

function getOrCreateAgent(config: ProviderConfig): AIAgent {
  if (!agentInstance) {
    agentInstance = createAIAgent({ provider: config });
    // Register dashboard tools
    registerDashboardTools(agentInstance.getToolRegistry());
  }
  return agentInstance;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      // Initial state
      isDialogOpen: false,
      isProcessing: false,
      isStreaming: false,
      hasError: false,
      errorMessage: null,
      isDegradedMode: true, // Start in degraded mode until provider is configured
      messages: [],
      currentInput: "",
      activeRequestId: null,
      currentDashboard: "sales",
      userRole: "admin",
      userPreferences: {
        theme: "light",
        verbosity: "detailed",
        formats: ["text", "chart", "table", "insight"],
        dashboardType: "sales",
      },
      providerConfig: DEFAULT_PROVIDER_CONFIG,

      // Actions
      toggleChatDialog: () => {
        const state = get();
        set({ isDialogOpen: !state.isDialogOpen });

        // Add welcome message on first open
        if (!state.isDialogOpen && state.messages.length === 0) {
          get().addWelcomeMessage();
        }
      },

      setCurrentInput: (input: string) => {
        set({ currentInput: input });
      },

      sendMessage: async (content: string) => {
        const state = get();
        const agent = getOrCreateAgent(state.providerConfig);
        const requestId = uuidv4();

        try {
          // Add user message
          const userMessage: Message = {
            id: uuidv4(),
            role: "user",
            content,
            type: "text",
            timestamp: new Date().toISOString(),
          };

          set({
            messages: [...state.messages, userMessage],
            currentInput: "",
            isProcessing: true,
            isStreaming: true,
            hasError: false,
            errorMessage: null,
            activeRequestId: requestId,
          });

          // Create placeholder for assistant message
          const assistantMessageId = uuidv4();
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            type: "text",
            timestamp: new Date().toISOString(),
          };

          set({
            messages: [...get().messages, assistantMessage],
          });

          // Process query using AIAgent
          const generator = agent.processQuery({
            query: content,
            context: agent.getContext(),
            dashboardType: state.currentDashboard,
            requestId,
          });

          for await (const response of generator) {
            // Update the assistant message with streaming content
            const currentMessages = get().messages;
            const updatedMessages = currentMessages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: response.content,
                    type: response.type as MessageType,
                    data: response.data,
                  }
                : msg
            );

            set({
              messages: updatedMessages,
              isDegradedMode: agent.isDegradedMode(),
            });
          }

          set({
            isProcessing: false,
            isStreaming: false,
            activeRequestId: null,
          });
        } catch (error) {
          console.error("Error processing message:", error);
          set({
            hasError: true,
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to process your message. Please try again.",
            isProcessing: false,
            isStreaming: false,
            activeRequestId: null,
          });
        }
      },

      cancelRequest: () => {
        const state = get();
        if (state.activeRequestId) {
          const agent = getOrCreateAgent(state.providerConfig);
          agent.cancelRequest(state.activeRequestId);
          set({
            isProcessing: false,
            isStreaming: false,
            activeRequestId: null,
          });
        }
      },

      clearConversation: () => {
        const state = get();
        const agent = getOrCreateAgent(state.providerConfig);
        agent.clearContext();

        set({
          messages: [],
          hasError: false,
          errorMessage: null,
        });
        get().addWelcomeMessage();
      },

      setDashboard: (dashboard: DashboardType) => {
        set({
          currentDashboard: dashboard,
          userPreferences: {
            ...get().userPreferences,
            dashboardType: dashboard,
          },
        });
      },

      setTheme: (theme: "light" | "dark") => {
        set({
          userPreferences: {
            ...get().userPreferences,
            theme,
          },
        });

        // Apply theme to document
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      addWelcomeMessage: () => {
        const state = get();
        const welcomeMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: getWelcomeMessage(state.currentDashboard),
          type: "text",
          timestamp: new Date().toISOString(),
        };

        set({ messages: [welcomeMessage] });
      },

      setProviderConfig: async (config: ProviderConfig) => {
        const agent = getOrCreateAgent(get().providerConfig);
        await agent.switchProvider(config);

        set({
          providerConfig: config,
          isDegradedMode: agent.isDegradedMode(),
        });
      },

      getAgent: () => {
        return getOrCreateAgent(get().providerConfig);
      },
    }),
    {
      name: "dashboard-ai-agent-v2",
      partialize: (state) => ({
        messages: state.messages,
        currentDashboard: state.currentDashboard,
        userPreferences: state.userPreferences,
        providerConfig: state.providerConfig,
      }),
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as Partial<AgentState>;
        // Ensure dashboardType exists in userPreferences
        const mergedState = {
          ...currentState,
          ...persisted,
        };

        if (
          mergedState.userPreferences &&
          !mergedState.userPreferences.dashboardType
        ) {
          mergedState.userPreferences.dashboardType =
            mergedState.currentDashboard || "sales";
        }

        return mergedState;
      },
    }
  )
);

// Export helper to get agent instance directly
export function getAgentInstance(): AIAgent {
  const state = useAgentStore.getState();
  return getOrCreateAgent(state.providerConfig);
}
