/**
 * Optimized Zustand selectors to prevent unnecessary re-renders
 * Use these selectors instead of accessing store directly
 */

import { AgentState } from "./agentStore";

/**
 * UI State Selectors
 */
export const selectIsDialogOpen = (state: AgentState) => state.isDialogOpen;
export const selectIsProcessing = (state: AgentState) => state.isProcessing;
export const selectIsStreaming = (state: AgentState) => state.isStreaming;
export const selectHasError = (state: AgentState) => state.hasError;
export const selectErrorMessage = (state: AgentState) => state.errorMessage;
export const selectIsDegradedMode = (state: AgentState) => state.isDegradedMode;

/**
 * Conversation Selectors
 */
export const selectMessages = (state: AgentState) => state.getMessages();
export const selectCurrentInput = (state: AgentState) => state.currentInput;
export const selectActiveRequestId = (state: AgentState) =>
  state.activeRequestId;
export const selectMessageCount = (state: AgentState) =>
  state.getMessageCount();
export const selectRecentMessages = (count: number) => (state: AgentState) =>
  state.getRecentMessages(count);

/**
 * Context Selectors
 */
export const selectCurrentDashboard = (state: AgentState) =>
  state.currentDashboard;
export const selectUserRole = (state: AgentState) => state.userRole;
export const selectUserPreferences = (state: AgentState) =>
  state.userPreferences;

/**
 * Provider Selectors
 */
export const selectProviderConfig = (state: AgentState) => state.providerConfig;

/**
 * Action Selectors
 */
export const selectToggleChatDialog = (state: AgentState) =>
  state.toggleChatDialog;
export const selectSetCurrentInput = (state: AgentState) =>
  state.setCurrentInput;
export const selectSendMessage = (state: AgentState) => state.sendMessage;
export const selectCancelRequest = (state: AgentState) => state.cancelRequest;
export const selectClearConversation = (state: AgentState) =>
  state.clearConversation;
export const selectSetDashboard = (state: AgentState) => state.setDashboard;
export const selectSetTheme = (state: AgentState) => state.setTheme;

/**
 * Composite Selectors (combine multiple values)
 */
export const selectUIState = (state: AgentState) => ({
  isDialogOpen: state.isDialogOpen,
  isProcessing: state.isProcessing,
  isStreaming: state.isStreaming,
  hasError: state.hasError,
  errorMessage: state.errorMessage,
  isDegradedMode: state.isDegradedMode,
});

export const selectConversationState = (state: AgentState) => ({
  messages: state.getMessages(),
  currentInput: state.currentInput,
  activeRequestId: state.activeRequestId,
  messageCount: state.getMessageCount(),
});

export const selectContextState = (state: AgentState) => ({
  currentDashboard: state.currentDashboard,
  userRole: state.userRole,
  userPreferences: state.userPreferences,
});

/**
 * Derived Selectors (computed values)
 */
export const selectHasMessages = (state: AgentState) =>
  state.getMessageCount() > 0;

export const selectLastMessage = (state: AgentState) => {
  const messages = state.getMessages();
  return messages[messages.length - 1] || null;
};

export const selectCanSendMessage = (state: AgentState) =>
  !state.isProcessing && state.currentInput.trim().length > 0;

export const selectTheme = (state: AgentState) => state.userPreferences.theme;

/**
 * Usage Examples:
 *
 * // Single value (re-renders only when this value changes)
 * const isProcessing = useAgentStore(selectIsProcessing);
 *
 * // Multiple values with shallow comparison
 * const { isDialogOpen, isProcessing } = useAgentStore(selectUIState, shallow);
 *
 * // Derived value
 * const canSend = useAgentStore(selectCanSendMessage);
 *
 * // Action only (never re-renders)
 * const sendMessage = useAgentStore(selectSendMessage);
 */
