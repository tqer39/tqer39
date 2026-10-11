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

```bash
mise run help              # 利用できるコマンドを表示
mise run status            # ツールのインストール状況を確認
mise run lint              # lint のみ実行。修正が発生したら失敗し、ステージ状態は保持
mise run test              # 回帰テストのみ実行
mise run check             # lint と全回帰テストを実行
mise run lint-hook oxlint  # 指定したフックのみ実行
mise run fix               # 空白と Markdown の整形を修正
mise run format            # Oxfmt で JSON と JavaScript/TypeScript を整形
mise run rules             # AI 向けの指示を生成
mise run rules-check       # AI 向けの指示が同期されているか確認
```

テストは `tests/` 直下の `.cjs` と `.sh` を共通の実行スクリプトで順に実行します。
追加したテストも自動で対象になります。`mise run setup` の後、`mise run test` で実行できます。
コミット時は Lefthook から同じテストを実行し、CI と PR 前の全検証には `mise run check` を使用します。
lint またはテストが失敗した場合、全検証も失敗します。

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

## rulesync の運用

AI 共通の指示は、正本の `.rulesync/rules/overview.md` を編集してください。
`rulesync.jsonc` の `rules` 機能で、Claude Code、Codex、Copilot、Devin を対象に指定しています。
正本の編集後は `pnpm run rules:generate` を実行し、生成ファイルもコミットしてください。
生成された `CLAUDE.md`、`AGENTS.md`、`.github/copilot-instructions.md` は直接編集しないでください。
Codex と Devin は `AGENTS.md` を共有します。`pnpm run rules:check` で同期ずれを検出します。

## ワークフローと依存関係

- `.github/workflows/lint.yml` でツールと依存関係をインストールし、`mise run check` を実行します。
  `workflow-result` ジョブで lint の結果を確認します。
- `.github/workflows/profile-3d-contrib.yml` で、毎日18:00 UTC（03:00 JST）と
  手動実行時に SVG を生成します。`scripts/update-profile-3d-contrib.sh` で
  同時更新を処理しながら、生成された変更を反映します。
- その他のワークフローで、ライセンス年を更新し、プルリクエスト作成者を担当者に設定して、
  ラベルを付与します。

`renovate.json5` は `github>tqer39/renovate-config` を継承します。
共通のスケジュール、自動マージ方針、ラベル、セキュリティ設定は共通設定で管理し、
このリポジトリには固有の例外だけを記述してください。
開発ツールの更新時は、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`patches/` にある
セキュリティ上の上書き設定と依存関係のパッチを保持してください。
