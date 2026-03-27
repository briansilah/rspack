/**
 * Reproduction: rspack exits silently on fatal errors.
 *
 * This script demonstrates two failure modes where rspack provides
 * no diagnostic output:
 *
 * 1. Unhandled promise rejection in a loader — rspack exits with
 *    code 1 and prints nothing to stderr.
 *
 * 2. Fatal signal (SIGBUS) — the OS kills the process immediately,
 *    and rspack has no signal handler to log what happened.
 *
 * In both cases, a user running concurrent builds sees:
 *   "rspack exited with code 1"
 * ...and nothing else. No error, no stack trace, no signal name.
 *
 * Usage:
 *   node trigger-sigbus.mjs [--unhandled-rejection | --sigbus]
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] || "--unhandled-rejection";

if (mode === "--sigbus") {
  // Simulate SIGBUS: start an rspack build, then send SIGBUS to it.
  // This mimics what happens when concurrent file I/O causes a
  // memory-mapped file to be truncated mid-read.
  console.log("Starting rspack build, will send SIGBUS after 1s...\n");

  const child = spawn(
    "npx",
    ["rspack", "--config", "rspack.config.a.mjs", "--mode", "production"],
    { cwd: __dirname, stdio: "inherit" }
  );

  setTimeout(() => {
    console.log(`\nSending SIGBUS to rspack process (PID: ${child.pid})...`);
    child.kill("SIGBUS");
  }, 1000);

  child.on("exit", (code, signal) => {
    console.log(`\n--- Process exited ---`);
    console.log(`Exit code: ${code}`);
    console.log(`Signal: ${signal}`);
    console.log(
      `\nNotice: rspack printed NO error message about the fatal signal.`
    );
    console.log(
      `A user would only see "exited with code 1" with no explanation.`
    );
  });
} else if (mode === "--unhandled-rejection") {
  // Simulate unhandled rejection: use a loader that rejects a promise
  // without catching it. rspack exits silently.
  console.log(
    "Starting rspack build with a loader that has an unhandled rejection...\n"
  );

  const child = spawn(
    "npx",
    [
      "rspack",
      "--config",
      "rspack.config.rejecting.mjs",
      "--mode",
      "production",
    ],
    { cwd: __dirname, stdio: "inherit" }
  );

  child.on("exit", (code, signal) => {
    console.log(`\n--- Process exited ---`);
    console.log(`Exit code: ${code}`);
    console.log(`Signal: ${signal}`);
    if (code !== 0) {
      console.log(
        `\nNotice: rspack exited with a non-zero code but may not have`
      );
      console.log(`printed the actual error that caused the failure.`);
    }
  });
}
