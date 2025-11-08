# Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) to automate version management and releases.

## How It Works

Release Please automatically:
1. **Analyzes commits** since the last release using [Conventional Commits](https://www.conventionalcommits.org/)
2. **Determines version bump** (major, minor, or patch) based on commit types
3. **Creates a Release PR** with updated version numbers and CHANGELOG
4. **Creates a GitHub Release** when the Release PR is merged

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types and Version Bumps

| Type | Version Bump | Description | Example |
|------|--------------|-------------|---------|
| `feat:` | **Minor** (1.x.0) | New feature | `feat: add backup encryption` |
| `fix:` | **Patch** (1.0.x) | Bug fix | `fix: resolve Docker build error` |
| `perf:` | **Patch** | Performance improvement | `perf: optimize Git operations` |
| `docs:` | **Patch** | Documentation only | `docs: update API reference` |
| `chore:` | **Patch** | Maintenance tasks | `chore: bump dependencies` |
| `refactor:` | **Patch** | Code refactoring | `refactor: simplify auth logic` |
| `BREAKING CHANGE:` | **Major** (x.0.0) | Breaking change | See below |

### Breaking Changes

To trigger a **major version bump**, include `BREAKING CHANGE:` in the commit footer:

```
feat: migrate to new authentication system

BREAKING CHANGE: The old API key authentication has been removed.
Users must migrate to OAuth2. See migration guide in docs/MIGRATION.md
```

Or use `!` after the type:

```
feat!: remove support for Node.js 16
```

## Examples

### Feature (Minor bump: 1.5.2 → 1.6.0)
```
feat: add multi-repository support

Allow users to manage multiple Home Assistant instances
with separate Git repositories.
```

### Bug Fix (Patch bump: 1.5.2 → 1.5.3)
```
fix: resolve package-lock.json missing in Docker build

The Docker build was failing because npm ci requires a package-lock.json
file. Added the missing file and updated .gitignore.
```

### Breaking Change (Major bump: 1.5.2 → 2.0.0)
```
feat!: redesign settings API

BREAKING CHANGE: Settings API endpoints have been restructured.
- /api/settings → /api/v2/configuration
- Request/response format has changed
```

### Other Types
```
docs: update installation guide
chore: update dependencies to latest versions
perf: improve Git diff calculation speed
refactor: extract crypto utilities to separate module
test: add integration tests for backup service
ci: add automated Docker image builds
```

## Release Workflow

### 1. Develop with Conventional Commits

Make changes and commit using conventional commits:

```bash
git commit -m "feat: add scheduled backup feature"
git commit -m "fix: resolve timezone issue in scheduler"
git push origin main
```

### 2. Release Please Creates a PR

After commits are pushed to `main`, Release Please automatically:
- Creates/updates a **Release PR**
- Updates version in:
  - `config.yaml`
  - `Dockerfile`
  - `backend/package.json`
  - `frontend/package.json`
  - `backend/package-lock.json`
  - `frontend/package-lock.json`
- Updates `CHANGELOG.md` with all changes

### 3. Review the Release PR

Review the auto-generated Release PR:
- Check version bump is correct
- Verify CHANGELOG entries
- Ensure all files are updated

### 4. Merge the Release PR

When you merge the Release PR:
- Version numbers are updated in all files
- CHANGELOG is updated
- A Git tag is created (e.g., `v1.6.0`)
- A GitHub Release is published

### 5. Release is Published

The release is now live! Users can:
- See the release on GitHub Releases page
- Install the new version from Home Assistant
- View the CHANGELOG for what's new

## Manual Version Override

If you need to manually bump the version:

1. Edit `.github/release-please-manifest.json`:
   ```json
   {
     ".": "1.6.0"
   }
   ```

2. Commit and push to `main`

3. Release Please will use this version for the next release

## Scopes (Optional)

You can add scopes for better organization:

```
feat(ui): add dark mode toggle
fix(api): resolve authentication timeout
docs(readme): add Docker Compose example
```

## Multiple Commits in One Release

Release Please groups all commits since the last release:

```bash
git commit -m "feat: add backup encryption"
git commit -m "feat: add backup compression"
git commit -m "fix: resolve memory leak in watcher"
git push
```

This creates one Release PR with:
- Version bump: 1.5.2 → 1.6.0 (two features = minor bump)
- CHANGELOG with all three commits listed

## Best Practices

1. **Always use conventional commits** - This ensures proper versioning
2. **Write clear descriptions** - These become your CHANGELOG
3. **One logical change per commit** - Makes CHANGELOG easier to read
4. **Review Release PRs carefully** - They represent what users will see
5. **Don't edit CHANGELOG manually** - Let Release Please manage it
6. **Use scopes for clarity** - `feat(backup):`, `fix(ui):`, etc.

## Troubleshooting

### Release PR not created?

Check:
- Commits use conventional commit format
- Commits are pushed to `main` branch
- GitHub Actions workflow is enabled

### Wrong version bump?

- Check commit types match your intent
- Use `!` or `BREAKING CHANGE:` for major bumps
- Review `.github/release-please-config.json`

### Files not updated?

Check `extra-files` in `.github/release-please-config.json`

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Semantic Versioning](https://semver.org/)
