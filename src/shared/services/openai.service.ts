import { Injectable } from '@nestjs/common';
import {
  Configuration,
  OpenAIApi,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ChatCompletionRequestMessage,
} from 'openai';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'openai/node_modules/axios';

@Injectable()
export class OpenaiService {
  private openai: OpenAIApi;

  constructor(private readonly configService: ConfigService) {
    const configuration = new Configuration({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.openai = new OpenAIApi(configuration); // singleton
  }

  // TODO: gpt token 제한으로 인해, 요청 크기가 커지면 에러 발생함.
  // TODO: 이를 해결하기 위해, token 계산 후 요청을 나눠서 보내는 방법 등을 고려해야 할 것 같음.
  async createAIChatCompletion(
    messages: Array<ChatCompletionRequestMessage>,
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    const requestData: CreateChatCompletionRequest = {
      model: 'gpt-3.5-turbo',
      messages,
    };
    const completion = await this.openai.createChatCompletion(requestData);

    return completion;
  }
}
