# Reproduction: rspack CLI exits silently on fatal errors

Related issue: https://github.com/web-infra-dev/rspack/issues/13505
Related fix: https://github.com/web-infra-dev/rspack/pull/13506

## Problem

When rspack encounters a fatal error (unhandled rejection, uncaught exception, or OS signal like SIGBUS), it exits with code 1 and prints **nothing** to stderr. This makes debugging extremely difficult, especially when running concurrent builds.

## Setup

```bash
cd repro-silent-exit
npm install
```

## Reproduce

### 1. Unhandled promise rejection (silent exit)

```bash
node trigger-sigbus.mjs --unhandled-rejection
```

A loader creates an unhandled promise rejection. rspack exits with code 1 but prints no error.

### 2. Fatal signal (SIGBUS simulation)

```bash
node trigger-sigbus.mjs --sigbus
```

Sends SIGBUS to a running rspack process (simulates what happens when concurrent file I/O causes memory-mapped file corruption). rspack exits with no diagnostic output.

### 3. Concurrent builds (real-world scenario)

```bash
npm run build:concurrent
```

Runs 3 rspack builds concurrently. If any of them fail silently, you'll see `exited with code 1` from concurrently but no error from rspack.

## Expected behavior

rspack should print the error to stderr before exiting:

```
[rspack] Fatal error (uncaught exception):
Error: <actual error message and stack trace>
```

## Root cause

In `packages/rspack-cli/bin/rspack.js`, `runCLI()` is called without `.catch()`, and there are no `process.on('uncaughtException')` or `process.on('unhandledRejection')` handlers. Any fatal error in the async pipeline is silently swallowed.
