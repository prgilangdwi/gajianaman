// frontend/src/hooks/data/useAIInsights.ts
// Hook to fetch personalized AI insights from the backend API

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface AIInsight {
  emoji: string;
  title: string;
  body: string;
  severity: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
}

interface UseAIInsightsReturn {
  insights: AIInsight[];
  loading: boolean;
  error: Error | null;
}

export function useAIInsights(
  month: number,
  year: number
): UseAIInsightsReturn {
  const { user, session } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.userId || !session?.access_token) {
      setInsights([]);
      setLoading(false);
      return;
    }

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/insights?month=${month}&year=${year}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch insights: ${response.status}`);
        }

        const data: AIInsight[] = await response.json();
        setInsights(Array.isArray(data) ? data : []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error fetching insights');
        setError(error);
        console.error('Insights fetch error:', error);
        // Don't throw — gracefully degrade to empty insights
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [user?.userId, session?.access_token, month, year]);

  return { insights, loading, error };
}
