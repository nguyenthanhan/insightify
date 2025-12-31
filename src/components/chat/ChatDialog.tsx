import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2, StopCircle, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/store/agentStore";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils/cn";

export function ChatDialog() {
  const {
    isDialogOpen,
    messages,
    isProcessing,
    isStreaming,
    isDegradedMode,
    toggleChatDialog,
    clearConversation,
    cancelRequest,
  } = useAgentStore();

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={toggleChatDialog}>
      <AnimatePresence>
        {isDialogOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "fixed bottom-4 right-4 z-50",
                  "flex h-[32rem] w-96 max-w-[calc(100vw-2rem)] flex-col",
                  "rounded-2xl border border-gray-200 bg-white shadow-2xl",
                  "dark:border-gray-700 dark:bg-gray-900",
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Dashboard Assistant
                    </h2>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Powered by AI
                      </p>
                      {isDegradedMode && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <Zap size={10} />
                          Offline Mode
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStreaming && (
                      <button
                        onClick={cancelRequest}
                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Cancel request"
                        aria-label="Cancel streaming request"
                      >
                        <StopCircle size={18} />
                      </button>
                    )}
                    {messages.length > 1 && !isStreaming && (
                      <button
                        onClick={clearConversation}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        title="Clear conversation"
                        aria-label="Clear conversation history"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <Dialog.Close asChild>
                      <button
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        aria-label="Close dialog"
                      >
                        <X size={20} />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                {/* Messages */}
                <MessageList messages={messages} isProcessing={isProcessing} />

                {/* Input */}
                <ChatInput disabled={isProcessing} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

export default ChatDialog;
