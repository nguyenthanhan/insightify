import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAgentStore, getAgentInstance } from "./agentStore";

// Mock uuid
vi.mock("uuid", () => ({
  v4: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
}));

describe("AgentStore Integration", () => {
  beforeEach(() => {
    // Reset store state
    useAgentStore.setState({
      isDialogOpen: false,
      isProcessing: false,
      isStreaming: false,
      hasError: false,
      errorMessage: null,
      isDegradedMode: true,
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
      providerConfig: {
        type: "openai",
        model: "gpt-4",
        apiKey: "",
      },
    });

    // Clear paginator
    const store = useAgentStore.getState();
    store.clearConversation();
  });

  describe("Dialog State", () => {
    it("should toggle chat dialog", () => {
      const store = useAgentStore.getState();
      expect(store.isDialogOpen).toBe(false);

      store.toggleChatDialog();
      expect(useAgentStore.getState().isDialogOpen).toBe(true);

      store.toggleChatDialog();
      expect(useAgentStore.getState().isDialogOpen).toBe(false);
    });

    it("should add welcome message on first dialog open", () => {
      const store = useAgentStore.getState();
      // After clearConversation, paginator is empty
      expect(store.getMessageCount()).toBe(0);

      store.toggleChatDialog();
      // Should add welcome message when opening with empty conversation
      expect(useAgentStore.getState().getMessageCount()).toBe(1);
      expect(useAgentStore.getState().getMessages()[0].role).toBe("assistant");
    });
  });

  describe("Input State", () => {
    it("should update current input", () => {
      const store = useAgentStore.getState();
      store.setCurrentInput("test query");
      expect(useAgentStore.getState().currentInput).toBe("test query");
    });
  });

  describe("Message Flow", () => {
    it("should add user message when sending", async () => {
      const store = useAgentStore.getState();

      // Start sending (don't await to check intermediate state)
      const sendPromise = store.sendMessage("Hello AI");

      // Check user message was added
      await vi.waitFor(() => {
        const state = useAgentStore.getState();
        const messages = state.getMessages();
        return messages.some(
          (m: { role: string; content: string }) =>
            m.role === "user" && m.content === "Hello AI",
        );
      });

      await sendPromise;
    });

    it("should clear input after sending message", async () => {
      const store = useAgentStore.getState();
      store.setCurrentInput("test message");

      await store.sendMessage("test message");

      expect(useAgentStore.getState().currentInput).toBe("");
    });

    it("should set processing state during message handling", async () => {
      const store = useAgentStore.getState();

      const sendPromise = store.sendMessage("test");

      // Should be processing
      await vi.waitFor(() => {
        return useAgentStore.getState().isProcessing === true;
      });

      await sendPromise;

      // Should no longer be processing
      expect(useAgentStore.getState().isProcessing).toBe(false);
    });

    it("should add assistant response after processing", async () => {
      const store = useAgentStore.getState();

      await store.sendMessage("What are my sales metrics?");

      const state = useAgentStore.getState();
      const messages = state.getMessages();
      const assistantMessages = messages.filter(
        (m: { role: string }) => m.role === "assistant",
      );
      expect(assistantMessages.length).toBeGreaterThan(0);
    });
  });

  describe("Conversation Management", () => {
    it("should clear conversation", async () => {
      const store = useAgentStore.getState();

      // Add some messages
      await store.sendMessage("test message");
      expect(useAgentStore.getState().getMessageCount()).toBeGreaterThan(0);

      // Clear conversation
      store.clearConversation();

      const state = useAgentStore.getState();
      // After clear, paginator is empty
      expect(state.getMessageCount()).toBe(0);
    });
  });

  describe("Dashboard Context", () => {
    it("should update dashboard type", () => {
      const store = useAgentStore.getState();

      store.setDashboard("analytics");

      const state = useAgentStore.getState();
      expect(state.currentDashboard).toBe("analytics");
      expect(state.userPreferences.dashboardType).toBe("analytics");
    });
  });

  describe("Theme Management", () => {
    it("should update theme preference", () => {
      const store = useAgentStore.getState();

      store.setTheme("dark");

      expect(useAgentStore.getState().userPreferences.theme).toBe("dark");
    });
  });

  describe("Agent Instance", () => {
    it("should return agent instance", () => {
      const agent = getAgentInstance();
      expect(agent).toBeDefined();
      expect(typeof agent.processQuery).toBe("function");
    });

    it("should return same agent instance on multiple calls", () => {
      const agent1 = getAgentInstance();
      const agent2 = getAgentInstance();
      expect(agent1).toBe(agent2);
    });

    it("should have dashboard tools registered", () => {
      const agent = getAgentInstance();
      const tools = agent.getToolRegistry().list();

      expect(tools.some((t) => t.name === "get_metrics")).toBe(true);
      expect(tools.some((t) => t.name === "get_chart_data")).toBe(true);
    });
  });

  describe("Degraded Mode", () => {
    it("should start in degraded mode with empty API key", () => {
      const state = useAgentStore.getState();
      expect(state.isDegradedMode).toBe(true);
    });

    it("should indicate degraded mode from agent", async () => {
      const store = useAgentStore.getState();
      await store.sendMessage("test");

      const agent = getAgentInstance();
      expect(agent.isDegradedMode()).toBe(true);
    });
  });

  describe("Request Cancellation", () => {
    it("should be able to cancel active request", async () => {
      const store = useAgentStore.getState();

      // Start a request
      const sendPromise = store.sendMessage("test");

      // Wait for request to start
      await vi.waitFor(() => {
        return useAgentStore.getState().activeRequestId !== null;
      });

      // Cancel it
      store.cancelRequest();

      expect(useAgentStore.getState().activeRequestId).toBe(null);
      expect(useAgentStore.getState().isProcessing).toBe(false);

      // Wait for original promise to complete
      await sendPromise.catch(() => {});
    });
  });
});
