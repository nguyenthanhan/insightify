import React, { ReactElement } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";

/**
 * Options for renderWithProviders
 */
export interface RenderWithProvidersOptions
  extends Omit<RenderOptions, "wrapper"> {
  theme?: "light" | "dark";
  route?: string;
}

/**
 * Wrapper component that provides all necessary context providers
 */
function AllProviders({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return <React.StrictMode>{children}</React.StrictMode>;
}

/**
 * Custom render function that wraps components with all providers
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult {
  const { theme = "light", ...renderOptions } = options;

  // Apply theme class to document
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  return render(ui, {
    wrapper: AllProviders,
    ...renderOptions,
  });
}

/**
 * Re-export everything from @testing-library/react
 */
export * from "@testing-library/react";

/**
 * Override the default render with our custom one
 */
export { renderWithProviders as render };
