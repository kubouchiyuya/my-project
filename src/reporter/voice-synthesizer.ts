/**
 * 音声合成システム（VOICEVOX連携）
 *
 * ずんだもんの声で報告を読み上げ
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

export class VoiceSynthesizer {
  private voicevoxUrl: string;
  private speaker: number; // 1: ずんだもん（ノーマル）

  constructor(voicevoxUrl: string = 'http://localhost:50021') {
    this.voicevoxUrl = voicevoxUrl;
    this.speaker = 1; // ずんだもん
  }

  /**
   * テキストを音声に変換
   */
  async synthesize(text: string, outputPath?: string): Promise<Buffer | string> {
    try {
      // VOICEVOXが起動しているか確認
      const isRunning = await this.checkVoicevoxRunning();

      if (!isRunning) {
        console.log('⚠️  VOICEVOX が起動していません。テキストのみ表示します');
        return text;
      }

      // 音声クエリを作成
      const queryResponse = await fetch(
        `${this.voicevoxUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${this.speaker}`,
        { method: 'POST' }
      );

      if (!queryResponse.ok) {
        throw new Error('音声クエリの作成に失敗');
      }

      const audioQuery = await queryResponse.json();

      // 音声を合成
      const synthesisResponse = await fetch(
        `${this.voicevoxUrl}/synthesis?speaker=${this.speaker}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(audioQuery),
        }
      );

      if (!synthesisResponse.ok) {
        throw new Error('音声合成に失敗');
      }

      const audioBuffer = Buffer.from(await synthesisResponse.arrayBuffer());

      // ファイルに保存する場合
      if (outputPath) {
        await writeFile(outputPath, audioBuffer);
        return outputPath;
      }

      return audioBuffer;
    } catch (error) {
      console.error('音声合成エラー:', error);
      return text; // エラー時はテキストを返す
    }
  }

  /**
   * 音声を再生
   */
  async speak(text: string): Promise<void> {
    try {
      const tempPath = join('/tmp', `miyabi-voice-${Date.now()}.wav`);
      const result = await this.synthesize(text, tempPath);

      if (typeof result === 'string' && result.endsWith('.wav')) {
        // macOSのafplayで再生
        await execAsync(`afplay "${result}"`);

        // 再生後にファイルを削除
        await execAsync(`rm "${result}"`);

        console.log('🔊 音声で報告しました！');
      } else {
        // VOICEVOXが使えない場合はテキスト表示
        console.log('\n📢 音声報告（テキスト版）:');
        console.log(result);
      }
    } catch (error) {
      console.error('音声再生エラー:', error);
      console.log('\n📢 テキスト報告:', text);
    }
  }

  /**
   * VOICEVOXが起動しているか確認
   */
  private async checkVoicevoxRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.voicevoxUrl}/version`, {
        signal: AbortSignal.timeout(1000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 簡易音声再生（say コマンド使用）
   */
  async speakWithSay(text: string): Promise<void> {
    try {
      // macOS の say コマンドを使用（日本語対応）
      await execAsync(`say -v Kyoko "${text}"`);
      console.log('🔊 音声で報告しました！（say コマンド）');
    } catch (error) {
      console.error('say コマンドエラー:', error);
      console.log('\n📢 テキスト報告:', text);
    }
  }
}

// シングルトンインスタンス
export const voiceSynthesizer = new VoiceSynthesizer();
