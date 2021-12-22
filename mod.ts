export interface Version {
    major: number;
    minor: number;
    patch: number;
}

const versionPattern = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
export function stringToVersion(versionString: string): Version {
    const components = versionPattern.exec(versionString);
    if (!components) {
        throw `Invalid version string: ${versionString}`;
    }

    return {
        major: parseInt(components[1]),
        minor: parseInt(components[2]),
        patch: parseInt(components[3]),
    };
}

export function versionToString(version: Version): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

const versionFilePattern = /^export const version = "((0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))";$/
export function fileToString(text: string): string {
    const matches = versionFilePattern.exec(text);
    if (!matches) {
        throw `Invalid version.ts: ${text}`;
    }
    return matches[1];
}

export function stringToFile(versionString: string): string {
    return `export const version = "${versionString}";`
}

const componentIndex = {
    "major": 0,
    "minor": 1,
    "patch": 2,
};

export function incrementVersion(currentVersion: Version, component: "major" | "minor" | "patch"): Version {
    const components = [currentVersion.major, currentVersion.minor, currentVersion.patch];
    const index = componentIndex[component];
    components[index]++;
    for (let i = index + 1; i < components.length; i++) {
        components[i] = 0;
    }

    const [major, minor, patch] = components;
    return { major, minor, patch };
}
