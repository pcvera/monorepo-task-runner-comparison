"use strict";

const fs = require("fs");
const path = require("path");
const strip = require("strip-comments");

const pkgRoot = path.join(__dirname, "..");
const inputPath = path.join(pkgRoot, "src", "sample-input.js");
const outputDir = path.join(pkgRoot, "build/stripped-comments");
const outputPath = path.join(outputDir, "sample-input.js");

const source = fs.readFileSync(inputPath, "utf8");
const stripped = strip(source);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, stripped, "utf8");
