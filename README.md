# Examination of monorepo task runner caching behavior

It's sort of hard to find the details for each monorepo task runner's caching behavior, so I decided it was time for me to build out a minimal example to test it out myself.

# Methodology

I created two sample tasks: a `strip-comments` that removes the comments from javascript files, and a `build` task that simply copies the output of the `strip-comments` task to a `dist` directory. These are intended to be analogous to a something like running `tsc` to create JavaScript files and then some sort of packaging.

This was inspired by my experience where, if I have one package produces `.d.ts` files, changing the source of that package in a way that doesn't change the type signatures shouldn't result in its dependant packages being rebuilt.