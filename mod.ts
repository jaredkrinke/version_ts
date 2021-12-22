// Model
const versionComponentIndexes = {
    "major": 0,
    "minor": 1,
    "patch": 2,
} as const;

type VersionComponent = keyof typeof versionComponentIndexes;
export type Version = { [ Property in VersionComponent ]: number };

// Parsing and encoding
const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
export function stringToVersion(versionString: string): Version {
    const components = versionPattern.exec(versionString);
    if (components) {
        return {
            major: parseInt(components[1]),
            minor: parseInt(components[2]),
            patch: parseInt(components[3]),
        };
    }
    throw `Invalid version string: ${versionString}`;
}

export function versionToString(version: Version): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

const typeScriptPattern = /^export const version = "((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))";$/
export function typeScriptToVersion(typeScript: string): Version {
    const matches = typeScriptPattern.exec(typeScript);
    if (matches) {
        return stringToVersion(matches[1]);
    }
    throw `Invalid version.ts: ${typeScript}`;
}

export function versionToTypeScript(version: Version): string {
    return `export const version = "${versionToString(version)}";`
}

// Manipulation
export function incrementVersion(currentVersion: Version, component: string): Version {
    switch (component) {
        case "major":
        case "minor":
        case "patch": {
            const components = [currentVersion.major, currentVersion.minor, currentVersion.patch];
            const index = versionComponentIndexes[component];
            components[index]++;
            for (let i = index + 1; i < components.length; i++) {
                components[i] = 0;
            }
        
            const [major, minor, patch] = components;
            return { major, minor, patch };
        }

        default:
            throw `Version component must be ${Object.keys(versionComponentIndexes).join("|")}, but got: ${component}`;
    }
}

// File handling
const fileName = "version.ts";
export async function getCurrentVersionAsync(): Promise<Version | undefined> {
    // Use default value if no previous version exists
    let text: string;
    try {
        text = await Deno.readTextFile(fileName);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            return undefined;
        }
        throw error;
    }

    return typeScriptToVersion(text);
}

export async function saveVersionAsync(version: Version): Promise<void> {
    await Deno.writeTextFile(fileName, versionToTypeScript(version));
}

// Tagging
export async function tagVersionAsync(version: Version): Promise<void> {
    const command = `git tag ${versionToString(version)}`;
    console.log(`Running command: ${command}`);
    const process = Deno.run({
        cmd: command.split(" "),
        stdin: "null",
    });

    await process.status();
}
