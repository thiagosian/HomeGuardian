# HomeGuardian Repository Structure Recommendation

**Date**: 2025-11-08
**Status**: Proposed
**Decision**: Monorepo with HACS Card Integration

---

## Executive Summary

**Recommendation**: Keep everything in `thiagosian/HomeGuardian` monorepo with a dedicated `hacs-card/` directory for the HACS-distributed Lovelace card.

**Rationale**: HomeGuardian is an **Add-on** (managed by Supervisor), while the version control card will be a **HACS Plugin** (different distribution channels). A monorepo allows unified development while respecting each ecosystem's requirements.

---

## Background: Add-ons vs HACS

### Key Distinction

```
┌─────────────────────────────────────────────────────────┐
│  Home Assistant Ecosystem                                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌──────────────────┐       │
│  │  ADD-ON STORE   │         │      HACS        │       │
│  │  (Supervisor)   │         │ (Community Store)│       │
│  └────────┬────────┘         └─────────┬────────┘       │
│           │                            │                 │
│           ▼                            ▼                 │
│  ┌─────────────────┐         ┌──────────────────┐       │
│  │  HomeGuardian   │◄────────┤ Version Card     │       │
│  │  Add-on         │  API    │ (Frontend Plugin)│       │
│  │  (Docker)       │         │ (JavaScript)     │       │
│  └─────────────────┘         └──────────────────┘       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Distribution Channels

| Component | Type | Installed Via | Repository File | User Action |
|-----------|------|---------------|-----------------|-------------|
| **HomeGuardian Add-on** | Docker Container | Supervisor Add-on Store | `repository.json` | Settings → Add-ons → Add repository |
| **Version Card** | Lovelace Plugin | HACS | `hacs-card/hacs.json` | HACS → Plugins → Search "HomeGuardian" |

**Critical Point**: These are **separate distribution channels** managed by different systems:
- Add-on Store reads `repository.json` (root)
- HACS reads `hacs.json` (can be in subdirectory)

---

## Recommended Monorepo Structure

```
thiagosian/HomeGuardian/
│
├── backend/                          # Add-on backend (Node.js)
│   ├── server.js
│   ├── routes/
│   ├── services/
│   └── package.json
│
├── frontend/                         # Add-on frontend (React)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── hacs-card/                        # ⬅️ NEW: HACS Plugin
│   ├── dist/                         # Built card (committed)
│   │   └── homeguardian-version-card.js
│   ├── src/                          # Source code
│   │   ├── homeguardian-card.ts     # Main card component
│   │   ├── compact-mode.ts
│   │   ├── full-mode.ts
│   │   ├── entity-mode.ts
│   │   ├── api-client.ts            # Communicates with add-on
│   │   └── types.ts
│   ├── hacs.json                     # ⬅️ HACS metadata
│   ├── info.md                       # HACS repository info
│   ├── README.md                     # Card-specific README
│   ├── package.json
│   ├── tsconfig.json
│   └── rollup.config.js
│
├── docs/
│   ├── README.md                     # Main documentation
│   ├── ADDON_INSTALL.md             # Add-on installation
│   └── CARD_INSTALL.md              # Card installation (via HACS)
│
├── .github/
│   └── workflows/
│       ├── addon-ci.yml              # Add-on CI/CD
│       └── card-ci.yml               # Card build & release
│
├── config.yaml                       # Add-on config (Supervisor)
├── repository.json                   # Add-on repository metadata
├── Dockerfile                        # Add-on container
├── docker-compose.yml
│
└── README.md                         # Project overview (both components)
```

---

## HACS Configuration

### `hacs-card/hacs.json`

```json
{
  "name": "HomeGuardian Version Card",
  "content_in_root": false,
  "filename": "homeguardian-version-card.js",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

**Key Points**:
- `"content_in_root": false` → HACS looks in `dist/` subdirectory
- `"filename"` → Name of the main JS file
- Users add custom repository: `https://github.com/thiagosian/HomeGuardian`
- Select category: **"Plugin"**

---

## Installation Flow

### For End Users

#### Step 1: Install Add-on (Backend)

```yaml
1. Home Assistant → Settings → Add-ons
2. Add-on Store → ⋮ → Repositories
3. Add: https://github.com/thiagosian/HomeGuardian
4. Find "HomeGuardian" in list
5. Install → Start
```

**Uses**: `repository.json` (root)

#### Step 2: Install Card (Frontend - Optional)

```yaml
1. HACS → Plugins
2. ⋮ → Custom repositories
3. Add: https://github.com/thiagosian/HomeGuardian
   Category: Plugin
4. Search "HomeGuardian Version Card"
5. Download
6. Restart HA
7. Add card to dashboard:
   type: custom:homeguardian-version-card
   mode: compact
```

**Uses**: `hacs-card/hacs.json`

---

## Development Workflow

### Card Development

```bash
# Terminal 1: Add-on (if testing API)
cd /workspace/HomeGuardian
docker-compose up

# Terminal 2: Card development
cd hacs-card
npm install
npm run dev    # Watch mode with hot reload
npm run build  # Production build to dist/
```

### Coordinated Changes (API + Card)

**Scenario**: Add new API endpoint + use in card

```bash
# Single branch, single PR
git checkout -b feature/add-timeline-api

# 1. Backend changes
cd backend
# ... add /api/timeline endpoint

# 2. Frontend card changes
cd ../hacs-card
# ... use new endpoint in card

# 3. Update both package.json versions
# backend/package.json: "version": "1.3.0"
# hacs-card/package.json: "version": "1.0.0"

# 4. Commit everything together
git add backend/ hacs-card/
git commit -m "feat: add timeline API and card support"
```

---

## Release Strategy

### Semantic Versioning - Independent

| Component | Version | Follows |
|-----------|---------|---------|
| **Add-on** | v1.3.0 | Backend + Add-on Frontend |
| **Card** | v1.0.0 | HACS Card only |

**Example Scenario**:

```
Release Timeline:
─────────────────────────────────────────────

v1.3.0 (Add-on) + v1.0.0 (Card) - Initial card release
│
├─ v1.3.1 (Add-on only) - Bug fix in backend
│  (Card stays v1.0.0)
│
├─ v1.0.1 (Card only) - Card UI tweak
│  (Add-on stays v1.3.1)
│
└─ v1.4.0 (Add-on) + v1.1.0 (Card) - New API + Card feature
```

### Git Tags

```bash
# Tag add-on releases
git tag addon-v1.3.0
git tag addon-v1.3.1

# Tag card releases
git tag card-v1.0.0
git tag card-v1.0.1

# Or combined releases
git tag v1.4.0  # (both updated)
```

---

## CI/CD Pipeline

### `.github/workflows/addon-ci.yml`

```yaml
name: Add-on CI

on:
  push:
    paths:
      - 'backend/**'
      - 'frontend/**'
      - 'Dockerfile'
      - 'config.yaml'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test backend
        run: cd backend && npm test
      - name: Build Docker image
        run: docker build -t homeguardian .
```

### `.github/workflows/card-ci.yml`

```yaml
name: Card CI

on:
  push:
    paths:
      - 'hacs-card/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Build card
        run: |
          cd hacs-card
          npm install
          npm run build
      - name: Validate HACS
        run: |
          # Run HACS action validator
          wget -O - https://get.hacs.xyz/validate | bash -
```

---

## Advantages of Monorepo

### ✅ Development Benefits

1. **Atomic Changes**: API + Card changes in single commit
   ```
   git log --oneline
   abc123 feat: add timeline API and card visualization
   ```

2. **Shared Tooling**: Single CI/CD, linting, formatting config

3. **Type Safety**: Share TypeScript types between backend and card
   ```typescript
   // shared/types.ts (symlinked to both)
   export interface Commit {
     hash: string;
     message: string;
     date: string;
   }
   ```

4. **Coordinated Releases**: Tag both at once when needed

### ✅ User Benefits

1. **Single Source of Truth**: All docs, issues, discussions in one place
2. **Discovery**: Users find card when researching add-on
3. **Trust**: Official card clearly maintained by same team

### ✅ Maintenance Benefits

1. **Single Issue Tracker**: Users don't need to guess which repo
2. **Unified Changelog**: See full feature development
3. **Easier Deprecation**: Coordinate API changes

---

## Alternative: Multi-repo (Not Recommended)

**If you strongly prefer separation**:

```
Repositories:
1. thiagosian/HomeGuardian (add-on)
2. thiagosian/homeguardian-card (HACS plugin)
```

**Setup**:
```bash
# Create new repo for card
gh repo create thiagosian/homeguardian-card --public

# Move card code
git subtree split --prefix=hacs-card -b card-only
cd ../homeguardian-card
git pull ../HomeGuardian card-only
```

**Pros**:
- Clean separation
- Independent releases simpler
- Smaller repo sizes

**Cons**:
- Coordinate changes across 2 repos
- Duplicate CI/CD configuration
- Issue fragmentation
- Type sharing harder

**Verdict**: Only if card becomes **extremely complex** (>10k lines) or has **different contributors/ownership**.

---

## Migration Path (Current → Monorepo)

### Phase 1: Add Card Directory (Now)

```bash
cd /workspace/HomeGuardian
mkdir -p hacs-card/{src,dist}
cd hacs-card

# Initialize card project
npm init -y
npm install --save-dev typescript rollup @rollup/plugin-typescript

# Create hacs.json
cat > hacs.json <<EOF
{
  "name": "HomeGuardian Version Card",
  "content_in_root": false,
  "filename": "homeguardian-version-card.js",
  "render_readme": true
}
EOF
```

### Phase 2: Develop Card (Weeks 3-8)

Work in `hacs-card/` directory following the development plan.

### Phase 3: Document Installation (Before Release)

Update `README.md`:

```markdown
## Installation

HomeGuardian has two components:

### 1. Add-on (Required)
Provides Git version control backend.
[Installation guide](docs/ADDON_INSTALL.md)

### 2. Dashboard Card (Optional)
Shows version control status on your dashboard.
[Installation guide](docs/CARD_INSTALL.md)
```

---

## HACS Validation Checklist

Before submitting card to HACS default repository:

- [ ] `hacs-card/hacs.json` exists and valid
- [ ] `hacs-card/info.md` describes the card
- [ ] `hacs-card/README.md` has installation instructions
- [ ] `hacs-card/dist/homeguardian-version-card.js` exists (committed)
- [ ] GitHub repository has:
  - [ ] Description
  - [ ] Topics: `home-assistant`, `hacs`, `lovelace-card`
  - [ ] README with screenshots
  - [ ] LICENSE file
  - [ ] At least 1 release tag

---

## References

### HACS Documentation

- [HACS Plugin Requirements](https://hacs.xyz/docs/publish/plugin/)
- [HACS Repository Structure](https://hacs.xyz/docs/publish/start/)

### Examples of Monorepo HA Projects

- `custom-cards/button-card` - Card with multiple build outputs
- `thomasloven/lovelace-card-mod` - Card with extensive tooling

### Home Assistant Add-on vs Integration

- **Add-on**: Docker container, any language, installed via Supervisor
- **Integration**: Python component, runs in HA Core, installed via HACS or UI
- **Plugin**: Frontend JavaScript, Lovelace UI, installed via HACS

**Source**: [HA Community - Add-on vs Integration](https://community.home-assistant.io/t/difference-between-integration-add-on/227415)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-08 | Monorepo structure | Coordinated development, single source of truth |
| 2025-11-08 | Independent versioning | Add-on and card can evolve separately |
| 2025-11-08 | Keep card in `hacs-card/` | Clear separation, HACS-friendly structure |

---

## Next Steps

1. ✅ Create `hacs-card/` directory structure
2. ✅ Add `hacs.json` with metadata
3. ✅ Setup TypeScript + Rollup build
4. ✅ Develop card following implementation plan
5. ✅ Add CI/CD workflow for card builds
6. ✅ Document installation for both components
7. ✅ Tag first card release: `card-v1.0.0`
8. ✅ Submit to HACS default repository (optional)

---

**Status**: ✅ Recommended for Implementation
**Approval**: Pending
