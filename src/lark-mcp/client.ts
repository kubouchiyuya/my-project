/**
 * Lark API Client
 *
 * Lark（Feishu）のAPIとやり取りするクライアント
 */

export interface LarkConfig {
  appId: string;
  appSecret: string;
  baseUrl?: string;
}

export interface SendMessageParams {
  receive_id: string;
  msg_type: 'text' | 'post' | 'interactive';
  content: string;
}

export interface CreateDocumentParams {
  folder_token?: string;
  title: string;
  content: string;
}

interface LarkAPIResponse {
  code: number;
  msg?: string;
  data?: any;
  tenant_access_token?: string;
  expire?: number;
}

export class LarkClient {
  private config: LarkConfig;
  private accessToken: string = '';
  private tokenExpireTime: number = 0;

  constructor(config: LarkConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.feishu.cn/open-apis',
    };
  }

  /**
   * アクセストークンを取得（自動更新）
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // トークンが有効期限内であれば再利用
    if (this.accessToken && now < this.tokenExpireTime) {
      return this.accessToken;
    }

    // 新しいトークンを取得
    const response = await fetch(
      `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      }
    );

    const data = (await response.json()) as LarkAPIResponse;

    if (data.code !== 0) {
      throw new Error(`Failed to get access token: ${data.msg || 'Unknown error'}`);
    }

    if (!data.tenant_access_token) {
      throw new Error('No access token in response');
    }

    this.accessToken = data.tenant_access_token;
    // 有効期限の5分前に更新するように設定
    this.tokenExpireTime = now + ((data.expire || 7200) - 300) * 1000;

    return this.accessToken;
  }

  /**
   * メッセージを送信
   */
  async sendMessage(params: SendMessageParams): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/im/v1/messages?receive_id_type=chat_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      }
    );

    const data = (await response.json()) as LarkAPIResponse;

    if (data.code !== 0) {
      throw new Error(`Failed to send message: ${data.msg || 'Unknown error'}`);
    }

    return data.data;
  }

  /**
   * ドキュメントを作成
   */
  async createDocument(params: CreateDocumentParams): Promise<any> {
    const token = await this.getAccessToken();

    // まずドキュメントを作成
    const createResponse = await fetch(
      `${this.config.baseUrl}/docx/v1/documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          folder_token: params.folder_token,
          title: params.title,
        }),
      }
    );

    const createData = (await createResponse.json()) as LarkAPIResponse;

    if (createData.code !== 0) {
      throw new Error(`Failed to create document: ${createData.msg || 'Unknown error'}`);
    }

    const documentId = createData.data?.document?.document_id;
    if (!documentId) {
      throw new Error('No document ID in response');
    }

    // Markdown形式のコンテンツを追加
    // 注: 実際にはMarkdownをLarkのBlock形式に変換する必要があります
    const blocks = this.markdownToLarkBlocks(params.content);

    await fetch(
      `${this.config.baseUrl}/docx/v1/documents/${documentId}/blocks/${createData.data?.document?.body?.block_id}/children`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          children: blocks,
        }),
      }
    );

    return {
      document_id: documentId,
      url: `https://feishu.cn/docx/${documentId}`,
    };
  }

  /**
   * インタラクティブカードを送信
   */
  async sendCard(chatId: string, card: any): Promise<any> {
    return this.sendMessage({
      receive_id: chatId,
      msg_type: 'interactive',
      content: JSON.stringify(card),
    });
  }

  /**
   * タスク進捗カードを送信
   */
  async sendProgressCard(
    chatId: string,
    taskName: string,
    progress: number,
    details: string
  ): Promise<any> {
    const card = {
      config: {
        wide_screen_mode: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: `🎋 ${taskName}`,
        },
        template: progress === 100 ? 'green' : 'blue',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**進捗状況:** ${progress}%`,
          },
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**詳細:**\n${details}`,
          },
        },
        {
          tag: 'progress_bar',
          percent: progress / 100,
        },
      ],
    };

    return this.sendCard(chatId, card);
  }

  /**
   * MarkdownをLarkのBlock形式に変換（簡易版）
   */
  private markdownToLarkBlocks(markdown: string): any[] {
    const lines = markdown.split('\n');
    const blocks: any[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          block_type: 1, // 見出し1
          text: {
            text: line.substring(2),
          },
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          block_type: 2, // 見出し2
          text: {
            text: line.substring(3),
          },
        });
      } else if (line.trim()) {
        blocks.push({
          block_type: 3, // テキスト
          text: {
            text: line,
          },
        });
      }
    }

    return blocks;
  }

  /**
   * Webhookイベントを検証
   */
  verifyWebhook(timestamp: string, nonce: string, signature: string): boolean {
    // TODO: 実装する
    // const crypto = require('crypto');
    // const data = timestamp + nonce + this.config.appSecret;
    // const hash = crypto.createHash('sha256').update(data).digest('hex');
    // return hash === signature;
    return true; // 仮実装
  }
}
