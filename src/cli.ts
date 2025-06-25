#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { fetchKeysGh, fetchKeysLp } from './fetchers';
import {
  getAuthorizedKeysPath,
  readAuthorizedKeys,
  writeAuthorizedKeys,
  getKeyFingerprint,
  getExistingKeyFingerprints
} from './ssh-utils';
import { die, fpToString } from './utils';

interface CliArgs {
  output?: string;
  remove: boolean;
  useragent: string;
  _: (string | number)[];
  $0: string;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .usage('Usage: $0 [options] <USERID_1> [USERID_2] ...')
    .option('o', {
      alias: 'output',
      type: 'string',
      description: 'Write output to file (default: ~/.ssh/authorized_keys, use "-" for stdout)',
    })
    .option('r', {
      alias: 'remove',
      type: 'boolean',
      description: 'Remove a key from authorized keys file',
      default: false,
    })
    .option('u', {
      alias: 'useragent',
      type: 'string',
      description: 'Append to the http user agent string',
      default: '',
    })
    .demandCommand(1, 'You must provide at least one USERID.')
    .help()
    .alias('h', 'help')
    .version()
    .parse();

  const typedArgv = argv as unknown as CliArgs;

  const userids = typedArgv._.map(String);
  const { output, remove, useragent } = typedArgv;

  for (const userid of userids) {
    const parts = userid.split(':');
    const [proto, id] = parts.length > 1 ? parts : ['gh', parts[0]];

    if (!['gh', 'lp'].includes(proto)) {
      die(`Protocol "${proto}" is not supported. Use 'gh' or 'lp'.`);
    }

    if (remove) {
      await removeKeys(proto, id, output);
    } else {
      await importKeys(proto, id, output, useragent);
    }
  }
}

async function importKeys(proto: string, id: string, outputFile?: string, useragent?: string) {
  console.log(`Importing SSH keys for ${proto}:${id}`);

  const remoteKeys = proto === 'gh'
    ? await fetchKeysGh(id, useragent!)
    : await fetchKeysLp(id, useragent!);

  if (remoteKeys.length === 0) {
    console.log(`No keys found for ${proto}:${id}.`);
    return;
  }

  const authorizedKeysPath = getAuthorizedKeysPath(outputFile);
  const existingLines = await readAuthorizedKeys(authorizedKeysPath);
  const existingFingerprints = await getExistingKeyFingerprints(existingLines);

  const keysToAdd: string[] = [];
  const comment = `# ssh-import-id ${proto}:${id}`;

  for (const key of remoteKeys) {
    const keyFields = key.split(/\s+/);
    const fingerprint = await getKeyFingerprint(keyFields);

    if (fingerprint) {
      const fpStr = fpToString(fingerprint);
      if (existingFingerprints.has(fpStr)) {
        console.log(`INFO: Key ${fingerprint[1]}... already authorized.`);
      } else {
        const lineToAdd = `${key} ${comment}`;
        keysToAdd.push(lineToAdd);
        console.log(`INFO: Authorized key ${fingerprint[1]}...`);
      }
    }
  }

  if (keysToAdd.length > 0) {
    await writeAuthorizedKeys(authorizedKeysPath, keysToAdd, 'a');
    console.log(`\nSuccessfully added ${keysToAdd.length} new key(s).`);
  } else {
    console.log("\nNo new keys to add.");
  }
}

async function removeKeys(proto: string, id: string, outputFile?: string) {
  console.log(`Removing SSH keys for ${proto}:${id}`);

  const authorizedKeysPath = getAuthorizedKeysPath(outputFile);
  const existingLines = await readAuthorizedKeys(authorizedKeysPath);
  const comment = `# ssh-import-id ${proto}:${id}`;

  let removedCount = 0;
  const updatedLines = existingLines.filter(line => {
    if (line.trim().endsWith(comment)) {
      removedCount++;
      return false;
    }
    return true;
  });

  if (removedCount > 0) {
    await writeAuthorizedKeys(authorizedKeysPath, updatedLines, 'w');
    console.log(`Successfully removed ${removedCount} key(s).`);
  } else {
    console.log(`No keys found with label "${comment}" to remove.`);
  }
}

main().catch(error => {
  if (error instanceof Error) {
    die(error.message);
  } else {
    die('An unknown error occurred.');
  }
});