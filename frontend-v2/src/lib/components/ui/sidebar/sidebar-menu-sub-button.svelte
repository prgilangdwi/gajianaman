<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		size?: 'sm' | 'md';
		isActive?: boolean;
		href?: string;
		children?: Snippet;
		[key: string]: unknown;
	};

	let { class: className, size = 'md', isActive = false, href, children, ...restProps }: Props = $props();

	const baseClass = cn(
		'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-xl px-3 text-sidebar-foreground ring-sidebar-ring outline-hidden',
		'group-data-[collapsible=icon]:hidden',
		'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
		'focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground',
		'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
		'[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
		size === 'sm' ? 'text-xs' : 'text-sm',
		isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
		className
	);
</script>

{#if href}
	<a {href} data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size={size} data-active={isActive} class={baseClass} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size={size} data-active={isActive} class={baseClass} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
