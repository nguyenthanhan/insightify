import { DashboardTheme, AISuggestions } from "@/lib/config/dashboards/types";
import { cn } from "@/lib/utils/cn";

interface AISuggestionsPanelProps {
  theme: DashboardTheme;
  suggestions: AISuggestions;
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  green: "border-l-green-500",
  orange: "border-l-orange-500",
  indigo: "border-l-indigo-500",
  pink: "border-l-pink-500",
};

export function AISuggestionsPanel({
  theme,
  suggestions,
}: AISuggestionsPanelProps) {
  const accentClass = ACCENT_CLASSES[theme.primary] ?? "border-l-blue-500";

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm",
        "dark:border-gray-700 dark:bg-gray-800",
        accentClass,
      )}
    >
      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          💡
        </span>
        <span>Try asking the AI assistant:</span>
      </h4>
      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-700 marker:text-gray-400 dark:text-gray-300 dark:marker:text-gray-500">
        {suggestions.prompts.map((prompt, index) => (
          <li key={index}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}

export default AISuggestionsPanel;
