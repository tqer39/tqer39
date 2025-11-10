.PHONY: help check-os install-brew brew-bundle bootstrap

# Detect OS
UNAME_S := $(shell uname -s)

# Color output
BOLD := \033[1m
RESET := \033[0m
GREEN := \033[32m

help: ## Show this help message
	@echo "$(BOLD)Available targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

check-os: ## Detect operating system
	@echo "$(BOLD)Detecting operating system...$(RESET)"
ifeq ($(UNAME_S),Darwin)
	@echo "OS: macOS"
else ifeq ($(UNAME_S),Linux)
	@echo "OS: Linux"
else
	@echo "Unsupported OS: $(UNAME_S)"
	@exit 1
endif

install-brew: check-os ## Install Homebrew
	@echo "$(BOLD)Installing Homebrew...$(RESET)"
ifeq ($(UNAME_S),Darwin)
	@if ! command -v brew >/dev/null 2>&1; then \
		echo "Installing Homebrew for macOS..."; \
		/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; \
	else \
		echo "Homebrew is already installed."; \
	fi
else ifeq ($(UNAME_S),Linux)
	@if ! command -v brew >/dev/null 2>&1; then \
		echo "Installing Homebrew for Linux..."; \
		/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; \
		if [ -f "$$HOME/.zshrc" ]; then \
			echo 'eval "$$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> $$HOME/.zshrc; \
		fi; \
		if [ -f "$$HOME/.bashrc" ]; then \
			echo 'eval "$$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> $$HOME/.bashrc; \
		fi; \
		eval "$$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"; \
	else \
		echo "Homebrew is already installed."; \
	fi
endif

brew-bundle: ## Install dependencies listed in Brewfile
	@echo "$(BOLD)Installing dependencies from Brewfile...$(RESET)"
	@if ! command -v brew >/dev/null 2>&1; then \
		echo "Error: Homebrew is not installed. Run 'make install-brew' first."; \
		exit 1; \
	fi
	@brew bundle install

bootstrap: install-brew brew-bundle ## Bootstrap development environment
	@echo ""
	@echo "$(BOLD)$(GREEN)Bootstrap complete!$(RESET)"
	@echo ""
	@echo "$(BOLD)Next steps:$(RESET)"
ifeq ($(UNAME_S),Darwin)
	@echo "  1. Restart your terminal"
else ifeq ($(UNAME_S),Linux)
	@echo "  1. Reload your shell configuration:"
	@echo "     source ~/.zshrc  # or source ~/.bashrc"
endif
	@echo "  2. Run 'just setup' to complete the development environment setup"
	@echo ""
	@echo "$(BOLD)Available commands:$(RESET)"
	@echo "  just help   - Show available just commands"
	@echo "  just setup  - Setup development environment"
	@echo "  just lint   - Run all linters"
