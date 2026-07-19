import { getContext, setContext } from 'svelte';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
export const SIDEBAR_WIDTH_ICON = '3rem';
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

export type SidebarState = 'expanded' | 'collapsed';

export type SidebarContext = {
	state: SidebarState;
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SIDEBAR_CONTEXT_KEY = Symbol('sidebar');

export function setSidebarContext(ctx: SidebarContext) {
	setContext(SIDEBAR_CONTEXT_KEY, ctx);
}

export function useSidebar(): SidebarContext {
	const ctx = getContext<SidebarContext | undefined>(SIDEBAR_CONTEXT_KEY);
	if (!ctx) {
		throw new Error('useSidebar must be used within a SidebarProvider.');
	}
	return ctx;
}

export function setSidebarCookie(open: boolean) {
	if (typeof document !== 'undefined') {
		document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
	}
}
