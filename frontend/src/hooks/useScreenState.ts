/**
 * Hook to manage screen states: loading, error, empty, loaded
 * Provides consistent state handling pattern across all pages
 */

interface ScreenState {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  isLoaded: boolean;
}

interface UseScreenStateOptions {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  dataCount?: number;
}

export function useScreenState({
  isLoading,
  error = null,
  isEmpty = false,
  dataCount = 0,
}: UseScreenStateOptions): ScreenState {
  // Determine if screen should show empty state
  const shouldShowEmpty = !isLoading && !error && (isEmpty || dataCount === 0);

  return {
    isLoading,
    error: error || null,
    isEmpty: shouldShowEmpty,
    isLoaded: !isLoading && !error && !shouldShowEmpty,
  };
}
