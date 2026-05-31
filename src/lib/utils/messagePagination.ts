/**
 * Message pagination utilities
 * Implements windowing for large message lists
 */

import { Message } from "@/types/agent";

export interface MessageWindow {
  messages: Message[];
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginationConfig {
  pageSize: number;
  maxStoredMessages: number;
  archiveThreshold: number;
}

const DEFAULT_CONFIG: PaginationConfig = {
  pageSize: 50, // Show 50 messages at a time
  maxStoredMessages: 200, // Keep max 200 messages in memory
  archiveThreshold: 150, // Archive when exceeding 150 messages
};

/**
 * Message pagination manager
 */
export class MessagePaginator {
  private config: PaginationConfig;
  private allMessages: Message[] = [];
  private archivedMessages: Message[] = [];

  constructor(config: Partial<PaginationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add new message
   */
  addMessage(message: Message): void {
    this.allMessages.push(message);
    this.checkArchive();
  }

  /**
   * Add multiple messages
   */
  addMessages(messages: Message[]): void {
    this.allMessages.push(...messages);
    this.checkArchive();
  }

  /**
   * Update an existing active message by id.
   */
  updateMessage(
    id: string,
    updater: (message: Message) => Message,
  ): boolean {
    const index = this.allMessages.findIndex((message) => message.id === id);
    if (index === -1) {
      return false;
    }

    this.allMessages[index] = updater(this.allMessages[index]);
    return true;
  }

  /**
   * Get paginated messages
   */
  getWindow(page: number = 1): MessageWindow {
    const startIndex = (page - 1) * this.config.pageSize;
    const endIndex = startIndex + this.config.pageSize;
    const messages = this.allMessages.slice(startIndex, endIndex);

    return {
      messages,
      hasMore: endIndex < this.allMessages.length,
      totalCount: this.allMessages.length,
      currentPage: page,
      pageSize: this.config.pageSize,
    };
  }

  /**
   * Get recent messages (most common use case)
   */
  getRecent(count: number = 50): Message[] {
    return this.allMessages.slice(-count);
  }

  /**
   * Get all messages (use sparingly)
   */
  getAll(): Message[] {
    return [...this.allMessages];
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.allMessages = [];
    this.archivedMessages = [];
  }

  /**
   * Get total message count
   */
  getTotalCount(): number {
    return this.allMessages.length + this.archivedMessages.length;
  }

  /**
   * Get archived message count
   */
  getArchivedCount(): number {
    return this.archivedMessages.length;
  }

  /**
   * Search messages
   */
  search(query: string, limit: number = 20): Message[] {
    const lowerQuery = query.toLowerCase();
    return this.allMessages
      .filter((msg) => msg.content.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }

  /**
   * Export messages for backup
   */
  export(): { active: Message[]; archived: Message[] } {
    return {
      active: this.allMessages,
      archived: this.archivedMessages,
    };
  }

  /**
   * Import messages from backup
   */
  import(data: { active: Message[]; archived: Message[] }): void {
    this.allMessages = data.active || [];
    this.archivedMessages = data.archived || [];
  }

  /**
   * Check if archiving is needed
   */
  private checkArchive(): void {
    if (this.allMessages.length > this.config.archiveThreshold) {
      const toArchive = this.allMessages.length - this.config.maxStoredMessages;
      if (toArchive > 0) {
        const archived = this.allMessages.splice(0, toArchive);
        this.archivedMessages.push(...archived);

        // Keep archived messages limited too
        const maxArchived = this.config.maxStoredMessages * 2;
        if (this.archivedMessages.length > maxArchived) {
          this.archivedMessages = this.archivedMessages.slice(-maxArchived);
        }
      }
    }
  }

  /**
   * Get memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    const estimateMessageSize = (msg: Message): number => {
      return (
        msg.content.length * 2 + // UTF-16 characters
        100 + // Overhead for other fields
        (msg.data ? JSON.stringify(msg.data).length * 2 : 0)
      );
    };

    const activeSize = this.allMessages.reduce(
      (sum, msg) => sum + estimateMessageSize(msg),
      0,
    );
    const archivedSize = this.archivedMessages.reduce(
      (sum, msg) => sum + estimateMessageSize(msg),
      0,
    );

    return activeSize + archivedSize;
  }
}

/**
 * Create a message paginator instance
 */
export function createMessagePaginator(
  config?: Partial<PaginationConfig>,
): MessagePaginator {
  return new MessagePaginator(config);
}
