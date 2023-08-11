export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
