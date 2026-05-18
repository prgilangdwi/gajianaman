import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';

export default function Asisten() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { transactions = [] } = useTransactions(month, year);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'Ringkasan bulan ini',
    'Kategori terboros',
    'Tips hemat bulan depan',
  ];

  const handleAsk = async (question: string) => {
    if (!question.trim() || !user) return;

    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          question,
          month,
          year,
          transactions: transactions.map(t => ({
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setResponse(data.response || data.answer || '');
    } catch (error) {
      setResponse('Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Coba lagi nanti.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-amber-500" />
          Tanya Asisten AI
        </h1>
        <p className="text-muted-foreground">Tanyakan apa saja tentang keuanganmu</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: kenapa pengeluaranku naik bulan ini?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk(input)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              onClick={() => handleAsk(input)}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Send className="w-4 h-4" />
              )}
              Tanya
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAsk(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Response Area */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jawaban</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{response}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!response && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">Tanyakan apa saja tentang keuanganmu untuk mendapatkan wawasan.</p>
        </div>
      )}
    </div>
  );
}
