/**
 * A loader that creates an unhandled promise rejection.
 * This simulates what happens when async operations in loaders
 * or plugins fail without proper error handling.
 *
 * With the current rspack CLI, this causes a silent exit (code 1, no output).
 */
export default function rejectingLoader(source) {
  // Create an unhandled promise rejection — no .catch()
  Promise.reject(new Error("Simulated async failure in loader — this error should be visible but rspack swallows it"));

  return source;
}
