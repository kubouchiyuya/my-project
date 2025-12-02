#!/usr/bin/env node

/**
 * Miyabi CLI
 *
 * コマンドラインからMiyabiを操作するためのCLI
 */

import { executeMiyabiTask } from './agents/executor.js';
import { LarkClient } from './lark-mcp/client.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🎋 Miyabi - AI駆動タスク自動実行システム

使い方:
  miyabi execute "<指示内容>"          指示を実行
  miyabi execute "<指示>" --lark      Larkに進捗を報告
  miyabi lark-test                     Lark連携テスト

環境変数:
  LARK_APP_ID        Lark App ID
  LARK_APP_SECRET    Lark App Secret
  LARK_CHAT_ID       通知先チャットID

例:
  miyabi execute "Webダッシュボードを作成"
  miyabi execute "APIサーバーを構築" --lark
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'execute':
      case 'exec':
        await handleExecute(args.slice(1));
        break;

      case 'lark-test':
        await handleLarkTest();
        break;

      default:
        console.error(`❌ 不明なコマンド: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

/**
 * executeコマンドの処理
 */
async function handleExecute(args: string[]) {
  const useLark = args.includes('--lark');
  const instruction = args.filter((arg) => !arg.startsWith('--')).join(' ');

  if (!instruction) {
    console.error('❌ 指示内容を指定してください');
    process.exit(1);
  }

  console.log(`🎋 Miyabi タスク実行`);
  console.log(`   指示: ${instruction}`);

  let larkClient: LarkClient | undefined;
  let chatId: string | undefined;

  if (useLark) {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    chatId = process.env.LARK_CHAT_ID;

    if (!appId || !appSecret) {
      console.error(
        '❌ Lark連携には LARK_APP_ID と LARK_APP_SECRET が必要です'
      );
      process.exit(1);
    }

    larkClient = new LarkClient({ appId, appSecret });
    console.log('   Lark通知: 有効');
  }

  const result = await executeMiyabiTask({
    instruction,
    chatId,
    larkClient,
  });

  console.log('\n✅ タスク完了');
  console.log(`   実行ステップ数: ${result.steps.length}`);
  console.log(
    `   成功: ${result.steps.filter((s) => s.status === 'completed').length}`
  );
  console.log(
    `   失敗: ${result.steps.filter((s) => s.status === 'failed').length}`
  );
}

/**
 * Lark連携テスト
 */
async function handleLarkTest() {
  console.log('🧪 Lark連携テスト開始');

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const chatId = process.env.LARK_CHAT_ID;

  if (!appId || !appSecret || !chatId) {
    console.error(
      '❌ 環境変数が不足しています: LARK_APP_ID, LARK_APP_SECRET, LARK_CHAT_ID'
    );
    process.exit(1);
  }

  const client = new LarkClient({ appId, appSecret });

  console.log('📤 テストメッセージを送信中...');

  await client.sendMessage({
    receive_id: chatId,
    msg_type: 'text',
    content: JSON.stringify({
      text: '🎋 Miyabi Lark連携テスト\n\nこのメッセージが表示されていれば、連携は正常です！',
    }),
  });

  console.log('✅ テストメッセージ送信完了');

  console.log('📊 進捗カードを送信中...');

  await client.sendProgressCard(
    chatId,
    'テストタスク',
    75,
    'Lark MCP統合が正常に動作しています'
  );

  console.log('✅ 進捗カード送信完了');

  console.log('\n🎉 Lark連携テスト完了！');
}

main();
