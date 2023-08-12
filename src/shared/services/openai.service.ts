import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIChatCompletionReqMsg } from 'src/common/types';
import { encoding_for_model } from '@dqbd/tiktoken';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    }); // singleton
  }
  async createAIChatCompletion(
    messages: Array<AIChatCompletionReqMsg>,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const MAX_TOKENS = 16385;
    const REDUCE_TOKENS_RATIO = 0.5;
    let currentTokens = this.calculateTokensWithTiktoken(messages);
    // 토큰 수가 16385개를 초과하는 경우 마지막 메시지의 content를 줄임
    while (currentTokens > MAX_TOKENS && messages.length > 0) {
      const longestContentMessage = messages.reduce((prev, current) => {
        return prev.content.length > current.content.length ? prev : current;
      });
      // content의 길이를 50% 줄여봄. (요금때문에 30%로 함)
      longestContentMessage.content = longestContentMessage.content.substring(
        0,
        Math.floor(longestContentMessage.content.length * REDUCE_TOKENS_RATIO),
      );

      currentTokens = this.calculateTokensWithTiktoken(messages); // 다시 토큰 수 계산
    }

    if (currentTokens > MAX_TOKENS) {
      throw new InternalServerErrorException(
        '최대 토큰 수를 초과하여 줄이는 작업을 수행했음에도 불구하고, 토큰 수가 16385개를 초과합니다. 더 짧은 메시지를 입력해주세요.',
      );
    }

    const requestData: OpenAI.Chat.Completions.CompletionCreateParamsNonStreaming = {
      model: 'gpt-3.5-turbo-16k',
      messages,
    };

    const chatCompletion = await this.openai.chat.completions.create(requestData);

    return chatCompletion;
  }

  private calculateTokensWithTiktoken(messages: Array<AIChatCompletionReqMsg>): number {
    const enc = encoding_for_model('gpt-3.5-turbo');

    const roleTokens = enc.encode('role:').length;
    const contentTokens = enc.encode('content:').length;
    const etcTokens = roleTokens + contentTokens;

    // 각 메시지 토큰 수 합계 획득
    return messages.reduce((totalTokens, message) => {
      const contentTokens = enc.encode(message.content).length;
      const roleTokens = enc.encode(message.role).length;
      return totalTokens + contentTokens + roleTokens + etcTokens;
    }, 0);
  }
}
