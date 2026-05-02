"use strict";

const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const requireFromPkg = createRequire(__filename);
const strippedPkgJson = requireFromPkg.resolve("@repo/stripped/package.json");
const strippedRoot = path.dirname(strippedPkgJson);

const pkgRoot = path.join(__dirname, "..");
const sourceDir = path.join(strippedRoot, "build", "stripped-comments");
const destDir = path.join(pkgRoot, "dist");
const buildOnlySrc = path.join(pkgRoot, "src", "build-only.json");
const buildOnlyDest = path.join(destDir, "build-only.json");

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(sourceDir, destDir, { recursive: true });
fs.copyFileSync(buildOnlySrc, buildOnlyDest);
