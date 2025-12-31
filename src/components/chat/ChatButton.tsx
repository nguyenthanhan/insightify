import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/store/agentStore";

export function ChatButton() {
  const { toggleChatDialog, isDialogOpen } = useAgentStore();

  if (isDialogOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleChatDialog}
      className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
      aria-label="Open chat"
    >
      <MessageCircle size={24} />
    </motion.button>
  );
}

export default ChatButton;
