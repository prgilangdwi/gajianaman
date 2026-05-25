import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Eye, EyeOff, Bell, SlidersHorizontal, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useDompetFilter } from '@/hooks/useDompetFilter';
import { cn, textColorVar, bgColorVar } from '@/lib/utils';
import { NAV_SECTIONS, getActiveSectionFromPath } from '@/lib/navigationConfig';
import { useLocation } from 'react-router';

interface HeaderBarProps {
  variant: 'mobile' | 'desktop';
  onOpenFilters?: () => void;
  pageTitle?: string;
}

export function HeaderBar({ variant, onOpenFilters, pageTitle }: HeaderBarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const { wallets = [] } = useWallets(user?.userId);
  const { selectedDompet, setDompet } = useDompetFilter();

  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  // Derive page title from current route
  const derivedTitle = pageTitle ?? (() => {
    const sectionId = getActiveSectionFromPath(location.pathname);
    const section = NAV_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return 'Beranda';
    const child = section.children.find((c) => location.pathname === c.path);
    return child?.labelId ?? section.labelId;
  })();

  if (variant === 'mobile') {
    return (
      <header className="lg:hidden sticky top-0 z-40 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60" role="banner">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="font-semibold tracking-tight text-sm text-[var(--color-content-primary)] truncate">
              {derivedTitle}
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpenFilters && (
              <Button
                variant="ghost"
                size="icon"
 className="size-8 "
                onClick={onOpenFilters}
                aria-label="Buka filter"
              >
 <SlidersHorizontal className="size-4 " />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
 className="size-8 "
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              aria-label={isPrivacyMode ? 'Tampilkan jumlah' : 'Sembunyikan jumlah'}
            >
 {isPrivacyMode ? <EyeOff className="size-4 " /> : <Eye className="size-4 " />}
            </Button>
 <Avatar className="size-7 ">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
    );
  }

  // Desktop header
  return (
    <header
      className="hidden lg:block sticky top-0 z-30 w-full border-b border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60"
      role="banner"
    >
      <div className="flex h-14 items-center justify-between px-6">
        <h1 className="font-semibold text-base text-[var(--color-content-primary)]">{derivedTitle}</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedDompet || 'all'}
            onChange={(e) => setDompet(e.target.value === 'all' ? null : e.target.value)}
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-xs font-medium text-[var(--color-content-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            aria-label="Filter dompet"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}{w.is_primary ? ' ⭐' : ''}</option>
            ))}
          </select>
          <select
            value="current-month"
            className="px-2.5 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-xs font-medium text-[var(--color-content-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
            aria-label="Filter bulan"
          >
            <option value="current-month">This Month</option>
            <option value="last-month">Last Month</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            aria-label={isPrivacyMode ? 'Tampilkan jumlah' : 'Sembunyikan jumlah'}
 className="size-8 "
          >
 {isPrivacyMode ? <EyeOff className="size-4 " /> : <Eye className="size-4 " />}
          </Button>
 <Button variant="ghost" size="icon" aria-label="Notifikasi" className="size-8 ">
 <Bell className="size-4 " />
          </Button>
          <Link to="/settings">
 <Button variant="ghost" size="icon" aria-label="Pengaturan" className="size-8 ">
 <Settings className="size-4 " />
            </Button>
          </Link>
 <Avatar className="size-8 ">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={user?.name} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
