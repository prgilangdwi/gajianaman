import { Plus, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface QuickActionsProps {
  onAddTransaction: () => void;
}

export function QuickActions({ onAddTransaction }: QuickActionsProps) {
  const actions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: 'Tambah',
      onClick: onAddTransaction,
      primary: true,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Laporan',
      to: '/analytics/laporan',
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'AI Chat',
      to: '/ai/chat',
    },
  ];

  return (
    <div className="flex gap-2" role="group" aria-label="Aksi cepat">
      {actions.map((action, i) => {
        const classes = cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors',
          'border',
          action.primary
            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] border-transparent'
            : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)] hover:bg-[var(--color-bg-card-hover)]',
        );

        if (action.to) {
          return (
            <Link key={i} to={action.to} className={classes}>
              {action.icon}
              {action.label}
            </Link>
          );
        }
        return (
          <button type="button" key={i} onClick={action.onClick} className={classes}>
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
