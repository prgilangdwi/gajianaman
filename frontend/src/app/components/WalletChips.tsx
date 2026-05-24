import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { Wallet } from '@/lib/supabase';

interface WalletChipsProps {
  wallets: Wallet[];
  walletId: string;
  setWalletId: (id: string) => void;
}

export function WalletChips({ wallets, walletId, setWalletId }: WalletChipsProps) {
  if (wallets.length === 0) return null;

  const chips = [
    { id: 'all', label: 'Semua' },
    ...wallets.map(w => ({ id: w.id, label: `${w.name}${w.is_primary ? ' ⭐' : ''}` }))
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 pb-2">
        {chips.map((chip) => (
          <button
            type="button"
            key={chip.id}
            onClick={() => setWalletId(chip.id)}
            className={cn(
              'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border',
              walletId === chip.id
                ? cn(bgColorVar('brand-primary'), textColorVar('brand-primary-fg'), borderColorVar('brand-primary'))
                : cn(borderColorVar('border-neutral'), textColorVar('content-secondary'), 'hover:border-[var(--color-brand-primary)]')
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
