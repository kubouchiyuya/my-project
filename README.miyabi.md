# 🎋 Miyabi - AI駆動タスク自動実行システム with Lark MCP

**Miyabi**は、あなたの音声指示（Super Whisper経由）を受けて、タスクを自動的に分解・実行し、結果をLarkで報告する革新的なAIエージェントシステムです。

## 🌟 コンセプト

```
あなた（音声指示）
    ↓
Miyabi（指示を受信・タスク分解）
    ↓
複数のエージェント（並列実行）
  ├─ CodeGenAgent（コード生成）
  ├─ TestAgent（テスト実行）
  ├─ ReviewAgent（品質チェック）
  ├─ DeploymentAgent（デプロイ）
  └─ その他10種類以上のエージェント
    ↓
Lark MCP（進捗報告・結果通知）
    ↓
Lark（あなたが結果を確認）
```

## 🚀 主な機能

### 1. 音声からタスク実行まで完全自動化
- Super Whisperで音声入力
- Miyabiが指示を解析
- タスクを自動分解
- 適切なエージェントに割り当て
- 並列実行で高速処理

### 2. Lark統合による進捗可視化
- リアルタイム進捗通知
- インタラクティブカード表示
- タスク完了レポート自動生成
- Larkドキュメントで詳細記録

### 3. 包括的な品質保証
- 自動コードレビュー
- セキュリティスキャン
- テストカバレッジチェック
- 問題の自動修正

### 4. DAGベースの並列実行
- 依存関係を自動解析
- 可能な限り並列実行
- 効率的なリソース活用

## 📦 インストール

```bash
# リポジトリをクローン
git clone https://github.com/kubouchiyuya/my-project.git
cd my-project

# 依存関係をインストール
npm install --include=dev

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してLark認証情報を設定
```

## 🔧 セットアップ

### 1. Larkアプリの作成

