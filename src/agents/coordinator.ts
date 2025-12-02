/**
 * Agent Coordinator
 *
 * タスクDAGに基づいて複数のエージェントを並列実行・調整
 */

import { TaskStep } from './executor.js';
import { LarkClient } from '../lark-mcp/client.js';

export class AgentCoordinator {
  private larkClient?: LarkClient;
  private chatId?: string;

  constructor(larkClient?: LarkClient, chatId?: string) {
    this.larkClient = larkClient;
    this.chatId = chatId;
  }

  /**
   * タスクDAGを実行（依存関係に基づく並列実行）
   */
  async executeTaskDAG(tasks: TaskStep[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    console.log(`🎯 タスクDAG実行開始: ${tasks.length}個のタスク`);

    // 実行可能なタスクを見つけて実行していく
    while (tasks.some((t) => t.status === 'pending' || t.status === 'running')) {
      // 依存関係が満たされている実行可能なタスクを取得
      const readyTasks = tasks.filter((task) => {
        if (task.status !== 'pending') return false;

        // すべての依存タスクが完了しているかチェック
        return task.dependencies.every((depId) => {
          const depTask = taskMap.get(depId);
          return depTask?.status === 'completed';
        });
      });

      if (readyTasks.length === 0) {
        // 実行中のタスクが完了するのを待つ
        if (tasks.some((t) => t.status === 'running')) {
          await this.sleep(100);
          continue;
        }

        // デッドロックまたはすべて完了
        break;
      }

      // 並列実行
      console.log(`⚡ ${readyTasks.length}個のタスクを並列実行`);

      await Promise.all(
        readyTasks.map(async (task) => {
          task.status = 'running';

          try {
            await this.notifyTaskStart(task);

            const result = await this.executeTask(task, results);

            task.status = 'completed';
            task.result = result;
            results.set(task.id, result);

            await this.notifyTaskComplete(task);

            console.log(`✅ タスク完了: ${task.name}`);
          } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : String(error);

            await this.notifyTaskFailed(task, error);

            console.error(`❌ タスク失敗: ${task.name}`, error);

            // 失敗時は依存している後続タスクもスキップ
            this.markDependentTasksAsFailed(task.id, tasks);
          }
        })
      );
    }

    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;

    console.log(
      `🏁 タスクDAG実行完了: 成功 ${completed}/${tasks.length}, 失敗 ${failed}`
    );

    return results;
  }

  /**
   * 個別タスクを実行（エージェントを呼び出し）
   */
  private async executeTask(
    task: TaskStep,
    previousResults: Map<string, any>
  ): Promise<any> {
    console.log(`🚀 実行中: ${task.name} (${task.agentType})`);

    // 依存タスクの結果を取得
    const dependencyResults = task.dependencies.map((depId) => ({
      id: depId,
      result: previousResults.get(depId),
    }));

    // エージェントタイプに応じて実行
    switch (task.agentType) {
      case 'CodeGenAgent':
        return await this.runCodeGenAgent(task, dependencyResults);

      case 'TestAgent':
        return await this.runTestAgent(task, dependencyResults);

      case 'ReviewAgent':
        return await this.runReviewAgent(task, dependencyResults);

      case 'DeploymentAgent':
        return await this.runDeploymentAgent(task, dependencyResults);

      case 'APIAgent':
        return await this.runAPIAgent(task, dependencyResults);

      case 'DatabaseAgent':
        return await this.runDatabaseAgent(task, dependencyResults);

      case 'SecurityAgent':
        return await this.runSecurityAgent(task, dependencyResults);

      case 'DocumentationAgent':
        return await this.runDocumentationAgent(task, dependencyResults);

      case 'Plan':
        return await this.runPlanAgent(task, dependencyResults);

      case 'Explore':
        return await this.runExploreAgent(task, dependencyResults);

      case 'general-purpose':
      default:
        return await this.runGeneralPurposeAgent(task, dependencyResults);
    }
  }

  /**
   * コード生成エージェント実行
   */
  private async runCodeGenAgent(task: TaskStep, deps: any[]): Promise<any> {
    // TODO: 実際のClaude API等を使った実装
    console.log(`  💻 CodeGenAgent: ${task.description}`);

    await this.sleep(1000); // シミュレーション

    return {
      filesCreated: ['src/example.ts'],
      linesOfCode: 150,
    };
  }

