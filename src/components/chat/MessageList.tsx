import { useEffect, useRef, useCallback } from "react";
import { Message } from "@/types/agent";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import { VirtualList } from "@/components/ui/VirtualList";

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
}

// Threshold for enabling virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 50;

// Fixed height for message items (VirtualList requires fixed height)
const MESSAGE_ITEM_HEIGHT = 100;

export function MessageList({ messages, isProcessing }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use virtual scrolling only for large message lists
  const useVirtualScrolling = messages.length > VIRTUAL_SCROLL_THRESHOLD;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (useVirtualScrolling && containerRef.current) {
      // For virtual list, scroll container to bottom
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing, useVirtualScrolling]);

  // Render function for virtual list items
  const renderMessage = useCallback(
    (message: Message, _index: number) => (
      <MessageItem key={message.id} message={message} />
    ),
    [],
  );

  // Get unique key for each message
  const getMessageKey = useCallback(
    (message: Message, _index: number) => message.id,
    [],
  );

  // Virtual scrolling for large lists
  if (useVirtualScrolling) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={containerRef} className="flex-1">
          <VirtualList
            items={messages}
            itemHeight={MESSAGE_ITEM_HEIGHT}
            renderItem={renderMessage}
            getItemKey={getMessageKey}
            containerHeight="100%"
            overscan={5}
            threshold={VIRTUAL_SCROLL_THRESHOLD}
            className="p-4"
          />
        </div>
        {isProcessing && (
          <div className="px-4 pb-4 flex-shrink-0">
            <TypingIndicator />
          </div>
        )}
      </div>
    );
  }

  // Standard rendering for small lists
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isProcessing && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
