import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatMessage } from '@/components/chat';

export interface SuggestedAction {
  id: string;
  label: string;
  prompt: string;
}

interface ChatError {
  message: string;
  code?: string;
}

interface ChatState {
  // Data
  messages: ChatMessage[];
  suggestedActions: SuggestedAction[];

  // UI State
  isLoading: boolean;
  error: ChatError | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ChatError | null) => void;
  setSuggestedActions: (actions: SuggestedAction[]) => void;
  clearMessages: () => void;
  retryLastMessage: () => void;
  sendMessage: (
    userMessage: string,
    userId: string,
    month: number,
    year: number,
    transactions: Array<{ amount: number; type: string; category: string; date: string }>,
    conversationHistory: ChatMessage[]
  ) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        suggestedActions: [],
        isLoading: false,
        error: null,

        addMessage: (message: ChatMessage) =>
          set(
            (state) => ({
              messages: [...state.messages, message],
            }),
            false,
            'addMessage'
          ),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setError: (error: ChatError | null) =>
          set({ error }, false, 'setError'),

        setSuggestedActions: (actions: SuggestedAction[]) =>
          set({ suggestedActions: actions }, false, 'setSuggestedActions'),

        clearMessages: () =>
          set(
            {
              messages: [],
              suggestedActions: [],
              error: null,
              isLoading: false,
            },
            false,
            'clearMessages'
          ),

        retryLastMessage: () => {
          const state = get();
          const lastMessage = state.messages[state.messages.length - 1];

          if (lastMessage && lastMessage.sender === 'user') {
            set(
              { error: null, isLoading: true },
              false,
              'retryLastMessage'
            );
          }
        },

        sendMessage: async (userMessage, userId, month, year, transactions, conversationHistory) => {
          set({ isLoading: true, error: null }, false, 'sendMessage');

          const userMsg: ChatMessage = {
            id: Date.now().toString(),
            content: userMessage,
            sender: 'user',
            timestamp: new Date(),
          };
          get().addMessage(userMsg);

          try {
            const response = await fetch('/api/ask-assistant', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                question: userMessage,
                month,
                year,
                conversationHistory,
                transactions,
              }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            const assistantMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              content: data.response || data.answer || 'Maaf, terjadi kesalahan memproses pertanyaan Anda.',
              sender: 'assistant',
              timestamp: new Date(),
            };
            get().addMessage(assistantMsg);

            // Extract suggested actions from response if available
            if (data.suggested_actions && Array.isArray(data.suggested_actions)) {
              const actions: SuggestedAction[] = data.suggested_actions.map((action: any, idx: number) => ({
                id: `action-${idx}`,
                label: action.label || action.text || 'Action',
                prompt: action.prompt || '',
              }));
              set({ suggestedActions: actions }, false, 'setSuggestedActions');
            }
          } catch (err) {
            set(
              {
                error: {
                  message: 'Gagal mengirim pesan. Coba lagi?',
                  code: 'SEND_ERROR',
                },
              },
              false,
              'setError'
            );
            console.error('Chat error:', err);
          } finally {
            set({ isLoading: false }, false, 'sendMessage:complete');
          }
        },
      }),
      {
        name: 'gajian-aman-chat-store',
        partialize: (state) => ({
          messages: state.messages.slice(-10),
          suggestedActions: state.suggestedActions,
        }),
        // JSON.parse turns Date → string; revive them so ChatBubble can call .toLocaleTimeString()
        onRehydrateStorage: () => (state) => {
          if (state?.messages) {
            state.messages = state.messages.map((m) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            }));
          }
        },
      }
    )
  )
);

export const useChatMessages = () =>
  useChatStore((state) => state.messages);

export const useChatLoading = () =>
  useChatStore((state) => state.isLoading);

export const useChatError = () =>
  useChatStore((state) => state.error);

export const useChatSuggestedActions = () =>
  useChatStore((state) => state.suggestedActions);

export const useChatActions = () =>
  useChatStore((state) => ({
    addMessage: state.addMessage,
    setLoading: state.setLoading,
    setError: state.setError,
    setSuggestedActions: state.setSuggestedActions,
    clearMessages: state.clearMessages,
    retryLastMessage: state.retryLastMessage,
    sendMessage: state.sendMessage,
  }));