1. [Lark Developer Console](https://open.feishu.cn/app)にアクセス
2. 新しいアプリを作成
3. 以下の権限を付与：
   - `im:message` (メッセージ送信)
   - `docx:document` (ドキュメント作成)
   - `im:message.group_at_msg` (グループメッセージ)

4. App IDとApp Secretを取得

### 2. 環境変数の設定

`.env`ファイルを編集：

```bash
# Lark設定
LARK_APP_ID=cli_your_app_id_here
LARK_APP_SECRET=your_app_secret_here
LARK_CHAT_ID=oc_your_chat_id_here  # 通知先のチャットID

# その他の設定
ANTHROPIC_API_KEY=sk-ant-your_key_here  # Claude API使用時
```

### 3. Lark連携テスト

```bash
npm run miyabi lark-test
```

成功すると、指定したLarkチャットにテストメッセージが届きます。

## 💻 使い方

### 基本的な使い方

```bash
# 指示を実行（コンソールのみ）
npm run miyabi execute "Webダッシュボードを作成"

# Larkに進捗を報告しながら実行
npm run miyabi execute "APIサーバーを構築" --lark
```

### 実行例

#### 例1: Web開発

```bash
npm run miyabi execute "ユーザー管理画面を作成。React + TypeScriptで、CRUD機能を実装" --lark
```

Miyabiが自動的に：
1. 要件定義・設計
2. プロジェクト初期化
3. コンポーネント実装
4. テスト作成・実行
5. コードレビュー
6. デプロイ

を実行し、各ステップの進捗をLarkに報告します。

#### 例2: API開発

```bash
npm run miyabi execute "RESTful APIを作成。ユーザー認証とCRUD操作を含む" --lark
```

自動実行内容：
- API設計
- データベース設計
- API実装
- APIテスト
- セキュリティスキャン
- APIドキュメント生成

#### 例3: データ分析

```bash
npm run miyabi execute "GitHubプロジェクトのコミット履歴を分析してレポート作成" --lark
```

## 🎯 対応タスクタイプ

Miyabiは以下のタイプのタスクを自動で判別・実行できます：

| タスクタイプ | 対応内容 |
|------------|---------|
| **Web開発** | React/Vue/Svelteアプリ開発、UI/UX実装 |
| **API開発** | REST/GraphQL API設計・実装 |
| **データベース** | スキーマ設計、マイグレーション |
| **データ分析** | データ収集・加工・可視化・レポート |
| **自動化** | ワークフロー構築、スクリプト作成 |
| **テスト** | ユニット・統合・E2Eテスト |
| **ドキュメント** | README、API Docs、コメント生成 |
| **デプロイ** | CI/CD構築、自動デプロイ |

## 🤖 利用可能なエージェント

Miyabiは以下のエージェントを統合管理：

- **CodeGenAgent** - コード生成
- **TestAgent** - テスト作成・実行
- **ReviewAgent** - コードレビュー・品質チェック
- **DeploymentAgent** - CI/CD・デプロイ
- **APIAgent** - API設計・実装
- **DatabaseAgent** - DB設計・マイグレーション
- **SecurityAgent** - セキュリティスキャン
- **DocumentationAgent** - ドキュメント生成
- **PerformanceAgent** - パフォーマンス最適化
- **RefactorAgent** - リファクタリング
- **MonitoringAgent** - 監視・ロギング
- **Plan Agent** - 実行計画立案
- **Explore Agent** - コードベース探索

## 📊 Lark通知の例

Miyabi実行中、Larkには以下のような通知が届きます：

```
🎋 Miyabiタスクを開始します
指示: Webダッシュボードを作成

📋 タスク分析中 (0%)
あなたの指示を分析して、実行計画を立てています...

✅ タスク分解完了 (10%)
6個のサブタスクに分解しました:
1. 要件定義・設計
2. プロジェクト初期化
3. コンポーネント実装
4. テスト作成・実行
5. コードレビュー
6. デプロイ

🚀 開始: 要件定義・設計
機能要件を整理し、アーキテクチャを設計

✅ 完了: 要件定義・設計

... (以下続く)

✅ タスク完了 (100%)
すべてのタスクが正常に完了しました！

📄 詳細レポート: https://feishu.cn/docx/xxx
```

## 🏗️ プロジェクト構造

```
my-project/
├── src/
│   ├── agents/              # エージェント実行エンジン
│   │   ├── executor.ts     # メイン実行エンジン
│   │   ├── coordinator.ts  # DAGベース並列実行
│   │   └── task-decomposer.ts  # タスク分解ロジック
│   ├── lark-mcp/           # Lark MCP統合
│   │   ├── server.ts       # MCPサーバー
│   │   └── client.ts       # Lark APIクライアント
│   ├── cli.ts              # CLIエントリポイント
│   └── index.ts
├── scripts/
│   └── generate-dashboard-data.ts  # ダッシュボードデータ生成
├── docs/                   # GitHub Pagesダッシュボード
│   ├── index.html
│   └── dashboard-data.json
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # 自動デプロイ（30分ごと）
└── package.json
```

## 🔐 セキュリティ

- すべてのコードに対してセキュリティスキャン実行
- 脆弱性の自動検出・修正
- API キーは環境変数で安全に管理
- Lark通信はHTTPSで暗号化

## 📈 今後の展開

### 次のステップ
1. ✅ Lark MCP統合 - **完了**
2. ⏳ Claude API統合（タスク分解の高度化）
3. ⏳ Super Whisper連携
4. ⏳ より多くのエージェント追加
5. ⏳ WebUIの追加

### ロードマップ
- **v0.2.0**: Claude API統合、高度なタスク分解
- **v0.3.0**: Super Whisper直接連携
- **v0.4.0**: マルチプロジェクト対応
- **v0.5.0**: Web UI追加
- **v1.0.0**: 本格運用版リリース

## 🤝 コントリビューション

このプロジェクトは日本のDX推進を目指しています。

バグ報告、機能要望、プルリクエストを歓迎します！

## 📄 ライセンス

MIT License

## 🙏 謝辞

- [Anthropic Claude](https://www.anthropic.com/) - AI エンジン
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP SDK
- [Lark (Feishu)](https://www.larksuite.com/) - コラボレーションプラットフォーム
- [Super Whisper](https://superwhisper.com/) - 音声入力

---

**Made with 🎋 by Miyabi Team**

*日本のDXを加速する、次世代AI自動化システム*
