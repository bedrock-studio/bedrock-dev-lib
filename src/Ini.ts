import { readFile } from "fs/promises";

export interface IniData {
    global: Map<string, string>;
    sections: Map<string, Map<string, string>>;
}

/**
 * Parses an INI file.
 * @param data The file data.
 */
export function parseIni(data: string): IniData {
    const iniData: IniData = { global: new Map(), sections: new Map() };
    const lines = data.split("\n");
    let currentSection = iniData.global;
    for (const line in lines) {
        // Blank line or comment
        if (!line || line.startsWith(";")) {
            continue;
        }
        // Section header
        if (line.startsWith("[") && line.endsWith("]")) {
            currentSection = new Map<string, string>();
            iniData.sections.set(line.slice(1, -1), currentSection);
            continue;
        }
        // Key/value
        const [key, value] = line.split("=", 2);
        currentSection.set(key, value);
    }
    return iniData;
}

/**
 * Reads and parses an INI file.
 * @param path The path to the INI file.
 */
export async function readIni(path: string): Promise<IniData> {
    return parseIni(await readFile(path, { encoding: 'utf8', flag: 'r' }));
}
