export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers: Array<"ctrl" | "alt" | "shift" | "meta">;
  description: string;
  action: () => void;
  enabled: boolean;
  category: string;
}

export interface ShortcutMatch {
  shortcut: KeyboardShortcut;
  executed: boolean;
}

export class NavigationSystem {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled = true;
  private listeners: Set<(shortcuts: KeyboardShortcut[]) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.setupGlobalListener();
    }
  }

  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
    this.notifyListeners();
  }

  unregisterShortcut(id: string): boolean {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === id) {
        this.shortcuts.delete(key);
        this.notifyListeners();
        return true;
      }
    }
    return false;
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(): Record<string, KeyboardShortcut[]> {
    const categories: Record<string, KeyboardShortcut[]> = {};

    for (const shortcut of this.shortcuts.values()) {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    }

    return categories;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enableShortcut(id: string): boolean {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.id === id) {
        shortcut.enabled = true;
        this.notifyListeners();
        return true;
      }
    }
    return false;
  }

  disableShortcut(id: string): boolean {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.id === id) {
        shortcut.enabled = false;
        this.notifyListeners();
        return true;
      }
    }
    return false;
  }

  // Execute shortcut by id (for testing)
  executeShortcut(id: string): boolean {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.id === id && shortcut.enabled) {
        shortcut.action();
        return true;
      }
    }
    return false;
  }

  // Match keyboard event to shortcut
  matchEvent(event: KeyboardEvent): ShortcutMatch | null {
    if (!this.enabled) return null;

    const key = this.getEventKey(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut && shortcut.enabled) {
      return { shortcut, executed: false };
    }

    return null;
  }

  // Handle keyboard event
  handleKeyboardEvent(event: KeyboardEvent): boolean {
    const match = this.matchEvent(event);

    if (match) {
      event.preventDefault();
      match.shortcut.action();
      return true;
    }

    return false;
  }

  subscribe(listener: (shortcuts: KeyboardShortcut[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Format shortcut for display
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.modifiers.includes("meta")) {
      parts.push(this.isMac() ? "⌘" : "Win");
    }
    if (shortcut.modifiers.includes("ctrl")) {
      parts.push(this.isMac() ? "⌃" : "Ctrl");
    }
    if (shortcut.modifiers.includes("alt")) {
      parts.push(this.isMac() ? "⌥" : "Alt");
    }
    if (shortcut.modifiers.includes("shift")) {
      parts.push(this.isMac() ? "⇧" : "Shift");
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(this.isMac() ? "" : "+");
  }

  private setupGlobalListener(): void {
    document.addEventListener("keydown", (event) => {
      // Don't handle shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape to work in inputs
        if (event.key !== "Escape") {
          return;
        }
      }

      this.handleKeyboardEvent(event);
    });
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = [...shortcut.modifiers].sort().join("+");
    return `${modifiers}+${shortcut.key.toLowerCase()}`;
  }

  private getEventKey(event: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (event.metaKey) modifiers.push("meta");
    if (event.ctrlKey) modifiers.push("ctrl");
    if (event.altKey) modifiers.push("alt");
    if (event.shiftKey) modifiers.push("shift");

    modifiers.sort();
    return `${modifiers.join("+")}+${event.key.toLowerCase()}`;
  }

  private isMac(): boolean {
    if (typeof navigator === "undefined") return false;
    return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  }

  private notifyListeners(): void {
    const shortcuts = this.getShortcuts();
    this.listeners.forEach((listener) => listener(shortcuts));
  }

  // Clear all shortcuts
  clear(): void {
    this.shortcuts.clear();
    this.notifyListeners();
  }
}

// Singleton instance
let navigationSystemInstance: NavigationSystem | null = null;

export function getNavigationSystem(): NavigationSystem {
  if (!navigationSystemInstance) {
    navigationSystemInstance = new NavigationSystem();
  }
  return navigationSystemInstance;
}

// Register default shortcuts
export function registerDefaultShortcuts(system: NavigationSystem): void {
  system.registerShortcut({
    id: "search",
    key: "k",
    modifiers: ["meta"],
    description: "Open search",
    action: () => {
      // Dispatch custom event for search
      document.dispatchEvent(new CustomEvent("kiro:open-search"));
    },
    enabled: true,
    category: "Navigation",
  });

  system.registerShortcut({
    id: "close",
    key: "Escape",
    modifiers: [],
    description: "Close dialog/modal",
    action: () => {
      document.dispatchEvent(new CustomEvent("kiro:close-dialog"));
    },
    enabled: true,
    category: "Navigation",
  });

  system.registerShortcut({
    id: "help",
    key: "?",
    modifiers: ["shift"],
    description: "Show keyboard shortcuts",
    action: () => {
      document.dispatchEvent(new CustomEvent("kiro:show-shortcuts"));
    },
    enabled: true,
    category: "Help",
  });

  system.registerShortcut({
    id: "toggle-theme",
    key: "t",
    modifiers: ["meta", "shift"],
    description: "Toggle dark/light theme",
    action: () => {
      document.dispatchEvent(new CustomEvent("kiro:toggle-theme"));
    },
    enabled: true,
    category: "Appearance",
  });
}
