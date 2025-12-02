/**
 * ずんだもん形式レポーター
 *
 * 完了報告を小学生でもわかる言葉で、ずんだもん形式で報告
 */

export interface ReportData {
  title: string;
  status: 'success' | 'error' | 'warning';
  summary: string;
  details?: string[];
  nextSteps?: string[];
  suggestions?: string[];
  testResults?: {
    passed: number;
    failed: number;
    total: number;
  };
}

export class ZundamonReporter {
  /**
   * 完了報告を生成（ずんだもん形式）
   */
  generateReport(data: ReportData): string {
    const emoji = this.getEmoji(data.status);
    const greeting = this.getGreeting(data.status);
    const closing = this.getClosing(data.status);

    let report = `
${emoji}============================================${emoji}
${greeting}
============================================

📋 **やったこと**: ${data.title}

${this.formatSummary(data.summary)}
`;

    // 詳細情報
    if (data.details && data.details.length > 0) {
      report += `\n📝 **詳しく説明するのだ！**\n`;
      data.details.forEach((detail, i) => {
        report += `   ${i + 1}. ${detail}\n`;
      });
    }

    // テスト結果
    if (data.testResults) {
      report += `\n🧪 **テスト結果なのだ！**\n`;
      report += `   全部で ${data.testResults.total} 個のテストをしたのだ\n`;
      report += `   ✅ 成功: ${data.testResults.passed} 個\n`;
      if (data.testResults.failed > 0) {
        report += `   ❌ 失敗: ${data.testResults.failed} 個\n`;
      } else {
        report += `   🎉 全部成功したのだ！すごいのだ！\n`;
      }
    }

    // 次のステップ
    if (data.nextSteps && data.nextSteps.length > 0) {
      report += `\n🎯 **次にやること**\n`;
      data.nextSteps.forEach((step, i) => {
        report += `   ${i + 1}. ${step}\n`;
      });
    }

    // 追加提案
    if (data.suggestions && data.suggestions.length > 0) {
      report += `\n💡 **もっと良くする方法があるのだ！**\n`;
      data.suggestions.forEach((suggestion, i) => {
        report += `   ${i + 1}. ${suggestion}\n`;
      });
    }

    report += `\n${closing}\n`;
    report += `============================================\n`;

    return report;
  }

  /**
   * 絵文字を取得
   */
  private getEmoji(status: string): string {
    switch (status) {
      case 'success':
        return '🎉';
      case 'error':
        return '😢';
      case 'warning':
        return '⚠️';
      default:
        return '📢';
    }
  }

  /**
   * 挨拶文を取得
   */
  private getGreeting(status: string): string {
    switch (status) {
      case 'success':
        return '完了したのだ！ すごく頑張ったのだ！';
      case 'error':
        return 'うーん、ちょっと問題があったのだ...';
      case 'warning':
        return '一応できたけど、気をつけてほしいことがあるのだ';
      default:
        return '報告するのだ！';
    }
  }

  /**
   * 締めの言葉を取得
   */
  private getClosing(status: string): string {
    switch (status) {
      case 'success':
        return '🎋 Miyabiは今日も元気に働いたのだ！ またお願いするのだ！';
      case 'error':
        return '次は頑張るのだ！ もう一度やってみるのだ！';
      case 'warning':
        return 'とりあえず動くけど、後で直した方がいいのだ！';
      default:
        return 'よろしくなのだ！';
    }
  }

  /**
   * サマリーをフォーマット
   */
  private formatSummary(summary: string): string {
    // 小学生でもわかる言葉に変換
    const simplifiedSummary = summary
      .replace(/実装/g, '作った')
      .replace(/構築/g, '組み立てた')
      .replace(/統合/g, 'つなげた')
      .replace(/実行/g, '動かした')
      .replace(/完了/g, '終わった')
      .replace(/成功/g, 'うまくいった')
      .replace(/失敗/g, 'うまくいかなかった')
      .replace(/エラー/g, '問題');

    return `💬 ${simplifiedSummary}のだ！`;
  }

  /**
   * 音声テキストを生成（VOICEVOX用）
   */
  generateVoiceText(data: ReportData): string {
    const status = data.status === 'success' ? '完了した' : '問題があった';

    let text = `${data.title}が${status}のだ。`;
    text += this.formatSummary(data.summary);

    if (data.testResults && data.testResults.failed === 0) {
      text += 'テストも全部うまくいったのだ！';
    }

    return text;
  }

  /**
   * Lark用のリッチフォーマット
   */
  generateLarkCard(data: ReportData): any {
    const color = data.status === 'success' ? 'green' : data.status === 'error' ? 'red' : 'orange';

    return {
      config: {
        wide_screen_mode: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: `🎋 ${data.title}`,
        },
        template: color,
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**${this.getGreeting(data.status)}**\n\n${this.formatSummary(data.summary)}`,
          },
        },
        ...(data.details ? [{
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**詳細:**\n${data.details.map((d, i) => `${i + 1}. ${d}`).join('\n')}`,
          },
        }] : []),
        ...(data.testResults ? [{
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**テスト結果:**\n✅ 成功: ${data.testResults.passed}/${data.testResults.total}`,
          },
        }] : []),
        ...(data.suggestions && data.suggestions.length > 0 ? [{
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**💡 改善提案:**\n${data.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          },
        }] : []),
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: this.getClosing(data.status),
            },
          ],
        },
      ],
    };
  }
}

// シングルトンインスタンス
export const zundamonReporter = new ZundamonReporter();
