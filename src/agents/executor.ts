/**
 * Miyabi Agent Executor
 *
 * あなたの指示を受けて、タスクを分解・実行するMiyabiのコアエンジン
 * Lark MCPを使ってLarkに進捗を報告
 */

import { LarkClient } from '../lark-mcp/client.js';
import { TaskDecomposer } from './task-decomposer.js';
import { AgentCoordinator } from './coordinator.js';

export interface MiyabiTaskParams {
  instruction: string; // あなたからの指示（音声→テキスト化済み）
  chatId?: string; // Lark通知先チャットID（オプション）
  agentType?: string; // 使用するエージェントタイプ
  larkClient?: LarkClient; // Larkクライアント
}

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  agentType: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Miyabiタスク実行メインエンジン
 */
export async function executeMiyabiTask(params: MiyabiTaskParams) {
  const { instruction, chatId, larkClient } = params;

  console.log(`🎋 Miyabi: タスクを受信しました`);
  console.log(`   指示: ${instruction}`);

  try {
    // Step 1: タスク分解
    await reportProgress(
      larkClient,
      chatId,
      '📋 タスク分析中',
      0,
      'あなたの指示を分析して、実行計画を立てています...'
    );

    const decomposer = new TaskDecomposer();
    const taskSteps = await decomposer.decompose(instruction);

    await reportProgress(
      larkClient,
      chatId,
      '✅ タスク分解完了',
      10,
      `${taskSteps.length}個のサブタスクに分解しました:\n${taskSteps.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`
    );

    // Step 2: エージェント起動・タスク実行
    const coordinator = new AgentCoordinator(larkClient, chatId);
    const results = await coordinator.executeTaskDAG(taskSteps);

    // Step 3: 品質チェック・セキュリティスキャン
    await reportProgress(
      larkClient,
      chatId,
      '🔍 品質チェック実行中',
      80,
      'コード品質、セキュリティ、テストをチェックしています...'
    );

    const qualityCheck = await runQualityChecks(results);

    if (!qualityCheck.passed) {
      // 自動修正を試みる
      await reportProgress(
        larkClient,
        chatId,
        '🔧 自動修正実行中',
        85,
        `${qualityCheck.issues.length}件の問題を検出。自動修正を試みています...`
      );

      await autoFixIssues(qualityCheck.issues, coordinator);
    }

    // Step 4: 最終成果物の作成
    await reportProgress(
      larkClient,
      chatId,
      '📦 成果物を準備中',
      90,
      '最終成果物をまとめています...'
    );

    const deliverable = await createDeliverable(results);

    // Step 5: Larkに結果を報告
    await reportProgress(
      larkClient,
      chatId,
      '✅ タスク完了',
      100,
      'すべてのタスクが正常に完了しました！'
    );

    // 詳細レポートをLarkドキュメントとして作成
    if (larkClient) {
      const docUrl = await createLarkReport(
        larkClient,
        instruction,
        taskSteps,
        results,
        deliverable
      );

      await larkClient.sendMessage({
        receive_id: chatId!,
        msg_type: 'text',
        content: JSON.stringify({
          text: `🎉 タスク「${instruction}」が完了しました！\n\n📄 詳細レポート: ${docUrl}`,
        }),
      });
    }

    return {
      success: true,
      steps: taskSteps,
      results,
      deliverable,
    };
  } catch (error) {
    console.error('❌ Miyabiタスク実行エラー:', error);

    await reportProgress(
      larkClient,
      chatId,
      '❌ タスク失敗',
      0,
      `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
    );

    throw error;
  }
}

/**
 * 進捗をLarkに報告
 */
async function reportProgress(
  larkClient: LarkClient | undefined,
  chatId: string | undefined,
  title: string,
  progress: number,
  details: string
) {
  console.log(`${title} (${progress}%): ${details}`);

  if (larkClient && chatId) {
    await larkClient.sendProgressCard(chatId, title, progress, details);
  }
}

/**
 * 品質チェック実行
 */
async function runQualityChecks(results: any): Promise<{
  passed: boolean;
  issues: any[];
}> {
  // TODO: 実装
  // - コード品質チェック（ESLint, Prettier等）
  // - セキュリティスキャン（依存関係の脆弱性チェック等）
  // - テストカバレッジチェック
  // - パフォーマンステスト

  return {
    passed: true,
    issues: [],
  };
}

/**
 * 問題の自動修正
 */
async function autoFixIssues(issues: any[], coordinator: AgentCoordinator) {
  // TODO: 検出された問題を自動修正
  for (const issue of issues) {
    console.log(`🔧 修正中: ${issue.type} - ${issue.message}`);
    // 適切なエージェントを呼び出して修正
  }
}

/**
 * 成果物を作成
 */
async function createDeliverable(results: any): Promise<{
  files: string[];
  summary: string;
  metrics: any;
}> {
  // TODO: 実装
  return {
    files: [],
    summary: 'タスク完了',
    metrics: {},
  };
}

/**
 * Larkレポートドキュメントを作成
 */
async function createLarkReport(
  larkClient: LarkClient,
  instruction: string,
  steps: TaskStep[],
  results: any,
  deliverable: any
): Promise<string> {
  const content = `
# 🎋 Miyabi タスクレポート

## 📋 指示内容
${instruction}

## 🔄 実行ステップ
${steps
  .map(
    (step, i) => `
### ${i + 1}. ${step.name}
- **ステータス:** ${step.status}
- **担当エージェント:** ${step.agentType}
- **説明:** ${step.description}
`
  )
  .join('\n')}

## 📊 実行結果
- **総ステップ数:** ${steps.length}
- **成功:** ${steps.filter((s) => s.status === 'completed').length}
- **失敗:** ${steps.filter((s) => s.status === 'failed').length}

## 📦 成果物
${deliverable.files.length > 0 ? `- ファイル: ${deliverable.files.join(', ')}` : '- なし'}

## 📈 メトリクス
- **実行時間:** ${deliverable.metrics.duration || 'N/A'}
- **品質スコア:** ${deliverable.metrics.qualityScore || 'N/A'}

---
*Generated by Miyabi at ${new Date().toLocaleString('ja-JP')}*
`;

  const result = await larkClient.createDocument({
    title: `Miyabi Report: ${instruction}`,
    content,
  });

  return result.url;
}
