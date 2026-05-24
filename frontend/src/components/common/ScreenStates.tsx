import * as React from 'react';
import { CardBase } from '@/components/ui/CardBase';
import { ButtonBase } from '@/components/ui/ButtonBase';

/**
 * LoadingState - Shows a skeleton or spinner while data is being fetched
 */
export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Memuat data...',
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="flex flex-col items-center gap-4">
        <svg
 className="animate-spin size-8 text-[var(--color-brand-primary)]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm text-[var(--color-content-secondary)]">{message}</p>
      </div>
    </div>
  );
};

LoadingState.displayName = 'LoadingState';

/**
 * ErrorState - Shows when an error occurs (failed data fetch, API error, etc.)
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Terjadi Kesalahan',
  message = 'Tidak dapat memuat data. Silakan coba lagi nanti.',
  onRetry,
  showRetryButton = !!onRetry,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <CardBase variant="elevated" padding="lg" className="max-w-md w-full">
        <div className="flex flex-col gap-6">
          {/* Error Icon */}
          <div className="flex justify-center">
 <div className="flex items-center justify-center size-12 rounded-full bg-[var(--color-sentiment-negative-bg)]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--color-sentiment-negative)]"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="flex flex-col gap-2 text-center">
            <h3 className="text-base font-semibold text-[var(--color-content-primary)]">
              {title}
            </h3>
            <p className="text-sm text-[var(--color-content-secondary)]">{message}</p>
          </div>

          {/* Retry Button */}
          {showRetryButton && onRetry && (
            <ButtonBase variant="primary" size="default" onClick={onRetry} className="w-full">
              Coba Lagi
            </ButtonBase>
          )}
        </div>
      </CardBase>
    </div>
  );
};

ErrorState.displayName = 'ErrorState';

/**
 * EmptyState - Shows when no data is available (empty list, no results, etc.)
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Tidak Ada Data',
  message = 'Mulai dengan menambahkan item pertama Anda.',
  icon,
  action,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        {/* Icon */}
        {icon ? (
          <div className="flex justify-center">{icon}</div>
        ) : (
 <div className="flex items-center justify-center size-12 rounded-full bg-[var(--color-bg-neutral)]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[var(--color-content-tertiary)]"
            >
              <path
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-2.96-3.83c-.3-.39-.95-.39-1.25 0-.31.39-.31 1.02 0 1.41l3.54 4.58c.3.39.95.39 1.25 0l4.04-5.37c.31-.39.31-1.02 0-1.41-.31-.39-.95-.39-1.25 0l-3.38 4.38z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}

        {/* Message */}
        <div className="flex flex-col gap-2 text-center">
          <h3 className="text-base font-semibold text-[var(--color-content-primary)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--color-content-secondary)]">{message}</p>
        </div>

        {/* Action Button */}
        {action && (
          <ButtonBase variant="primary" size="default" onClick={action.onClick} className="w-full">
            {action.label}
          </ButtonBase>
        )}
      </div>
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
