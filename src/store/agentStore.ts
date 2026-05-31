import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
import { secureStorage } from "@/lib/utils/encryption";
import {
  createMessagePaginator,
  MessagePaginator,
} from "@/lib/utils/messagePagination";
import { requestDeduplicator } from "@/lib/utils/requestDeduplication";

// Default provider config (mock mode)
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  type: "openai",
  model: "gpt-4",
  apiKey: "", // Empty key triggers degraded mode
};

export interface AgentState {
  // UI State
  isDialogOpen: boolean;
  isProcessing: boolean;
  isStreaming: boolean;
  hasError: boolean;
  errorMessage: string | null;
  isDegradedMode: boolean;

  // Conversation - now using paginator
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

  // Pagination methods
  getMessages: () => Message[];
  getRecentMessages: (count?: number) => Message[];
  getMessageCount: () => number;
  searchMessages: (query: string) => Message[];
}

// Singleton instances
let agentInstance: AIAgent | null = null;
let messagePaginator: MessagePaginator | null = null;

function getOrCreateAgent(config: ProviderConfig): AIAgent {
  if (!agentInstance) {
    agentInstance = createAIAgent({ provider: config });
    // Register dashboard tools
    registerDashboardTools(agentInstance.getToolRegistry());
  }
  return agentInstance;
}

function getOrCreatePaginator(): MessagePaginator {
  if (!messagePaginator) {
    messagePaginator = createMessagePaginator({
      pageSize: 50,
      maxStoredMessages: 200,
      archiveThreshold: 150,
    });
  }
  return messagePaginator;
}

// Custom storage with encryption
const encryptedStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await secureStorage.getItem(name);
    } catch (error) {
      console.error("Failed to get encrypted item:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await secureStorage.setItem(name, value);
    } catch (error) {
      console.error("Failed to set encrypted item:", error);
    }
  },
  removeItem: (name: string): void => {
    secureStorage.removeItem(name);
  },
};

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
        const paginator = getOrCreatePaginator();
        if (!state.isDialogOpen && paginator.getTotalCount() === 0) {
          get().addWelcomeMessage();
        }
      },

      setCurrentInput: (input: string) => {
        set({ currentInput: input });
      },

      sendMessage: async (content: string) => {
        const state = get();
        const agent = getOrCreateAgent(state.providerConfig);
        const paginator = getOrCreatePaginator();
        const requestId = uuidv4();

        // Use request deduplication
        const dedupKey = `${state.currentDashboard}:${content}`;

        try {
          await requestDeduplicator.execute(dedupKey, async (signal) => {
            // Add user message
            const userMessage: Message = {
              id: uuidv4(),
              role: "user",
              content,
              type: "text",
              timestamp: new Date().toISOString(),
            };

            paginator.addMessage(userMessage);

            set({
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

            paginator.addMessage(assistantMessage);

            // Process query using AIAgent
            const generator = agent.processQuery({
              query: content,
              context: agent.getContext(),
              dashboardType: state.currentDashboard,
              requestId,
            });

            for await (const response of generator) {
              // Check if aborted
              if (signal.aborted) {
                throw new Error("Request cancelled");
              }

              // Update the assistant message with streaming content
              paginator.updateMessage(assistantMessageId, (message) => ({
                ...message,
                content: response.content,
                type: response.type as MessageType,
                data: response.data,
              }));

              set({
                isDegradedMode: agent.isDegradedMode(),
              });
            }

            set({
              isProcessing: false,
              isStreaming: false,
              activeRequestId: null,
            });
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
        const paginator = getOrCreatePaginator();

        agent.clearContext();
        paginator.clear();

        set({
          hasError: false,
          errorMessage: null,
        });
        // Don't add welcome message automatically
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
        const paginator = getOrCreatePaginator();
        const welcomeMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: getWelcomeMessage(state.currentDashboard),
          type: "text",
          timestamp: new Date().toISOString(),
        };

        paginator.addMessage(welcomeMessage);
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

      // Pagination methods
      getMessages: () => {
        const paginator = getOrCreatePaginator();
        return paginator.getRecent(50); // Get recent 50 messages
      },

      getRecentMessages: (count = 50) => {
        const paginator = getOrCreatePaginator();
        return paginator.getRecent(count);
      },

      getMessageCount: () => {
        const paginator = getOrCreatePaginator();
        return paginator.getTotalCount();
      },

      searchMessages: (query: string) => {
        const paginator = getOrCreatePaginator();
        return paginator.search(query);
      },
    }),
    {
      name: "dashboard-ai-agent-v3",
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await encryptedStorage.getItem(name);
          return value;
        },
        setItem: async (name: string, value: string) => {
          await encryptedStorage.setItem(name, value);
        },
        removeItem: (name: string) => {
          encryptedStorage.removeItem(name);
        },
      })),
      partialize: (state) => {
        const paginator = getOrCreatePaginator();
        return {
          messages: paginator.export(), // Export paginated messages
          currentDashboard: state.currentDashboard,
          userPreferences: state.userPreferences,
          providerConfig: {
            ...state.providerConfig,
            apiKey: "", // Never persist API keys
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore messages to paginator
          const paginator = getOrCreatePaginator();
          const persistedMessages = (state as any).messages;
          if (persistedMessages) {
            paginator.import(persistedMessages);
          }
        }
      },
      merge: (persistedState: unknown, currentState) => {
        const persisted = persistedState as Partial<AgentState>;
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
    },
  ),
);

// Export helper to get agent instance directly
export function getAgentInstance(): AIAgent {
  const state = useAgentStore.getState();
  return getOrCreateAgent(state.providerConfig);
}
