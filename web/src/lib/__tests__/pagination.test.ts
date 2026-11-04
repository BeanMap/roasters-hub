import { describe, expect, it } from "vitest";
import { pageWindow } from "@/lib/pagination";

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it("collapses long ranges around the current page", () => {
    expect(pageWindow(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pageWindow(1, 9)).toEqual([1, 2, null, 9]);
    expect(pageWindow(9, 9)).toEqual([1, null, 8, 9]);
  });

  it("fills a single-page gap instead of showing an ellipsis", () => {
    expect(pageWindow(4, 9)).toEqual([1, 2, 3, 4, 5, null, 9]);
  });
});
