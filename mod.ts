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

// Git helpers
const textDecoder = new TextDecoder();
async function runCommandAndGetOutput(args: string[]): Promise<string> {
    console.log(`Running command: ${args.join(" ")}`);
    const process = Deno.run({
        cmd: args,
        stdin: "null",
        stdout: "piped",
    });
    return textDecoder.decode(await process.output());
}

async function getGitStatusAsync(): Promise<string[]> {
    const statusZOutput = await runCommandAndGetOutput(["git", "status", "-z"]);
    return statusZOutput.split("\0").filter(line => !!line);
}

export async function ensureCleanAsync(): Promise<void> {
    const files = await getGitStatusAsync();
    if (files.length > 0) {
        throw `First commit or revert uncommitted changes: ${files.join("; ")}`;
    }
}

// Committing
// TODO
// export async function commitVersionTSAsync(): Promise<void> {
//     const version = await getCurrentVersionAsync()
//     if (version) {
//         const files = await getGitStatusAsync();
//         if (files.length !== 1 || files[0] !== "version.ts") {
//             throw `Can't commit; expected exactly one file ("version.ts") to be modified, but the following files are modified: ${files.join(", ")}`;
//         }
    
//         await runCommandAndGetOutput(["git", "add", fileName]);
//         await runCommandAndGetOutput(["git", "commit", "-m", `Version ${versionToString(version)}`]);
//     }
// }

// Tagging
export async function tagVersionAsync(): Promise<void> {
    const version = await getCurrentVersionAsync()
    if (version) {
        await ensureCleanAsync();
        await runCommandAndGetOutput(["git", "tag", versionToString(version)]);
    }
}
