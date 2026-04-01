import { useState, useEffect } from "react";

export function useTerminalSize() {
  const [size, setSize] = useState({
    columns: process.stdout.columns ?? process.stderr.columns ?? 80,
    rows: process.stdout.rows ?? process.stderr.rows ?? 24,
  });

  useEffect(() => {
    function onResize() {
      setSize({
        columns: process.stdout.columns ?? process.stderr.columns ?? 80,
        rows: process.stdout.rows ?? process.stderr.rows ?? 24,
      });
    }

    process.stdout.on("resize", onResize);
    process.stderr.on("resize", onResize);

    return () => {
      process.stdout.off("resize", onResize);
      process.stderr.off("resize", onResize);
    };
  }, []);

  return size;
}
