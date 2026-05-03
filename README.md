# Examination of monorepo task runner caching behavior

It's sort of hard to find the details for each monorepo task runner's caching behavior, so I decided it was time for me to build out a minimal example to test it out myself.

This was inspired by my experience where, if I have one package produces `.d.ts` files, changing the source of that package in a way that doesn't change the type signatures shouldn't result in its dependant packages having to have it's TypeScript reevaluated.

I explored as many of the "easy drop in at least it's not Bazel-level buy-in" as I could find.

# Methodology

I created two sample packages: a `stripped` JavaScript package whose build is just a script that removes the comments from it's one source file, and a `sample` package that depends on it that has a build that copies the output of the `stripped` package and its own `src` directory to a `dist` directory. These are intended to be analogous to a something like building a library package, and then the build of an application package that depends on that library.

My test is:
0. Build all packages
0. Modify the source of the `sample` package and rebuild all packages (cache replay the unchanged dependant)
0. Undo that modification and rebuild all packages (cache replay the previous builds)
0. Modify the source of the `stripped` package in a way that doesn't change the output and rebuild all packages (cache replay the unchanged dependant)

Observing what is built and what is replayed from cache at each step.

# Results

Most of the task runners I tested rebuilt the `sample` package, even though the built version of the `stripped` package didn't change. The terminal output for each task runner is available in each folder's `terminal-output.txt` file.

| Test | lage | moon | nx | turborepo | vite-plus | wireit |
|------|------|------|------|------|------|------|
| Replay Unchanged Package |  |  |  |  |  |  |
| Replay Previous Builds |  |  |  |  |  |  |
| Cache Unchanged Dependant |  |  |  |  |  |  |