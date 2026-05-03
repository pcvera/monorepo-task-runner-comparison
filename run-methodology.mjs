#!/usr/bin/env node
/**
 * Runs the README methodology against a task-runner fixture folder:
 * 1. Build all packages
 * 2. Modify sample package source, rebuild
 * 3. Undo sample modification, rebuild
 * 4. Modify stripped package (comment-only; same emitted JS), rebuild
 * 5. Modify stripped package so emitted JS changes, rebuild
 *
 * Usage: node run-methodology.mjs [--no-reset] <folder>
 * Writes combined output to <folder>/terminal-output.txt
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SAMPLE_REL = "packages/sample/src/build-only.json";
const STRIPPED_REL = "packages/stripped/src/sample-input.js";

/** One extra character inside the `note` string (same idea as typing once then Cmd+Z). */
const SAMPLE_SCRATCH_CHAR = "x";

const COMMENT_FIND =
  "// This comment will be stripped from the output, modifying it should not trigger a rebuild because of the stripped comments output being the same.";
const COMMENT_REPLACE =
  "// Methodology-only: different comment text; strip step yields identical emitted JS.";

const OUTPUT_CHANGE_FIND = `return "sampleInput";`;
const OUTPUT_CHANGE_REPLACE = `return "sampleInputModified";`;

function parseArgs(argv) {
  let noReset = false;
  const paths = [];
  for (const a of argv) {
    if (a === "--no-reset") {
      noReset = true;
    } else if (!a.startsWith("-")) {
      paths.push(a);
    } else {
      console.error(`Unknown option: ${a}`);
      process.exit(1);
    }
  }
  if (paths.length !== 1) {
    console.error("Usage: node run-methodology.mjs [--no-reset] <folder>");
    process.exit(1);
  }
  return { folder: paths[0], noReset };
}

function section(title) {
  return `\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}\n`;
}

function runPnpm(cwd, script) {
  const r = spawnSync("pnpm", ["run", script], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  let out = "";
  if (r.stdout) {
    out += r.stdout;
  }
  if (r.stderr) {
    out += r.stderr;
  }
  if (r.error) {
    out += `\n[spawn error] ${r.error.message}\n`;
  }
  if (r.status !== 0 && r.status !== null) {
    out += `\n[exit code ${r.status}]\n`;
  }
  return out;
}

function patchSampleJson(content) {
  const anchor = "as an input.";
  const idx = content.indexOf(anchor);
  if (idx === -1) {
    throw new Error(`Could not find "as an input." anchor in build-only.json`);
  }
  const beforeClosingQuote = idx + anchor.length;
  if (content[beforeClosingQuote] !== '"') {
    throw new Error(`Expected closing quote after "as an input." in build-only.json`);
  }
  return `${content.slice(0, beforeClosingQuote)}${SAMPLE_SCRATCH_CHAR}${content.slice(beforeClosingQuote)}`;
}

function validateFixture(root) {
  const samplePath = resolve(root, SAMPLE_REL);
  const strippedPath = resolve(root, STRIPPED_REL);
  if (!existsSync(samplePath)) {
    throw new Error(`Missing ${SAMPLE_REL} under ${root}`);
  }
  if (!existsSync(strippedPath)) {
    throw new Error(`Missing ${STRIPPED_REL} under ${root}`);
  }
  const stripped = readFileSync(strippedPath, "utf8");
  if (!stripped.includes(COMMENT_FIND)) {
    throw new Error(
      `stripped source comment anchor not found; expected line containing:\n${COMMENT_FIND}`,
    );
  }
  if (!stripped.includes(OUTPUT_CHANGE_FIND)) {
    throw new Error(
      `stripped source output anchor not found; expected line containing:\n${OUTPUT_CHANGE_FIND}`,
    );
  }
}

function main() {
  const { folder, noReset } = parseArgs(process.argv.slice(2));
  const root = resolve(process.cwd(), folder);

  if (!existsSync(root)) {
    console.error(`Folder does not exist: ${root}`);
    process.exit(1);
  }

  validateFixture(root);

  let log = "";

  function emit(chunk) {
    log += chunk;
    process.stdout.write(chunk);
  }

  try {
    if (!noReset) {
      emit(section("Reset (pnpm run reset)"));
      emit(runPnpm(root, "reset"));
    }

    emit(section("Step A — Build all packages"));
    emit(runPnpm(root, "build"));

    const samplePath = resolve(root, SAMPLE_REL);
    const sampleOriginal = readFileSync(samplePath, "utf8");
    writeFileSync(samplePath, patchSampleJson(sampleOriginal), "utf8");
    try {
      emit(section("Step B — Modify sample package source, rebuild all"));
      emit(runPnpm(root, "build"));
    } finally {
      writeFileSync(samplePath, sampleOriginal, "utf8");
    }

    emit(section("Step C — Restore sample package, rebuild all"));
    emit(runPnpm(root, "build"));

    const strippedPath = resolve(root, STRIPPED_REL);
    const strippedOriginal = readFileSync(strippedPath, "utf8");
    if (!strippedOriginal.includes(COMMENT_FIND)) {
      throw new Error("stripped file changed unexpectedly before Step D");
    }
    writeFileSync(
      strippedPath,
      strippedOriginal.replace(COMMENT_FIND, COMMENT_REPLACE),
      "utf8",
    );
    try {
      emit(
        section(
          "Step D — Modify stripped package (comment-only; same emitted JS), rebuild all",
        ),
      );
      emit(runPnpm(root, "build"));
    } finally {
      writeFileSync(strippedPath, strippedOriginal, "utf8");
    }

    const strippedForOutputStep = readFileSync(strippedPath, "utf8");
    if (!strippedForOutputStep.includes(OUTPUT_CHANGE_FIND)) {
      throw new Error("stripped file missing output anchor before Step E");
    }
    writeFileSync(
      strippedPath,
      strippedForOutputStep.replace(OUTPUT_CHANGE_FIND, OUTPUT_CHANGE_REPLACE),
      "utf8",
    );
    try {
      emit(section("Step E — Modify stripped package (emitted JS changes), rebuild all"));
      emit(runPnpm(root, "build"));
    } finally {
      writeFileSync(strippedPath, strippedForOutputStep, "utf8");
    }

    const outPath = resolve(root, "terminal-output.txt");
    writeFileSync(outPath, log, "utf8");
    emit(`\nWrote ${outPath}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    emit(`\nError: ${msg}\n`);
    try {
      writeFileSync(resolve(root, "terminal-output.txt"), log, "utf8");
    } catch {
      /* ignore secondary failure */
    }
    process.exit(1);
  }
}

main();
