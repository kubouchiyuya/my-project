/**
 * 完了報告システム
 *
 * テスト→報告→音声の一連の流れを自動化
 */

import { zundamonReporter, ReportData } from './zundamon-reporter.js';
import { voiceSynthesizer } from './voice-synthesizer.js';
import { autoTester, TestResult } from '../testing/auto-tester.js';
import { LarkClient } from '../lark-mcp/client.js';

export interface CompletionReportOptions {
  title: string;
  summary: string;
  details?: string[];
  nextSteps?: string[];
  suggestions?: string[];
  runTests?: boolean;
  useLark?: boolean;
  useVoice?: boolean;
  larkClient?: LarkClient;
  larkChatId?: string;
}

export class CompletionReporter {
  /**
   * 完了報告を実行
   */
  async report(options: CompletionReportOptions): Promise<void> {
    console.log('\n🎋 Miyabi 完了報告システム\n');

    let testResults: TestResult | undefined;

    // 1. テスト実行（オプション）
    if (options.runTests !== false) {
      console.log('📝 ステップ1: 自動テストを実行\n');
      testResults = await autoTester.runAllTests();

      if (!testResults.success) {
        console.log('\n⚠️  テストに失敗がありましたが、報告を続けます\n');
      }
    }

    // 2. 報告データを作成
    const reportData: ReportData = {
      title: options.title,
      status: testResults
        ? testResults.success
          ? 'success'
          : 'warning'
        : 'success',
      summary: options.summary,
      details: options.details,
      nextSteps: options.nextSteps,
      suggestions: options.suggestions,
      testResults: testResults
        ? {
            passed: testResults.passed,
            failed: testResults.failed,
            total: testResults.total,
          }
        : undefined,
    };

    // 3. テキスト報告を生成
    console.log('\n📝 ステップ2: ずんだもん形式の報告を生成\n');
    const textReport = zundamonReporter.generateReport(reportData);
    console.log(textReport);

    // 4. Larkに送信（オプション）
    if (options.useLark && options.larkClient && options.larkChatId) {
      console.log('\n📤 ステップ3: Larkに報告を送信\n');
      try {
        const larkCard = zundamonReporter.generateLarkCard(reportData);
        await options.larkClient.sendCard(options.larkChatId, larkCard);
        console.log('✅ Larkに送信しました！\n');
      } catch (error) {
        console.error('❌ Lark送信エラー:', error);
      }
    }

    // 5. 音声で報告（オプション）
    if (options.useVoice !== false) {
      console.log('\n🔊 ステップ4: 音声で報告\n');
      const voiceText = zundamonReporter.generateVoiceText(reportData);

      try {
        // まずVOICEVOXを試す
        await voiceSynthesizer.speak(voiceText);
      } catch {
        // VOICEVOXが使えない場合はmacOSのsayコマンド
        try {
          await voiceSynthesizer.speakWithSay(voiceText);
        } catch (error) {
          console.log('⚠️  音声再生できませんでした（テキストで表示済み）');
        }
      }
    }

    console.log('\n✨ 完了報告が終わったのだ！\n');
  }

  /**
   * 簡易報告（成功時）
   */
  async reportSuccess(title: string, summary: string): Promise<void> {
    await this.report({
      title,
      summary,
      runTests: true,
      useVoice: true,
      useLark: false,
    });
  }

  /**
   * エラー報告
   */
  async reportError(title: string, error: Error): Promise<void> {
    await this.report({
      title,
      summary: `エラーが起きちゃったのだ: ${error.message}`,
      details: [
        '何が起きたか確認してほしいのだ',
        'もう一度試してみるのがいいと思うのだ',
      ],
      runTests: false,
      useVoice: true,
      useLark: false,
    });
  }
}

// シングルトンインスタンス
export const completionReporter = new CompletionReporter();
