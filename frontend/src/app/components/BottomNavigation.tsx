import { Link } from 'react-router';
import { motion } from 'motion/react';
import { NAV_SECTIONS } from '@/lib/navigationConfig';
import { useNavigation } from '@/hooks/useNavigation';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface BottomNavigationProps {
  badges?: Record<string, number>; // sectionId → badge count
}

export function BottomNavigation({
  badges = {},
}: BottomNavigationProps) {
  const { activeSection, navigateToSection, getActiveTab } = useNavigation();
  const prefersReduced = useReducedMotion();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-elevated)]/60"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {NAV_SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;
          const badgeCount = badges[section.id] ?? 0;
          const targetPath = getActiveTab(section.id) || section.path;

          return (
            <Link
              key={section.id}
              to={targetPath}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
                'min-w-[56px] min-h-[56px]', // 56px touch target
                'transition-colors duration-[var(--duration-fast)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]',
                isActive
                  ? 'text-[var(--color-brand-primary)]'
                  : 'text-[var(--color-content-tertiary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${section.labelId} — ${section.label}`}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {/* Active indicator dot */}
                {isActive && !prefersReduced && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-brand-primary)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {/* Badge */}
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[var(--color-sentiment-negative)] text-white text-[10px] font-bold"
                    aria-label={`${badgeCount} notifikasi`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight',
                  isActive && 'font-semibold'
                )}
              >
                {section.labelId}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
