import { describe, test, expect } from "bun:test";
import { fuzzyMatch } from "../src/utils/fuzzy.ts";

describe("fuzzyMatch", () => {
  test("exact match", () => {
    const r = fuzzyMatch("foo", "foo");
    expect(r).not.toBeNull();
    expect(r!.indices).toEqual([0, 1, 2]);
  });

  test("case insensitive", () => {
    expect(fuzzyMatch("foo", "FOO")).not.toBeNull();
    expect(fuzzyMatch("FOO", "foo")).not.toBeNull();
  });

  test("subsequence match", () => {
    const r = fuzzyMatch("fb", "foobar");
    expect(r).not.toBeNull();
    expect(r!.indices).toEqual([0, 3]);
  });

  test("no match returns null", () => {
    expect(fuzzyMatch("xyz", "foo")).toBeNull();
  });

  test("query longer than target returns null", () => {
    expect(fuzzyMatch("foobar", "foo")).toBeNull();
  });

  test("empty query matches everything", () => {
    const r = fuzzyMatch("", "anything");
    expect(r).not.toBeNull();
    expect(r!.indices).toEqual([]);
  });

  test("word boundary bonus", () => {
    const boundary = fuzzyMatch("b", "foo-bar")!;
    const mid = fuzzyMatch("o", "foo-bar")!;
    // 'b' at boundary (after '-') gets +2 bonus
    expect(boundary.score).toBeGreaterThan(mid.score);
  });

  test("consecutive chars bonus", () => {
    const consecutive = fuzzyMatch("fo", "foo")!;
    const spread = fuzzyMatch("fo", "f--o--")!;
    expect(consecutive.score).toBeGreaterThan(spread.score);
  });

  test("date-prefixed project names", () => {
    const r = fuzzyMatch("verk", "2025-04-01-verk");
    expect(r).not.toBeNull();
  });
});
