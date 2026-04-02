import { describe, test, expect } from "bun:test";
import {
  datePrefix,
  fullProjectName,
  templateCommands,
  getTemplates,
} from "../src/utils/templates.ts";

describe("datePrefix", () => {
  test("returns YYYY-MM-DD format", () => {
    expect(datePrefix()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("fullProjectName", () => {
  test("prepends date prefix", () => {
    const name = fullProjectName("myapp");
    expect(name).toMatch(/^\d{4}-\d{2}-\d{2}-myapp$/);
  });
});

describe("getTemplates", () => {
  test("loads templates from templates/", () => {
    const templates = getTemplates();
    expect(templates.length).toBeGreaterThan(0);
    const names = templates.map((t) => t.name);
    expect(names).toContain("empty");
    expect(names).toContain("next");
    expect(names).toContain("node");
  });

  test("each template has name and description", () => {
    for (const t of getTemplates()) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});

describe("templateCommands", () => {
  test("starts with mkdir and cd", () => {
    const cmds = templateCommands("/tmp/test-proj", "empty");
    expect(cmds).toStartWith("mkdir -p '/tmp/test-proj' && cd '/tmp/test-proj'");
  });

  test("includes template commands after cd", () => {
    const cmds = templateCommands("/tmp/test-proj", "empty");
    expect(cmds).toContain("git init");
  });

  test("strips comments from template", () => {
    const cmds = templateCommands("/tmp/test-proj", "empty");
    expect(cmds).not.toContain("# Git repo");
  });

  test("quotes paths with special chars", () => {
    const cmds = templateCommands("/tmp/it's a test", "empty");
    expect(cmds).toContain("'\\''");
    expect(cmds).not.toContain("it's a");
  });
});
