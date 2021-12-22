import { version as versionTSVersion } from "./version.ts";
import {
    commitVersionTSAsync,
    getCurrentVersionAsync,
    incrementVersion,
    saveVersionAsync,
    tagVersionAsync,
    stringToVersion,
    versionToString,
} from "./mod.ts";
import {
    logUsage,
    processFlags,
} from "https://deno.land/x/flags_usage@2.0.0/mod.ts";

const flagInfo = {
    preamble: "Usage: version_ts [options] [major|minor|patch]",
    description: {
        "increment": "Increments the specified version component",
        "set": "Overwrites the existing version with the specified version",
        "get": "Prints the current version",
        "commit": "Automatically commit the updated version.ts using Git",
        "tag": "Adds a Git tag for the current version",
        "version": "Prints the version of version_ts itself (not the current module!)",
    },
    argument: {
        "increment": "major|minor|patch",
        "set": "version",
    },
    alias: {
        "increment": "i",
        "set": "s",
        "get": "g",
        "commit": "c",
        "tag": "t",
    },
    boolean: [
        "get",
        "commit",
        "tag",
        "version",
    ],
    string: [
        "increment",
        "set",
    ],
};

const defaultVersionString = "0.1.0";
const flags = processFlags(Deno.args, flagInfo);
try {
    if (flags._.length > 1) {
        throw `Expected 0 or 1 arguments, but got ${flags._.length}`;
    }

    // --version (of version_ts itself!)
    if (flags.version) {
        console.log(`version_ts version: ${versionTSVersion}`);
    }

    if (flags.set || flags.increment || flags._[0] || flags.get) {
        // Read "version.ts" or use default
        const originalVersion = (await getCurrentVersionAsync());
        let version = originalVersion ?? stringToVersion(defaultVersionString);

        // --set
        if (flags.set) {
            version = stringToVersion(flags.set);
        }

        // --increment
        const component: string = flags.increment ?? flags._[0];
        if (component) {
            version = incrementVersion(version, component);
        }

        // --get
        if (flags.get) {
            console.log(versionToString(version));
        }

        // Update "version.ts"
        if (version !== originalVersion) {
            await saveVersionAsync(version);
            console.log(`Updated version from ${originalVersion ? versionToString(originalVersion) : "(none)"} to ${versionToString(version)}`);
        }
    }

    // --commit
    if (flags.commit) {
        await commitVersionTSAsync();
    }

    // --tag
    if (flags.tag) {
        await tagVersionAsync();
    }
} catch (error) {
    console.log(`Error: ${error.toString()}`);
    logUsage(flagInfo);
}
