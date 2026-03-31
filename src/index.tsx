import { render } from "ink";
import { App } from "./App.tsx";

const { waitUntilExit } = render(<App />, {
  stdout: process.stderr,
  exitOnCtrlC: true,
});

await waitUntilExit();
