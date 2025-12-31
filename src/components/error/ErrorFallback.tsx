import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ErrorFallbackProps {
  error: Error;
  onReset?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  title?: string;
  message?: string;
}

/**
 * ErrorFallback - User-friendly error display component
 *
 * @example
 * ```tsx
 * <ErrorFallback
 *   error={error}
 *   onReset={() => window.location.reload()}
 *   title="Dashboard Error"
 *   message="We couldn't load your dashboard data."
 * />
 * ```
 */
export function ErrorFallback({
  error,
  onReset,
  onGoHome,
  showDetails = false,
  title = "Something went wrong",
  message,
}: ErrorFallbackProps): JSX.Element {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const displayMessage =
    message || error.message || "An unexpected error occurred";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-8 shadow-sm dark:border-red-800/50 dark:from-red-900/20 dark:to-gray-900"
    >
      {/* Icon */}
      <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
        <AlertTriangle
          className="h-8 w-8 text-red-500 dark:text-red-400"
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      {/* Message */}
      <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-400">
        {displayMessage}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </button>
        )}
      </div>

      {/* Error Details (collapsible) */}
      {showDetails && (
        <div className="mt-6 w-full max-w-lg">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-expanded={detailsExpanded}
          >
            <span>Technical details</span>
            {detailsExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {detailsExpanded && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-900 p-4 dark:border-gray-700">
              <p className="mb-2 font-mono text-xs text-red-400">
                {error.name}: {error.message}
              </p>
              {error.stack && (
                <pre className="max-h-40 overflow-auto font-mono text-xs text-gray-400">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact error fallback for smaller UI sections
 */
export interface CompactErrorFallbackProps {
  error: Error;
  onReset?: () => void;
}

export function CompactErrorFallback({
  error,
  onReset,
}: CompactErrorFallbackProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20"
    >
      <AlertTriangle
        className="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Error loading content
        </p>
        <p className="truncate text-xs text-gray-600 dark:text-gray-400">
          {error.message}
        </p>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="flex-shrink-0 rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          aria-label="Retry"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default ErrorFallback;
