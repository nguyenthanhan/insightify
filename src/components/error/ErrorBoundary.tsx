import React, { Component, ErrorInfo, ReactNode } from "react";
import { getErrorLogger } from "../../lib/error/errorLogger";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child component tree
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback render function
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to ErrorLogger
    const logger = getErrorLogger();
    logger.log(error, {
      componentStack: errorInfo.componentStack || undefined,
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If fallback is a function, call it with error and reset
      if (typeof fallback === "function") {
        return fallback(error, this.handleReset);
      }

      // If fallback is provided as ReactNode, render it
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return <DefaultErrorFallback error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}

/**
 * Default error fallback component
 */
interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  onReset,
}: DefaultErrorFallbackProps): JSX.Element {
  return (
    <div
      role="alert"
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
    >
      <div className="mb-4 text-red-500 dark:text-red-400">
        <svg
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        Something went wrong
      </h2>
      <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={onReset}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  );
}

export default ErrorBoundary;
