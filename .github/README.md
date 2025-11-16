# c3-parsing GitHub Actions Workflows

This directory contains the CI/CD workflows for the c3-parsing library.

## Workflows

### 1. ci.yml - Library CI

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Purpose:**
Continuous Integration for the library, ensuring code quality and build success.

**What it does:**
1. Checks out the repository
2. Configures Node.js with GitHub Packages authentication
3. Installs dependencies from GitHub Packages (`npm ci`)
4. Runs type checking (`npm run typecheck`)
5. Runs tests (`npm test`)
6. Builds the package (`npm run build`)
7. Tests on Node.js 18.x and 20.x

**Key Features:**
- Uses published `@garrick0/c3-shared` from GitHub Packages
- Matrix testing across Node versions
- Simple, fast, no multi-repo orchestration needed
- Debug artifact uploads on failure

### 2. publish.yml - Publish Package

**Triggers:**
- Push to `main` branch (auto-publishes dev version)
- Pull requests to `main` branch (test only)
- Manual workflow dispatch (for releases)

**Purpose:**
Automated package publishing to GitHub Packages with version management.

**Jobs:**

#### test
- Runs on all triggers
- Installs dependencies from GitHub Packages
- Executes full test suite
- Gates publishing jobs

#### publish-dev
- Runs only on push to `main`
- Automatically publishes dev version tagged with commit SHA
- Format: `2.0.0-dev.<short-sha>.0`
- Publishes to GitHub Packages with `dev` tag

#### publish-release
- Runs only on manual workflow dispatch
- Supports multiple release types:
  - `dev`: Development snapshot
  - `canary`: Canary/preview release
  - `patch`: Patch version bump (0.0.x)
  - `minor`: Minor version bump (0.x.0)
  - `major`: Major version bump (x.0.0)
- Creates Git tags for non-dev/canary releases
- Creates GitHub Releases for stable versions
- Publishes to GitHub Packages

## GitHub Packages Integration

This library consumes `@garrick0/c3-shared` from GitHub Packages. The workflows use a simple, standard npm approach:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@garrick0'

- name: Install dependencies
  run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This approach:
- ✅ Uses published packages (no building from source)
- ✅ Fast and cached by GitHub
- ✅ Proper version management
- ✅ Standard npm workflow
- ✅ Automatically authenticated via `GITHUB_TOKEN`

## Local Development

For local development without a GitHub token, use npm link:

```bash
# In c3-shared directory
cd /Users/samuelgleeson/dev/c3-shared
npm link

# In c3-parsing directory
cd /Users/samuelgleeson/dev/c3-parsing
npm link @garrick0/c3-shared
npm install
```

This creates a local symlink to `c3-shared` without needing GitHub Packages authentication.

## Permissions

The publish workflows require these permissions:
- `contents: write` - For creating tags and releases
- `packages: write` - For publishing to GitHub Packages

These are automatically available via `GITHUB_TOKEN` in GitHub Actions.

## Troubleshooting

### CI Fails with "401 Unauthorized"
- Verify the `NODE_AUTH_TOKEN` environment variable is set to `${{ secrets.GITHUB_TOKEN }}`
- Ensure workflow has `packages: read` permissions (granted by default for GITHUB_TOKEN)
- Check that the `.npmrc` file is properly configured

### Dependency Installation Fails
- Verify `@garrick0/c3-shared` has been published to GitHub Packages
- Check that `.npmrc` points to the correct registry
- Ensure package name in `package.json` matches the scoped name

### "Package not found" Error
- Confirm `@garrick0/c3-shared` exists in GitHub Packages
- Verify you're using the correct tag (e.g., `dev`)
- Check package visibility settings in GitHub

### Build Fails After Installing
- Verify TypeScript compatibility between packages
- Check for breaking changes in `c3-shared`
- Ensure all peer dependencies are installed

## Package Registry Configuration

The `.npmrc` file configures GitHub Packages:

```ini
@garrick0:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
registry=https://registry.npmjs.org
```

This tells npm:
1. Packages under `@garrick0` scope come from GitHub Packages
2. Use `NODE_AUTH_TOKEN` for authentication
3. All other packages come from the standard npm registry

## Benefits vs Building from Source

### Old Approach (Build from Source):
- ❌ Every CI run rebuilds dependencies
- ❌ Complex multi-repo checkout
- ❌ Longer CI times
- ❌ No version control for dependencies
- ❌ 60+ line workflows

### Current Approach (GitHub Packages):
- ✅ Dependencies installed from registry
- ✅ Simple single-repo checkout
- ✅ Fast CI times (cached packages)
- ✅ Proper semantic versioning
- ✅ 20-30 line workflows

## Related Documentation

- [CI/CD Orchestration Analysis](/Users/samuelgleeson/dev/c3-platform/docs/CI-CD-ORCHESTRATION-ANALYSIS.md)
- [Implementation Guide](/Users/samuelgleeson/dev/c3-platform/docs/IMPLEMENTATION-GUIDE.md)
- [CI Fix Summary](../CI-FIX-SUMMARY.md)
