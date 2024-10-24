import { writeFile, readFile, stat, mkdir } from 'fs/promises';

const tempDir = './temp/';

export const writeJson = async (filename, data) => {
    await mkdir(tempDir, { recursive: true });
    const jsonString = JSON.stringify(data, null, 2);
    await writeFile(tempDir + filename, jsonString, 'utf-8');
}

export const readJson = async (filename) => {
    const jsonString = await readFile(tempDir + filename, 'utf-8');
    const data = JSON.parse(jsonString);
    return data;

};


export const isFileRecentlyCreated = async (filename, maxAgeInSeconds = 10 * 60) => {
    try {
        const stats = await stat(tempDir + filename);
        const fileAge = (Date.now() - stats.mtime.getTime()) / 1000;
        // console.log({ fileAge });
        return fileAge < maxAgeInSeconds
    } catch {
        return false;
    }
};