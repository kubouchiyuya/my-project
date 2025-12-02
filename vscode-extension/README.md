# 🎋 Miyabi VS Code Extension

VS Code内からMiyabiを簡単に使えるようにする公式拡張機能です。

## 機能

### コマンド

- **Miyabi: タスクを実行** (`Cmd+Shift+M`)
  - タスクをコンソールで実行

- **Miyabi: タスクを実行（Lark通知あり）**
  - Larkに進捗を報告しながらタスクを実行

- **Miyabi: Lark連携テスト**
  - Lark連携が正常に動作するかテスト

- **Miyabi: ターミナルを開く**
  - Miyabiターミナルを開く

### キーボードショートカット

- `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows/Linux): タスクを実行

## セットアップ

1. 拡張機能をインストール
2. 設定を開く (`Cmd+,`)
3. "Miyabi"で検索
4. Lark認証情報を入力:
   - Lark App ID
   - Lark App Secret
   - Lark Chat ID
   - Lark通知を有効化

## 使い方

### 基本的な使い方

1. コマンドパレットを開く (`Cmd+Shift+P`)
2. "Miyabi" と入力
3. 実行したいコマンドを選択
4. タスク内容を入力

### 例

```
タスク: Webダッシュボードを作成
→ Miyabiが自動的にタスクを分解・実行
→ 結果が出力パネルに表示
→ Larkに進捗が通知（有効にしている場合）
```

## 設定

```json
{
  "miyabi.larkAppId": "cli_xxxxx",
  "miyabi.larkAppSecret": "xxxxx",
  "miyabi.larkChatId": "oc_xxxxx",
  "miyabi.enableLarkNotifications": true
}
```

## インストール

### 方法1: ローカルインストール

```bash
cd vscode-extension
npm install
npm run compile
code --install-extension .
```

### 方法2: VSIXパッケージ

```bash
npm install -g vsce
vsce package
code --install-extension miyabi-vscode-0.1.0.vsix
```

## 開発

```bash
# 依存関係をインストール
npm install

# コンパイル
npm run compile

# ウォッチモード
npm run watch

# デバッグ実行
F5を押す
```

## ライセンス

MIT
