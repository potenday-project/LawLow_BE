import { BadRequestException, Injectable } from '@nestjs/common';
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

  // TODO: 현재 사용하는 gpt 모델의 maximun context length 제한이 16385 token이라서, 요청 크기가 커지면 에러 발생함.
  // TODO: 이를 해결하기 위해, token 계산 후 요청을 나눠서 보내는 방법 등을 고려해볼 필요 있음.
  async createAIChatCompletion(
    messages: Array<AIChatCompletionReqMsg>,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const tokens = this.calculateTokensWithTiktoken(messages);
    if (tokens > 16385) throw new BadRequestException('요청한 메시지의 길이가 너무 깁니다. 메시지를 줄여주세요.');

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
