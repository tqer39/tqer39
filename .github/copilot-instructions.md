# リポジトリの開発指針

このリポジトリは、`tqer39` の GitHub プロフィール README を管理します。
`README.md` は公開プロフィール、`src/icon/` は画像素材、
`profile-3d-contrib/` は生成されたコントリビューショングラフの保存先です。

## AI 共通の指示

常に日本語で回答してください。

- 編集前に、リポジトリの指示と関連コードを読んでください。
- 無関係なユーザーの変更を保持し、変更範囲を依頼内容に絞ってください。
- 複雑な作業では、期待する動作と検証条件を明確にし、実装から検証まで完了させてください。
- バージョンに依存する動作は、現在の一次情報を確認してください。
  検証済みの事実と推測を区別してください。
- 既存のコーディング規約に従い、必要なコメントやドキュメントを追加してください。
- 認証情報や機密情報をコードに含めないでください。
- 外部コードやライブラリを利用する場合は、ライセンスを確認し、必要に応じて明記してください。
- AI の提案は利用前に確認し、不適切な内容は修正・削除してください。
- Copilot の提案を利用した場合は、プルリクエストにその旨を記載してください。
- 意味のある動作変更には回帰テストを追加してください。
  実装をなぞるだけのテストは追加しないでください。
- 最終差分をレビューし、回帰・要件漏れ・不要な変更がないか確認してください。
  検証結果と残る制約を正確に報告してください。

## セットアップとコマンド

macOS または Linux では、mise を先にインストールします。
Homebrew がある場合は次のコマンドを実行します。

```bash
brew install mise
```

Homebrew がない場合は、代わりにスタンドアロン版をインストールします。

```bash
curl https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"
```

どちらか一方で mise をインストールした後、次のコマンドを実行します。

```bash
mise trust
mise run bootstrap
# Homebrew の案内に従ってシェル設定を読み直してから実行
mise run setup
```

`mise run bootstrap` で Homebrew と `Brewfile` のツールをインストールします。
Windows での bootstrap は対象外です。Linux では、既存の `.zshrc` と `.bashrc` に
Homebrew のシェル設定を追加します。
`mise run setup` で `mise.toml` に指定されたツールと pnpm の依存関係をインストールし、
AI 向けの指示を生成して Lefthook のフックを設定します。
Node.js の開発ツールは、各プラットフォームで共通のリポジトリ内 pnpm 依存関係として管理します。

ツールと設定の管理場所は次のとおりです。更新時は、対応する正本を変更してください。

| 管理場所 | 管理対象 |
| --- | --- |
| `Brewfile` | GitHub CLI と mise |
| `mise.toml` | Node.js、pnpm、Lefthook、yamllint、actionlint、shellcheck のバージョンと開発タスク |
| `package.json` / `pnpm-lock.yaml` | Oxlint、Oxfmt、rulesync、ドキュメント用 lint の依存関係と解決結果 |
| `pnpm-workspace.yaml` / `patches/` | 依存関係の上書きとセキュリティ修正 |
| `lefthook.yml` | Git hooks と品質チェックの実行定義 |
| `.rulesync/rules/overview.md` | AI 向けの開発ガイドの正本 |

開発コマンドは `mise.toml` に集約されています。
依存関係を再現する場合は `pnpm install --frozen-lockfile` を使用してください。

```bash
mise run help              # 利用できるコマンドを表示
mise run status            # ツールのインストール状況を確認
mise run lint              # 全チェックを実行。修正が発生したら失敗し、ステージ状態は保持
mise run lint-hook oxlint  # 指定したフックのみ実行
mise run fix               # 空白と Markdown の整形を修正
mise run format            # Oxfmt で JSON と JavaScript/TypeScript を整形
mise run rules             # AI 向けの指示を生成
mise run rules-check       # AI 向けの指示が同期されているか確認
```

## 品質チェック

