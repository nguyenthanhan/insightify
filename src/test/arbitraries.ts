import * as fc from "fast-check";
import { MessageType, ChartData, TableData, InsightData } from "@/types/agent";
import { ParsedResponse } from "@/lib/agent/parser/messageParser";
import {
  ConversationContext,
  ContextMessage,
  ContextMetadata,
  AgentResponse,
} from "@/lib/agent/types";

// ============ Basic Arbitraries ============

export const messageTypeArb = fc.constantFrom<MessageType>(
  "text",
  "chart",
  "table",
  "insight",
  "error"
);

export const dashboardTypeArb = fc.constantFrom(
  "sales",
  "analytics",
  "financial",
  "operations",
  "hr",
  "ecommerce"
);

export const severityArb = fc.constantFrom<
  "info" | "warning" | "success" | "error"
>("info", "warning", "success", "error");

export const chartTypeArb = fc.constantFrom<"line" | "bar" | "pie" | "area">(
  "line",
  "bar",
  "pie",
  "area"
);

// ============ Data Arbitraries ============

export const chartDataArb: fc.Arbitrary<ChartData> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  data: fc.array(
    fc.record({
      x: fc.oneof(fc.string(), fc.integer()),
      y: fc.integer({ min: 0, max: 10000 }),
    }),
    { minLength: 0, maxLength: 20 }
  ),
  chartType: chartTypeArb,
  xKey: fc.constant("x"),
  yKey: fc.constant("y"),
});

export const tableDataArb: fc.Arbitrary<TableData> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  headers: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 1,
    maxLength: 10,
  }),
  rows: fc.array(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.oneof(fc.string(), fc.integer())
    ),
    { minLength: 0, maxLength: 50 }
  ),
});

export const insightDataArb: fc.Arbitrary<InsightData> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: undefined,
  }),
  severity: severityArb,
});

// ============ ParsedResponse Arbitraries ============

export const textParsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.record({
  type: fc.constant<MessageType>("text"),
  content: fc.string({ minLength: 0, maxLength: 1000 }),
  confidence: fc.integer({ min: 0, max: 100 }),
});

export const chartParsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.record({
  type: fc.constant<MessageType>("chart"),
  content: fc.string({ minLength: 0, maxLength: 500 }),
  data: chartDataArb,
  confidence: fc.integer({ min: 0, max: 100 }),
});

export const tableParsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.record({
  type: fc.constant<MessageType>("table"),
  content: fc.string({ minLength: 0, maxLength: 500 }),
  data: tableDataArb,
  confidence: fc.integer({ min: 0, max: 100 }),
});

export const insightParsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.record(
  {
    type: fc.constant<MessageType>("insight"),
    content: fc.string({ minLength: 0, maxLength: 500 }),
    data: insightDataArb,
    confidence: fc.integer({ min: 0, max: 100 }),
  }
);

export const errorParsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.record({
  type: fc.constant<MessageType>("error"),
  content: fc.string({ minLength: 0, maxLength: 500 }),
  confidence: fc.integer({ min: 0, max: 100 }),
});

export const parsedResponseArb: fc.Arbitrary<ParsedResponse> = fc.oneof(
  textParsedResponseArb,
  chartParsedResponseArb,
  tableParsedResponseArb,
  insightParsedResponseArb,
  errorParsedResponseArb
);

// ============ Context Arbitraries ============

export const contextMessageArb: fc.Arbitrary<ContextMessage> = fc.record({
  id: fc.uuid(),
  role: fc.constantFrom<"user" | "assistant" | "system" | "tool">(
    "user",
    "assistant",
    "system",
    "tool"
  ),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  timestamp: fc.date().map((d) => d.toISOString()),
  tokenCount: fc.integer({ min: 1, max: 1000 }),
  summarized: fc.option(fc.boolean(), { nil: undefined }),
});

export const contextMetadataArb: fc.Arbitrary<ContextMetadata> = fc.record({
  dashboardType: dashboardTypeArb as fc.Arbitrary<any>,
  createdAt: fc.date().map((d) => d.toISOString()),
  lastUpdatedAt: fc.date().map((d) => d.toISOString()),
  messageCount: fc.integer({ min: 0, max: 100 }),
});

export const conversationContextArb: fc.Arbitrary<ConversationContext> =
  fc.record({
    id: fc.uuid(),
    messages: fc.array(contextMessageArb, { minLength: 0, maxLength: 20 }),
    systemPrompt: fc.string({ minLength: 10, maxLength: 500 }),
    metadata: contextMetadataArb,
    tokenCount: fc.integer({ min: 0, max: 10000 }),
  });

// ============ Agent Response Arbitraries ============

export const agentResponseArb: fc.Arbitrary<AgentResponse> = fc.record({
  content: fc.string({ minLength: 0, maxLength: 1000 }),
  type: messageTypeArb,
  data: fc.option(fc.oneof(chartDataArb, tableDataArb, insightDataArb), {
    nil: undefined,
  }),
  cached: fc.boolean(),
  provider: fc.string({ minLength: 1, maxLength: 50 }),
  partial: fc.option(fc.boolean(), { nil: undefined }),
});
