# justfile for tqer39 GitHub Profile development

# Show available commands
help:
    @just --list

# Setup development environment
setup:
    @echo "Setting up development environment..."
    @if command -v mise >/dev/null 2>&1; then \
      echo "→ Installing tools with mise..."; \
      mise install; \
    else \
      echo "⚠ mise not found. Install via 'make bootstrap' or 'brew install mise'."; \
      exit 1; \
    fi
    @echo "→ Installing node dev dependencies with pnpm..."
    @pnpm install --frozen-lockfile
    @pnpm run rules:generate
    @echo "→ Installing lefthook git hooks..."
    @lefthook install
    @echo "✓ Setup complete!"

# Run all linters (lefthook)
lint:
    @echo "🔍 Running linters..."
    @lefthook run pre-commit --all-files

# Run specific lefthook command
lint-hook hook:
    @lefthook run pre-commit --command {{hook}} --all-files

# Fix common formatting issues
fix:
    @lefthook run pre-commit --command end-of-file-fixer --all-files
    @lefthook run pre-commit --command trailing-whitespace --all-files
    @lefthook run pre-commit --command mixed-line-ending --all-files
    @lefthook run pre-commit --command markdownlint --all-files

# Format all files
format:
    @pnpm run format

# Generate AI instructions from the shared rules
rules:
    @pnpm run rules:generate

# Check generated AI instructions for drift
rules-check:
    @pnpm run rules:check

# Show tool status
status:
    @echo "Tool Status:"
    @echo ""
    @echo "Homebrew:"
    @command -v brew >/dev/null && brew --version || echo "  Not installed"
    @echo ""
    @echo "mise:"
    @command -v mise >/dev/null && mise --version || echo "  Not installed"
    @echo ""
    @echo "lefthook:"
    @command -v lefthook >/dev/null && lefthook version || echo "  Not installed"
    @echo ""
    @echo "Node.js:"
    @command -v node >/dev/null && node --version || echo "  Not installed"
    @echo ""
    @echo "pnpm:"
    @command -v pnpm >/dev/null && pnpm --version || echo "  Not installed"
    @echo ""
    @echo "GitHub CLI:"
    @command -v gh >/dev/null && gh --version | head -n1 || echo "  Not installed"

# Update Homebrew packages
update-brew:
    @echo "Updating Homebrew..."
    brew update
    @echo ""
    @echo "Upgrading packages..."
    brew upgrade
    @echo ""
    @echo "✓ Homebrew packages updated"

# Check git status
git-status:
    @echo "Git Status:"
    @git status --short

# Show recent commits
git-log:
    @echo "Recent commits:"
    @git log --oneline --graph --decorate -10
