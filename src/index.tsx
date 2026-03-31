import { render } from "ink";
import { openSync } from "fs";
import { WriteStream } from "tty";
import { App } from "./App.tsx";

function createTtyOutput(): NodeJS.WriteStream {
  // When run via shell wrapper `out=$(cmd 2>/dev/tty)`:
  // - stdout is a pipe (captured for eval)
  // - stderr is redirected to /dev/tty
  // - Ink needs a real TTY stream with columns/rows
  //
  // Open /dev/tty directly as a TTY WriteStream.
  // Falls back to process.stderr for direct invocation.
  try {
    const fd = openSync("/dev/tty", "w");
    return new WriteStream(fd);
  } catch {
    // No controlling terminal (CI, piped, etc.) — use stderr
    return process.stderr;
  }
}

const ttyOut = createTtyOutput();

const { waitUntilExit } = render(<App />, {
  stdout: ttyOut,
  exitOnCtrlC: true,
});

await waitUntilExit();

if (ttyOut !== process.stderr) {
  (ttyOut as WriteStream).destroy();
}
