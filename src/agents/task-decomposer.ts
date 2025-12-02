/**
 * Task Decomposer
 *
 * あなたの指示を解析して、実行可能なサブタスクに分解
 */

import { TaskStep } from './executor.js';

export class TaskDecomposer {
  /**
   * 指示をタスクステップに分解
   */
  async decompose(instruction: string): Promise<TaskStep[]> {
    console.log(`📋 タスク分解開始: ${instruction}`);

    // AIを使ってタスクを分解（Claude API等を使用）
    const steps = await this.analyzeAndDecompose(instruction);

    // 依存関係を解析してDAGを構築
    const dag = this.buildDAG(steps);

    console.log(`✅ ${dag.length}個のタスクステップに分解完了`);

    return dag;
  }

  /**
   * AIを使ってタスクを分解
   */
  private async analyzeAndDecompose(instruction: string): Promise<TaskStep[]> {
    // TODO: Claude API等を使って実装
    // 現在は簡易的なルールベースの分解

    const keywords = this.extractKeywords(instruction);
    const taskType = this.inferTaskType(instruction, keywords);

    switch (taskType) {
      case 'web_development':
        return this.decomposeWebDevelopment(instruction, keywords);
      case 'api_development':
        return this.decomposeApiDevelopment(instruction, keywords);
      case 'data_analysis':
        return this.decomposeDataAnalysis(instruction, keywords);
      case 'automation':
        return this.decomposeAutomation(instruction, keywords);
      default:
        return this.decomposeGeneral(instruction);
    }
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(instruction: string): string[] {
    const keywords: string[] = [];

    // 開発関連
    if (/web|サイト|ページ|フロント/.test(instruction)) {
      keywords.push('web', 'frontend');
    }
    if (/api|バックエンド|サーバー/.test(instruction)) {
      keywords.push('api', 'backend');
    }
    if (/データベース|db|sql/.test(instruction)) {
      keywords.push('database');
    }

    // 作業内容
    if (/作成|作る|構築|開発/.test(instruction)) {
      keywords.push('create');
    }
    if (/修正|直す|fix/.test(instruction)) {
      keywords.push('fix');
    }
    if (/テスト|test/.test(instruction)) {
      keywords.push('test');
    }
    if (/デプロイ|deploy|公開/.test(instruction)) {
      keywords.push('deploy');
    }

    return keywords;
  }

  /**
   * タスクタイプを推論
   */
  private inferTaskType(
    instruction: string,
    keywords: string[]
  ): string {
    if (keywords.includes('web') && keywords.includes('frontend')) {
      return 'web_development';
    }
    if (keywords.includes('api') || keywords.includes('backend')) {
      return 'api_development';
    }
    if (/分析|解析|レポート/.test(instruction)) {
      return 'data_analysis';
    }
    if (/自動|workflow|ワークフロー/.test(instruction)) {
      return 'automation';
    }
    return 'general';
  }

  /**
   * Web開発タスクの分解
   */
  private decomposeWebDevelopment(
    instruction: string,
    keywords: string[]
  ): TaskStep[] {
    return [
      {
        id: 'plan',
        name: '要件定義・設計',
        description: '機能要件を整理し、アーキテクチャを設計',
        agentType: 'Plan',
        dependencies: [],
        status: 'pending',
      },
      {
        id: 'scaffold',
        name: 'プロジェクト初期化',
        description: 'フレームワーク選定とプロジェクト構築',
        agentType: 'CodeGenAgent',
        dependencies: ['plan'],
        status: 'pending',
      },
      {
        id: 'implement',
        name: 'コンポーネント実装',
        description: 'UI/UXコンポーネントの実装',
        agentType: 'CodeGenAgent',
        dependencies: ['scaffold'],
        status: 'pending',
      },
      {
        id: 'test',
        name: 'テスト作成・実行',
        description: 'ユニットテスト・E2Eテストの作成と実行',
        agentType: 'TestAgent',
        dependencies: ['implement'],
        status: 'pending',
      },
      {
        id: 'review',
        name: 'コードレビュー',
        description: '品質チェックとセキュリティスキャン',
        agentType: 'ReviewAgent',
        dependencies: ['test'],
        status: 'pending',
      },
      {
        id: 'deploy',
        name: 'デプロイ',
        description: 'アプリケーションのビルドとデプロイ',
        agentType: 'DeploymentAgent',
        dependencies: ['review'],
        status: 'pending',
      },
    ];
  }

  /**
   * API開発タスクの分解
   */
  private decomposeApiDevelopment(
    instruction: string,
    keywords: string[]
  ): TaskStep[] {
    return [
      {
        id: 'design',
        name: 'API設計',
        description: 'エンドポイント設計とスキーマ定義',
        agentType: 'APIAgent',
        dependencies: [],
        status: 'pending',
      },
      {
        id: 'database',
        name: 'データベース設計',
        description: 'スキーマ設計とマイグレーション',
        agentType: 'DatabaseAgent',
        dependencies: ['design'],
        status: 'pending',
      },
      {
        id: 'implement',
        name: 'API実装',
        description: 'ハンドラーとビジネスロジックの実装',
        agentType: 'CodeGenAgent',
        dependencies: ['database'],
        status: 'pending',
      },
      {
        id: 'test',
        name: 'APIテスト',
        description: '統合テストとAPIテストの作成・実行',
        agentType: 'TestAgent',
        dependencies: ['implement'],
        status: 'pending',
      },
      {
        id: 'security',
        name: 'セキュリティスキャン',
        description: '脆弱性スキャンと認証・認可チェック',
        agentType: 'SecurityAgent',
        dependencies: ['test'],
        status: 'pending',
      },
      {
        id: 'docs',
        name: 'APIドキュメント生成',
        description: 'OpenAPI/Swaggerドキュメントの生成',
        agentType: 'DocumentationAgent',
        dependencies: ['implement'],
        status: 'pending',
      },
    ];
  }

  /**
   * データ分析タスクの分解
   */
  private decomposeDataAnalysis(
    instruction: string,
    keywords: string[]
  ): TaskStep[] {
    return [
      {
        id: 'collect',
        name: 'データ収集',
        description: '必要なデータソースからデータを収集',
        agentType: 'general-purpose',
        dependencies: [],
        status: 'pending',
      },
      {
        id: 'clean',
        name: 'データクリーニング',
        description: 'データの前処理と整形',
        agentType: 'general-purpose',
        dependencies: ['collect'],
        status: 'pending',
      },
      {
        id: 'analyze',
        name: 'データ分析',
        description: '統計分析と可視化',
        agentType: 'general-purpose',
        dependencies: ['clean'],
        status: 'pending',
      },
      {
        id: 'report',
        name: 'レポート作成',
        description: '分析結果のレポート作成',
        agentType: 'DocumentationAgent',
        dependencies: ['analyze'],
        status: 'pending',
      },
    ];
  }

  /**
   * 自動化タスクの分解
   */
  private decomposeAutomation(
    instruction: string,
    keywords: string[]
  ): TaskStep[] {
    return [
      {
        id: 'design',
        name: 'ワークフロー設計',
        description: '自動化フローの設計とステップ定義',
        agentType: 'Plan',
        dependencies: [],
        status: 'pending',
      },
      {
        id: 'implement',
        name: 'スクリプト実装',
        description: '自動化スクリプトの実装',
        agentType: 'CodeGenAgent',
        dependencies: ['design'],
        status: 'pending',
      },
      {
        id: 'test',
        name: 'テスト実行',
        description: 'ワークフローのテスト',
        agentType: 'TestAgent',
        dependencies: ['implement'],
        status: 'pending',
      },
      {
        id: 'schedule',
        name: 'スケジュール設定',
        description: 'GitHub ActionsやCron等でスケジュール設定',
        agentType: 'DeploymentAgent',
        dependencies: ['test'],
        status: 'pending',
      },
    ];
  }

  /**
   * 汎用タスクの分解
   */
  private decomposeGeneral(instruction: string): TaskStep[] {
    return [
      {
        id: 'analyze',
        name: 'タスク分析',
        description: '指示内容を詳細に分析',
        agentType: 'Explore',
        dependencies: [],
        status: 'pending',
      },
      {
        id: 'plan',
        name: '実行計画立案',
        description: '実装方針とアプローチを決定',
        agentType: 'Plan',
        dependencies: ['analyze'],
        status: 'pending',
      },
      {
        id: 'execute',
        name: 'タスク実行',
        description: '計画に基づいてタスクを実行',
        agentType: 'general-purpose',
        dependencies: ['plan'],
        status: 'pending',
      },
      {
        id: 'verify',
        name: '検証',
        description: '結果の検証と品質チェック',
        agentType: 'ReviewAgent',
        dependencies: ['execute'],
        status: 'pending',
      },
    ];
  }

  /**
   * タスクステップからDAGを構築
   */
  private buildDAG(steps: TaskStep[]): TaskStep[] {
    // 既にdependenciesが設定されているのでそのまま返す
    // より高度な依存関係解析が必要な場合はここで実装
    return steps;
  }
}
