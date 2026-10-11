#!/usr/bin/env bash
set -euo pipefail

os=$(uname -s)
case "$os" in
  Darwin|Linux) ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac

configure_linux_shell() {
  [[ "$os" == Linux ]] || return 0
  # Expand this command when the shell configuration is sourced, not now.
  # shellcheck disable=SC2016
  local shellenv_line='eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"'
  local shell_config
  for shell_config in "$HOME/.zshrc" "$HOME/.bashrc"; do
    if [[ -f "$shell_config" ]] && ! grep -Fqx "$shellenv_line" "$shell_config"; then
      printf '%s\n' "$shellenv_line" >> "$shell_config"
    fi
  done
}

if command -v brew >/dev/null 2>&1; then
  echo "Homebrew is already installed."
  configure_linux_shell
  exit 0
fi

# Existing installations may not yet be on PATH in a fresh shell.
for brew_path in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  if [[ -x "$brew_path" ]]; then
    echo "Homebrew is already installed at $brew_path."
    configure_linux_shell
    exit 0
  fi
done

installer=$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)
/bin/bash -c "$installer"

configure_linux_shell
