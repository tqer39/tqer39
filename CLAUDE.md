# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a GitHub profile README repository (username: tqer39). The README.md file is displayed on the GitHub profile page and contains profile information, skills, activity statistics, and visual elements.

## Getting Started

### Quick Setup (Recommended)

Bootstrap your development environment with a single command:

```bash
# Install Homebrew and all required tools
make bootstrap

# After bootstrap completes, setup prek hooks
just setup
```

This will:

1. Install Homebrew (if not already installed)
2. Install all dependencies from `Brewfile` (gh, just, actionlint, prek, shellcheck, yamllint)
3. Setup prek hooks for automatic code quality checks

### Manual Setup

If you prefer manual installation:

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew bundle install

# Setup prek hooks
prek install
```

## Code Quality and Linting

This repository uses **prek** (a faster, Rust-based alternative to pre-commit) to maintain code quality. All commits must pass these checks.

### About prek

- **Performance**: 7-10x faster than pre-commit
- **Disk space**: Uses only ~50% of the disk space compared to pre-commit
- **Compatibility**: Fully compatible with existing `.pre-commit-config.yaml` files
- **Zero dependencies**: Single binary with no Python or runtime dependencies

### Running prek Hooks Locally

```bash
# Run all linters
just lint

# Run specific hook
just lint-hook <hook-name>

# Fix common formatting issues
just fix

# Format all files with Prettier
just format
```

### Available Linters and Checks

The repository enforces the following via `.pre-commit-config.yaml`:

- **File integrity**: Large file detection (max 512KB), JSON/YAML validation, credential detection
- **yamllint**: YAML file linting (config: `.yamllint`)
- **cspell**: Spell checking (config: `cspell.json`)
- **markdownlint-cli2**: Markdown linting (config: `.markdownlint.json`)
  - Allows HTML elements: `img`, `details`, `summary`, `hr`, `p`, `style`, `div`
  - Disables: MD013 (line length), MD024 (duplicate headings), MD030 (list spacing), MD041 (first line heading)
- **textlint**: Japanese text linting (config: `.textlintrc`)
  - Rules: `no-dropping-the-ra`, `ja-no-space-between-full-width`
- **shellcheck**: Shell script linting
- **prettier**: YAML formatting for GitHub Actions
- **actionlint**: GitHub Actions workflow validation
- **renovate-config-validator**: Renovate configuration validation

### Editor Configuration

The repository uses `.editorconfig` with these settings:

- Charset: UTF-8
- Line endings: LF
- Indent: 2 spaces
- Trim trailing whitespace
- Insert final newline

## GitHub Actions Workflows

### Automated Workflows

1. **prek** (`.github/workflows/prek.yml`)
   - Runs on: push to main, all PRs (except `feature/generate-github-profile-3d-contrib`)
   - Executes all prek hooks with `--show-diff-on-failure`
   - Uses `j178/prek-action@v1` for faster CI execution
   - Timeout: 10 minutes
   - Note: Profile 3D contribution PRs are excluded from checks

2. **profile-3d-contrib** (`.github/workflows/profile-3d-contrib.yml`)
   - Runs on: Daily schedule (18:00 UTC / 03:00 JST), manual dispatch
   - Generates 3D contribution graph using `yoshi389111/github-profile-3d-contrib`
   - Auto-creates PR and merges to main branch
   - Output location: `profile-3d-contrib/` directory

3. **update-license-year** (`.github/workflows/update-license-year.yml`)
   - Automatically updates copyright year in files

4. **auto-assign** (`.github/workflows/auto-assign.yml`)
   - Auto-assigns PR author as assignee

5. **generate-pr-description** (`.github/workflows/generate-pr-description.yml`)
   - Auto-generates PR descriptions

6. **labeler** (`.github/workflows/labeler.yml`)
   - Auto-applies labels to PRs

## Dependency Management

Renovate is configured via `renovate.json5` using the shared config with auto-merge enabled:

```json5
{
  "extends": ["github>tqer39/renovate-config"],
  "platformAutomerge": true,
  "automerge": true,
  "automergeType": "pr"
}
```

Renovate will automatically create PRs for dependency updates and merge them when:

- All CI checks pass
- The PR is approved (if required by branch protection rules)

## Development Guidelines

### From Copilot Instructions

When working in this repository (from `.github/copilot-instructions.md`):

1. **コーディングスタイル (Coding Style)**
   - Follow existing project coding conventions and formatting
   - Actively use comments and documentation

2. **セキュリティ (Security)**
   - Follow security best practices
   - Never include credentials or sensitive information in code

3. **ライセンスと著作権 (License and Copyright)**
   - Verify licenses when using external code or libraries
   - Document license information when necessary

4. **PR・レビュー (PR & Review)**
   - Always verify content before using AI suggestions
   - Modify as necessary
   - Document when AI suggestions are used in PRs

## Key Files

- `README.md`: Main profile page content (contains HTML, images, and GitHub stats widgets)
- `src/icon/`: Contains icon images used in the profile
- `profile-3d-contrib/`: Auto-generated 3D contribution graphs
- `.github/workflows/`: Automated GitHub Actions workflows

## Common Tasks

### Development Workflow

```bash
# Show all available commands
just help

# Check tool installation status
just status

# Run all linters before committing
just lint

# Fix common formatting issues
just fix

# Format all files
just format

# Update Homebrew packages
just update-brew

# Clean prek cache (if needed)
just clean
```

### Updating Profile Content

When editing `README.md`, ensure:

- HTML elements are in the allowed list (see markdownlint config)
- Spell check passes (add custom words to `cspell.json` if needed)
- All prek hooks pass before committing

### Adding Custom Dictionary Words

To add words to the spell checker, edit `cspell.json`:

```json
{
  "words": [
    "newword1",
    "newword2"
  ]
}
```

### Testing Changes Locally

Before pushing changes:

```bash
# Run all quality checks
just lint

# Or run prek directly
prek run --all-files

# View the README locally (in browser or Markdown viewer)
# Note: GitHub-specific widgets won't render locally
```

### Migrating from pre-commit to prek

If you previously used pre-commit:

```bash
# Uninstall pre-commit hooks
pre-commit uninstall

# Install prek hooks
just setup
```

The existing `.pre-commit-config.yaml` file works without modification.
