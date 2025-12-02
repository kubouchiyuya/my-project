/**
 * Miyabi VS Code Extension
 *
 * VS Code内からMiyabiを簡単に使えるようにする拡張機能
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log('🎋 Miyabi extension is now active!');

  // コマンド: タスクを実行
  const executeCommand = vscode.commands.registerCommand('miyabi.execute', async () => {
    const instruction = await vscode.window.showInputBox({
      prompt: '実行したいタスクを入力してください',
      placeHolder: '例: Webダッシュボードを作成',
    });

    if (!instruction) {
      return;
    }

    await executeMiyabi(instruction, false);
  });

  // コマンド: タスクを実行（Lark通知あり）
  const executeWithLarkCommand = vscode.commands.registerCommand('miyabi.executeWithLark', async () => {
    const instruction = await vscode.window.showInputBox({
      prompt: '実行したいタスクを入力してください（Lark通知あり）',
      placeHolder: '例: APIサーバーを構築',
    });

    if (!instruction) {
      return;
    }

    const config = vscode.workspace.getConfiguration('miyabi');
    const larkEnabled = config.get<boolean>('enableLarkNotifications', false);

    if (!larkEnabled) {
      const enable = await vscode.window.showWarningMessage(
        'Lark通知が無効になっています。有効にしますか？',
        'はい',
        'いいえ'
      );

      if (enable === 'はい') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'miyabi.enableLarkNotifications');
        return;
      }
    }

    await executeMiyabi(instruction, true);
  });

  // コマンド: Lark連携テスト
  const larkTestCommand = vscode.commands.registerCommand('miyabi.larkTest', async () => {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Miyabi: Lark連携テスト中...',
        cancellable: false,
      },
      async () => {
        try {
          const { stdout, stderr } = await execAsync('miyabi lark-test', {
            env: {
              ...process.env,
              ...getEnvironmentVariables(),
            },
          });

          if (stderr) {
            vscode.window.showErrorMessage(`エラー: ${stderr}`);
          } else {
            vscode.window.showInformationMessage('✅ Lark連携テスト成功！');
            const outputChannel = vscode.window.createOutputChannel('Miyabi');
            outputChannel.appendLine(stdout);
            outputChannel.show();
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(`Lark連携テスト失敗: ${error.message}`);
        }
      }
    );
  });

  // コマンド: ターミナルを開く
  const openTerminalCommand = vscode.commands.registerCommand('miyabi.openTerminal', () => {
    const terminal = vscode.window.createTerminal('Miyabi');
    terminal.show();
    terminal.sendText('miyabi');
  });

  context.subscriptions.push(
    executeCommand,
    executeWithLarkCommand,
    larkTestCommand,
    openTerminalCommand
  );
}

/**
 * Miyabiタスクを実行
 */
async function executeMiyabi(instruction: string, useLark: boolean) {
  const outputChannel = vscode.window.createOutputChannel('Miyabi');
  outputChannel.show();
  outputChannel.appendLine(`🎋 Miyabi タスク実行`);
  outputChannel.appendLine(`   指示: ${instruction}`);
  outputChannel.appendLine(`   Lark通知: ${useLark ? '有効' : '無効'}`);
  outputChannel.appendLine('');

  const larkFlag = useLark ? '--lark' : '';
  const command = `miyabi execute "${instruction}" ${larkFlag}`;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Miyabi: ${instruction}`,
      cancellable: false,
    },
    async () => {
      try {
        const env = {
          ...process.env,
          ...getEnvironmentVariables(),
        };

        outputChannel.appendLine(`実行コマンド: ${command}`);
        outputChannel.appendLine('');

        // 非同期で実行してリアルタイム出力
        const child = exec(command, { env });

        child.stdout?.on('data', (data) => {
          outputChannel.append(data);
        });

        child.stderr?.on('data', (data) => {
          outputChannel.append(data);
        });

        child.on('close', (code) => {
          if (code === 0) {
            outputChannel.appendLine('');
            outputChannel.appendLine('✅ タスク完了');
            vscode.window.showInformationMessage(`✅ Miyabiタスク完了: ${instruction}`);
          } else {
            outputChannel.appendLine('');
            outputChannel.appendLine(`❌ タスク失敗 (exit code: ${code})`);
            vscode.window.showErrorMessage(`❌ Miyabiタスク失敗: ${instruction}`);
          }
        });
      } catch (error: any) {
        outputChannel.appendLine(`❌ エラー: ${error.message}`);
        vscode.window.showErrorMessage(`Miyabiエラー: ${error.message}`);
      }
    }
  );
}

/**
 * 環境変数を取得
 */
function getEnvironmentVariables(): Record<string, string> {
  const config = vscode.workspace.getConfiguration('miyabi');

  return {
    LARK_APP_ID: config.get('larkAppId', ''),
    LARK_APP_SECRET: config.get('larkAppSecret', ''),
    LARK_CHAT_ID: config.get('larkChatId', ''),
  };
}

export function deactivate() {
  console.log('🎋 Miyabi extension is now deactivated');
}
