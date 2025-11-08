# Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) to automate version management and releases.

## Project Versioning Policy

**This project follows a PATCH-FIRST versioning strategy:**

- **Default**: PATCH bumps (1.5.2 → 1.5.3 → 1.5.4 → ... → 1.5.999)
- **Explicit**: MINOR bumps only when explicitly needed (1.5.x → 1.6.0)
- **Breaking**: MAJOR bumps only for breaking changes (1.x.x → 2.0.0)

**Use PATCH-bump commit types for all normal development:**
- `fix:`, `chore:`, `refactor:`, `docs:`, `perf:`, `build:`, `ci:`, `test:`

**Use `feat:` ONLY when you explicitly want a MINOR version bump.**

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

**⚠️ IMPORTANT: Use PATCH-bump types by default! Only use `feat:` when you explicitly want a MINOR version bump.**

| Type | Version Bump | When to Use | Example |
|------|--------------|-------------|---------|
| `fix:` | **Patch** (1.5.x) ✅ DEFAULT | Bug fixes | `fix: resolve Docker build error` |
| `chore:` | **Patch** (1.5.x) ✅ DEFAULT | Maintenance, deps | `chore: update dependencies` |
| `refactor:` | **Patch** (1.5.x) ✅ DEFAULT | Code improvements | `refactor: simplify auth logic` |
| `perf:` | **Patch** (1.5.x) ✅ DEFAULT | Performance | `perf: optimize Git operations` |
| `docs:` | **Patch** (1.5.x) ✅ DEFAULT | Documentation | `docs: update API reference` |
| `build:` | **Patch** (1.5.x) ✅ DEFAULT | Build system | `build: update Docker config` |
| `ci:` | **Patch** (1.5.x) ✅ DEFAULT | CI/CD changes | `ci: add release workflow` |
| `test:` | **Patch** (1.5.x) ✅ DEFAULT | Tests only | `test: add unit tests` |
| `feat:` | **Minor** (1.x.0) ⚠️ EXPLICIT | New features (use sparingly) | `feat: add backup encryption` |
| `BREAKING CHANGE:` | **Major** (x.0.0) ⚠️ EXPLICIT | Breaking changes | See below |

**✅ Recommended workflow:**
- 99% of commits should use PATCH-bump types (`fix:`, `chore:`, `refactor:`, etc.)
- Patch version can go up to .999 without issues (1.5.2 → 1.5.999)
- Only use `feat:` when you consciously want to bump MINOR version
- Only use `BREAKING CHANGE:` for actual breaking changes

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

### ✅ Normal Development (Patch bump: 1.5.2 → 1.5.3)

Most commits should be PATCH bumps:

```bash
# Bug fix
fix: resolve package-lock.json missing in Docker build

# Add new functionality (but use chore/refactor instead of feat)
chore: add support for multi-repository management

# Improve existing code
refactor: simplify authentication logic

# Performance improvement
perf: optimize Git diff calculation

# Documentation
docs: update installation guide

# Maintenance
chore: update dependencies to latest versions

# CI/CD
ci: add automated Docker image builds
```

### ⚠️ Explicit Minor Bump (1.5.2 → 1.6.0)

Use `feat:` ONLY when you explicitly want a MINOR bump:

```bash
feat: major UI redesign with new component library

This is a significant milestone that warrants a minor version bump.
Includes complete redesign of the dashboard and settings pages.
```

### 🚨 Breaking Change (Major bump: 1.5.2 → 2.0.0)

Use ONLY for actual breaking changes:

```bash
refactor!: redesign settings API

BREAKING CHANGE: Settings API endpoints have been restructured.
- /api/settings → /api/v2/configuration
- Request/response format has changed
Users must update their integrations.
```

## Release Workflow

### 1. Develop with Conventional Commits

Make changes and commit using conventional commits (prefer PATCH-bump types):

```bash
# ✅ RECOMMENDED: Use patch-bump types for most development
git commit -m "chore: add scheduled backup feature"
git commit -m "fix: resolve timezone issue in scheduler"
git commit -m "refactor: improve error handling in Git service"
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
# ✅ RECOMMENDED: All patch bumps → 1.5.2 → 1.5.3
git commit -m "chore: add backup encryption"
git commit -m "chore: add backup compression"
git commit -m "fix: resolve memory leak in watcher"
git push
```

This creates one Release PR with:
- Version bump: 1.5.2 → 1.5.3 (all patch = patch bump)
- CHANGELOG with all three commits listed

```bash
# ⚠️ If you include a feat: → 1.5.2 → 1.6.0
git commit -m "feat: major new feature set"
git commit -m "chore: add backup compression"
git commit -m "fix: resolve memory leak"
git push
```

This creates one Release PR with:
- Version bump: 1.5.2 → 1.6.0 (one feat = minor bump)
- CHANGELOG with all three commits listed

## Best Practices

1. **DEFAULT TO PATCH BUMPS** - Use `fix:`, `chore:`, `refactor:` for 99% of commits
2. **Avoid `feat:` unless necessary** - Only use when you explicitly want a MINOR bump
3. **Always use conventional commits** - This ensures proper versioning
4. **Write clear descriptions** - These become your CHANGELOG
5. **One logical change per commit** - Makes CHANGELOG easier to read
6. **Review Release PRs carefully** - They represent what users will see
7. **Don't edit CHANGELOG manually** - Let Release Please manage it
8. **Use scopes for clarity** - `chore(backup):`, `fix(ui):`, etc.

### Quick Reference Card

```
ALWAYS USE (99% of commits):
  fix:      - Bug fixes
  chore:    - New features, improvements, maintenance
  refactor: - Code improvements
  perf:     - Performance improvements
  docs:     - Documentation
  build:    - Build system
  ci:       - CI/CD
  test:     - Tests

USE SPARINGLY (when you want minor bump):
  feat:     - Major milestone features

USE RARELY (breaking changes only):
  BREAKING CHANGE: - API changes that break compatibility
```

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
