import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { GetAppxPackage } from './Appx';
import { readIni } from './Ini';

/**
 * Filters out paths that don't exist.
 * @param paths The paths.
 */
function checkExists(paths: string[]): string[] {
    const existingPaths = paths.filter(fs.existsSync);
    if(existingPaths.length === 0) {
        throw new Error("Could not determine the location of Bedrock's data files. The game is not installed or is installed in an unsupported location.");
    }
    return existingPaths;
}

/**
 * Gets the Bedrock data locations for the current platform.
 *
 * Windows
 *  - %LOCALAPPDATA%/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang
 *
 * MacOS
 *  - $HOME/Library/Application Support/mcpelauncher/games/com.mojang
 *
 * linux
 *  - $HOME/.local/share/mcpelauncher/games/com.mojang
 *  - $HOME/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang
 *
 * Android
 *  - /data/data/com.mojang.minecraftpe/games/com.mojang
 *  - /sdcard/games/com.mojang
 */
export async function getDataLocations(): Promise<string[]> {
    const platform = os.platform();
    switch (platform) {
        case "win32": return checkExists(getDataLocations_Windows());
        case "darwin": return checkExists(getDataLocations_MacOS());
        case "linux": return checkExists(getDataLocations_Linux());
        case "android": return checkExists(getDataLocations_Android());
        default:
            throw new Error(`Could not determine the location of Bedrock's data files. The current platform (${platform}) is not supported. Supported platforms: win32 (Windows), darwin (MacOS), linux, android`);
    }
}

/**
 * Gets the Bedrock data location on Windows.
 */
function getDataLocations_Windows(): string[] {
    if (process.env["LOCALAPPDATA"]) {
        return [
            path.join(process.env["LOCALAPPDATA"], "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang"),
        ];
    }
    else {
        throw new Error("Could not determine the location of Bedrock's data files. The LOCALAPPDATA environment variable is missing.");
    }
}

/**
 * Gets the Bedrock data location on MacOS.
 */
function getDataLocations_MacOS(): string[] {
    return [
        path.join(os.homedir(), "Library/Application Support/mcpelauncher/games/com.mojang"),
    ];
}

/**
 * Gets the Bedrock data location on Linux.
 */
function getDataLocations_Linux(): string[] {
    return [
        path.join(os.homedir(), ".local/share/mcpelauncher/games/com.mojang"),
        path.join(os.homedir(), ".var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang"),
    ];
}

/**
 * Gets the Bedrock data locations on Android.
 */
function getDataLocations_Android(): string[] {
    return [
        "/data/data/com.mojang.minecraftpe/games/com.mojang",
        "/sdcard/games/com.mojang",
    ];
}

/**
 * Gets the Bedrock assets locations for the current platform.
 *
 * Windows
 *  - {AppxPackage.InstallLocation}/data
 *
 * MacOS
 *  - $HOME/Library/Application Support/mcpelauncher/versions/{CurrentVersion}/assets
 *
 * linux
 *  - $HOME/.local/share/mcpelauncher/versions/{CurrentVersion}/assets
 *  - $HOME/.var/app/io.mrarm.mcpelauncher/data/mcpelauncher/versions/{CurrentVersion}/assets
 *
 * Android
 *  - {APKFile}/assets
 */
export async function getAssetsLocations(): Promise<string[]> {
    const platform = os.platform();
    switch (platform) {
        case "win32": return checkExists(await getAssetsLocations_Windows());
        case "darwin": return checkExists(await getAssetsLocations_MacOS());
        case "linux": return checkExists(await getAssetsLocations_Linux());
        default:
            throw new Error(`Could not determine the location of Bedrock's asset files. The current platform (${platform}) is not supported. Supported platforms: win32 (Windows), darwin (MacOS), linux`);
    }
}

/**
 * Gets the Bedrock assets location on Windows.
 *
 * Since Bedrock on Windows is installed as a Windows Store package, it's
 * install location changes for each version. Here we use a powershell
 * command to get the package data which contains the current location.
 */
async function getAssetsLocations_Windows(): Promise<string[]> {
    let packageData;
    try {
        packageData = await GetAppxPackage("Microsoft.MinecraftUWP");
    }
    catch(e) {
        throw new Error(`Could not determine the location of Bedrock's asset files. The package details command returned the following error:\n${e.message}`);
    }

    return [
        path.join(packageData.InstallLocation, "data"),
    ];
}

