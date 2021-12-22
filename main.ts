import { version as verionTSVersion } from "./version.ts";

import {
    fileToString,
    incrementVersion,
    stringToFile,
    stringToVersion,
    versionToString,
    Version,
} from "./mod.ts";

import {
    logUsage,
    processFlags,
} from "https://deno.land/x/flags_usage@2.0.0/mod.ts";

const flagInfo = {
    preamble: "Usage: version_ts <major|minor|patch> | <options>",
    description: {
        "increment": "Increments the specified version component",
        "set": "Overwrites the existing version with the specified version",
        "get": "Prints the current version",
        "tag": "Adds a Git tag for the current version",
        "version": "Prints the version of version_ts (not the current module!)",
    },
    argument: {
        "increment": "major|minor|patch",
        "set": "version",
    },
    alias: {
        "increment": "i",
        "set": "s",
        "get": "g",
        "tag": "t",
    },
    boolean: [
        "get",
        "tag",
        "version",
    ],
    string: [
        "increment",
        "set",
    ],
};

const flags = processFlags(Deno.args, flagInfo);
try {
    if (flags._.length > 1) {
        throw `Expected 0 or 1 arguments, but got ${flags._.length}`;
    }

    if (flags._.length === 1) {
        flags["increment"] = flags._[0];
    }

    let update = false; // True if version.ts needs to be overwritten

    // --set, otherwise read the current version, defaulting to 1.0.0
    let version: Version;
    if (flags.set) {
        version = stringToVersion(flags.set);
        update = true;
    } else {
        // Use default value if no previous version exists
        let text = stringToFile("1.0.0");
        try {
            text = await Deno.readTextFile("version.ts");
        } catch (error) {
            // Let permission errors bubble up
            if (error instanceof Deno.errors.PermissionDenied) {
                throw error;
            }
        }
    
        version = stringToVersion(fileToString(text));
    }

    // --increment
    const component: string = flags["increment"];
    if (component) {
        switch (component) {
            case "major":
            case "minor":
            case "patch": {
                version = incrementVersion(version, component);
                update = true;
                break;
            }

            default:
                throw `Version component must be major|minor|patch, but got: ${component}`;
        }
    }

    // --get
    if (flags.get) {
        console.log(versionToString(version));
    }

    // --tag
    if (flags.tag) {
        console.log(`git tag ${versionToString(version)}`);
    }

    // --version (of version_ts -- NOT the current module)
    if (flags.version) {
        console.log(verionTSVersion);
    }

    // Update version.ts, if needed
    if (update) {
        await Deno.writeTextFile("version.ts", stringToFile(versionToString(version)));
    }
} catch (error) {
    console.log(`Error: ${error.toString()}`);
    console.log(logUsage(flagInfo));
}
