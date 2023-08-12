export interface AIChatCompletionReqMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
