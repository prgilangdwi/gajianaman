import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatMessage } from '@/components/chat';

interface ChatError {
  message: string;
  code?: string;
}

interface ChatState {
  // Data
  messages: ChatMessage[];

  // UI State
  isLoading: boolean;
  error: ChatError | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ChatError | null) => void;
  clearMessages: () => void;
  retryLastMessage: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools((set, get) => ({
    messages: [],
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

    clearMessages: () =>
      set(
        {
          messages: [],
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
        // Remove error state and retry
        set(
          { error: null, isLoading: true },
          false,
          'retryLastMessage'
        );
      }
    },
  }))
);

// Selector for shallow comparison of messages
export const useChatMessages = () =>
  useChatStore((state) => state.messages);

export const useChatLoading = () =>
  useChatStore((state) => state.isLoading);

export const useChatError = () =>
  useChatStore((state) => state.error);

export const useChatActions = () =>
  useChatStore((state) => ({
    addMessage: state.addMessage,
    setLoading: state.setLoading,
    setError: state.setError,
    clearMessages: state.clearMessages,
    retryLastMessage: state.retryLastMessage,
  }));
