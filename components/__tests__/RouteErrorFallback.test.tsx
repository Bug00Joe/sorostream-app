import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RouteErrorFallback } from "../RouteErrorFallback";

describe("RouteErrorFallback", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("renders the fallback content and retry action", () => {
    const onRetry = vi.fn();

    render(
      <RouteErrorFallback
        title="Stream details unavailable"
        description="We could not load this stream view."
        error={new Error("fetch failed")}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Stream details unavailable")).toBeInTheDocument();
    expect(screen.getByText(/We could not load this stream view/i)).toBeInTheDocument();
    expect(screen.getByText("fetch failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
