/**
 * 自動テストシステム
 *
 * 完了報告前に必ずテストを実行
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  duration: number;
  errors: string[];
  success: boolean;
}

export class AutoTester {
  /**
   * すべてのテストを実行
   */
  async runAllTests(): Promise<TestResult> {
    console.log('🧪 自動テストを開始します...\n');

    const results: TestResult = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
      errors: [],
      success: true,
    };

    const startTime = Date.now();

    // 1. 型チェック
    console.log('1️⃣ TypeScript型チェック...');
    const typeCheckResult = await this.runTypeCheck();
    results.total++;
    if (typeCheckResult.success) {
      results.passed++;
      console.log('   ✅ 型チェック: 成功');
    } else {
      results.failed++;
      results.errors.push(`型チェックエラー: ${typeCheckResult.error}`);
      console.log(`   ❌ 型チェック: 失敗\n   ${typeCheckResult.error}`);
    }

    // 2. ビルドテスト
    console.log('\n2️⃣ ビルドテスト...');
    const buildResult = await this.runBuild();
    results.total++;
    if (buildResult.success) {
      results.passed++;
      console.log('   ✅ ビルド: 成功');
    } else {
      results.failed++;
      results.errors.push(`ビルドエラー: ${buildResult.error}`);
      console.log(`   ❌ ビルド: 失敗\n   ${buildResult.error}`);
    }

    // 3. CLIコマンドテスト
    console.log('\n3️⃣ CLIコマンドテスト...');
    const cliResult = await this.runCLITest();
    results.total++;
    if (cliResult.success) {
      results.passed++;
      console.log('   ✅ CLIコマンド: 正常動作');
    } else {
      results.failed++;
      results.errors.push(`CLIエラー: ${cliResult.error}`);
      console.log(`   ❌ CLIコマンド: 失敗\n   ${cliResult.error}`);
    }

    // 4. インポートテスト
    console.log('\n4️⃣ モジュールインポートテスト...');
    const importResult = await this.runImportTest();
    results.total++;
    if (importResult.success) {
      results.passed++;
      console.log('   ✅ インポート: 成功');
    } else {
      results.failed++;
      results.errors.push(`インポートエラー: ${importResult.error}`);
      console.log(`   ❌ インポート: 失敗\n   ${importResult.error}`);
    }

    results.duration = Date.now() - startTime;
    results.success = results.failed === 0;

    console.log('\n' + '='.repeat(50));
    console.log(`🧪 テスト完了: ${results.passed}/${results.total} 成功`);
    console.log(`⏱️  実行時間: ${(results.duration / 1000).toFixed(2)}秒`);
    console.log('='.repeat(50) + '\n');

    return results;
  }

  /**
   * 型チェックを実行
   */
  private async runTypeCheck(): Promise<{ success: boolean; error?: string }> {
    try {
      await execAsync('npm run typecheck', {
        cwd: process.cwd(),
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.stdout || error.stderr || error.message,
      };
    }
  }

  /**
   * ビルドを実行
   */
  private async runBuild(): Promise<{ success: boolean; error?: string }> {
    try {
      await execAsync('npm run build', {
        cwd: process.cwd(),
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.stdout || error.stderr || error.message,
      };
    }
  }

  /**
   * CLIコマンドをテスト
   */
  private async runCLITest(): Promise<{ success: boolean; error?: string }> {
    try {
      const { stdout } = await execAsync('node dist/cli.js', {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PATH: `${process.env.HOME}/.npm-global/bin:${process.env.PATH}`,
        },
      });

      if (stdout.includes('Miyabi') && stdout.includes('AI駆動')) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'CLIの出力が期待と異なります',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * インポートテスト
   */
  private async runImportTest(): Promise<{ success: boolean; error?: string }> {
    try {
      // 主要なモジュールがインポート可能か確認
      await import('../agents/executor.js');
      await import('../lark-mcp/client.js');
      await import('../reporter/zundamon-reporter.js');

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 特定の機能をテスト
   */
  async testFeature(featureName: string, testFn: () => Promise<boolean>): Promise<boolean> {
    console.log(`🧪 ${featureName} をテスト中...`);

    try {
      const result = await testFn();
      if (result) {
        console.log(`   ✅ ${featureName}: 成功`);
      } else {
        console.log(`   ❌ ${featureName}: 失敗`);
      }
      return result;
    } catch (error) {
      console.log(`   ❌ ${featureName}: エラー - ${error}`);
      return false;
    }
  }
}

// シングルトンインスタンス
export const autoTester = new AutoTester();
