# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a GitHub profile README repository (username: tqer39). The README.md file is displayed on the GitHub profile page and contains profile information, skills, activity statistics, and visual elements.

## Getting Started

### Quick Setup (Recommended)

Install mise first, then use its tasks for development (macOS or Linux):

```bash
# If Homebrew is already installed
brew install mise

# Otherwise, install mise using its standalone installer
curl https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"

# Trust the repository configuration after reviewing it
mise trust

# Install Homebrew and dependencies from Brewfile
mise run bootstrap

# Reload your shell, then install tools, node dependencies, and Git hooks
mise run setup
```

The bootstrap task requires mise to be installed first. It supports macOS and
Linux; Windows bootstrap is not supported. On Linux it adds Homebrew's shell
environment to existing `.zshrc` and `.bashrc` files. Follow Homebrew's printed
shell setup instructions on macOS, then reload your shell.

`Brewfile` manages gh and mise. `mise.toml` manages node, pnpm, lefthook,
actionlint, shellcheck, and yamllint. Node-based linters are installed by pnpm.

### Manual Setup

With mise and Homebrew already installed:

```bash
mise trust
mise run brew-bundle
mise run setup
```

## Code Quality and Linting

This repository uses **lefthook** to maintain code quality. All commits must
pass the checks in `lefthook.yml`.

### Running Hooks Locally

```bash
# Run all linters and regression tests
mise run lint

# Run a specific lefthook command
mise run lint-hook markdownlint

# Fix common formatting issues
mise run fix

# Format JSON files with Biome
mise run format
```

### Available Linters and Checks

The repository enforces the following via `lefthook.yml`:

- **File integrity**: Large file detection (max 512KB), JSON/YAML validation, credential detection
- **biome**: JSON file formatting (config: `biome.json`)
- **yamllint**: YAML file linting (config: `.yamllint`)
- **cspell**: Spell checking (config: `cspell.json`)
- **markdownlint-cli2**: Markdown linting (config: `.markdownlint.json`)
  - Allows HTML elements: `img`, `details`, `summary`, `hr`, `p`, `style`, `div`
  - Disables: MD013 (line length), MD024 (duplicate headings), MD030 (list spacing), MD041 (first line heading)
- **textlint**: Japanese text linting (config: `.textlintrc`)
  - Rules: `no-dropping-the-ra`, `ja-no-space-between-full-width`
- **shellcheck**: Shell script linting
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

1. **lint** (`.github/workflows/lint.yml`)
   - Runs on: push to main and all PRs
   - Installs tools with mise and node dependencies with pnpm
   - Executes `mise run lint`
   - Timeout: 10 minutes
   - The workflow-result job requires lint to succeed

2. **profile-3d-contrib** (`.github/workflows/profile-3d-contrib.yml`)
   - Runs on: Daily schedule (18:00 UTC / 03:00 JST), manual dispatch
   - Generates 3D contribution graph using `yoshi389111/github-profile-3d-contrib`
   - Auto-creates PR and merges to main branch
   - Output location: `profile-3d-contrib/` directory

3. **update-license-year** (`.github/workflows/update-license-year.yml`)
   - Automatically updates copyright year in files

4. **auto-assign** (`.github/workflows/auto-assign.yml`)
   - Auto-assigns PR author as assignee

5. **labeler** (`.github/workflows/labeler.yml`)
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
mise run help

# Check tool installation status
mise run status

# Run all linters before committing
mise run lint

# Fix common formatting issues
mise run fix

# Format JSON files
mise run format

# Update Homebrew packages
mise run update-brew

# Check Git status and recent commits
mise run git-status
mise run git-log
```

### Updating Profile Content

When editing `README.md`, ensure:

- HTML elements are in the allowed list (see markdownlint config)
- Spell check passes (add custom words to `cspell.json` if needed)
- All lefthook hooks pass before committing

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
mise run lint

# Or run lefthook directly
lefthook run pre-commit --all-files

# View the README locally (in browser or Markdown viewer)
# Note: GitHub-specific widgets won't render locally
```
