import { ReactNode } from 'react';
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

// Simple markdown parser for common formatting without external dependencies
function parseMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Regex patterns for markdown: bold, italic, code, links
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, element: 'strong' },
    { regex: /\*(.+?)\*/g, element: 'em' },
    { regex: /`(.+?)`/g, element: 'code' },
    { regex: /\[(.+?)\]\((.+?)\)/g, element: 'link' },
  ];

  // Process links first (highest priority due to complexity)
  let processedText = text;
  const linkMatches = Array.from(text.matchAll(/\[(.+?)\]\((.+?)\)/g));

  if (linkMatches.length > 0) {
    let result = '';
    let index = 0;

    linkMatches.forEach((match) => {
      result += processedText.slice(index, match.index);
      result += `<a href="${match[2]}" target="_blank" rel="noopener noreferrer" class="underline text-[var(--color-content-link)]">${match[1]}</a>`;
      index = match.index! + match[0].length;
    });

    result += processedText.slice(index);
    processedText = result;
  }

  // Split by newlines first for paragraph breaks
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lineIdx) => {
        const parts: ReactNode[] = [];
        let lastIdx = 0;

        // Match bold: **text**
        const boldMatches = Array.from(line.matchAll(/\*\*(.+?)\*\*/g));
        boldMatches.forEach((match) => {
          if (match.index !== undefined) {
            parts.push(line.slice(lastIdx, match.index));
            parts.push(
              <strong key={`bold-${lineIdx}-${match.index}`}>
                {match[1]}
              </strong>
            );
            lastIdx = match.index + match[0].length;
          }
        });

        // Match italic: *text* (but not **)
        let remaining = line.slice(lastIdx);
        const italicMatches = Array.from(
          remaining.matchAll(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g)
        );

        if (italicMatches.length > 0) {
          let subLastIdx = 0;
          italicMatches.forEach((match) => {
            if (match.index !== undefined) {
              parts.push(remaining.slice(subLastIdx, match.index));
              parts.push(
                <em key={`italic-${lineIdx}-${match.index}`}>
                  {match[1]}
                </em>
              );
              subLastIdx = match.index + match[0].length;
            }
          });
          parts.push(remaining.slice(subLastIdx));
        } else {
          // Match code: `text`
          const codeMatches = Array.from(remaining.matchAll(/`(.+?)`/g));
          if (codeMatches.length > 0) {
            subLastIdx = 0;
            codeMatches.forEach((match) => {
              if (match.index !== undefined) {
                parts.push(remaining.slice(subLastIdx, match.index));
                parts.push(
                  <code
                    key={`code-${lineIdx}-${match.index}`}
                    className="bg-[var(--color-bg-neutral)] px-1.5 py-0.5 rounded text-xs font-mono"
                  >
                    {match[1]}
                  </code>
                );
                subLastIdx = match.index + match[0].length;
              }
            });
            parts.push(remaining.slice(subLastIdx));
          } else {
            parts.push(remaining);
          }
        }

        return (
          <div key={`line-${lineIdx}`} className="break-words">
            {parts}
          </div>
        );
      })}
    </>
  );
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const renderedContent =
    !isUser && message.content ? parseMarkdown(message.content) : message.content;

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
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderedContent}
        </div>
        <p
          className={cn(
            'text-xs mt-1 opacity-60',
            isUser
              ? 'text-[var(--color-brand-primary-fg)]'
              : 'text-[var(--color-content-tertiary)]'
          )}
        >
          {(message.timestamp instanceof Date
            ? message.timestamp
            : new Date(message.timestamp as unknown as string)
          ).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