  /**
   * テストエージェント実行
   */
  private async runTestAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🧪 TestAgent: ${task.description}`);

    await this.sleep(800);

    return {
      testsRun: 25,
      testsPassed: 25,
      coverage: 85,
    };
  }

  /**
   * レビューエージェント実行
   */
  private async runReviewAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🔍 ReviewAgent: ${task.description}`);

    await this.sleep(600);

    return {
      issues: [],
      qualityScore: 95,
      securityScore: 98,
    };
  }

  /**
   * デプロイエージェント実行
   */
  private async runDeploymentAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🚀 DeploymentAgent: ${task.description}`);

    await this.sleep(1500);

    return {
      deployed: true,
      url: 'https://example.com',
      environment: 'production',
    };
  }

  /**
   * APIエージェント実行
   */
  private async runAPIAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🔌 APIAgent: ${task.description}`);

    await this.sleep(700);

    return {
      endpoints: ['/api/users', '/api/posts'],
      openApiSpec: 'openapi.yaml',
    };
  }

  /**
   * データベースエージェント実行
   */
  private async runDatabaseAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🗄️ DatabaseAgent: ${task.description}`);

    await this.sleep(600);

    return {
      tables: ['users', 'posts'],
      migrations: ['001_initial.sql'],
    };
  }

  /**
   * セキュリティエージェント実行
   */
  private async runSecurityAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🔒 SecurityAgent: ${task.description}`);

    await this.sleep(900);

    return {
      vulnerabilities: 0,
      securityScore: 100,
    };
  }

  /**
   * ドキュメンテーションエージェント実行
   */
  private async runDocumentationAgent(
    task: TaskStep,
    deps: any[]
  ): Promise<any> {
    console.log(`  📚 DocumentationAgent: ${task.description}`);

    await this.sleep(500);

    return {
      docsGenerated: ['README.md', 'API.md'],
    };
  }

  /**
   * プランエージェント実行
   */
  private async runPlanAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  📋 PlanAgent: ${task.description}`);

    await this.sleep(400);

    return {
      plan: 'Detailed implementation plan',
      estimatedTime: '2 hours',
    };
  }

  /**
   * 探索エージェント実行
   */
  private async runExploreAgent(task: TaskStep, deps: any[]): Promise<any> {
    console.log(`  🔎 ExploreAgent: ${task.description}`);

    await this.sleep(300);

    return {
      findings: 'Codebase analysis complete',
    };
  }

  /**
   * 汎用エージェント実行
   */
  private async runGeneralPurposeAgent(
    task: TaskStep,
    deps: any[]
  ): Promise<any> {
    console.log(`  ⚙️ GeneralPurposeAgent: ${task.description}`);

    await this.sleep(500);

    return {
      status: 'completed',
    };
  }

  /**
   * 依存しているタスクを失敗としてマーク
   */
  private markDependentTasksAsFailed(failedTaskId: string, tasks: TaskStep[]) {
    const dependents = tasks.filter((t) => t.dependencies.includes(failedTaskId));

    for (const task of dependents) {
      if (task.status === 'pending') {
        task.status = 'failed';
        task.error = `Dependency ${failedTaskId} failed`;

        // 再帰的に依存タスクも失敗にする
        this.markDependentTasksAsFailed(task.id, tasks);
      }
    }
  }

  /**
   * タスク開始をLarkに通知
   */
  private async notifyTaskStart(task: TaskStep) {
    if (this.larkClient && this.chatId) {
      await this.larkClient.sendMessage({
        receive_id: this.chatId,
        msg_type: 'text',
        content: JSON.stringify({
          text: `🚀 開始: ${task.name}\n${task.description}`,
        }),
      });
    }
  }

  /**
   * タスク完了をLarkに通知
   */
  private async notifyTaskComplete(task: TaskStep) {
    if (this.larkClient && this.chatId) {
      await this.larkClient.sendMessage({
        receive_id: this.chatId,
        msg_type: 'text',
        content: JSON.stringify({
          text: `✅ 完了: ${task.name}`,
        }),
      });
    }
  }

  /**
   * タスク失敗をLarkに通知
   */
  private async notifyTaskFailed(task: TaskStep, error: unknown) {
    if (this.larkClient && this.chatId) {
      await this.larkClient.sendMessage({
        receive_id: this.chatId,
        msg_type: 'text',
        content: JSON.stringify({
          text: `❌ 失敗: ${task.name}\nエラー: ${error instanceof Error ? error.message : String(error)}`,
        }),
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
