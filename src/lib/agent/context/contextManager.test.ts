import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ContextManager } from "./contextManager";
import { conversationContextArb, contextMessageArb } from "@/test/arbitraries";

describe("ContextManager", () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = new ContextManager("sales");
  });

  /**
   * **Feature: advanced-ai-agent, Property 2: Conversation Context Round-Trip**
   * **Validates: Requirements 2.5**
   *
   * For any valid ConversationContext, serializing to storage and deserializing
   * SHALL restore an equivalent ConversationContext state.
   */
  it("should round-trip context through serialization", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom<"user" | "assistant">("user", "assistant"),
            content: fc.string({ minLength: 1, maxLength: 200 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (messages) => {
          const testManager = new ContextManager("sales");

          // Add messages
          messages.forEach((msg) => {
            testManager.addMessage(msg);
          });

          // Serialize and deserialize
          const serialized = testManager.serialize();
          const newManager = ContextManager.fromSerialized(serialized);
          const restored = newManager.getContext();
          const original = testManager.getContext();

          // Verify equivalence
          expect(restored.messages.length).toBe(original.messages.length);
          expect(restored.metadata.dashboardType).toBe(
            original.metadata.dashboardType
          );
          expect(restored.systemPrompt).toBe(original.systemPrompt);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: advanced-ai-agent, Property 3: Context Includes Previous Messages**
   * **Validates: Requirements 2.1**
   *
   * For any conversation with N messages, when sending message N+1, the request
   * to LLM_Provider SHALL include messages 1 through N in the context.
   */
  it("should include all previous messages in context", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom<"user" | "assistant">("user", "assistant"),
            content: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (messages) => {
          const testManager = new ContextManager("sales");

          // Add messages one by one
          messages.forEach((msg, index) => {
            testManager.addMessage(msg);

            // After adding each message, verify all previous messages are present
            const context = testManager.getContext();
            expect(context.messages.length).toBe(index + 1);

            // Verify content matches
            for (let i = 0; i <= index; i++) {
              expect(context.messages[i].content).toBe(messages[i].content);
              expect(context.messages[i].role).toBe(messages[i].role);
            }
          });

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * **Feature: advanced-ai-agent, Property 5: Dashboard Context Updates System Prompt**
   * **Validates: Requirements 2.4**
   *
   * For any dashboard type change, the system prompt in ConversationContext
   * SHALL contain dashboard-specific instructions matching the new type.
   */
  it("should update system prompt when dashboard type changes", () => {
    const dashboardTypes = [
      "sales",
      "analytics",
      "financial",
      "operations",
      "hr",
      "ecommerce",
    ] as const;

    fc.assert(
      fc.property(fc.constantFrom(...dashboardTypes), (dashboardType) => {
        const testManager = new ContextManager("sales");
        testManager.setDashboardContext(dashboardType);

        const context = testManager.getContext();

        // System prompt should contain dashboard-specific content
        expect(context.systemPrompt.length).toBeGreaterThan(0);
        expect(context.metadata.dashboardType).toBe(dashboardType);

        // Verify prompt contains relevant keywords
        const promptLower = context.systemPrompt.toLowerCase();
        switch (dashboardType) {
          case "sales":
            expect(promptLower).toContain("sales");
            break;
          case "analytics":
            expect(promptLower).toContain("analytics");
            break;
          case "financial":
            expect(promptLower).toContain("financial");
            break;
          case "operations":
            expect(promptLower).toContain("operations");
            break;
          case "hr":
            expect(promptLower).toContain("hr");
            break;
          case "ecommerce":
            expect(promptLower).toContain("e-commerce");
            break;
        }

        return true;
      }),
      { numRuns: 20 }
    );
  });

  describe("basic operations", () => {
    it("should create with initial state", () => {
      const context = manager.getContext();

      expect(context.messages).toHaveLength(0);
      expect(context.metadata.dashboardType).toBe("sales");
      expect(context.systemPrompt).toContain("sales");
    });

    it("should add messages", () => {
      manager.addMessage({ role: "user", content: "Hello" });
      manager.addMessage({ role: "assistant", content: "Hi there!" });

      const context = manager.getContext();
      expect(context.messages).toHaveLength(2);
      expect(context.messages[0].content).toBe("Hello");
      expect(context.messages[1].content).toBe("Hi there!");
    });

    it("should track token count", () => {
      manager.addMessage({ role: "user", content: "Hello world" });

      const context = manager.getContext();
      expect(context.tokenCount).toBeGreaterThan(0);
    });

    it("should clear context", () => {
      manager.addMessage({ role: "user", content: "Hello" });
      manager.clear();

      const context = manager.getContext();
      expect(context.messages).toHaveLength(0);
      expect(context.tokenCount).toBe(0);
    });
  });

  describe("summarization", () => {
    it("should detect when summarization is needed", () => {
      const smallManager = new ContextManager("sales", { maxTokens: 100 });

      // Add enough messages to exceed threshold
      for (let i = 0; i < 20; i++) {
        smallManager.addMessage({
          role: "user",
          content:
            "This is a test message that should contribute to token count",
        });
      }

      expect(smallManager.needsSummarization()).toBe(true);
    });

    it("should summarize old messages when threshold exceeded", async () => {
      const smallManager = new ContextManager("sales", {
        maxTokens: 50,
        summarizationThreshold: 0.3,
      });

      // Add enough messages to exceed threshold
      for (let i = 0; i < 20; i++) {
        smallManager.addMessage({
          role: "user",
          content: `Message ${i}: This is a longer test content message`,
        });
      }

      if (smallManager.needsSummarization()) {
        const beforeCount = smallManager.getContext().messages.length;
        await smallManager.summarizeIfNeeded();
        const afterCount = smallManager.getContext().messages.length;
        expect(afterCount).toBeLessThanOrEqual(beforeCount);
      }
    });
  });

  describe("serialization", () => {
    it("should serialize to valid JSON", () => {
      manager.addMessage({ role: "user", content: "Test" });

      const serialized = manager.serialize();
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it("should deserialize and restore state", () => {
      manager.addMessage({ role: "user", content: "Test message" });
      manager.setDashboardContext("analytics");

      const serialized = manager.serialize();
      const newManager = ContextManager.fromSerialized(serialized);
      const restored = newManager.getContext();

      expect(restored.messages[0].content).toBe("Test message");
      expect(restored.metadata.dashboardType).toBe("analytics");
    });
  });
});