/**
 * Gets the Bedrock install location on MacOS.
 *
 * MacOS doesn't have an official bedrock release. The current solution uses
 * the `mcpe-launcher` project.
 */
async function getAssetsLocations_MacOS(): Promise<string[]> {
    const mcpeLauncherPaths = [
        path.join(os.homedir(), "Library/Application Support/mcpelauncher/"),
    ];

    const existingPaths = mcpeLauncherPaths.filter(fs.existsSync);
    return await Promise.all(existingPaths.map(getAssetsLocation_mcpelauncher));
}

/**
 * Gets the Bedrock assets location on Linux.
 *
 * Linux doesn't have an official bedrock release. The current solution uses
 * the `mcpe-launcher` project.
 * ``
 */
async function getAssetsLocations_Linux(): Promise<string[]> {
    const mcpeLauncherPaths = [
        path.join(os.homedir(), ".local/share/mcpelauncher"),
        path.join(os.homedir(), ".var/app/io.mrarm.mcpelauncher/data/mcpelauncher"),
    ];

    const existingPaths = mcpeLauncherPaths.filter(fs.existsSync);
    return await Promise.all(existingPaths.map(getAssetsLocation_mcpelauncher));
}

/*
 * Android assets are contained in the .apk file, so we can't really give a path to them.
 *
 * To find the .apk file, run one of the following commands in an adb shell:
 *  - `cmd package list packages -f com.mojang.minecraftpe`
 *  - `pm list packages -f com.mojang.minecraftpe`
 *
 * Note that some devices may have split apks, in which case you should use:
 *  - `pm path com.mojang.minecraftpe`
 *
 * Example:
 * ```
 * $ adb shell pm path com.mojang.minecraftpe
 * package:/data/app/~~tQp6irJBVF0POl5ZTiVTGg==/com.mojang.minecraftpe-dzmUWtEpO9XzVa6S58PfaA==/base.apk
 * package:/data/app/~~tQp6irJBVF0POl5ZTiVTGg==/com.mojang.minecraftpe-dzmUWtEpO9XzVa6S58PfaA==/split_config.arm64_v8a.apk
 * package:/data/app/~~tQp6irJBVF0POl5ZTiVTGg==/com.mojang.minecraftpe-dzmUWtEpO9XzVa6S58PfaA==/split_config.xxxhdpi.apk
 * ```
 *
 * You can download those files using adb:
 * ```
 * $  adb pull <file>
 * ```
 */

/**
 * Gets the assets location for the most recent minecraft version in an
 * mcpe-launcher installation.
 * @param rootInstallPath The mcpe-launcher installation path
 */
async function getAssetsLocation_mcpelauncher(rootInstallPath: string): Promise<string> {
    // Get the versions file
    const versionsIniPath = path.join(rootInstallPath, "versions/versions.ini");

    let iniData;
    try {
        iniData = await readIni(versionsIniPath);
    }
    catch (error) {
        throw new Error(`Could not determine the location of Bedrock's asset files. There was an error reading the mcpe-launcher versions.ini file.\nPath: ${error.path}\nCode: ${error.code}`);
    }

    const versions = [...iniData.sections.values()]
        .map(parseVersionSection)
        .filter(v => !Number.isNaN(v.versionCode) && v.versionName);

    // Find the latest
    let maxVersion = versions[0];
    for (const version of versions) {
        if (version.versionCode > maxVersion.versionCode) maxVersion = version;
    }

    if (!maxVersion) {
        throw new Error(`Could not determine the location of Bedrock's asset files. The mcpe-launcher versions file did not contain a valid version (or the format has been changed).\nPath: ${versionsIniPath}`);
    }
    else {
        return path.join(rootInstallPath, "versions", maxVersion.versionName, "assets");
    }
}

interface MCPEVersion {
    versionCode: number;
    versionName: string;
}

/**
 * Parses a version information section from an mcpe-launcher versions file.
 * @param section The INI section.
 */
function parseVersionSection(section: Map<string, string>): MCPEVersion {
    return {
        versionCode: Number.parseInt(section.get("versionCode") as string),
        versionName: section.get("versionName") || "",
    };
}
