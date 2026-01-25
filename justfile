# justfile for tqer39 GitHub Profile development

# Show available commands
help:
    @just --list

# Setup development environment
setup:
    @echo "Setting up development environment..."
    @echo ""
    @echo "Installing prek hooks..."
    prek install
    @echo ""
    @echo "✓ Setup complete!"
    @echo ""
    @echo "Available commands:"
    @echo "  just lint         - Run all linters"
    @echo "  just fix          - Fix common formatting issues"
    @echo "  just format       - Format all files with Prettier"
    @echo "  just clean        - Clear prek cache"

# Run all prek hooks
lint:
    @echo "Running all linters..."
    prek run --all-files

# Run specific prek hook
lint-hook hook:
    @echo "Running hook: {{ hook }}"
    prek run {{ hook }}

# Fix common formatting issues
fix:
    @echo "Fixing common formatting issues..."
    @echo "  - Fixing end of file..."
    prek run end-of-file-fixer
    @echo "  - Fixing trailing whitespace..."
    prek run trailing-whitespace
    @echo "  - Fixing mixed line endings..."
    prek run mixed-line-ending
    @echo "✓ Common fixes applied"

# Format all files (YAML with Prettier, JSON with Biome)
format:
    @echo "Formatting YAML files with Prettier..."
    prek run prettier --all-files
    @echo "Formatting JSON files with Biome..."
    prek run biome-format --all-files

# Format only staged files
format-staged:
    @echo "Formatting staged files..."
    prek run prettier
    prek run biome-format

# Clean prek cache
clean:
    @echo "Cleaning prek cache..."
    prek clean
    @echo "✓ Cache cleared"

# Show tool status
status:
    @echo "Tool Status:"
    @echo ""
    @echo "Homebrew:"
    @command -v brew >/dev/null && brew --version || echo "  Not installed"
    @echo ""
    @echo "prek:"
    @command -v prek >/dev/null && prek --version || echo "  Not installed"
    @echo ""
    @echo "Node.js:"
    @command -v node >/dev/null && node --version || echo "  Not installed"
    @echo ""
    @echo "GitHub CLI:"
    @command -v gh >/dev/null && gh --version | head -n1 || echo "  Not installed"
    @echo ""
    @echo "yamllint:"
    @command -v yamllint >/dev/null && yamllint --version || echo "  Not installed"
    @echo ""
    @echo "shellcheck:"
    @command -v shellcheck >/dev/null && shellcheck --version | head -n2 | tail -n1 || echo "  Not installed"
    @echo ""
    @echo "actionlint:"
    @command -v actionlint >/dev/null && actionlint --version || echo "  Not installed"
    @echo ""
    @echo "biome:"
    @command -v biome >/dev/null && biome --version || echo "  Not installed"

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
