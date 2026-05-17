import { Link } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut } from 'lucide-react';
import { GajianAmanMark } from './GajianAmanMark';

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

interface MobileNavProps {
  navItems: NavItem[];
  currentPath: string;
  onNavigate: () => void;
  user: { name?: string; userId?: string } | null;
  onLogout: () => void;
}

export function MobileNav({
  navItems,
  currentPath,
  onNavigate,
  user,
  onLogout,
}: MobileNavProps) {
  const userInitials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const avatarSeed = user?.name ?? 'user';

  // Group nav items into sections
  const sections = {
    primary: navItems.slice(0, 4),     // Overview, Pengeluaran, Budget, Goals
    tools: navItems.slice(4, 8),       // Riwayat, Tren, Kalender, SplitBill
    account: navItems.slice(8, 11),    // Gajian, Dompet, Langganan
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <GajianAmanMark className="w-10 h-10" />
          <div className="flex flex-col">
            <h1 className="font-extrabold tracking-tight text-sidebar-foreground">Gajian Aman</h1>
            <p className="text-xs text-sidebar-foreground/60 font-body">Safe Paycheck</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/30">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm text-sidebar-foreground truncate">Halo, {user?.name ?? 'User'} 👋</p>
            <p className="text-xs text-sidebar-foreground/60">ID: {user?.userId}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-6">
        {/* Primary Section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-sidebar-foreground/50 px-2 py-1">MAIN</p>
          {sections.primary.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-sidebar-foreground/50 px-2 py-1">TOOLS</p>
          {sections.tools.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Account Section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-sidebar-foreground/50 px-2 py-1">ACCOUNT</p>
          {sections.account.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-6 flex-shrink-0 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          Powered by Claude · Supabase
        </p>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground text-sm"
        >
          <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
          Logout
        </Button>
      </div>
    </div>
  );
}
