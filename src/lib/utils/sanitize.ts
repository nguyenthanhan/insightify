import DOMPurify from "dompurify";

// Configure DOMPurify with security hooks
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  // Force rel="noopener noreferrer" on links with target="_blank"
  if (node.tagName === "A" && node.hasAttribute("target")) {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize text content (strip all HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize error messages to prevent sensitive data leaks
 */
export function sanitizeError(error: Error): Error {
  const sanitized = new Error(error.message);

  // Remove sensitive patterns from message
  sanitized.message = error.message
    // OpenAI keys
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
    // Anthropic keys
    .replace(/sk-ant-[a-zA-Z0-9-]{20,}/g, "sk-ant-***")
    // JWT tokens
    .replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "jwt-***")
    // Generic API keys
    .replace(/apiKey[=:]\s*[\w-]+/gi, "apiKey=***")
    .replace(/api_key[=:]\s*[\w-]+/gi, "api_key=***")
    // Tokens
    .replace(/token[=:]\s*[\w-]+/gi, "token=***")
    .replace(/access_token[=:]\s*[\w-]+/gi, "access_token=***")
    // Passwords
    .replace(/password[=:]\s*[\w-]+/gi, "password=***")
    // Secrets
    .replace(/secret[=:]\s*[\w-]+/gi, "secret=***")
    // Bearer tokens
    .replace(/bearer\s+[\w-]+/gi, "bearer ***")
    .replace(/authorization:\s*[\w-]+/gi, "authorization: ***")
    // Keys in URL query params
    .replace(
      /[?&](key|apikey|api_key|token|access_token)=[^&\s]+/gi,
      "?$1=***",
    );

  // Sanitize stack trace
  if (error.stack) {
    sanitized.stack = error.stack
      .replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***")
      .replace(/sk-ant-[a-zA-Z0-9-]{20,}/g, "sk-ant-***")
      .replace(
        /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
        "jwt-***",
      )
      .replace(/apiKey[=:]\s*[\w-]+/gi, "apiKey=***")
      .replace(/api_key[=:]\s*[\w-]+/gi, "api_key=***")
      .replace(/token[=:]\s*[\w-]+/gi, "token=***")
      .replace(/access_token[=:]\s*[\w-]+/gi, "access_token=***")
      .replace(/password[=:]\s*[\w-]+/gi, "password=***")
      .replace(/secret[=:]\s*[\w-]+/gi, "secret=***")
      .replace(/bearer\s+[\w-]+/gi, "bearer ***")
      .replace(/authorization:\s*[\w-]+/gi, "authorization: ***")
      .replace(
        /[?&](key|apikey|api_key|token|access_token)=[^&\s]+/gi,
        "?$1=***",
      );
  }

  return sanitized;
}

/**
 * Safe localStorage operations with quota management
 */
export const safeStorage = {
  setItem(key: string, value: string): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        console.warn("Storage quota exceeded, attempting cleanup...");

        // Try to clear old cache entries
        try {
          const cacheKey = "ai-agent-cache";
          localStorage.removeItem(cacheKey);

          // Retry
          localStorage.setItem(key, value);
          return true;
        } catch {
          console.error("Storage quota exceeded even after cleanup");
          return false;
        }
      }
      console.error("Failed to save to localStorage:", e);
      return false;
    }
  },

  getItem(key: string): string | null {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
      return null;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error("Failed to remove from localStorage:", e);
      return false;
    }
  },

  clear(): boolean {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.clear();
      return true;
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
      return false;
    }
  },
};
