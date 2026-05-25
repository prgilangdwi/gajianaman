import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Tanya sesuatu...',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, but Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4 bg-[var(--color-bg-screen)] border-t border-[var(--color-bg-neutral)]"
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 px-4 py-2 rounded-lg resize-none',
          'bg-[var(--color-bg-card)] text-[var(--color-content-primary)]',
          'border border-[var(--color-bg-neutral)]',
          'placeholder:text-[var(--color-content-tertiary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'text-sm font-sans'
        )}
        aria-label="Message input"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className={cn(
          'px-4 py-2 rounded-lg font-medium text-sm',
          'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)]',
          'hover:bg-[var(--color-brand-primary-dark)] transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary-dark)]'
        )}
        aria-label="Send message"
      >
        Kirim
      </button>
    </form>
  );
}
