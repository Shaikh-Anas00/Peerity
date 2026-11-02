import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useApiResource } from "./useApiResource";

describe("useApiResource", () => {
  it("starts with the initial value and loading=true", () => {
    const fetcher = vi.fn(() => new Promise<{ data: string[] }>(() => {})); // never resolves
    const { result } = renderHook(() => useApiResource(fetcher, [] as string[]));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("resolves into data and clears loading on success", async () => {
    const fetcher = vi.fn(() => Promise.resolve({ data: ["a", "b"] }));
    const { result } = renderHook(() => useApiResource(fetcher, [] as string[]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("falls back to the initial value and sets an error message on failure", async () => {
    const fetcher = vi.fn(() =>
      Promise.reject({ response: { data: { message: "Server exploded" } } })
    );
    const { result } = renderHook(() => useApiResource(fetcher, ["seed"]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["seed"]);
    expect(result.current.error).toBe("Server exploded");
  });

  it("re-invokes the fetcher when refetch is called", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ data: ["first"] })
      .mockResolvedValueOnce({ data: ["second"] });
    const { result } = renderHook(() => useApiResource(fetcher, [] as string[]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["first"]);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toEqual(["second"]));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("re-fetches when an entry in the deps array changes, but not on every re-render", async () => {
    const fetcher = vi.fn(() => Promise.resolve({ data: "ok" }));
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useApiResource(fetcher, "", [id]),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // Re-render with the same dep value: must not trigger a second fetch.
    rerender({ id: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Re-render with a changed dep value: must trigger a new fetch.
    rerender({ id: 2 });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    void result; // referenced to avoid an unused-var lint warning in this file
  });
});
