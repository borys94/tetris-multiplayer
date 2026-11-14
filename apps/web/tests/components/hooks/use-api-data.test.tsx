import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../src/api/client";
import { useApiData } from "../../../src/components/hooks/use-api-data";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useApiData", () => {
  it("loads only while enabled and shows a player-facing error", async () => {
    const load = vi.fn(() => Promise.reject(new ApiError(500, "internal")));
    const { result, rerender } = renderHook(({ enabled }) => useApiData(load, { enabled }), {
      initialProps: { enabled: false },
    });
    expect(load).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await act(async () => {});
    expect(load).toHaveBeenCalledOnce();
    expect(result.current.error).toBe("Coś poszło nie tak");
  });

  it("ignores a response that arrives after leaving the view", async () => {
    let resolve!: (value: string) => void;
    const load = () => new Promise<string>((r) => (resolve = r));
    const { result, rerender } = renderHook(({ enabled }) => useApiData(load, { enabled }), {
      initialProps: { enabled: true },
    });
    rerender({ enabled: false });
    resolve("stale");
    await act(async () => {});
    expect(result.current.data).toBeNull();
  });

  it("polls every refreshMs", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const load = () => Promise.resolve(++calls);
    const { result } = renderHook(() => useApiData(load, { refreshMs: 1000 }));
    await act(async () => {});
    expect(result.current.data).toBe(1);

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.data).toBe(2);
  });
});
