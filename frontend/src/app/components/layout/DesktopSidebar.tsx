import { Link, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NAV_SECTIONS, type NavSection } from '@/lib/navigationConfig';
import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/hooks/useAuth';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';

interface DesktopSidebarProps {
  isRailMode?: boolean; // true for tablet (icon-only 60px rail)
}

export function DesktopSidebar({ isRailMode = false }: DesktopSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeSection } = useNavigation();
  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  const sidebarWidth = isRailMode ? 'w-[60px]' : 'w-[200px]';

  return (
    <aside
      className={cn(
        'hidden md:fixed md:inset-y-0 md:flex md:flex-col',
        sidebarWidth,
        'bg-[var(--color-bg-screen)] overflow-hidden transition-[width] duration-[var(--duration-normal)]'
      )}
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn('shrink-0 px-4 py-6', isRailMode && 'px-2 py-4')}>
          <div className={cn('flex items-center', isRailMode ? 'justify-center' : 'gap-3 px-2')}>
            {/* Logo */}
            <div className={cn(
              'flex items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-primary-dark)]',
              isRailMode ? 'w-8 h-8' : 'w-9 h-9'
            )}>
              <span className="font-extrabold text-white text-xs">GA</span>
            </div>
            {!isRailMode && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-extrabold tracking-tight text-[var(--color-content-primary)] truncate">
                  Gajian Aman
                </h1>
                <p className="text-[10px] text-[var(--color-content-tertiary)]">
                  Safe Paycheck
                </p>
              </div>
            )}
          </div>

          {/* User avatar (compact in rail mode) */}
          {!isRailMode && (
            <div className="flex items-center gap-2 p-2 mt-4 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)]">
              <Avatar className="h-7 w-7">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-content-primary)] truncate font-medium">
                  {user?.name ?? 'User'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1">
          {NAV_SECTIONS.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isActive={activeSection === section.id}
              currentPath={location.pathname}
              isRailMode={isRailMode}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('shrink-0 border-t border-[var(--color-border-neutral)] p-2', isRailMode && 'p-1')}>
          {!isRailMode && (
            <p className="text-[10px] text-[var(--color-content-tertiary)] text-center mb-2">
              Powered by Claude · Supabase
            </p>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              'w-full text-[var(--color-content-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-content-primary)]',
              isRailMode ? 'justify-center p-2' : 'justify-start text-xs'
            )}
            aria-label="Logout"
          >
            <LogOut className={cn('w-4 h-4', !isRailMode && 'mr-2')} />
            {!isRailMode && 'Logout'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

// ── Individual Sidebar Section ──
function SidebarSection({
  section,
  isActive,
  currentPath,
  isRailMode,
}: {
  section: NavSection;
  isActive: boolean;
  currentPath: string;
  isRailMode: boolean;
}) {
  const Icon = section.icon;

  return (
    <div className="space-y-0.5">
      {/* Section Header / Primary Nav Item */}
      <Link
        to={section.children[0]?.path ?? section.path}
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-md)] transition-colors relative group',
          isRailMode ? 'justify-center p-2' : 'px-3 py-2',
          isActive
            ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
            : 'text-[var(--color-content-tertiary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-content-secondary)]'
        )}
        aria-current={isActive ? 'true' : undefined}
      >
        <Icon className="w-4.5 h-4.5 shrink-0" />
        {!isRailMode && (
          <span className="text-sm font-semibold truncate">{section.labelId}</span>
        )}
        {/* Rail mode tooltip */}
        {isRailMode && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-content-primary)] text-white text-xs rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {section.labelId}
          </div>
        )}
      </Link>

      {/* Sub-navigation (only shown when section is active and not in rail mode) */}
      {isActive && !isRailMode && section.children.length > 1 && (
        <AnimatePresence>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-2 pl-3 border-l border-[var(--color-border-neutral)]"
          >
            {section.children.map((child) => {
              const isChildActive = currentPath === child.path;
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.id}
                  to={child.path}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors',
                    isChildActive
                      ? 'text-[var(--color-brand-primary)] font-semibold'
                      : 'text-[var(--color-content-tertiary)] hover:text-[var(--color-content-secondary)]'
                  )}
                >
                  <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{child.labelId}</span>
                </Link>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
