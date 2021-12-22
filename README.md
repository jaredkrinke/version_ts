# version_ts
A simple tool for managing semantic versions of modules stored in `version.ts` (a TypeScript file that can be consumed via `import`).

## Installation
deno install --allow-read=version.ts --allow-write=version.ts --allow-run=git https://deno.land/x/version_ts/main.ts

## Usage
```text
$ version_ts --help
Usage: version_ts [options] [major|minor|patch]

Options:
  -i, --increment <major|minor|patch>  Increments the specified version component
  -s, --set <version>                  Overwrites the existing version with the specified version
  -g, --get                            Prints the current version
  -c, --commit                         Automatically commit the updated version.ts using Git
  -t, --tag                            Adds a Git tag for the current version
  --version                            Prints the version of version_ts itself (not the current module!)
  -h, -?, --help                       Display usage information
```

## Example
```text
$ version_ts --set 0.1.0
Updated version from (none) to 0.1.0
```

This produces the follow `version.ts` file:

```typescript
export const version = "0.1.0";
```

This can be consumed at compile/run time:

```typescript
import version from "./version.ts"; // "0.1.0"
```

Now, if you want to tag your Git repository with the current version:

```text
$ version_ts --commit --tag
Running command: git status -z
Running command: git add version.ts
Running command: git commit -m Version 0.1.0
Running command: git status -z
Running command: git tag 0.1.0
```

Resulting tag:

```text
$ git tag
0.1.0
```

## More examples
```text
$ version_ts patch --commit --tag 
Updated version from 0.1.0 to 0.1.1
Running command: git status -z
Running command: git add version.ts
Running command: git commit -m Version 0.1.1
Running command: git status -z
Running command: git tag 0.1.1

$ version_ts minor --commit --tag 
Updated version from 0.1.1 to 0.2.0
Running command: git status -z
Running command: git add version.ts
Running command: git commit -m Version 0.2.0
Running command: git status -z
Running command: git tag 0.2.0

$ version_ts major --commit --tag  
Updated version from 0.2.0 to 1.0.0
Running command: git status -z
Running command: git add version.ts
Running command: git commit -m Version 1.0.0
Running command: git status -z
Running command: git tag 1.0.0
```
