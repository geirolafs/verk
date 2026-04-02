import { describe, test, expect } from "bun:test";
import { shellQuote, SAFE_NAME } from "../src/utils/shellOutput.ts";

describe("shellQuote", () => {
  test("simple string", () => {
    expect(shellQuote("foo")).toBe("'foo'");
  });

  test("path with spaces", () => {
    expect(shellQuote("/path/to/my project")).toBe("'/path/to/my project'");
  });

  test("escapes single quotes", () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'");
  });

  test("multiple single quotes", () => {
    expect(shellQuote("a'b'c")).toBe("'a'\\''b'\\''c'");
  });

  test("empty string", () => {
    expect(shellQuote("")).toBe("''");
  });

  test("special shell chars are safely quoted", () => {
    expect(shellQuote("$(whoami)")).toBe("'$(whoami)'");
    expect(shellQuote("`rm -rf`")).toBe("'`rm -rf`'");
    expect(shellQuote("foo;bar")).toBe("'foo;bar'");
    expect(shellQuote("a && b")).toBe("'a && b'");
  });
});

describe("SAFE_NAME", () => {
  test("accepts valid names", () => {
    expect(SAFE_NAME.test("my-project")).toBe(true);
    expect(SAFE_NAME.test("foo_bar")).toBe(true);
    expect(SAFE_NAME.test("v2.0")).toBe(true);
    expect(SAFE_NAME.test("ABC123")).toBe(true);
  });

  test("rejects path traversal", () => {
    expect(SAFE_NAME.test("../etc")).toBe(false);
    expect(SAFE_NAME.test("foo/bar")).toBe(false);
  });

  test("rejects shell metacharacters", () => {
    expect(SAFE_NAME.test("foo'bar")).toBe(false);
    expect(SAFE_NAME.test("$(cmd)")).toBe(false);
    expect(SAFE_NAME.test("`cmd`")).toBe(false);
    expect(SAFE_NAME.test("a;b")).toBe(false);
    expect(SAFE_NAME.test("a b")).toBe(false);
    expect(SAFE_NAME.test("a\nb")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(SAFE_NAME.test("")).toBe(false);
  });
});
