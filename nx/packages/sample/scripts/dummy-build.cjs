"use strict";

const fs = require("fs");
const path = require("path");

const pkgRoot = path.join(__dirname, "..");
const sourceDir = path.join(pkgRoot, "build", "stripped-comments");
const destDir = path.join(pkgRoot, "dist");

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(sourceDir, destDir, { recursive: true });
