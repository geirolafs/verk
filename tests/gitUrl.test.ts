import { describe, expect, test } from "bun:test";
import { isGitUrl, parseGitUrl, repoName } from "../src/utils/gitUrl.ts";

describe("parseGitUrl", () => {
  test("https with .git", () => {
    expect(parseGitUrl("https://github.com/tobi/try.git")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("https without .git", () => {
    expect(parseGitUrl("https://github.com/tobi/try")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("ssh git@", () => {
    expect(parseGitUrl("git@github.com:tobi/try.git")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("ssh:// protocol", () => {
    expect(parseGitUrl("ssh://git@github.com/tobi/try.git")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("gitlab url", () => {
    expect(parseGitUrl("https://gitlab.com/user/project")).toEqual({
      owner: "user",
      repo: "project",
    });
  });

  test("trailing slash", () => {
    expect(parseGitUrl("https://github.com/tobi/try/")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("extra path segments ignored", () => {
    expect(parseGitUrl("https://github.com/tobi/try/tree/main")).toEqual({
      owner: "tobi",
      repo: "try",
    });
  });

  test("invalid url returns null", () => {
    expect(parseGitUrl("not-a-url")).toBeNull();
  });

  test("url with no repo path returns null", () => {
    expect(parseGitUrl("https://github.com/")).toBeNull();
  });

  test("url with only owner returns null", () => {
    expect(parseGitUrl("https://github.com/tobi")).toBeNull();
  });
});

describe("isGitUrl", () => {
  test("recognizes https urls", () => {
    expect(isGitUrl("https://github.com/tobi/try.git")).toBe(true);
  });

  test("recognizes git@ urls", () => {
    expect(isGitUrl("git@github.com:tobi/try.git")).toBe(true);
  });

  test("rejects plain words", () => {
    expect(isGitUrl("new")).toBe(false);
    expect(isGitUrl("archive")).toBe(false);
  });

  test("rejects paths", () => {
    expect(isGitUrl("./foo")).toBe(false);
    expect(isGitUrl("/tmp/bar")).toBe(false);
  });
});

describe("repoName", () => {
  test("joins owner-repo", () => {
    expect(repoName({ owner: "tobi", repo: "try" })).toBe("tobi-try");
  });
});
