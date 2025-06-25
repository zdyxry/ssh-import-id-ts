# ssh-import-id-ts

A TypeScript command-line tool for importing SSH public keys from trusted online identities.

## Overview

`ssh-import-id-ts` is a TypeScript rewrite of the classic `ssh-import-id` tool, allowing you to easily import SSH public keys from platforms like GitHub and Launchpad into your `authorized_keys` file.

## Features

- Import SSH public keys from GitHub and Launchpad
- Automatic duplicate key detection to avoid redundant additions
- Support for removing previously imported keys
- Support for custom output files or stdout output
- Secure file permission handling (600 permissions)
- Key fingerprint verification

## Installation

```bash
npm install -g ssh-import-id-ts
```

Or install from source:

```bash
git clone https://github.com/zdyxry/ssh-import-id-ts.git
cd ssh-import-id-ts
npm install
npm run build
npm link
```

## Usage

### Basic Usage

```bash
# Import keys from GitHub (default protocol is gh)
ssh-import-id username

# Explicitly specify protocol
ssh-import-id gh:username
ssh-import-id lp:username

# Import keys from multiple users
ssh-import-id gh:user1 lp:user2 gh:user3
```

### Advanced Options

```bash
# Output to a specific file
ssh-import-id -o /path/to/custom/authorized_keys gh:username

# Output to stdout
ssh-import-id -o - gh:username

# Remove previously imported keys
ssh-import-id -r gh:username

# Custom User-Agent
ssh-import-id -u "MyApp/1.0" gh:username
```

### Command Line Options

- `-o, --output <file>`: Specify output file path (default: `~/.ssh/authorized_keys`, use `-` for stdout)
- `-r, --remove`: Remove keys for the specified user
- `-u, --useragent <string>`: Append custom User-Agent string
- `-h, --help`: Show help information
- `--version`: Show version information

## Supported Protocols

### GitHub (`gh`)
Import keys from GitHub user's public key API:
```bash
ssh-import-id gh:octocat
```

### Launchpad (`lp`)
Import keys from Launchpad user profile:
```bash
ssh-import-id lp:username
```

## How It Works

1. **Fetch Keys**: Retrieve user's SSH public keys from the specified platform's API or public page
2. **Validate Keys**: Use `ssh-keygen` to validate key format and generate fingerprints
3. **Check Duplicates**: Compare fingerprints to avoid adding duplicate keys
4. **Secure Write**: Append new keys to the `authorized_keys` file with proper permissions
5. **Add Labels**: Add comments to each imported key for easy management

## Examples

### Import a single user's keys
```bash
$ ssh-import-id gh:octocat
Importing SSH keys for gh:octocat
INFO: Authorized key 2048 SHA256:abc123...
Successfully added 1 new key(s).
```

### Remove previously imported keys
```bash
$ ssh-import-id -r gh:octocat
Removing SSH keys for gh:octocat
Successfully removed 1 key(s).
```

### Import to custom location
```bash
$ ssh-import-id -o ./my_keys gh:username
Importing SSH keys for gh:username
INFO: Authorized key 4096 SHA256:def456...
Successfully added 1 new key(s).
```

## Environment Configuration

### Launchpad Custom URL
You can customize the Launchpad URL through:

1. Environment variable:
   ```bash
   export URL="https://your-launchpad-instance.com/~%s/+sshkeys"
   ssh-import-id lp:username
   ```

2. Configuration file `/etc/ssh/ssh_import_id`:
   ```json
   {
     "URL": "https://your-launchpad-instance.com/~%s/+sshkeys"
   }
   ```

## Development

### Build
```bash
npm run build
```

### Development mode
```bash
npm run dev
```

## Dependencies

- **Node.js**: >= 16.0.0
- **axios**: HTTP client
- **yargs**: Command line argument parsing
- **ssh-keygen**: System tool (for key validation)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Issues and Pull Requests are welcome!

## Related Projects

- [ssh-import-id](https://github.com/dustinkirkland/ssh-import-id) - Original Python implementation