import { DashboardTheme, AISuggestions } from "@/lib/config/dashboards/types";

interface AISuggestionsPanelProps {
  theme: DashboardTheme;
  suggestions: AISuggestions;
}

export function AISuggestionsPanel({
  theme,
  suggestions,
}: AISuggestionsPanelProps) {
  return (
    <div className={`rounded-lg border-l-4 ${theme.bg} ${theme.light} p-4`}>
      <h4 className={`font-semibold ${theme.text}`}>
        💡 Try asking the AI assistant:
      </h4>
      <ul
        className={`mt-2 list-inside list-disc space-y-1 text-sm ${theme.text}`}
      >
        {suggestions.prompts.map((prompt, index) => (
          <li key={index}>{prompt}</li>
        ))}
      </ul>
    </div>
  );
}

export default AISuggestionsPanel;