- Lefthook（`lefthook.yml`）でローカルのフックと GitHub Actions のチェックを実行します。
- Oxlint（`.oxlintrc.json`）で CommonJS のテストを含む JavaScript/TypeScript を検証します。
- Oxfmt（`.oxfmtrc.json`）で JSON、JSONC、JSON5、JavaScript/TypeScript を整形します。
  Markdown、YAML、画像素材、依存関係のパッチ、pnpm のロックファイルは対象外です。
- yamllint、actionlint、shellcheck で YAML、ワークフロー、シェルスクリプトを検証します。
- markdownlint-cli2、textlint、cspell でドキュメントとスペルを検証します。
- ファイルの整合性を確認するフックで、サイズ、JSON 構文、認証情報、空白を検証します。
- 回帰テストで、依存関係のパッチ、ワークフローの結果、コントリビューショングラフの更新、
  AI ルールの同期ずれ、不正な lint・整形入力の検出を検証します。
- `renovate-config-validator` で Renovate の設定を検証します。

`.editorconfig` に従い、UTF-8、LF、スペース2個のインデント、行末の空白なし、
末尾の改行ありで記述してください。プロフィールの更新時は、`.markdownlint.json` で
許可された HTML 要素を使用し、必要に応じて `cspell.json` に辞書の単語を追加してください。
GitHub 固有のウィジェットは、ローカルでは表示されない場合があります。

### チェックが修正を検出した場合

PR 前の検証では、ファイルが自動修正された場合も失敗として扱います。
この検証では修正の自動ステージを無効にしているため、修正差分を確認してから必要なファイルを
ステージしてください。関係のないユーザーの変更を一緒にステージしないでください。

空白・改行・Markdown の修正には `mise run fix`、
JSON と JavaScript/TypeScript の整形には `mise run format` を使用します。
AI 向けの指示の同期ずれは、正本を確認して `mise run rules` で生成し直します。
修正後は CI と同じ全検証を再実行し、`git diff --check` と最終差分も確認してください。
CI の実行コマンドは `.github/workflows/lint.yml` が正本です。

## rulesync の運用

AI 共通の指示は、正本の `.rulesync/rules/overview.md` を編集してください。
`rulesync.jsonc` の `rules` 機能で、Claude Code、Codex、Copilot、Devin を対象に指定しています。
正本の編集後は `pnpm run rules:generate` を実行し、生成ファイルもコミットしてください。
生成された `CLAUDE.md`、`AGENTS.md`、`.github/copilot-instructions.md` は直接編集しないでください。
Codex と Devin は `AGENTS.md` を共有します。`pnpm run rules:check` で同期ずれを検出します。

## ワークフローと依存関係

- `.github/workflows/lint.yml` でツールと依存関係をインストールし、`mise run lint` を実行します。
  `workflow-result` ジョブで lint の結果を確認します。
- `.github/workflows/profile-3d-contrib.yml` で、毎日18:00 UTC（03:00 JST）と
  手動実行時に SVG を生成します。`scripts/update-profile-3d-contrib.sh` で変更を反映します。
  `profile-3d-contrib/*.svg` のみをステージしてコミットし、変更がなければ終了します。
  `origin/main` を取得して rebase した後、`HEAD:main` に push します。
  SVG 以外のステージ済み変更はコミットに含めず、生成中に main に入ったコミットを保持します。
  rebase で競合した場合は処理が失敗し、リモートの main を強制的に上書きしません。
  画像更新用のプルリクエストは作成しません。
- その他のワークフローで、ライセンス年を更新し、プルリクエスト作成者を担当者に設定して、
  ラベルを付与します。

`renovate.json5` は `github>tqer39/renovate-config` を継承します。
共通のスケジュール、自動マージ方針、ラベル、セキュリティ設定は共通設定で管理し、
このリポジトリには固有の例外だけを記述してください。
開発ツールの更新時は、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`patches/` にある
セキュリティ上の上書き設定と依存関係のパッチを保持してください。
