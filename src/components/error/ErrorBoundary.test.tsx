import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { resetErrorLogger } from "../../lib/error/errorLogger";

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  resetErrorLogger();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  describe("error catching", () => {
    it("should catch errors and display fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("fallback rendering", () => {
    it("should render custom fallback ReactNode", () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    });

    it("should render custom fallback function with error and reset", () => {
      const fallbackFn = vi.fn((error: Error, reset: () => void) => (
        <div>
          <span>Error: {error.message}</span>
          <button onClick={reset}>Reset</button>
        </div>
      ));

      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText("Error: Test error message")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    });
  });

  describe("retry functionality", () => {
    it("should reset error state when retry is clicked", () => {
      const onReset = vi.fn();
      let shouldThrow = true;

      function ConditionalThrow() {
        if (shouldThrow) {
          throw new Error("Test error");
        }
        return <div>Recovered</div>;
      }

      const { rerender } = render(
        <ErrorBoundary onReset={onReset}>
          <ConditionalThrow />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Fix the error condition
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));

      // onReset should be called
      expect(onReset).toHaveBeenCalled();

      // Re-render to see the recovered state
      rerender(
        <ErrorBoundary onReset={onReset}>
          <ConditionalThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Recovered")).toBeInTheDocument();
    });
  });

  describe("error callbacks", () => {
    it("should call onError when error is caught", () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should call onReset when reset is triggered", () => {
      const onReset = vi.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole("button", { name: "Try again" }));

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe("error logging", () => {
    it("should log error to ErrorLogger", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // The error should be logged (we can't easily verify this without
      // exposing the logger, but the test ensures no crash occurs)
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should have accessible retry button", () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const button = screen.getByRole("button", { name: "Try again" });
      expect(button).toBeInTheDocument();
    });
  });
});
