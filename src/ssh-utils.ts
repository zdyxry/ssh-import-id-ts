import {exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {die, fpToString} from './utils';
import {promisify } from 'util';

const execAsync = promisify(exec);


export async function getKeyFingerprint(keyFields: string[]): Promise<string[] | null> {
    if (keyFields.length < 2) return null;

    const tempFilePath = path.join(os.tmpdir(), `ssh-import-id-${Date.now()}.pub`);
    const keyContent = keyFields.join(' ');

    try {
        await fs.writeFile(tempFilePath, keyContent, { mode: 0o600 });
        const {stdout} = await execAsync(`ssh-keygen -l -f ${tempFilePath}`);
        if (!stdout) return null;
        return stdout.trim().split(/\s+/);
    } catch (error) {
        return null
    } finally {
        await fs.unlink(tempFilePath).catch(() => {});
    }
}

export function getAuthorizedKeysPath(outputFile?: string): string {
    if (outputFile) {
        return outputFile;
    }
    const home = os.homedir();
    if (!home) {
        die("Could not determine user's home directory.")
    }
    return path.join(home, '.ssh', 'authorized_keys');
}

export async function readAuthorizedKeys(filePath: string) : Promise<string[]> {
    try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        return content.split('\n').filter(line => line.trim() !== '');
    } catch (error) {
        return []
    }
}

export async function writeAuthorizedKeys(filePath: string, lines: string[], mode: 'w' | 'a'): Promise<void> {
    if (filePath === '-') {
        process.stdout.write(lines.join('\n\n') + '\n');
        return;
    }

    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });

    const content = lines.join('\n\n') + (lines.length > 0 ? '\n\n' : '');
    const flag = mode == 'a' ? 'a' : 'w';

    await fs.writeFile(filePath, content, { flag, mode: 0o600 });

}

export async function getExistingKeyFingerprints(lines: string[]): Promise<Set<string>> {
    const fingerprints = new Set<string>();
    for (const line of lines) {
        const sshFp = await getKeyFingerprint(line.split(/\s+/));
        if (sshFp) {
            fingerprints.add(fpToString(sshFp));
        }
    }
    return fingerprints;
}