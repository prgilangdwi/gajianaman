import { Link, useLocation } from 'react-router';
import { NAV_SECTIONS, getActiveSectionFromPath } from '@/lib/navigationConfig';
import { cn } from '@/lib/utils';

export function SectionTabBar() {
  const location = useLocation();
  const sectionId = getActiveSectionFromPath(location.pathname);
  const section = NAV_SECTIONS.find((s) => s.id === sectionId);

  // Don't render tab bar if section has 0 or 1 children
  if (!section || section.children.length <= 1) return null;

  return (
    <div className="sticky top-14 lg:top-[57px] z-20 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-neutral)]">
      <div className="flex overflow-x-auto no-scrollbar px-3 lg:px-6">
        {section.children.map((child) => {
          const isActive = location.pathname === child.path;
          return (
            <Link
              key={child.id}
              to={child.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                  : 'border-transparent text-[var(--color-content-tertiary)] hover:text-[var(--color-content-secondary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {child.labelId}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
