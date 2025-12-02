/**
 * Lark MCP Server
 *
 * Super Whisper → Lark → Miyabi の連携を実現するMCPサーバー
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { LarkClient } from './client.js';

export class LarkMCPServer {
  private server: Server;
  private larkClient: LarkClient;

  constructor() {
    this.server = new Server(
      {
        name: 'miyabi-lark-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.larkClient = new LarkClient({
      appId: process.env.LARK_APP_ID!,
      appSecret: process.env.LARK_APP_SECRET!,
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    // ツール一覧の提供
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'lark_send_message',
          description: 'Larkチャットにメッセージを送信',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: 'チャットID（グループIDまたはユーザーID）',
              },
              message: {
                type: 'string',
                description: '送信するメッセージ内容',
              },
              msg_type: {
                type: 'string',
                enum: ['text', 'post', 'interactive'],
                description: 'メッセージタイプ',
                default: 'text',
              },
            },
            required: ['chat_id', 'message'],
          },
        },
        {
          name: 'lark_create_document',
          description: 'Larkドキュメントを作成',
          inputSchema: {
            type: 'object',
            properties: {
              folder_token: {
                type: 'string',
                description: 'フォルダートークン',
              },
              title: {
                type: 'string',
                description: 'ドキュメントタイトル',
              },
              content: {
                type: 'string',
                description: 'ドキュメント内容（Markdown）',
              },
            },
            required: ['title', 'content'],
          },
        },
        {
          name: 'lark_send_task_report',
          description: 'タスク実行レポートをLarkに送信',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: 'レポート送信先チャットID',
              },
              task_name: {
                type: 'string',
                description: 'タスク名',
              },
              status: {
                type: 'string',
                enum: ['started', 'in_progress', 'completed', 'failed'],
                description: 'タスクステータス',
              },
              details: {
                type: 'object',
                description: 'タスク詳細情報',
              },
            },
            required: ['chat_id', 'task_name', 'status'],
          },
        },
        {
          name: 'lark_trigger_miyabi_agent',
          description: 'Larkからの指示を受けてMiyabiエージェントを起動',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: {
                type: 'string',
                description: 'ユーザーからの指示内容（音声テキスト化済み）',
              },
              chat_id: {
                type: 'string',
                description: '返信先チャットID',
              },
              agent_type: {
                type: 'string',
                description: '起動するエージェントタイプ',
              },
            },
            required: ['instruction', 'chat_id'],
          },
        },
      ],
    }));

    // ツール実行ハンドラー
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'lark_send_message':
            return await this.handleSendMessage(args);

          case 'lark_create_document':
            return await this.handleCreateDocument(args);

          case 'lark_send_task_report':
            return await this.handleSendTaskReport(args);

          case 'lark_trigger_miyabi_agent':
            return await this.handleTriggerMiyabiAgent(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleSendMessage(args: any) {
    const { chat_id, message, msg_type = 'text' } = args;

    const result = await this.larkClient.sendMessage({
      receive_id: chat_id,
      msg_type,
      content: JSON.stringify({ text: message }),
    });

    return {
      content: [
        {
          type: 'text',
          text: `メッセージを送信しました: ${JSON.stringify(result)}`,
        },
      ],
    };
  }

  private async handleCreateDocument(args: any) {
    const { folder_token, title, content } = args;

    const result = await this.larkClient.createDocument({
      folder_token,
      title,
      content,
    });

    return {
      content: [
        {
          type: 'text',
          text: `ドキュメントを作成しました: ${result.url}`,
        },
      ],
    };
  }

  private async handleSendTaskReport(args: any) {
    const { chat_id, task_name, status, details = {} } = args;

    const statusEmoji = {
      started: '🚀',
      in_progress: '⚙️',
      completed: '✅',
      failed: '❌',
    };

    const message = this.formatTaskReport(
      task_name,
      status,
      details,
      statusEmoji[status as keyof typeof statusEmoji] || '📋'
    );

    await this.larkClient.sendMessage({
      receive_id: chat_id,
      msg_type: 'post',
      content: JSON.stringify(message),
    });

    return {
      content: [
        {
          type: 'text',
          text: `タスクレポートを送信しました: ${task_name} - ${status}`,
        },
      ],
    };
  }

  private async handleTriggerMiyabiAgent(args: any) {
    const { instruction, chat_id, agent_type } = args;

    // Miyabiエージェントを起動する処理
    // この部分は別ファイルで実装されたエージェント起動ロジックを呼び出す
    const { executeMiyabiTask } = await import('../agents/executor.js');

    // まず、タスク開始を通知
    await this.larkClient.sendMessage({
      receive_id: chat_id,
      msg_type: 'text',
      content: JSON.stringify({
        text: `🎋 Miyabiタスクを開始します\n指示: ${instruction}`,
      }),
    });

    // エージェントを実行（非同期）
    executeMiyabiTask({
      instruction,
      chatId: chat_id,
      agentType: agent_type,
      larkClient: this.larkClient,
    }).catch((error) => {
      console.error('Miyabiタスク実行エラー:', error);
    });

    return {
      content: [
        {
          type: 'text',
          text: `Miyabiエージェントを起動しました。実行状況はLarkで報告されます。`,
        },
      ],
    };
  }

  private formatTaskReport(
    taskName: string,
    status: string,
    details: any,
    emoji: string
  ) {
    const statusText = {
      started: '開始',
      in_progress: '実行中',
      completed: '完了',
      failed: '失敗',
    };

    return {
      ja_jp: {
        title: `${emoji} ${taskName}`,
        content: [
          [
            {
              tag: 'text',
              text: `ステータス: ${statusText[status as keyof typeof statusText] || status}\n`,
            },
          ],
          details.message
            ? [
                {
                  tag: 'text',
                  text: `詳細: ${details.message}\n`,
                },
              ]
            : [],
          details.progress
            ? [
                {
                  tag: 'text',
                  text: `進捗: ${details.progress}%\n`,
                },
              ]
            : [],
          details.nextAction
            ? [
                {
                  tag: 'text',
                  text: `次のアクション: ${details.nextAction}`,
                },
              ]
            : [],
        ].filter((item) => item.length > 0),
      },
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Lark MCP Server started');
  }
}

// サーバー起動
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new LarkMCPServer();
  server.start().catch(console.error);
}
