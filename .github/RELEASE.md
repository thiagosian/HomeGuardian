# Release Process

This project uses [Semantic Release](https://github.com/semantic-release/semantic-release) with custom rules for strict version control.

## Project Versioning Policy

**This project uses EXPLICIT version control with PATCH-FIRST strategy:**

### Version Format: X.Y.Z

- **X (Major)**: NEVER auto-increments. Requires `[MAJOR]` marker in commit message
- **Y (Minor)**: NEVER auto-increments. Requires `[MINOR]` marker in commit message
- **Z (Patch)**: AUTO-increments by default for ANY commit
- **Y and Z can go up to 999** (e.g., 1.5.999 → 1.6.0, or 1.999.0 → 2.0.0)

### Version Bump Rules

| Commit Message | Version Bump | Example |
|----------------|--------------|---------|
| `ANY commit without marker` | **PATCH** (X.Y.Z → X.Y.Z+1) | 1.5.2 → 1.5.3 |
| `Message [MINOR]` or `[minor]` | **MINOR** (X.Y.Z → X.Y+1.0) | 1.5.999 → 1.6.0 |
| `Message [MAJOR]` or `[major]` | **MAJOR** (X.Y.Z → X+1.0.0) | 1.999.0 → 2.0.0 |

## How It Works

Semantic Release automatically:
1. **Analyzes commits** since the last release/tag
2. **Determines version bump** based on markers (`[MINOR]`, `[MAJOR]`, or default PATCH)
3. **Updates all version files** (config.yaml, Dockerfile, package.json, package-lock.json)
4. **Creates a Git tag** (e.g., `v1.5.3`)
5. **Creates a GitHub Release** with auto-generated changelog
6. **All automatic** - no PRs to merge, happens on push to `main`

## Commit Message Examples

### ✅ DEFAULT: Patch Bump (1.5.2 → 1.5.3)

**99% of commits should be like this - NO marker needed:**

```bash
git commit -m "fix: resolve Docker build error"
git commit -m "chore: update dependencies"
git commit -m "feat: add backup encryption feature"
git commit -m "docs: update installation guide"
git commit -m "refactor: simplify authentication logic"
```

**Result:** Version bumps from 1.5.2 → 1.5.3 automatically

### ⚠️ EXPLICIT: Minor Bump (1.5.2 → 1.6.0)

**Use ONLY when you consciously want a minor version bump:**

```bash
git commit -m "feat: major UI redesign [MINOR]"
```

Or:

```bash
git commit -m "chore: release milestone features [minor]"
```

**Result:** Version bumps from 1.5.2 → 1.6.0

### 🚨 EXPLICIT: Major Bump (1.5.2 → 2.0.0)

**Use ONLY for breaking changes that warrant major version:**

```bash
git commit -m "refactor: redesign entire API structure [MAJOR]"
```

Or:

```bash
git commit -m "feat: breaking changes to settings format [major]"
```

**Result:** Version bumps from 1.5.2 → 2.0.0

## Release Workflow

### 1. Make changes and commit

```bash
# Normal development - just commit, NO marker needed
git commit -m "fix: resolve memory leak in watcher"
git commit -m "chore: add new backup feature"
git commit -m "docs: update API documentation"
git push origin main
```

### 2. Automatic Release

When you push to `main`:
- ✅ GitHub Actions workflow runs
- ✅ Semantic Release analyzes commits
- ✅ Version bumps to 1.5.3 (patch increment)
- ✅ All files updated automatically
- ✅ Git tag `v1.5.3` created
- ✅ GitHub Release published
- ✅ CHANGELOG.md updated

### 3. Check the Release

Go to GitHub Releases page:
```
https://github.com/thiagosian/HomeGuardian/releases
```

You'll see:
- New release `v1.5.3`
- Auto-generated changelog
- All changes since last release

## Multiple Commits in One Push

```bash
git commit -m "fix: resolve timeout issue"
git commit -m "chore: add compression feature"
git commit -m "docs: update readme"
git push origin main
```

**Result:** One release created (v1.5.2 → v1.5.3) with all 3 commits in changelog

## Version Examples

### Going to 999

```bash
# Patch can go to 999
1.5.2 → 1.5.3 → ... → 1.5.999

# Then use [MINOR] to bump
git commit -m "chore: milestone release [MINOR]"
# Result: 1.5.999 → 1.6.0
```

```bash
# Minor can go to 999
1.5.0 → 1.6.0 → ... → 1.999.0

# Then use [MAJOR] to bump
git commit -m "refactor: breaking changes [MAJOR]"
# Result: 1.999.0 → 2.0.0
```

## Tags and Releases

### Automatic Tagging

Every release creates a Git tag:
```
v1.5.3
v1.5.4
v1.6.0
v2.0.0
```

### Latest Tag

The most recent release is automatically tagged as `latest` on GitHub.

### View All Releases

```bash
# List all tags
git tag -l

# Fetch latest tags
git fetch --tags

# Checkout specific version
git checkout v1.5.3
```

## Best Practices

1. **DEFAULT TO PATCH** - Don't add markers to 99% of commits
2. **Use descriptive messages** - They become your changelog
3. **[MINOR] for milestones** - Use when you want to mark a significant set of features
4. **[MAJOR] for breaking changes** - Use very sparingly, only for actual API/config breaks
5. **Commit frequently** - Each push to main creates ONE release with all commits
6. **Check releases** - Review the auto-generated changelog after each push

## Quick Reference Card

```
DEFAULT (no marker):
  ANY commit → PATCH bump (Z+1)
  Examples:
    fix: resolve bug
    feat: add feature
    chore: maintenance
    docs: documentation
    refactor: improve code
    perf: optimization
    build: build system
    ci: CI/CD
    test: tests

EXPLICIT [MINOR] or [minor]:
  ANY commit [MINOR] → MINOR bump (Y+1, Z=0)
  Example:
    feat: milestone features [MINOR]

EXPLICIT [MAJOR] or [major]:
  ANY commit [MAJOR] → MAJOR bump (X+1, Y=0, Z=0)
  Example:
    refactor: breaking changes [MAJOR]
```

## Troubleshooting

### Release not created?

Check:
- Commits are pushed to `main` branch
- GitHub Actions workflow is enabled
- `GITHUB_TOKEN` has write permissions
- There are new commits since last release

### Wrong version bump?

Check commit message:
- NO marker = patch (intended?)
- Has `[MINOR]` = minor bump
- Has `[MAJOR]` = major bump

### Files not updated?

Check `.github/scripts/update-versions.js` is updating all files correctly.

## Comparison with Standard Semantic Versioning

| Standard semver | This Project |
|-----------------|--------------|
| `feat:` → minor | `feat:` → **patch** |
| `fix:` → patch | `fix:` → **patch** |
| `BREAKING CHANGE` → major | `[MAJOR]` → **major** |
| Auto major bumps | **NEVER** auto major |

## Resources

- [Semantic Release Documentation](https://github.com/semantic-release/semantic-release)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
