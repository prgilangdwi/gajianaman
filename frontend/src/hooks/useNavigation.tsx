import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  getActiveSectionFromPath,
  NAV_SECTIONS,
} from '@/lib/navigationConfig';

interface NavigationState {
  activeSection: string;
  activeTabs: Record<string, string>; // sectionId → last active child path
}

interface NavigationContextValue {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
  getActiveTab: (sectionId: string) => string;
  setActiveTab: (sectionId: string, childPath: string) => void;
  navigateToSection: (sectionId: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const STORAGE_KEY = 'gajian-aman-nav-state';

function loadPersistedState(): NavigationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Silently ignore parse errors
  }
  // Default: first child of each section
  const activeTabs: Record<string, string> = {};
  NAV_SECTIONS.forEach((s) => {
    if (s.children.length > 0) {
      activeTabs[s.id] = s.children[0].path;
    }
  });
  return { activeSection: 'home', activeTabs };
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<NavigationState>(loadPersistedState);

  // Sync active section from URL on navigation
  useEffect(() => {
    const sectionId = getActiveSectionFromPath(location.pathname);
    setState((prev) => {
      const newTabs = { ...prev.activeTabs };
      // Update the active tab for this section to current path
      const section = NAV_SECTIONS.find((s) => s.id === sectionId);
      if (section) {
        const matchingChild = section.children.find(
          (c) => location.pathname === c.path
        );
        if (matchingChild) {
          newTabs[sectionId] = matchingChild.path;
        }
      }
      return { activeSection: sectionId, activeTabs: newTabs };
    });
  }, [location.pathname]);

  // Persist to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setActiveSection = useCallback((sectionId: string) => {
    setState((prev) => ({ ...prev, activeSection: sectionId }));
  }, []);

  const getActiveTab = useCallback(
    (sectionId: string): string => {
      return (
        state.activeTabs[sectionId] ??
        NAV_SECTIONS.find((s) => s.id === sectionId)?.children[0]?.path ??
        ''
      );
    },
    [state.activeTabs]
  );

  const setActiveTab = useCallback((sectionId: string, childPath: string) => {
    setState((prev) => ({
      ...prev,
      activeTabs: { ...prev.activeTabs, [sectionId]: childPath },
    }));
  }, []);

  const navigateToSection = useCallback(
    (sectionId: string) => {
      const lastTab = state.activeTabs[sectionId];
      const section = NAV_SECTIONS.find((s) => s.id === sectionId);
      const target =
        lastTab ?? section?.children[0]?.path ?? section?.path ?? '/home';
      navigate(target);
    },
    [navigate, state.activeTabs]
  );

  return (
    <NavigationContext.Provider
      value={{
        activeSection: state.activeSection,
        setActiveSection,
        getActiveTab,
        setActiveTab,
        navigateToSection,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx)
    throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
