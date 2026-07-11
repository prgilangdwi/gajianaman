<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import {
		setSidebarContext,
		setSidebarCookie,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
		SIDEBAR_KEYBOARD_SHORTCUT,
		type SidebarState
	} from './sidebar-context.svelte';

	type Props = {
		class?: string;
		defaultOpen?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
		[key: string]: unknown;
	};

	let {
		class: className,
		defaultOpen = true,
		open: openProp,
		onOpenChange,
		children,
		...restProps
	}: Props = $props();

	let isMobile = $state(false);
	let openMobile = $state(false);
	let internalOpen = $state(defaultOpen);

	const open = $derived(openProp ?? internalOpen);
	const state: SidebarState = $derived(open ? 'expanded' : 'collapsed');

	function setOpen(value: boolean) {
		if (onOpenChange) {
			onOpenChange(value);
		} else {
			internalOpen = value;
		}
		setSidebarCookie(value);
	}

	function setOpenMobile(value: boolean) {
		openMobile = value;
	}

	function toggleSidebar() {
		if (isMobile) {
			openMobile = !openMobile;
		} else {
			setOpen(!open);
		}
	}

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				toggleSidebar();
			}
		};
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	setSidebarContext({
		get state() {
			return state;
		},
		get open() {
			return open;
		},
		setOpen,
		get openMobile() {
			return openMobile;
		},
		setOpenMobile,
		get isMobile() {
			return isMobile;
		},
		toggleSidebar
	});
</script>

<div
	data-slot="sidebar-wrapper"
	style:--sidebar-width={SIDEBAR_WIDTH}
	style:--sidebar-width-icon={SIDEBAR_WIDTH_ICON}
	class={cn('group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
