import {
  Home,
  Wallet2,
  BarChart3,
  Wrench,
  Sparkles,
  TrendingDown,
  Target,
  Star,
  FileText,
  TrendingUp,
  LineChart,
  Wallet,
  Repeat2,
  Users,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Primary Navigation (Bottom Nav + Sidebar top-level) ──
export interface NavSection {
  id: string;
  label: string;
  labelId: string; // Indonesian label
  icon: LucideIcon;
  path: string; // Default route for this section
  children: NavChild[];
}

export interface NavChild {
  id: string;
  label: string;
  labelId: string;
  icon: LucideIcon;
  path: string;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    labelId: 'Beranda',
    icon: Home,
    path: '/home',
    children: [
      {
        id: 'overview',
        label: 'Overview',
        labelId: 'Ikhtisar',
        icon: Home,
        path: '/home/overview',
      },
    ],
  },
  {
    id: 'spend',
    label: 'Spend',
    labelId: 'Belanja',
    icon: Wallet2,
    path: '/spend',
    children: [
      {
        id: 'spending',
        label: 'Spending',
        labelId: 'Pengeluaran',
        icon: TrendingDown,
        path: '/spend/spending',
      },
      {
        id: 'budget',
        label: 'Budget',
        labelId: 'Anggaran',
        icon: Target,
        path: '/spend/budget',
      },
      {
        id: 'goals',
        label: 'Goals',
        labelId: 'Tujuan',
        icon: Star,
        path: '/spend/goals',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    labelId: 'Analitik',
    icon: BarChart3,
    path: '/analytics',
    children: [
      {
        id: 'laporan',
        label: 'Reports',
        labelId: 'Laporan',
        icon: FileText,
        path: '/analytics/laporan',
      },
      {
        id: 'tren',
        label: 'Trends',
        labelId: 'Tren',
        icon: TrendingUp,
        path: '/analytics/tren',
      },
      {
        id: 'forecasting',
        label: 'Forecast',
        labelId: 'Prakiraan',
        icon: LineChart,
        path: '/analytics/forecasting',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    labelId: 'Alat',
    icon: Wrench,
    path: '/tools',
    children: [
      {
        id: 'wallets',
        label: 'Wallets',
        labelId: 'Dompet',
        icon: Wallet,
        path: '/tools/wallets',
      },
      {
        id: 'recurring',
        label: 'Recurring',
        labelId: 'Tagihan',
        icon: Repeat2,
        path: '/tools/recurring',
      },
      {
        id: 'split',
        label: 'Split Bill',
        labelId: 'Patungan',
        icon: Users,
        path: '/tools/split',
      },
      {
        id: 'categories',
        label: 'Categories',
        labelId: 'Kategori',
        icon: Layers,
        path: '/tools/categories',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    labelId: 'AI',
    icon: Sparkles,
    path: '/ai',
    children: [
      {
        id: 'chat',
        label: 'Chat',
        labelId: 'Asisten',
        icon: Sparkles,
        path: '/ai/chat',
      },
    ],
  },
];

// ── Route Redirects (old path → new path) ──
export const ROUTE_REDIRECTS: Record<string, string> = {
  '/overview': '/home/overview',
  '/pengeluaran': '/spend/spending',
  '/pemasukan': '/spend/spending', // Merged into spending view
  '/budget': '/spend/budget',
  '/goals': '/spend/goals',
  '/goal-progress': '/spend/goals',
  '/riwayat': '/home/overview', // Now accessible via filter in Overview
  '/laporan': '/analytics/laporan',
  '/monthly-report': '/analytics/laporan',
  '/tren': '/analytics/tren',
  '/forecasting': '/analytics/forecasting',
  '/spending-patterns': '/analytics/tren',
  '/categories': '/tools/categories',
  '/wallet': '/tools/wallets',
  '/recurring': '/tools/recurring',
  '/split': '/tools/split',
  '/kalender': '/home/overview',
  '/asisten': '/ai/chat',
  '/smart-alerts': '/home/overview',
  '/gajian': '/home/overview',
};

// ── Helper: Find active section from pathname ──
export function getActiveSectionFromPath(pathname: string): string {
  const section = NAV_SECTIONS.find((s) => pathname.startsWith(s.path));
  return section?.id ?? 'home';
}

// ── Helper: Find active child from pathname ──
export function getActiveChildFromPath(pathname: string): string | null {
  for (const section of NAV_SECTIONS) {
    const child = section.children.find((c) => pathname === c.path);
    if (child) return child.id;
  }
  return null;
}

// ── Badge configuration (section → badge source) ──
export interface BadgeConfig {
  sectionId: string;
  type: 'count' | 'dot';
}
