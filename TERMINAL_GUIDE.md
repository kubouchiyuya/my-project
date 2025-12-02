# 🎋 Miyabi ターミナル統合ガイド

MiyabiをMacBook ProのターミナルとVS Codeから直接使う方法

## 📟 ターミナルから使う

### セットアップ（初回のみ）

```bash
# プロジェクトディレクトリに移動
cd /Users/kubouchiyuya/dev/miyabi_0.15/my-project

# グローバルにインストール
npm link

# PATHを設定（初回のみ）
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 基本的な使い方

```bash
# ヘルプを表示
miyabi

# タスクを実行
miyabi execute "Webダッシュボードを作成"

# Lark通知付きでタスクを実行
miyabi execute "APIサーバーを構築" --lark

# Lark連携テスト
miyabi lark-test
```

### 実行例

```bash
# 例1: Web開発
miyabi execute "React + TypeScriptでユーザー管理画面を作成" --lark

# 例2: API開発
miyabi execute "RESTful APIを作成。認証とCRUD機能を含む" --lark

# 例3: データ分析
miyabi execute "GitHubのコミット履歴を分析してレポート作成"

# 例4: 自動化
miyabi execute "GitHub Actionsでテスト自動化ワークフローを構築"
```

## 💻 VS Codeから使う

### インストール

#### 方法1: 開発モードで実行

1. VS Codeで `vscode-extension` ディレクトリを開く
2. `F5` を押してデバッグ実行
3. 新しいVS Codeウィンドウが開く

#### 方法2: ローカルインストール

```bash
cd vscode-extension
npm install
npm run compile
code --install-extension .
```

### 使い方

#### コマンドパレットから

1. `Cmd+Shift+P` でコマンドパレットを開く
2. "Miyabi" と入力
3. 以下のコマンドから選択：
   - `Miyabi: タスクを実行`
   - `Miyabi: タスクを実行（Lark通知あり）`
   - `Miyabi: Lark連携テスト`
   - `Miyabi: ターミナルを開く`

#### キーボードショートカット

- `Cmd+Shift+M`: タスクを実行

#### 設定

1. `Cmd+,` で設定を開く
2. "Miyabi"で検索
3. Lark認証情報を入力：

```json
{
  "miyabi.larkAppId": "cli_xxxxx",
  "miyabi.larkAppSecret": "xxxxx",
  "miyabi.larkChatId": "oc_xxxxx",
  "miyabi.enableLarkNotifications": true
}
```

### VS Code統合の特徴

- ✅ リアルタイム出力表示
- ✅ 進捗通知
- ✅ 設定の永続化
- ✅ ワークスペース統合
- ✅ キーボードショートカット

## 🎤 Super Whisper連携（将来の機能）

音声入力から直接Miyabiを実行する設定:

### Super Whisper設定

1. Super Whisperを起動
2. カスタムコマンドを作成:

```bash
# Super Whisperのカスタムコマンド設定
Command: miyabi execute "{transcription}" --lark
Trigger: "みやび" または "Miyabi"
```

3. 使い方:
   - Super Whisperを起動
   - "みやび、Webダッシュボードを作成"
   - Miyabiが自動実行

## 🔧 トラブルシューティング

### `miyabi: command not found`

```bash
# PATHを確認
echo $PATH | grep .npm-global

# PATHを再設定
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 再リンク
cd /Users/kubouchiyuya/dev/miyabi_0.15/my-project
npm unlink
npm link
```

### VS Code拡張機能が動かない

```bash
# 再コンパイル
cd vscode-extension
rm -rf out node_modules
npm install --include=dev
npm run compile

# VS Codeを再起動
```

### Lark通知が届かない

```bash
# 環境変数を確認
echo $LARK_APP_ID
echo $LARK_APP_SECRET
echo $LARK_CHAT_ID

# .envファイルを確認
cat .env

# Lark連携テスト
miyabi lark-test
```

## 📚 詳細ドキュメント

- [README.miyabi.md](README.miyabi.md) - Miyabiの詳細ドキュメント
- [vscode-extension/README.md](vscode-extension/README.md) - VS Code拡張機能のドキュメント

## 🎯 よくある使い方

### 開発ワークフロー

```bash
# 朝: プロジェクト開始
miyabi execute "今日のタスクを確認してTODOリストを作成" --lark

# コーディング中: 機能追加
miyabi execute "ユーザー認証機能を追加。テストも含む" --lark

# コミット前: 品質チェック
miyabi execute "コードレビューとセキュリティスキャンを実行"

# デプロイ前: 最終確認
miyabi execute "本番環境へのデプロイ準備。テスト実行と確認" --lark
```

### VS Code内での使い方

1. プロジェクトを開く
2. `Cmd+Shift+M`を押す
3. タスクを入力: "このファイルにテストを追加"
4. Enterを押す
5. 出力パネルで進捗を確認
6. Larkで完了通知を受信

---

**Made with 🎋 by Miyabi Team**
