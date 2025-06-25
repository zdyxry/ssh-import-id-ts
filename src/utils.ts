import os from 'os';
import { version } from '../package.json';

export function die(msg: string): never {
    console.error(`Error: ${msg}`);
    process.exit(1);
}

export function buildUserAgent(extra: string = ""): string {
    const sshImportId = `ssh-import-id-ts/${version}`;
    const node = `node/${process.version}`;
    const platform = `${os.type()}/${os.release()}/${os.arch()}`;
    return `${sshImportId} ${node} ${platform} ${extra}`.trim();
}

export function fpToString(fp: string[]): string {
    if (fp.length < 3) return '';
    return `${fp[0]} ${fp[1]} ${fp[fp.length -1]}`;
}
