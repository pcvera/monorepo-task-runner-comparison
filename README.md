# Examination of monorepo task runner caching behavior

It's sort of hard to find the details for each monorepo task runner's caching behavior, so I decided it was time for me to build out a minimal example to test it out myself. I explored as many of the "easy drop in at least it's not Bazel-level buy-in" task runners as I could find.

This was inspired by my experience where, if I have one package produces `.d.ts` files, changing the source of that package in a way that doesn't change the type signatures shouldn't result in its dependant packages having to have it's TypeScript reevaluated. Intuitively, the more stuff that triggers a downstream rebuild the more downstream rebuilds will be triggered and the less benefit you'll get from caching at all.


# Methodology

I created two sample packages: a `stripped` JavaScript package whose build is just a script that removes the comments from it's one source file, and a `sample` package that depends on it that has a build that copies the output of the `stripped` package and its own `src` directory to a `dist` directory. These are intended to be analogous to a something like building a library package, and then the build of an application package that depends on that library.

My test is:
0. Build all packages
0. Modify the source of the `sample` package and rebuild all packages (cache replay the unchanged dependant)
0. Undo that modification and rebuild all packages (cache replay the previous builds)
0. Modify the source of the `stripped` package in a way that doesn't change the output and rebuild all packages (cache replay the unchanged dependant)
0. Modify the source of the `stripped` package in a way that **does** change the emitted JavaScript and rebuild all packages (correct full rebuild, mostly as a smoke test to make sure I'm not missing something obvious)

Observing what is built and what is replayed from cache at each step.

# Results & Analysis

| Test | lage | moon | nx | turborepo | vite-plus | wireit |
|------|------|------|------|------|------|------|
| Replay Unchanged Package | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Replay N-1st Build | ✅ | ✅  | ✅ | ✅ | ❌ | ✅ |
| Cache Unchanged Dependant | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

Most of the task runners I tested rebuilt the `sample` package, even though the built version of the `stripped` package didn't change, I think this corresponds to whether the task runner calculates the input hashes before the entire task tree is run, or just before each task is run, and whether they consider a task having changed inputs to be an indicator that downstream builds should be invalidated. I was expecting there to be higher variance in the results here.

I'm surprised to find that the only runners that did were NX and Vite Plus, the latter of which seems to have a problem replaying a build that wasn't the most recent build. I've sort of shied away from NX historically because it's configuration felt a little too unfamiliar, but maybe that's a tradeoff for this type of correctness.

The terminal output for each task runner is available in each folder's `terminal-output.txt` file.

Feel free to reach out if you've spotted any flaws with configuration, or if there's another technology I'm missing out on.
