import { apiClient } from './client';

export interface AssistantMessage {
  id?: number | string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ConversationResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: AssistantMessage[];
}

export interface ChatResponse {
  conversation_id: string;
  message_id: number;
  mode: 'live' | 'mock';
  content: string;
  tools: Array<{
    name: string;
    arguments: Record<string, unknown>;
    ok: boolean;
    error: string | null;
  }>;
}

export const assistantApi = {
  /**
   * Crea una nueva conversación en el asistente
   */
  createConversation: async (title?: string): Promise<ConversationResponse> => {
    const res = await apiClient.post('/assistant/conversations', { title });
    return res.data.data.conversation;
  },

  /**
   * Envía un mensaje a la conversación
   */
  sendMessage: async (conversationId: string, message: string): Promise<ChatResponse> => {
    const res = await apiClient.post('/assistant/chat', {
      conversation_id: conversationId,
      message,
    });
    return res.data.data;
  },

  /**
   * Obtiene una conversación con su historial de mensajes
   */
  getConversation: async (conversationId: string): Promise<ConversationResponse> => {
    const res = await apiClient.get(`/assistant/conversations/${conversationId}`);
    return res.data.data.conversation;
  },
};
