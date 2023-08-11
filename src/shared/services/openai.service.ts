import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    }); // singleton
  }

  // TODO: 현재 사용하는 gpt 모델의 maximun context length 제한이 16385 token이라서, 요청 크기가 커지면 에러 발생함.
  // TODO: 이를 해결하기 위해, token 계산 후 요청을 나눠서 보내는 방법 등을 고려해야 할 것으로 보임.
  async createAIChatCompletion(messages): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const requestData = {
      model: 'gpt-3.5-turbo-16k-0613',
      messages,
    };
    const chatCompletion = await this.openai.chat.completions.create(requestData);

    return chatCompletion;
  }
}
