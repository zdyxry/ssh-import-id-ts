import axios from 'axios';
import {die, buildUserAgent} from './utils.js';
import fs from 'fs/promises';

interface GithubKey {
    id: number;
    key: string;
}

export async function fetchKeysGh(ghid: string, useragent: string): Promise<string[]> {
    const url = `https://api.github.com/users/${ghid}/keys`;

    try {
        const response = await axios.get<GithubKey[]>(url, {
            headers: {
                'User-Agent': useragent,
            }
        });

        if (response.headers['x-ratelimit-remaining'] === '0') {
            console.warn('Github API rate limit reached. See https://developer.github.com/v3/#rate-limiting');
        }

        return response.data.map(keyObj => `${keyObj.key}`);
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            die(`User ${ghid} not found on GitHub.`);
        }
        die(`Failed to fetch keys from Github for ${ghid}: ${error.message}`);
    }
}

export async function fetchKeysLp(lpid: string, useragent: string): Promise<string[]> {
  let url = `https://launchpad.net/~${encodeURIComponent(lpid)}/+sshkeys`;
  const confPath = "/etc/ssh/ssh_import_id";

  if (process.env.URL) {
    url = process.env.URL.replace('%s', encodeURIComponent(lpid));
  } else {
    try {
        await fs.access(confPath);
        const conf = JSON.parse(await fs.readFile(confPath, 'utf-8'));
        if (conf.URL) {
            url = conf.URL.replace('%s', encodeURIComponent(lpid));
        }
    } catch (e) {
    }
  }

  try {
    const response = await axios.get<string>(url, {
      headers: { 'User-Agent': buildUserAgent(useragent) }
    });
    return response.data.split('\n').filter(line => line.trim().startsWith('ssh-'));
  } catch (error: any) {
    die(`Failed to fetch keys from Launchpad for ${lpid}: ${error.message}`);
  }
}