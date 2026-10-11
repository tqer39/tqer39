# 依存パッケージのセキュリティ修正

<!-- cspell:ignore smol -->

上流の修正版が公開されていない次の問題には、pnpm のパッチ機能で対策しています。
`pnpm install --frozen-lockfile` でパッチを適用し、`just lint` と CI で回帰テストを実行します。

| パッケージ | アドバイザリ | 対策 |
| --- | --- | --- |
| sprintf-js 1.0.3 | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | 数値精度を ECMAScript の許容範囲に収め、過大な指定による例外を防ぐ |
| braces 3.0.3 | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | パターン解析時に入れ子の深さを 64 までに制限し、再帰処理によるスタックオーバーフローを防ぐ |

監査はパッチ内容を判定できないため、この 2 件だけを `pnpm-workspace.yaml` の
`auditConfig.ignoreGhsas` に登録しています。上流の修正版が公開されたら、
依存バージョンを更新してパッチと監査の例外を削除してください。

`tests/dependency-security.cjs` は、リンターが実際に参照する依存チェーンを使い、
攻撃入力と通常の数値書式・パターン展開を検証します。
braces は深さが 64 を超えるパターンを構文エラーとして拒否します。

smol-toml と KaTeX は修正済みバージョンを overrides で指定しています。
依存元が修正済みバージョンに対応したら、この指定も削除できます。
