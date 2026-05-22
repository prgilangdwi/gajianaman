import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { ChatBubble, ChatInput, TypingIndicator } from '@/components/chat';
import { SuggestedActions } from '@/components/features/ai/SuggestedActions';
import { useChatStore, useChatActions, useChatError, useChatSuggestedActions } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

export default function Asisten() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { transactions = [] } = useTransactions(month, year);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state hooks
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const error = useChatError();
  const suggestedActions = useChatSuggestedActions();
  const { sendMessage } = useChatActions();

  // Auto-scroll to bottom when new messages arrive (Principle 04: Progressive Disclosure)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !user) return;

    await sendMessage(
      userMessage,
      user.userId,
      month,
      year,
      transactions.map((t) => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      })),
      messages
    );
  };

  const handleSuggestedActionClick = async (prompt: string) => {
    await handleSendMessage(prompt);
  };

  const quickPrompts = [
    'Ringkasan bulan ini',
    'Kategori terboros',
    'Tips hemat bulan depan',
  ];

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-screen)]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-bg-neutral)] flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5" style={{ color: 'var(--color-brand-primary)' }} />
          <h1 className="text-lg font-semibold text-[var(--color-content-primary)]">
            Asisten AI
          </h1>
        </div>
        <p className="text-xs text-[var(--color-content-tertiary)]">
          Tanyakan apa saja tentang keuanganmu
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="w-12 h-12 mb-3 text-[var(--color-content-tertiary)] opacity-50" />
            <p className="text-sm text-[var(--color-content-tertiary)]">
              Mulai percakapan dengan tanyakan tentang keuanganmu
            </p>

            {/* Quick Prompts */}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              <p className="text-xs text-[var(--color-content-tertiary)] mb-2">Coba pertanyaan:</p>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    'bg-[var(--color-bg-card)] text-[var(--color-content-primary)]',
                    'border border-[var(--color-bg-neutral)]',
                    'hover:bg-[var(--color-bg-card-hover)]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <div className="bg-[var(--color-sentiment-negative-bg)] text-[var(--color-sentiment-negative)] rounded-lg p-3 text-sm">
                {error.message}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Actions & Input Area */}
      <div className="flex-shrink-0 bg-[var(--color-bg-screen)]">
        {!isEmpty && suggestedActions.length > 0 && (
          <SuggestedActions
            actions={suggestedActions}
            onActionClick={handleSuggestedActionClick}
            isLoading={isLoading}
          />
        )}
        <div className="border-t border-[var(--color-bg-neutral)]">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Tanya sesuatu..."
          />
        </div>
      </div>
    </div>
  );
}
