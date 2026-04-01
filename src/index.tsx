import { render } from "ink";
import { App } from "./App.tsx";

const { waitUntilExit } = render(
  <App initialNewName={globalThis.__devNewName} />,
  { exitOnCtrlC: true }
);

await waitUntilExit();
