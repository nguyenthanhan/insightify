import { motion } from "framer-motion";
import { Message } from "@/types/agent";
import { cn } from "@/lib/utils/cn";
import { ChartResponse } from "@/components/visualizations/ChartResponse";
import { TableResponse } from "@/components/visualizations/TableResponse";
import { InsightCard } from "@/components/visualizations/InsightCard";
import { Bot, User } from "lucide-react";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        )}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Content */}
      <div className={cn("max-w-sm", isUser && "max-w-xs")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "rounded-br-none bg-blue-500 text-white"
              : "rounded-bl-none bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
          )}
        >
          {/* Text content */}
          {message.type === "text" && (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          )}

          {/* Chart response */}
          {message.type === "chart" &&
            message.data &&
            "chartType" in message.data && (
              <div className="space-y-2">
                <p className="text-sm">{message.content}</p>
                <ChartResponse data={message.data} />
              </div>
            )}

          {/* Table response */}
          {message.type === "table" &&
            message.data &&
            "rows" in message.data && (
              <div className="space-y-2">
                <p className="text-sm">{message.content}</p>
                <TableResponse data={message.data} />
              </div>
            )}

          {/* Insight card */}
          {message.type === "insight" &&
            message.data &&
            "description" in message.data && (
              <div className="space-y-2">
                <p className="text-sm">{message.content}</p>
                <InsightCard data={message.data} />
              </div>
            )}

          {/* Error message */}
          {message.type === "error" && (
            <div className="rounded-lg bg-red-50 p-3 text-red-900 dark:bg-red-900/20 dark:text-red-100">
              <p className="text-sm">{message.content}</p>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
