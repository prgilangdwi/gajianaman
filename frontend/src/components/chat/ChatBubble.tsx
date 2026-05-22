import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn('flex w-full mb-4 gap-3', isUser && 'justify-end')}
      role="article"
      aria-label={`${isUser ? 'User' : 'Assistant'} message: ${message.content}`}
    >
      <div
        className={cn(
          'px-4 py-3 rounded-2xl max-w-xs break-words',
          isUser
            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)]'
            : 'bg-[var(--color-bg-card)] text-[var(--color-content-primary)] border border-[var(--color-bg-neutral)]'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={cn(
            'text-xs mt-1 opacity-60',
            isUser
              ? 'text-[var(--color-brand-primary-fg)]'
              : 'text-[var(--color-content-tertiary)]'
          )}
        >
          {message.timestamp.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
