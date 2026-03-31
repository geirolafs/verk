import { render } from "ink";
import { App } from "./App.tsx";

const { waitUntilExit } = render(<App />, {
  exitOnCtrlC: true,
});

await waitUntilExit();
