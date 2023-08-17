import { BadRequestException, Injectable, MessageEvent } from '@nestjs/common';
import { OpenAI } from 'openai';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk, ChatCompletionMessage, ChatCompletion } from 'openai/resources/chat';
import { ConfigService } from '@nestjs/config';
import { encoding_for_model } from '@dqbd/tiktoken';
import { TiktokenModel } from '@dqbd/tiktoken';
import { Response } from 'express';
import { Observable, Subscriber } from 'rxjs';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  private readonly MAX_TOKENS = 16385;
  private readonly SUB_MAX_TOKENS = 4097;
  private readonly REDUCE_TOKENS_RATIO = 0.5;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    }); // singleton
  }

  async createAIChatCompletion(promptMessages: Array<ChatCompletionMessage>): Promise<ChatCompletion> {
    const requestData = this.generateOpenAIChatRequestData(promptMessages);
    const chatCompletion = await this.openai.chat.completions.create(requestData);

    return chatCompletion;
  }

  async createAIStramChatCompletion(
    promptMessages: Array<ChatCompletionMessage>,
  ): Promise<Stream<ChatCompletionChunk>> {
    const requestData = this.generateOpenAIChatRequestData(promptMessages);
    const stream: Stream<ChatCompletionChunk> = await this.openai.chat.completions.create({
      ...requestData,
      stream: true,
    });

    return stream;
  }

  async sendSSEWithOpenAIStream(opanAIStream: Stream<ChatCompletionChunk>): Promise<Observable<MessageEvent>> {
    return new Observable((subscriber: Subscriber<MessageEvent>) => {
      this.sendStreamToObservableData(opanAIStream, subscriber);
    });
  }

  private async sendStreamToObservableData(
    opanAIStream: Stream<ChatCompletionChunk>,
    subscriber: Subscriber<MessageEvent>,
  ) {
    for await (const part of opanAIStream) {
      const content: string = part.choices[0]?.delta?.content;
      if (content) {
        subscriber.next({ data: content, retry: 1000 });
      }
    }

    subscriber.next({
      type: 'close',
      data: 'true',
    });

    subscriber.complete();
  }

  // unused(legacy) code
  async sendSSEResponseWithOpenAIStream(res: Response, opanAIStream: Stream<ChatCompletionChunk>): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // SSE를 위해 지정된 헤더를 클라이언트에게 보냄

    res.write('retry: 1000\n\n'); // 클라에서 연결이 끊기면 1초 간격으로 재연결을 시도하라는 의미

    for await (const part of opanAIStream) {
      const content: string = part.choices[0].delta.content;
      content && res.write(`data: ${content}\n\n`);
    }

    res.write(`event: close\n`);
    res.write(`data: true\n\n`);

    res.end();
  }

  private generateOpenAIChatRequestData(promptMessages: Array<ChatCompletionMessage>): {
    model: TiktokenModel | 'gpt-3.5-turbo-16k';
    messages: ChatCompletionMessage[];
  } {
    const { promptMessages: possiblePrompt, currentTokenCount } = this.convertChatPromptToPossible(promptMessages);

    const gptModel: TiktokenModel | 'gpt-3.5-turbo-16k' =
      currentTokenCount > this.SUB_MAX_TOKENS ? 'gpt-3.5-turbo-16k' : 'gpt-3.5-turbo';

    return {
      model: gptModel,
      messages: possiblePrompt,
    };
  }

  private convertChatPromptToPossible(promptMessages: Array<ChatCompletionMessage>): {
    promptMessages: Array<ChatCompletionMessage>;
    currentTokenCount: number;
  } {
    let currentTokenCount = this.calculateTokensWithTiktoken(promptMessages);

    // 토큰 수가 16385개를 초과하는 경우 가장 긴 메시지의 content를 줄임
    while (currentTokenCount > this.MAX_TOKENS && promptMessages.length > 0) {
      const longestContentMessage = promptMessages.reduce((prev, current) => {
        return prev.content.length > current.content.length ? prev : current;
      });
      // content의 길이를 50% 줄여봄. (요금때문에 50% 단위로 줄여봄)
      longestContentMessage.content = longestContentMessage.content.substring(
        0,
        Math.floor(longestContentMessage.content.length * this.REDUCE_TOKENS_RATIO),
      );

      currentTokenCount = this.calculateTokensWithTiktoken(promptMessages); // 다시 토큰 수 계산
    }

    if (currentTokenCount > this.MAX_TOKENS) {
      throw new BadRequestException(
        '최대 토큰 수를 초과하여 줄이는 작업을 수행했음에도 불구하고, 토큰 수가 기준을 초과합니다. 더 짧은 메시지를 입력해주세요.',
      );
    }

    return {
      promptMessages,
      currentTokenCount,
    };
  }

  private calculateTokensWithTiktoken(promptMessages: Array<ChatCompletionMessage>): number {
    const gptModel: TiktokenModel = 'gpt-3.5-turbo';
    const enc = encoding_for_model(gptModel);

    const roleTokens = enc.encode('role:').length;
    const contentTokens = enc.encode('content:').length;
    const etcTokens = roleTokens + contentTokens;

    // 각 메시지 토큰 수 합계 획득
    return promptMessages.reduce((totalTokens, promptMessages) => {
      const contentTokens = enc.encode(promptMessages.content).length;
      const roleTokens = enc.encode(promptMessages.role).length;
      return totalTokens + contentTokens + roleTokens + etcTokens;
    }, 0);
  }
}
